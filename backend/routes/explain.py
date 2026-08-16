"""
RadiNova AI — Route: /explain/{modality} (Blood Test, MRI, ECG, CT Scan)
"""

from fastapi import APIRouter, UploadFile, File, HTTPException, Path
from backend.services.llm_service import llm_service

router = APIRouter(prefix="/explain", tags=["Multi-modal Scan & Lab Explanations"])

VALID_MODALITIES = {"blood", "mri", "ecg", "ct"}

@router.post("/{modality}")
async def explain_modality(
    modality: str = Path(..., description="Target modality: blood, mri, ecg, or ct"),
    file: UploadFile = File(...)
):
    """
    Accepts uploaded file (image, PDF, or text) for blood, mri, ecg, or ct.
    Extracts text, sends to LLM API (or graceful offline template fallback),
    and returns plain-language explanation with clinical hedging.
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
