"""
RadiNova AI — Verification & Stress Test Suite for CV Input Validation Layer
Tests Chest X-ray and Limb Fracture pipelines against:
1. Obviously unrelated everyday photos (Non-medical)
2. Wrong-body-part / cross-modality medical images (Chest vs Limb)
3. Degraded / heavily blurred versions of valid radiographs
4. High-quality in-distribution valid scans (Control)

Outputs exact confidence scores, status codes, and threshold decisions.
"""

import os
import io
import sys
import numpy as np
import pandas as pd
from PIL import Image, ImageFilter
from pathlib import Path

ROOT_DIR = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT_DIR))

from backend.services.cv_service import cv_service
from backend.config import settings

def create_blurred_image_bytes(source_path: str, blur_radius: float = 12.0) -> bytes:
    """Creates heavily blurred/degraded image simulating low-quality acquisition."""
    img = Image.open(source_path).convert("RGB")
    blurred = img.filter(ImageFilter.GaussianBlur(radius=blur_radius))
    buf = io.BytesIO()
    blurred.save(buf, format="JPEG", quality=40)
    return buf.getvalue()

def run_verification():
    print("\n" + "="*80)
    print(" RADINOVA AI — TWO-LAYER CV INPUT VALIDATION VERIFICATION SUITE")
    print("="*80)
    print(f"Device: {cv_service.device}")
    print(f"Chest Gatekeeper Threshold: {settings.CHEST_GATEKEEPER_THRESHOLD:.2f} | Diagnostic Threshold: {settings.CHEST_CONFIDENCE_THRESHOLD:.2f}")
    print(f"Limb Gatekeeper Threshold:  {settings.LIMB_GATEKEEPER_THRESHOLD:.2f} | Diagnostic Threshold: {settings.LIMB_CONFIDENCE_THRESHOLD:.2f}")
    print("="*80)

    # Locate test image assets
    generic_img_path = str(ROOT_DIR / "datasets" / "generic_negatives" / "generic_0001.jpg")
    if not os.path.exists(generic_img_path):
        # Fallback: create random noise/color pattern
        img = Image.new("RGB", (224, 224), (180, 120, 70))
        img.save(generic_img_path)

    chest_sample_path = str(ROOT_DIR / "frontend" / "public" / "samples" / "chest_pneumonia_1.jpeg")
    limb_sample_path = str(ROOT_DIR / "frontend" / "public" / "samples" / "limb_fracture_1.jpg")

    with open(generic_img_path, "rb") as f:
        generic_bytes = f.read()
    with open(chest_sample_path, "rb") as f:
        chest_bytes = f.read()
    with open(limb_sample_path, "rb") as f:
        limb_bytes = f.read()

    chest_blurred_bytes = create_blurred_image_bytes(chest_sample_path, blur_radius=15.0)
    limb_blurred_bytes = create_blurred_image_bytes(limb_sample_path, blur_radius=15.0)

    results = []

    # =========================================================================
    # 1. CHEST X-RAY PIPELINE TESTS
    # =========================================================================
    print("\n>>> [1/2] TESTING CHEST X-RAY PIPELINE (/predict/chest)...")

    chest_test_cases = [
        ("Chest Pipeline", "1. Unrelated Photo (Everyday)", generic_bytes, "invalid_image"),
        ("Chest Pipeline", "2. Wrong Modality (Limb X-ray)", limb_bytes, "invalid_image"),
        ("Chest Pipeline", "3. Degraded / Heavily Blurred Scan", chest_blurred_bytes, "low_confidence_or_invalid"),
        ("Chest Pipeline", "4. Valid In-Distribution Scan (Control)", chest_bytes, "success")
    ]

    for pipe, desc, img_b, expected in chest_test_cases:
        res = cv_service.analyze_chest(img_b)
        gate_score = res.get("gatekeeper_confidence")
        diag_score = res.get("diagnostic_confidence")
        status = res.get("status")
        pred = res.get("prediction")
        reason = res.get("reason", "")

        gate_str = f"{gate_score*100:.1f}%" if gate_score is not None else "N/A"
        diag_str = f"{diag_score*100:.1f}%" if diag_score is not None else "N/A"

        passed = False
        if expected == "invalid_image" and status == "invalid_image":
            passed = True
        elif expected == "low_confidence_or_invalid" and status in ["low_confidence", "invalid_image"]:
            passed = True
        elif expected == "success" and status == "success":
            passed = True

        results.append({
            "Pipeline": pipe,
            "Test Case": desc,
            "Status": status,
            "Gatekeeper Conf": gate_str,
            "Diagnostic Conf": diag_str,
            "Decision Reason": reason[:60] + "..." if len(reason) > 60 else reason,
            "Verification": "PASS" if passed else "FAIL"
        })

        print(f"  [{results[-1]['Verification']}] {desc}")
        print(f"       -> Status: {status} | Gatekeeper Conf: {gate_str} | Diagnostic Conf: {diag_str}")
        print(f"       -> Reason: {reason}")

    # =========================================================================
    # 2. LIMB FRACTURE PIPELINE TESTS
    # =========================================================================
    print("\n>>> [2/2] TESTING LIMB FRACTURE PIPELINE (/predict/limb)...")

    limb_test_cases = [
        ("Limb Pipeline", "1. Unrelated Photo (Everyday)", generic_bytes, "invalid_image"),
        ("Limb Pipeline", "2. Wrong Modality (Chest X-ray)", chest_bytes, "invalid_image"),
        ("Limb Pipeline", "3. Degraded / Heavily Blurred Scan", limb_blurred_bytes, "low_confidence_or_invalid"),
        ("Limb Pipeline", "4. Valid In-Distribution Scan (Control)", limb_bytes, "success")
    ]

    for pipe, desc, img_b, expected in limb_test_cases:
        res = cv_service.analyze_limb(img_b)
        gate_score = res.get("gatekeeper_confidence")
        diag_score = res.get("diagnostic_confidence")
        status = res.get("status")
        pred = res.get("prediction")
        reason = res.get("reason", "")

        gate_str = f"{gate_score*100:.1f}%" if gate_score is not None else "N/A"
        diag_str = f"{diag_score*100:.1f}%" if diag_score is not None else "N/A"

        passed = False
        if expected == "invalid_image" and status == "invalid_image":
            passed = True
        elif expected == "low_confidence_or_invalid" and status in ["low_confidence", "invalid_image"]:
            passed = True
        elif expected == "success" and status == "success":
            passed = True

        results.append({
            "Pipeline": pipe,
            "Test Case": desc,
            "Status": status,
            "Gatekeeper Conf": gate_str,
            "Diagnostic Conf": diag_str,
            "Decision Reason": reason[:60] + "..." if len(reason) > 60 else reason,
            "Verification": "PASS" if passed else "FAIL"
        })

        print(f"  [{results[-1]['Verification']}] {desc}")
        print(f"       -> Status: {status} | Gatekeeper Conf: {gate_str} | Diagnostic Conf: {diag_str}")
        print(f"       -> Reason: {reason}")

    # Summary Table
    df = pd.DataFrame(results)
    print("\n" + "="*100)
    print(" VERIFICATION SUMMARY MATRIX")
    print("="*100)
    print(df[["Pipeline", "Test Case", "Status", "Gatekeeper Conf", "Diagnostic Conf", "Verification"]].to_string(index=False))
    print("="*100)

    all_passed = all(r["Verification"] == "PASS" for r in results)
    print(f"\nOVERALL RESULT: {'ALL TESTS PASSED' if all_passed else 'SOME TESTS FAILED'}\n")
    return all_passed

if __name__ == "__main__":
    run_verification()
