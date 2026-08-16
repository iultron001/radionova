"""
RadiNova AI — Route: /predict (Chest X-Ray & Limb Fracture)
"""

from fastapi import APIRouter, UploadFile, File, HTTPException
from backend.services.cv_service import cv_service

router = APIRouter(prefix="/predict", tags=["Computer Vision Inference"])

@router.post("/chest")
async def predict_chest(file: UploadFile = File(...)):
    """
    Accepts Chest X-Ray radiograph image (JPEG/PNG).
    Runs DenseNet-121 inference, generates Grad-CAM explainability heatmap overlay,
    and returns rule-based clinical guidance.
    """
    if file.content_type and not (file.content_type.startswith("image/") or file.content_type == "application/octet-stream"):
        raise HTTPException(status_code=400, detail="File must be an image (JPEG/PNG).")
    try:
        contents = await file.read()
        result = cv_service.analyze_chest(contents)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Inference failed: {str(e)}")

@router.post("/limb")
async def predict_limb(file: UploadFile = File(...)):
    """
    Accepts Limb bone radiograph image (JPEG/PNG).
    Runs DenseNet-121 fracture detection, Grad-CAM heatmap, and clinical guidance.
    """
    if file.content_type and not (file.content_type.startswith("image/") or file.content_type == "application/octet-stream"):
        raise HTTPException(status_code=400, detail="File must be an image (JPEG/PNG).")
    try:
        contents = await file.read()
        result = cv_service.analyze_limb(contents)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Limb inference failed: {str(e)}")
