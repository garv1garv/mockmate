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
        # Fallback response if AI fails
        return {
            "architecture_score": 70,
            "summary": "AI critique unavailable. Reviewing tech stack for common patterns.",
            "strengths": ["Modern tech stack usage", "Clear project scope"],
            "vulnerabilities": [{"risk": "Unknown", "details": "Unable to perform deep analysis without AI."}],
            "killer_questions": [{"question": "Can you explain the most difficult part of this project?", "context": "General probing", "ideal_answer_signals": ["Clarity", "Honesty"]}],
            "staff_alternative": None
        }
        
    return result
