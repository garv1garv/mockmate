from fastapi import APIRouter
from pydantic import BaseModel
from typing import Optional, List, Dict
from app.services.ai_provider import ai_critique_project

router = APIRouter()

class ProjectCritiqueRequest(BaseModel):
    project_description: str
    tech_stack: List[str] = []
    target_role: Optional[str] = "Software Engineer"
    ai_settings: Optional[Dict] = {}

@router.post("/critique-project")
async def critique_project(req: ProjectCritiqueRequest):
    """
    ML Route: Deep architectural analysis and "killer question" generation for a project.
    """
    result = await ai_critique_project(
        project_description=req.project_description,
        tech_stack=req.tech_stack,
        target_role=req.target_role,
        ai_settings=req.ai_settings
    )
    
    if not result:
        # ── DEEP HEURISTIC ENGINE (No AI Fallback) ───────────────────────────
        # This provides high-quality, specific feedback even when Gen AI is offline.
        tech = [t.lower() for t in req.tech_stack]
        role = req.target_role.lower()
        
        strengths = ["Technical stack alignment", "Defined architectural scope"]
        vulnerabilities = []
        killer_questions = []
        
        # 1. Tech-Specific Strengths & Risks
        if any(x in tech for x in ["c++", "rust", "c"]):
            strengths.append("High-performance systems programming")
            vulnerabilities.append({"risk": "Memory Safety", "details": "Manual memory management or complex ownership patterns may lead to leaks or segmentation faults."})
            killer_questions.append({"question": "How do you ensure memory safety and prevent race conditions in your implementation?", "context": "Systems integrity", "ideal_answer_signals": ["RAII", "Smart Pointers", "Mutexes"]})
            
        if any(x in tech for x in ["react", "vue", "next.js"]):
            strengths.append("Modern component-based frontend")
            vulnerabilities.append({"risk": "State Complexity", "details": "Unmanaged prop-drilling or inefficient re-renders could degrade user experience as the project scales."})
            killer_questions.append({"question": "How do you optimize render performance and manage complex global state?", "context": "Frontend scaling", "ideal_answer_signals": ["Memoization", "Context API/Redux", "Code Splitting"]})

        if any(x in tech for x in ["node.js", "python", "go", "java"]):
            strengths.append("Scalable backend architecture")
            vulnerabilities.append({"risk": "I/O Bottlenecks", "details": "Improperly handled asynchronous operations or database connection pooling may limit throughput."})
            killer_questions.append({"question": "How would you handle a 10x increase in traffic for this specific backend?", "context": "Scalability", "ideal_answer_signals": ["Horizontal Scaling", "Load Balancing", "Caching"]})

        # 2. Role-Specific Logic
        if "backend" in role or "engineer" in role:
            killer_questions.append({"question": "What is the single point of failure in this architecture, and how would you remove it?", "context": "Reliability", "ideal_answer_signals": ["Redundancy", "Failover"]})
        
        # Ensure we have enough data
        if not vulnerabilities:
            vulnerabilities.append({"risk": "Standardization", "details": "Ensure the project follows industry-standard linting and documentation patterns."})
        if len(killer_questions) < 2:
            killer_questions.append({"question": "What technical trade-off was the hardest to make during development?", "context": "Decision making", "ideal_answer_signals": ["Clarity", "Trade-off analysis"]})

        return {
            "architecture_score": 82 if len(tech) > 2 else 70,
            "summary": "Architectural Heuristics Active: Analyzing system patterns based on your specific tech stack.",
            "strengths": strengths[:4],
            "vulnerabilities": vulnerabilities[:3],
            "killer_questions": killer_questions[:3],
            "staff_alternative": {
                "component": "Infrastructure Layer" if "backend" in role else "Presentation Layer",
                "suggestion": "Implement a robust observability layer (Prometheus/ELK) to detect silent failures.",
                "benefit": "Moves the project from 'Functional' to 'Production-Ready'."
            }
        }
        
    return result
