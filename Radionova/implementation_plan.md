# Implementation Plan: RadiNova AI

RadiNova AI is an end-to-end medical imaging analysis and clinical decision support platform built for hackathon demonstration. It features a real PyTorch DenseNet-121 model for Chest X-ray pneumonia detection with Grad-CAM explainability (Priority #1), a Limb fracture detection model (Priority #2), and a unified multi-modal LLM analysis pipeline for Blood Test, MRI, ECG, and CT Scan with graceful offline template fallback, wrapped in a strict Swiss Style typography-first dashboard and ReportLab PDF export.

## User Review Required

> [!IMPORTANT]
> **Hardware & Training Note:** The local environment has CPU PyTorch (`2.9.1+cpu`) without a CUDA GPU. In Phase 2 and Phase 4, we will provide both a local CPU-compatible training script and a fully prepared, self-contained **Google Colab Notebook (`.ipynb`)** so you can train the DenseNet-121 model on a free T4 GPU in ~5 minutes, download the `.pth` weights, and drop them into `model/weights/`.

> [!NOTE]
> **Kaggle API Credentials:** In Phase 1 and Phase 4, Kaggle datasets will be fetched using `kagglehub` / Kaggle API. If you have your `kaggle.json` or credentials (`KAGGLE_USERNAME` and `KAGGLE_KEY`), we will store them in `.env`. We will also provide direct download links / scripts as a backup.

> [!IMPORTANT]
> **Strict Scope & Safety Disclaimers:** As requested, only Chest X-ray and Limb fracture have real CV models; Blood, MRI, ECG, and CT scan utilize LLM text/multimodal explanation with template fallbacks. Every screen and PDF report includes the mandatory educational disclaimer: *"For educational/research purposes only — not a substitute for professional medical diagnosis."*

---

## Architecture & Reusable Pipeline

```
                               ┌─────────────────────────────────────────┐
                               │       RadiNova UI (Swiss Style)         │
                               │  12-Col Grid • Inter Font • Monochrome  │
                               └────────────────────┬────────────────────┘
                                                    │
                 ┌──────────────────────────────────┴──────────────────────────────────┐
                 ▼                                                                     ▼
    ┌─────────────────────────┐                                           ┌─────────────────────────┐
    │  CV Modalities (1 & 3)  │                                           │ LLM Modalities (2,4,5,6)│
    │  - Chest X-Ray          │                                           │  - Blood Test / Labs    │
    │  - Limb Fracture        │                                           │  - MRI / ECG / CT Scan  │
    └────────────┬────────────┘                                           └────────────┬────────────┘
                 │                                                                     │
                 ▼                                                                     ▼
    ┌─────────────────────────┐                                           ┌─────────────────────────┐
    │  DenseNet-121 + Grad-CAM│                                           │ LLM Explanation Pipeline│
    │  - Feature Extraction   │                                           │  - OCR / Text Extract   │
    │  - Class Activation Map │                                           │  - Hedged Safety Prompt │
    │  - Rule Guidance Engine │                                           │  - Template Fallback    │
    └────────────┬────────────┘                                           └────────────┬────────────┘
                 │                                                                     │
                 └──────────────────────────────────┬──────────────────────────────────┘
                                                    │
                                                    ▼
                                       ┌─────────────────────────┐
                                       │ FastAPI Backend Engine  │
                                       │  - REST Endpoints       │
                                       │  - Chat Assistant       │
                                       │  - ReportLab PDF Export │
                                       └─────────────────────────┘
```

---

## Phase Breakdown

### Phase 0: Project Scaffolding & Setup
- **Directory Structure:** `model/`, `backend/`, `frontend/`, `reports/`, `datasets/`, `docs/`, `rules/`.
- **Git & Config:** Initialize git, configure `.gitignore` (protecting `.env`, weights, datasets, pdfs), create `.env.example` templates for LLM keys (OpenAI / Claude / Gemini) and Kaggle API.
- **Root README & Progress Tracker:** Create root `README.md` stub and `PROGRESS.md` to track phase-by-phase execution and metric logs.

### Phase 1: Chest X-ray Dataset Prep & Resplit
- Target Kaggle dataset: `paultimothymooney/chest-xray-pneumonia`.
- Implement `datasets/prep_chest_xray.py`:
  - Pull dataset via Kaggle API / Kagglehub.
  - Pool train + val (16 images) + test splits together.
  - Re-split **80% Train / 10% Validation / 10% Test** stratified by class (`NORMAL` vs `PNEUMONIA`) with fixed random seed (`seed=42`).
  - Generate deterministic CSV manifest `datasets/chest_xray_manifest.csv` (`filepath, label, split`).

### Phase 2: Chest X-ray Model Training (DenseNet-121)
- Implement `model/train_chest.py`:
  - PyTorch `torchvision.models.densenet121(weights='DEFAULT')`.
  - Classifier head: `nn.Linear(1024, 2)`.
  - Normalization: ImageNet mean/std; Data Augmentations: random horizontal flip, random rotation (+/-10°), color jitter.
  - Weighted Cross-Entropy Loss to counter class imbalance.
  - Two-stage training: Head warm-up (frozen backbone), followed by fine-tuning `denseblock4`.
  - Evaluation reporting: Loss, Accuracy, Precision, **Recall (Clinical priority)**, F1-score, and 2x2 Confusion Matrix on Test Split.
  - Colab Notebook `model/RadiNova_Chest_Training_Colab.ipynb` for fast GPU training.

### Phase 3: Grad-CAM Explainability Module
- Implement `model/gradcam.py`:
  - Target layer: `model.features.denseblock4`.
  - Computes gradient activations of target class with respect to feature maps.
  - Applies ReLU, normalizes heatmap, resizes to original image dimension, overlays using Jet/Turbo colormap with alpha blending.
  - Implement `model/test_gradcam.py` test suite verifying heatmap localization on lung parenchyma vs peripheral noise.

### Phase 4: Limb Fracture Dataset & Unified CV Pipeline
- Target Kaggle dataset: `devbatrax/fracture-detection-using-x-ray-images` (`Fractured` vs `Not Fractured`).
- Refactor training & Grad-CAM into modular core `model/base_classifier.py` and `datasets/prep_limb_fracture.py`.
- Re-split 80/10/10 stratified CSV manifest `datasets/limb_manifest.csv`.
- Training script and Colab notebook for limb fracture model saving to `model/weights/limb_densenet121.pth`.

### Phase 5: FastAPI Backend Services
- Build modular FastAPI application:
  - `POST /predict/chest` — Chest X-ray inference + Grad-CAM heatmap base64 + confidence + clinical guidance.
  - `POST /predict/limb` — Limb fracture inference + Grad-CAM heatmap.
  - `POST /explain/{modality}` (`blood`, `mri`, `ecg`, `ct`) — OCR/Text extraction + LLM explanation (with hedged clinical prompt and automatic deterministic template fallback).
  - `POST /assistant` — Context-aware clinical chat assistant for follow-up questions.
  - `POST /report` — PDF report generation endpoint.
  - `GET /health` — Diagnostics, model status, LLM connectivity status.
- Clinical rules engine: `rules/clinical_guidance.json` with confidence-band differential considerations, red flags, and follow-up checks.

### Phase 6: Frontend Shell (Strict Swiss Design)
- Modern React application with pure CSS (no third-party component library dependencies).
- Swiss Style Design System:
  - 12-column responsive layout grid with generous whitespace.
  - Inter sans-serif typography with high typographic hierarchy and ultra-bold confidence numbers.
  - Monochrome palette (#0A0A0A black, #FFFFFF white, neutral grays) with single deliberate Swiss Red (#E11D48) or Cobalt accent.
  - Permanent top disclaimer banner.
  - 6-tab navigation: Chest X-ray, Blood Test, Limb, MRI, ECG, CT Scan.

### Phase 7: Frontend Modality & Feature Integration
- Reusable `ModalityUploadArea` and `ResultCard` components.
- Chest & Limb views: Original image, Grad-CAM overlay toggle & opacity slider, confidence score meter, rule-based clinical guidance cards.
- Blood / MRI / ECG / CT views: Extracted text preview, structured plain-language LLM analysis, hedge tags, template badge.
- Floating Clinical AI Chat Assistant with active scan context injection.
- Export PDF report button & report history drawer.

### Phase 8: PDF Report Generation (ReportLab)
- Implement `reports/generator.py`:
  - Clean Swiss typographic layout with clinical header.
  - Red disclaimer banner at top: *"For educational/research purposes only — not a substitute for professional medical diagnosis."*
  - Patient metadata, study details, modality type, timestamp.
  - Side-by-side original image + Grad-CAM heatmap visualization.
  - Quantitative metrics, confidence bands, rule-based clinical considerations, and LLM summary.
  - Formal clinician signature and disclaimer block.

### Phase 9 & 10: Polish, Comprehensive README & End-to-End Verification
- Complete root `README.md` with ASCII architecture diagram, setup instructions, metric benchmarks, and explicit "Current Status vs. Roadmap" matrix.
- Full end-to-end testing across all 6 tabs, assistant, and PDF exports.
- Update `PROGRESS.md` with final summary, test outputs, and demo notes.

---

## Proposed File Changes

```
radinova/
├── .env.example                       # [NEW] Environment variables template
├── .gitignore                         # [NEW] Git ignore rules
├── PROGRESS.md                        # [NEW] Phase tracking & status updates
├── README.md                          # [NEW] Root documentation & user guide
├── rules/
│   └── clinical_guidance.json         # [NEW] Clinical decision rules & confidence bands
├── datasets/
│   ├── prep_chest_xray.py             # [NEW] Stratified 80/10/10 re-split script
│   └── prep_limb_fracture.py          # [NEW] Limb fracture dataset prep script
├── model/
│   ├── base_classifier.py             # [NEW] Shared DenseNet-121 architecture & loader
│   ├── train_chest.py                 # [NEW] Chest X-ray training script
│   ├── train_limb.py                  # [NEW] Limb fracture training script
│   ├── gradcam.py                     # [NEW] Reusable Grad-CAM explainability module
│   ├── test_gradcam.py                # [NEW] Grad-CAM verification test script
│   └── notebooks/
│       ├── RadiNova_Chest_Training_Colab.ipynb # [NEW] Google Colab training notebook
│       └── RadiNova_Limb_Training_Colab.ipynb  # [NEW] Google Colab limb training notebook
├── backend/
│   ├── main.py                        # [NEW] FastAPI application entrypoint
│   ├── config.py                      # [NEW] Settings & env loading
│   ├── requirements.txt               # [NEW] Backend Python dependencies
│   ├── services/
│   │   ├── cv_service.py              # [NEW] DenseNet & Grad-CAM inference service
│   │   ├── llm_service.py             # [NEW] Multi-modal LLM & template fallback service
│   │   ├── guidance_service.py        # [NEW] Rule-based clinical guidance matcher
│   │   └── report_service.py          # [NEW] ReportLab PDF generation service
│   └── routes/
│       ├── predict.py                 # [NEW] /predict/chest and /predict/limb
│       ├── explain.py                 # [NEW] /explain/{modality}
│       ├── assistant.py               # [NEW] /assistant chat endpoint
│       ├── report.py                  # [NEW] /report PDF download endpoint
│       └── health.py                  # [NEW] /health status endpoint
├── reports/
│   └── generator.py                   # [NEW] ReportLab clinical PDF engine
└── frontend/
    ├── package.json                   # [NEW] React + Vite dependencies
    ├── index.html                     # [NEW] HTML with Google Fonts Inter
    ├── vite.config.ts                 # [NEW] Vite proxy & build config
    └── src/
        ├── index.css                  # [NEW] Swiss Style design system tokens & grid
        ├── App.tsx                    # [NEW] Main control panel & 6-tab navigation
        ├── components/
            ├── Header.tsx             # [NEW] Swiss Header with Disclaimer banner
            ├── TabNavigation.tsx      # [NEW] 6-section tab switcher
            ├── ModalitySection.tsx    # [NEW] Universal upload & result container
            ├── ImageDiffViewer.tsx    # [NEW] Original vs Grad-CAM toggle & slider
            ├── GuidanceCard.tsx       # [NEW] Rule-based clinical considerations
            ├── LLMExplanationCard.tsx # [NEW] Plain-language LLM analysis card
            ├── ChatAssistant.tsx      # [NEW] Floating/dockable AI conversation drawer
            └── ReportHistory.tsx      # [NEW] Past scans & PDF download list
```

---

## Verification Plan

### Automated Tests
1. **Dataset Split Check:** Verify stratified distribution of `datasets/chest_xray_manifest.csv` (80/10/10 split, exact class balance preservation).
2. **Model Evaluation Metrics:** Validate accuracy, precision, recall, F1, and confusion matrix calculation.
3. **Grad-CAM Sanity Check:** Verify heatmap matrix values, dimension matching (224x224), and anatomical localization.
4. **Backend API Test Suite:** Run pytest / curl requests for `/health`, `/predict/chest`, `/explain/blood`, `/assistant`, `/report`.
5. **Template Fallback Test:** Test `/explain/{modality}` with invalid/missing API key and confirm structured template response with 200 OK.
6. **Frontend Build & Lint:** Validate TypeScript build `npm run build` with zero errors.

### Manual Verification
1. Test Chest X-ray image upload in UI -> Verify Grad-CAM overlay toggle, confidence score, guidance text.
2. Test Blood Test report upload -> Verify LLM plain-language interpretation and disclaimer banner.
3. Test Chat Assistant with follow-up questions referencing uploaded scans.
4. Generate & download PDF report -> Verify visual layout, disclaimer banner, heatmap rendering, and patient metadata.
