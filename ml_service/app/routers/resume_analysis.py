from fastapi import APIRouter, File, UploadFile
from pydantic import BaseModel
from typing import Optional, List
import re
import fitz # PyMuPDF

from app.services.ai_provider import ai_analyze_resume, ai_generate_cover_letter

router = APIRouter()


class ResumeAnalysisRequest(BaseModel):
    resume_text: str
    job_description: Optional[str] = ""
    target_role: Optional[str] = "Software Engineer"
    ai_settings: Optional[dict] = {}


TECH_SKILLS = {
    # Languages
    "python": 3, "javascript": 3, "typescript": 3, "java": 3, "c++": 3, "c#": 3,
    "golang": 3, "go": 3, "rust": 3, "ruby": 2, "kotlin": 2, "swift": 2, "scala": 2, "php": 2, "r": 1,
    # Frontend
    "react": 3, "next.js": 3, "angular": 3, "vue": 3, "svelte": 2, "redux": 2,
    "tailwind": 2, "html": 2, "css": 2, "sass": 2, "webpack": 2, "vite": 2,
    # Backend
    "node.js": 3, "express": 3, "fastapi": 3, "django": 3, "flask": 3, "spring boot": 3,
    "graphql": 3, "rest api": 3, "grpc": 2, "nestjs": 2, "fastify": 2,
    # Cloud & DevOps
    "aws": 3, "gcp": 3, "azure": 3, "docker": 3, "kubernetes": 3, "terraform": 3,
    "ci/cd": 3, "jenkins": 2, "github actions": 2, "ansible": 2, "helm": 2,
    "prometheus": 2, "grafana": 2, "datadog": 2,
    # Databases
    "sql": 3, "mysql": 3, "postgresql": 3, "mongodb": 3, "redis": 3, "elasticsearch": 3,
    "cassandra": 2, "dynamodb": 2, "firebase": 2, "snowflake": 2, "bigquery": 2,
    # ML / AI
    "machine learning": 3, "deep learning": 3, "tensorflow": 3, "pytorch": 3,
    "scikit-learn": 3, "nlp": 3, "computer vision": 2, "llm": 3, "langchain": 2,
    "hugging face": 2, "spark": 2, "kafka": 2, "airflow": 2,
    # Practices
    "microservices": 3, "system design": 3, "distributed systems": 3,
    "agile": 2, "scrum": 2, "git": 2, "tdd": 2, "ci/cd": 3, "devops": 2,
    "data structures": 2, "algorithms": 2,
}

ACTION_VERBS = [
    "developed", "built", "designed", "implemented", "led", "managed",
    "optimized", "increased", "reduced", "improved", "architected", "deployed",
    "created", "launched", "migrated", "refactored", "automated", "scaled",
    "delivered", "spearheaded", "collaborated", "maintained", "mentored",
    "integrated", "streamlined", "enhanced", "accelerated", "engineered",
]

RESUME_SECTIONS = {
    "experience": ["experience", "work experience", "employment", "professional experience"],
    "education": ["education", "academic", "degree", "university", "college"],
    "skills": ["skills", "technical skills", "technologies", "competencies"],
    "projects": ["projects", "personal projects", "side projects", "portfolio"],
    "summary": ["summary", "objective", "profile", "about me", "overview"],
    "certifications": ["certifications", "certificates", "awards", "achievements"],
    "contact": ["email", "phone", "linkedin", "github", "@"],
}


def extract_skills(text: str) -> List[str]:
    """Extract skills using the weighted dictionary."""
    text_lower = text.lower()
    found = []
    for skill in TECH_SKILLS:
        # Use word boundary matching for short skills to avoid false positives
        if len(skill) <= 3:
            if re.search(r'\b' + re.escape(skill) + r'\b', text_lower):
                found.append(skill.title())
        elif skill in text_lower:
            found.append(skill.title())
    # Deduplicate while preserving order
    return list(dict.fromkeys(found))


def calculate_ats_score(resume_text: str) -> int:
    """
    Robust ATS scoring across 5 weighted categories.
    Max 100. No single category can dominate.
    """
    text_lower = resume_text.lower()
    score = 0

    # 1. Sections presence (25 points)
    sections_found = 0
    for section, keywords in RESUME_SECTIONS.items():
        if any(kw in text_lower for kw in keywords):
            sections_found += 1
    score += min(25, round(sections_found / len(RESUME_SECTIONS) * 25))

    # 2. Action verbs (20 points)
    verb_count = sum(1 for v in ACTION_VERBS if v in text_lower)
    score += min(20, round(verb_count / max(len(ACTION_VERBS), 1) * 60))

    # 3. Quantified achievements (20 points)
    quant_patterns = [
        r'\d+\s*%',          # Percentages: "40%"
        r'\d+\s*x\b',         # Multiples: "3x"
        r'\$[\d,]+',          # Dollar amounts
        r'\d{1,3}(?:,\d{3})+', # Large numbers: "10,000"
        r'\d+\s+(?:users?|customers?|employees?|requests?|services?|teams?)',  # Counts
        r'(?:increased|reduced|improved|decreased|saved|grew)\s+(?:by\s+)?\d+',  # "increased by 40"
    ]
    quant_count = sum(len(re.findall(p, resume_text, re.IGNORECASE)) for p in quant_patterns)
    score += min(20, quant_count * 4)

    # 4. Technical skills density (20 points)
    skills_found = extract_skills(resume_text)
    score += min(20, len(skills_found) * 2)

    # 5. Format signals (15 points)
    has_email   = bool(re.search(r'[\w.\-+]+@[\w.\-]+\.\w{2,}', resume_text))
    has_phone   = bool(re.search(r'[\+\d][\d\s\-\(\)]{8,15}\d', resume_text))
    has_linkedin = bool(re.search(r'linkedin\.com|linkedin\.in', text_lower))
    has_github   = bool(re.search(r'github\.com', text_lower))
    word_count   = len(resume_text.split())
    good_length  = 200 <= word_count <= 1000

    format_score = (
        (5 if has_email else 0)
        + (3 if has_phone else 0)
        + (3 if has_linkedin else 0)
        + (2 if has_github else 0)
        + (2 if good_length else 0)
    )
    score += min(15, format_score)

    return min(100, score)


def calculate_jd_match(resume_text: str, job_description: str) -> int:
    if not job_description or not job_description.strip():
        return 0

    # Extract important words from JD (filter stop words)
    stop_words = {"the", "and", "for", "with", "this", "that", "will", "have", "are", "you",
                  "our", "we", "be", "in", "to", "of", "a", "an", "is", "it", "on", "at", "by"}
    jd_words = set(w for w in re.findall(r'\b[a-z]{3,}\b', job_description.lower()) if w not in stop_words)
    resume_words = set(w for w in re.findall(r'\b[a-z]{3,}\b', resume_text.lower()) if w not in stop_words)

    # Weighted skill overlap (60%)
    jd_skills = [s for s in TECH_SKILLS if s in job_description.lower()]
    resume_skills_set = {s.lower() for s in extract_skills(resume_text)}
    if jd_skills:
        skill_overlap = sum(1 for s in jd_skills if s in resume_skills_set)
        skill_match = (skill_overlap / len(jd_skills)) * 60
    else:
        skill_match = 30.0  # No skills in JD = use keyword match only

    # General keyword overlap (40%)
    if jd_words:
        word_overlap = (len(jd_words & resume_words) / len(jd_words)) * 40
    else:
        word_overlap = 0.0

    return min(100, round(skill_match + word_overlap))


def identify_skills_gap(resume_text: str, job_description: str) -> List[str]:
    """Return skills present in the JD but missing from the resume."""
    if not job_description or not job_description.strip():
        return []
    jd_skills = [s for s in TECH_SKILLS if s in job_description.lower()]
    resume_skills = {s.lower() for s in extract_skills(resume_text)}
    return [s.title() for s in jd_skills if s not in resume_skills][:10]


def generate_suggestions(resume_text: str, skills: List[str], jd_match: int) -> List[dict]:
    """Generate specific, non-false-positive suggestions."""
    suggestions = []
    text_lower = resume_text.lower()

    # Action verbs check
    verbs_found = sum(1 for v in ACTION_VERBS if v in text_lower)
    if verbs_found < 5:
        suggestions.append({
            "category": "Impact", "priority": "high",
            "text": "Fewer than 5 strong action verbs detected. Lead every bullet point with verbs like 'Architected', 'Deployed', 'Optimized', 'Reduced'."
        })

    # Quantified achievements
    quant_count = len(re.findall(r'\d+\s*%|\d+x\b|\$[\d,]+|\d+\s+(?:users?|customers?)', resume_text, re.IGNORECASE))
    if quant_count < 3:
        suggestions.append({
            "category": "Metrics", "priority": "high",
            "text": f"Only {quant_count} quantified achievement(s) found. Add numbers: 'Reduced P99 latency by 35%', 'Scaled system to 500K daily requests'."
        })

    # Contact / links
    if not re.search(r'github\.com', text_lower):
        suggestions.append({"category": "Portfolio", "priority": "medium", "text": "No GitHub link detected. Add github.com/yourname to showcase projects."})
    if not re.search(r'linkedin\.com|linkedin\.in', text_lower):
        suggestions.append({"category": "Profile", "priority": "medium", "text": "No LinkedIn URL found. Add a full linkedin.com/in/yourname link."})

    # Summary section
    has_summary = any(kw in text_lower for kw in RESUME_SECTIONS["summary"])
    if not has_summary:
        suggestions.append({"category": "Summary", "priority": "medium", "text": "No professional summary detected. Add a 3-4 sentence summary as the first section."})

    # Length
    word_count = len(resume_text.split())
    if word_count < 200:
        suggestions.append({"category": "Length", "priority": "high", "text": f"Resume is very short ({word_count} words). Expand each role with detailed bullet points."})
    elif word_count > 1100:
        suggestions.append({"category": "Length", "priority": "low", "text": f"Resume is long ({word_count} words). Trim to 1-2 pages for best ATS performance."})

    # JD match feedback
    if jd_match > 0 and jd_match < 50:
        suggestions.append({"category": "Keywords", "priority": "high", "text": f"JD match is only {jd_match}%. Mirror the job description language more closely, especially for required skills."})

    return suggestions


@router.post("/upload-resume")
async def upload_resume(file: UploadFile = File(...)):
    """Extract text from uploaded PDF or text resume."""
    filename = file.filename.lower()
    content = await file.read()
    
    try:
        if filename.endswith(".pdf"):
            # Use PyMuPDF to extract text from PDF
            doc = fitz.open(stream=content, filetype="pdf")
            text = ""
            for page in doc:
                text += page.get_text()
            return {"text": text.strip()}
        else:
            # Fallback for text files
            return {"text": content.decode("utf-8", errors="ignore").strip()}
    except Exception as e:
        print(f"Error parsing file: {e}")
        return {"text": "", "error": str(e)}


@router.post("/analyze-resume")
async def analyze_resume(request: ResumeAnalysisRequest):
    """Comprehensive resume analysis with ATS scoring, rule-based suggestions, and AI insights."""
    print(f"DEBUG: Received resume analysis request. Text length: {len(request.resume_text)}")
    if len(request.resume_text) < 10:
        print(f"DEBUG: Resume text too short: '{request.resume_text}'")

    skills     = extract_skills(request.resume_text)
    ats_score  = calculate_ats_score(request.resume_text)
    jd_match   = calculate_jd_match(request.resume_text, request.job_description)
    skills_gap = identify_skills_gap(request.resume_text, request.job_description)
    suggestions = generate_suggestions(request.resume_text, skills, jd_match)  # fixed signature

    has_quantified    = bool(re.search(r'\d+\s*%|\d+x\b|\$[\d,]+', request.resume_text))
    has_dates         = bool(re.search(r'\b(20\d{2}|19\d{2})\b', request.resume_text))
    has_github        = bool(re.search(r'github\.com', request.resume_text, re.I))
    has_linkedin      = bool(re.search(r'linkedin\.com|linkedin\.in', request.resume_text, re.I))
    word_count        = len(request.resume_text.split())

    # Credibility score: weighted, not hardcoded
    credibility_score = min(100, (
        (30 if has_quantified else 0)
        + (25 if has_dates else 0)
        + (20 if has_github else 0)
        + (15 if has_linkedin else 0)
        + (10 if 200 <= word_count <= 1000 else 0)
    ))

    base_analysis = {
        "ats_score":  ats_score,
        "jd_match":   jd_match,
        "word_count": word_count,
        "skills_count": len(skills),
        "quant_count": len(re.findall(r'\d+\s*%|\d+x\b|\$[\d,]+', request.resume_text, re.I)),
    }

    # ── AI enhancement (Ollama / Gemini) ─────────────────────────────────────
    ai_result = await ai_analyze_resume(
        resume_text=request.resume_text,
        job_description=request.job_description or "",
        target_role=request.target_role or "Software Engineer",
        base_analysis=base_analysis,
        ai_settings=request.ai_settings,
    )

    # Merge AI suggestions on top of rule-based ones
    if ai_result:
        # Override scores with true AI intelligence if provided
        ai_ats = ai_result.get("ai_ats_score")
        if isinstance(ai_ats, (int, float)):
            ats_score = int(ai_ats)
            
        ai_jd = ai_result.get("ai_jd_match_score")
        if isinstance(ai_jd, (int, float)) and request.job_description:
            jd_match = int(ai_jd)

        ai_suggestions = ai_result.get("ai_suggestions") or []
        # Prepend high-priority AI suggestions
        high_ai = [s for s in ai_suggestions if s.get("priority") == "high"]
        other_ai = [s for s in ai_suggestions if s.get("priority") != "high"]
        combined_suggestions = high_ai + suggestions + other_ai
        # De-duplicate: remove rule-based suggestions if AI covers the same category
        ai_categories = {s.get("category") for s in ai_suggestions}
        combined_suggestions = high_ai + [s for s in suggestions if s.get("category") not in ai_categories] + other_ai
        strengths = ai_result.get("ai_strengths") or [
            f"Strong technical breadth: {', '.join(skills[:4])}" if skills else "Clean structure",
            "Quantified impact demonstrated" if has_quantified else "Consistent employment history",
            f"Solid length ({word_count} words)" if 200 <= word_count <= 1000 else "Professional layout",
        ]
        # AI may refine scores — clamp to valid range
        if isinstance(ai_result.get("ai_ats_score"), (int, float)):
            ats_score = max(0, min(100, int(ai_result["ai_ats_score"])))
        if isinstance(ai_result.get("ai_jd_match_score"), (int, float)) and request.job_description:
            jd_match = max(0, min(100, int(ai_result["ai_jd_match_score"])))

    else:
        combined_suggestions = suggestions
        strengths = [
            f"Strong technical breadth: {', '.join(skills[:4])}" if skills else "Clean structure",
            "Quantified impact demonstrated" if has_quantified else "Add metrics to strengthen each bullet point",
            f"Solid length ({word_count} words)" if 200 <= word_count <= 1000 else "Consider optimizing resume length",
        ]

    return {
        "ats_score":         ats_score,
        "jd_match":          jd_match if (request.job_description and request.job_description.strip()) else None,
        "credibility_score": credibility_score,
        "word_count":        word_count,
        "entities": {
            "skills":       skills,
            "skills_count": len(skills),
        },
        "skills_gap":   skills_gap,
        "suggestions":  combined_suggestions[:10],
        "score_breakdown": {
            "format":   min(100, ats_score + 5),
            "content":  min(100, 40 + len(skills) * 3 + (20 if has_quantified else 0)),
            "keywords": min(100, len(skills) * 5 + (jd_match // 4 if jd_match else 0)),
            "impact":   min(100, 30 + (len(re.findall(r'\d+\s*%|\d+x\b', request.resume_text, re.I)) * 15)),
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
        ai_settings=request.ai_settings,
    )
    return {"cover_letter": cover_letter}
