"""
RadiNova AI — Database Manager & Schema Initialization
Uses SQLite for robust, zero-dependency, demo-ready persistence.
Stores Doctors, Studies, Medical Images, Analyses, Reports, and Patient Sessions.
"""

import sqlite3
import json
import os
import uuid
from datetime import datetime
from pathlib import Path
from typing import Dict, Any, List, Optional
from backend.core.security import get_password_hash

DB_PATH = Path(__file__).resolve().parent.parent / "radinova.db"

def get_db():
    conn = sqlite3.connect(str(DB_PATH), check_same_thread=False)
    conn.row_factory = sqlite3.Row
    return conn

def init_db():
    conn = get_db()
    cursor = conn.cursor()

    # 1. Doctors Table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS doctors (
        id TEXT PRIMARY KEY,
        email TEXT UNIQUE NOT NULL,
        name TEXT NOT NULL,
        password_hash TEXT NOT NULL,
        doctor_id TEXT UNIQUE NOT NULL,
        specialization TEXT DEFAULT 'Radiology & Imaging Sciences',
        hospital TEXT DEFAULT 'RadiNova Medical Center',
        qualification TEXT DEFAULT 'MD, Radiodiagnosis',
        created_at TEXT NOT NULL
    );
    """)

    # 2. Studies Table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS studies (
        id TEXT PRIMARY KEY,
        doctor_id TEXT NOT NULL,
        patient_name TEXT NOT NULL,
        patient_id TEXT NOT NULL,
        modality TEXT NOT NULL,
        study_date TEXT NOT NULL,
        status TEXT DEFAULT 'Pending Analysis',
        notes TEXT DEFAULT '',
        created_at TEXT NOT NULL,
        FOREIGN KEY(doctor_id) REFERENCES doctors(id)
    );
    """)

    # 3. Medical Images Table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS medical_images (
        id TEXT PRIMARY KEY,
        study_id TEXT NOT NULL,
        image_name TEXT NOT NULL,
        file_path TEXT DEFAULT '',
        image_base64 TEXT DEFAULT '',
        uploaded_at TEXT NOT NULL,
        FOREIGN KEY(study_id) REFERENCES studies(id)
    );
    """)

    # 4. Analyses Table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS analyses (
        id TEXT PRIMARY KEY,
        study_id TEXT NOT NULL,
        modality TEXT NOT NULL,
        prediction TEXT NOT NULL,
        confidence REAL NOT NULL,
        gatekeeper_passed INTEGER DEFAULT 1,
        gatekeeper_confidence REAL DEFAULT 1.0,
        probabilities TEXT DEFAULT '{}',
        gradcam_image TEXT DEFAULT '',
        guidance TEXT DEFAULT '{}',
        disclaimer TEXT NOT NULL,
        created_at TEXT NOT NULL,
        FOREIGN KEY(study_id) REFERENCES studies(id)
    );
    """)

    # 5. Reports Table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS reports (
        id TEXT PRIMARY KEY,
        study_id TEXT NOT NULL,
        report_code TEXT UNIQUE NOT NULL,
        display_name TEXT NOT NULL,
        status TEXT DEFAULT 'Draft',
        findings TEXT DEFAULT '',
        impression TEXT DEFAULT '',
        clinical_notes TEXT DEFAULT '',
        doctor_signature TEXT DEFAULT '',
        report_data TEXT DEFAULT '{}',
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL,
        FOREIGN KEY(study_id) REFERENCES studies(id)
    );
    """)

    # 6. Patient Sessions Table (Tier 2 Patient Portal)
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS patient_sessions (
        id TEXT PRIMARY KEY,
        session_code TEXT UNIQUE NOT NULL,
        turn_count INTEGER DEFAULT 0,
        max_turns INTEGER DEFAULT 8,
        is_completed INTEGER DEFAULT 0,
        structured_symptoms TEXT DEFAULT '{}',
        concern_level TEXT DEFAULT 'LOW',
        created_at TEXT NOT NULL
    );
    """)

    # 7. Patient Chat Messages Table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS patient_chat_messages (
        id TEXT PRIMARY KEY,
        session_id TEXT NOT NULL,
        role TEXT NOT NULL,
        content TEXT NOT NULL,
        created_at TEXT NOT NULL,
        FOREIGN KEY(session_id) REFERENCES patient_sessions(id)
    );
    """)

    conn.commit()

    # Seed Default Demo Doctor if empty
    cursor.execute("SELECT COUNT(*) FROM doctors")
    if cursor.fetchone()[0] == 0:
        demo_doc_id = str(uuid.uuid4())
        cursor.execute("""
        INSERT INTO doctors (id, email, name, password_hash, doctor_id, specialization, hospital, qualification, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, (
            demo_doc_id,
            "doctor@radinova.ai",
            "Dr. Sarah Jenkins",
            get_password_hash("doctor123"),
            "RN-DOC-89241",
            "Thoracic & Musculoskeletal Radiodiagnostics",
            "Metropolitan Health Sciences Center",
            "MD, DABR (Radiology)",
            datetime.utcnow().isoformat()
        ))
        conn.commit()

    conn.close()

# Auto initialize when module is loaded
init_db()
