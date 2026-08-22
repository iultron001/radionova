"""
RadiNova AI — Route: /assistant (Context-Aware Clinical Chat with Multi-Provider AI)
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
    apiKey: Optional[str] = None
    apiProvider: Optional[str] = None  # 'gemini', 'openai', 'claude', or 'auto'

@router.post("/assistant")
async def chat_assistant(request: AssistantRequest):
    """
    Conversational clinical assistant taking message history + active scan context + optional API key.
    Supports Google Gemini API, OpenAI GPT-4o, Anthropic Claude, and Deep Local Medical Engine.
    """
    try:
        msgs = [{"role": m.role, "content": m.content} for m in request.messages]
        result = llm_service.chat_assistant(
            messages=msgs, 
            context=request.context, 
            custom_api_key=request.apiKey,
            custom_provider=request.apiProvider
        )
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Assistant failed: {str(e)}")
