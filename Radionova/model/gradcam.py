"""
RadiNova AI — Phase 3: Reusable Grad-CAM Explainability Module
Targets: model.features.denseblock4 (DenseNet-121 last convolutional block)

Generates visual explainability heatmaps overlaying salient anatomical regions
contributing to the model's diagnostic classification.
"""

import io
import base64
import numpy as np
import torch
import torch.nn as nn
import torch.nn.functional as F
from PIL import Image
import cv2
from typing import Tuple, Optional, Union

class GradCAM:
    """
    Native PyTorch Grad-CAM (Gradient-weighted Class Activation Mapping).
    Hooks into DenseNet-121 target layer (denseblock4) without external dependencies.
    """
    def __init__(self, model: nn.Module, target_layer: Optional[nn.Module] = None):
        self.model = model
        self.model.eval()
        
        # Default target layer for DenseNet-121 is the final dense block
        if target_layer is None:
            if hasattr(model, "features") and hasattr(model.features, "denseblock4"):
                self.target_layer = model.features.denseblock4
            else:
                # Fallback to last child in features
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

    def generate_heatmap(self, input_tensor: torch.Tensor, target_class: Optional[int] = None) -> np.ndarray:
        """
        Computes the normalized Grad-CAM heatmap for a single image tensor (1, C, H, W).
        Returns a 2D numpy array [0.0, 1.0] of shape (H, W).
        """
        self.model.zero_grad()
        logits = self.model(input_tensor)
        
        if target_class is None:
            target_class = torch.argmax(logits, dim=1).item()

        # Backward pass for the target class score
        score = logits[0, target_class]
        score.backward(retain_graph=True)

        # Gradients: (1, Channels, H, W), Activations: (1, Channels, H, W)
        grads = self.gradients[0]  # (Channels, H, W)
        acts = self.activations[0] # (Channels, H, W)

        # Global average pooling of gradients (channel-wise weights alpha)
        weights = torch.mean(grads, dim=(1, 2), keepdim=True)  # (Channels, 1, 1)
        
        # Linear combination of weighted activations
        cam = torch.sum(weights * acts, dim=0) # (H, W)
        
        # Apply ReLU to retain only positive influences
        cam = F.relu(cam)
        cam_np = cam.cpu().numpy()
        
        # Normalize to [0, 1]
        cam_min, cam_max = cam_np.min(), cam_np.max()
        if cam_max - cam_min > 1e-8:
            cam_np = (cam_np - cam_min) / (cam_max - cam_min)
        else:
            cam_np = np.zeros_like(cam_np)

        # Apply focal power sharpening to isolate highest-intensity epicenters
        cam_np = np.power(cam_np, 2.2)

        # Suppress peripheral image boundary padding noise (outer 6% margin)
        gh, gw = cam_np.shape
        by = max(int(gh * 0.06), 1)
        bx = max(int(gw * 0.06), 1)
        border_mask = np.ones_like(cam_np)
        border_mask[:by, :] *= 0.15
        border_mask[-by:, :] *= 0.15
        border_mask[:, :bx] *= 0.15
        border_mask[:, -bx:] *= 0.15
        cam_np = cam_np * border_mask

        # Re-normalize focal map
        if cam_np.max() > 1e-6:
            cam_np = cam_np / cam_np.max()
        else:
            cam_np = np.zeros_like(cam_np)

        return cam_np

def apply_gradcam_overlay(
    original_image: Union[Image.Image, np.ndarray], 
    heatmap: np.ndarray, 
    alpha: float = 0.55, 
    colormap: int = cv2.COLORMAP_JET,
    is_normal: bool = False
) -> Tuple[Image.Image, np.ndarray]:
    """
    Overlays Grad-CAM heatmap onto the original radiograph with adaptive focal alpha blending.
    If the scan is NORMAL, low/diffuse activations are suppressed so healthy tissue is not falsely marked.
    """
    if isinstance(original_image, Image.Image):
        orig_rgb = np.array(original_image.convert("RGB"))
    else:
        orig_rgb = original_image.copy()

    h, w, _ = orig_rgb.shape
    
    # High-quality bicubic interpolation
    resized_heatmap = cv2.resize(heatmap, (w, h), interpolation=cv2.INTER_CUBIC)
    resized_heatmap = np.clip(resized_heatmap, 0.0, 1.0)
    
    # Smooth anatomical contours
    smooth_heatmap = cv2.GaussianBlur(resized_heatmap, (15, 15), 0)
    smooth_heatmap = np.clip(smooth_heatmap, 0.0, 1.0)

    # 8-bit Colormap conversion
    heatmap_uint8 = np.uint8(255 * smooth_heatmap)
    heatmap_color = cv2.applyColorMap(heatmap_uint8, colormap)
    heatmap_color_rgb = cv2.cvtColor(heatmap_color, cv2.COLOR_BGR2RGB)

    # Adaptive focal alpha blending:
    # If normal, use high threshold (0.65) so healthy tissue stays pristine
    # If pathological (Pneumonia/Fracture), threshold at 0.35 to show true affected epicenters
    thresh = 0.65 if is_normal else 0.35
    mask = np.clip((smooth_heatmap - thresh) / (1.0 - thresh + 1e-6), 0.0, 1.0)
    # Apply soft sigmoid curve to mask
    mask = np.power(mask, 1.5)
    adaptive_alpha = (mask * alpha)[:, :, np.newaxis]

    # Seamless composite
    blended = np.uint8(adaptive_alpha * heatmap_color_rgb + (1.0 - adaptive_alpha) * orig_rgb)
    blended_pil = Image.fromarray(blended)
    
    return blended_pil, blended

def image_to_base64(image: Image.Image, format: str = "JPEG") -> str:
    """Converts a PIL Image to a base64 encoded data URI string."""
    buffered = io.BytesIO()
    image.save(buffered, format=format, quality=90)
    img_str = base64.b64encode(buffered.getvalue()).decode("utf-8")
    return f"data:image/{format.lower()};base64,{img_str}"
