"""
RadiNova AI — Phase 4: Limb Fracture Dataset Preparation & 80/10/10 Stratified Re-Split
Dataset: devbatrax/fracture-detection-using-x-ray-images (Kaggle)
Classes: NOT_FRACTURED (0) vs FRACTURED (1)
"""

import os
import csv
import random
import argparse
from pathlib import Path
from typing import List, Tuple, Dict

RANDOM_SEED = 42
DEFAULT_DATASET_DIR = Path("datasets/fracture_detection")
MANIFEST_OUTPUT_PATH = Path("datasets/limb_manifest.csv")

def find_limb_images(base_dir: Path) -> List[Tuple[str, str]]:
    """
    Recursively scans for bone / limb radiographs and maps them to NOT_FRACTURED vs FRACTURED.
    """
    valid_extensions = {".jpeg", ".jpg", ".png", ".JPEG", ".JPG", ".PNG"}
    samples = []
    
    for path in base_dir.rglob("*"):
        if path.is_file() and path.suffix in valid_extensions:
            path_str_upper = str(path).upper()
            if "NOT FRACTURED" in path_str_upper or "NOT_FRACTURED" in path_str_upper or "NORMAL" in path_str_upper:
                label = "NOT_FRACTURED"
            elif "FRACTURED" in path_str_upper or "FRACTURE" in path_str_upper:
                label = "FRACTURED"
            else:
                continue
                
            try:
                rel_path = path.relative_to(Path.cwd()).as_posix()
            except ValueError:
                rel_path = path.as_posix()
            samples.append((rel_path, label))
            
    return samples

def stratified_resplit(samples: List[Tuple[str, str]], seed: int = RANDOM_SEED) -> List[Dict[str, str]]:
    class_buckets: Dict[str, List[Tuple[str, str]]] = {}
    for filepath, label in samples:
        class_buckets.setdefault(label, []).append((filepath, label))
        
    rng = random.Random(seed)
    manifest_rows = []
    
    for label, items in class_buckets.items():
        items_copy = list(items)
        rng.shuffle(items_copy)
        
        n_total = len(items_copy)
        n_train = int(n_total * 0.80)
        n_val = int(n_total * 0.10)
        
        train_items = items_copy[:n_train]
        val_items = items_copy[n_train:n_train + n_val]
        test_items = items_copy[n_train + n_val:]
        
        for fp, lbl in train_items: manifest_rows.append({"filepath": fp, "label": lbl, "split": "train"})
        for fp, lbl in val_items: manifest_rows.append({"filepath": fp, "label": lbl, "split": "val"})
        for fp, lbl in test_items: manifest_rows.append({"filepath": fp, "label": lbl, "split": "test"})
            
        print(f"[{label}] Total: {n_total} -> Train: {len(train_items)}, Val: {len(val_items)}, Test: {len(test_items)}")
              
    rng.shuffle(manifest_rows)
    return manifest_rows

def main():
    parser = argparse.ArgumentParser(description="Prepare and stratified re-split Limb Fracture dataset.")
    parser.add_argument("--data-dir", type=str, default=None, help="Path to extracted fracture dataset")
    parser.add_argument("--output-csv", type=str, default=str(MANIFEST_OUTPUT_PATH), help="Output manifest CSV path")
    args = parser.parse_args()

    data_dir = Path(args.data_dir) if args.data_dir else DEFAULT_DATASET_DIR
    if not data_dir.exists():
        print(f"Limb fracture dataset not found at {data_dir}. Attempting download via kagglehub...")
        try:
            import kagglehub
            path = kagglehub.dataset_download("devbatrax/fracture-detection-using-x-ray-images")
            data_dir = Path(path)
            print(f"Downloaded to {data_dir}")
        except Exception as e:
            print(f"Download unavailable: {e}")
            return

    samples = find_limb_images(data_dir)
    print(f"Found {len(samples)} valid limb images.")
    if len(samples) > 0:
        manifest = stratified_resplit(samples)
        out_p = Path(args.output_csv)
        out_p.parent.mkdir(parents=True, exist_ok=True)
        with open(out_p, "w", newline="", encoding="utf-8") as f:
            writer = csv.DictWriter(f, fieldnames=["filepath", "label", "split"])
            writer.writeheader()
            writer.writerows(manifest)
        print(f"Manifest written to {out_p}")

if __name__ == "__main__":
    main()
