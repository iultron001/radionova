# RadiNova AI — Medical Imaging & Clinical Decision Support

> **SAFETY & EDUCATIONAL DISCLAIMER**  
> **For educational/research purposes only — not a substitute for professional medical diagnosis.**  
> RadiNova AI is an academic prototype designed for hackathon demonstration. It is not an FDA/CE approved diagnostic device and should never be used as a standalone diagnostic tool.

---

## Overview
RadiNova AI is a clinical decision support system uniting deep learning computer vision, visual explainability (Grad-CAM), multi-modal LLM document/scan interpretation, and automated clinical PDF report generation within a strict **Swiss Style** interface.

### Dashboard Modality Capabilities
| Section / Modality | Analysis Engine | Explainability / Output | Status |
| :--- | :--- | :--- | :--- |
| **1. Chest X-Ray** | DenseNet-121 (PyTorch) | Grad-CAM Heatmap + Rule-based Guidance | **Active Model (Priority #1)** |
| **2. Blood Test** | Multi-Modal LLM / OCR | Plain-Language Laboratory Interpretation | Active (LLM + Template Fallback) |
| **3. Limb (Fracture)** | DenseNet-121 (PyTorch) | Grad-CAM Fracture Activation Heatmap | **Active Model (Priority #2)** |
| **4. MRI** | Multi-Modal LLM | Plain-Language Finding Explanation | Active (LLM + Template Fallback) |
| **5. ECG** | Multi-Modal LLM | Rhythm & Waveform Analysis Interpretation| Active (LLM + Template Fallback) |
| **6. CT Scan** | Multi-Modal LLM | Tomographic Finding Explanation | Active (LLM + Template Fallback) |

*Note: Dedicated Computer Vision models for Blood, MRI, ECG, and CT are part of the v2 roadmap. In v1, they utilize a unified LLM pipeline with deterministic offline template fallbacks.*

---

## Design System: Swiss Style
The interface strictly implements International Typographic Style (Swiss Style):
- **12-Column Grid** with generous whitespace.
- **Inter** sans-serif typeface with strong typographic hierarchy.
- **Monochrome palette** (Deep Black, White, Neutral Grays) with a single deliberate accent.
- **Grad-CAM heatmaps** serve as the intentional splash of functional color.

---

## Project Structure
```
radi-nova-ai/
├── model/                     # PyTorch models, training scripts & Grad-CAM engine
│   ├── weights/               # Trained .pth model checkpoints
│   └── notebooks/             # Google Colab GPU training notebooks
├── backend/                   # FastAPI REST backend
│   ├── routes/                # API route handlers
│   └── services/              # CV, LLM, rules engine & report services
├── frontend/                  # React 19 + pure CSS Swiss Style UI
│   └── src/                   # Components, design tokens & views
├── datasets/                  # Dataset preparation, manifests & resplit scripts
├── reports/                   # ReportLab PDF generation engine & templates
├── rules/                     # Clinical decision rules & confidence bands
├── docs/                      # Technical documentation & architecture specs
├── PROGRESS.md                # Phase-by-phase development progress tracking
└── README.md                  # Project overview and setup instructions
```

---

## Getting Started
See [docs/setup.md](file:///d:/anti%20gravity/docs/setup.md) for local backend and frontend installation instructions.
