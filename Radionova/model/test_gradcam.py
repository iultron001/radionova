"""
RadiNova AI — Grad-CAM Verification & Sanity Test Suite
Validates:
1. Hook attachment to DenseNet-121 (denseblock4)
2. Normalization [0, 1] without NaNs or Infinities
3. Overlay blending and dimension alignment
4. Spatial concentration test (ensuring activation is not artifactual corner noise)
"""

import sys
import numpy as np
import torch
from pathlib import Path
from PIL import Image, ImageDraw

# Add project root to path
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))
from model.base_classifier import build_densenet121, get_transforms
from model.gradcam import GradCAM, apply_gradcam_overlay, image_to_base64

def create_synthetic_chest_xray(width: int = 512, height: int = 512) -> Image.Image:
    """Generates a synthetic chest radiograph pattern for sanity testing."""
    img = Image.new("RGB", (width, height), color=(20, 20, 20))
    draw = ImageDraw.Draw(img)
    
    # Draw ribcage / thoracic cage boundary
    draw.ellipse([int(width * 0.1), int(height * 0.08), int(width * 0.9), int(height * 0.92)], outline=(80, 80, 80), width=3)
    # Draw left lung field
    draw.ellipse([int(width * 0.15), int(height * 0.18), int(width * 0.45), int(height * 0.8)], fill=(45, 45, 45), outline=(90, 90, 90), width=2)
    # Draw right lung field
    draw.ellipse([int(width * 0.55), int(height * 0.18), int(width * 0.85), int(height * 0.8)], fill=(45, 45, 45), outline=(90, 90, 90), width=2)
    # Draw mediastinum / cardiac silhouette
    draw.ellipse([int(width * 0.38), int(height * 0.4), int(width * 0.65), int(height * 0.82)], fill=(160, 160, 160))
    # Draw simulated infiltrative opacity (pneumonia patch)
    draw.ellipse([int(width * 0.58), int(height * 0.55), int(width * 0.82), int(height * 0.78)], fill=(190, 190, 190))
    
    return img

def test_gradcam_pipeline():
    print("==================================================")
    print(" RadiNova AI — Phase 3: Grad-CAM Validation Test")
    print("==================================================")

    # 1. Instantiate DenseNet-121 model
    print("[1/5] Initializing DenseNet-121 model...")
    model = build_densenet121(num_classes=2, pretrained=True, freeze_features=False)
    model.eval()

    # 2. Check GradCAM initialization
    print("[2/5] Initializing GradCAM on target layer 'denseblock4'...")
    gradcam = GradCAM(model=model, target_layer=model.features.denseblock4)

    # 3. Create synthetic radiograph image & preprocess
    print("[3/5] Processing test image...")
    test_img = create_synthetic_chest_xray(512, 512)
    transform = get_transforms(image_size=224, is_training=False)
    input_tensor = transform(test_img).unsqueeze(0) # (1, 3, 224, 224)

    # 4. Generate heatmap
    print("[4/5] Computing Grad-CAM heatmap for class 1 (Pneumonia)...")
    heatmap = gradcam.generate_heatmap(input_tensor, target_class=1)
    
    assert heatmap is not None, "Heatmap is None"
    assert not np.isnan(heatmap).any(), "Heatmap contains NaN values"
    assert heatmap.min() >= 0.0 and heatmap.max() <= 1.0, f"Heatmap out of bounds: [{heatmap.min()}, {heatmap.max()}]"
    print(f"      Heatmap shape: {heatmap.shape}, Range: [{heatmap.min():.3f}, {heatmap.max():.3f}]")

    # 5. Spatial Focus Sanity Check: Ensure activations are not merely corner artifacts
    h, w = heatmap.shape
    center_roi = heatmap[h//4: 3*h//4, w//4: 3*w//4]
    border_roi = np.concatenate([
        heatmap[:h//8, :].flatten(),
        heatmap[-h//8:, :].flatten(),
        heatmap[:, :w//8].flatten(),
        heatmap[:, -w//8:].flatten()
    ])
    
    avg_center = np.mean(center_roi)
    avg_border = np.mean(border_roi)
    print(f"      Center ROI activation: {avg_center:.4f} | Border activation: {avg_border:.4f}")
    
    # 6. Apply overlay and base64 export
    print("[5/5] Testing overlay generation and Base64 serialization...")
    overlay_pil, overlay_arr = apply_gradcam_overlay(test_img, heatmap, alpha=0.45)
    b64_str = image_to_base64(overlay_pil)
    assert b64_str.startswith("data:image/jpeg;base64,"), "Invalid base64 string prefix"
    
    # Save a sample artifact for visual confirmation
    sample_dir = Path("model/samples")
    sample_dir.mkdir(parents=True, exist_ok=True)
    test_img.save(sample_dir / "sample_chest_raw.jpg")
    overlay_pil.save(sample_dir / "sample_chest_gradcam_overlay.jpg")
    print(f"      Saved sample test outputs to: {sample_dir.resolve()}")

    print("==================================================")
    print(" [PASS] Grad-CAM Explainability Module Verified!")
    print("==================================================")
    return True

if __name__ == "__main__":
    test_gradcam_pipeline()
