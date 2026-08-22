"""
RadiNova AI — Enhanced Grad-CAM Explainability Module
Supports DenseNet-121 feature layer hooks with modality-adaptive focal sharpening,
bone cortical boundary focusing for fractures, and anatomical zone coordinate localization.
"""

import io
import base64
import numpy as np
import torch
import torch.nn as nn
import torch.nn.functional as F
from PIL import Image
import cv2
from typing import Tuple, Optional, Union, Dict, Any

class GradCAM:
    """
    Native PyTorch Grad-CAM (Gradient-weighted Class Activation Mapping).
    Hooks into DenseNet-121 target layer (denseblock4) with focal concentration.
    """
    def __init__(self, model: nn.Module, target_layer: Optional[nn.Module] = None):
        self.model = model
        self.model.eval()
        
        if target_layer is None:
            if hasattr(model, "features") and hasattr(model.features, "denseblock4"):
                self.target_layer = model.features.denseblock4
            else:
                self.target_layer = list(model.features.children())[-1]
        else:
            self.target_layer = target_layer

        self.activations: Optional[torch.Tensor] = None
        self.gradients: Optional[torch.Tensor] = None
        self._register_hooks()

    def _register_hooks(self):
        def forward_hook(module, input, output):
            self.activations = output.detach()

        def backward_hook(module, grad_input, grad_output):
            self.gradients = grad_output[0].detach()

        self.target_layer.register_forward_hook(forward_hook)
        self.target_layer.register_full_backward_hook(backward_hook)

    def generate_heatmap(
        self, 
        input_tensor: torch.Tensor, 
        target_class: Optional[int] = None,
        modality: str = "chest_xray"
    ) -> np.ndarray:
        """
        Computes the normalized Grad-CAM heatmap for a single image tensor (1, C, H, W).
        Returns a 2D numpy array [0.0, 1.0] of shape (H, W).
        """
        self.model.zero_grad()
        logits = self.model(input_tensor)
        
        if target_class is None:
            target_class = torch.argmax(logits, dim=1).item()

        score = logits[0, target_class]
        score.backward(retain_graph=True)

        grads = self.gradients[0]  # (Channels, H, W)
        acts = self.activations[0] # (Channels, H, W)

        # Global average pooling of gradients
        weights = torch.mean(grads, dim=(1, 2), keepdim=True)
        
        # Linear combination of weighted activations
        cam = torch.sum(weights * acts, dim=0)
        cam = F.relu(cam)
        cam_np = cam.cpu().numpy()
        
        # Normalize
        cam_min, cam_max = cam_np.min(), cam_np.max()
        if cam_max - cam_min > 1e-8:
            cam_np = (cam_np - cam_min) / (cam_max - cam_min)
        else:
            cam_np = np.zeros_like(cam_np)

        # Modality-Adaptive Focal Power Sharpening:
        # Bone fractures are high-gradient narrow lines (power 3.0); Chest consolidations are lobar/parenchymal (power 2.2)
        exponent = 3.0 if "limb" in modality or "fracture" in modality else 2.2
        cam_np = np.power(cam_np, exponent)

        # Margin padding noise reduction
        gh, gw = cam_np.shape
        by = max(int(gh * 0.05), 1)
        bx = max(int(gw * 0.05), 1)
        border_mask = np.ones_like(cam_np)
        border_mask[:by, :] *= 0.1
        border_mask[-by:, :] *= 0.1
        border_mask[:, :bx] *= 0.1
        border_mask[:, -bx:] *= 0.1
        cam_np = cam_np * border_mask

        if cam_np.max() > 1e-6:
            cam_np = cam_np / cam_np.max()
        else:
            cam_np = np.zeros_like(cam_np)

        return cam_np

def calculate_focal_metrics(heatmap: np.ndarray) -> Dict[str, Any]:
    """Calculates spatial epicenter coordinates and focal intensity distribution."""
    h, w = heatmap.shape
    max_idx = np.unravel_index(np.argmax(heatmap), (h, w))
    y_norm = float(max_idx[0] / max(h - 1, 1))
    x_norm = float(max_idx[1] / max(w - 1, 1))

    # Determine anatomical quadrant
    quad_y = "Upper" if y_norm < 0.35 else ("Middle" if y_norm < 0.65 else "Lower")
    quad_x = "Right" if x_norm < 0.45 else ("Left" if x_norm > 0.55 else "Central")
    focal_zone = f"{quad_y} {quad_x} Field"

    # Focal compactness (ratio of high activation area to total area)
    high_act_ratio = float(np.mean(heatmap > 0.6))
    focal_compactness = "Highly Localized (Focal)" if high_act_ratio < 0.08 else "Regional / Multifocal"

    return {
        "epicenter_y": y_norm,
        "epicenter_x": x_norm,
        "focal_zone": focal_zone,
        "focal_compactness": focal_compactness,
        "peak_intensity": float(np.max(heatmap))
    }

def apply_gradcam_overlay(
    original_image: Union[Image.Image, np.ndarray], 
    heatmap: np.ndarray, 
    alpha: float = 0.6, 
    colormap: int = cv2.COLORMAP_JET,
    is_normal: bool = False,
    modality: str = "chest_xray"
) -> Tuple[Image.Image, np.ndarray, Dict[str, Any]]:
    """
    Overlays Grad-CAM heatmap onto the original radiograph with adaptive focal alpha blending.
    Returns (overlay_pil, overlay_np, focal_metrics).
    """
    if isinstance(original_image, Image.Image):
        orig_rgb = np.array(original_image.convert("RGB"))
    else:
        orig_rgb = original_image.copy()

    h, w, _ = orig_rgb.shape
    
    resized_heatmap = cv2.resize(heatmap, (w, h), interpolation=cv2.INTER_CUBIC)
    resized_heatmap = np.clip(resized_heatmap, 0.0, 1.0)
    
    # Kernel size tailored to modality: smaller kernel for bone cortical margins
    k_size = 9 if ("limb" in modality or "fracture" in modality) else 15
    smooth_heatmap = cv2.GaussianBlur(resized_heatmap, (k_size, k_size), 0)
    smooth_heatmap = np.clip(smooth_heatmap, 0.0, 1.0)

    focal_metrics = calculate_focal_metrics(smooth_heatmap)

    heatmap_uint8 = np.uint8(255 * smooth_heatmap)
    heatmap_color = cv2.applyColorMap(heatmap_uint8, colormap)
    heatmap_color_rgb = cv2.cvtColor(heatmap_color, cv2.COLOR_BGR2RGB)

    # Thresholding
    thresh = 0.70 if is_normal else (0.28 if ("limb" in modality or "fracture" in modality) else 0.32)
    mask = np.clip((smooth_heatmap - thresh) / (1.0 - thresh + 1e-6), 0.0, 1.0)
    mask = np.power(mask, 1.6)
    adaptive_alpha = (mask * alpha)[:, :, np.newaxis]

    blended = np.uint8(adaptive_alpha * heatmap_color_rgb + (1.0 - adaptive_alpha) * orig_rgb)
    blended_pil = Image.fromarray(blended)
    
    return blended_pil, blended, focal_metrics

def image_to_base64(image: Image.Image, format: str = "JPEG") -> str:
    buffered = io.BytesIO()
    image.save(buffered, format=format, quality=92)
    img_str = base64.b64encode(buffered.getvalue()).decode("utf-8")
    return f"data:image/{format.lower()};base64,{img_str}"
