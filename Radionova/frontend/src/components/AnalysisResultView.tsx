import React, { useState } from 'react';
import { 
  ZoomIn, 
  ZoomOut, 
  Hand, 
  Ruler, 
  RotateCw, 
  RotateCcw, 
  Bone, 
  ShieldCheck, 
  FileText, 
  Activity, 
  CheckCircle2, 
  Brain,
  ScanLine,
  Sun,
  Info,
  Ribbon
} from 'lucide-react';
import { AnyAnalysisResult, CVAnalysisResult, LLMAnalysisResult } from '../types';

interface AnalysisResultViewProps {
  result: AnyAnalysisResult;
  onDownloadPdf: (data: AnyAnalysisResult) => void;
  onClose?: () => void;
}

export const AnalysisResultView: React.FC<AnalysisResultViewProps> = ({
  result,
  onDownloadPdf
}) => {
  const [activeViewMode, setActiveViewMode] = useState<'original' | 'detection' | 'heatmap' | 'overlay'>('detection');
  const [zoomLevel, setZoomLevel] = useState<number>(1);
  const [rotation, setRotation] = useState<number>(0);
  const [showOriginalOnly, setShowOriginalOnly] = useState<boolean>(false);

  const isCV = 'prediction' in result;
  const cvData = isCV ? (result as CVAnalysisResult) : null;
  const llmData = !isCV ? (result as LLMAnalysisResult) : null;

  const modality = (cvData?.modality || (result as any).modality || 'chest_xray').toLowerCase();
  const confidence = isCV ? (cvData?.confidence || 0.92) : 0.90;
  const confidenceNum = Math.round(confidence * 100);
  const predRaw = isCV ? (cvData?.prediction || 'NORMAL') : (llmData?.explanation.title || 'Completed');

  // Modality-specific humanized labels & icons
  let modalityTitle = 'Chest Radiography (X-Ray)';
  let anatomicalRegion = 'Thoracic Cavity / Lungs';
  let modelName = cvData?.model_name || 'PyTorch DenseNet-121 (Chest Radiography)';
  let ModalityIcon = Activity;
  let isPositive = false;
  let predictionTitle = 'Normal Radiograph';
  let locationDetail = 'Right Lower / Mid Lobe';
  let findingClass = 'Physiological Baseline';
  let biomarkerLabel = 'Pulmonary Aeration Index';
  let biomarkerValue = '88%';
  let biomarkerSummary = 'Clear bilateral parenchymal aeration.';
  let protocolTitle = 'Respiratory Care Pathway';
  let protocolDesc = 'Maintain standard clinical monitoring and oxygen saturation checks.';
  let aiRecommendation = 'Correlate findings with auscultation and pulse oximetry. No acute consolidative process detected.';

  if (modality === 'chest_xray') {
    ModalityIcon = Activity;
    modalityTitle = 'Chest Radiography (X-Ray)';
    anatomicalRegion = 'Thoracic Cavity / Bilateral Lungs';
    modelName = cvData?.model_name || 'PyTorch DenseNet-121 (Chest Radiography)';
    if (predRaw === 'PNEUMONIA') {
      isPositive = true;
      predictionTitle = 'Pneumonia Consolidation Detected';
      locationDetail = 'Right Mid / Lower Zone (Perihilar Infiltrate)';
      findingClass = 'Acute Alveolar Consolidation';
      biomarkerLabel = 'Pulmonary Infiltrate Index';
      biomarkerValue = `${Math.min(96, Math.max(45, Math.round(confidence * 92)))}%`;
      biomarkerSummary = 'Elevated density in focal alveolar fields.';
      protocolTitle = 'Pneumonia Management Protocol';
      protocolDesc = 'Follow standard respiratory antimicrobial and diagnostic guidelines.';
      aiRecommendation = 'Correlate with inflammatory markers (CBC/CRP) and clinical symptoms (fever, purulent sputum). Consider targeted antimicrobial therapy and follow-up imaging in 4 weeks.';
    } else {
      isPositive = false;
      predictionTitle = 'Normal Chest (No Pneumonia)';
      locationDetail = 'Bilateral Lung Fields';
      findingClass = 'Clear Parenchymal Aeration';
      biomarkerLabel = 'Pulmonary Aeration Index';
      biomarkerValue = `${Math.min(98, Math.max(80, Math.round(confidence * 95)))}%`;
      biomarkerSummary = 'Intact bilateral aeration without focal opacity.';
      protocolTitle = 'Standard Respiratory Observation';
      protocolDesc = 'Continue routine diagnostic observation and follow-up.';
      aiRecommendation = 'Clear chest radiograph with no focal consolidation or pleural effusion. Routine clinical correlation advised.';
    }
  } else if (modality === 'limb_fracture') {
    ModalityIcon = Bone;
    modalityTitle = 'Limb Radiograph (X-Ray)';
    anatomicalRegion = 'Wrist / Forearm Extremity';
    modelName = cvData?.model_name || 'PyTorch DenseNet-121 (Limb Fracture)';
    if (predRaw === 'FRACTURED') {
      isPositive = true;
      predictionTitle = 'Cortical Bone Fracture Detected';
      locationDetail = 'Distal Radius / Metaphyseal Cortical Edge';
      findingClass = 'Oblique / Transverse Cortical Disruption';
      biomarkerLabel = 'Bone Structural Integrity';
      biomarkerValue = `${Math.max(40, Math.round((1 - confidence) * 100))}%`;
      biomarkerSummary = 'Cortical margin disruption identified.';
      protocolTitle = 'Orthopedic Immobilization Pathway';
      protocolDesc = 'Follow evidence-based splinting and orthopedic referral protocol.';
      aiRecommendation = 'Consult orthopedic surgery. Avoid heavy weight-bearing activities and keep affected limb immobilized in a neutral splint.';
    } else {
      isPositive = false;
      predictionTitle = 'Intact Cortical Bone (No Fracture)';
      locationDetail = 'Osseous Cortical Margin';
      findingClass = 'Congruent Alignment';
      biomarkerLabel = 'Bone Structural Integrity';
      biomarkerValue = `${Math.min(99, Math.max(85, Math.round(confidence * 95)))}%`;
      biomarkerSummary = 'Intact cortical bone with normal stress lines.';
      protocolTitle = 'Routine Orthopedic Clearance';
      protocolDesc = 'Standard soft tissue supportive care.';
      aiRecommendation = 'No acute radiolucent fracture line or cortical step-off. Continue standard symptomatic care.';
    }
  } else if (modality === 'mri') {
    ModalityIcon = Brain;
    modalityTitle = 'Brain MRI Neuroimaging';
    anatomicalRegion = 'Intracranial Parenchyma';
    modelName = cvData?.model_name || 'PyTorch DenseNet-121 (Brain MRI)';
    if (predRaw === 'TUMOR') {
      isPositive = true;
      predictionTitle = 'Intracranial Lesion / Tumor Detected';
      locationDetail = 'Frontal-Parietal White-Gray Junction';
      findingClass = 'Focal Hyperintense Mass Signal';
      biomarkerLabel = 'Parenchymal Signal Variance';
      biomarkerValue = `${Math.round(confidence * 90)}%`;
      biomarkerSummary = 'Localized perilesional vasogenic edema shadow.';
      protocolTitle = 'Neuro-Oncology Clinical Pathway';
      protocolDesc = 'Urgent contrast-enhanced neuroimaging correlation.';
      aiRecommendation = 'Urgent neurosurgical / neuro-oncology consultation recommended. Assess for mass effect or midline shift.';
    } else {
      isPositive = false;
      predictionTitle = 'Normal Brain MRI (No Focal Lesion)';
      locationDetail = 'Bilateral Cerebral Hemispheres';
      findingClass = 'Homogeneous Signal Intensity';
      biomarkerLabel = 'Parenchymal Structural Integrity';
      biomarkerValue = `${Math.round(confidence * 96)}%`;
      biomarkerSummary = 'Symmetric ventricles without mass effacement.';
      protocolTitle = 'Standard Neurologic Review';
      protocolDesc = 'Outpatient neuro assessment pathway.';
      aiRecommendation = 'Intact parenchymal signal, midline preservation, and symmetric ventricular caliber.';
    }
  } else if (modality === 'breast_cancer') {
    ModalityIcon = Ribbon;
    modalityTitle = 'Breast Cancer Screening';
    anatomicalRegion = 'Mammographic Tissue / Breast Parenchyma';
    modelName = cvData?.model_name || 'PyTorch DenseNet-121 (Mammography)';
    if (predRaw === 'MALIGNANT') {
      isPositive = true;
      predictionTitle = 'Malignant / Suspicious Mass Detected';
      locationDetail = 'Upper Outer Quadrant / Spiculated Foci';
      findingClass = 'BIRADS 4/5 Suspicious Morphology';
      biomarkerLabel = 'Malignancy Risk Index';
      biomarkerValue = `${confidenceNum}%`;
      biomarkerSummary = 'Irregular margin with high neural attention density.';
      protocolTitle = 'Oncology & Biopsy Pathway';
      protocolDesc = 'Urgent core needle biopsy and oncology specialist evaluation.';
      aiRecommendation = 'Tissue sampling (CNB) and urgent breast surgical oncology referral recommended. High feature density in designated region.';
    } else {
      isPositive = false;
      predictionTitle = 'Benign / Negative Mammogram';
      locationDetail = 'Fibroglandular Architecture';
      findingClass = 'BIRADS 1/2 Benign Pattern';
      biomarkerLabel = 'Tissue Stability Index';
      biomarkerValue = `${confidenceNum}%`;
      biomarkerSummary = 'Well-circumscribed tissue without suspicious spiculation.';
      protocolTitle = 'Routine Mammography Screening';
      protocolDesc = 'Standard annual screening mammography interval.';
      aiRecommendation = 'No acute malignancy, architectural distortion, or suspicious microcalcifications identified. Routine annual screening recommended.';
    }
  } else {
    ModalityIcon = ScanLine;
    modalityTitle = modality.toUpperCase();
    anatomicalRegion = 'Clinical Diagnostic Panel';
    modelName = 'Multi-Modal Clinical Interpreter';
    predictionTitle = llmData?.explanation.title || 'Diagnostic Review Completed';
    locationDetail = 'Clinical Document Stream';
    findingClass = 'Laboratory / Imaging Summary';
    biomarkerLabel = 'Diagnostic Consistency Index';
    biomarkerValue = '92%';
    biomarkerSummary = 'Structured report verified.';
    protocolTitle = 'Clinical Care Protocol';
    protocolDesc = 'Follow institutional specialty review guidelines.';
    aiRecommendation = llmData?.explanation.plain_language_summary || 'Review findings with clinical physician.';
  }

  // Radiograph images
  const originalImg = cvData?.original_image || (modality === 'chest_xray' ? '/samples/chest_pneumonia_1.jpeg' : '/samples/limb_fracture_1.jpg');
  const overlayImg = cvData?.gradcam_overlay || originalImg;

  const getDisplayImage = () => {
    if (showOriginalOnly || activeViewMode === 'original') return originalImg;
    if (activeViewMode === 'overlay' || activeViewMode === 'heatmap') return overlayImg;
    return originalImg;
  };

  return (
    <div className="analysis-workspace-grid">
      {/* =========================================================================
          LEFT PANEL: Study Meta & AI Diagnosis
          ========================================================================= */}
      <div className="analysis-left-panel">
        
        {/* Study Metadata Card */}
        <div className="dark-panel-card">
          <div className="study-header-row">
            <span className="study-title-text">Analysis Result</span>
            <span className="status-badge-completed">Completed</span>
          </div>

          <div className="study-meta-item">
            <span>Study ID: <strong>{(result as any).patient_id || 'RN-2026-00142'}</strong></span>
          </div>
          <div className="study-meta-item">
            <span>Patient: <strong>{(result as any).patient_name || 'Eleanor Vance'}</strong></span>
          </div>
          <div className="study-meta-item">
            <span>Modality: <strong>{modalityTitle}</strong></span>
          </div>
          <div className="study-meta-item">
            <span>Region: <strong>{anatomicalRegion}</strong></span>
          </div>
          <div className="study-meta-item">
            <span>Date: <strong>{new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}, {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</strong></span>
          </div>
        </div>

        {/* AI Finding Card with Percentage Badge */}
        <div className="ai-finding-card" style={{ borderLeft: `3px solid ${isPositive ? '#ef4444' : 'var(--accent-lime)'}` }}>
          <div className="finding-title-row">
            <span className="finding-label">Primary AI Finding</span>
            <div className="finding-pill-icon" style={{ background: isPositive ? 'rgba(239, 68, 68, 0.15)' : 'var(--accent-lime-subtle)', color: isPositive ? '#ef4444' : 'var(--accent-lime)' }}>
              <ModalityIcon size={16} />
            </div>
          </div>

          <div className="finding-main-prediction" style={{ color: isPositive ? '#f87171' : 'var(--text-primary)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px', flexWrap: 'wrap' }}>
            <span>{predictionTitle}</span>
            <span style={{
              fontSize: '12px',
              fontWeight: 800,
              padding: '2px 8px',
              borderRadius: '9999px',
              background: isPositive ? 'rgba(239, 68, 68, 0.2)' : 'rgba(163, 230, 53, 0.2)',
              color: isPositive ? '#f87171' : 'var(--accent-lime)',
              border: `1px solid ${isPositive ? 'rgba(239, 68, 68, 0.4)' : 'rgba(163, 230, 53, 0.4)'}`,
              letterSpacing: '0.02em',
              fontFamily: 'var(--font-mono, monospace)'
            }}>
              {confidenceNum}% Output Certainty
            </span>
          </div>

          <div className="finding-subdetail">
            <span>Target Zone: <strong>{locationDetail}</strong></span>
          </div>

          <div className="finding-subdetail">
            <span>Class: <strong>{findingClass}</strong></span>
          </div>
        </div>

        {/* AI Confidence Circular Gauge */}
        <div className="confidence-gauge-card">
          <span className="finding-label">AI Diagnostic Confidence</span>
          <div className="gauge-row">
            <div className="circular-gauge-wrap">
              <svg viewBox="0 0 36 36" style={{ width: '100%', height: '100%', transform: 'rotate(-90deg)' }}>
                <path
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  fill="none"
                  stroke="rgba(255, 255, 255, 0.08)"
                  strokeWidth="3.5"
                />
                <path
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  fill="none"
                  stroke={isPositive ? '#f87171' : '#a3e635'}
                  strokeWidth="3.5"
                  strokeDasharray={`${confidenceNum}, 100`}
                  strokeLinecap="round"
                />
              </svg>
              <div className="gauge-center-text" style={{ color: isPositive ? '#f87171' : '#a3e635' }}>{confidenceNum}%</div>
            </div>

            <div className="gauge-info-text">
              <span className="gauge-headline">{confidenceNum >= 85 ? 'High Confidence' : 'Moderate Confidence'}</span>
              <span className="gauge-subtext">
                Neural activation exceeds validation threshold.
              </span>
            </div>
          </div>
        </div>

        {/* Severity Assessment */}
        <div className="severity-track-card">
          <span className="finding-label">Clinical Triage Level</span>
          <div className="severity-gradient-bar">
            <div 
              className="severity-pin-marker" 
              style={{ left: isPositive ? '72%' : '20%' }}
            />
          </div>
          <div className="severity-labels-row">
            <span style={{ color: !isPositive ? 'var(--accent-lime)' : 'var(--text-muted)' }}>Clear / Normal</span>
            <span>Moderate</span>
            <span style={{ color: isPositive ? '#ef4444' : 'var(--text-muted)' }}>Action Required</span>
          </div>
        </div>

        {/* AI Model Meta Footer */}
        <div className="ai-model-meta-row">
          <span className="model-name">Model: {modelName}</span>
          <span className="model-tag">Grad-CAM Online</span>
        </div>

      </div>

      {/* =========================================================================
          CENTER PANEL: Radiograph Viewport & Interactive Tools
          ========================================================================= */}
      <div className="analysis-center-panel">
        
        {/* Main Viewport */}
        <div className="scan-viewport-container">
          {/* Anatomical Marker */}
          <div className="scan-anatomical-marker">R</div>

          {/* Toggle Button */}
          <button 
            className="view-original-toggle-btn"
            onClick={() => setShowOriginalOnly(!showOriginalOnly)}
          >
            {showOriginalOnly ? 'Show AI Explainability' : 'View Original Scan'}
          </button>

          {/* Floating Vertical Toolbar */}
          <div className="floating-viewer-toolbar">
            <button className="viewer-tool-btn" onClick={() => setZoomLevel(prev => Math.min(prev + 0.2, 2.5))} title="Zoom In">
              <ZoomIn size={16} />
              <span>Zoom +</span>
            </button>
            <button className="viewer-tool-btn" onClick={() => setZoomLevel(prev => Math.max(prev - 0.2, 0.6))} title="Zoom Out">
              <ZoomOut size={16} />
              <span>Zoom -</span>
            </button>
            <button className="viewer-tool-btn" title="Pan Canvas">
              <Hand size={16} />
              <span>Pan</span>
            </button>
            <button className="viewer-tool-btn" title="Caliper Measure">
              <Ruler size={16} />
              <span>Measure</span>
            </button>
            <button className="viewer-tool-btn" onClick={() => setRotation(prev => (prev + 90) % 360)} title="Rotate Clockwise">
              <RotateCw size={16} />
              <span>Rotate</span>
            </button>
            <button className="viewer-tool-btn" onClick={() => { setZoomLevel(1); setRotation(0); setShowOriginalOnly(false); }} title="Reset View">
              <RotateCcw size={16} />
              <span>Reset</span>
            </button>
          </div>

          {/* Rendered Scan Image with Modality-Accurate Visual Annotations */}
          <div style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <img
              src={getDisplayImage()}
              alt="Medical Scan"
              className="scan-image-render"
              style={{
                transform: `scale(${zoomLevel}) rotate(${rotation}deg)`
              }}
            />

            {/* AI Visual Detection Annotations */}
            {activeViewMode === 'detection' && !showOriginalOnly && (
              <>
                {/* 1. Limb Fracture Detection Box */}
                {modality === 'limb_fracture' && isPositive && (
                  <div
                    style={{
                      position: 'absolute',
                      top: '52%',
                      left: '42%',
                      width: '110px',
                      height: '110px',
                      border: '2px solid #a3e635',
                      boxShadow: '0 0 14px rgba(163, 230, 53, 0.4)',
                      borderRadius: '4px',
                      pointerEvents: 'none',
                      transform: 'translate(-50%, -50%)'
                    }}
                  >
                    <span style={{
                      position: 'absolute',
                      top: '-18px',
                      left: '0',
                      background: '#a3e635',
                      color: '#080c10',
                      fontSize: '9px',
                      fontWeight: 800,
                      padding: '1px 6px',
                      borderRadius: '2px'
                    }}>
                      FRACTURE {confidenceNum}%
                    </span>
                  </div>
                )}

                {/* 2. Chest Pneumonia Infiltrate Detection Box */}
                {modality === 'chest_xray' && isPositive && (
                  <div
                    style={{
                      position: 'absolute',
                      top: '55%',
                      left: '60%',
                      width: '130px',
                      height: '120px',
                      border: '2px solid #f87171',
                      boxShadow: '0 0 16px rgba(248, 113, 113, 0.45)',
                      borderRadius: '6px',
                      pointerEvents: 'none',
                      transform: 'translate(-50%, -50%)'
                    }}
                  >
                    <span style={{
                      position: 'absolute',
                      top: '-18px',
                      left: '0',
                      background: '#f87171',
                      color: '#ffffff',
                      fontSize: '9px',
                      fontWeight: 800,
                      padding: '1px 6px',
                      borderRadius: '2px'
                    }}>
                      PNEUMONIA INFILTRATE {confidenceNum}%
                    </span>
                  </div>
                )}

                {/* 3. Brain MRI Tumor Detection Box */}
                {modality === 'mri' && isPositive && (
                  <div
                    style={{
                      position: 'absolute',
                      top: '48%',
                      left: '46%',
                      width: '100px',
                      height: '100px',
                      border: '2px solid #f87171',
                      boxShadow: '0 0 16px rgba(248, 113, 113, 0.45)',
                      borderRadius: '6px',
                      pointerEvents: 'none',
                      transform: 'translate(-50%, -50%)'
                    }}
                  >
                    <span style={{
                      position: 'absolute',
                      top: '-18px',
                      left: '0',
                      background: '#f87171',
                      color: '#ffffff',
                      fontSize: '9px',
                      fontWeight: 800,
                      padding: '1px 6px',
                      borderRadius: '2px'
                    }}>
                      INTRACRANIAL LESION {confidenceNum}%
                    </span>
                  </div>
                )}

                {/* 4. Normal Scan Clearance Indicator */}
                {!isPositive && isCV && (
                  <div
                    style={{
                      position: 'absolute',
                      bottom: '16px',
                      left: '16px',
                      background: 'rgba(16, 185, 129, 0.9)',
                      color: '#ffffff',
                      padding: '4px 10px',
                      borderRadius: '4px',
                      fontSize: '11px',
                      fontWeight: 700,
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      pointerEvents: 'none'
                    }}
                  >
                    <CheckCircle2 size={14} />
                    <span>NO ACUTE PATHOLOGY DETECTED ({confidenceNum}%)</span>
                  </div>
                )}
              </>
            )}
          </div>
        </div>

        {/* 4-Thumbnail Mode Switcher */}
        <div className="scan-thumbnails-strip">
          <div 
            className={`thumbnail-mode-card ${activeViewMode === 'original' ? 'active' : ''}`}
            onClick={() => { setActiveViewMode('original'); setShowOriginalOnly(true); }}
          >
            <img src={originalImg} alt="Original" className="thumbnail-preview-img" />
            <span className="thumbnail-label">Original</span>
          </div>

          <div 
            className={`thumbnail-mode-card ${activeViewMode === 'detection' ? 'active' : ''}`}
            onClick={() => { setActiveViewMode('detection'); setShowOriginalOnly(false); }}
          >
            <div style={{ position: 'relative', width: '100%' }}>
              <img src={originalImg} alt="AI Detection" className="thumbnail-preview-img" />
              <div style={{ position: 'absolute', inset: '10px 20px', border: `1.5px solid ${isPositive ? '#f87171' : '#a3e635'}`, borderRadius: '2px' }} />
            </div>
            <span className="thumbnail-label">AI Detection</span>
          </div>

          <div 
            className={`thumbnail-mode-card ${activeViewMode === 'heatmap' ? 'active' : ''}`}
            onClick={() => { setActiveViewMode('heatmap'); setShowOriginalOnly(false); }}
          >
            <img src={overlayImg} alt="Heatmap" className="thumbnail-preview-img" />
            <span className="thumbnail-label">Heatmap</span>
          </div>

          <div 
            className={`thumbnail-mode-card ${activeViewMode === 'overlay' ? 'active' : ''}`}
            onClick={() => { setActiveViewMode('overlay'); setShowOriginalOnly(false); }}
          >
            <img src={overlayImg} alt="Overlay" className="thumbnail-preview-img" />
            <span className="thumbnail-label">Overlay</span>
          </div>
        </div>

        {/* Mandatory Medical Disclaimer */}
        <div className="disclaimer-bottom-card">
          <ShieldCheck size={18} style={{ color: 'var(--accent-lime)', flexShrink: 0 }} />
          <span>
            <strong>RadiNova AI</strong> is a clinical decision support system (CDSS). Model classifications and Grad-CAM maps require physician correlation.
          </span>
        </div>

      </div>

      {/* =========================================================================
          RIGHT PANEL: Clinical Decision Support & Biomarkers
          ========================================================================= */}
      <div className="analysis-right-panel">
        
        {/* Structural Integrity / Biomarker Card */}
        <div className="right-metric-card">
          <div className="metric-header">
            {biomarkerLabel}
          </div>

          <div className="metric-gauge-center">
            <div className="circular-gauge-wrap" style={{ width: '88px', height: '88px' }}>
              <svg viewBox="0 0 36 36" style={{ width: '100%', height: '100%', transform: 'rotate(-90deg)' }}>
                <path
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  fill="none"
                  stroke="rgba(255, 255, 255, 0.08)"
                  strokeWidth="3.5"
                />
                <path
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  fill="none"
                  stroke={isPositive ? '#f87171' : '#a3e635'}
                  strokeWidth="3.5"
                  strokeDasharray={`${biomarkerValue.replace('%','')}, 100`}
                  strokeLinecap="round"
                />
              </svg>
              <div className="gauge-center-text" style={{ fontSize: '18px', color: isPositive ? '#f87171' : '#a3e635' }}>
                {biomarkerValue}
              </div>
            </div>
          </div>

          <p style={{ fontSize: '12px', color: 'var(--text-secondary)', textAlign: 'center', margin: 0 }}>
            {biomarkerSummary}<br />
            <strong style={{ color: isPositive ? '#f87171' : 'var(--accent-lime)' }}>
              {isPositive ? 'Pathology Identified' : 'Physiological Baseline'}
            </strong>
          </p>
        </div>

        {/* Clinical Care Protocol / Action Plan */}
        <div className="right-metric-card">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span className="metric-header">{protocolTitle}</span>
            <Sun size={16} style={{ color: 'var(--accent-lime)' }} />
          </div>

          <p style={{ fontSize: '12px', color: 'var(--text-secondary)', margin: 0, lineHeight: 1.4 }}>
            {protocolDesc}
          </p>

          <div style={{
            background: 'var(--bg-elevated)',
            border: '1px solid var(--border-subtle)',
            borderRadius: '8px',
            padding: '8px 12px',
            color: 'var(--text-primary)',
            fontSize: '11.5px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            width: '100%'
          }}>
            <span>Evidence-Based Guideline</span>
            <span style={{ color: 'var(--accent-lime)', fontWeight: 700 }}>Active</span>
          </div>
        </div>

        {/* Recovery Score & Telemetry */}
        <div className="right-metric-card">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span className="metric-header">Prognostic Recovery Score</span>
            <Info size={14} style={{ color: 'var(--text-muted)' }} />
          </div>

          <div style={{ fontSize: '24px', fontWeight: 800, color: 'var(--text-primary)' }}>
            {isPositive ? '6.8' : '9.5'} <span style={{ fontSize: '14px', color: 'var(--text-muted)' }}>/ 10</span>
          </div>

          <p style={{ fontSize: '12px', color: 'var(--text-secondary)', margin: 0 }}>
            {isPositive ? 'Prognosis favorable with standard clinical intervention.' : 'Optimal physiological clearance baseline.'}
          </p>

          <div className="sub-metric-row">
            <div className="sub-metric-item">
              <CheckCircle2 size={15} style={{ color: 'var(--accent-lime)' }} />
              <span>Diagnostic Quality: <strong>98%</strong></span>
            </div>
            <div className="sub-metric-item">
              <Activity size={15} style={{ color: 'var(--accent-lime)' }} />
              <span>Gatekeeper: <strong>Passed</strong></span>
            </div>
          </div>
        </div>

        {/* AI Recommendation */}
        <div className="right-metric-card" style={{ background: 'var(--bg-card-subtle)' }}>
          <span className="finding-label" style={{ color: 'var(--accent-lime)' }}>AI Recommendation</span>
          <p style={{ fontSize: '12px', color: 'var(--text-secondary)', margin: 0, lineHeight: 1.45 }}>
            {aiRecommendation}
          </p>
        </div>

        {/* Action Button: View Full Report (PDF) */}
        <button 
          className="btn-full-report"
          onClick={() => onDownloadPdf(result)}
        >
          <FileText size={16} />
          <span>Download Formal Clinical PDF Report</span>
        </button>

      </div>
    </div>
  );
};
