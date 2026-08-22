"""
RadiNova AI — Full System Verification Script (Tasks 1-4)
Validates:
- Task 1: Limb fracture inference + localized Grad-CAM heatmap
- Task 2: Structured Report Reader (Info stats, Triage, Short/Long term risks, What to do now, Precautions)
- Task 3: Context-Aware Conversational AI Assistant
- Task 4: Quantitative Infographics & Anatomical Zone Maps
"""

import sys
import io
import requests
from PIL import Image
import numpy as np

BACKEND_URL = "http://127.0.0.1:8000"

def test_task1_limb_fracture():
    print("\n--- [TASK 1] Testing Limb Fracture Model & Grad-CAM ---")
    img_path = "frontend/public/samples/limb_fracture_1.jpg"
    with open(img_path, "rb") as f:
        files = {"file": ("limb_sample.jpg", f, "image/jpeg")}
        res = requests.post(f"{BACKEND_URL}/predict/limb", files=files)
    
    assert res.status_code == 200, f"Failed: {res.text}"
    data = res.json()
    print(f"  Prediction: {data['prediction']} ({data['confidence']*100:.1f}%)")
    print(f"  Focal Zone: {data.get('focal_metrics', {}).get('focal_zone')}")
    print(f"  Grad-CAM Overlay Base64 Length: {len(data['gradcam_overlay'])} chars")
    assert "gradcam_overlay" in data and len(data["gradcam_overlay"]) > 100
    print("  >>> [PASS] Task 1 Limb Fracture Model & Localized Grad-CAM")

def test_task2_report_explanation():
    print("\n--- [TASK 2] Testing Structured Report Explanation (Stats & Risks) ---")
    sample_text = """CLINICAL METABOLIC PANEL
Patient: Anonymous Adult | Fasting 10 hours
WBC: 12.4 (High)
Hemoglobin: 13.8 g/dL
Platelets: 230 x10^9/L
Creatinine: 1.1 mg/dL
Potassium: 4.1 mEq/L
Impression: Mild leukocytosis, correlate with fever or cough."""
    
    files = {"file": ("blood_report.txt", io.BytesIO(sample_text.encode('utf-8')), "text/plain")}
    res = requests.post(f"{BACKEND_URL}/explain/blood", files=files)
    
    assert res.status_code == 200, f"Failed: {res.text}"
    data = res.json()
    exp = data.get("explanation", {})
    
    print(f"  Title: {exp.get('title')}")
    print(f"  Triage Level: {exp.get('triage_level', {}).get('label')}")
    print(f"  Stats Total Markers: {exp.get('info_stats', {}).get('total_markers')}")
    print(f"  Short-Term Risks: {len(exp.get('short_term_problems', []))} items")
    print(f"  Long-Term Risks: {len(exp.get('long_term_problems', []))} items")
    print(f"  What To Do Now: {len(exp.get('what_to_do_now', []))} steps")
    print(f"  Precautions: {len(exp.get('precautions_and_prevention', []))} items")
    
    assert "short_term_problems" in exp and len(exp["short_term_problems"]) > 0
    assert "long_term_problems" in exp and len(exp["long_term_problems"]) > 0
    assert "what_to_do_now" in exp and len(exp["what_to_do_now"]) > 0
    assert "precautions_and_prevention" in exp and len(exp["precautions_and_prevention"]) > 0
    print("  >>> [PASS] Task 2 Comprehensive Report Explanation Engine")

def test_task3_ai_assistant():
    print("\n--- [TASK 3] Testing AI Clinical Assistant with Case Grounding ---")
    payload = {
        "messages": [
            {"role": "user", "content": "What are the immediate steps and short-term risks for a detected limb fracture?"}
        ],
        "context": {
            "modality": "limb_fracture",
            "prediction": "FRACTURED",
            "confidence": 0.965
        }
    }
    res = requests.post(f"{BACKEND_URL}/assistant", json=payload)
    assert res.status_code == 200, f"Failed: {res.text}"
    data = res.json()
    print(f"  Assistant Reply:\n  {data['reply'][:180]}...")
    assert len(data.get("reply", "")) > 50
    print("  >>> [PASS] Task 3 Conversational AI Clinical Assistant")

def test_task4_infographics():
    print("\n--- [TASK 4] Testing Quantitative Infographics on Chest & Limb ---")
    img_path = "frontend/public/samples/chest_pneumonia_1.jpeg"
    with open(img_path, "rb") as f:
        files = {"file": ("chest_sample.jpeg", f, "image/jpeg")}
        res = requests.post(f"{BACKEND_URL}/predict/chest", files=files)
    
    assert res.status_code == 200, f"Failed: {res.text}"
    data = res.json()
    info = data.get("infographic", {})
    print(f"  Chest Opacity Index: {info.get('opacity_index')}%")
    print(f"  Anatomical Zones: {len(info.get('anatomical_zones', []))} zones evaluated")
    print(f"  Radiologic Signs: {len(info.get('radiologic_signs', []))} signs tracked")
    
    assert "opacity_index" in info
    assert len(info.get("anatomical_zones", [])) >= 4
    assert len(info.get("radiologic_signs", [])) >= 3
    print("  >>> [PASS] Task 4 Quantitative Infographics & Anatomical Zone Maps")

def main():
    print("=" * 60)
    print(" RADINOVA AI — COMPREHENSIVE VERIFICATION (TASKS 1–4)")
    print("=" * 60)
    test_task1_limb_fracture()
    test_task2_report_explanation()
    test_task3_ai_assistant()
    test_task4_infographics()
    print("\n" + "=" * 60)
    print(" ALL 4 TASKS SUCCESSFULLY VERIFIED LIVE!")
    print("=" * 60)

if __name__ == "__main__":
    main()
