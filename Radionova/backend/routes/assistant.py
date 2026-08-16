"""
RadiNova AI — Route: /assistant (Context-Aware Clinical Chat)
"""

from typing import List, Dict, Any, Optional
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from backend.services.llm_service import llm_service

router = APIRouter(tags=["Clinical Chat Assistant"])

class MessageItem(BaseModel):
    role: str
    content: str

class AssistantRequest(BaseModel):
    messages: List[MessageItem]
    context: Optional[Dict[str, Any]] = None

@router.post("/assistant")
async def chat_assistant(request: AssistantRequest):
    """
    Conversational clinical assistant taking message history + active scan context.
    """
    try:
        msgs = [{"role": m.role, "content": m.content} for m in request.messages]
        result = llm_service.chat_assistant(msgs, request.context)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Assistant failed: {str(e)}")
