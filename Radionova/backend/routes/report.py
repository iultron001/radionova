"""
RadiNova AI — Route: /report (PDF Clinical Report Generation)
"""

from typing import Dict, Any
from fastapi import APIRouter, HTTPException, Response
from pydantic import BaseModel
from reports.generator import report_generator

router = APIRouter(tags=["Clinical Reporting Engine"])

@router.post("/report")
async def generate_report(report_data: Dict[str, Any]):
    """
    Accepts structured prediction/explanation result and renders a PDF document via ReportLab.
    """
    try:
        pdf_bytes = report_generator.generate_pdf(report_data)
        modality = report_data.get("modality", "clinical_study")
        filename = f"RadiNova_Report_{modality.upper()}.pdf"
        
        return Response(
            content=pdf_bytes,
            media_type="application/pdf",
            headers={"Content-Disposition": f"attachment; filename={filename}"}
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"PDF generation failed: {str(e)}")
