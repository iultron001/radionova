"""
RadiNova AI — Breast Cancer Model Training (DenseNet-121)
Target: Binary Mammography / Ultrasound Classification (BENIGN=0, MALIGNANT=1)
Priority Metric: RECALL (Sensitivity) — Minimizing false negatives in oncology triage.
Checkpoints: model/weights/breast_cancer_densenet121.pth
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

CLASSES = ["BENIGN", "MALIGNANT"]
CLASS_TO_IDX = {"BENIGN": 0, "MALIGNANT": 1}


def compute_metrics(y_true: np.ndarray, y_pred: np.ndarray) -> dict:
    """Computes clinical oncological metrics: Accuracy, Precision, Recall (Sensitivity), Specificity, F1, and Confusion Matrix."""
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
    parser = argparse.ArgumentParser(description="Train DenseNet-121 on Breast Cancer Dataset")
    parser.add_argument("--manifest", type=str, default="datasets/breast_cancer_manifest.csv")
    parser.add_argument("--epochs", type=int, default=5)
    parser.add_argument("--batch_size", type=int, default=16)
    parser.add_argument("--lr", type=float, default=1e-4)
    parser.add_argument("--output_weights", type=str, default="model/weights/breast_cancer_densenet121.pth")
    parser.add_argument("--freeze_features", action="store_true", help="Freeze initial DenseNet blocks")
    args = parser.parse_args()

    manifest_path = Path(args.manifest)
    if not manifest_path.exists():
        print(f"[Error] Manifest {manifest_path} not found. Run 'python datasets/prep_breast_cancer.py' first.")
        sys.exit(1)

    device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
    print(f"\n=================================================================")
    print(f"  RadiNova AI — DenseNet-121 Breast Cancer Screening Training")
    print(f"  Device: {device} | Batch Size: {args.batch_size} | LR: {args.lr} | Epochs: {args.epochs}")
    print(f"=================================================================\n")

    # Load Data
    train_transform = get_transforms(image_size=224, is_training=True)
    val_transform = get_transforms(image_size=224, is_training=False)

    train_dataset = ManifestDataset(manifest_path, split="train", transform=train_transform, class_to_idx=CLASS_TO_IDX)
    val_dataset = ManifestDataset(manifest_path, split="val", transform=val_transform, class_to_idx=CLASS_TO_IDX)
    test_dataset = ManifestDataset(manifest_path, split="test", transform=val_transform, class_to_idx=CLASS_TO_IDX)

    print(f"[Dataset] Split sizes: Train={len(train_dataset)}, Val={len(val_dataset)}, Test={len(test_dataset)}")

    if len(train_dataset) == 0:
        print("[Error] No training samples found. Please check your dataset.")
        sys.exit(1)

    train_loader = DataLoader(train_dataset, batch_size=args.batch_size, shuffle=True, num_workers=0)
    val_loader = DataLoader(val_dataset, batch_size=args.batch_size, shuffle=False, num_workers=0)
    test_loader = DataLoader(test_dataset, batch_size=args.batch_size, shuffle=False, num_workers=0)

    # Class Weights for balanced loss
    df = pd.read_csv(manifest_path)
    train_df = df[df["split"] == "train"]
    counts = train_df["label"].value_counts()
    n_benign = counts.get("BENIGN", 1)
    n_malignant = counts.get("MALIGNANT", 1)
    total_samples = n_benign + n_malignant
    
    weight_benign = total_samples / (2.0 * max(n_benign, 1))
    weight_malignant = total_samples / (2.0 * max(n_malignant, 1))
    class_weights = torch.tensor([weight_benign, weight_malignant], dtype=torch.float).to(device)
    print(f"[Loss] Computed class weights (Inverse Frequency): BENIGN={weight_benign:.2f}, MALIGNANT={weight_malignant:.2f}")

    criterion = nn.CrossEntropyLoss(weight=class_weights)

    # Model
    model = build_densenet121(num_classes=2, pretrained=True, freeze_features=args.freeze_features)
    model = model.to(device)

    optimizer = torch.optim.AdamW(model.parameters(), lr=args.lr, weight_decay=1e-4)
    scheduler = torch.optim.lr_scheduler.CosineAnnealingLR(optimizer, T_max=args.epochs, eta_min=1e-6)

    best_recall = -1.0
    best_f1 = -1.0
    best_state = None

    start_time = time.time()

    for epoch in range(1, args.epochs + 1):
        print(f"\n--- Epoch {epoch}/{args.epochs} ---")
        train_metrics = train_one_epoch(model, train_loader, criterion, optimizer, device, epoch, args.epochs)
        val_metrics = evaluate(model, val_loader, criterion, device)
        scheduler.step()

        print(f"  [Train] Loss: {train_metrics['loss']:.4f} | Acc: {train_metrics['accuracy']*100:.1f}% | Recall: {train_metrics['recall_sensitivity']*100:.1f}%")
        print(f"  [Val]   Loss: {val_metrics['loss']:.4f} | Acc: {val_metrics['accuracy']*100:.1f}% | Recall (Sens): {val_metrics['recall_sensitivity']*100:.1f}% | Spec: {val_metrics['specificity']*100:.1f}% | F1: {val_metrics['f1_score']:.3f}")

        # Oncology Checkpoint Metric: Weighted combination of Recall (Sensitivity) and F1
        score = 0.7 * val_metrics["recall_sensitivity"] + 0.3 * val_metrics["f1_score"]
        if score > best_recall:
            best_recall = score
            best_f1 = val_metrics["f1_score"]
            best_state = model.state_dict().copy()
            print(f"  >>> New Best Model Saved (Val Sensitivity Score: {score:.3f}, F1: {best_f1:.3f})")

    total_time = time.time() - start_time
    print(f"\n[Training] Completed in {total_time:.1f}s.")

    # Save Best Weights
    out_weights = Path(args.output_weights)
    out_weights.parent.mkdir(parents=True, exist_ok=True)
    if best_state is not None:
        torch.save({"model_state_dict": best_state, "classes": CLASSES}, str(out_weights))
        print(f"[Checkpoint] Saved best weights to: {out_weights}")
        model.load_state_dict(best_state)
    else:
        torch.save({"model_state_dict": model.state_dict(), "classes": CLASSES}, str(out_weights))
        print(f"[Checkpoint] Saved final weights to: {out_weights}")

    # Final Independent Test Evaluation
    if len(test_dataset) > 0:
        print(f"\n=================================================================")
        print(f"  Independent Test Set Clinical Performance Matrix (Holdout)")
        print(f"=================================================================")
        test_metrics = evaluate(model, test_loader, criterion, device)
        cm = test_metrics["confusion_matrix"]
        print(f"  • Accuracy:           {test_metrics['accuracy']*100:.2f}%")
        print(f"  • Sensitivity (Recall): {test_metrics['recall_sensitivity']*100:.2f}% (Priority in Cancer Screening)")
        print(f"  • Specificity:        {test_metrics['specificity']*100:.2f}%")
        print(f"  • Precision (PPV):    {test_metrics['precision']*100:.2f}%")
        print(f"  • F1-Score:           {test_metrics['f1_score']:.4f}")
        print(f"  • Confusion Matrix:   TP={cm['TP']} (Malignant correctly identified), FN={cm['FN']} (False Negatives)")
        print(f"                        TN={cm['TN']} (Benign correctly cleared),   FP={cm['FP']} (False Positives)")
        print(f"=================================================================\n")


if __name__ == "__main__":
    main()
