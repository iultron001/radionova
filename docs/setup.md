# RadiNova AI — Setup & Developer Guide

## System Requirements
- Python 3.10+
- Node.js 18+ (tested on Node v24)
- Modern web browser (Chrome, Edge, Firefox, Safari)

## Repository Layout
- `model/` — PyTorch DenseNet-121 architectures, training scripts, Grad-CAM module, and Google Colab GPU notebooks.
- `backend/` — FastAPI REST API with endpoints `/predict/*`, `/explain/*`, `/assistant`, `/report`, and `/health`.
- `frontend/` — Pure React 18 + Vite with custom Swiss Style design tokens in `index.css`.
- `reports/` — ReportLab PDF generation engine producing clinician-signed PDF reports.
- `rules/` — `clinical_guidance.json` clinical decision support rule engine.
- `datasets/` — Stratified 80/10/10 re-split scripts and CSV manifests.

## Quick Launch
1. **Backend Server:**
   ```bash
   python -m uvicorn backend.main:app --port 8000 --reload
   ```
2. **Frontend Dev Server:**
   ```bash
   cd frontend
   npm run dev
   ```
3. Open `http://localhost:5173`.
