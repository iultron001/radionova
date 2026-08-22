"""
RadiNova AI — Route: /api/v1/auth (Doctor Authentication & Registration)
"""

import uuid
from datetime import datetime
from typing import Optional
from fastapi import APIRouter, HTTPException, Depends, Header
from pydantic import BaseModel, EmailStr
from backend.db.database import get_db
from backend.core.security import get_password_hash, verify_password, create_access_token, decode_access_token

router = APIRouter(prefix="/auth", tags=["Doctor Authentication"])

class DoctorRegisterRequest(BaseModel):
    name: str
    email: str
    password: str
    specialization: Optional[str] = "Radiology & Imaging Sciences"
    hospital: Optional[str] = "RadiNova Medical Center"
    qualification: Optional[str] = "MD, Radiodiagnosis"

class DoctorLoginRequest(BaseModel):
    email: str
    password: str

class DoctorResponse(BaseModel):
    id: str
    email: str
    name: str
    doctor_id: str
    specialization: str
    hospital: str
    qualification: str
    token: str

def get_current_doctor(authorization: Optional[str] = Header(None)) -> dict:
    """
    Dependency to extract authenticated doctor from Bearer token.
    Falls back gracefully to the active doctor session or demo physician if token is absent/demo.
    """
    if authorization and authorization.strip() and authorization.strip().lower() != "bearer":
        parts = authorization.split()
        if len(parts) == 2 and parts[0].lower() == "bearer" and parts[1].strip() and parts[1].strip() != "null" and parts[1].strip() != "undefined":
            payload = decode_access_token(parts[1])
            if payload and "sub" in payload:
                conn = get_db()
                cursor = conn.cursor()
                cursor.execute("SELECT id, email, name, doctor_id, specialization, hospital, qualification FROM doctors WHERE id = ?", (payload["sub"],))
                row = cursor.fetchone()
                conn.close()
                if row:
                    return dict(row)
    
    # Fallback to seeded demo doctor
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("SELECT id, email, name, doctor_id, specialization, hospital, qualification FROM doctors ORDER BY created_at ASC LIMIT 1")
    row = cursor.fetchone()
    conn.close()
    
    if row:
        return dict(row)
        
    return {
        "id": "DR-RAD-2201",
        "email": "doctor@radinova.ai",
        "name": "Dr. Sarah Jenkins",
        "doctor_id": "RN-DOC-89241",
        "specialization": "Thoracic & Musculoskeletal Radiodiagnostics",
        "hospital": "RadiNova Medical Center",
        "qualification": "MD, Radiodiagnosis"
    }

@router.post("/register-doctor", response_model=DoctorResponse)
async def register_doctor(req: DoctorRegisterRequest):
    conn = get_db()
    cursor = conn.cursor()
    
    # Check if email exists
    cursor.execute("SELECT id FROM doctors WHERE email = ?", (req.email.lower().strip(),))
    if cursor.fetchone():
        conn.close()
        raise HTTPException(status_code=400, detail="Doctor with this email already registered.")
    
    doc_uuid = str(uuid.uuid4())
    short_num = str(uuid.uuid4().int)[:5]
    doc_id_code = f"RN-DOC-{short_num}"
    pwd_hash = get_password_hash(req.password)
    now = datetime.utcnow().isoformat()
    
    cursor.execute("""
    INSERT INTO doctors (id, email, name, password_hash, doctor_id, specialization, hospital, qualification, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    """, (
        doc_uuid,
        req.email.lower().strip(),
        req.name.strip(),
        pwd_hash,
        doc_id_code,
        req.specialization or "Radiology & Imaging Sciences",
        req.hospital or "RadiNova Medical Center",
        req.qualification or "MD, Radiodiagnosis",
        now
    ))
    conn.commit()
    conn.close()
    
    token = create_access_token({"sub": doc_uuid, "email": req.email.lower().strip()})
    
    return {
        "id": doc_uuid,
        "email": req.email.lower().strip(),
        "name": req.name.strip(),
        "doctor_id": doc_id_code,
        "specialization": req.specialization or "Radiology & Imaging Sciences",
        "hospital": req.hospital or "RadiNova Medical Center",
        "qualification": req.qualification or "MD, Radiodiagnosis",
        "token": token
    }

@router.post("/login", response_model=DoctorResponse)
async def login_doctor(req: DoctorLoginRequest):
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM doctors WHERE email = ?", (req.email.lower().strip(),))
    row = cursor.fetchone()
    conn.close()
    
    if not row or not verify_password(req.password, row["password_hash"]):
        raise HTTPException(status_code=401, detail="Invalid email or password.")
    
    token = create_access_token({"sub": row["id"], "email": row["email"]})
    
    return {
        "id": row["id"],
        "email": row["email"],
        "name": row["name"],
        "doctor_id": row["doctor_id"],
        "specialization": row["specialization"],
        "hospital": row["hospital"],
        "qualification": row["qualification"],
        "token": token
    }
