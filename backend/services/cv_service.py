"""
RadiNova AI — Computer Vision Inference Service
Handles DenseNet-121 PyTorch inference and Grad-CAM generation for Chest X-Ray and Limb Fracture.
"""

import os
import io
import torch
import torch.nn.functional as F
from PIL import Image
from pathlib import Path
from typing import Dict, Any, Optional

from model.base_classifier import build_densenet121, get_transforms
from model.gradcam import GradCAM, apply_gradcam_overlay, image_to_base64
from backend.services.guidance_service import guidance_service
from backend.config import settings

class CVService:
    def __init__(self):
        self.device = torch.device("cuda" if (settings.DEVICE in ["auto", "cuda"] and torch.cuda.is_available()) else "cpu")
        print(f"[CVService] Initializing inference engine on device: {self.device}")
        
        self.chest_classes = ["NORMAL", "PNEUMONIA"]
        self.limb_classes = ["NOT_FRACTURED", "FRACTURED"]
        self.transform = get_transforms(image_size=224, is_training=False)

        # Load models
        self.chest_model = self._load_model(settings.CHEST_MODEL_PATH, num_classes=2, label="Chest X-Ray")
        self.chest_gradcam = GradCAM(self.chest_model, target_layer=self.chest_model.features.denseblock4)

        self.limb_model = self._load_model(settings.LIMB_MODEL_PATH, num_classes=2, label="Limb Fracture")
        self.limb_gradcam = GradCAM(self.limb_model, target_layer=self.limb_model.features.denseblock4)

    def _load_model(self, checkpoint_path: str, num_classes: int, label: str) -> torch.nn.Module:
        model = build_densenet121(num_classes=num_classes, pretrained=True, freeze_features=False)
        path = Path(checkpoint_path)
        if path.exists():
            try:
                checkpoint = torch.load(str(path), map_location=self.device)
                if isinstance(checkpoint, dict) and "model_state_dict" in checkpoint:
                    model.load_state_dict(checkpoint["model_state_dict"])
                else:
                    model.load_state_dict(checkpoint)
                print(f"[CVService] Successfully loaded trained {label} weights from {path}")
            except Exception as e:
                print(f"[CVService] Warning: Could not load checkpoint {path} for {label}: {e}. Using ImageNet backbone.")
        else:
            print(f"[CVService] Checkpoint {path} not found for {label}. Using ImageNet pretrained DenseNet-121 backbone.")
            
        model = model.to(self.device)
        model.eval()
        return model

    def analyze_chest(self, image_bytes: bytes) -> Dict[str, Any]:
        """Runs Chest X-ray pneumonia prediction and Grad-CAM explainability."""
        image = Image.open(io.BytesIO(image_bytes)).convert("RGB")
        input_tensor = self.transform(image).unsqueeze(0).to(self.device)

        with torch.no_grad():
            logits = self.chest_model(input_tensor)
            probs = F.softmax(logits, dim=1)[0].cpu().numpy()
            pred_idx = int(torch.argmax(logits, dim=1).item())

        pred_class = self.chest_classes[pred_idx]
        confidence = float(probs[pred_idx])

        # Generate Grad-CAM
        heatmap = self.chest_gradcam.generate_heatmap(input_tensor, target_class=pred_idx)
        overlay_pil, _ = apply_gradcam_overlay(image, heatmap, alpha=0.45)

        # Base64 encodings
        original_b64 = image_to_base64(image)
        gradcam_b64 = image_to_base64(overlay_pil)

        # Clinical Guidance from rules
        guidance = guidance_service.get_guidance("chest_xray", pred_class, confidence)

        return {
            "modality": "chest_xray",
            "prediction": pred_class,
            "confidence": confidence,
            "probabilities": {
                "NORMAL": float(probs[0]),
                "PNEUMONIA": float(probs[1])
            },
            "original_image": original_b64,
            "gradcam_overlay": gradcam_b64,
            "guidance": guidance,
            "disclaimer": "For educational/research purposes only — not a substitute for professional medical diagnosis."
        }

    def analyze_limb(self, image_bytes: bytes) -> Dict[str, Any]:
        """Runs Limb fracture prediction and Grad-CAM explainability."""
        image = Image.open(io.BytesIO(image_bytes)).convert("RGB")
        input_tensor = self.transform(image).unsqueeze(0).to(self.device)

        with torch.no_grad():
            logits = self.limb_model(input_tensor)
            probs = F.softmax(logits, dim=1)[0].cpu().numpy()
            pred_idx = int(torch.argmax(logits, dim=1).item())

        pred_class = self.limb_classes[pred_idx]
        confidence = float(probs[pred_idx])

        # Generate Grad-CAM
        heatmap = self.limb_gradcam.generate_heatmap(input_tensor, target_class=pred_idx)
        overlay_pil, _ = apply_gradcam_overlay(image, heatmap, alpha=0.45)

        original_b64 = image_to_base64(image)
        gradcam_b64 = image_to_base64(overlay_pil)

        guidance = guidance_service.get_guidance("limb_fracture", pred_class, confidence)

        return {
            "modality": "limb_fracture",
            "prediction": pred_class,
            "confidence": confidence,
            "probabilities": {
                "NOT_FRACTURED": float(probs[0]),
                "FRACTURED": float(probs[1])
            },
            "original_image": original_b64,
            "gradcam_overlay": gradcam_b64,
            "guidance": guidance,
            "disclaimer": "For educational/research purposes only — not a substitute for professional medical diagnosis."
        }

cv_service = CVService()
