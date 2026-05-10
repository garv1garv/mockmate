from fastapi import APIRouter
from pydantic import BaseModel
from typing import Optional, List
import re
import math

from app.services.ai_provider import ai_evaluate_answer

router = APIRouter()


class EvaluateAnswerRequest(BaseModel):
    question: str
    user_answer: str
    expected_answer: str
    answer_type: Optional[str] = "text"
    keywords: Optional[List[str]] = []
    ai_settings: Optional[dict] = {}


class EvaluateAnswerResponse(BaseModel):
    scores: dict
    feedback: str
    suggestions: List[str]
    keywords_matched: int
    missed_keywords: List[str]
    detailed_analysis: dict


def compute_semantic_similarity(text1: str, text2: str) -> float:
    """TF-IDF cosine similarity — fallback when sentence-transformers unavailable."""
    def get_tf(text):
        words = re.findall(r'\w+', text.lower())
        freq: dict = {}
        for w in words:
            freq[w] = freq.get(w, 0) + 1
        total = len(words) or 1
        return {w: c / total for w, c in freq.items()}

    tf1, tf2 = get_tf(text1), get_tf(text2)
    common = set(tf1) & set(tf2)
    if not common:
        return 0.0
    dot = sum(tf1[w] * tf2[w] for w in common)
    mag1 = math.sqrt(sum(v ** 2 for v in tf1.values()))
    mag2 = math.sqrt(sum(v ** 2 for v in tf2.values()))
    return 0.0 if mag1 * mag2 == 0 else dot / (mag1 * mag2)


def check_keywords(user_answer: str, keywords: List[str]) -> tuple:
    matched = []
    missed = []
    lower_answer = user_answer.lower()
    for kw in keywords:
        # Use regex to find whole word matches only, avoiding partial substring hits
        pattern = r'\b' + re.escape(kw.lower()) + r'\b'
        if re.search(pattern, lower_answer):
            matched.append(kw)
        else:
            missed.append(kw)
    return matched, missed


def analyze_clarity(text: str) -> float:
    """Score clarity: sentence length, structural markers, completeness."""
    sentences = [s.strip() for s in re.split(r'[.!?]+', text) if s.strip()]
    if not sentences:
        return 0.0
    avg_len = sum(len(s.split()) for s in sentences) / len(sentences)
    length_score = max(0.0, 1 - abs(avg_len - 15) / 15)
    has_structure = any(m in text.lower() for m in [
        'first', 'second', 'finally', 'however', 'therefore',
        'for example', 'such as', 'because',
    ])
    completeness = min(1.0, len(text.split()) / 100)
    return min(100.0, length_score * 40 + (20 if has_structure else 0) + completeness * 40)


def generate_feedback(scores: dict, question: str, answer_type: str) -> str:
    overall = scores['overall']
    if overall >= 85:
        return (
            f"Excellent! Your answer is technically precise and covers the nuances required for this topic. "
            f"You correctly identified {scores['semantic']}% of the core concepts. "
            f"Pro-Tip: You've mastered this; try to focus on how this integrates with broader system contexts."
        )
    elif overall >= 70:
        return (
            f"Solid answer, but slightly incomplete. You missed a few key details "
            f"regarding factual accuracy ({scores['factual']}%). To reach the next level, "
            f"be more specific about the trade-offs or edge cases mentioned in the ideal answer."
        )
    elif overall >= 50:
        return (
            f"Good start, but you're missing about half of the technical depth required. "
            f"Your clarity is decent ({scores['clarity']}%), but the factual content needs work. "
            f"Focus on using more precise industry terminology to sound more authoritative."
        )
    return (
        "This answer is too brief or misses the core concept. To improve, try to explain "
        "the 'How' and 'Why' behind your logic, not just the 'What'. Review the keywords provided "
        "and try again."
    )


@router.post("/evaluate-answer", response_model=EvaluateAnswerResponse)
async def evaluate_answer(request: EvaluateAnswerRequest):
    """Multi-dimensional evaluation — rule-based scoring + AI-powered personalised feedback."""

    # ── Semantic similarity ──────────────────────────────────────────────────
    try:
        from sentence_transformers import SentenceTransformer
        import numpy as np
        _model = SentenceTransformer('all-MiniLM-L6-v2')
        embs = _model.encode([request.user_answer, request.expected_answer])
        cos_sim = float(np.dot(embs[0], embs[1]) /
                        (np.linalg.norm(embs[0]) * np.linalg.norm(embs[1])))
        semantic_score = min(100, round(cos_sim * 100 * 1.2))
    except Exception:
        cos_sim = compute_semantic_similarity(request.user_answer, request.expected_answer)
        semantic_score = min(100, round(cos_sim * 100 * 1.5))

    # ── Keyword analysis ─────────────────────────────────────────────────────
    keywords = list(request.keywords or [])
    if not keywords and request.expected_answer:
        keywords = list(set(re.findall(r'\b[a-zA-Z]{4,}\b', request.expected_answer)))[:15]

    matched_kws, missed_kws = check_keywords(request.user_answer, keywords)
    kw_cov = (len(matched_kws) / len(keywords) * 100) if keywords else semantic_score

    # ── Derived scores (Precision Refinement) ───────────────────────────────
    # Precision weighting: technical keywords count more for factual accuracy
    technical_signal_multiplier = 1.2 if len(matched_kws) >= 3 else 1.0
    factual_score      = min(100, round((kw_cov * 0.75 + semantic_score * 0.25) * technical_signal_multiplier))
    
    user_len           = len(request.user_answer.split())
    exp_len            = len(request.expected_answer.split())
    
    # Penalize lack of depth (short answers) more heavily for precision
    length_penalty = 1.0
    if user_len < 12: length_penalty = 0.45
    elif user_len < exp_len * 0.25: length_penalty = 0.65
    
    completeness_score = min(100, round((kw_cov * 0.55 + semantic_score * 0.45) * length_penalty))
    clarity_score      = min(100, round(analyze_clarity(request.user_answer)))
    
    # Precision-weighted overall score
    overall_score      = round(
        semantic_score * 0.40 +
        factual_score  * 0.30 +
        completeness_score * 0.20 +
        clarity_score  * 0.10
    )

    scores = {
        "semantic":     semantic_score,
        "factual":      factual_score,
        "completeness": completeness_score,
        "clarity":      clarity_score,
        "overall":      overall_score,
    }

    # ── AI feedback (Ollama / Gemini) ────────────────────────────────────────
    ai_result = await ai_evaluate_answer(
        question=request.question,
        user_answer=request.user_answer,
        expected_answer=request.expected_answer,
        keywords=keywords,
        base_scores=scores,
        ai_settings=request.ai_settings,
    )

    if ai_result:
        feedback    = ai_result.get("feedback") or generate_feedback(scores, request.question, request.answer_type)
        suggestions = ai_result.get("suggestions") or []
        ai_tip      = ai_result.get("ai_tip")
        ai_adj      = ai_result.get("adjusted_overall")
        if isinstance(ai_adj, (int, float)):
            scores["overall"] = round(overall_score * 0.7 + int(ai_adj) * 0.3)
        ai_powered = True
    else:
        # ── Rule-based fallback ──────────────────────────────────────────────
        feedback   = generate_feedback(scores, request.question, request.answer_type)
        ai_tip     = None
        ai_powered = False
        suggestions: List[str] = []
        if semantic_score     < 70: suggestions.append("Align your answer more closely with the core concept being asked")
        if factual_score      < 70: suggestions.append("Include more technically accurate terminology and concepts")
        if completeness_score < 70: suggestions.append("Provide a more comprehensive answer covering all aspects")
        if clarity_score      < 70: suggestions.append("Structure your answer with clear points and examples")
        if not suggestions:         suggestions.append("Great answer! Try adding more real-world examples next time")

    return EvaluateAnswerResponse(
        scores=scores,
        feedback=feedback,
        suggestions=suggestions,
        keywords_matched=len(matched_kws),
        missed_keywords=missed_kws[:5],
        detailed_analysis={
            "semantic_similarity": round(cos_sim, 3),
            "keyword_coverage":    round(kw_cov, 1),
            "answer_length":       user_len,
            "expected_length":     exp_len,
            "matched_keywords":    matched_kws,
            "ai_powered":          ai_powered,
            **({"ai_tip": ai_tip} if ai_tip else {}),
        },
    )
