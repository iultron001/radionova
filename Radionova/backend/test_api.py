"""
RadiNova AI — Automated Backend API Integration Test Suite
Tests: /health, /predict/chest, /predict/limb, /explain/{modality}, /assistant, /report
"""

import sys
import io
from pathlib import Path
from PIL import Image

ROOT_DIR = Path(__file__).resolve().parent.parent
if str(ROOT_DIR) not in sys.path:
    sys.path.insert(0, str(ROOT_DIR))

from fastapi.testclient import TestClient
from backend.main import app
from model.test_gradcam import create_synthetic_chest_xray

client = TestClient(app)

def test_health():
    print("\n[1/6] Testing GET /health...")
    response = client.get("/health")
    assert response.status_code == 200, f"Health check failed: {response.text}"
    data = response.json()
    assert data["status"] == "healthy"
    assert "models" in data
    print(f"      Status: OK, Device: {data['device']}, Active Modalities: {len(data['active_modalities'])}")

def test_predict_chest():
    print("\n[2/6] Testing POST /predict/chest...")
    img = create_synthetic_chest_xray(256, 256)
    buf = io.BytesIO()
    img.save(buf, format="JPEG")
    buf.seek(0)
    
    response = client.post(
        "/predict/chest",
        files={"file": ("test_chest.jpg", buf, "image/jpeg")}
    )
    assert response.status_code == 200, f"Predict chest failed: {response.text}"
    data = response.json()
    assert data["modality"] == "chest_xray"
    assert "prediction" in data
    assert "confidence" in data
    assert "gradcam_overlay" in data
    assert data["gradcam_overlay"].startswith("data:image/jpeg;base64,")
    assert "guidance" in data
    print(f"      Prediction: {data['prediction']} ({data['confidence']*100:.1f}%), Grad-CAM generated: True")
    return data

def test_predict_limb():
    print("\n[3/7] Testing POST /predict/limb...")
    img = Image.new("RGB", (256, 256), color=(40, 40, 40))
    buf = io.BytesIO()
    img.save(buf, format="JPEG")
    buf.seek(0)
    
    response = client.post(
        "/predict/limb",
        files={"file": ("test_limb.jpg", buf, "image/jpeg")}
    )
    assert response.status_code == 200, f"Predict limb failed: {response.text}"
    data = response.json()
    assert data["modality"] == "limb_fracture"
    assert "prediction" in data
    assert "gradcam_overlay" in data
    print(f"      Prediction: {data['prediction']} ({data['confidence']*100:.1f}%), Grad-CAM: True")

def test_predict_mri():
    print("\n[4/7] Testing POST /predict/mri...")
    img = Image.new("RGB", (256, 256), color=(20, 20, 20))
    buf = io.BytesIO()
    img.save(buf, format="JPEG")
    buf.seek(0)
    
    response = client.post(
        "/predict/mri",
        files={"file": ("test_mri.jpg", buf, "image/jpeg")}
    )
    assert response.status_code == 200, f"Predict MRI failed: {response.text}"
    data = response.json()
    assert data["modality"] == "mri"
    assert "prediction" in data
    assert "gradcam_overlay" in data
    print(f"      [MRI] Prediction: {data['prediction']} ({data['confidence']*100:.1f}%), Grad-CAM: True")

def test_explain_modalities():
    print("\n[5/7] Testing POST /explain/{modality} for blood, mri, ecg, ct...")
    modalities = ["blood", "mri", "ecg", "ct"]
    sample_text = "WBC: 7.2 x10^9/L, Hemoglobin: 14.5 g/dL, Platelets: 240 x10^9/L, Creatinine: 0.9 mg/dL"
    
    for mod in modalities:
        buf = io.BytesIO(sample_text.encode("utf-8"))
        response = client.post(
            f"/explain/{mod}",
            files={"file": (f"sample_{mod}.txt", buf, "text/plain")}
        )
        assert response.status_code == 200, f"Explain {mod} failed: {response.text}"
        data = response.json()
        assert data["modality"] == mod
        assert "explanation" in data
        assert "source" in data
        print(f"      [{mod.upper()}] Source: {data['source']}, Summary length: {len(data['explanation']['plain_language_summary'])} chars")

def test_assistant():
    print("\n[5/6] Testing POST /assistant...")
    payload = {
        "messages": [
            {"role": "user", "content": "What does the Grad-CAM heatmap tell us about the patient's chest scan?"}
        ],
        "context": {
            "modality": "chest_xray",
            "prediction": "PNEUMONIA",
            "confidence": 0.92
        }
    }
    response = client.post("/assistant", json=payload)
    assert response.status_code == 200, f"Assistant failed: {response.text}"
    data = response.json()
    assert "reply" in data
    assert "disclaimer" in data
    print(f"      Assistant response generated: {len(data['reply'])} chars")

def test_report(sample_chest_data):
    print("\n[6/6] Testing POST /report (PDF Generation)...")
    response = client.post("/report", json=sample_chest_data)
    assert response.status_code == 200, f"Report generation failed: {response.text}"
    assert response.headers["content-type"] == "application/pdf"
    assert len(response.content) > 1000, "PDF content too small"
    
    # Save a test PDF
    pdf_path = Path("reports/sample_test_report.pdf")
    pdf_path.write_bytes(response.content)
    print(f"      PDF Report successfully generated ({len(response.content)} bytes) -> {pdf_path.resolve()}")

if __name__ == "__main__":
    print("==================================================")
    print(" RadiNova AI — Backend API Test Suite Execution")
    print("==================================================")
    test_health()
    chest_result = test_predict_chest()
    test_predict_limb()
    test_predict_mri()
    test_explain_modalities()
    test_assistant()
    test_report(chest_result)
    print("\n==================================================")
    print(" [ALL PASS] All FastAPI endpoints verified locally!")
    print("==================================================")
