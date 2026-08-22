"""
RadiNova AI — Route: /explain/{modality} (Blood Test, Brain MRI)
"""

from fastapi import APIRouter, UploadFile, File, HTTPException, Path
from backend.services.llm_service import llm_service

router = APIRouter(prefix="/explain", tags=["Multi-modal Scan & Lab Explanations"])

VALID_MODALITIES = {"blood", "mri"}

@router.post("/{modality}")
async def explain_modality(
    modality: str = Path(..., description="Target modality: blood or mri"),
    file: UploadFile = File(...)
):
    """
    Accepts uploaded file (image, PDF, or text) for blood or mri modalities.
    Extracts text content, sends to LLM API (or graceful offline template fallback),
    and returns structured clinical explanation with doctor and patient summaries.
    """
    modality_clean = modality.lower()
    if modality_clean not in VALID_MODALITIES:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid modality '{modality}'. Must be one of: {list(VALID_MODALITIES)}"
        )

    try:
        contents = await file.read()
        extracted_text = llm_service.extract_text_from_file(contents, file.filename)
        result = llm_service.explain_modality(modality_clean, extracted_text, file.filename)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Explanation failed: {str(e)}")
