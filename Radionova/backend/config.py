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
    MRI_MODEL_PATH: str = "model/weights/mri_densenet121.pth"
    CHEST_GATEKEEPER_PATH: str = "model/weights/chest_gatekeeper.pth"
    LIMB_GATEKEEPER_PATH: str = "model/weights/limb_gatekeeper.pth"
    MRI_GATEKEEPER_PATH: str = "model/weights/mri_gatekeeper.pth"
    BREAST_CANCER_MODEL_PATH: str = "model/weights/breast_cancer_densenet121.pth"
    BREAST_CANCER_GATEKEEPER_PATH: str = "model/weights/breast_cancer_gatekeeper.pth"
    RULES_PATH: str = "rules/clinical_guidance.json"

    # Layer 1: Diagnostic Confidence Gate Thresholds (Configurable per model)
    CHEST_CONFIDENCE_THRESHOLD: float = 0.70
    LIMB_CONFIDENCE_THRESHOLD: float = 0.70
    MRI_CONFIDENCE_THRESHOLD: float = 0.70

    # Layer 2: Modality Gatekeeper Thresholds (Configurable per gatekeeper)
    CHEST_GATEKEEPER_THRESHOLD: float = 0.65
    LIMB_GATEKEEPER_THRESHOLD: float = 0.65
    MRI_GATEKEEPER_THRESHOLD: float = 0.65
    BREAST_CANCER_CONFIDENCE_THRESHOLD: float = 0.70
    BREAST_CANCER_GATEKEEPER_THRESHOLD: float = 0.65

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
