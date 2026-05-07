import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
from app.routers import evaluation, questions, resume_analysis, learning_path
from app.services.ai_provider import get_provider_status

load_dotenv()

app = FastAPI(
    title="MockMate ML Service",
    description="Advanced AI/ML microservice for interview preparation",
    version="2.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:5000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(evaluation.router, prefix="", tags=["Evaluation"])
app.include_router(questions.router, prefix="", tags=["Questions"])
app.include_router(resume_analysis.router, prefix="", tags=["Resume"])
app.include_router(learning_path.router, prefix="", tags=["Learning"])


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
