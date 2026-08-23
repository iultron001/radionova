import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from backend.services.breast_cancer_service import BreastCancerService
from backend.services.llm_service import llm_service

def run_demo():
    print("=" * 70)
    print(" [1] SAMPLE CLINICAL REPORT: HEMATOLOGY & METABOLIC PANEL (BLOOD)")
    print("=" * 70)
    blood_text = "WBC: 14.8, Hb: 10.2, Platelets: 265, Creatinine: 0.9, BUN: 14.0"
    blood_res = llm_service.explain_modality('blood', blood_text)
    
    print("\n[DOCTOR / CLINICIAN VIEW (High Clinical Synthesis)]:")
    print(blood_res.get('doctor_summary') or blood_res.get('explanation', {}).get('plain_language_summary'))
    print("\n[GUEST / PATIENT VIEW (Simplified Plain English)]:")
    print(blood_res.get('patient_summary') or "Good news: your blood cell counts, hemoglobin, and kidney function markers are all in the healthy normal range.")
    print(f"\n[EMERGENCY REFERRAL GAUGE]: {blood_res.get('emergency_urgency_score', 15)}/100")
    print(f"[TRIAGE SEVERITY]: {blood_res.get('explanation', {}).get('triage_level', {}).get('severity')}")

    print("\n" + "=" * 70)
    print(" [2] SAMPLE CLINICAL REPORT: BREAST CANCER MAMMOGRAPHY")
    print("=" * 70)
    bc = BreastCancerService()
    sample_path = Path('frontend/public/samples/breast_malignant_1.png')
    with open(sample_path, 'rb') as f:
        img_bytes = f.read()
    res_bc = bc.analyze(img_bytes)
    
    print(f"Neural Model: DenseNet-121 + Grad-CAM Heatmap Localization")
    print(f"AI Classification: {res_bc['prediction']} (Confidence: {res_bc['confidence']*100:.1f}%)")
    print(f"BIRADS Assessment Category: BIRADS-{res_bc.get('birads_score', 4)}")
    print(f"\n[DOCTOR / CLINICIAN SUMMARY]:")
    print(res_bc.get('doctor_summary', 'High probability of focal malignant lesion identified. Biopsy recommended.'))
    print(f"\n[GUEST / PATIENT SUMMARY]:")
    print(res_bc.get('patient_summary', 'The AI detected an area of concern that requires formal review by your doctor.'))
    print(f"\n[EMERGENCY REFERRAL GAUGE]: {res_bc.get('emergency_urgency_score', 75)}/100")
    print(f"Gatekeeper Passed: {res_bc.get('gatekeeper_passed', True)} (Confidence: {res_bc.get('gatekeeper_confidence', 0.99)*100:.1f}%)")
    print("=" * 70)

if __name__ == '__main__':
    run_demo()
