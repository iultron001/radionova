"""
RadiNova AI — Route: /api/v1/gemini/symptom_chat
Endpoints for multi-turn Gemini-powered clinical symptom interview and diagnosis report generation.
"""

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional
from backend.services.gemini_service import gemini_symptom_service

router = APIRouter(prefix="/api/v1/gemini/symptom_chat", tags=["Gemini Symptom Interviewer"])


class StartSessionResponse(BaseModel):
    session_id: str
    session_code: str
    message: str


class ChatMessageRequest(BaseModel):
    session_id: str
    message: str
    custom_api_key: Optional[str] = None


@router.post("/session")
async def start_symptom_chat_session():
    """Starts a new interactive symptom interview session."""
    try:
        res = gemini_symptom_service.start_session()
        return res
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to start symptom chat: {str(e)}")


@router.post("/message")
async def process_symptom_message(req: ChatMessageRequest):
    """
    Sends the user's symptom message to Gemini.
    Returns:
    - reply: next interview question
    - suspected_conditions: ranked differential diagnoses with confidence percentages
    - primary_problem: summary of what is happening to the patient
    - is_complete: whether the interview is finished
    - final_report: full confirmed symptom and diagnosis report when complete
    """
    if not req.message.strip():
        raise HTTPException(status_code=400, detail="Message cannot be empty.")

    try:
        result = gemini_symptom_service.process_message(
            session_id=req.session_id,
            user_message=req.message.strip(),
            custom_api_key=req.custom_api_key
        )
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Symptom chat processing error: {str(e)}")
