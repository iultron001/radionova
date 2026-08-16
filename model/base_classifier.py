"""
RadiNova AI — Shared Model Architecture & Dataset Utilities
Architecture: torchvision.models.densenet121 (Transfer Learning)
"""

import os
import torch
import torch.nn as nn
from torchvision import models, transforms
from torch.utils.data import Dataset
from PIL import Image
from typing import Tuple, Optional, Dict, Any
import pandas as pd

# Standard ImageNet normalization parameters
IMAGENET_MEAN = [0.485, 0.456, 0.406]
IMAGENET_STD = [0.229, 0.224, 0.225]

def get_transforms(image_size: int = 224, is_training: bool = False) -> transforms.Compose:
    """
    Returns image transformation pipelines.
    For training: slight rotation, horizontal flip, color jitter, resize.
    For validation/inference: deterministic resize and normalization.
    """
    if is_training:
        return transforms.Compose([
            transforms.Resize((image_size, image_size)),
            transforms.RandomHorizontalFlip(p=0.5),
            transforms.RandomRotation(degrees=10),
            transforms.ColorJitter(brightness=0.1, contrast=0.1),
            transforms.ToTensor(),
            transforms.Normalize(mean=IMAGENET_MEAN, std=IMAGENET_STD),
        ])
    else:
        return transforms.Compose([
            transforms.Resize((image_size, image_size)),
            transforms.ToTensor(),
            transforms.Normalize(mean=IMAGENET_MEAN, std=IMAGENET_STD),
        ])

class ManifestDataset(Dataset):
    """
    PyTorch Dataset that loads image paths and labels directly from a stratified manifest CSV.
    """
    def __init__(self, manifest_csv: str, split: str, class_to_idx: Dict[str, int], transform: Optional[transforms.Compose] = None):
        self.df = pd.read_csv(manifest_csv)
        self.df = self.df[self.df["split"] == split].reset_index(drop=True)
        self.class_to_idx = class_to_idx
        self.transform = transform

    def __len__(self) -> int:
        return len(self.df)

    def __getitem__(self, idx: int) -> Tuple[torch.Tensor, int]:
        row = self.df.iloc[idx]
        image_path = row["filepath"]
        
        # Load image and ensure 3-channel RGB (chest x-rays are often 1-channel grayscale)
        image = Image.open(image_path).convert("RGB")
        
        if self.transform:
            image = self.transform(image)
            
        label_str = row["label"]
        label_idx = self.class_to_idx[label_str]
        return image, label_idx

def build_densenet121(num_classes: int = 2, pretrained: bool = True, freeze_features: bool = False) -> nn.Module:
    """
    Instantiates DenseNet-121 with modified classifier head.
    Target feature extractor layer for Grad-CAM is: model.features.denseblock4
    """
    if pretrained:
        weights = models.DenseNet121_Weights.DEFAULT
        model = models.densenet121(weights=weights)
    else:
        model = models.densenet121(weights=None)
        
    if freeze_features:
        for param in model.features.parameters():
            param.requires_grad = False
            
    num_features = model.classifier.in_features
    # Replace classifier with custom linear classification head
    model.classifier = nn.Sequential(
        nn.Dropout(p=0.3),
        nn.Linear(num_features, num_classes)
    )
    return model
