"""
RadiNova AI — Phase 4: Limb Fracture Model Training (DenseNet-121)
Target: Binary Bone Fracture Classification (NOT_FRACTURED=0, FRACTURED=1)
"""

import sys
import time
import argparse
import numpy as np
import torch
import torch.nn as nn
from torch.utils.data import DataLoader
from pathlib import Path

# Add project root to sys.path
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))
from model.base_classifier import build_densenet121, get_transforms, ManifestDataset
from model.train_chest import compute_metrics, train_one_epoch, evaluate

CLASSES = ["NOT_FRACTURED", "FRACTURED"]
CLASS_TO_IDX = {"NOT_FRACTURED": 0, "FRACTURED": 1}

def main():
    parser = argparse.ArgumentParser(description="Train DenseNet-121 on Limb Fracture Dataset")
    parser.add_argument("--manifest", type=str, default="datasets/limb_manifest.csv", help="Path to manifest CSV")
    parser.add_argument("--epochs", type=int, default=10, help="Training epochs")
    parser.add_argument("--batch-size", type=int, default=16, help="Batch size")
    parser.add_argument("--lr", type=float, default=1e-4, help="Learning rate")
    parser.add_argument("--output-weights", type=str, default="model/weights/limb_densenet121.pth", help="Target checkpoint path")
    args = parser.parse_args()

    device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
    print(f"==================================================")
    print(f" RadiNova AI — Limb Fracture Training (DenseNet-121)")
    print(f" Device: {device} | PyTorch: {torch.__version__}")
    print(f"==================================================")

    manifest_path = Path(args.manifest)
    if not manifest_path.exists():
        print(f"[ERROR] Manifest CSV not found at: {manifest_path}")
        print("Please run Phase 4 dataset preparation first: python datasets/prep_limb_fracture.py")
        sys.exit(1)

    train_ds = ManifestDataset(str(manifest_path), split="train", class_to_idx=CLASS_TO_IDX, transform=get_transforms(is_training=True))
    val_ds = ManifestDataset(str(manifest_path), split="val", class_to_idx=CLASS_TO_IDX, transform=get_transforms(is_training=False))
    test_ds = ManifestDataset(str(manifest_path), split="test", class_to_idx=CLASS_TO_IDX, transform=get_transforms(is_training=False))

    train_loader = DataLoader(train_ds, batch_size=args.batch_size, shuffle=True, num_workers=0)
    val_loader = DataLoader(val_ds, batch_size=args.batch_size, shuffle=False, num_workers=0)
    test_loader = DataLoader(test_ds, batch_size=args.batch_size, shuffle=False, num_workers=0)

    model = build_densenet121(num_classes=2, pretrained=True, freeze_features=False)
    model = model.to(device)

    criterion = nn.CrossEntropyLoss()
    optimizer = torch.optim.AdamW(model.parameters(), lr=args.lr, weight_decay=1e-2)
    scheduler = torch.optim.lr_scheduler.CosineAnnealingLR(optimizer, T_max=args.epochs)

    best_val_f1 = 0.0
    best_weights_path = Path(args.output_weights)
    best_weights_path.parent.mkdir(parents=True, exist_ok=True)

    for epoch in range(1, args.epochs + 1):
        train_metrics = train_one_epoch(model, train_loader, criterion, optimizer, device)
        val_metrics = evaluate(model, val_loader, criterion, device)
        scheduler.step()

        print(f"Epoch [{epoch:02d}/{args.epochs:02d}] "
              f"Train Loss: {train_metrics['loss']:.4f} Acc: {train_metrics['accuracy']*100:.1f}% Rec: {train_metrics['recall_sensitivity']*100:.1f}% | "
              f"Val Loss: {val_metrics['loss']:.4f} Acc: {val_metrics['accuracy']*100:.1f}% Rec: {val_metrics['recall_sensitivity']*100:.1f}% F1: {val_metrics['f1_score']:.4f}")

        if val_metrics['f1_score'] > best_val_f1:
            best_val_f1 = val_metrics['f1_score']
            torch.save({
                "model_state_dict": model.state_dict(),
                "val_metrics": val_metrics,
                "classes": CLASSES,
                "architecture": "densenet121",
                "epoch": epoch
            }, str(best_weights_path))
            print(f"  >>> Best model saved (Val F1: {best_val_f1:.4f}) -> {best_weights_path}")

    # Final test evaluation
    checkpoint = torch.load(str(best_weights_path), map_location=device)
    model.load_state_dict(checkpoint["model_state_dict"])
    test_metrics = evaluate(model, test_loader, criterion, device)

    print("\n" + "="*50)
    print(" FINAL LIMB FRACTURE TEST EVALUATION")
    print("="*50)
    print(f"Accuracy:              {test_metrics['accuracy']*100:.2f}%")
    print(f"Precision:             {test_metrics['precision']*100:.2f}%")
    print(f"Recall (Sensitivity):  {test_metrics['recall_sensitivity']*100:.2f}% (CRITICAL)")
    print(f"F1-Score:              {test_metrics['f1_score']:.4f}")
    print("="*50)

if __name__ == "__main__":
    main()
