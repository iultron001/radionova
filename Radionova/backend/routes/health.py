"""
RadiNova AI — Route: /health (System Diagnostics)
"""

import torch
from fastapi import APIRouter
from backend.config import settings
from backend.services.cv_service import cv_service
from backend.services.llm_service import llm_service

router = APIRouter(tags=["Health & Diagnostics"])

@router.get("/health")
async def health_check():
    """
    Returns system health, PyTorch device, model status, and LLM configuration.
    """
    return {
        "status": "healthy",
        "service": settings.PROJECT_NAME,
        "version": settings.VERSION,
        "device": str(cv_service.device),
        "cuda_available": torch.cuda.is_available(),
        "models": {
            "chest_xray_densenet121": "loaded",
            "limb_fracture_densenet121": "loaded",
            "brain_mri_densenet121": "loaded",
            "breast_cancer_densenet121": "loaded",
            "gatekeeper_engine": "active",
            "gradcam_engine": "active"
        },
        "llm_api_configured": llm_service.api_key_available,
        "active_modalities": [
            {"id": "chest_xray", "name": "Chest Radiography", "type": "Deep Learning (DenseNet-121 + Grad-CAM)"},
            {"id": "blood", "name": "Hematology & Metabolic Panel", "type": "Dual-Language Clinical Synthesis"},
            {"id": "limb_fracture", "name": "Limb & Bone Fracture", "type": "Deep Learning (DenseNet-121 + Grad-CAM)"},
            {"id": "mri", "name": "Brain MRI Neuroimaging", "type": "Deep Learning + Clinical Report"},
            {"id": "breast_cancer", "name": "Breast Cancer Mammography", "type": "Deep Learning (DenseNet-121 + BIRADS)"}
        ],
        "disclaimer": "For educational/research purposes only — not a substitute for professional medical diagnosis."
    }
