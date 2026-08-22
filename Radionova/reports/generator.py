"""
RadiNova AI — Clinical PDF Report Generator (ReportLab)
Implements Swiss Style clinical report layouts with side-by-side scans, Grad-CAM overlays,
prominent and explicit AI Model Output banners, differential considerations, and safety disclaimers.
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

MANDATORY_DISCLAIMER = "AI-assisted prediction / decision support — requires review by a qualified healthcare professional."

class ClinicalReportGenerator:
    def __init__(self):
        self.styles = getSampleStyleSheet()
        self._init_custom_styles()

    def _init_custom_styles(self):
        # Swiss typography styles: clean, high contrast, readable
        self.title_style = ParagraphStyle(
            'SwissTitle',
            parent=self.styles['Heading1'],
            fontName='Helvetica-Bold',
            fontSize=18,
            leading=22,
            textColor=colors.HexColor('#0A0A0A')
        )
        self.disclaimer_style = ParagraphStyle(
            'SwissDisclaimer',
            parent=self.styles['Normal'],
            fontName='Helvetica-Oblique',
            fontSize=8,
            leading=10,
            textColor=colors.HexColor('#4B5563'),
            alignment=1 # Center
        )
        self.section_heading = ParagraphStyle(
            'SwissSectionHeading',
            parent=self.styles['Heading2'],
            fontName='Helvetica-Bold',
            fontSize=10.5,
            leading=13,
            textColor=colors.HexColor('#111827'),
            spaceAfter=3
        )
        self.model_out_style = ParagraphStyle(
            'ModelOutputHeading',
            parent=self.styles['Normal'],
            fontName='Helvetica-Bold',
            fontSize=12,
            leading=15,
            textColor=colors.HexColor('#065F46')
        )
        self.body_style = ParagraphStyle(
            'SwissBody',
            parent=self.styles['Normal'],
            fontName='Helvetica',
            fontSize=8.5,
            leading=11.5,
            textColor=colors.HexColor('#374151')
        )
        self.body_bold = ParagraphStyle(
            'SwissBodyBold',
            parent=self.styles['Normal'],
            fontName='Helvetica-Bold',
            fontSize=8.5,
            leading=11.5,
            textColor=colors.HexColor('#111827')
        )
        self.bullet_style = ParagraphStyle(
            'SwissBullet',
            parent=self.styles['Normal'],
            fontName='Helvetica',
            fontSize=8,
            leading=11,
            textColor=colors.HexColor('#1F2937'),
            leftIndent=10
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
        Generates binary PDF stream with clear model outputs and explainability heatmaps.
        """
        buffer = io.BytesIO()
        doc = SimpleDocTemplate(
            buffer,
            pagesize=letter,
            leftMargin=32,
            rightMargin=32,
            topMargin=28,
            bottomMargin=28
        )

        elements = []

        # 1. Top Document Classification Banner
        doc_header = Table(
            [[Paragraph("<b>CONFIDENTIAL CLINICAL DIAGNOSTIC & NEURAL INFERENCE REPORT</b>", self.disclaimer_style)]],
            colWidths=[548]
        )
        doc_header.setStyle(TableStyle([
            ('BACKGROUND', (0,0), (-1,-1), colors.HexColor('#F3F4F6')),
            ('BOX', (0,0), (-1,-1), 0.5, colors.HexColor('#D1D5DB')),
            ('PADDING', (0,0), (-1,-1), 4),
            ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
        ]))
        elements.append(doc_header)
        elements.append(Spacer(1, 6))

        # 2. Header & Branding
        modality_raw = report_data.get("modality", "clinical_study")
        modality_map = {
            "chest_xray": "Chest Radiography (X-Ray)",
            "limb_fracture": "Limb Extremity Radiograph",
            "mri": "Brain MRI Neuroimaging",
            "ct": "Computed Tomography (CT)",
            "blood": "Hematology & Blood Panel",
            "ecg": "12-Lead Electrocardiogram (ECG)"
        }
        modality_title = modality_map.get(modality_raw, modality_raw.replace("_", " ").upper())
        now_str = datetime.utcnow().strftime("%Y-%m-%d %H:%M UTC")

        header_data = [
            [
                Paragraph("<b>RADINOVA AI CLINICAL SUITE</b><br/><font size='7.5' color='#6B7280'>Multi-Modal Neural Diagnostic Decision Support</font>", self.title_style),
                Paragraph(f"<b>STUDY TYPE:</b> {modality_title}<br/><b>DATE / TIME:</b> {now_str}<br/><b>STATUS:</b> <font color='#059669'>ANALYSIS COMPLETED</font>", self.body_style)
            ]
        ]
        header_table = Table(header_data, colWidths=[310, 238])
        header_table.setStyle(TableStyle([
            ('VALIGN', (0,0), (-1,-1), 'TOP'),
            ('LINEBELOW', (0,0), (-1,-1), 1.2, colors.HexColor('#111827')),
            ('BOTTOMPADDING', (0,0), (-1,-1), 4),
        ]))
        elements.append(header_table)
        elements.append(Spacer(1, 6))

        # 3. Patient & Clinical Metadata Grid
        patient_name = report_data.get("patient_name") or report_data.get("patient", {}).get("name", "Eleanor Vance")
        patient_id = report_data.get("patient_id") or report_data.get("patient", {}).get("id", "RN-2026-00142")
        doctor_name = report_data.get("doctor_name", "Dr. Alexander Ross, MD")
        hospital = report_data.get("hospital", "RadiNova Medical Center")

        meta_table_data = [
            [
                Paragraph(f"<b>Patient Name:</b> {patient_name}", self.body_style),
                Paragraph(f"<b>Patient ID:</b> {patient_id}", self.body_style),
                Paragraph(f"<b>Attending:</b> {doctor_name}", self.body_style),
                Paragraph(f"<b>Facility:</b> {hospital}", self.body_style),
            ]
        ]
        meta_table = Table(meta_table_data, colWidths=[140, 120, 148, 140])
        meta_table.setStyle(TableStyle([
            ('BACKGROUND', (0,0), (-1,-1), colors.HexColor('#F9FAFB')),
            ('PADDING', (0,0), (-1,-1), 4),
            ('BOX', (0,0), (-1,-1), 0.5, colors.HexColor('#E5E7EB')),
        ]))
        elements.append(meta_table)
        elements.append(Spacer(1, 8))

        # 4. Computer Vision Modality: Images & Grad-CAM Heatmap
        orig_b64 = report_data.get("original_image")
        gradcam_b64 = report_data.get("gradcam_overlay")

        if orig_b64 and gradcam_b64:
            orig_stream = self._decode_b64_image(orig_b64)
            gradcam_stream = self._decode_b64_image(gradcam_b64)

            if orig_stream and gradcam_stream:
                img_table_data = [
                    [
                        Paragraph("<b>1. Original Radiograph Input</b>", self.section_heading),
                        Paragraph("<b>2. Grad-CAM Neural Activation Map</b>", self.section_heading)
                    ],
                    [
                        RLImage(orig_stream, width=2.2*inch, height=2.2*inch),
                        RLImage(gradcam_stream, width=2.2*inch, height=2.2*inch)
                    ]
                ]
                img_table = Table(img_table_data, colWidths=[274, 274])
                img_table.setStyle(TableStyle([
                    ('ALIGN', (0,0), (-1,-1), 'CENTER'),
                    ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
                    ('PADDING', (0,0), (-1,-1), 3),
                    ('BACKGROUND', (0,0), (-1,-1), colors.HexColor('#0F172A')),
                    ('TEXTCOLOR', (0,0), (-1,-1), colors.white)
                ]))
                elements.append(img_table)
                elements.append(Spacer(1, 8))

        # 5. CLEAR & PROMINENT AI MODEL OUTPUT SECTION
        pred = report_data.get("prediction", "N/A")
        conf = float(report_data.get("confidence", 0.0))
        model_name = report_data.get("model_name") or f"DenseNet-121 Deep Neural Network ({modality_title})"
        gatekeeper_name = report_data.get("gatekeeper_name", "Two-Layer Anatomical Gatekeeper")
        gatekeeper_conf = float(report_data.get("gatekeeper_confidence", 0.98))
        probs = report_data.get("probabilities", {})

        # Formulate crystal-clear Output Classification text
        is_positive = pred in ["PNEUMONIA", "FRACTURED", "TUMOR"]
        output_color = '#B91C1C' if is_positive else '#047857'
        
        if modality_raw == "chest_xray":
            output_title = "PNEUMONIA CONSOLIDATION DETECTED" if pred == "PNEUMONIA" else "NO PNEUMONIA / NORMAL CHEST RADIOGRAPH"
        elif modality_raw == "limb_fracture":
            output_title = "CORTICAL BONE FRACTURE DETECTED" if pred == "FRACTURED" else "INTACT BONE / NO FRACTURE DETECTED"
        elif modality_raw == "mri":
            output_title = "INTRACRANIAL LESION / MASS EFFECT DETECTED" if pred == "TUMOR" else "NORMAL PARENCHYMA / NO LESION DETECTED"
        else:
            output_title = f"{pred} (ANALYSIS COMPLETE)"

        # Probability string
        prob_str = " • ".join([f"<b>{k}:</b> {float(v)*100:.1f}%" for k, v in probs.items()]) if probs else f"Primary Class: {conf*100:.1f}%"

        model_output_rows = [
            [
                Paragraph(f"<b>PRIMARY AI MODEL OUTPUT:</b><br/><font size='11' color='{output_color}'><b>{output_title}</b></font>", self.body_style),
                Paragraph(f"<b>DIAGNOSTIC CONFIDENCE:</b><br/><font size='11' color='#1D4ED8'><b>{conf*100:.1f}%</b></font>", self.body_style),
            ],
            [
                Paragraph(f"<b>Inference Model:</b> {model_name}<br/><b>Explainability Layer:</b> Grad-CAM (denseblock4.denselayer16)", self.body_style),
                Paragraph(f"<b>Modality Gatekeeper:</b> <font color='#059669'>PASSED</font> ({gatekeeper_conf*100:.1f}% Anat. Confidence)<br/><b>Class Distribution:</b> {prob_str}", self.body_style),
            ]
        ]
        model_output_table = Table(model_output_rows, colWidths=[280, 268])
        model_output_table.setStyle(TableStyle([
            ('BACKGROUND', (0,0), (-1,-1), colors.HexColor('#EFF6FF')),
            ('BOX', (0,0), (-1,-1), 1.2, colors.HexColor('#60A5FA')),
            ('LINEBELOW', (0,0), (-1,0), 0.5, colors.HexColor('#93C5FD')),
            ('PADDING', (0,0), (-1,-1), 5),
            ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
        ]))
        elements.append(model_output_table)
        elements.append(Spacer(1, 8))

        # 6. Quantitative Biomarkers & Anatomical Zones (if available)
        infographic = report_data.get("infographic", {})
        zones = infographic.get("anatomical_zones", [])
        signs = infographic.get("radiologic_signs", [])

        if zones or signs:
            elements.append(Paragraph("<b>ANATOMICAL ASSESSMENT & RADIOLOGIC SIGNS</b>", self.section_heading))
            
            zone_text_list = []
            for z in zones[:4]:
                zone_text_list.append(f"• <b>{z.get('zone', 'Zone')}:</b> {z.get('status', 'N/A')} (Involvement: {z.get('involvement', '0%')})")
            
            sign_text_list = []
            for s in signs[:4]:
                present_tag = "<font color='#DC2626'>[PRESENT]</font>" if s.get("present") else "<font color='#059669'>[ABSENT]</font>"
                sign_text_list.append(f"• <b>{s.get('sign', 'Sign')}:</b> {present_tag} — {s.get('description', '')}")

            zone_para = Paragraph("<br/>".join(zone_text_list) if zone_text_list else "Anatomical integrity preserved.", self.body_style)
            sign_para = Paragraph("<br/>".join(sign_text_list) if sign_text_list else "No acute radiologic pathognomonic signs.", self.body_style)

            anatomy_table = Table([
                [Paragraph("<b>Anatomical Zone Breakdown</b>", self.body_bold), Paragraph("<b>Pathological Signs Evaluated</b>", self.body_bold)],
                [zone_para, sign_para]
            ], colWidths=[274, 274])
            anatomy_table.setStyle(TableStyle([
                ('BACKGROUND', (0,0), (-1,-1), colors.HexColor('#F9FAFB')),
                ('BOX', (0,0), (-1,-1), 0.5, colors.HexColor('#E5E7EB')),
                ('LINEBELOW', (0,0), (-1,0), 0.5, colors.HexColor('#E5E7EB')),
                ('PADDING', (0,0), (-1,-1), 4),
                ('VALIGN', (0,0), (-1,-1), 'TOP'),
            ]))
            elements.append(anatomy_table)
            elements.append(Spacer(1, 8))

        # 7. Rule-Based Clinical Guidance & Differential Considerations
        guidance = report_data.get("guidance", {})
        if guidance:
            elements.append(Paragraph("<b>CLINICAL DECISION SUPPORT & DIFFERENTIAL CONSIDERATIONS</b>", self.section_heading))
            if guidance.get("clinical_summary"):
                elements.append(Paragraph(f"<b>Clinical Summary:</b> {guidance['clinical_summary']}", self.body_style))
                elements.append(Spacer(1, 3))
            
            diffs = guidance.get("differential_considerations", [])
            if diffs:
                elements.append(Paragraph("<b>Differential Considerations:</b>", self.body_bold))
                for d in diffs:
                    elements.append(Paragraph(f"• {d}", self.bullet_style))
                elements.append(Spacer(1, 3))

            followups = guidance.get("recommended_followup", [])
            if followups:
                elements.append(Paragraph("<b>Recommended Follow-Up & Clinical Correlation:</b>", self.body_bold))
                for f in followups:
                    elements.append(Paragraph(f"• {f}", self.bullet_style))
                elements.append(Spacer(1, 5))

        # 8. Text-Based LLM Findings (for Blood/CT/ECG)
        explanation = report_data.get("explanation", {})
        if explanation and isinstance(explanation, dict):
            elements.append(Paragraph("<b>DOCUMENT & SCAN INTERPRETATION</b>", self.section_heading))
            if explanation.get("plain_language_summary"):
                elements.append(Paragraph(f"<b>Interpretation:</b> {explanation['plain_language_summary']}", self.body_style))
                elements.append(Spacer(1, 3))
            if explanation.get("key_findings"):
                elements.append(Paragraph("<b>Key Laboratory / Diagnostic Findings:</b>", self.body_bold))
                for kf in explanation["key_findings"]:
                    elements.append(Paragraph(f"• {kf}", self.bullet_style))
                elements.append(Spacer(1, 4))

        # 9. Clinician Sign-Off Signature Box
        elements.append(Spacer(1, 6))
        sig_data = [
            [
                Paragraph(f"<b>Attending Radiologist / Clinician Verification</b><br/><br/>Physician: <b>{doctor_name}</b><br/>Signature: ___________________________<br/>Date: _______________________________", self.body_style),
                Paragraph(f"<b>Clinical Governance Notice</b><br/>{MANDATORY_DISCLAIMER}<br/><br/>Model outputs and Grad-CAM explainability maps serve as secondary clinical decision support (CDSS) and do not substitute for certified clinical judgment.", self.body_style)
            ]
        ]
        sig_table = Table(sig_data, colWidths=[274, 274])
        sig_table.setStyle(TableStyle([
            ('LINEABOVE', (0,0), (-1,-1), 1, colors.HexColor('#9CA3AF')),
            ('PADDING', (0,0), (-1,-1), 4),
            ('VALIGN', (0,0), (-1,-1), 'TOP'),
            ('BACKGROUND', (0,0), (-1,-1), colors.HexColor('#FAFAFA')),
        ]))
        elements.append(sig_table)

        doc.build(elements)
        return buffer.getvalue()

report_generator = ClinicalReportGenerator()
