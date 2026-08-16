"""
RadiNova AI — Rule-based Clinical Guidance Service
Maps confidence bands and predictions to clinical decision support rules.
"""

import json
from pathlib import Path
from typing import Dict, Any, Optional

RULES_PATH = Path("rules/clinical_guidance.json")

class GuidanceService:
    def __init__(self, rules_path: Path = RULES_PATH):
        self.rules_path = rules_path
        self.rules = self._load_rules()

    def _load_rules(self) -> Dict[str, Any]:
        if not self.rules_path.exists():
            return {
                "system_disclaimer": "For educational/research purposes only — not a substitute for professional medical diagnosis.",
                "modalities": {}
            }
        with open(self.rules_path, "r", encoding="utf-8") as f:
            return json.load(f)

    def get_guidance(self, modality: str, predicted_class: str, confidence: float) -> Dict[str, Any]:
        """
        Looks up clinical guidance based on modality, predicted class, and confidence score.
        """
        modality_rules = self.rules.get("modalities", {}).get(modality, {})
        bands = modality_rules.get("confidence_bands", [])
        
        selected_band = None
        for band in bands:
            if band.get("class") == predicted_class:
                min_c = band.get("min_confidence", 0.0)
                max_c = band.get("max_confidence", 1.0)
                if min_c <= confidence <= max_c:
                    selected_band = band
                    break

        if not selected_band:
            # Fallback default
            return {
                "severity": "EVALUATE_CLINICALLY",
                "clinical_summary": f"Model detected {predicted_class} with {confidence*100:.1f}% confidence.",
                "differential_considerations": ["Clinical history and laboratory correlation required"],
                "recommended_followup": ["Comprehensive clinical assessment by qualified clinician"],
                "disclaimer": self.rules.get("system_disclaimer", "")
            }

        return {
            "severity": selected_band.get("severity"),
            "clinical_summary": selected_band.get("clinical_summary"),
            "differential_considerations": selected_band.get("differential_considerations", []),
            "recommended_followup": selected_band.get("recommended_followup", []),
            "disclaimer": self.rules.get("system_disclaimer", "")
        }

guidance_service = GuidanceService()
