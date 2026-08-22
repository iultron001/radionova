"""
RadiNova AI — Automated Integration Test for Tier 1 & Tier 2 API v1 Endpoints
"""

import io
import sys
from pathlib import Path

ROOT_DIR = Path(__file__).resolve().parent.parent
if str(ROOT_DIR) not in sys.path:
    sys.path.insert(0, str(ROOT_DIR))

import json
from PIL import Image
from fastapi.testclient import TestClient
from backend.main import app

client = TestClient(app)

def test_v1_pipeline():
    print("\n--- 1. Testing Doctor Authentication ---")
    login_resp = client.post("/api/v1/auth/login", json={
        "email": "doctor@radinova.ai",
        "password": "doctor123"
    })
    assert login_resp.status_code == 200, f"Login failed: {login_resp.text}"
    auth_data = login_resp.json()
    token = auth_data["token"]
    doctor_id = auth_data["doctor_id"]
    print(f"[OK] Doctor logged in: {auth_data['name']} ({doctor_id})")
    
    headers = {"Authorization": f"Bearer {token}"}

    print("\n--- 2. Testing Study Creation & Listing ---")
    study_resp = client.post("/api/v1/studies", headers=headers, json={
        "patient_name": "Eleanor Vance",
        "modality": "chest_xray",
        "notes": "Patient presents with persistent cough and fever for 4 days."
    })
    assert study_resp.status_code == 200, f"Create study failed: {study_resp.text}"
    study = study_resp.json()
    study_id = study["id"]
    print(f"[OK] Created study {study_id} for {study['patient_name']}")

    list_resp = client.get("/api/v1/studies", headers=headers)
    assert list_resp.status_code == 200
    studies = list_resp.json()["studies"]
    assert len(studies) >= 1
    print(f"[OK] Doctor studies listed: {len(studies)} studies found")

    print("\n--- 3. Testing Chest X-Ray Analysis with Gatekeeper & Grad-CAM ---")
    img = Image.new("RGB", (224, 224), color=(100, 100, 100))
    buf = io.BytesIO()
    img.save(buf, format="JPEG")
    buf.seek(0)
    
    analysis_resp = client.post(
        "/api/v1/analysis/chest",
        headers=headers,
        data={"study_id": study_id},
        files={"file": ("chest.jpg", buf.getvalue(), "image/jpeg")}
    )
    assert analysis_resp.status_code == 200, f"Analysis failed: {analysis_resp.text}"
    analysis = analysis_resp.json()
    assert "disclaimer" in analysis
    print(f"[OK] Chest Analysis Prediction: {analysis.get('prediction')} (Confidence: {analysis.get('confidence')})")
    print(f"[OK] Disclaimer: {analysis.get('disclaimer')}")

    print("\n--- 4. Testing PDF Report Generation & Persistence ---")
    report_resp = client.post(
        "/api/v1/reports/generate",
        headers=headers,
        json={
            "study_id": study_id,
            "patient_name": "Eleanor Vance",
            "patient_id": study["patient_id"],
            "modality": "chest_xray",
            "prediction": analysis.get("prediction"),
            "confidence": analysis.get("confidence"),
            "findings": "Perihilar consolidation noted with increased bronchovascular markings.",
            "impression": "Findings suspicious for bacterial pneumonia. Clinical correlation advised.",
            "clinical_notes": "Prescribed Azithromycin 500mg daily. Re-evaluate in 72h.",
            "full_data": analysis
        }
    )
    assert report_resp.status_code == 200
    assert report_resp.headers["content-type"] == "application/pdf"
    assert len(report_resp.content) > 1000
    print(f"[OK] Generated PDF Report: {len(report_resp.content)} bytes, Code: {report_resp.headers.get('x-report-code')}")

    print("\n--- 5. Testing Patient Portal (No Auth) & Gemini Triage Conversation ---")
    session_resp = client.post("/api/v1/patient/session")
    assert session_resp.status_code == 200
    session_data = session_resp.json()
    pt_session_id = session_data["session_id"]
    print(f"[OK] Created Patient Anonymous Session: {session_data['session_code']}")

    chat_resp = client.post("/api/v1/patient/chat", json={
        "session_id": pt_session_id,
        "message": "I twisted my right ankle while playing basketball yesterday and it is very swollen and painful."
    })
    assert chat_resp.status_code == 200
    chat_data = chat_resp.json()
    assert "structured_symptoms" in chat_data
    assert "concern_level" in chat_data
    assert "disclaimer" in chat_data
    print(f"[OK] Patient Assistant Reply: {chat_data['reply'][:90]}...")
    print(f"[OK] Structured Symptoms extracted: {chat_data['structured_symptoms']}")
    print(f"[OK] Concern Level: {chat_data['concern_level']} (Turn {chat_data['turn_count']}/{chat_data['max_turns']})")

    print("\n=======================================================")
    print("ALL RADI NOVA TIER 1 & TIER 2 API TESTS PASSED PERFECTLY!")
    print("=======================================================")

if __name__ == "__main__":
    test_v1_pipeline()
