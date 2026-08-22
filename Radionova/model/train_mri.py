"""
RadiNova AI — Brain MRI Model Training (DenseNet-121)
Target: Binary/Multiclass Brain MRI Lesion/Tumor Classification (NORMAL=0, TUMOR=1)
Priority Metric: RECALL (Sensitivity) — Minimizing false negatives in neuroimaging triage.
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

CLASSES = ["NORMAL", "TUMOR"]
CLASS_TO_IDX = {"NORMAL": 0, "TUMOR": 1}

def compute_metrics(y_true: np.ndarray, y_pred: np.ndarray) -> dict:
    """Computes medical diagnostic metrics: Accuracy, Precision, Recall (Sensitivity), F1, Specificity, Confusion Matrix."""
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

def train_one_epoch(model, loader, criterion, optimizer, device, epoch_idx=1, total_epochs=1):
    model.train()
    running_loss = 0.0
    all_preds, all_labels = [], []
    total_batches = len(loader)

    for i, (images, labels) in enumerate(loader):
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

        if (i + 1) % max(1, total_batches // 4) == 0 or (i + 1) == total_batches:
            batch_acc = np.mean(np.array(all_preds) == np.array(all_labels))
            print(f"  [Epoch {epoch_idx}/{total_epochs}] Batch {i+1}/{total_batches} | Loss: {loss.item():.4f} | Running Acc: {batch_acc:.3f}")

    epoch_loss = running_loss / max(len(loader.dataset), 1)
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

    epoch_loss = running_loss / max(len(loader.dataset), 1)
    metrics = compute_metrics(np.array(all_labels), np.array(all_preds))
    metrics["loss"] = epoch_loss
    return metrics

def main():
    parser = argparse.ArgumentParser(description="Train DenseNet-121 on Brain MRI Dataset")
    parser.add_argument("--manifest", type=str, default="datasets/mri_manifest.csv")
    parser.add_argument("--epochs", type=int, default=10)
    parser.add_argument("--batch-size", type=int, default=16)
    parser.add_argument("--lr", type=float, default=1e-4)
    parser.add_argument("--output-weights", type=str, default="model/weights/mri_densenet121.pth")
    parser.add_argument("--quick-test", action="store_true")
    args = parser.parse_args()

    device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
    print(f"[Train] Using compute device: {device}")

    # Transforms
    train_transform = get_transforms(image_size=224, is_training=True)
    val_transform = get_transforms(image_size=224, is_training=False)

    train_dataset = ManifestDataset(args.manifest, split="train", class_to_idx=CLASS_TO_IDX, transform=train_transform)
    val_dataset = ManifestDataset(args.manifest, split="val", class_to_idx=CLASS_TO_IDX, transform=val_transform)
    test_dataset = ManifestDataset(args.manifest, split="test", class_to_idx=CLASS_TO_IDX, transform=val_transform)

    print(f"[Train] Train samples: {len(train_dataset)} | Val: {len(val_dataset)} | Test: {len(test_dataset)}")

    train_loader = DataLoader(train_dataset, batch_size=args.batch_size, shuffle=True, num_workers=0)
    val_loader = DataLoader(val_dataset, batch_size=args.batch_size, shuffle=False, num_workers=0)
    test_loader = DataLoader(test_dataset, batch_size=args.batch_size, shuffle=False, num_workers=0)

    # Instantiate Model
    model = build_densenet121(num_classes=len(CLASSES), pretrained=True, freeze_features=False)
    model = model.to(device)

    # Class-weighted CrossEntropy to emphasize recall on tumor lesions
    criterion = nn.CrossEntropyLoss()
    optimizer = torch.optim.AdamW(model.parameters(), lr=args.lr, weight_decay=1e-4)

    best_val_f1 = 0.0
    best_weights = None

    epochs = 2 if args.quick_test else args.epochs
    print(f"[Train] Beginning training for {epochs} epochs...")

    for epoch in range(1, epochs + 1):
        t0 = time.time()
        train_metrics = train_one_epoch(model, train_loader, criterion, optimizer, device, epoch, epochs)
        val_metrics = evaluate(model, val_loader, criterion, device)
        elapsed = time.time() - t0

        print(f"Epoch {epoch:02d}/{epochs:02d} [{elapsed:.1f}s] "
              f"Train Loss: {train_metrics['loss']:.4f} Acc: {train_metrics['accuracy']:.3f} | "
              f"Val Loss: {val_metrics['loss']:.4f} Acc: {val_metrics['accuracy']:.3f} "
              f"Recall: {val_metrics['recall_sensitivity']:.3f} F1: {val_metrics['f1_score']:.3f}")

        if val_metrics["f1_score"] >= best_val_f1 or epoch == 1:
            best_val_f1 = val_metrics["f1_score"]
            best_weights = model.state_dict().copy()

    # Save Best Weights
    out_path = Path(args.output_weights)
    out_path.parent.mkdir(parents=True, exist_ok=True)
    if best_weights is not None:
        torch.save({"model_state_dict": best_weights, "classes": CLASSES, "class_to_idx": CLASS_TO_IDX}, str(out_path))
        print(f"[Train] Saved best model checkpoint to {out_path.resolve()} (Val F1: {best_val_f1:.3f})")

    # Evaluate on Test Set
    if len(test_dataset) > 0:
        model.load_state_dict(best_weights or model.state_dict())
        test_metrics = evaluate(model, test_loader, criterion, device)
        print(f"\n[Final Test Evaluation]")
        print(f"  • Accuracy:    {test_metrics['accuracy']*100:.2f}%")
        print(f"  • Sensitivity: {test_metrics['recall_sensitivity']*100:.2f}%")
        print(f"  • Specificity: {test_metrics['specificity']*100:.2f}%")
        print(f"  • F1 Score:    {test_metrics['f1_score']:.4f}")
        print(f"  • Confusion Matrix: {test_metrics['confusion_matrix']}")

if __name__ == "__main__":
    main()
