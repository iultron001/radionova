"""
RadiNova AI — Route: /api/v1/analysis (Chest, Fracture, MRI Analysis & Image Upload)
Integrates existing Two-Layer Gatekeeper, DenseNet-121 classifiers, Grad-CAM, and text-based MRI analysis.
Demo mode: No auth required for analysis endpoints so the frontend demo works.
"""

import sys
from pathlib import Path

ROOT_DIR = Path(__file__).resolve().parent.parent.parent.parent
if str(ROOT_DIR) not in sys.path:
    sys.path.insert(0, str(ROOT_DIR))

import uuid
import json
import base64
from datetime import datetime
from typing import Optional
from fastapi import APIRouter, UploadFile, File, Form, HTTPException
from pydantic import BaseModel
from backend.db.database import get_db
from backend.services.cv_service import cv_service
from backend.services.llm_service import llm_service

router = APIRouter(tags=["Analysis & Inferences"])

MANDATORY_DISCLAIMER = "AI-assisted prediction / decision support — requires review by a qualified healthcare professional."

class MRIReportAnalysisRequest(BaseModel):
    study_id: Optional[str] = None
    report_text: str

class LLMAnalysisRequest(BaseModel):
    modality: str
    text_content: str
    patient_name: Optional[str] = None
    patient_id: Optional[str] = None

@router.post("/upload")
async def upload_medical_image(
    file: UploadFile = File(...),
    study_id: Optional[str] = Form(None),
):
    """
    Accepts medical image (JPEG/PNG), stores record and base64 preview.
    """
    if file.content_type and not (file.content_type.startswith("image/") or file.content_type == "application/octet-stream"):
        raise HTTPException(status_code=400, detail="File must be an image format (JPEG/PNG).")
    
    contents = await file.read()
    b64 = base64.b64encode(contents).decode("utf-8")
    img_id = str(uuid.uuid4())
    now = datetime.utcnow().isoformat()
    
    if study_id:
        conn = get_db()
        cursor = conn.cursor()
        cursor.execute("""
        INSERT INTO medical_images (id, study_id, image_name, image_base64, uploaded_at)
        VALUES (?, ?, ?, ?, ?)
        """, (img_id, study_id, file.filename or "scan.png", b64, now))
        conn.commit()
        conn.close()
        
    return {
        "id": img_id,
        "filename": file.filename,
        "study_id": study_id,
        "image_base64": f"data:image/jpeg;base64,{b64}",
        "uploaded_at": now
    }

@router.post("/analysis/chest")
async def analyze_chest_xray(
    file: UploadFile = File(...),
    study_id: Optional[str] = Form(None),
):
    """
    Runs Chest X-Ray Gatekeeper + DenseNet-121 + Grad-CAM explainability overlay.
    """
    if file.content_type and not (file.content_type.startswith("image/") or file.content_type == "application/octet-stream"):
        raise HTTPException(status_code=400, detail="File must be an image (JPEG/PNG).")
    
    try:
        contents = await file.read()
        result = cv_service.analyze_chest(contents)
        result["disclaimer"] = MANDATORY_DISCLAIMER
        
        if study_id:
            conn = get_db()
            cursor = conn.cursor()
            analysis_id = str(uuid.uuid4())
            now = datetime.utcnow().isoformat()
            cursor.execute("""
            INSERT INTO analyses (
                id, study_id, modality, prediction, confidence, 
                gatekeeper_passed, gatekeeper_confidence, 
                probabilities, gradcam_image, guidance, disclaimer, created_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """, (
                analysis_id, study_id, "chest_xray",
                result.get("prediction", "UNKNOWN"),
                float(result.get("confidence", 0.0)),
                1 if result.get("gatekeeper_passed", True) else 0,
                float(result.get("gatekeeper_confidence", 1.0)),
                json.dumps(result.get("probabilities", {})),
                result.get("gradcam_overlay", "") or "",
                json.dumps(result.get("guidance", {})),
                MANDATORY_DISCLAIMER, now
            ))
            cursor.execute("UPDATE studies SET status = ? WHERE id = ?", ("Analysis Completed", study_id))
            conn.commit()
            conn.close()
            result["analysis_id"] = analysis_id
            result["study_id"] = study_id
            
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Chest analysis failed: {str(e)}")

@router.post("/analysis/fracture")
async def analyze_limb_fracture(
    file: UploadFile = File(...),
    study_id: Optional[str] = Form(None),
):
    """
    Runs Limb Fracture Gatekeeper + DenseNet-121 + Grad-CAM explainability overlay.
    """
    if file.content_type and not (file.content_type.startswith("image/") or file.content_type == "application/octet-stream"):
        raise HTTPException(status_code=400, detail="File must be an image (JPEG/PNG).")
    
    try:
        contents = await file.read()
        result = cv_service.analyze_limb(contents)
        result["disclaimer"] = MANDATORY_DISCLAIMER
        
        if study_id:
            conn = get_db()
            cursor = conn.cursor()
            analysis_id = str(uuid.uuid4())
            now = datetime.utcnow().isoformat()
            cursor.execute("""
            INSERT INTO analyses (
                id, study_id, modality, prediction, confidence,
                gatekeeper_passed, gatekeeper_confidence,
                probabilities, gradcam_image, guidance, disclaimer, created_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """, (
                analysis_id, study_id, "limb_fracture",
                result.get("prediction", "UNKNOWN"),
                float(result.get("confidence", 0.0)),
                1 if result.get("gatekeeper_passed", True) else 0,
                float(result.get("gatekeeper_confidence", 1.0)),
                json.dumps(result.get("probabilities", {})),
                result.get("gradcam_overlay", "") or "",
                json.dumps(result.get("guidance", {})),
                MANDATORY_DISCLAIMER, now
            ))
            cursor.execute("UPDATE studies SET status = ? WHERE id = ?", ("Analysis Completed", study_id))
            conn.commit()
            conn.close()
            result["analysis_id"] = analysis_id
            result["study_id"] = study_id
            
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Fracture analysis failed: {str(e)}")

@router.post("/analysis/mri_image")
async def analyze_mri_image(
    file: UploadFile = File(...),
    study_id: Optional[str] = Form(None),
):
    """
    Runs Brain MRI DenseNet-121 + Grad-CAM explainability overlay.
    """
    if file.content_type and not (file.content_type.startswith("image/") or file.content_type == "application/octet-stream"):
        raise HTTPException(status_code=400, detail="File must be an image (JPEG/PNG).")
    
    try:
        contents = await file.read()
        result = cv_service.analyze_mri(contents)
        result["disclaimer"] = MANDATORY_DISCLAIMER
        
        if study_id:
            conn = get_db()
            cursor = conn.cursor()
            analysis_id = str(uuid.uuid4())
            now = datetime.utcnow().isoformat()
            cursor.execute("""
            INSERT INTO analyses (
                id, study_id, modality, prediction, confidence,
                gatekeeper_passed, gatekeeper_confidence,
                probabilities, gradcam_image, guidance, disclaimer, created_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """, (
                analysis_id, study_id, "mri",
                result.get("prediction", "UNKNOWN"),
                float(result.get("confidence", 0.0)),
                1 if result.get("gatekeeper_passed", True) else 0,
                float(result.get("gatekeeper_confidence", 1.0)),
                json.dumps(result.get("probabilities", {})),
                result.get("gradcam_overlay", "") or "",
                json.dumps(result.get("guidance", {})),
                MANDATORY_DISCLAIMER, now
            ))
            cursor.execute("UPDATE studies SET status = ? WHERE id = ?", ("Analysis Completed", study_id))
            conn.commit()
            conn.close()
            result["analysis_id"] = analysis_id
            result["study_id"] = study_id
            
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"MRI image analysis failed: {str(e)}")

@router.post("/analysis/mri")
async def analyze_mri_report(req: MRIReportAnalysisRequest):
    """
    Tier 2: Text-based MRI / Radiology Report analysis using LLM service.
    """
    try:
        result = llm_service.explain_modality(
            modality="mri",
            extracted_text=req.report_text,
            custom_provider="auto"
        )
        result["analysis_type"] = "text-based report analysis — not image analysis"
        result["disclaimer"] = MANDATORY_DISCLAIMER
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"MRI report analysis failed: {str(e)}")

@router.post("/analysis/llm")
async def analyze_llm_modality(req: LLMAnalysisRequest):
    """
    Tier 2: LLM-based analysis for CT, ECG, Blood Panel, MRI text reports.
    """
    try:
        result = llm_service.explain_modality(
            modality=req.modality,
            extracted_text=req.text_content,
            custom_provider="auto"
        )
        result["analysis_type"] = f"LLM text-based analysis — {req.modality}"
        result["disclaimer"] = MANDATORY_DISCLAIMER
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"LLM analysis failed: {str(e)}")
