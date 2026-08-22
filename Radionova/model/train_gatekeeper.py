"""
RadiNova AI — Phase 2: Modality Gatekeeper Classifier Training
Trains lightweight MobileNetV2 binary classifiers to gatekeep Chest X-Ray and Limb X-Ray inputs.
"""

import os
import sys
import time
import argparse
import numpy as np
import pandas as pd
import torch
import torch.nn as nn
from torch.utils.data import Dataset, DataLoader
from PIL import Image
from pathlib import Path

ROOT_DIR = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT_DIR))

from model.gatekeeper import build_gatekeeper_model, get_gatekeeper_transforms

class GatekeeperDataset(Dataset):
    """Loads image paths and binary labels (0=INVALID, 1=VALID) from manifest CSV."""
    def __init__(self, manifest_csv: str, split: str, transform=None):
        self.df = pd.read_csv(manifest_csv)
        self.df = self.df[self.df["split"] == split].reset_index(drop=True)
        self.transform = transform

    def __len__(self):
        return len(self.df)

    def __getitem__(self, idx):
        row = self.df.iloc[idx]
        image_path = row["filepath"]
        try:
            image = Image.open(image_path).convert("RGB")
        except Exception:
            # In case of corrupted file, return black image
            image = Image.new("RGB", (224, 224), (0, 0, 0))
            
        if self.transform is not None:
            image = self.transform(image)
        else:
            from torchvision import transforms
            image = transforms.Compose([
                transforms.Resize((224, 224)),
                transforms.ToTensor(),
                transforms.Normalize(mean=[0.485, 0.456, 0.406], std=[0.229, 0.224, 0.225])
            ])(image)
            
        if "class_idx" in row and not pd.isna(row["class_idx"]):
            label = int(row["class_idx"])
        else:
            lbl_val = str(row["label"]).strip()
            if lbl_val in ["1", "0"]:
                label = int(lbl_val)
            elif "VALID" in lbl_val.upper():
                label = 1
            else:
                label = 0
        return image, label

def compute_binary_metrics(y_true: np.ndarray, y_pred: np.ndarray) -> dict:
    """Computes binary classification metrics: 0=INVALID, 1=VALID."""
    tp = int(np.sum((y_true == 1) & (y_pred == 1)))
    tn = int(np.sum((y_true == 0) & (y_pred == 0)))
    fp = int(np.sum((y_true == 0) & (y_pred == 1)))
    fn = int(np.sum((y_true == 1) & (y_pred == 0)))

    total = max(len(y_true), 1)
    accuracy = (tp + tn) / total
    precision = tp / max(tp + fp, 1)
    recall = tp / max(tp + fn, 1)
    specificity = tn / max(tn + fp, 1)
    f1 = 2 * (precision * recall) / max(precision + recall, 1e-6)

    return {
        "accuracy": float(accuracy),
        "precision": float(precision),
        "recall": float(recall),
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

        if (i + 1) % 25 == 0 or (i + 1) == total_batches:
            batch_acc = np.mean(np.array(all_preds) == np.array(all_labels)) * 100
            print(f"  [Epoch {epoch_idx:02d}/{total_epochs:02d}] Batch [{i+1:03d}/{total_batches:03d}] Loss: {loss.item():.4f} Acc: {batch_acc:.1f}%", flush=True)

    epoch_loss = running_loss / max(len(loader.dataset), 1)
    metrics = compute_binary_metrics(np.array(all_labels), np.array(all_preds))
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
    metrics = compute_binary_metrics(np.array(all_labels), np.array(all_preds))
    metrics["loss"] = epoch_loss
    return metrics

def train_gatekeeper(modality: str, manifest_csv: str, output_path: str, epochs: int = 4, batch_size: int = 32):
    device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
    print(f"\n========================================================")
    print(f" RadiNova AI — Training {modality.upper()} Gatekeeper Model")
    print(f" Device: {device} | Architecture: MobileNetV2 (Binary)")
    print(f"========================================================")

    train_ds = GatekeeperDataset(manifest_csv, split="train", transform=get_gatekeeper_transforms(is_training=True))
    val_ds = GatekeeperDataset(manifest_csv, split="val", transform=get_gatekeeper_transforms(is_training=False))
    test_ds = GatekeeperDataset(manifest_csv, split="test", transform=get_gatekeeper_transforms(is_training=False))

    print(f"Dataset split sizes -> Train: {len(train_ds)}, Val: {len(val_ds)}, Test: {len(test_ds)}")

    train_loader = DataLoader(train_ds, batch_size=batch_size, shuffle=True, num_workers=0)
    val_loader = DataLoader(val_ds, batch_size=batch_size, shuffle=False, num_workers=0)
    test_loader = DataLoader(test_ds, batch_size=batch_size, shuffle=False, num_workers=0)

    model = build_gatekeeper_model(pretrained=True, freeze_features=False)
    model = model.to(device)
    criterion = nn.CrossEntropyLoss()

    # Stage 1: Fast warmup on classifier head
    print("\n--- Stage 1: Classifier Head Warmup (1 epoch) ---")
    for param in model.features.parameters():
        param.requires_grad = False
    optimizer = torch.optim.AdamW(model.classifier.parameters(), lr=1e-3, weight_decay=1e-2)
    train_one_epoch(model, train_loader, criterion, optimizer, device, epoch_idx=1, total_epochs=1)

    # Stage 2: Fine-tune top features
    print(f"\n--- Stage 2: Full Backbone Fine-Tuning ({epochs} epochs) ---")
    for param in model.features.parameters():
        param.requires_grad = True

    optimizer = torch.optim.AdamW(model.parameters(), lr=2e-4, weight_decay=1e-2)
    scheduler = torch.optim.lr_scheduler.CosineAnnealingLR(optimizer, T_max=epochs)

    best_val_f1 = 0.0
    out_file = Path(output_path)
    out_file.parent.mkdir(parents=True, exist_ok=True)

    start_time = time.time()
    for epoch in range(1, epochs + 1):
        train_m = train_one_epoch(model, train_loader, criterion, optimizer, device, epoch_idx=epoch, total_epochs=epochs)
        val_m = evaluate(model, val_loader, criterion, device)
        scheduler.step()

        print(f"[Stage 2] Epoch [{epoch:02d}/{epochs:02d}] "
              f"Train Loss: {train_m['loss']:.4f} Acc: {train_m['accuracy']*100:.1f}% Rec: {train_m['recall']*100:.1f}% | "
              f"Val Loss: {val_m['loss']:.4f} Acc: {val_m['accuracy']*100:.1f}% Rec: {val_m['recall']*100:.1f}% F1: {val_m['f1_score']:.4f}", flush=True)

        if val_m['f1_score'] > best_val_f1:
            best_val_f1 = val_m['f1_score']
            torch.save({
                "model_state_dict": model.state_dict(),
                "val_metrics": val_m,
                "modality": modality,
                "architecture": "mobilenet_v2_gatekeeper",
                "epoch": epoch
            }, str(out_file))
            print(f"  >>> Best {modality} gatekeeper model saved (Val F1: {best_val_f1:.4f}) -> {out_file}")

    elapsed = time.time() - start_time
    print(f"\nTraining completed in {elapsed:.1f}s ({elapsed/60:.2f} min).")

    # Evaluate on Unseen Test Split
    print("\n" + "="*50)
    print(f" FINAL TEST SPLIT EVALUATION — {modality.upper()} GATEKEEPER")
    print("="*50)
    ckpt = torch.load(str(out_file), map_location=device)
    model.load_state_dict(ckpt["model_state_dict"])
    test_m = evaluate(model, test_loader, criterion, device)

    print(f"Test Accuracy:    {test_m['accuracy']*100:.2f}%")
    print(f"Test Precision:   {test_m['precision']*100:.2f}%")
    print(f"Test Recall:      {test_m['recall']*100:.2f}%")
    print(f"Test Specificity: {test_m['specificity']*100:.2f}%")
    print(f"Test F1-Score:    {test_m['f1_score']:.4f}")
    print(f"Confusion Matrix: TP={test_m['confusion_matrix']['TP']}, TN={test_m['confusion_matrix']['TN']}, FP={test_m['confusion_matrix']['FP']}, FN={test_m['confusion_matrix']['FN']}")
    print("="*50)
    return test_m

def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--modality", type=str, choices=["chest", "limb", "breast_cancer", "all"], default="all")
    parser.add_argument("--epochs", type=int, default=3)
    parser.add_argument("--batch-size", type=int, default=32)
    args = parser.parse_args()

    if args.modality in ["chest", "all"]:
        train_gatekeeper(
            modality="chest",
            manifest_csv="datasets/chest_gatekeeper_manifest.csv",
            output_path="model/weights/chest_gatekeeper.pth",
            epochs=args.epochs,
            batch_size=args.batch_size
        )

    if args.modality in ["limb", "all"]:
        train_gatekeeper(
            modality="limb",
            manifest_csv="datasets/limb_gatekeeper_manifest.csv",
            output_path="model/weights/limb_gatekeeper.pth",
            epochs=args.epochs,
            batch_size=args.batch_size
        )

    if args.modality in ["breast_cancer", "all"]:
        bc_manifest = Path("datasets/breast_cancer_gatekeeper_manifest.csv")
        if bc_manifest.exists():
            train_gatekeeper(
                modality="breast_cancer",
                manifest_csv=str(bc_manifest),
                output_path="model/weights/breast_cancer_gatekeeper.pth",
                epochs=args.epochs,
                batch_size=args.batch_size
            )

if __name__ == "__main__":
    main()
