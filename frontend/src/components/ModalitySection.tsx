import React, { useState, useRef } from 'react';
import { Upload, Download, AlertCircle } from 'lucide-react';
import { ModalityMeta, CVAnalysisResult, LLMAnalysisResult, AnyAnalysisResult } from '../types';
import { ImageDiffViewer } from './ImageDiffViewer';
import { GuidanceCard } from './GuidanceCard';
import { LLMExplanationCard } from './LLMExplanationCard';

interface ModalitySectionProps {
  meta: ModalityMeta;
  activeResult: AnyAnalysisResult | null;
  onAnalysisComplete: (result: AnyAnalysisResult) => void;
  onDownloadPdf: (data: AnyAnalysisResult) => void;
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
      if (meta.id === 'chest_xray') {
        endpoint = '/predict/chest';
      } else if (meta.id === 'limb_fracture') {
        endpoint = '/predict/limb';
      } else {
        endpoint = `/explain/${meta.id}`;
      }

      const response = await fetch(endpoint, {
        method: 'POST',
        body: formData
      });

      if (!response.ok) {
        const errJson = await response.json().catch(() => ({}));
        throw new Error(errJson.detail || `Server error (${response.status})`);
      }

      const result = await response.json();
      onAnalysisComplete(result);
    } catch (err: any) {
      setError(err.message || 'Analysis failed. Ensure the backend server is running.');
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
    // Generate synthetic sample file on the fly
    if (meta.category === 'CV_MODEL') {
      const canvas = document.createElement('canvas');
      canvas.width = 300;
      canvas.height = 300;
      const ctx = canvas.getContext('2d')!;
      
      // Draw background
      ctx.fillStyle = '#18181B';
      ctx.fillRect(0, 0, 300, 300);
      
      if (meta.id === 'chest_xray') {
        // Draw thoracic simulation
        ctx.strokeStyle = '#52525B';
        ctx.lineWidth = 4;
        ctx.strokeRect(30, 20, 240, 260);
        // Lungs
        ctx.fillStyle = '#27272A';
        ctx.beginPath();
        ctx.ellipse(90, 140, 45, 90, 0, 0, Math.PI * 2);
        ctx.ellipse(210, 140, 45, 90, 0, 0, Math.PI * 2);
        ctx.fill();
        // Infiltrate patch
        ctx.fillStyle = sampleType === 'pneumonia' ? '#A1A1AA' : '#3F3F46';
        ctx.beginPath();
        ctx.ellipse(210, 170, 30, 40, 0, 0, Math.PI * 2);
        ctx.fill();
      } else {
        // Limb bone fracture simulation
        ctx.strokeStyle = '#D4D4D8';
        ctx.lineWidth = 18;
        ctx.beginPath();
        ctx.moveTo(150, 40);
        ctx.lineTo(150, 260);
        ctx.stroke();
        if (sampleType === 'fracture') {
          // Radiolucent crack
          ctx.strokeStyle = '#09090B';
          ctx.lineWidth = 3;
          ctx.beginPath();
          ctx.moveTo(135, 145);
          ctx.lineTo(165, 155);
          ctx.stroke();
        }
      }

      canvas.toBlob((blob) => {
        if (blob) {
          const file = new File([blob], `sample_${meta.id}_${sampleType}.jpg`, { type: 'image/jpeg' });
          handleFileUpload(file);
        }
      }, 'image/jpeg');
    } else {
      // Text sample for Blood, MRI, ECG, CT
      const sampleText = `PATIENT CLINICAL REPORT — STUDY: ${meta.name.toUpperCase()}
Study Date: 2026-08-17
Parameters: Normal physiological sequence with standard reference intervals.
Findings: No focal pathology detected. Correlate with clinical symptoms.`;
      const blob = new Blob([sampleText], { type: 'text/plain' });
      const file = new File([blob], `sample_${meta.id}_study.txt`, { type: 'text/plain' });
      handleFileUpload(file);
    }
  };

  const isCV = meta.category === 'CV_MODEL';
  const cvResult = isCV ? (activeResult as CVAnalysisResult | null) : null;
  const llmResult = !isCV ? (activeResult as LLMAnalysisResult | null) : null;

  return (
    <div>
      {/* Modality Banner & Context */}
      <div style={{ marginBottom: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <span className="tab-tag" style={{ background: 'var(--text-primary)', color: '#FFF', border: 'none', marginBottom: '8px' }}>
            {meta.badge}
          </span>
          <h2 style={{ fontSize: '24px', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '-0.03em', marginTop: '4px' }}>
            {meta.name} Control Panel
          </h2>
          <p style={{ fontSize: '13px', color: 'var(--text-secondary)', maxWidth: '680px', marginTop: '4px' }}>
            {meta.description}
          </p>
        </div>

        {activeResult && (
          <button
            className="btn-swiss"
            onClick={() => onDownloadPdf(activeResult)}
            style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
          >
            <Download size={14} />
            Export Clinical PDF Report
          </button>
        )}
      </div>

      <div className="swiss-grid-12">
        {/* Left Column: Upload Dropzone & Quick Samples */}
        <div className={activeResult ? "col-span-5" : "col-span-12"}>
          <div
            className={`dropzone ${isDragging ? 'drag-active' : ''}`}
            onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
          >
            <input
              type="file"
              ref={fileInputRef}
              accept={meta.accepts}
              style={{ display: 'none' }}
              onChange={(e) => e.target.files?.[0] && handleFileUpload(e.target.files[0])}
            />

            <Upload size={36} className="dropzone-icon" />
            <div className="dropzone-title">Upload {meta.name} Study</div>
            <div className="dropzone-subtitle">
              Drag & drop radiograph, scan, or report document here, or click to browse
            </div>

            <button type="button" className="btn-swiss" style={{ pointerEvents: 'none' }}>
              Select File
            </button>
          </div>

          {/* Quick Demo Sample Preset Buttons */}
          <div className="sample-buttons">
            <span style={{ fontSize: '10px', fontWeight: 800, textTransform: 'uppercase', color: 'var(--text-muted)' }}>
              1-Click Demo Samples:
            </span>
            {meta.id === 'chest_xray' && (
              <>
                <button className="sample-btn" onClick={() => loadSample('pneumonia')}>Sample Pneumonia X-Ray</button>
                <button className="sample-btn" onClick={() => loadSample('normal')}>Sample Normal X-Ray</button>
              </>
            )}
            {meta.id === 'limb_fracture' && (
              <>
                <button className="sample-btn" onClick={() => loadSample('fracture')}>Sample Fracture Scan</button>
                <button className="sample-btn" onClick={() => loadSample('intact')}>Sample Intact Bone</button>
              </>
            )}
            {!isCV && (
              <button className="sample-btn" onClick={() => loadSample('standard')}>
                Load Standard {meta.name} Panel
              </button>
            )}
          </div>

          {loading && (
            <div style={{ marginTop: '16px', padding: '16px', background: 'var(--bg-subtle)', border: '1px solid var(--border-medium)', textAlign: 'center', fontSize: '12px', fontWeight: 700, textTransform: 'uppercase' }}>
              Executing {meta.name} Deep Learning / LLM Pipeline...
            </div>
          )}

          {error && (
            <div style={{ marginTop: '16px', padding: '14px', background: 'var(--status-alert-bg)', border: '1px solid var(--accent-light)', color: 'var(--status-alert-text)', fontSize: '12px' }}>
              <AlertCircle size={14} style={{ display: 'inline', marginRight: '6px' }} />
              {error}
            </div>
          )}
        </div>

        {/* Right Column: Dynamic Analysis Output & Explainability */}
        {activeResult && (
          <div className="col-span-7">
            {/* Computer Vision Result Layout (DenseNet-121 + Grad-CAM) */}
            {isCV && cvResult && (
              <div>
                <div className="card-swiss">
                  <div className="card-swiss-header">
                    <span className="card-title">DenseNet-121 Model Classification</span>
                    <span className="tab-tag" style={{ background: 'var(--bg-subtle)' }}>PYTORCH TRANSFER LEARNING</span>
                  </div>

                  <div className="metric-display">
                    <div className="metric-numeral">
                      {(cvResult.confidence * 100).toFixed(1)}<span style={{ fontSize: '28px' }}>%</span>
                    </div>
                    <div className="metric-label-group">
                      <div className={`metric-class ${cvResult.prediction.includes('PNEUMONIA') || cvResult.prediction.includes('FRACTURED') ? 'positive' : 'negative'}`}>
                        {cvResult.prediction}
                      </div>
                      <div className="metric-subtitle">
                        Confidence Probability Score
                      </div>
                    </div>
                  </div>

                  {/* Grad-CAM Heatmap Viewer */}
                  <ImageDiffViewer
                    originalImage={cvResult.original_image}
                    gradcamOverlay={cvResult.gradcam_overlay}
                    modality={meta.name}
                  />

                  {/* Evidence-Grounded Clinical Decision Support Rules */}
                  <GuidanceCard guidance={cvResult.guidance} />
                </div>
              </div>
            )}

            {/* LLM Modality Result Layout (Blood / MRI / ECG / CT) */}
            {!isCV && llmResult && (
              <div>
                <LLMExplanationCard
                  explanation={llmResult.explanation}
                  source={llmResult.source}
                  filename={llmResult.filename}
                  modality={meta.name}
                />
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
