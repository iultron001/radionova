"""
RadiNova AI — Route: /api/v1/reports (Clinical Report Generation, Status, & Renaming)
"""

import sys
from pathlib import Path

ROOT_DIR = Path(__file__).resolve().parent.parent.parent.parent
if str(ROOT_DIR) not in sys.path:
    sys.path.insert(0, str(ROOT_DIR))

import uuid
import json
from datetime import datetime
from typing import Optional, Dict, Any
from fastapi import APIRouter, HTTPException, Depends, Response
from pydantic import BaseModel
from backend.db.database import get_db
from backend.api.v1.auth import get_current_doctor
from backend.services.report_service import report_service

router = APIRouter(prefix="/reports", tags=["Reports Management"])

MANDATORY_DISCLAIMER = "AI-assisted prediction / decision support — requires review by a qualified healthcare professional."

class GenerateReportRequest(BaseModel):
    study_id: Optional[str] = None
    patient_name: Optional[str] = "Anonymous Patient"
    patient_id: Optional[str] = "PAT-000000"
    modality: str
    prediction: Optional[str] = None
    confidence: Optional[float] = None
    findings: Optional[str] = ""
    impression: Optional[str] = ""
    clinical_notes: Optional[str] = ""
    doctor_signature: Optional[str] = ""
    full_data: Optional[Dict[str, Any]] = None

class RenameReportRequest(BaseModel):
    display_name: str

class FinalizeReportRequest(BaseModel):
    status: str  # 'Draft', 'Under Review', 'Finalized'
    doctor_signature: Optional[str] = None

@router.post("/generate")
async def generate_and_save_report(
    req: GenerateReportRequest,
    current_doc: dict = Depends(get_current_doctor)
):
    """
    Generates PDF clinical report via ReportLab and persists metadata in SQLite.
    Returns the binary PDF stream with headers.
    """
    try:
        report_uuid = str(uuid.uuid4())
        short_id = str(uuid.uuid4().int)[:5]
        report_code = f"RN-REPORT-{short_id}"
        display_name = f"RadiNova_{req.modality.upper()}_{datetime.utcnow().strftime('%Y%m%d_%H%M')}"
        now = datetime.utcnow().isoformat()
        
        # Build payload for PDF generator
        report_dict = req.full_data or {}
        report_dict.update({
            "report_code": report_code,
            "modality": req.modality,
            "patient_name": req.patient_name,
            "patient_id": req.patient_id,
            "doctor_name": current_doc["name"],
            "doctor_id": current_doc["doctor_id"],
            "hospital": current_doc.get("hospital", "RadiNova Medical Center"),
            "findings": req.findings,
            "impression": req.impression,
            "clinical_notes": req.clinical_notes,
            "doctor_signature": req.doctor_signature or current_doc["name"],
            "disclaimer": MANDATORY_DISCLAIMER,
            "prediction": req.prediction or report_dict.get("prediction", "N/A"),
            "confidence": req.confidence or report_dict.get("confidence", 0.0)
        })
        
        # Generate PDF Bytes
        pdf_bytes = report_service.generate_pdf(report_dict)
        
        # Persist to SQLite if study_id is provided
        if req.study_id:
            conn = get_db()
            cursor = conn.cursor()
            cursor.execute("""
            INSERT INTO reports (
                id, study_id, report_code, display_name, status,
                findings, impression, clinical_notes, doctor_signature,
                report_data, created_at, updated_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """, (
                report_uuid,
                req.study_id,
                report_code,
                display_name,
                "Draft",
                req.findings or "",
                req.impression or "",
                req.clinical_notes or "",
                req.doctor_signature or current_doc["name"],
                json.dumps(report_dict),
                now,
                now
            ))
            cursor.execute("UPDATE studies SET status = ? WHERE id = ?", ("Report Generated", req.study_id))
            conn.commit()
            conn.close()
            
        filename = f"{display_name}.pdf"
        return Response(
            content=pdf_bytes,
            media_type="application/pdf",
            headers={
                "Content-Disposition": f"attachment; filename={filename}",
                "X-Report-Code": report_code,
                "X-Report-Id": report_uuid
            }
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Report generation failed: {str(e)}")

@router.patch("/{report_id}/rename")
async def rename_report(
    report_id: str,
    req: RenameReportRequest,
    current_doc: dict = Depends(get_current_doctor)
):
    """
    Tier 2: Updates report display name while preserving internal report_code.
    """
    conn = get_db()
    cursor = conn.cursor()
    now = datetime.utcnow().isoformat()
    
    cursor.execute("""
    UPDATE reports 
    SET display_name = ?, updated_at = ?
    WHERE id = ?
    """, (req.display_name.strip(), now, report_id))
    
    if cursor.rowcount == 0:
        conn.close()
        raise HTTPException(status_code=404, detail="Report not found.")
    
    conn.commit()
    conn.close()
    return {"message": "Report renamed successfully", "display_name": req.display_name.strip()}

@router.patch("/{report_id}/finalize")
async def finalize_report(
    report_id: str,
    req: FinalizeReportRequest,
    current_doc: dict = Depends(get_current_doctor)
):
    """
    Tier 2: Updates report status (Draft -> Under Review -> Finalized).
    """
    valid_statuses = ["Draft", "Under Review", "Finalized"]
    if req.status not in valid_statuses:
        raise HTTPException(status_code=400, detail=f"Status must be one of {valid_statuses}")
    
    conn = get_db()
    cursor = conn.cursor()
    now = datetime.utcnow().isoformat()
    
    cursor.execute("""
    UPDATE reports 
    SET status = ?, doctor_signature = COALESCE(?, doctor_signature), updated_at = ?
    WHERE id = ?
    """, (req.status, req.doctor_signature, now, report_id))
    
    if cursor.rowcount == 0:
        conn.close()
        raise HTTPException(status_code=404, detail="Report not found.")
    
    conn.commit()
    conn.close()
    return {"message": f"Report status updated to {req.status}", "status": req.status}
