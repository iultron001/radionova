"""
RadiNova AI — Route: /predict (Chest X-Ray, Limb Fracture, Brain MRI, Breast Cancer)
"""

from fastapi import APIRouter, UploadFile, File, HTTPException
from backend.services.cv_service import cv_service
from backend.services.breast_cancer_service import breast_cancer_service

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

@router.post("/mri")
async def predict_mri(file: UploadFile = File(...)):
    """
    Accepts Brain MRI neuroimaging scan (JPEG/PNG).
    Runs DenseNet-121 lesion/tumor detection, Grad-CAM heatmap, and neuro clinical guidance.
    MRI Gatekeeper (Layer 2) validates the image before running the diagnostic model.
    """
    if file.content_type and not (file.content_type.startswith("image/") or file.content_type == "application/octet-stream"):
        raise HTTPException(status_code=400, detail="File must be an image (JPEG/PNG).")
    try:
        contents = await file.read()
        result = cv_service.analyze_mri(contents)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Brain MRI inference failed: {str(e)}")

@router.post("/breast_cancer")
async def predict_breast_cancer(file: UploadFile = File(...)):
    """
    Accepts Mammogram image (JPEG/PNG/DICOM).
    Runs DenseNet-121 BENIGN/MALIGNANT classification with:
    - Layer 2: Mammography domain gatekeeper validation
    - Layer 1: Confidence threshold gate
    - Grad-CAM focal mass heatmap
    - Dual doctor/patient language summaries + BIRADS classification
    """
    if file.content_type and not (file.content_type.startswith("image/") or file.content_type == "application/octet-stream"):
        raise HTTPException(status_code=400, detail="File must be an image (JPEG/PNG/DICOM).")
    try:
        contents = await file.read()
        result = breast_cancer_service.analyze(contents)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Breast cancer screening failed: {str(e)}")

