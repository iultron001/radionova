"""
RadiNova AI — Report Service Wrapper
Interfaces with reports.generator.ClinicalReportGenerator.
"""

import sys
from pathlib import Path
from typing import Dict, Any

ROOT_DIR = Path(__file__).resolve().parent.parent.parent
if str(ROOT_DIR) not in sys.path:
    sys.path.insert(0, str(ROOT_DIR))

from reports.generator import report_generator, ClinicalReportGenerator

class ReportService:
    def __init__(self):
        self.generator = report_generator

    def generate_pdf(self, report_data: Dict[str, Any]) -> bytes:
        return self.generator.generate_pdf(report_data)

report_service = ReportService()
