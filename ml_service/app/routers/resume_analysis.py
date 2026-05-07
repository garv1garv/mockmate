from fastapi import APIRouter
from pydantic import BaseModel
from typing import Optional, List
import re

from app.services.ai_provider import ai_analyze_resume, ai_generate_cover_letter

router = APIRouter()


class ResumeAnalysisRequest(BaseModel):
    resume_text: str
    job_description: Optional[str] = ""
    target_role: Optional[str] = "Software Engineer"


TECH_SKILLS = [
    "python", "javascript", "typescript", "java", "c++", "golang", "rust",
    "react", "angular", "vue", "node.js", "express", "fastapi", "django", "flask",
    "aws", "gcp", "azure", "docker", "kubernetes", "terraform",
    "sql", "mysql", "postgresql", "mongodb", "redis", "elasticsearch",
    "machine learning", "deep learning", "tensorflow", "pytorch", "scikit-learn",
    "git", "ci/cd", "jenkins", "github actions", "agile", "scrum",
    "rest api", "graphql", "microservices", "system design", "distributed systems",
]

ACTION_VERBS = [
    "developed", "built", "designed", "implemented", "led", "managed",
    "optimized", "increased", "reduced", "improved", "architected", "deployed",
    "created", "launched", "migrated", "refactored", "automated", "scaled",
]


def extract_skills(text: str) -> List[str]:
    text_lower = text.lower()
    return [skill.title() for skill in TECH_SKILLS if skill in text_lower]


def calculate_ats_score(resume_text: str) -> int:
    score = 0
    text_lower = resume_text.lower()

    # Check for key sections
    sections = ["experience", "education", "skills", "projects", "summary", "objective"]
    section_score = sum(10 for s in sections if s in text_lower)
    score += min(30, section_score)

    # Action verbs
    verb_count = sum(1 for v in ACTION_VERBS if v in text_lower)
    score += min(20, verb_count * 3)

    # Quantified achievements
    quant_pattern = r'\d+%|\d+x|\$[\d,]+|\d+\s*(users?|clients?|customers?|employees?)'
    quantified = re.findall(quant_pattern, resume_text, re.IGNORECASE)
    score += min(20, len(quantified) * 5)

    # Technical skills
    skills_found = extract_skills(resume_text)
    score += min(20, len(skills_found) * 2)

    # Contact info
    has_email = bool(re.search(r'[\w.-]+@[\w.-]+\.\w+', resume_text))
    has_phone = bool(re.search(r'[\d\-\(\)\+\s]{10,}', resume_text))
    has_linkedin = 'linkedin' in text_lower
    score += (5 if has_email else 0) + (3 if has_phone else 0) + (2 if has_linkedin else 0)

    return min(100, score)


def calculate_jd_match(resume_text: str, job_description: str) -> int:
    if not job_description:
        return 0
    
    jd_words = set(re.findall(r'\b[a-z]{3,}\b', job_description.lower()))
    resume_words = set(re.findall(r'\b[a-z]{3,}\b', resume_text.lower()))
    
    jd_skills = [s for s in TECH_SKILLS if s in job_description.lower()]
    resume_skills_set = set(extract_skills(resume_text))
    
    skill_overlap = sum(1 for s in jd_skills if s.title() in resume_skills_set)
    skill_match = (skill_overlap / max(len(jd_skills), 1)) * 60
    
    word_overlap = len(jd_words & resume_words) / max(len(jd_words), 1) * 40
    
    return min(100, round(skill_match + word_overlap))


def identify_skills_gap(resume_text: str, job_description: str) -> List[str]:
    if not job_description:
        return []
    
    jd_skills = [s.title() for s in TECH_SKILLS if s in job_description.lower()]
    resume_skills = extract_skills(resume_text)
    
    return [s for s in jd_skills if s not in resume_skills][:8]


def generate_suggestions(resume_text: str, skills: List[str]) -> List[dict]:
    suggestions = []
    text_lower = resume_text.lower()
    
    if not any(v in text_lower for v in ["developed", "built", "implemented", "created"]):
        suggestions.append({
            "category": "Impact", "priority": "high",
            "text": "Start bullet points with strong action verbs (Developed, Built, Architected, Led)"
        })
    
    quant_count = len(re.findall(r'\d+%|\d+x|\$[\d,]+', resume_text))
    if quant_count < 3:
        suggestions.append({
            "category": "Metrics", "priority": "high",
            "text": "Add quantified achievements: 'Improved API response time by 40%', 'Reduced costs by $50K'"
        })
    
    if 'github' not in text_lower and 'portfolio' not in text_lower:
        suggestions.append({
            "category": "Portfolio", "priority": "medium",
            "text": "Add GitHub profile link and portfolio website to showcase your projects"
        })
    
    if 'summary' not in text_lower and 'objective' not in text_lower:
        suggestions.append({
            "category": "Summary", "priority": "medium",
            "text": "Add a professional summary (3-4 sentences) highlighting your expertise and career goals"
        })
    
    if len(skills) < 8:
        suggestions.append({
            "category": "Skills", "priority": "medium",
            "text": "Expand the technical skills section with relevant technologies and tools"
        })
    
    word_count = len(resume_text.split())
    if word_count < 250:
        suggestions.append({
            "category": "Length", "priority": "low",
            "text": "Your resume seems short. Add more detail about projects, achievements, and responsibilities"
        })
    elif word_count > 1000:
        suggestions.append({
            "category": "Length", "priority": "low",
            "text": "Resume is too long. Aim for 1 page (juniors) or 2 pages (seniors) for best ATS performance"
        })
    
    return suggestions


@router.post("/analyze-resume")
async def analyze_resume(request: ResumeAnalysisRequest):
    """Comprehensive resume analysis with ATS scoring, rule-based suggestions, and AI insights."""

    skills     = extract_skills(request.resume_text)
    ats_score  = calculate_ats_score(request.resume_text)
    jd_match   = calculate_jd_match(request.resume_text, request.job_description)
    skills_gap = identify_skills_gap(request.resume_text, request.job_description)
    suggestions = generate_suggestions(request.resume_text, skills)

    has_quantified    = bool(re.search(r'\d+%|\d+x|\$[\d,]+', request.resume_text))
    has_dates         = bool(re.search(r'\b(20\d{2}|19\d{2})\b', request.resume_text))
    consistency_score = 70 + (15 if has_quantified else 0) + (10 if has_dates else 0)
    word_count        = len(request.resume_text.split())

    base_analysis = {
        "ats_score":  ats_score,
        "jd_match":   jd_match,
        "word_count": word_count,
    }

    # ── AI enhancement (Ollama / Gemini) ─────────────────────────────────────
    ai_result = await ai_analyze_resume(
        resume_text=request.resume_text,
        job_description=request.job_description or "",
        target_role=request.target_role or "Software Engineer",
        base_analysis=base_analysis,
    )

    # Merge AI suggestions on top of rule-based ones
    if ai_result:
        ai_suggestions = ai_result.get("ai_suggestions") or []
        # Prepend high-priority AI suggestions
        high_ai = [s for s in ai_suggestions if s.get("priority") == "high"]
        other_ai = [s for s in ai_suggestions if s.get("priority") != "high"]
        combined_suggestions = high_ai + suggestions + other_ai
        strengths = ai_result.get("ai_strengths") or [
            f"Strong technical skills: {', '.join(skills[:4])}" if skills else "Clean formatting",
            "Quantified achievements present" if has_quantified else "Consistent date formatting",
            f"Good coverage ({word_count} words)" if 250 <= word_count <= 700 else "Professional structure",
        ]
    else:
        combined_suggestions = suggestions
        strengths = [
            f"Strong technical skills: {', '.join(skills[:4])}" if skills else "Clean formatting",
            "Quantified achievements present" if has_quantified else "Consistent date formatting",
            f"Good coverage ({word_count} words)" if 250 <= word_count <= 700 else "Professional structure",
        ]

    return {
        "ats_score":        ats_score,
        "jd_match":         jd_match if request.job_description else None,
        "credibility_score": min(100, consistency_score),
        "word_count":       word_count,
        "entities": {
            "skills":       skills,
            "skills_count": len(skills),
        },
        "skills_gap":   skills_gap,
        "suggestions":  combined_suggestions,
        "score_breakdown": {
            "format":   min(100, ats_score + 5),
            "content":  min(100, 50 + len(skills) * 3 + (20 if has_quantified else 0)),
            "keywords": min(100, len(skills) * 6),
            "impact":   min(100, 40 + (len(re.findall(r'\d+%|\d+x', request.resume_text)) * 15)),
        },
        "strengths":    strengths,
        "target_role":  request.target_role,
        **({
            "ai_summary":          ai_result.get("ai_summary"),
            "ai_missing_sections": ai_result.get("missing_sections", []),
            "ai_powered":          True,
        } if ai_result else {"ai_powered": False}),
    }


@router.post("/resume-questions")
async def generate_resume_questions(request: dict):
    """Generate interview questions based on resume content."""
    resume_text = request.get("resume_text", "")
    target_role = request.get("target_role", "Software Engineer")
    count = request.get("count", 5)
    
    skills = extract_skills(resume_text)
    
    questions = [
        {
            "id": str(i),
            "text": f"Tell me about your experience with {skill} and a challenging problem you solved using it.",
            "type": "technical",
            "difficulty": "medium",
            "category": "Resume-Based",
        }
        for i, skill in enumerate(skills[:count])
    ]
    
    if len(questions) < count:
        questions.append({
            "id": str(len(questions)),
            "text": f"Walk me through your most significant technical project relevant to the {target_role} role.",
            "type": "behavioral",
            "difficulty": "medium",
            "category": "Resume-Based",
        })
    
    return {"questions": questions[:count]}


@router.post("/generate-cover-letter")
async def generate_cover_letter(request: ResumeAnalysisRequest):
    """Generate a highly tailored cover letter based on resume and JD."""
    cover_letter = await ai_generate_cover_letter(
        resume_text=request.resume_text,
        job_description=request.job_description,
        target_role=request.target_role,
    )
    return {"cover_letter": cover_letter}
