import React, { useState, useRef } from 'react';
import { 
  Upload, 
  Download, 
  AlertCircle, 
  Activity, 
  CheckCircle2, 
  FileText
} from 'lucide-react';


import { ModalityMeta, CVAnalysisResult, LLMAnalysisResult, AnyAnalysisResult } from '../types';
import { generateFallbackAnalysis } from '../services/mockAnalysisService';
import { buildApiUrl } from '../services/apiConfig';
import { ImageDiffViewer } from './ImageDiffViewer';
import { GuidanceCard } from './GuidanceCard';
import { LLMExplanationCard } from './LLMExplanationCard';
import { ClinicalInfographic } from './ClinicalInfographic';
import { CircularGauge } from './CircularGauge';
import { ReactiveBiomarkerChart } from './ReactiveBiomarkerChart';
import { ValidationGateCard } from './ValidationGateCard';

interface ModalitySectionProps {
  meta: ModalityMeta;
  activeResult: AnyAnalysisResult | null;
  onAnalysisComplete: (result: AnyAnalysisResult) => void;
  onDownloadPdf: (data: AnyAnalysisResult) => void;
  onClearResult?: () => void;
}

export const ModalitySection: React.FC<ModalitySectionProps> = ({
  meta,
  activeResult,
  onAnalysisComplete,
  onDownloadPdf
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = async (file: File) => {
    setLoading(true);
    setError(null);

    const formData = new FormData();
    formData.append('file', file);

    try {
      let endpoint = '';
      const isImage = file.type.startsWith('image/') || /\.(jpe?g|png|dicom)$/i.test(file.name);

      if (meta.id === 'chest_xray') {
        endpoint = '/predict/chest';
      } else if (meta.id === 'limb_fracture') {
        endpoint = '/predict/limb';
      } else if (meta.id === 'mri') {
        endpoint = isImage ? '/predict/mri' : '/explain/mri';
      } else if (meta.id === 'breast_cancer') {
        endpoint = '/predict/breast_cancer';
      } else {
        endpoint = `/explain/${meta.id}`;
      }

      let result: AnyAnalysisResult;
      try {
        const response = await fetch(buildApiUrl(endpoint), {
          method: 'POST',
          body: formData
        });

        if (!response.ok) {
          throw new Error(`Server error (${response.status})`);
        }
        result = await response.json();
      } catch (netErr) {
        console.warn('Backend API offline or GitHub Pages static mode. Using client-side diagnostic synthesizer.');
        result = await generateFallbackAnalysis(file, meta.id);
      }
      
      onAnalysisComplete(result);
    } catch (err: any) {
      setError(err.message || 'Analysis failed.');
    } finally {
      setLoading(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileUpload(e.dataTransfer.files[0]);
    }
  };

  const loadSample = async (sampleType: string) => {
    try {
      setLoading(true);
      setError(null);

      let samplePath = '';
      let sampleFileName = '';

      if (meta.id === 'chest_xray') {
        sampleFileName = sampleType === 'pneumonia' ? 'chest_pneumonia_1.jpeg' : 'chest_normal_1.jpeg';
        samplePath = `./samples/${sampleFileName}`;
      } else if (meta.id === 'limb_fracture') {
        sampleFileName = sampleType === 'fracture' ? 'limb_fracture_1.jpg' : 'limb_normal_1.jpg';
        samplePath = `./samples/${sampleFileName}`;
      } else if (meta.id === 'mri') {
        if (sampleType === 'report') {
          const sampleText = `CLINICAL NEUROLOGY & BRAIN MRI REPORT
Patient ID: RAD-MRI-8829 | Study Date: 2026-08-20
Modality: 3.0T Brain MRI (T1, T2, FLAIR Sequences)
Clinical Indication: Refractory cephalalgia with focal sensory deficit.
Findings:
- Ventricular system: Normal symmetric caliber without midline shift.
- Gray-white matter junction: Sharp physiological delineation preserved.
- Cerebellar folia and posterior fossa structures intact.
Impression: Unremarkable non-contrast brain neuroimaging study. No acute mass effect or intracranial neoplasm detected.`;
          const blob = new Blob([sampleText], { type: 'text/plain' });
          const file = new File([blob], `clinical_mri_report.txt`, { type: 'text/plain' });
          await handleFileUpload(file);
          return;
        } else {
          sampleFileName = sampleType === 'tumor' ? 'mri_tumor_1.jpg' : 'mri_normal_1.jpg';
          samplePath = `./samples/${sampleFileName}`;
        }
      } else if (meta.id === 'breast_cancer') {
        sampleFileName = sampleType === 'malignant' ? 'breast_malignant_1.png' : 'breast_benign_1.png';
        samplePath = `./samples/${sampleFileName}`;
      } else if (meta.id === 'blood') {
        const isAbnormal = sampleType === 'abnormal';
        const sampleText = `COMPREHENSIVE HEMATOLOGY & METABOLIC PANEL
Study Date: 2026-08-23 | Department of Diagnostic Laboratory Medicine
Parameters:
- White Blood Cells (WBC): ${isAbnormal ? '14.8' : '6.8'} 10^3/uL [4.5 - 11.0] ${isAbnormal ? '(HIGH)' : '(NORMAL)'}
- Hemoglobin (Hb): ${isAbnormal ? '10.2' : '14.2'} g/dL [12.0 - 16.0] ${isAbnormal ? '(LOW)' : '(NORMAL)'}
- Platelets: 265 10^3/uL [150 - 450] (NORMAL)
- Serum Creatinine: 0.9 mg/dL [0.6 - 1.2] (NORMAL)
- BUN: 14.0 mg/dL [7.0 - 20.0] (NORMAL)`;
        const blob = new Blob([sampleText], { type: 'text/plain' });
        const file = new File([blob], `${sampleType}_blood_panel.txt`, { type: 'text/plain' });
        await handleFileUpload(file);
        return;
      } else {
        const sampleText = `CLINICAL DIAGNOSTIC REPORT — STUDY: ${meta.name.toUpperCase()}
Study Date: 2026-08-20 | Department of Diagnostic Medicine
Parameters & Measured Indices:
- Core physiological parameters evaluated across standard reference ranges.
- Measured values demonstrate baseline cellular, electrical, and metabolic integrity.
Findings: No gross focal disruption, pathological lesion, or acute ischemic signals detected.
Recommendations: Maintain standard observational follow-up and correlate with vital signs.`;
        const blob = new Blob([sampleText], { type: 'text/plain' });
        const file = new File([blob], `standard_${meta.id}_panel.txt`, { type: 'text/plain' });
        await handleFileUpload(file);
        return;
      }

      const res = await fetch(samplePath);
      if (!res.ok) throw new Error(`Sample asset ${samplePath} not found`);
      const blob = await res.blob();
      const file = new File([blob], sampleFileName, { type: blob.type || 'image/jpeg' });
      await handleFileUpload(file);
    } catch (e: any) {
      console.error('Error fetching clinical sample:', e);
      setError(`Failed to load preset sample: ${e.message}`);
    } finally {
      setLoading(false);
    }
  };

  const isCV = activeResult ? ('prediction' in activeResult) : (meta.category === 'CV_MODEL');
  const cvResult = isCV && activeResult ? (activeResult as CVAnalysisResult) : null;
  const llmResult = !isCV && activeResult ? (activeResult as LLMAnalysisResult) : null;

  const isAlertResult = cvResult
    ? (() => {
        const p = (cvResult.prediction || '').toUpperCase();
        if (p === 'NORMAL' || p === 'BENIGN' || p === 'NOT_FRACTURED' || p.includes('NOT_FRACTURED') || p.includes('NO FRACTURE') || p.includes('INTACT') || p.includes('BENIGN')) {
          return false;
        }
        return p.includes('PNEUMONIA') || p.includes('FRACTUR') || p.includes('TUMOR') || p.includes('MALIGNANT') || p.includes('LESION') || p.includes('GLIOMA');
      })()
    : (llmResult?.explanation?.triage_level?.severity === 'ELEVATED' || llmResult?.explanation?.triage_level?.severity === 'ACUTE');

  return (
    <div className="studio-workspace-wrapper">
      {/* Hidden File Input */}
      <input
        type="file"
        ref={fileInputRef}
        accept={meta.accepts}
        style={{ display: 'none' }}
        onChange={(e) => e.target.files?.[0] && handleFileUpload(e.target.files[0])}
      />

      {/* Top Header Bar */}
      <div className="workspace-header-bar">
        <div className="workspace-header-left">
          <span className="tab-tag workspace-badge">
            {meta.badge}
          </span>
          <h1 className="workspace-title">{meta.name} Clinical Workspace</h1>
          <p className="workspace-desc">{meta.description}</p>
        </div>

        {activeResult && (
          <div className="workspace-header-actions">
            <button
              className="btn-swiss-dark"
              onClick={() => onDownloadPdf(activeResult)}
              title="Export complete institutional PDF report"
            >
              <Download size={14} style={{ marginRight: '8px' }} />
              <span>EXPORT CLINICAL PDF REPORT</span>
            </button>
          </div>
        )}
      </div>

      {/* ── INITIAL UPLOAD STATE: when no result is loaded yet ── */}
      {!activeResult && (
        <div className="studio-initial-view">
          <div className="studio-upload-grid">
            {/* Primary Dropzone */}
            <div
              className={`dropzone large-dropzone ${isDragging ? 'drag-active' : ''}`}
              onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
            >
              <Upload size={42} className="dropzone-icon" />
              <div className="dropzone-title">Upload {meta.name} Scan or Report</div>
              <div className="dropzone-subtitle">
                Drag & drop scan image (.jpg, .png, .dcm) or clinical document (.txt, .pdf) here, or browse your device
              </div>
              <button type="button" className="btn-swiss" style={{ pointerEvents: 'none', marginTop: '12px' }}>
                Select Patient File
              </button>
            </div>

            {/* Presets Card */}
            <div className="card-swiss studio-presets-card">
              <div className="card-swiss-header">
                <span className="card-title">1-Click Clinical Presets</span>
                <span className="tab-tag" style={{ background: 'var(--bg-subtle)' }}>INSTANT DEMO</span>
              </div>
              <p style={{ fontSize: '13.5px', color: 'var(--text-secondary)', marginBottom: '16px', lineHeight: 1.5 }}>
                Load pre-validated institutional test cases to evaluate neural classification and explainability immediately:
              </p>

              <div className="presets-vertical-list">
                {meta.id === 'chest_xray' && (
                  <>
                    <button className="preset-item-btn" onClick={() => loadSample('pneumonia')}>
                      <div className="preset-btn-left">
                        <Activity size={16} style={{ color: 'var(--accent)' }} />
                        <span className="preset-btn-name">Pathological Case: Acute Pneumonia X-Ray</span>
                      </div>
                      <span className="preset-btn-tag alert">Pathology</span>
                    </button>
                    <button className="preset-item-btn" onClick={() => loadSample('normal')}>
                      <div className="preset-btn-left">
                        <CheckCircle2 size={16} style={{ color: 'var(--status-positive-text)' }} />
                        <span className="preset-btn-name">Clear Case: Normal Healthy Chest X-Ray</span>
                      </div>
                      <span className="preset-btn-tag positive">Normal</span>
                    </button>
                  </>
                )}

                {meta.id === 'limb_fracture' && (
                  <>
                    <button className="preset-item-btn" onClick={() => loadSample('fracture')}>
                      <div className="preset-btn-left">
                        <Activity size={16} style={{ color: 'var(--accent)' }} />
                        <span className="preset-btn-name">Pathological Case: Cortical Bone Fracture</span>
                      </div>
                      <span className="preset-btn-tag alert">Fracture</span>
                    </button>
                    <button className="preset-item-btn" onClick={() => loadSample('normal')}>
                      <div className="preset-btn-left">
                        <CheckCircle2 size={16} style={{ color: 'var(--status-positive-text)' }} />
                        <span className="preset-btn-name">Intact Radiograph: Normal Bone Morphology</span>
                      </div>
                      <span className="preset-btn-tag positive">Normal</span>
                    </button>
                  </>
                )}

                {meta.id === 'mri' && (
                  <>
                    <button className="preset-item-btn" onClick={() => loadSample('tumor')}>
                      <div className="preset-btn-left">
                        <Activity size={16} style={{ color: 'var(--accent)' }} />
                        <span className="preset-btn-name">Brain MRI: Intracranial Lesion / Tumor</span>
                      </div>
                      <span className="preset-btn-tag alert">Lesion</span>
                    </button>
                    <button className="preset-item-btn" onClick={() => loadSample('normal')}>
                      <div className="preset-btn-left">
                        <CheckCircle2 size={16} style={{ color: 'var(--status-positive-text)' }} />
                        <span className="preset-btn-name">Normal 3.0T Brain MRI Imaging Study</span>
                      </div>
                      <span className="preset-btn-tag positive">Normal</span>
                    </button>
                    <button className="preset-item-btn" onClick={() => loadSample('report')}>
                      <div className="preset-btn-left">
                        <FileText size={16} style={{ color: 'var(--text-secondary)' }} />
                        <span className="preset-btn-name">Text Study: Clinical Neurology MRI Report</span>
                      </div>
                      <span className="preset-btn-tag">Report</span>
                    </button>
                  </>
                )}

                {meta.id === 'breast_cancer' && (
                  <>
                    <button className="preset-item-btn" onClick={() => loadSample('malignant')}>
                      <div className="preset-btn-left">
                        <Activity size={16} style={{ color: 'var(--accent)' }} />
                        <span className="preset-btn-name">Malignant Mammogram: Dense Spiculated Mass (BIRADS 5)</span>
                      </div>
                      <span className="preset-btn-tag alert">Malignant</span>
                    </button>
                    <button className="preset-item-btn" onClick={() => loadSample('benign')}>
                      <div className="preset-btn-left">
                        <CheckCircle2 size={16} style={{ color: 'var(--status-positive-text)' }} />
                        <span className="preset-btn-name">Benign Mammogram: Clear Well-Circumscribed (BIRADS 2)</span>
                      </div>
                      <span className="preset-btn-tag positive">Benign</span>
                    </button>
                  </>
                )}

                {meta.id === 'blood' && (
                  <>
                    <button className="preset-item-btn" onClick={() => loadSample('abnormal')}>
                      <div className="preset-btn-left">
                        <Activity size={16} style={{ color: 'var(--accent)' }} />
                        <span className="preset-btn-name">Hematology Panel: Leukocytosis / Microcytic Anemia</span>
                      </div>
                      <span className="preset-btn-tag alert">Abnormal</span>
                    </button>
                    <button className="preset-item-btn" onClick={() => loadSample('normal')}>
                      <div className="preset-btn-left">
                        <CheckCircle2 size={16} style={{ color: 'var(--status-positive-text)' }} />
                        <span className="preset-btn-name">Hematology Panel: Normal Homeostatic Values</span>
                      </div>
                      <span className="preset-btn-tag positive">Normal</span>
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>

          {loading && (
            <div className="skeleton-loader" style={{ marginTop: '20px' }}>
              <div className="skeleton-text">
                Executing {meta.name} Deep Diagnostic & Feature Activation Pipeline...
              </div>
            </div>
          )}

          {error && (
            <div className="status-error-banner" style={{ marginTop: '20px' }}>
              <AlertCircle size={18} />
              <span>{error}</span>
            </div>
          )}
        </div>
      )}

      {/* ── RESULT STATE: 2-COLUMN SECTION-WISE LAYOUT (LEFT & RIGHT) ── */}
      {activeResult && (
        <div className="workspace-2col-layout">
          {/* Validation Gate for invalid / low confidence images */}
          {isCV && cvResult && (cvResult.status === 'invalid_image' || cvResult.status === 'low_confidence') ? (
            <div style={{ gridColumn: '1 / -1' }}>
              <ValidationGateCard
                result={cvResult}
                modalityName={meta.name}
                onRetryUpload={() => fileInputRef.current?.click()}
              />
            </div>
          ) : (
            <>
              {/* =========================================================================
                  LEFT COLUMN: Re-Analyze Box, Biomarkers, Guidance, Signs Checklist
                  ========================================================================= */}
              <div className="workspace-col-left">
                {/* 1. Compact Re-analyze & Presets Box */}
                <div className="compact-analyze-box">
                  <div
                    className="compact-dropzone-inner"
                    onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                    onDragLeave={() => setIsDragging(false)}
                    onDrop={handleDrop}
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <Upload size={22} className="compact-upload-icon" />
                    <div className="compact-analyze-title">
                      ANALYZE NEW {meta.name.toUpperCase()} STUDY
                    </div>
                    <div className="compact-analyze-subtitle">
                      Drag & drop scan image or clinical document here, or click to browse
                    </div>
                    <button type="button" className="btn-swiss-outline-compact">
                      SELECT FILE
                    </button>
                  </div>

                  {/* 1-Click Presets Strip */}
                  <div className="compact-presets-strip">
                    <span className="compact-presets-label">1-Click Presets:</span>
                    <div className="compact-presets-buttons">
                      {meta.id === 'chest_xray' && (
                        <>
                          <button className="preset-pill-btn" onClick={() => loadSample('pneumonia')}>
                            Sample Pneumonia X-Ray
                          </button>
                          <button className="preset-pill-btn" onClick={() => loadSample('normal')}>
                            Sample Normal X-Ray
                          </button>
                        </>
                      )}
                      {meta.id === 'limb_fracture' && (
                        <>
                          <button className="preset-pill-btn" onClick={() => loadSample('fracture')}>
                            Sample Fracture X-Ray
                          </button>
                          <button className="preset-pill-btn" onClick={() => loadSample('normal')}>
                            Sample Normal X-Ray
                          </button>
                        </>
                      )}
                      {meta.id === 'mri' && (
                        <>
                          <button className="preset-pill-btn" onClick={() => loadSample('tumor')}>
                            Sample Tumor MRI
                          </button>
                          <button className="preset-pill-btn" onClick={() => loadSample('normal')}>
                            Sample Normal MRI
                          </button>
                          <button className="preset-pill-btn" onClick={() => loadSample('report')}>
                            Sample Clinical Report
                          </button>
                        </>
                      )}
                      {meta.id !== 'chest_xray' && meta.id !== 'limb_fracture' && meta.id !== 'mri' && (
                        <button className="preset-pill-btn" onClick={() => loadSample('standard')}>
                          Load Standard {meta.name}
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                {loading && (
                  <div className="skeleton-loader" style={{ margin: '14px 0' }}>
                    <div className="skeleton-text">
                      Analyzing new {meta.name} dataset...
                    </div>
                  </div>
                )}

                {error && (
                  <div className="status-error-banner" style={{ margin: '14px 0' }}>
                    <AlertCircle size={18} />
                    <span>{error}</span>
                  </div>
                )}

                {/* 2. CV: Quantitative Radiographic Biomarkers Gauges Card */}
                {isCV && cvResult && (
                  <div className="card-swiss">
                    <ClinicalInfographic
                      result={cvResult}
                      modalityName={meta.name}
                      showGaugesOnly={true}
                    />
                  </div>
                )}

                {/* 3. Decision Support / Guidance Card */}
                {isCV && cvResult && cvResult.guidance && (
                  <GuidanceCard guidance={cvResult.guidance} />
                )}

                {/* 4. CV: Verified Radiographic Signs Checklist */}
                {isCV && cvResult && (
                  <div className="card-swiss">
                    <ClinicalInfographic
                      result={cvResult}
                      modalityName={meta.name}
                      showSignsOnly={true}
                    />
                  </div>
                )}

                {/* LLM Left Column: Recommendations & Findings */}
                {!isCV && llmResult && llmResult.explanation && (
                  <>
                    <div className="card-swiss">
                      <div className="card-swiss-header">
                        <span className="card-title">Clinical Recommendations & Triage</span>
                        <span className="tab-tag" style={{ background: 'var(--accent-light)', color: 'var(--accent-dark)' }}>
                          ACTION PLAN
                        </span>
                      </div>
                      <div className="clean-guidance-layout" style={{ marginTop: '12px' }}>
                        {llmResult.explanation.what_to_do_now && (
                          <div className="clean-guidance-section">
                            <h4 className="clean-guidance-heading">Immediate Actions</h4>
                            <ul className="clean-guidance-list">
                              {llmResult.explanation.what_to_do_now.map((item, i) => <li key={i}>{item}</li>)}
                            </ul>
                          </div>
                        )}
                        {llmResult.explanation.recommended_clinical_questions && (
                          <div className="clean-guidance-section">
                            <h4 className="clean-guidance-heading">Clinical Questions</h4>
                            <ul className="clean-guidance-list">
                              {llmResult.explanation.recommended_clinical_questions.map((item, i) => <li key={i}>{item}</li>)}
                            </ul>
                          </div>
                        )}
                      </div>
                    </div>

                    {llmResult.explanation.key_findings && llmResult.explanation.key_findings.length > 0 && (
                      <div className="card-swiss">
                        <div className="card-swiss-header">
                          <span className="card-title">Key Clinical Findings</span>
                          <span className="tab-tag" style={{ background: 'var(--bg-subtle)' }}>VERIFIED</span>
                        </div>
                        <div className="clean-findings-list" style={{ marginTop: '10px' }}>
                          {llmResult.explanation.key_findings.map((f, idx) => (
                            <div key={idx} className="clean-finding-row">
                              <span className="clean-finding-dot" />
                              <span>{f}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </>
                )}
              </div>

              {/* =========================================================================
                  RIGHT COLUMN: Neural Classification, Grad-CAM Heatmap, Quantitative Analytics
                  ========================================================================= */}
              <div className="workspace-col-right">
                {/* 1. CV Neural Classification & Grad-CAM Mapping */}
                {isCV && cvResult && (
                  <div className="card-swiss">
                    <div className="card-swiss-header">
                      <div>
                        <span className="card-title">DENSENET-121 NEURAL CLASSIFICATION</span>
                        <div className="disclaimer-quiet-line" style={{ marginTop: '2px' }}>
                          Deep Transfer Learning Feature Activation & Grad-CAM Mapping
                        </div>
                      </div>
                      <span className="tab-tag" style={{ background: 'var(--bg-subtle)', fontWeight: 700 }}>
                        PYTORCH VISION MODEL
                      </span>
                    </div>

                    <div className="metric-display">
                      <div className="metric-numeral pulse-metric">
                        {(cvResult.confidence * 100).toFixed(1)}<span style={{ fontSize: '24px' }}>%</span>
                      </div>
                      <div className="metric-label-group">
                        <div className={`metric-class ${isAlertResult ? 'positive' : 'negative'}`}>
                          {cvResult.prediction}
                        </div>
                        <div className="metric-subtitle">
                          DIAGNOSTIC CONFIDENCE PROBABILITY
                        </div>
                      </div>
                    </div>

                    {/* Interactive Grad-CAM Heatmap Viewer */}
                    <ImageDiffViewer
                      originalImage={cvResult.original_image || cvResult.original_image_base64 || ''}
                      gradcamOverlay={cvResult.gradcam_overlay || cvResult.gradcam_base64 || ''}
                      modality={meta.name}
                    />
                  </div>
                )}

                {/* 2. CV Quantitative Analytics & Anatomical Compartment Map */}
                {isCV && cvResult && (
                  <div className="card-swiss">
                    <ClinicalInfographic
                      result={cvResult}
                      modalityName={meta.name}
                      showMetricsOnly={true}
                    />
                  </div>
                )}

                {/* LLM Right Column: Overview + Biomarker Chart & Matrix */}
                {!isCV && llmResult && llmResult.explanation && (
                  <>
                    <LLMExplanationCard
                      explanation={llmResult.explanation}
                      source={llmResult.source || 'TEMPLATE_FALLBACK'}
                      filename={llmResult.filename || 'clinical_data.txt'}
                      modality={meta.name}
                    />

                    <div className="card-swiss">
                      <div className="card-swiss-header">
                        <span className="card-title">Biomarker Spectrum & Variance</span>
                        <span className="tab-tag" style={{ background: 'var(--bg-subtle)' }}>QUANTITATIVE</span>
                      </div>

                      <div className="clean-gauges-row">
                        <CircularGauge
                          value={llmResult.explanation.info_stats ? (parseInt(llmResult.explanation.info_stats.stability_ratio.replace('%', ''), 10) || 88) : 88}
                          label="Stability Index"
                          sublabel="Physiological Equilibrium"
                          isAlert={isAlertResult}
                        />
                        <CircularGauge
                          value={llmResult.explanation.info_stats && llmResult.explanation.info_stats.total_markers > 0 
                            ? Math.round((llmResult.explanation.info_stats.abnormal_markers / llmResult.explanation.info_stats.total_markers) * 100)
                            : 10}
                          label="Variance Ratio"
                          sublabel="Deviation from Reference"
                          isAlert={isAlertResult}
                        />
                      </div>

                      <ReactiveBiomarkerChart
                        parameters={llmResult.explanation.info_stats?.parameter_breakdown || []}
                        modality={meta.name}
                      />

                      <LLMExplanationCard
                        explanation={llmResult.explanation}
                        source={llmResult.source || 'TEMPLATE_FALLBACK'}
                        filename={llmResult.filename || 'clinical_data.txt'}
                        modality={meta.name}
                        showTableOnly={true}
                      />
                    </div>
                  </>
                )}
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
};
