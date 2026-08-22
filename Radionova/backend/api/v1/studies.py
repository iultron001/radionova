"""
RadiNova AI — Route: /api/v1/studies (Doctor Studies Management)
"""

import uuid
import json
from datetime import datetime
from typing import Optional, List, Dict, Any
from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from backend.db.database import get_db
from backend.api.v1.auth import get_current_doctor

router = APIRouter(prefix="/studies", tags=["Doctor Studies"])

class CreateStudyRequest(BaseModel):
    patient_name: str
    patient_id: Optional[str] = None
    modality: str
    notes: Optional[str] = ""

@router.get("")
async def list_studies(current_doc: dict = Depends(get_current_doctor)):
    """Retrieve all studies owned by the authenticated doctor."""
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("""
    SELECT s.*, 
           (SELECT COUNT(*) FROM medical_images WHERE study_id = s.id) as image_count,
           (SELECT prediction FROM analyses WHERE study_id = s.id ORDER BY created_at DESC LIMIT 1) as latest_prediction,
           (SELECT confidence FROM analyses WHERE study_id = s.id ORDER BY created_at DESC LIMIT 1) as latest_confidence,
           (SELECT status FROM reports WHERE study_id = s.id ORDER BY created_at DESC LIMIT 1) as report_status
    FROM studies s
    WHERE s.doctor_id = ?
    ORDER BY s.created_at DESC
    """, (current_doc["id"],))
    
    rows = cursor.fetchall()
    conn.close()
    
    studies = []
    for r in rows:
        studies.append(dict(r))
    return {"studies": studies}

@router.post("")
async def create_study(req: CreateStudyRequest, current_doc: dict = Depends(get_current_doctor)):
    """Create a new study for the doctor."""
    conn = get_db()
    cursor = conn.cursor()
    
    study_id = str(uuid.uuid4())
    patient_id = req.patient_id or f"PAT-{str(uuid.uuid4().int)[:6]}"
    now = datetime.utcnow().isoformat()
    study_date = datetime.utcnow().strftime("%Y-%m-%d %H:%M")
    
    cursor.execute("""
    INSERT INTO studies (id, doctor_id, patient_name, patient_id, modality, study_date, status, notes, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    """, (
        study_id,
        current_doc["id"],
        req.patient_name.strip(),
        patient_id,
        req.modality,
        study_date,
        "Pending Analysis",
        req.notes or "",
        now
    ))
    conn.commit()
    conn.close()
    
    return {
        "id": study_id,
        "doctor_id": current_doc["id"],
        "patient_name": req.patient_name.strip(),
        "patient_id": patient_id,
        "modality": req.modality,
        "study_date": study_date,
        "status": "Pending Analysis",
        "notes": req.notes or "",
        "created_at": now
    }

@router.get("/{study_id}")
async def get_study_details(study_id: str, current_doc: dict = Depends(get_current_doctor)):
    """Get full study record with associated image, analysis, and report."""
    conn = get_db()
    cursor = conn.cursor()
    
    cursor.execute("SELECT * FROM studies WHERE id = ? AND doctor_id = ?", (study_id, current_doc["id"]))
    study_row = cursor.fetchone()
    if not study_row:
        conn.close()
        raise HTTPException(status_code=404, detail="Study not found.")
    
    study = dict(study_row)
    
    # Fetch images
    cursor.execute("SELECT * FROM medical_images WHERE study_id = ? ORDER BY uploaded_at DESC", (study_id,))
    images = [dict(img) for img in cursor.fetchall()]
    study["images"] = images
    
    # Fetch latest analysis
    cursor.execute("SELECT * FROM analyses WHERE study_id = ? ORDER BY created_at DESC LIMIT 1", (study_id,))
    analysis_row = cursor.fetchone()
    if analysis_row:
        analysis = dict(analysis_row)
        try:
            analysis["probabilities"] = json.loads(analysis.get("probabilities", "{}"))
            analysis["guidance"] = json.loads(analysis.get("guidance", "{}"))
        except Exception:
            pass
        study["analysis"] = analysis
    else:
        study["analysis"] = None
        
    # Fetch report
    cursor.execute("SELECT * FROM reports WHERE study_id = ? ORDER BY created_at DESC LIMIT 1", (study_id,))
    report_row = cursor.fetchone()
    if report_row:
        rep = dict(report_row)
        try:
            rep["report_data"] = json.loads(rep.get("report_data", "{}"))
        except Exception:
            pass
        study["report"] = rep
    else:
        study["report"] = None
        
    conn.close()
    return study
