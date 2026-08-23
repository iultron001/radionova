"""
RadiNova AI — Root Backend Server Launcher
Allows running the backend server directly from the root workspace directory.
Usage:
    python run.py
"""

import sys
from pathlib import Path
import uvicorn

# Add Radionova to sys.path
RADIONOVA_DIR = Path(__file__).resolve().parent / "Radionova"
if str(RADIONOVA_DIR) not in sys.path:
    sys.path.insert(0, str(RADIONOVA_DIR))

if __name__ == "__main__":
    print(f"[RadiNova Launcher] Starting backend server from: {RADIONOVA_DIR}")
    uvicorn.run(
        "backend.main:app",
        host="0.0.0.0",
        port=8000,
        reload=True,
        app_dir=str(RADIONOVA_DIR)
    )
