import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
from app.routers import evaluation, questions, resume_analysis, learning_path, project_critique
from app.services.ai_provider import get_provider_status

load_dotenv()

app = FastAPI(
    title="MockMate ML Service",
    description="Advanced AI/ML microservice for interview preparation",
    version="2.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # Allow all for simplicity in microservice environment
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(evaluation.router, prefix="", tags=["Evaluation"])
app.include_router(questions.router, prefix="", tags=["Questions"])
app.include_router(resume_analysis.router, prefix="", tags=["Resume"])
app.include_router(learning_path.router, prefix="", tags=["Learning"])
app.include_router(project_critique.router, prefix="", tags=["Project Critique"])


@app.get("/health")
async def health_check():
    return {
        "status": "healthy",
        "service": "MockMate ML Service",
        "version": "2.0.0",
    }


@app.get("/ai-status")
async def ai_status():
    """Check which AI provider is configured and whether it responds."""
    return await get_provider_status()


@app.get("/")
async def root():
    return {"message": "MockMate ML Service is running", "docs": "/docs"}


if __name__ == "__main__":
    import uvicorn
    port = int(os.getenv("PORT", 8000))
    uvicorn.run("main:app", host="0.0.0.0", port=port, reload=False)
