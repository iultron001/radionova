"""
RadiNova AI — Backend Configuration
"""

import os
from pathlib import Path
from typing import List
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    PROJECT_NAME: str = "RadiNova AI"
    VERSION: str = "1.0.0"
    DEBUG: bool = True
    PORT: int = 8000
    HOST: str = "0.0.0.0"
    CORS_ORIGINS: List[str] = ["http://localhost:5173", "http://localhost:3000", "*"]

    # Model Checkpoints
    CHEST_MODEL_PATH: str = "model/weights/chest_densenet121.pth"
    LIMB_MODEL_PATH: str = "model/weights/limb_densenet121.pth"
    RULES_PATH: str = "rules/clinical_guidance.json"

    # LLM API Keys
    OPENAI_API_KEY: str = ""
    ANTHROPIC_API_KEY: str = ""
    GEMINI_API_KEY: str = ""

    # Hardware Device
    DEVICE: str = "auto"

    class Config:
        env_file = ".env"
        extra = "ignore"

settings = Settings()
