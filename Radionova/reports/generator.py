"""
RadiNova AI — Clinical PDF Report Generator (ReportLab)
Implements Swiss Style clinical report layouts with side-by-side scans, Grad-CAM overlays,
differential considerations, and prominent safety disclaimers.
"""

import io
import base64
from datetime import datetime
from typing import Dict, Any, Optional
from reportlab.lib.pagesizes import letter
from reportlab.lib import colors
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import inch
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, Image as RLImage, KeepTogether
from PIL import Image

MANDATORY_DISCLAIMER = "For educational/research purposes only — not a substitute for professional medical diagnosis."

class ClinicalReportGenerator:
    def __init__(self):
        self.styles = getSampleStyleSheet()
        self._init_custom_styles()

    def _init_custom_styles(self):
        # Swiss typography styles: clean, sans-serif, high contrast
        self.title_style = ParagraphStyle(
            'SwissTitle',
            parent=self.styles['Heading1'],
            fontName='Helvetica-Bold',
            fontSize=20,
            leading=24,
            textColor=colors.HexColor('#0A0A0A')
        )
        self.disclaimer_style = ParagraphStyle(
            'SwissDisclaimer',
            parent=self.styles['Normal'],
            fontName='Helvetica-Bold',
            fontSize=8.5,
            leading=11,
            textColor=colors.HexColor('#991B1B'), # Bold crimson
            alignment=1 # Center
        )
        self.section_heading = ParagraphStyle(
            'SwissSectionHeading',
            parent=self.styles['Heading2'],
            fontName='Helvetica-Bold',
            fontSize=11,
            leading=14,
            textColor=colors.HexColor('#111827'),
            spaceAfter=4
        )
        self.body_style = ParagraphStyle(
            'SwissBody',
            parent=self.styles['Normal'],
            fontName='Helvetica',
            fontSize=9,
            leading=13,
            textColor=colors.HexColor('#374151')
        )
        self.bullet_style = ParagraphStyle(
            'SwissBullet',
            parent=self.styles['Normal'],
            fontName='Helvetica',
            fontSize=8.5,
            leading=12,
            textColor=colors.HexColor('#1F2937'),
            leftIndent=12
        )

    def _decode_b64_image(self, b64_str: str) -> Optional[io.BytesIO]:
        try:
            if "," in b64_str:
                b64_str = b64_str.split(",")[1]
            img_data = base64.b64decode(b64_str)
            return io.BytesIO(img_data)
        except Exception:
            return None

    def generate_pdf(self, report_data: Dict[str, Any]) -> bytes:
        """
        Generates binary PDF stream from structured analysis results.
        """
        buffer = io.BytesIO()
        doc = SimpleDocTemplate(
            buffer,
            pagesize=letter,
            leftMargin=36,
            rightMargin=36,
            topMargin=36,
            bottomMargin=36
        )

        elements = []

        # 1. Top Mandatory Disclaimer Banner (Swiss Box)
        disclaimer_table = Table(
            [[Paragraph(f"<b>SAFETY NOTICE:</b> {MANDATORY_DISCLAIMER}", self.disclaimer_style)]],
            colWidths=[540]
        )
        disclaimer_table.setStyle(TableStyle([
            ('BACKGROUND', (0,0), (-1,-1), colors.HexColor('#FEE2E2')),
            ('BOX', (0,0), (-1,-1), 1, colors.HexColor('#EF4444')),
            ('PADDING', (0,0), (-1,-1), 6),
            ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
        ]))
        elements.append(disclaimer_table)
        elements.append(Spacer(1, 10))

        # 2. Header & Branding
        modality_title = report_data.get("modality", "Clinical Study").replace("_", " ").upper()
        now_str = datetime.now().strftime("%Y-%m-%d %H:%M:%S UTC")
        header_data = [
            [Paragraph("<b>RADINOVA AI</b>", self.title_style), Paragraph(f"<b>STUDY TYPE:</b> {modality_title}<br/><b>DATE:</b> {now_str}", self.body_style)]
        ]
        header_table = Table(header_data, colWidths=[300, 240])
        header_table.setStyle(TableStyle([
            ('VALIGN', (0,0), (-1,-1), 'TOP'),
            ('LINEBELOW', (0,0), (-1,-1), 1.5, colors.HexColor('#0A0A0A')),
            ('BOTTOMPADDING', (0,0), (-1,-1), 6),
        ]))
        elements.append(header_table)
        elements.append(Spacer(1, 10))

        # 3. Patient & Clinical Metadata Grid
        patient_info = report_data.get("patient", {
            "id": "RN-90824",
            "name": "Anonymous Case #9082",
            "age": "48",
            "gender": "Female",
            "accession": "ACC-2026-X8"
        })
        meta_table_data = [
            [
                Paragraph(f"<b>Patient ID:</b> {patient_info.get('id', 'RN-001')}", self.body_style),
                Paragraph(f"<b>Age / Sex:</b> {patient_info.get('age', 'N/A')} / {patient_info.get('gender', 'N/A')}", self.body_style),
                Paragraph(f"<b>Accession #:</b> {patient_info.get('accession', 'N/A')}", self.body_style),
            ]
        ]
        meta_table = Table(meta_table_data, colWidths=[180, 180, 180])
        meta_table.setStyle(TableStyle([
            ('BACKGROUND', (0,0), (-1,-1), colors.HexColor('#F3F4F6')),
            ('PADDING', (0,0), (-1,-1), 6),
            ('BOX', (0,0), (-1,-1), 0.5, colors.HexColor('#E5E7EB')),
        ]))
        elements.append(meta_table)
        elements.append(Spacer(1, 12))

        # 4. Computer Vision Modality: Images & Grad-CAM Heatmap
        orig_b64 = report_data.get("original_image")
        gradcam_b64 = report_data.get("gradcam_overlay")

        if orig_b64 and gradcam_b64:
            orig_stream = self._decode_b64_image(orig_b64)
            gradcam_stream = self._decode_b64_image(gradcam_b64)

            if orig_stream and gradcam_stream:
                img_table_data = [
                    [
                        Paragraph("<b>Original Radiograph</b>", self.section_heading),
                        Paragraph("<b>Grad-CAM Explainability Heatmap</b>", self.section_heading)
                    ],
                    [
                        RLImage(orig_stream, width=2.4*inch, height=2.4*inch),
                        RLImage(gradcam_stream, width=2.4*inch, height=2.4*inch)
                    ]
                ]
                img_table = Table(img_table_data, colWidths=[270, 270])
                img_table.setStyle(TableStyle([
                    ('ALIGN', (0,0), (-1,-1), 'CENTER'),
                    ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
                    ('PADDING', (0,0), (-1,-1), 4),
                ]))
                elements.append(img_table)
                elements.append(Spacer(1, 10))

        # 5. Diagnostic Findings & Quantitative Confidence
        pred = report_data.get("prediction", "N/A")
        conf = report_data.get("confidence", 0.0)
        
        findings_header = [
            [
                Paragraph(f"<b>AI CLASSIFICATION:</b> <font color='#1E40AF'>{pred}</font>", self.section_heading),
                Paragraph(f"<b>CONFIDENCE SCORE:</b> <b>{conf*100:.1f}%</b>", self.section_heading)
            ]
        ]
        findings_table = Table(findings_header, colWidths=[320, 220])
        findings_table.setStyle(TableStyle([
            ('BACKGROUND', (0,0), (-1,-1), colors.HexColor('#EFF6FF')),
            ('BOX', (0,0), (-1,-1), 1, colors.HexColor('#93C5FD')),
            ('PADDING', (0,0), (-1,-1), 6),
        ]))
        elements.append(findings_table)
        elements.append(Spacer(1, 10))

        # 6. Rule-Based Clinical Guidance / Differential Considerations
        guidance = report_data.get("guidance", {})
        if guidance:
            elements.append(Paragraph("<b>CLINICAL DECISION SUPPORT GUIDANCE</b>", self.section_heading))
            if guidance.get("clinical_summary"):
                elements.append(Paragraph(f"<b>Summary:</b> {guidance['clinical_summary']}", self.body_style))
                elements.append(Spacer(1, 4))
            
            diffs = guidance.get("differential_considerations", [])
            if diffs:
                elements.append(Paragraph("<b>Differential Considerations:</b>", self.body_style))
                for d in diffs:
                    elements.append(Paragraph(f"• {d}", self.bullet_style))
                elements.append(Spacer(1, 4))

            followups = guidance.get("recommended_followup", [])
            if followups:
                elements.append(Paragraph("<b>Recommended Follow-Up & Clinical Correlation:</b>", self.body_style))
                for f in followups:
                    elements.append(Paragraph(f"• {f}", self.bullet_style))
                elements.append(Spacer(1, 6))

        # 7. LLM Findings (for Blood/MRI/ECG/CT)
        explanation = report_data.get("explanation", {})
        if explanation:
            elements.append(Paragraph(f"<b>DOCUMENT & SCAN INTERPRETATION</b>", self.section_heading))
            if isinstance(explanation, dict):
                if explanation.get("plain_language_summary"):
                    elements.append(Paragraph(f"<b>Interpretation:</b> {explanation['plain_language_summary']}", self.body_style))
                    elements.append(Spacer(1, 4))
                if explanation.get("key_findings"):
                    elements.append(Paragraph("<b>Key Findings:</b>", self.body_style))
                    for kf in explanation["key_findings"]:
                        elements.append(Paragraph(f"• {kf}", self.bullet_style))
                    elements.append(Spacer(1, 4))

        # 8. Clinician Sign-Off Signature Box
        elements.append(Spacer(1, 10))
        sig_data = [
            [
                Paragraph("<b>Attending Radiologist / Clinician Verification</b><br/><br/>Signature: ___________________________<br/>Date: _______________________________", self.body_style),
                Paragraph("<b>Institutional Disclaimer</b><br/>This computer-assisted analysis must be reviewed in conjunction with patient history, laboratory diagnostics, and clinical physical examination.", self.body_style)
            ]
        ]
        sig_table = Table(sig_data, colWidths=[270, 270])
        sig_table.setStyle(TableStyle([
            ('LINEABOVE', (0,0), (-1,-1), 1, colors.HexColor('#9CA3AF')),
            ('PADDING', (0,0), (-1,-1), 6),
            ('VALIGN', (0,0), (-1,-1), 'TOP'),
        ]))
        elements.append(sig_table)

        doc.build(elements)
        return buffer.getvalue()

report_generator = ClinicalReportGenerator()
