"""
RadiNova AI — FastAPI Main Application Entrypoint
"""

import sys
from pathlib import Path

# Ensure root workspace directory is in sys.path
ROOT_DIR = Path(__file__).resolve().parent.parent
if str(ROOT_DIR) not in sys.path:
    sys.path.insert(0, str(ROOT_DIR))

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from backend.config import settings
from backend.routes import predict, explain, assistant, report, health, gemini_chat
from backend.api.v1 import api_v1_router
from backend.db.database import init_db

# Initialize database schema
init_db()

app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    description="Medical Imaging Analysis & Clinical Decision Support System with DenseNet-121, Grad-CAM, and Multi-modal LLM Explanations.",
    docs_url="/docs",
    redoc_url="/redoc"
)

# CORS Configuration for Swiss UI Frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include API Routers (v1 and root routes)
app.include_router(api_v1_router)
app.include_router(health.router)
app.include_router(predict.router)
app.include_router(explain.router)
app.include_router(assistant.router)
app.include_router(report.router)
app.include_router(gemini_chat.router)

@app.get("/")
async def root():
    return {
        "message": "Welcome to RadiNova AI API",
        "docs": "/docs",
        "health": "/health",
        "disclaimer": "For educational/research purposes only — not a substitute for professional medical diagnosis."
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("backend.main:app", host=settings.HOST, port=settings.PORT, reload=settings.DEBUG)
