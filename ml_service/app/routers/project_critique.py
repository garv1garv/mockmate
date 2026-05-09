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
        # Improved Fallback response if AI fails - use heuristics on tech stack
        tech = [t.lower() for t in req.tech_stack]
        
        strengths = ["Modern tech stack usage", "Clear project scope"]
        vulnerabilities = [{"risk": "Unknown", "details": "AI analysis currently unavailable. Check your API key settings."}]
        killer_questions = [{"question": "Can you explain the most difficult part of this project?", "context": "General probing", "ideal_answer_signals": ["Clarity", "Honesty"]}]
        
        # Add some heuristic feedback
        if "react" in tech or "vue" in tech or "next.js" in tech:
            strengths.append("Component-based frontend architecture")
        if "node.js" in tech or "python" in tech or "go" in tech:
            strengths.append("Asynchronous backend processing")
        if "redis" in tech:
            strengths.append("High-performance caching layer")
        if "docker" in tech or "kubernetes" in tech:
            strengths.append("Containerized deployment strategy")
            
        if "python" in tech and "javascript" in tech:
            vulnerabilities.append({"risk": "Cross-language overhead", "details": "Managing data consistency and serialization between Python and JS services."})
        if len(tech) > 8:
            vulnerabilities.append({"risk": "Micro-management overhead", "details": "High tech-stack diversity may increase maintenance and deployment complexity."})
            
        return {
            "architecture_score": 75,
            "summary": "AI critique currently unavailable. Using heuristic pattern analysis based on your tech stack.",
            "strengths": strengths[:3],
            "vulnerabilities": vulnerabilities,
            "killer_questions": killer_questions + [
                {"question": "How did you handle the integration between different parts of your stack?", "context": "Integration patterns", "ideal_answer_signals": ["API Design", "Error Handling"]}
            ],
            "staff_alternative": {
                "component": "System Infrastructure",
                "suggestion": "Consider implementing a more robust observability stack (e.g., ELK or Prometheus) as you scale.",
                "benefit": "Improved debugging and system transparency."
            }
        }
        
    return result
