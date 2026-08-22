"""
RadiNova AI — Phase 2: Modality Gatekeeper Dataset Assembly
Creates stratified binary classification manifests for Chest and Limb gatekeepers.
- Positive class: In-distribution target modality (Chest X-ray / Limb X-ray)
- Negative class: Mixed out-of-distribution set (generic everyday images + cross-modality medical images + MRI scans)
"""

import os
import sys
import glob
import random
import urllib.request
import pandas as pd
import numpy as np
from PIL import Image, ImageDraw, ImageFilter
from pathlib import Path
from concurrent.futures import ThreadPoolExecutor

ROOT_DIR = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT_DIR))

GENERIC_DIR = ROOT_DIR / "datasets" / "generic_negatives"
GENERIC_DIR.mkdir(parents=True, exist_ok=True)

def download_or_generate_generic_images(target_count: int = 400):
    """
    Downloads diverse everyday photos or generates high-entropy natural texture/shapes
    to serve as generic non-medical negative examples.
    """
    existing_images = list(GENERIC_DIR.glob("*.jpg")) + list(GENERIC_DIR.glob("*.png"))
    if len(existing_images) >= target_count:
        print(f"[Gatekeeper Prep] Generic negatives already present: {len(existing_images)} images.")
        return [str(p) for p in existing_images]

    print(f"[Gatekeeper Prep] Gathering {target_count} diverse generic everyday images...")
    
    def fetch_image(idx: int):
        target_path = GENERIC_DIR / f"generic_{idx:04d}.jpg"
        if target_path.exists():
            return str(target_path)
        try:
            # Fetch random high-resolution everyday photo resized to 224x224
            url = f"https://picsum.photos/256/256?random={idx + 1000}"
            req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
            with urllib.request.urlopen(req, timeout=4) as response:
                img_data = response.read()
                img = Image.open(urllib.request.BytesIO(img_data)).convert("RGB")
                img = img.resize((224, 224), Image.Resampling.BILINEAR)
                img.save(target_path, "JPEG", quality=85)
                return str(target_path)
        except Exception:
            # Fallback: create high-entropy multi-colored geometric pattern / synthetic scene
            img = Image.new("RGB", (224, 224), color=(random.randint(50, 240), random.randint(50, 240), random.randint(50, 240)))
            draw = ImageDraw.Draw(img)
            for _ in range(random.randint(10, 25)):
                x0, y0 = random.randint(0, 200), random.randint(0, 200)
                x1, y1 = x0 + random.randint(20, 100), y0 + random.randint(20, 100)
                color = (random.randint(0, 255), random.randint(0, 255), random.randint(0, 255))
                shape_type = random.choice(["rectangle", "ellipse", "polygon"])
                if shape_type == "rectangle":
                    draw.rectangle([x0, y0, x1, y1], fill=color)
                elif shape_type == "ellipse":
                    draw.ellipse([x0, y0, x1, y1], fill=color)
                else:
                    draw.polygon([(x0, y0), (x1, y0), (random.randint(0, 224), y1)], fill=color)
            img = img.filter(ImageFilter.GaussianBlur(radius=random.uniform(0.5, 2.0)))
            img.save(target_path, "JPEG", quality=85)
            return str(target_path)

    with ThreadPoolExecutor(max_workers=20) as executor:
        results = list(executor.map(fetch_image, range(target_count)))

    valid_images = [r for r in results if r and os.path.exists(r)]
    print(f"[Gatekeeper Prep] Successfully assembled {len(valid_images)} generic negative images.")
    return valid_images

def create_gatekeeper_manifests():
    random.seed(42)
    np.random.seed(42)

    # 1. Load source manifests
    chest_manifest_path = ROOT_DIR / "datasets" / "chest_xray_manifest.csv"
    limb_manifest_path = ROOT_DIR / "datasets" / "limb_manifest.csv"
    mri_manifest_path = ROOT_DIR / "datasets" / "mri_manifest.csv"

    df_chest = pd.read_csv(chest_manifest_path)
    df_limb = pd.read_csv(limb_manifest_path)
    df_mri = pd.read_csv(mri_manifest_path) if mri_manifest_path.exists() else pd.DataFrame()

    generic_images = download_or_generate_generic_images(target_count=400)

    # Helper function to sample stratified splits
    def build_splits(pos_files, neg_files, target_train=1800, target_val=300, target_test=300):
        random.shuffle(pos_files)
        random.shuffle(neg_files)

        total_needed = target_train + target_val + target_test
        pos_sampled = pos_files[:total_needed]
        neg_sampled = neg_files[:total_needed]

        rows = []
        # Positive rows
        for i, f in enumerate(pos_sampled):
            if i < target_train:
                split = "train"
            elif i < target_train + target_val:
                split = "val"
            else:
                split = "test"
            rows.append({"filepath": f, "label": 1, "class_name": "VALID_MODALITY", "split": split})

        # Negative rows
        for i, f in enumerate(neg_sampled):
            if i < target_train:
                split = "train"
            elif i < target_train + target_val:
                split = "val"
            else:
                split = "test"
            rows.append({"filepath": f, "label": 0, "class_name": "INVALID_MODALITY", "split": split})

        df = pd.DataFrame(rows)
        # Shuffle rows
        df = df.sample(frac=1.0, random_state=42).reset_index(drop=True)
        return df

    # --- CHEST GATEKEEPER ---
    # Positives: Chest X-rays (Pneumonia + Normal)
    chest_pos = df_chest["filepath"].tolist()
    # Negatives: Generic photos + Limb X-rays + Brain MRIs
    limb_files = df_limb["filepath"].tolist()
    mri_files = df_mri["filepath"].tolist() if len(df_mri) > 0 else []
    
    chest_neg = generic_images + limb_files[:1400] + mri_files[:600]
    
    df_chest_gate = build_splits(chest_pos, chest_neg, target_train=1800, target_val=300, target_test=300)
    chest_gate_path = ROOT_DIR / "datasets" / "chest_gatekeeper_manifest.csv"
    df_chest_gate.to_csv(chest_gate_path, index=False)
    print(f"[Gatekeeper Prep] Saved Chest Gatekeeper manifest -> {chest_gate_path} (Total: {len(df_chest_gate)})")
    print(f"  Distribution: {df_chest_gate.groupby(['split', 'class_name']).size().to_dict()}")

    # --- LIMB GATEKEEPER ---
    # Positives: Limb X-rays (Fracture + Normal)
    limb_pos = df_limb["filepath"].tolist()
    # Negatives: Generic photos + Chest X-rays + Brain MRIs
    limb_neg = generic_images + chest_pos[:1400] + mri_files[:600]

    df_limb_gate = build_splits(limb_pos, limb_neg, target_train=1800, target_val=300, target_test=300)
    limb_gate_path = ROOT_DIR / "datasets" / "limb_gatekeeper_manifest.csv"
    df_limb_gate.to_csv(limb_gate_path, index=False)
    print(f"[Gatekeeper Prep] Saved Limb Gatekeeper manifest -> {limb_gate_path} (Total: {len(df_limb_gate)})")
    print(f"  Distribution: {df_limb_gate.groupby(['split', 'class_name']).size().to_dict()}")

if __name__ == "__main__":
    create_gatekeeper_manifests()
