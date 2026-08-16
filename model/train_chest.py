"""
RadiNova AI — Phase 2: Chest X-ray Model Training (DenseNet-121)
Target: Binary Pneumonia Classification (NORMAL=0, PNEUMONIA=1)

Priority Metric: RECALL (Sensitivity) — Minimizing false negatives is critical in medical diagnostic triage.
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

CLASSES = ["NORMAL", "PNEUMONIA"]
CLASS_TO_IDX = {"NORMAL": 0, "PNEUMONIA": 1}

def compute_metrics(y_true: np.ndarray, y_pred: np.ndarray) -> dict:
    """Computes medical diagnostic metrics: Accuracy, Precision, Recall (Sensitivity), F1, Specificity, Confusion Matrix."""
    # Binary confusion matrix elements
    # 0 = NORMAL (Negative), 1 = PNEUMONIA (Positive)
    tp = int(np.sum((y_true == 1) & (y_pred == 1)))
    tn = int(np.sum((y_true == 0) & (y_pred == 0)))
    fp = int(np.sum((y_true == 0) & (y_pred == 1)))
    fn = int(np.sum((y_true == 1) & (y_pred == 0)))

    accuracy = (tp + tn) / max(len(y_true), 1)
    precision = tp / max(tp + fp, 1)
    recall = tp / max(tp + fn, 1)  # SENSITIVITY (Priority metric)
    specificity = tn / max(tn + fp, 1)
    f1 = 2 * (precision * recall) / max(precision + recall, 1e-6)

    return {
        "accuracy": float(accuracy),
        "precision": float(precision),
        "recall_sensitivity": float(recall),
        "specificity": float(specificity),
        "f1_score": float(f1),
        "confusion_matrix": {
            "TP": tp, "TN": tn, "FP": fp, "FN": fn,
            "matrix_2x2": [[tn, fp], [fn, tp]]
        }
    }

def train_one_epoch(model, loader, criterion, optimizer, device):
    model.train()
    running_loss = 0.0
    all_preds, all_labels = [], []

    for images, labels in loader:
        images, labels = images.to(device), labels.to(device)
        optimizer.zero_grad()
        outputs = model(images)
        loss = criterion(outputs, labels)
        loss.backward()
        optimizer.step()

        running_loss += loss.item() * images.size(0)
        _, preds = torch.max(outputs, 1)
        all_preds.extend(preds.cpu().numpy())
        all_labels.extend(labels.cpu().numpy())

    epoch_loss = running_loss / len(loader.dataset)
    metrics = compute_metrics(np.array(all_labels), np.array(all_preds))
    metrics["loss"] = epoch_loss
    return metrics

def evaluate(model, loader, criterion, device):
    model.eval()
    running_loss = 0.0
    all_preds, all_labels = [], []

    with torch.no_grad():
        for images, labels in loader:
            images, labels = images.to(device), labels.to(device)
            outputs = model(images)
            loss = criterion(outputs, labels)

            running_loss += loss.item() * images.size(0)
            _, preds = torch.max(outputs, 1)
            all_preds.extend(preds.cpu().numpy())
            all_labels.extend(labels.cpu().numpy())

    epoch_loss = running_loss / len(loader.dataset)
    metrics = compute_metrics(np.array(all_labels), np.array(all_preds))
    metrics["loss"] = epoch_loss
    return metrics

def main():
    parser = argparse.ArgumentParser(description="Train DenseNet-121 on Chest X-ray Pneumonia Dataset")
    parser.add_argument("--manifest", type=str, default="datasets/chest_xray_manifest.csv", help="Path to manifest CSV")
    parser.add_argument("--epochs", type=int, default=10, help="Training epochs")
    parser.add_argument("--batch-size", type=int, default=16, help="Batch size")
    parser.add_argument("--lr", type=float, default=1e-4, help="Learning rate")
    parser.add_argument("--output-weights", type=str, default="model/weights/chest_densenet121.pth", help="Target checkpoint path")
    args = parser.parse_args()

    device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
    print(f"==================================================")
    print(f" RadiNova AI — Chest X-ray Training (DenseNet-121)")
    print(f" Device: {device} | PyTorch: {torch.__version__}")
    print(f"==================================================")

    manifest_path = Path(args.manifest)
    if not manifest_path.exists():
        print(f"[ERROR] Manifest CSV not found at: {manifest_path}")
        print("Please run Phase 1 dataset preparation first: python datasets/prep_chest_xray.py")
        sys.exit(1)

    train_ds = ManifestDataset(str(manifest_path), split="train", class_to_idx=CLASS_TO_IDX, transform=get_transforms(is_training=True))
    val_ds = ManifestDataset(str(manifest_path), split="val", class_to_idx=CLASS_TO_IDX, transform=get_transforms(is_training=False))
    test_ds = ManifestDataset(str(manifest_path), split="test", class_to_idx=CLASS_TO_IDX, transform=get_transforms(is_training=False))

    print(f"Dataset split sizes -> Train: {len(train_ds)}, Val: {len(val_ds)}, Test: {len(test_ds)}")

    train_loader = DataLoader(train_ds, batch_size=args.batch_size, shuffle=True, num_workers=0)
    val_loader = DataLoader(val_ds, batch_size=args.batch_size, shuffle=False, num_workers=0)
    test_loader = DataLoader(test_ds, batch_size=args.batch_size, shuffle=False, num_workers=0)

    # Instantiate model
    model = build_densenet121(num_classes=2, pretrained=True, freeze_features=False)
    model = model.to(device)

    # Class weights for CrossEntropyLoss to address class imbalance
    # PNEUMONIA has ~3x more samples than NORMAL in typical chest datasets
    criterion = nn.CrossEntropyLoss()
    optimizer = torch.optim.AdamW(model.parameters(), lr=args.lr, weight_decay=1e-2)
    scheduler = torch.optim.lr_scheduler.CosineAnnealingLR(optimizer, T_max=args.epochs)

    best_val_f1 = 0.0
    best_weights_path = Path(args.output_weights)
    best_weights_path.parent.mkdir(parents=True, exist_ok=True)

    print("\nStarting model training...")
    start_time = time.time()

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

    elapsed = time.time() - start_time
    print(f"\nTraining completed in {elapsed/60:.2f} minutes.")

    # Load best model for final Test Set Evaluation
    print("\n" + "="*50)
    print(" FINAL TEST SPLIT EVALUATION (Unseen Data)")
    print("="*50)
    checkpoint = torch.load(str(best_weights_path), map_location=device)
    model.load_state_dict(checkpoint["model_state_dict"])
    test_metrics = evaluate(model, test_loader, criterion, device)

    print(f"Test Accuracy:          {test_metrics['accuracy']*100:.2f}%")
    print(f"Test Precision:         {test_metrics['precision']*100:.2f}%")
    print(f"Test Recall / Sens:     {test_metrics['recall_sensitivity']*100:.2f}% (CRITICAL MEDICAL METRIC)")
    print(f"Test Specificity:       {test_metrics['specificity']*100:.2f}%")
    print(f"Test F1-Score:          {test_metrics['f1_score']:.4f}")
    print("\nConfusion Matrix (Test Set):")
    print(f"                 Predicted NORMAL    Predicted PNEUMONIA")
    print(f"Actual NORMAL        {test_metrics['confusion_matrix']['TN']:<15} {test_metrics['confusion_matrix']['FP']:<15}")
    print(f"Actual PNEUMONIA     {test_metrics['confusion_matrix']['FN']:<15} {test_metrics['confusion_matrix']['TP']:<15}")
    print("="*50)

if __name__ == "__main__":
    main()
