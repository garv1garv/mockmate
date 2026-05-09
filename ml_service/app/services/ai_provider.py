"""
MockMate AI Provider — Supports Local Ollama LLM + Google Gemini
================================================================
Configure via environment variables:

  # --- Local Ollama (preferred, no cost, full privacy) ---
  AI_PROVIDER=ollama                  # "ollama" | "gemini" | "none"
  OLLAMA_HOST=http://localhost:11434  # Ollama base URL (change port if needed)
  OLLAMA_MODEL=llama3                 # Any model pulled in Ollama

  # --- Google Gemini (cloud fallback) ---
  # AI_PROVIDER=gemini
  GEMINI_API_KEY=your_gemini_api_key
  GEMINI_MODEL=gemini-1.5-flash       # gemini-1.5-pro, gemini-1.5-flash, etc.

When AI_PROVIDER=none (or provider fails), all functions return None
and callers fall back to their rule-based logic.
"""

from __future__ import annotations

import json
import os
import random
import re
import logging
from typing import Optional

import httpx
from dotenv import load_dotenv

load_dotenv()

logger = logging.getLogger(__name__)

# ──────────────────────────────────────────────────────────────────────────────
# Config
# ──────────────────────────────────────────────────────────────────────────────
AI_PROVIDER   = os.getenv("AI_PROVIDER", "ollama").lower()   # "ollama" | "gemini" | "none"

OLLAMA_HOST   = os.getenv("OLLAMA_HOST", "http://localhost:11434")
OLLAMA_MODEL  = os.getenv("OLLAMA_MODEL", "llama3")

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY", "")
GEMINI_MODEL   = os.getenv("GEMINI_MODEL", "gemini-1.5-flash")

_HTTP_TIMEOUT = 60.0  # seconds

# ──────────────────────────────────────────────────────────────────────────────
# Provider detection helper
# ──────────────────────────────────────────────────────────────────────────────

def _active_provider(incoming_key: Optional[str] = None) -> str:
    """Return the effective AI provider, falling back gracefully."""
    # If the user provided a key in their settings, and the provider is gemini or not set, use gemini
    if incoming_key and (AI_PROVIDER == "gemini" or AI_PROVIDER == "ollama"):
        return "gemini"
        
    if AI_PROVIDER == "none":
        return "none"
    if AI_PROVIDER == "gemini":
        if not GEMINI_API_KEY and not incoming_key:
            logger.warning("AI_PROVIDER=gemini but no GEMINI_API_KEY set — falling back to none")
            return "none"
        return "gemini"
    # Default: Ollama
    return "ollama"


# ──────────────────────────────────────────────────────────────────────────────
# Low-level calls
# ──────────────────────────────────────────────────────────────────────────────

async def _call_ollama(
    prompt: str, 
    system: str = "", 
    host_override: Optional[str] = None, 
    model_override: Optional[str] = None
) -> Optional[str]:
    """Call local Ollama /api/generate endpoint (non-streaming)."""
    host = host_override or OLLAMA_HOST
    model = model_override or OLLAMA_MODEL
    payload: dict = {
        "model": model,
        "prompt": prompt,
        "stream": False,
        "options": {
            "temperature": 0.7,
            "num_predict": 4096,
        },
    }
    if system:
        payload["system"] = system

    try:
        async with httpx.AsyncClient(timeout=_HTTP_TIMEOUT) as client:
            resp = await client.post(f"{host}/api/generate", json=payload)
            resp.raise_for_status()
            data = resp.json()
            return data.get("response", "").strip()
    except httpx.ConnectError:
        logger.error(
            "Cannot connect to Ollama at %s — is Ollama running? "
            "Start it with: ollama serve", host
        )
    except Exception as exc:
        logger.error("Ollama call failed: %s", exc)
    return None


async def _call_gemini(
    prompt: str, 
    system: str = "", 
    model_override: Optional[str] = None,
    api_key_override: Optional[str] = None
) -> Optional[str]:
    """Call Google Gemini REST API (generateContent)."""
    model = model_override or GEMINI_MODEL
    api_key = api_key_override or GEMINI_API_KEY
    full_prompt = f"{system}\n\n{prompt}" if system else prompt
    url = (
        f"https://generativelanguage.googleapis.com/v1beta/models/"
        f"{model}:generateContent?key={api_key}"
    )
    payload = {
        "contents": [{"parts": [{"text": full_prompt}]}],
        "generationConfig": {
            "temperature": 0.7,
            "maxOutputTokens": 4096,
        },
    }
    try:
        async with httpx.AsyncClient(timeout=_HTTP_TIMEOUT) as client:
            resp = await client.post(url, json=payload)
            resp.raise_for_status()
            data = resp.json()
            return (
                data["candidates"][0]["content"]["parts"][0]["text"].strip()
            )
    except Exception as exc:
        logger.error("Gemini call failed: %s", exc)
    return None


# ──────────────────────────────────────────────────────────────────────────────
# Public interface
# ──────────────────────────────────────────────────────────────────────────────

async def complete(
    prompt: str, 
    system: str = "", 
    provider_override: Optional[str] = None,
    host_override: Optional[str] = None,
    model_override: Optional[str] = None,
    gemini_api_key_override: Optional[str] = None
) -> Optional[str]:
    """
    Send a prompt to the configured AI provider.
    Returns the model's text response, or None on failure.
    """
    # Decide provider: override > automatic check (passing the incoming key)
    provider = provider_override or _active_provider(gemini_api_key_override)
    
    if provider == "none":
        return None
    if provider == "gemini":
        # Ensure we have a key (either from override or env)
        api_key = gemini_api_key_override or GEMINI_API_KEY
        if not api_key:
            logger.error("Gemini provider selected but no API key available")
            return None
        return await _call_gemini(prompt, system, model_override, api_key)
    return await _call_ollama(prompt, system, host_override, model_override)


def _extract_json(text: str) -> Optional[dict | list]:
    """Try to extract a JSON object/array from an LLM response string."""
    # Try direct parse first
    try:
        return json.loads(text)
    except json.JSONDecodeError:
        pass
    # Try to find JSON block inside markdown fences
    m = re.search(r"```(?:json)?\s*([\s\S]+?)\s*```", text)
    if m:
        try:
            return json.loads(m.group(1))
        except json.JSONDecodeError:
            pass
    # Try to find first {...} or [...]
    m = re.search(r"(\{[\s\S]+\}|\[[\s\S]+\])", text)
    if m:
        try:
            return json.loads(m.group(1))
        except json.JSONDecodeError:
            pass
    return None


# ──────────────────────────────────────────────────────────────────────────────
# Task-specific helpers (used by routers)
# ──────────────────────────────────────────────────────────────────────────────

SYSTEM_INTERVIEW_EXPERT = (
    "You are an expert technical interviewer and career coach with 15+ years "
    "of experience at top tech companies. You give precise, actionable, and "
    "encouraging feedback. Always respond in the language of the user."
)


async def ai_evaluate_answer(
    question: str,
    user_answer: str,
    expected_answer: str,
    keywords: list[str],
    base_scores: dict,
    ai_settings: Optional[dict] = None,
) -> Optional[dict]:
    """
    Use AI to enrich the rule-based evaluation with natural language feedback.
    Returns a dict with keys: feedback, suggestions, ai_tip.
    Falls back to None so the caller uses its static logic.
    """
    settings = ai_settings or {}
    provider = settings.get("provider") or (_active_provider() if not GEMINI_API_KEY else "gemini")
    host = settings.get("ollamaHost", OLLAMA_HOST)
    model = settings.get("ollamaModel", OLLAMA_MODEL) if provider == "ollama" else settings.get("geminiModel", GEMINI_MODEL)
    api_key = settings.get("geminiApiKey") or GEMINI_API_KEY

    logger.info("AI Provider: %s | Host: %s | Model: %s", provider, host, model)

    kw_list = ", ".join(keywords[:10]) if keywords else "N/A"
    prompt = f"""
You are a Senior Technical Interviewer at a FAANG company. Evaluate this candidate's answer with extreme technical rigor.

QUESTION: {question}
EXPECTED KEY CONCEPTS: {kw_list}
IDEAL REFERENCE: {expected_answer}
CANDIDATE'S ANSWER: {user_answer}

BASE SCORING METRICS (Use these as a starting point):
{json.dumps(base_scores)}

INSTRUCTIONS:
1. CRITIQUE: Identify exactly what is missing. Is it a specific keyword? A trade-off? An edge case?
2. ADJUST: Provide an 'adjusted_overall' score (0-100) based on technical depth.
3. FEEDBACK: Write a 2-3 sentence professional evaluation. Mention specific technical strengths or gaps.
4. SUGGESTIONS: Provide 2-3 concrete ways to make this a 'Staff-level' answer.
5. PRO-TIP: Provide a 'Senior Interviewer's Pro-Tip' that would wow an interviewer for this specific topic.

Respond with ONLY valid JSON:
{{
  "feedback": "<Professional technical evaluation>",
  "suggestions": ["<Specific improvement 1>", "<Specific improvement 2>"],
  "ai_tip": "<Senior Interviewer's Pro-Tip>",
  "adjusted_overall": <int 0-100>,
  "technical_nuance_score": <int 0-100>
}}
"""
    raw = await complete(prompt, SYSTEM_INTERVIEW_EXPERT, provider_override=provider, host_override=host, model_override=model, gemini_api_key_override=api_key)
    if not raw:
        return None
    result = _extract_json(raw)
    if isinstance(result, dict):
        return result
    return None


async def ai_generate_question(
    q_type: str,
    difficulty: str,
    category: str,
    company: Optional[str] = None,
    job_description: Optional[str] = None,
    resume_text: Optional[str] = None,
    previous_questions: list[str] = [],
    ai_settings: Optional[dict] = None,
) -> Optional[dict]:
    """
    Generate a fresh interview question using AI.
    Returns dict with: text, expected_answer, keywords, follow_up_questions.
    """
    settings = ai_settings or {}
    provider = settings.get("provider") or (_active_provider() if not GEMINI_API_KEY else "gemini")
    host = settings.get("ollamaHost", OLLAMA_HOST)
    model = settings.get("ollamaModel", OLLAMA_MODEL) if provider == "ollama" else settings.get("geminiModel", GEMINI_MODEL)
    api_key = settings.get("geminiApiKey") or GEMINI_API_KEY

    logger.info("Generating question | Provider: %s | Host: %s | Model: %s", provider, host, model)

    resume_context = f"\nRESUME CONTEXT (Probe specific claims/projects):\n{resume_text[:4000]}" if resume_text else ""
    
    # Advanced randomization layer
    twists = [
        "Focus on distributed systems trade-offs.",
        "Include a scenario involving high-concurrency or race conditions.",
        "Focus on performance optimization and memory efficiency.",
        "Ask about an edge case that typically breaks a naive implementation.",
        "Ask for a comparison between two modern industry-standard approaches.",
        "Focus on security vulnerabilities (e.g. OWASP Top 10) related to this topic.",
        "Include a requirement for high availability or fault tolerance."
    ]
    twist = random.choice(twists)
    
    prev = "\n".join(f"- {q}" for q in previous_questions[-15:]) if previous_questions else "None"
    company_ctx = f"targeting {company} (mimic their interview style)" if company else "general elite tech interview"
    
    prompt = f"""
You are a Staff Software Engineer at a Tier-1 tech company (Google/Meta/Stripe). Generate a UNIQUE, deeply technical interview question.

CONTEXT:
- INTERVIEW TYPE: {company_ctx}
- QUESTION TYPE: {q_type}
- DIFFICULTY: {difficulty} (STRICTLY adhere to this level)
- CATEGORY: {category}
- JOB DESCRIPTION: {job_description or 'Software Engineer'}
{resume_context}

PREVIOUSLY ASKED (DO NOT REPEAT OR BE SIMILAR):
{prev}

INTERVIEWER DIRECTIVE:
{twist}
The question must be specific, situational, and probe for deep understanding rather than rote memorization. 

If RESUME CONTEXT is provided, your question MUST directly reference a project, technology, or achievement listed in the resume to verify its authenticity and depth.

Respond with ONLY valid JSON:
{{
  "text": "<the question text>",
  "expected_answer": "<a comprehensive 3-4 sentence reference answer covering key technical signals>",
  "keywords": ["<key technical term 1>", "<key technical term 2>", "<key technical term 3>", "<key technical term 4>"],
  "follow_up_questions": ["<advanced follow up 1>", "<advanced follow up 2>"],
  "interviewer_note": "<internal note on what specific signals this question tests>"
}}
"""
    raw = await complete(prompt, SYSTEM_INTERVIEW_EXPERT, provider_override=provider, host_override=host, model_override=model, gemini_api_key_override=api_key)
    if not raw:
        return None
    result = _extract_json(raw)
    if isinstance(result, dict) and "text" in result:
        return result
    return None


async def ai_analyze_resume(
    resume_text: str,
    job_description: str,
    target_role: str,
    base_analysis: dict,
    ai_settings: Optional[dict] = None,
) -> Optional[dict]:
    """
    Use AI to generate smart, personalised resume suggestions.
    Returns dict with: ai_summary, ai_suggestions, ai_strengths.
    """
    settings = ai_settings or {}
    provider = settings.get("provider") or (_active_provider() if not GEMINI_API_KEY else "gemini")
    host = settings.get("ollamaHost", OLLAMA_HOST)
    model = settings.get("ollamaModel", OLLAMA_MODEL) if provider == "ollama" else settings.get("geminiModel", GEMINI_MODEL)
    api_key = settings.get("geminiApiKey") or GEMINI_API_KEY

    jd_section = f"\n\nJOB DESCRIPTION (analyse match against this):\n{job_description[:1500]}" if job_description and job_description.strip() else ""
    prompt = f"""
You are a Distinguished Senior Technical Recruiter who has reviewed 10,000+ resumes at Google, Meta, and Netflix. Your analysis must be SPECIFIC, ACCURATE, and DEEPLY ACTIONABLE — not generic boilerplate.

TASK: Analyse the resume below for a candidate targeting the role of: {target_role}
{jd_section}

RULE-BASED SIGNALS (cross-check these, then override with your expert judgement):
- Rule-based ATS Score: {base_analysis.get('ats_score', 'N/A')}/100
- Rule-based JD Match: {base_analysis.get('jd_match', 'N/A')}/100
- Skills Detected: {base_analysis.get('skills_count', 0)}
- Quantified Achievements Found: {base_analysis.get('quant_count', 0)}
- Word Count: {base_analysis.get('word_count', 0)}

RESUME CONTENT:
{resume_text[:8000]}

INSTRUCTIONS:
1. ai_ats_score: Score ATS compatibility (0-100). Consider formatting clarity, keyword density, section structure, and absence of tables/images (which break ATS). Be precise, not rounded.
2. ai_jd_match_score: Score how well the resume matches the JD (0 if no JD provided). Analyse skill overlap and keyword mirroring.
3. ai_summary: Write a 2-3 sentence executive profile of this candidate — as if briefing a hiring manager. Name specific technologies, seniority signals, and domain expertise you actually see in the resume.
4. ai_suggestions: Provide 3-5 SPECIFIC, non-generic suggestions. Reference actual content from the resume (e.g., "The bullet 'worked on backend systems' under Company X should be rewritten to quantify impact"). Categorise each.
5. ai_strengths: Identify 3 genuine strengths you see in THIS resume (not generic). Be specific (e.g., "Strong GCP and Kubernetes experience evidenced by 3 project entries").
6. missing_sections: List any important sections absent from this resume (e.g., 'Certifications', 'Open Source Contributions', 'Publications').

Respond with ONLY valid JSON:
{{
  "ai_ats_score": <int 0-100>,
  "ai_jd_match_score": <int 0-100>,
  "ai_summary": "<Specific 2-3 sentence executive profile>",
  "ai_suggestions": [
    {{"category": "<Category>", "priority": "high|medium|low", "text": "<Specific actionable suggestion referencing resume content>"}},
    {{"category": "<Category>", "priority": "high|medium|low", "text": "<Specific actionable suggestion>"}},
    {{"category": "<Category>", "priority": "medium", "text": "<Specific actionable suggestion>"}}
  ],
  "ai_strengths": ["<Specific strength 1>", "<Specific strength 2>", "<Specific strength 3>"],
  "missing_sections": ["<Missing section 1>"]
}}
"""
    raw = await complete(prompt, SYSTEM_INTERVIEW_EXPERT, provider_override=provider, host_override=host, model_override=model, gemini_api_key_override=api_key)
    if not raw:
        return None
    result = _extract_json(raw)
    if isinstance(result, dict):
        return result
    return None


async def ai_generate_learning_path(
    target_role: str,
    current_skills: list[str],
    experience_level: str,
    weak_topics: list[str],
    focus_areas: list[str],
    project_preference: str,
    learning_style: str,
    hours_per_week: int,
    base_path: dict,
    ai_settings: Optional[dict] = None,
) -> Optional[dict]:
    """
    Use AI to personalise the learning path roadmap with high accuracy and uniqueness.
    """
    settings = ai_settings or {}
    provider = settings.get("provider") or (_active_provider() if not GEMINI_API_KEY else "gemini")
    host = settings.get("ollamaHost", OLLAMA_HOST)
    model = settings.get("ollamaModel", OLLAMA_MODEL) if provider == "ollama" else settings.get("geminiModel", GEMINI_MODEL)
    api_key = settings.get("geminiApiKey") or GEMINI_API_KEY

    skills_str = ", ".join(current_skills[:15]) if current_skills else "None listed"
    gaps_str = ", ".join(base_path.get("skill_gap", [])[:10]) or "None"
    
    # Randomization layer to ensure unique architectural angles every time
    angles = [
        "Focus on high-performance optimization and low-latency design.",
        "Focus on resilient, distributed systems and fault tolerance.",
        "Focus on modern developer productivity, DX, and automated CI/CD excellence.",
        "Focus on security-first architecture and zero-trust principles.",
        "Focus on cost-efficiency, serverless scaling, and cloud-native patterns.",
        "Focus on data-driven decision making and observability-centric development."
    ]
    selected_angle = random.choice(angles)

    prompt = f"""
You are a Distinguished Staff Engineer at a Tier-1 Tech Company (Google/Meta/Netflix). Your task is to create a HYPER-PERSONALIZED, hyper-technical study roadmap that is indistinguishable from one created by a human mentor with 20 years of experience.

CRITICAL DIRECTIVES:
- NO boilerplate. NO generic "Learn the basics".
- STRICT NICHE VALIDATION: Identify the single most difficult architectural or technical challenge unique to a {target_role} (e.g., 'Hydration mismatches' for Next.js experts, 'Query planning' for DBAs, 'Cold starts' for Serverless experts). Build the entire roadmap around mastering this specific complexity.
- If the user is a "Senior", assume they know the basics and dive into Distributed Systems, Performance Tuning, and Architecture.

CURRENT STRATEGIC ANGLE: {selected_angle}

USER PROFILE:
- ROLE: {target_role}
- LEVEL: {experience_level}
- CURRENT SKILLS: {skills_str}
- WEAKNESSES: {", ".join(weak_topics) if weak_topics else "None reported"}
- FOCUS AREAS: {", ".join(focus_areas) if focus_areas else "General Mastery"}
- PROJECT PREFERENCE: {project_preference}
- LEARNING STYLE: {learning_style}
- TIME: {hours_per_week} hrs/week

YOUR OUTPUT MUST BE A JSON OBJECT WITH THESE KEYS:
{{
  "ai_roadmap_note": "A 3-sentence high-level technical strategy. Define the 'Technical North Star' for this candidate.",
  "skill_gap": ["Specific technical gaps found after analyzing their current skills vs the target role."],
  "readiness_estimate": <int 0-100>,
  "estimated_weeks": <int 4-24>,
  "priority_order": ["The most critical concepts to master first, in order."],
  "ai_resources": [
    {{"topic": "Name", "resource": "Specific Resource Name", "url": "url", "why": "Detailed technical reason why this is essential for their level."}}
  ],
  "ai_weekly_tip": "A 'secret' industry insight or a common 'senior-level' interview trap for this role.",
  "custom_phases": [
    {{"phase": 1, "name": "Strategic Phase Name", "topics": ["Topic 1", "Topic 2"], "goal": "A concrete technical deliverable."}}
  ],
  "custom_schedule": [
    {{"day": "Monday", "focus": "Deep work topic", "activities": ["Specific advanced task", "Edge-case analysis"]}}
  ],
  "project_ideas": [
    {{"name": "Project Name", "description": "A complex, production-grade system description. NO CRUD. Must involve scaling, security, or performance.", "stack": ["Tech A", "Tech B"], "difficulty": "hard"}}
  ],
  "weekly_breakdown": [
    {{"week": 1, "focus": "Weekly focus", "goal": "Weekly goal", "key_concepts": ["Concept 1", "Concept 2"], "recommended_practice": "Specific coding exercise or lab"}}
  ],
  "milestones": [
    {{"week": 4, "goal": "Technical Milestone Name", "criteria": "What must be accomplished to consider this done."}}
  ],
  "interviewer_perspective": [
    {{"question": "A senior-level situational or system design question.", "what_they_look_for": "Deep technical signals the interviewer is hunting for."}}
  ]
}}

Respond ONLY with valid JSON.
"""
    raw = await complete(prompt, SYSTEM_INTERVIEW_EXPERT, provider_override=provider, host_override=host, model_override=model, gemini_api_key_override=api_key)
    if not raw:
        return None
    result = _extract_json(raw)
    if isinstance(result, dict):
        return result
    return None


async def get_provider_status() -> dict:
    """Return current AI provider config and connectivity status."""
    provider = _active_provider()
    status = {
        "configured_provider": AI_PROVIDER,
        "active_provider": provider,
        "ollama_host": OLLAMA_HOST,
        "ollama_model": OLLAMA_MODEL,
        "gemini_model": GEMINI_MODEL,
        "gemini_key_set": bool(GEMINI_API_KEY),
        "healthy": False,
        "error": None,
    }
    if provider == "none":
        status["error"] = "No AI provider configured (AI_PROVIDER=none)"
        return status

    # Quick connectivity ping
    test = await complete("Reply with exactly: OK", "You are a test assistant.")
    if test and "ok" in test.lower():
        status["healthy"] = True
    elif test:
        status["healthy"] = True   # Got a response, even if not "OK"
        status["test_response"] = test[:80]
    else:
        status["healthy"] = False
        status["error"] = f"Provider '{provider}' did not respond to test ping"

    return status


async def ai_generate_cover_letter(
    resume_text: str,
    job_description: str,
    target_role: str,
    ai_settings: Optional[dict] = None,
) -> str:
    """Generate a highly tailored cover letter."""
    settings = ai_settings or {}
    provider = settings.get("provider") or (_active_provider() if not GEMINI_API_KEY else "gemini")
    host = settings.get("ollamaHost", OLLAMA_HOST)
    model = settings.get("ollamaModel", OLLAMA_MODEL) if provider == "ollama" else settings.get("geminiModel", GEMINI_MODEL)
    api_key = settings.get("geminiApiKey") or GEMINI_API_KEY

    jd_section = f"\nJOB DESCRIPTION:\n{job_description[:1000]}" if job_description else ""
    prompt = f"""
Write a professional, compelling, and concise cover letter for the following role.
TARGET ROLE: {target_role}{jd_section}

CANDIDATE RESUME (first 8000 chars):
{resume_text[:8000]}

The cover letter should:
1. Have a professional greeting and opening.
2. Highlight 2-3 specific achievements from the resume that perfectly match the target role/JD.
3. Be confident but not arrogant.
4. Have a strong closing statement.
5. DO NOT use placeholders like [Your Name] if the name is in the resume, try to extract it. If not found, use a generic sign-off.
Respond directly with the text of the cover letter. Do not include markdown formatting or json.
"""
    raw = await complete(prompt, SYSTEM_INTERVIEW_EXPERT, provider_override=provider, host_override=host, model_override=model, gemini_api_key_override=api_key)
    if not raw:
        return "Dear Hiring Manager,\n\nI am writing to express my strong interest in this position. Enclosed is my resume for your review.\n\nSincerely,\nCandidate"
    return raw.strip()


async def ai_critique_project(
    project_description: str,
    tech_stack: list[str],
    target_role: str,
    ai_settings: Optional[dict] = None,
) -> Optional[dict]:
    """
    Perform a deep architectural critique of a user's project.
    """
    settings = ai_settings or {}
    provider = settings.get("provider") or (_active_provider() if not GEMINI_API_KEY else "gemini")
    host = settings.get("ollamaHost", OLLAMA_HOST)
    model = settings.get("ollamaModel", OLLAMA_MODEL) if provider == "ollama" else settings.get("geminiModel", GEMINI_MODEL)
    api_key = settings.get("geminiApiKey") or GEMINI_API_KEY

    prompt = f"""
You are a Staff Systems Architect at a Tier-1 tech company. Perform a rigorous architectural critique of the following project.

PROJECT DESCRIPTION:
{project_description}

TECH STACK:
{", ".join(tech_stack)}

TARGET ROLE: {target_role}

ANALYSIS REQUIREMENTS:
1. ARCHITECTURAL SCORE: Evaluate the complexity and soundness (0-100).
2. STRENGTHS: Identify 3 high-level engineering wins.
3. VULNERABILITIES: Identify 3 technical risks, bottlenecks, or single points of failure.
4. KILLER QUESTIONS: Generate 3 extremely tough questions an interviewer would ask to "grill" the candidate on this specific architecture.
5. STAFF-LEVEL ALTERNATIVE: Suggest a more scalable or resilient way to have built one specific part of this system.

Respond with ONLY valid JSON:
{{
  "architecture_score": <int>,
  "summary": "<2-sentence technical overview>",
  "strengths": ["<strength 1>", "<strength 2>", "<strength 3>"],
  "vulnerabilities": [
    {{"risk": "<risk name>", "details": "<technical explanation>"}}
  ],
  "killer_questions": [
    {{"question": "<tough question>", "context": "<why they ask this>", "ideal_answer_signals": ["<signal 1>", "<signal 2>"]}}
  ],
  "staff_alternative": {{
    "component": "<component name>",
    "suggestion": "<the better way>",
    "benefit": "<why it's better>"
  }}
}}
"""
    raw = await complete(prompt, "You are a Staff Systems Architect and Technical Interviewer.", provider_override=provider, host_override=host, model_override=model, gemini_api_key_override=api_key)
    if not raw:
        return None
    return _extract_json(raw)
