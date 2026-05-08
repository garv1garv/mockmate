from fastapi import APIRouter
from pydantic import BaseModel
from typing import Optional, List, Dict
import random

from app.services.ai_provider import ai_generate_learning_path

router = APIRouter()


class LearningPathRequest(BaseModel):
    target_role: str
    current_skills: Optional[List[str]] = []
    experience_level: Optional[str] = "fresher"
    weak_topics: Optional[List[str]] = []
    available_hours_per_week: Optional[int] = 10
    ai_settings: Optional[Dict] = None


ROLE_REQUIREMENTS = {
    "software engineer": {
        "core": ["Data Structures", "Algorithms", "System Design", "OOP", "Databases"],
        "frontend": ["HTML/CSS", "JavaScript", "React", "TypeScript", "REST APIs"],
        "backend": ["Node.js/Python", "Databases", "APIs", "Authentication", "Caching"],
        "devops": ["Linux", "Docker", "CI/CD", "Cloud (AWS/GCP)"],
        "soft": ["Communication", "Problem Solving", "Teamwork", "Git Workflow"],
    },
    "frontend developer": {
        "core": ["JavaScript Mastery", "React/Vue/Angular", "HTML5 Semantics", "CSS Grid/Flexbox", "TypeScript"],
        "advanced": ["State Management (Redux/Zustand)", "Performance Optimization", "Web Vitals", "Next.js", "Module Bundlers"],
        "testing": ["Jest", "React Testing Library", "Cypress"],
        "ui/ux": ["Figma Basics", "Responsive Design", "Accessibility (a11y)"],
        "soft": ["Visual Communication", "Empathy", "Attention to Detail"],
    },
    "backend developer": {
        "core": ["Server-side Languages (Node/Go/Python)", "Database Design", "API Design (REST/GraphQL)", "Auth (JWT/OAuth)"],
        "infrastructure": ["Microservices", "Message Queues (Kafka/RabbitMQ)", "Caching (Redis)", "Docker", "Kubernetes"],
        "security": ["OWASP Top 10", "Data Encryption", "Rate Limiting"],
        "monitoring": ["Logging", "APM Tools", "Unit/Integration Testing"],
        "soft": ["Systems Thinking", "Technical Writing", "API Documentation"],
    },
    "fullstack developer": {
        "core": ["MERN/T3 Stack", "Database Schema Design", "State Management", "API Integration", "Deployment"],
        "concepts": ["Authentication", "End-to-End Testing", "Git Flow", "Agile Methodologies"],
        "soft": ["Time Management", "Versatility", "Self-Teaching"],
    },
    "devops engineer": {
        "core": ["Linux Administration", "Infrastructure as Code (Terraform/Ansible)", "CI/CD Pipelines", "Docker/K8s"],
        "cloud": ["AWS/Azure/GCP", "Serverless", "Networking Fundamentals", "Identity Management"],
        "monitoring": ["Prometheus", "Grafana", "ELK Stack", "SRE Principles"],
        "soft": ["Automation Mindset", "On-call Communication", "Collaboration"],
    },
    "data scientist": {
        "core": ["Statistics", "Machine Learning", "Python", "SQL", "Data Visualization"],
        "ml": ["scikit-learn", "TensorFlow/PyTorch", "Feature Engineering", "Model Evaluation"],
        "tools": ["Jupyter", "Pandas", "NumPy", "Matplotlib", "Apache Spark"],
        "soft": ["Business Communication", "Research Skills", "Experimentation"],
    },
    "ai engineer": {
        "core": ["Deep Learning", "Natural Language Processing", "Computer Vision", "MLOps", "Vector Databases"],
        "tools": ["LangChain", "OpenAI API", "HuggingFace", "PyTorch", "Docker for ML"],
        "soft": ["Ethical AI", "Research Translation", "Continuous Learning"],
    },
    "product manager": {
        "core": ["Product Strategy", "User Research", "Data Analysis", "Roadmapping"],
        "technical": ["Basic SQL", "API Understanding", "Analytics Tools", "A/B Testing"],
        "soft": ["Stakeholder Management", "Communication", "Prioritization", "Leadership"],
    },
}


@router.post("/generate-learning-path")
async def generate_learning_path(request: LearningPathRequest):
    """Generate a personalised learning path — rule-based structure + AI coaching."""

    role_key     = request.target_role.lower()
    requirements = ROLE_REQUIREMENTS.get(role_key, ROLE_REQUIREMENTS["software engineer"])

    all_required   = [topic for topics in requirements.values() for topic in topics]
    skill_gap      = [t for t in all_required if t.lower() not in [s.lower() for s in request.current_skills]]
    priority_topics = request.weak_topics + [t for t in skill_gap if t not in request.weak_topics]

    topics_count    = len(skill_gap)
    hours_per_topic = 8 if request.experience_level == "fresher" else 5
    total_hours     = topics_count * hours_per_topic
    weeks_needed    = max(4, round(total_hours / max(request.available_hours_per_week, 1)))

    daily_schedule = []
    days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"]
    for i, day in enumerate(days):
        if i < 5:
            daily_schedule.append({
                "day":        day,
                "focus":      priority_topics[i % len(priority_topics)] if priority_topics else "General Review",
                "hours":      min(3, request.available_hours_per_week // 5),
                "activities": ["Study concepts", "Practice problems", "Code implementation"],
            })
        else:
            daily_schedule.append({
                "day":        day,
                "focus":      "Mock Interviews & Projects",
                "hours":      max(2, request.available_hours_per_week // 7),
                "activities": ["Full mock interview", "Build mini project", "Review weak areas"],
            })

    resources = {
        "Data Structures": [
            {"title": "LeetCode 75",       "url": "https://leetcode.com", "type": "practice"},
            {"title": "CLRS Algorithms",   "url": "#",                  "type": "book"},
        ],
        "System Design": [
            {"title": "System Design Primer",                "url": "https://github.com/donnemartin/system-design-primer", "type": "article"},
            {"title": "Designing Data-Intensive Applications", "url": "#", "type": "book"},
        ],
        "default": [
            {"title": "FreeCodeCamp",    "url": "https://freecodecamp.org",   "type": "course"},
            {"title": "The Odin Project", "url": "https://theodinproject.com", "type": "course"},
        ],
    }

    # ── Phase Generation (Dynamic grouping based on skill gaps) ──
    num_phases = 3
    phase_topics = [priority_topics[i::num_phases] for i in range(num_phases)]
    
    phases = []
    phase_names = [f"Mastering {priority_topics[0] if priority_topics else 'Fundamentals'}", "Deep Dive & Implementation", "Advanced Optimization & Interview Prep"]
    
    for i in range(num_phases):
        phases.append({
            "phase": i + 1,
            "name": phase_names[i],
            "duration_weeks": max(1, weeks_needed // num_phases),
            "topics": phase_topics[i],
            "goal": f"Master {', '.join(phase_topics[i][:2])} and related concepts."
        })

    # ── Daily Schedule (Dynamic allocation of weak topics) ──
    daily_schedule = []
    days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"]
    
    # Use weak topics for early week focus
    weekly_focus_pool = (request.weak_topics * 3 + priority_topics * 2 + ["System Design", "Mock Interview"])
    
    for i, day in enumerate(days):
        focus = weekly_focus_pool[i] if i < len(weekly_focus_pool) else "Comprehensive Review"
        daily_schedule.append({
            "day": day,
            "focus": focus,
            "hours": max(1, request.available_hours_per_week // 7),
            "activities": [
                f"Deep dive into {focus}",
                f"Practical {focus} exercise",
                "Review yesterday's weak points"
            ] if i < 5 else [f"Hands-on {focus} project", "Full mock interview session"]
        })

    resources = {
        "Data Structures": [
            {"title": "LeetCode 75",       "url": "https://leetcode.com", "type": "practice"},
            {"title": "CLRS Algorithms",   "url": "#",                  "type": "book"},
        ],
        "System Design": [
            {"title": "System Design Primer",                "url": "https://github.com/donnemartin/system-design-primer", "type": "article"},
            {"title": "Designing Data-Intensive Applications", "url": "#", "type": "book"},
        ],
        "default": [
            {"title": "FreeCodeCamp",    "url": "https://freecodecamp.org",   "type": "course"},
            {"title": "The Odin Project", "url": "https://theodinproject.com", "type": "course"},
        ],
    }

    base_path = {
        "skill_gap":       skill_gap,
        "estimated_weeks": weeks_needed,
    }

    # ── AI personalisation (Ollama / Gemini) ──────────────────────────────
    ai_result = await ai_generate_learning_path(
        target_role=request.target_role,
        current_skills=list(request.current_skills or []),
        experience_level=request.experience_level or "fresher",
        weak_topics=list(request.weak_topics or []),
        hours_per_week=request.available_hours_per_week or 10,
        base_path=base_path,
        ai_settings=request.ai_settings,
    )

    readiness = max(10, min(90, (len(request.current_skills) / max(len(all_required), 1)) * 100))

    return {
        "target_role":       request.target_role,
        "current_level":     request.experience_level,
        "skill_gap":         skill_gap,
        "priority_topics":   priority_topics[:10],
        "estimated_weeks":   weeks_needed,
        "total_study_hours": total_hours,
        "phases":            ai_result.get("custom_phases") if ai_result and "custom_phases" in ai_result else phases,
        "daily_schedule":    ai_result.get("custom_schedule") if ai_result and "custom_schedule" in ai_result else daily_schedule,
        "resources":         resources,
        "readiness_estimate": readiness,
        "milestones": [
            {"week": weeks_needed // 4,      "goal": "Complete foundation modules"},
            {"week": weeks_needed // 2,      "goal": "Solve 50 LeetCode problems"},
            {"week": weeks_needed * 3 // 4,  "goal": "Complete 5 mock interviews"},
            {"week": weeks_needed,           "goal": "Interview ready!"},
        ],
        **({
            "ai_roadmap_note":  ai_result.get("ai_roadmap_note"),
            "ai_resources":     ai_result.get("ai_resources", []),
            "ai_weekly_tip":    ai_result.get("ai_weekly_tip"),
            "ai_priority_order": ai_result.get("priority_order", []),
            "ai_project_ideas": ai_result.get("project_ideas", []),
            "ai_weekly_breakdown": ai_result.get("weekly_breakdown", []),
            "ai_powered":       True,
        } if ai_result else {"ai_powered": False}),
    }
