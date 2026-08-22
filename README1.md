# RadiNova AI — Multi-Modal Diagnostic Intelligence & Decision Support

[![FastAPI](https://img.shields.io/badge/Backend-FastAPI-009688.svg?logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com)
[![PyTorch](https://img.shields.io/badge/Model-PyTorch%20DenseNet--121-EE4C2C.svg?logo=pytorch&logoColor=white)](https://pytorch.org)
[![React](https://img.shields.io/badge/Frontend-React%2018%20+%20Vite-61DAFB.svg?logo=react&logoColor=black)](https://reactjs.org)
[![TypeScript](https://img.shields.io/badge/Language-TypeScript-3178C6.svg?logo=typescript&logoColor=white)](https://www.typescriptlang.org)
[![License](https://img.shields.io/badge/Compliance-HIPAA%20%2F%20MCI%20CDSS-a3e635.svg)]()

> **Clinical Regulatory Notice:**  
> *"AI-assisted prediction / decision support — requires review by a qualified healthcare professional."*  
> RadiNova AI is engineered strictly as a secondary Clinical Decision Support System (CDSS). Model outputs and explainability maps do not constitute independent medical diagnoses.

---

## 🌟 Overview

**RadiNova AI** is an end-to-end, multi-modal clinical intelligence platform that bridges deep computer vision with conversational medical triage. It provides an AI-assisted second opinion for healthcare professionals and a safe, non-diagnostic symptom triage assistant for patients.

```
                               ┌────────────────────────────────────────────────────────┐
                               │                      RadiNova AI                       │
                               │                  Multi-Modal Platform                  │
                               └───────────────────────────┬────────────────────────────┘
                                                           │
                        ┌──────────────────────────────────┴──────────────────────────────────┐
                        ▼                                                                     ▼
        ┌───────────────────────────────┐                                     ┌───────────────────────────────┐
        │     Patient Triage Portal     │                                     │    Doctor Clinical Portal     │
        │      (Guest Access — No Auth) │                                     │    (Physician Authentication) │
        ├───────────────────────────────┤                                     ├───────────────────────────────┤
        │ • Gemini Conversational AI    │                                     │ • DenseNet-121 Vision Models  │
        │ • Turn-Capped Sessions (Max 8)│                                     │ • Two-Layer Gatekeeper Filter │
        │ • Red-Flag Emergency Screening│                                     │ • Grad-CAM Visual Heatmaps    │
        │ • Structured Schema Extraction│                                     │ • Multi-Modal Report Parsing  │
        │ • Non-Diagnostic Guidance     │                                     │ • Formal PDF Report Generator │
        └───────────────────────────────┘                                     └───────────────────────────────┘
```

---

## 🩺 Core Capabilities & Modalities

### 1. Computer Vision Diagnostic Models
- **Chest Radiography (X-Ray)**: DenseNet-121 transfer learning model trained for pneumonia and pulmonary consolidation detection.
- **Limb Fracture Radiographs**: DenseNet-121 osseous disruption model with bounding-box localizers.
- **Two-Layer Gatekeeper**: Pre-inference binary classifier (MobileNetV2/ResNet18) + confidence thresholding that automatically validates anatomy and rejects non-X-ray images before inference.
- **Grad-CAM Explainability**: Gradient-weighted Class Activation Mapping computes localized neural heatmaps (`features.denseblock4.denselayer16`), rendering visual justification for clinical correlation.

### 2. Multi-Modal Text & Report Analysis
- **Brain MRI**: Parenchymal disruption and neuroimaging report interpretation.
- **Computed Tomography (CT)**: Cross-sectional axial density and attenuation report summaries.
- **Hematology Panel (CBC)**: Complete blood count and metabolic panel biomarker range analysis.
- **12-Lead ECG**: Cardiac rhythm, interval (PR/QRS/QTc), and ST-segment clinical explanation.

### 3. Patient Triage Companion (Guest Access)
- **Zero-Friction Access**: Free symptom evaluation without registration.
- **Safety-First Gemini Integration**: Turn-limited conversations (8-turn budget) with deterministic safety fallbacks for network interruptions.
- **Structured Clinical Extraction Schema**:
  ```json
  {
    "main_complaint": "Right wrist pain after fall",
    "symptoms": ["pain", "swelling", "reduced range of motion"],
    "body_location": "Right wrist / forearm",
    "duration": "2 hours",
    "severity": "Moderate",
    "injury": true,
    "red_flag": false,
    "conversation_complete": false
  }
  ```

---

## 🏗️ System Architecture

```
Radionova/
├── backend/
│   ├── api/v1/                # Versioned REST endpoints (auth, studies, analysis, reports, patient)
│   ├── core/                  # Security, password hashing, JWT session management
│   ├── db/                    # SQLite database models and session manager
│   ├── models/                # DenseNet-121 PyTorch architectures & Gatekeeper logic
│   ├── routes/                # FastAPI router definitions
│   ├── services/              # CVService, Gemini LLM triage, PDF generator
│   ├── config.py              # Application settings & CORS
│   └── main.py                # FastAPI entrypoint
│
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── pages/         # LandingPage, DashboardPage, PatientPortalPage, MyStudiesPage, etc.
│   │   │   ├── Navbar.tsx     # Top clinical navigation bar
│   │   │   ├── Sidebar.tsx    # Doctor quick-action sidebar
│   │   │   ├── AuthPortal.tsx # Physician profile authentication
│   │   │   └── AnalysisResultView.tsx # 3-Column deep radiograph viewer & Grad-CAM controls
│   │   ├── index.css          # Modern dark clinical design system
│   │   ├── types.ts           # Shared TypeScript interfaces
│   │   └── App.tsx            # State management & explicit view routing
│   └── package.json           # React 18 + Vite configuration
│
├── model/
│   └── weights/               # Trained PyTorch weights (.pth) for DenseNet-121 & Gatekeepers
│
├── reports/                   # ReportLab PDF clinical generator
└── rules/                     # clinical_guidance.json decision support matrix
```

---

## 🚀 Quick Start Guide

### Prerequisites
- **Python**: 3.10 or higher
- **Node.js**: 18 or higher (Node v20/v24 recommended)
- **Modern Browser**: Chrome, Edge, Safari, Firefox

### 1. Clone & Set Up Backend

```bash
cd Radionova

# Install Python dependencies
pip install -r backend/requirements.txt   # or pip install fastapi uvicorn torch torchvision opencv-python pydantic reportlab

# Start the FastAPI backend server (Port 8000)
python -m uvicorn backend.main:app --host 127.0.0.1 --port 8000 --reload
```

Backend API will be accessible at `http://127.0.0.1:8000`.  
Swagger Interactive API documentation is available at `http://127.0.0.1:8000/docs`.

### 2. Set Up & Launch Frontend

```bash
cd Radionova/frontend

# Install Node dependencies
npm install

# Start Vite development server (Port 5173)
npm run dev
```

Open `http://localhost:5173` in your browser.

---

## 📡 API Endpoints Summary

| Endpoint | Method | Access | Description |
|---|---|---|---|
| `/api/v1/auth/login` | `POST` | Public | Physician JWT login authentication |
| `/api/v1/studies` | `GET` | Doctor | List patient imaging studies for active doctor |
| `/api/v1/studies` | `POST` | Doctor | Create a new clinical imaging study record |
| `/api/v1/analysis/chest` | `POST` | Doctor | DenseNet-121 chest X-ray pneumonia inference + Grad-CAM |
| `/api/v1/analysis/fracture` | `POST` | Doctor | Gatekeeper + DenseNet-121 bone fracture detection |
| `/api/v1/reports/generate` | `POST` | Doctor | Generate & download standardized clinical PDF report |
| `/api/v1/patient/session` | `POST` | Public (Guest) | Initialize anonymous symptom triage session |
| `/api/v1/patient/chat` | `POST` | Public (Guest) | Multi-turn symptom assessment with red-flag checks |
| `/health` | `GET` | Public | System status, device mode (CPU/CUDA), and model health |

---

## 🛡️ Security & Clinical Governance
- **Data Isolation**: Doctor studies are isolated per physician session ID.
- **Safety Gate**: The Patient Triage portal has strict read-only boundaries and cannot modify, approve, or generate doctor reports.
- **Deterministic Fallbacks**: When external AI APIs are unreachable, offline heuristic medical matrices ensure continuous operation without service crashes.
- **HIPAA / MCI India Alignment**: Clinical outputs carry mandatory review disclaimers, audit timestamps, and study accession IDs.

---

## 📄 License & Attribution
Designed and built for high-performance clinical decision support.  
*RadiNova AI — Multi-Modal Diagnostic Intelligence.*
