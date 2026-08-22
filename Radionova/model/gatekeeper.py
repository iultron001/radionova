"""
RadiNova AI — Lightweight Modality Gatekeeper Architecture & Validator
Backbone: MobileNetV2 (Transfer Learning, ~9MB)
Provides high-efficiency binary modality verification (valid vs invalid modality)
to protect downstream diagnostic models from out-of-distribution inputs.
"""

import io
import torch
import torch.nn as nn
import torch.nn.functional as F
from torchvision import models, transforms
from PIL import Image
from pathlib import Path
from typing import Dict, Any, Tuple, Optional

# ImageNet standard normalization
IMAGENET_MEAN = [0.485, 0.456, 0.406]
IMAGENET_STD = [0.229, 0.224, 0.225]

def get_gatekeeper_transforms(image_size: int = 224, is_training: bool = False) -> transforms.Compose:
    """Transformation pipeline for gatekeeper models."""
    if is_training:
        return transforms.Compose([
            transforms.Resize((image_size, image_size)),
            transforms.RandomHorizontalFlip(p=0.5),
            transforms.RandomRotation(degrees=10),
            transforms.ColorJitter(brightness=0.15, contrast=0.15),
            transforms.ToTensor(),
            transforms.Normalize(mean=IMAGENET_MEAN, std=IMAGENET_STD),
        ])
    else:
        return transforms.Compose([
            transforms.Resize((image_size, image_size)),
            transforms.ToTensor(),
            transforms.Normalize(mean=IMAGENET_MEAN, std=IMAGENET_STD),
        ])

def build_gatekeeper_model(pretrained: bool = True, freeze_features: bool = False) -> nn.Module:
    """
    Builds lightweight MobileNetV2 binary classifier.
    Classes: [0: INVALID_MODALITY, 1: VALID_MODALITY]
    """
    if pretrained:
        weights = models.MobileNet_V2_Weights.DEFAULT
        model = models.mobilenet_v2(weights=weights)
    else:
        model = models.mobilenet_v2(weights=None)

    if freeze_features:
        for param in model.features.parameters():
            param.requires_grad = False

    in_features = model.classifier[1].in_features
    # Binary classification head: 0 = INVALID, 1 = VALID
    model.classifier = nn.Sequential(
        nn.Dropout(p=0.2),
        nn.Linear(in_features, 2)
    )
    return model

class GatekeeperValidator:
    """
    Reusable Modality Gatekeeper Validator.
    Runs fast binary validation before invoking full diagnostic pipelines.
    """
    def __init__(self, modality_name: str, checkpoint_path: str, threshold: float = 0.65, device: Optional[torch.device] = None):
        self.modality_name = modality_name
        self.checkpoint_path = checkpoint_path
        self.threshold = threshold
        self.device = device or torch.device("cuda" if torch.cuda.is_available() else "cpu")
        self.transform = get_gatekeeper_transforms(image_size=224, is_training=False)
        self.model = self._load_weights()

    def _load_weights(self) -> nn.Module:
        model = build_gatekeeper_model(pretrained=True, freeze_features=False)
        ckpt_path = Path(self.checkpoint_path)
        if ckpt_path.exists():
            try:
                ckpt = torch.load(str(ckpt_path), map_location=self.device)
                if isinstance(ckpt, dict) and "model_state_dict" in ckpt:
                    model.load_state_dict(ckpt["model_state_dict"])
                else:
                    model.load_state_dict(ckpt)
                print(f"[GatekeeperValidator] Loaded {self.modality_name} gatekeeper weights from {ckpt_path}")
            except Exception as e:
                print(f"[GatekeeperValidator] Warning: Failed to load weights from {ckpt_path}: {e}")
        else:
            print(f"[GatekeeperValidator] Checkpoint not found at {ckpt_path}. Using base ImageNet model.")
        
        model = model.to(self.device)
        model.eval()
        return model

    def validate_image(self, image: Image.Image) -> Dict[str, Any]:
        """
        Validates whether the provided PIL image matches this modality.
        Returns:
            is_valid (bool): True if valid modality confidence >= threshold.
            confidence (float): Probability score of being a valid modality.
            status (str): "valid" or "rejected"
            reason (str): Human-friendly explanation if rejected.
        """
        img_rgb = image.convert("RGB")
        tensor = self.transform(img_rgb).unsqueeze(0).to(self.device)

        with torch.no_grad():
            logits = self.model(tensor)
            probs = F.softmax(logits, dim=1)[0].cpu().numpy()

        invalid_prob = float(probs[0])
        valid_prob = float(probs[1])

        is_valid = bool(valid_prob >= self.threshold)

        friendly_name = {
            "chest_xray": "chest X-ray",
            "limb_fracture": "limb X-ray",
            "mri": "brain MRI"
        }.get(self.modality_name, self.modality_name)

        if not is_valid:
            reason = f"This doesn't look like a valid {friendly_name}. Please upload a valid {friendly_name} image."
        else:
            reason = f"Verified valid {friendly_name} scan."

        return {
            "is_valid": is_valid,
            "modality": self.modality_name,
            "valid_probability": valid_prob,
            "invalid_probability": invalid_prob,
            "threshold": self.threshold,
            "status": "valid" if is_valid else "rejected",
            "reason": reason
        }

    def validate_bytes(self, image_bytes: bytes) -> Dict[str, Any]:
        """Validates raw image bytes."""
        try:
            image = Image.open(io.BytesIO(image_bytes))
            return self.validate_image(image)
        except Exception as e:
            return {
                "is_valid": False,
                "modality": self.modality_name,
                "valid_probability": 0.0,
                "invalid_probability": 1.0,
                "threshold": self.threshold,
                "status": "rejected",
                "reason": f"Corrupt or unreadable image file: {str(e)}"
            }
