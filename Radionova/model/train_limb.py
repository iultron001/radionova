"""
RadiNova AI — Phase 4: Limb Fracture Model Training (DenseNet-121)
Target: Binary Bone Fracture Classification (NOT_FRACTURED=0, FRACTURED=1)

Priority Metric: RECALL (Sensitivity) — Minimizing false negatives (missed fractures) in musculoskeletal radiology.
"""

import os
import sys
import time
import argparse
import numpy as np
import pandas as pd
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
    parser.add_argument("--epochs", type=int, default=3, help="Stage 2 fine-tuning epochs")
    parser.add_argument("--warmup-epochs", type=int, default=1, help="Stage 1 classifier head warmup epochs")
    parser.add_argument("--batch-size", type=int, default=32, help="Batch size")
    parser.add_argument("--lr", type=float, default=1e-4, help="Learning rate for fine-tuning")
    parser.add_argument("--subset", type=int, default=None, help="Optional max sample limit per split for rapid testing")
    parser.add_argument("--output-weights", type=str, default="model/weights/limb_densenet121.pth", help="Target checkpoint path")
    args = parser.parse_args()

    device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
    print("=" * 60, flush=True)
    print(" RadiNova AI — Limb Fracture Training (DenseNet-121)", flush=True)
    print(f" Device: {device} | PyTorch: {torch.__version__}", flush=True)
    print(f" Warmup Epochs: {args.warmup_epochs} | Fine-tune Epochs: {args.epochs} | Batch Size: {args.batch_size}", flush=True)
    print("=" * 60, flush=True)

    manifest_path = Path(args.manifest)
    if not manifest_path.exists():
        print(f"[ERROR] Manifest CSV not found at: {manifest_path}", flush=True)
        print("Please run dataset preparation first: python datasets/prep_limb_fracture.py", flush=True)
        sys.exit(1)

    train_ds = ManifestDataset(str(manifest_path), split="train", class_to_idx=CLASS_TO_IDX, transform=get_transforms(is_training=True))
    val_ds = ManifestDataset(str(manifest_path), split="val", class_to_idx=CLASS_TO_IDX, transform=get_transforms(is_training=False))
    test_ds = ManifestDataset(str(manifest_path), split="test", class_to_idx=CLASS_TO_IDX, transform=get_transforms(is_training=False))

    if args.subset is not None:
        train_ds.df = train_ds.df.head(args.subset).reset_index(drop=True)
        val_ds.df = val_ds.df.head(max(int(args.subset * 0.15), 10)).reset_index(drop=True)
        test_ds.df = test_ds.df.head(max(int(args.subset * 0.15), 10)).reset_index(drop=True)
        print(f"[SUBSET MODE] Using {len(train_ds)} train, {len(val_ds)} val, {len(test_ds)} test samples.", flush=True)

    print(f"Loaded dataset splits -> Train: {len(train_ds)}, Val: {len(val_ds)}, Test: {len(test_ds)}", flush=True)

    train_loader = DataLoader(train_ds, batch_size=args.batch_size, shuffle=True, num_workers=0)
    val_loader = DataLoader(val_ds, batch_size=args.batch_size, shuffle=False, num_workers=0)
    test_loader = DataLoader(test_ds, batch_size=args.batch_size, shuffle=False, num_workers=0)

    # Calculate class weights for balanced medical loss penalty
    n_train_nf = int((train_ds.df["label"] == "NOT_FRACTURED").sum())
    n_train_fr = int((train_ds.df["label"] == "FRACTURED").sum())
    w_nf = len(train_ds) / (2.0 * max(n_train_nf, 1))
    w_fr = len(train_ds) / (2.0 * max(n_train_fr, 1))
    class_weights = torch.tensor([w_nf, w_fr], dtype=torch.float32).to(device)
    print(f"Class counts: NOT_FRACTURED={n_train_nf}, FRACTURED={n_train_fr}", flush=True)
    print(f"Class weighting: NOT_FRACTURED={w_nf:.3f}, FRACTURED={w_fr:.3f}", flush=True)

    criterion = nn.CrossEntropyLoss(weight=class_weights)

    # Initialize DenseNet-121 with ImageNet weights
    model = build_densenet121(num_classes=2, pretrained=True, freeze_features=False)
    model = model.to(device)

    best_val_f1 = 0.0
    best_weights_path = Path(args.output_weights)
    best_weights_path.parent.mkdir(parents=True, exist_ok=True)
    start_time = time.time()

    # STAGE 1: Classifier head warmup with backbone frozen
    if args.warmup_epochs > 0:
        print("\n--- Stage 1: Classifier Head Warm-Up (Backbone Frozen) ---", flush=True)
        for param in model.features.parameters():
            param.requires_grad = False

        optimizer_head = torch.optim.AdamW(model.classifier.parameters(), lr=1e-3, weight_decay=1e-2)
        for epoch in range(1, args.warmup_epochs + 1):
            t0 = time.time()
            train_metrics = train_one_epoch(model, train_loader, criterion, optimizer_head, device, epoch_idx=epoch, total_epochs=args.warmup_epochs)
            val_metrics = evaluate(model, val_loader, criterion, device)
            elapsed = time.time() - t0

            print(f"[Stage 1] Epoch [{epoch:02d}/{args.warmup_epochs:02d}] ({elapsed:.1f}s) "
                  f"Train Loss: {train_metrics['loss']:.4f} Acc: {train_metrics['accuracy']*100:.1f}% Rec: {train_metrics['recall_sensitivity']*100:.1f}% | "
                  f"Val Loss: {val_metrics['loss']:.4f} Acc: {val_metrics['accuracy']*100:.1f}% Rec: {val_metrics['recall_sensitivity']*100:.1f}% F1: {val_metrics['f1_score']:.4f}", flush=True)

            if val_metrics['f1_score'] > best_val_f1:
                best_val_f1 = val_metrics['f1_score']
                torch.save({
                    "model_state_dict": model.state_dict(),
                    "val_metrics": val_metrics,
                    "classes": CLASSES,
                    "architecture": "densenet121",
                    "stage": 1,
                    "epoch": epoch
                }, str(best_weights_path))

    # STAGE 2: Fine-tune denseblock4 & classifier
    if args.epochs > 0:
        print("\n--- Stage 2: Fine-Tuning denseblock4 & Classifier Head ---", flush=True)
        for name, param in model.features.named_parameters():
            if "denseblock4" in name or "norm5" in name:
                param.requires_grad = True

        trainable_params = [p for p in model.parameters() if p.requires_grad]
        optimizer = torch.optim.AdamW(trainable_params, lr=args.lr, weight_decay=1e-2)
        scheduler = torch.optim.lr_scheduler.CosineAnnealingLR(optimizer, T_max=args.epochs)

        for epoch in range(1, args.epochs + 1):
            t0 = time.time()
            train_metrics = train_one_epoch(model, train_loader, criterion, optimizer, device, epoch_idx=epoch, total_epochs=args.epochs)
            val_metrics = evaluate(model, val_loader, criterion, device)
            scheduler.step()
            elapsed = time.time() - t0

            print(f"[Stage 2] Epoch [{epoch:02d}/{args.epochs:02d}] ({elapsed:.1f}s) "
                  f"Train Loss: {train_metrics['loss']:.4f} Acc: {train_metrics['accuracy']*100:.1f}% Rec: {train_metrics['recall_sensitivity']*100:.1f}% | "
                  f"Val Loss: {val_metrics['loss']:.4f} Acc: {val_metrics['accuracy']*100:.1f}% Rec: {val_metrics['recall_sensitivity']*100:.1f}% F1: {val_metrics['f1_score']:.4f}", flush=True)

            if val_metrics['f1_score'] >= best_val_f1:
                best_val_f1 = val_metrics['f1_score']
                torch.save({
                    "model_state_dict": model.state_dict(),
                    "val_metrics": val_metrics,
                    "classes": CLASSES,
                    "architecture": "densenet121",
                    "stage": 2,
                    "epoch": epoch
                }, str(best_weights_path))
                print(f"  >>> Best model checkpoint saved (Val F1: {best_val_f1:.4f}) -> {best_weights_path}", flush=True)

    total_time = time.time() - start_time
    print(f"\nTraining pipeline completed in {total_time/60:.2f} minutes.", flush=True)

    # FINAL EVALUATION ON UNSEEN TEST DATA
    if best_weights_path.exists():
        checkpoint = torch.load(str(best_weights_path), map_location=device)
        model.load_state_dict(checkpoint["model_state_dict"])
    test_metrics = evaluate(model, test_loader, criterion, device)

    print("\n" + "=" * 60, flush=True)
    print(" FINAL LIMB FRACTURE TEST SET EVALUATION (Unseen Data)", flush=True)
    print("=" * 60, flush=True)
    print(f"Test Accuracy:             {test_metrics['accuracy']*100:.2f}%", flush=True)
    print(f"Test Precision (PPV):      {test_metrics['precision']*100:.2f}%", flush=True)
    print(f"Test Recall / Sensitivity: {test_metrics['recall_sensitivity']*100:.2f}% (CRITICAL MEDICAL METRIC)", flush=True)
    print(f"Test Specificity (TNR):    {test_metrics['specificity']*100:.2f}%", flush=True)
    print(f"Test F1-Score:             {test_metrics['f1_score']:.4f}", flush=True)
    print("\nConfusion Matrix (Test Set):", flush=True)
    print(f"                       Predicted NOT_FRACTURED   Predicted FRACTURED", flush=True)
    print(f"Actual NOT_FRACTURED   {test_metrics['confusion_matrix']['TN']:<25} {test_metrics['confusion_matrix']['FP']:<25}", flush=True)
    print(f"Actual FRACTURED       {test_metrics['confusion_matrix']['FN']:<25} {test_metrics['confusion_matrix']['TP']:<25}", flush=True)
    print("=" * 60, flush=True)

if __name__ == "__main__":
    main()
