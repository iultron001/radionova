"""
RadiNova AI — Phase 1: Chest X-ray Dataset Preparation & 80/10/10 Stratified Re-Split
Dataset: paultimothymooney/chest-xray-pneumonia (Kaggle)

Note: The official Kaggle dataset contains an imbalanced and tiny validation split (16 images).
This script pools all images across train, val, and test, then deterministically performs
an 80% Train / 10% Validation / 10% Test stratified re-split using a fixed random seed (42),
saving the master manifest to `datasets/chest_xray_manifest.csv`.
"""

import os
import csv
import random
import argparse
from pathlib import Path
from typing import List, Tuple, Dict

RANDOM_SEED = 42
DEFAULT_DATASET_DIR = Path("datasets/chest_xray")
MANIFEST_OUTPUT_PATH = Path("datasets/chest_xray_manifest.csv")

def find_images_in_dir(base_dir: Path) -> List[Tuple[str, str]]:
    """
    Recursively scans the directory for images and assigns binary labels
    based on folder names: NORMAL (0) vs PNEUMONIA (1).
    """
    valid_extensions = {".jpeg", ".jpg", ".png", ".JPEG", ".JPG", ".PNG"}
    samples = []
    
    for path in base_dir.rglob("*"):
        if "__MACOSX" in str(path) or path.name.startswith("._"):
            continue
        if path.is_file() and path.suffix in valid_extensions:
            # Check parent directory hierarchy for class label
            path_str_upper = str(path).upper()
            if "NORMAL" in path_str_upper:
                label = "NORMAL"
            elif "PNEUMONIA" in path_str_upper:
                label = "PNEUMONIA"
            else:
                continue
            
            # Store relative path from workspace root
            try:
                rel_path = path.relative_to(Path.cwd()).as_posix()
            except ValueError:
                rel_path = path.as_posix()
            samples.append((rel_path, label))
            
    return samples

def stratified_resplit(
    samples: List[Tuple[str, str]], 
    train_ratio: float = 0.80, 
    val_ratio: float = 0.10, 
    test_ratio: float = 0.10,
    seed: int = RANDOM_SEED
) -> List[Dict[str, str]]:
    """
    Performs stratified 80/10/10 splitting per class.
    """
    assert abs((train_ratio + val_ratio + test_ratio) - 1.0) < 1e-5, "Ratios must sum to 1.0"
    
    # Group samples by class
    class_buckets: Dict[str, List[Tuple[str, str]]] = {}
    for filepath, label in samples:
        class_buckets.setdefault(label, []).append((filepath, label))
        
    rng = random.Random(seed)
    manifest_rows = []
    
    for label, items in class_buckets.items():
        # Deterministic shuffle
        items_copy = list(items)
        rng.shuffle(items_copy)
        
        n_total = len(items_copy)
        n_train = int(n_total * train_ratio)
        n_val = int(n_total * val_ratio)
        
        train_items = items_copy[:n_train]
        val_items = items_copy[n_train:n_train + n_val]
        test_items = items_copy[n_train + n_val:]
        
        for fp, lbl in train_items:
            manifest_rows.append({"filepath": fp, "label": lbl, "split": "train"})
        for fp, lbl in val_items:
            manifest_rows.append({"filepath": fp, "label": lbl, "split": "val"})
        for fp, lbl in test_items:
            manifest_rows.append({"filepath": fp, "label": lbl, "split": "test"})
            
        print(f"[{label}] Total: {n_total} -> Train: {len(train_items)} ({len(train_items)/n_total*100:.1f}%), "
              f"Val: {len(val_items)} ({len(val_items)/n_total*100:.1f}%), "
              f"Test: {len(test_items)} ({len(test_items)/n_total*100:.1f}%)")
              
    # Shuffle final manifest rows for unbiased streaming
    rng.shuffle(manifest_rows)
    return manifest_rows

def save_manifest(manifest_rows: List[Dict[str, str]], output_csv: Path) -> None:
    output_csv.parent.mkdir(parents=True, exist_ok=True)
    with open(output_csv, mode="w", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(f, fieldnames=["filepath", "label", "split"])
        writer.writeheader()
        writer.writerows(manifest_rows)
    print(f"\nManifest successfully written to: {output_csv} ({len(manifest_rows)} total records)")

def download_from_kaggle() -> Path:
    """Attempts automatic download using kagglehub or kaggle CLI"""
    try:
        import kagglehub
        print("Downloading 'paultimothymooney/chest-xray-pneumonia' via kagglehub...")
        path = kagglehub.dataset_download("paultimothymooney/chest-xray-pneumonia")
        print(f"Dataset downloaded to cache: {path}")
        return Path(path)
    except Exception as e:
        print(f"kagglehub download unavailable: {e}")
        
    try:
        import importlib
        kaggle_mod = importlib.import_module("kaggle.api.kaggle_api_extended")
        api = getattr(kaggle_mod, "KaggleApi")()
        api.authenticate()
        target_dir = Path("datasets/chest_xray")
        target_dir.mkdir(parents=True, exist_ok=True)
        print("Downloading via Kaggle API...")
        api.dataset_download_files("paultimothymooney/chest-xray-pneumonia", path=str(target_dir), unzip=True)
        return target_dir
    except Exception as e:
        print(f"Kaggle API authentication unavailable: {e}")
        return DEFAULT_DATASET_DIR

def main():
    parser = argparse.ArgumentParser(description="Prepare and stratified re-split Chest X-Ray pneumonia dataset.")
    parser.add_argument("--data-dir", type=str, default=None, help="Path to extracted chest_xray directory")
    parser.add_argument("--output-csv", type=str, default=str(MANIFEST_OUTPUT_PATH), help="Output manifest CSV path")
    parser.add_argument("--seed", type=int, default=RANDOM_SEED, help="Random seed for deterministic re-split")
    args = parser.parse_args()

    data_dir = Path(args.data_dir) if args.data_dir else None
    
    if data_dir is None or not data_dir.exists():
        print(f"Data directory not specified or not found. Attempting download...")
        data_dir = download_from_kaggle()

    if not data_dir.exists():
        print(f"\n[ERROR] Dataset directory not found at: {data_dir}")
        print("Please provide your kaggle.json credentials or pass --data-dir <path_to_dataset>")
        return

    print(f"Scanning for images in: {data_dir}")
    samples = find_images_in_dir(data_dir)
    print(f"Found {len(samples)} total valid images.")
    
    if len(samples) == 0:
        print("[ERROR] No images found. Check folder structure.")
        return

    print(f"\nPerforming stratified 80/10/10 re-split with seed={args.seed}...")
    manifest = stratified_resplit(samples, seed=args.seed)
    save_manifest(manifest, Path(args.output_csv))

if __name__ == "__main__":
    main()
