"""
RadiNova AI — Route: /api/v1/patient (Patient Triage Assistant & Session Management)
No authentication required for patients.
Features:
- Conversational turn capping (6-8 turns max)
- Fallback resilience if LLM times out or rate limits
- Red-flag screening (chest pain, shortness of breath, severe neuro signs)
- Strict structured symptom extraction
- Non-diagnostic concern level estimation
"""

import uuid
import json
from datetime import datetime
from typing import Optional, List, Dict, Any
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from backend.db.database import get_db
from backend.services.llm_service import llm_service

router = APIRouter(prefix="/patient", tags=["Patient Triage Assistant"])

MANDATORY_DISCLAIMER = "AI-assisted prediction / decision support — requires review by a qualified healthcare professional."

RED_FLAG_KEYWORDS = [
    "chest pain", "crushing pressure", "shortness of breath", "cannot breathe",
    "sudden numbness", "facial droop", "slurred speech", "loss of consciousness",
    "worst headache of life", "coughing blood", "heavy bleeding", "severe trauma"
]

class CreateSessionResponse(BaseModel):
    session_id: str
    session_code: str
    max_turns: int
    message: str
    disclaimer: str

class PatientChatRequest(BaseModel):
    session_id: str
    message: str
    apiKey: Optional[str] = None
    apiProvider: Optional[str] = "gemini"

@router.post("/session", response_model=CreateSessionResponse)
async def create_patient_session():
    """
    Initializes a new anonymous patient triage session.
    """
    session_id = str(uuid.uuid4())
    session_code = f"RN-PT-{str(uuid.uuid4().int)[:5]}"
    now = datetime.utcnow().isoformat()
    
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("""
    INSERT INTO patient_sessions (id, session_code, turn_count, max_turns, is_completed, structured_symptoms, concern_level, created_at)
    VALUES (?, ?, 0, 8, 0, '{}', 'LOW', ?)
    """, (session_id, session_code, now))
    conn.commit()
    conn.close()
    
    return {
        "session_id": session_id,
        "session_code": session_code,
        "max_turns": 8,
        "message": "Hello! I am your RadiNova Health Assistant. Please describe what you are experiencing today, including where and when it began.",
        "disclaimer": MANDATORY_DISCLAIMER
    }

@router.post("/chat")
async def patient_chat(req: PatientChatRequest):
    """
    Processes patient message, tracks turn count, detects red flags, queries Gemini with structured schema,
    and returns decision support concern level.
    """
    conn = get_db()
    cursor = conn.cursor()
    
    cursor.execute("SELECT * FROM patient_sessions WHERE id = ?", (req.session_id,))
    session = cursor.fetchone()
    if not session:
        conn.close()
        raise HTTPException(status_code=404, detail="Patient session not found.")
    
    turn_count = session["turn_count"] + 1
    max_turns = session["max_turns"]
    now = datetime.utcnow().isoformat()
    
    # Save user message
    msg_id = str(uuid.uuid4())
    cursor.execute("""
    INSERT INTO patient_chat_messages (id, session_id, role, content, created_at)
    VALUES (?, ?, 'user', ?, ?)
    """, (msg_id, req.session_id, req.message, now))
    conn.commit()
    
    # Fetch full conversation history
    cursor.execute("SELECT role, content FROM patient_chat_messages WHERE session_id = ? ORDER BY created_at ASC", (req.session_id,))
    raw_history = [{"role": r["role"], "content": r["content"]} for r in cursor.fetchall()]
    
    # Check for immediate Red Flag keywords
    user_msg_lower = req.message.lower()
    has_red_flag = any(rf in user_msg_lower for rf in RED_FLAG_KEYWORDS)
    
    # Check if conversation is capped
    is_last_turn = turn_count >= max_turns
    
    # Construct Gemini prompt instructions
    system_prompt = f"""
You are the RadiNova AI Patient Triage Assistant.
Your job is to collect symptom details and summarize them into a structured JSON triage format.

CRITICAL RULES:
1. You are NOT diagnosing the patient. You are a conversational triage assistant gathering clinical context.
2. If red flag symptoms are present (e.g., severe chest pain, sudden paralysis, breathing distress), set "red_flag": true and advise immediate emergency care (911/ER).
3. Be compassionate, clear, and concise. Ask ONE relevant clarifying question at a time.
4. Current turn: {turn_count} of {max_turns}.
{"5. This is the final turn. Summarize findings and conclude the triage." if is_last_turn else ""}

You MUST respond strictly in the following JSON format:
{{
  "main_complaint": "<primary reason for visit>",
  "symptoms": ["<symptom1>", "<symptom2>"],
  "body_location": "<anatomical region>",
  "duration": "<e.g. 2 days>",
  "severity": "<Mild / Moderate / Severe>",
  "onset": "<Sudden / Gradual>",
  "injury": <true or false>,
  "red_flag": <true or false>,
  "relevant_history": ["<any chronic condition or history mentioned>"],
  "missing_information": ["<unanswered aspect>"],
  "next_question": "<your compassionate response and next question to patient>",
  "conversation_complete": <true if sufficient info gathered or turn limit reached, else false>
}}
"""
    
    assistant_reply = ""
    structured = {
        "main_complaint": req.message[:50],
        "symptoms": [req.message],
        "body_location": "Unspecified",
        "duration": "Unspecified",
        "severity": "Moderate",
        "onset": "Unspecified",
        "injury": "fall" in user_msg_lower or "hit" in user_msg_lower or "accident" in user_msg_lower,
        "red_flag": has_red_flag,
        "relevant_history": [],
        "missing_information": [],
        "next_question": "Thank you for explaining. Have you noticed any other symptoms or pain worsening?",
        "conversation_complete": is_last_turn
    }
    
    # Query Gemini / LLM with graceful fallback
    try:
        call_msgs = [{"role": "system", "content": system_prompt}] + raw_history
        llm_resp = llm_service.chat_assistant(
            messages=call_msgs,
            context={"session_id": req.session_id, "turn": turn_count},
            custom_api_key=req.apiKey,
            custom_provider=req.apiProvider or "gemini"
        )
        
        raw_text = llm_resp.get("reply", "")
        # Attempt to parse JSON from LLM response
        json_match = None
        if "{" in raw_text and "}" in raw_text:
            try:
                start = raw_text.find("{")
                end = raw_text.rfind("}") + 1
                parsed = json.loads(raw_text[start:end])
                structured.update(parsed)
                assistant_reply = parsed.get("next_question", raw_text)
            except Exception:
                assistant_reply = raw_text
        else:
            assistant_reply = raw_text
            
    except Exception as err:
        # Graceful Fallback for demo resilience (never crash!)
        if has_red_flag:
            assistant_reply = "Based on the severe symptoms described, please seek immediate emergency medical attention or contact emergency services (911/112) right away."
            structured["red_flag"] = True
        else:
            assistant_reply = "I understand. Could you tell me approximately how many days you have felt this way and if anything makes it better or worse?"
    
    if not assistant_reply:
        assistant_reply = "Thank you for sharing that. Are you experiencing any swelling, fever, or difficulty with movement?"
        
    # Determine concern level (non-diagnostic decision support layer)
    concern_level = "LOW"
    if structured.get("red_flag") or has_red_flag:
        concern_level = "URGENT_EVALUATION"
    elif structured.get("injury") or structured.get("severity") in ["Severe", "severe", "High"]:
        concern_level = "MODERATE"
    
    if is_last_turn:
        structured["conversation_complete"] = True
        
    # Save Assistant message
    asst_msg_id = str(uuid.uuid4())
    cursor.execute("""
    INSERT INTO patient_chat_messages (id, session_id, role, content, created_at)
    VALUES (?, ?, 'assistant', ?, ?)
    """, (asst_msg_id, req.session_id, assistant_reply, datetime.utcnow().isoformat()))
    
    # Update Session State
    cursor.execute("""
    UPDATE patient_sessions 
    SET turn_count = ?, is_completed = ?, structured_symptoms = ?, concern_level = ?
    WHERE id = ?
    """, (
        turn_count,
        1 if structured.get("conversation_complete") else 0,
        json.dumps(structured),
        concern_level,
        req.session_id
    ))
    conn.commit()
    conn.close()
    
    return {
        "session_id": req.session_id,
        "turn_count": turn_count,
        "max_turns": max_turns,
        "reply": assistant_reply,
        "structured_symptoms": structured,
        "concern_level": concern_level,
        "is_completed": structured.get("conversation_complete", False),
        "disclaimer": MANDATORY_DISCLAIMER
    }
