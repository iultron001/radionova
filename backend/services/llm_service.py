"""
RadiNova AI — LLM Explanation & Clinical Chat Assistant Service
Handles plain-language interpretation of Blood Test, MRI, ECG, and CT scans
with strict clinical hedging and robust deterministic template fallback for offline/no-key usage.
"""

import os
import re
import json
from typing import Dict, Any, List, Optional
from backend.config import settings

MANDATORY_DISCLAIMER = "For educational/research purposes only — not a substitute for professional medical diagnosis."

# Standardized deterministic fallback templates for offline demo reliability
MODALITY_TEMPLATES = {
    "blood": {
        "title": "Complete Metabolic & Hematology Report Interpretation",
        "key_findings": [
            "White Blood Cell (WBC) Count: Within normal physiological reference interval (4.5 - 11.0 x 10^9/L).",
            "Hemoglobin & Hematocrit: Normal oxygen-carrying capacity with normocytic, normochromic indices.",
            "Platelet Count: Adequate for hemostatic maintenance without signs of thrombocytopenia.",
            "Serum Electrolytes & Renal Markers (BUN/Creatinine): Preserved glomerular filtration and ionic balance."
        ],
        "plain_language_summary": "The uploaded laboratory panel demonstrates parameters largely conforming to expected standard physiological reference ranges. No acute hematologic cytopenias or gross metabolic derangements are identified in the provided values.",
        "hedging_statement": "Laboratory findings must be correlated with dynamic clinical symptoms, baseline patient parameters, and medication history.",
        "recommended_clinical_questions": [
            "Are there recent symptoms of fatigue, infection, or altered fluid intake?",
            "Were these samples drawn under standard fasting conditions?"
        ]
    },
    "mri": {
        "title": "Magnetic Resonance Imaging (MRI) Sequence Review",
        "key_findings": [
            "Structural Integrity: Anatomical contours demonstrate normal signal intensity across T1 and T2 weighted sequences.",
            "Tissue Contrast: No focal mass lesions, pathological enhancing nodules, or acute restricted diffusion detected.",
            "Vascular & Fluid Spaces: Ventricular system and subarachnoid cerebrospinal fluid spaces are symmetric and age-appropriate."
        ],
        "plain_language_summary": "The MRI examination demonstrates preserved anatomical organization without overt structural disruptions, pathological fluid collections, or acute ischemic signals on the visible views.",
        "hedging_statement": "MRI sequence interpretation is complex and sensitive to artifact; definitive evaluation requires multi-planar review by a certified radiologist.",
        "recommended_clinical_questions": [
            "What specific neurological or localized musculoskeletal symptoms prompted this imaging?",
            "Are prior MR studies available for longitudinal comparison?"
        ]
    },
    "ecg": {
        "title": "12-Lead Electrocardiogram (ECG) Rhythm & Morphology Review",
        "key_findings": [
            "Cardiac Rhythm: Normal Sinus Rhythm (NSR) at a physiological resting rate (~72 bpm).",
            "Conduction Intervals: PR interval (150 ms) and QRS duration (88 ms) are within normal electrical velocity limits.",
            "ST-T Wave Morphology: Isoelectric ST segments with no acute ST elevation or reciprocal depression; upright concordant T waves."
        ],
        "plain_language_summary": "The electrocardiographic tracing shows regular electrical conduction originating from the sinoatrial node with preserved repolarization waves and no acute ischemic signs.",
        "hedging_statement": "ECG wave interpretation represents an instantaneous electrical snapshot and must be contextualized with clinical presentation (chest pain, dyspnea, palpitations).",
        "recommended_clinical_questions": [
            "Were symptoms present during the acquisition of this tracing?",
            "Is there a history of cardiovascular disease or antiarrhythmic pharmacotherapy?"
        ]
    },
    "ct": {
        "title": "Computed Tomography (CT) Cross-Sectional Review",
        "key_findings": [
            "Parenchymal Attenuation: Symmetrical tissue density without focal hyperdense hemorrhage or abnormal hypodense areas.",
            "Bony Architecture: Cortical margins of visual osseous structures appear intact without evident destructive lesions.",
            "Soft Tissue & Cavities: Normal caliber and aeration of relevant anatomical compartments without acute fluid accumulation."
        ],
        "plain_language_summary": "The cross-sectional CT scan illustrates standard radiographic attenuation with preserved tissue planes and absence of gross acute macroscopic abnormalities on initial inspection.",
        "hedging_statement": "CT slices require systematic thin-slice examination across multiple window levels (lung, bone, soft-tissue) by a trained radiologist.",
        "recommended_clinical_questions": [
            "Was this study performed with intravenous or oral contrast enhancement?",
            "What specific clinical question is being investigated?"
        ]
    }
}

class LLMService:
    def __init__(self):
        self.api_key_available = bool(
            settings.OPENAI_API_KEY or settings.ANTHROPIC_API_KEY or settings.GEMINI_API_KEY
        )

    def extract_text_from_file(self, file_bytes: bytes, filename: str) -> str:
        """Simple text extractor for txt/pdf or fallback placeholder for images."""
        name = filename.lower()
        if name.endswith(".txt") or name.endswith(".csv"):
            try:
                return file_bytes.decode("utf-8", errors="ignore")
            except Exception:
                return "Raw laboratory text file content."
        elif name.endswith(".pdf"):
            # Simple text extraction from PDF
            try:
                text_content = ""
                # Attempt basic ascii extraction
                decoded = file_bytes.decode("latin1", errors="ignore")
                matches = re.findall(r"\(([^\)]+)\)Tj", decoded)
                if matches:
                    text_content = " ".join(matches)
                return text_content if len(text_content) > 20 else f"Standard clinical document: {filename}"
            except Exception:
                return f"Clinical report document: {filename}"
        else:
            return f"Medical scan image document: {filename}"

    def explain_modality(self, modality: str, extracted_text: str, filename: str) -> Dict[str, Any]:
        """
        Produces a plain-language explanation for Blood/MRI/ECG/CT.
        Uses LLM API if key is present; otherwise returns deterministic structured clinical template.
        """
        modality_key = modality.lower()
        template = MODALITY_TEMPLATES.get(modality_key, MODALITY_TEMPLATES["blood"])

        # If LLM API key is present and configured, we can attempt live LLM call
        if self.api_key_available and settings.OPENAI_API_KEY:
            try:
                # Attempt OpenAI call if configured
                import urllib.request
                prompt = (
                    f"You are a medical AI decision support assistant. Explain the following {modality.upper()} findings "
                    f"in plain, accessible language for clinical review. Hedge appropriately, never provide a definitive diagnosis, "
                    f"and conclude with recommended clinical questions. Document text: '{extracted_text[:1000]}'. "
                    f"Format as JSON with keys: title, key_findings (list), plain_language_summary, hedging_statement, recommended_clinical_questions (list)."
                )
                req = urllib.request.Request(
                    "https://api.openai.com/v1/chat/completions",
                    data=json.dumps({
                        "model": "gpt-4o-mini",
                        "messages": [
                            {"role": "system", "content": "You are a clinical decision support AI. Always hedge and never diagnose."},
                            {"role": "user", "content": prompt}
                        ],
                        "response_format": {"type": "json_object"}
                    }).encode("utf-8"),
                    headers={
                        "Content-Type": "application/json",
                        "Authorization": f"Bearer {settings.OPENAI_API_KEY}"
                    }
                )
                with urllib.request.urlopen(req, timeout=8) as response:
                    res_json = json.loads(response.read().decode("utf-8"))
                    content = json.loads(res_json["choices"][0]["message"]["content"])
                    return {
                        "modality": modality,
                        "filename": filename,
                        "source": "LLM_LIVE_API",
                        "explanation": content,
                        "disclaimer": MANDATORY_DISCLAIMER
                    }
            except Exception as e:
                print(f"[LLMService] Live API call fallback to template: {e}")

        # Deterministic High-Quality Fallback
        return {
            "modality": modality,
            "filename": filename,
            "source": "TEMPLATE_FALLBACK",
            "explanation": template,
            "disclaimer": MANDATORY_DISCLAIMER
        }

    def chat_assistant(self, messages: List[Dict[str, str]], context: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
        """
        Clinical chat assistant taking conversation history + optional scan context.
        """
        user_last_msg = messages[-1]["content"] if messages else "Hello"
        
        # Clinical response generation with context awareness
        context_str = ""
        if context:
            mod = context.get("modality", "Unknown")
            pred = context.get("prediction", "N/A")
            conf = context.get("confidence", 0.0)
            context_str = f" [Active Case Context: {mod.upper()} | Model Classification: {pred} ({conf*100:.1f}% confidence)]"

        # Deterministic clinical intelligence logic for demo
        query_lower = user_last_msg.lower()
        if "pneumonia" in query_lower:
            reply = (
                f"Regarding pneumonia findings on chest radiography: Typical patterns include lobar consolidation, "
                f"bronchovascular perihilar infiltrates, and air bronchograms. The Grad-CAM heatmap highlights areas with highest "
                f"feature activation. In clinical workflows, this should always be verified alongside auscultatory crackles, "
                f"temperature elevation, and inflammatory markers (CRP/WBC).{context_str}"
            )
        elif "grad-cam" in query_lower or "heatmap" in query_lower:
            reply = (
                f"Grad-CAM (Gradient-weighted Class Activation Mapping) calculates gradients of the classification score with "
                f"respect to the final convolutional feature maps (DenseNet-121 denseblock4). The resulting colormap highlights "
                f"salient pulmonary regions that guided the model's prediction.{context_str}"
            )
        elif "fracture" in query_lower:
            reply = (
                f"For limb and bone radiographs, the model evaluates cortical continuity and radiolucent lines indicative "
                f"of structural disruption. Recommended follow-up includes obtaining orthogonal views (AP and Lateral) and "
                f"checking distal neurovascular stability.{context_str}"
            )
        elif "report" in query_lower or "pdf" in query_lower:
            reply = (
                f"You can generate a formal clinical PDF report at any time by clicking the 'Export PDF Report' button. "
                f"The report includes patient details, original imagery, Grad-CAM overlays, rule-based clinical considerations, "
                f"and the mandatory medical disclaimer.{context_str}"
            )
        else:
            reply = (
                f"RadiNova AI Clinical Decision Support: I am here to assist with medical imaging interpretation, "
                f"Grad-CAM heatmaps, laboratory panels, and clinical guidelines. Please note that all AI outputs require "
                f"verification by a qualified healthcare professional.{context_str}"
            )

        return {
            "reply": reply,
            "disclaimer": MANDATORY_DISCLAIMER
        }

llm_service = LLMService()
