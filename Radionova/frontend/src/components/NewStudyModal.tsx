import React, { useState, useRef } from 'react';
import { 
  X, 
  Upload, 
  Activity, 
  Bone, 
  Brain, 
  Droplet, 
  Sparkles,
  CheckCircle2,
  AlertCircle,
  Ribbon
} from 'lucide-react';
import { ModalityId, AnyAnalysisResult } from '../types';
import { generateFallbackAnalysis } from '../services/mockAnalysisService';
import { buildApiUrl } from '../services/apiConfig';

interface NewStudyModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAnalysisSuccess: (result: AnyAnalysisResult, modality: ModalityId) => void;
  defaultModality?: ModalityId;
}

const MODALITY_OPTIONS: { 
  id: ModalityId; 
  name: string; 
  shortName: string; 
  icon: any; 
  type: string; 
  accepts: string;
  description: string;
  samplePacks: { label: string; file: string; type: string }[];
}[] = [
  { 
    id: 'chest_xray', 
    name: 'Chest Radiograph (X-Ray)', 
    shortName: 'Chest X-Ray', 
    icon: Activity, 
    type: 'DenseNet-121 Vision',
    accepts: 'image/*',
    description: 'Thoracic pulmonary consolidation & pneumonia detection with Grad-CAM',
    samplePacks: [
      { label: 'Chest Pneumonia Sample', file: '/samples/chest_pneumonia_1.jpeg', type: 'image/jpeg' },
      { label: 'Chest Normal Sample', file: '/samples/chest_normal_1.jpeg', type: 'image/jpeg' }
    ]
  },
  { 
    id: 'limb_fracture', 
    name: 'Limb Radiograph (X-Ray)', 
    shortName: 'Limb Fracture', 
    icon: Bone, 
    type: 'DenseNet-121 Vision',
    accepts: 'image/*',
    description: 'Osseous disruption & extremity bone fracture detection with Gatekeeper',
    samplePacks: [
      { label: 'Wrist Fracture Sample', file: '/samples/limb_fracture_1.jpg', type: 'image/jpeg' },
      { label: 'Limb Normal Sample', file: '/samples/limb_normal_1.jpg', type: 'image/jpeg' }
    ]
  },
  { 
    id: 'mri', 
    name: 'Brain MRI Scan', 
    shortName: 'Brain MRI', 
    icon: Brain, 
    type: 'DenseNet-121 Neuro',
    accepts: 'image/*,.pdf,.txt',
    description: 'Neuroimaging focal lesion, tumor, and mass effect analysis',
    samplePacks: [
      { label: 'Brain Tumor MRI Sample', file: '/samples/mri_tumor_1.jpg', type: 'image/jpeg' },
      { label: 'Normal Brain MRI Sample', file: '/samples/mri_normal_1.jpg', type: 'image/jpeg' }
    ]
  },
  { 
    id: 'blood', 
    name: 'Hematology Panel', 
    shortName: 'Blood Panel', 
    icon: Droplet, 
    type: 'Biomarker Lab',
    accepts: '.txt,.pdf,image/*',
    description: 'Complete blood count (CBC) & metabolic panel biomarker variance with dual doctor/patient view',
    samplePacks: []
  },
  { 
    id: 'breast_cancer', 
    name: 'Breast Cancer Screening', 
    shortName: 'Breast Cancer', 
    icon: Ribbon, 
    type: 'DenseNet-121 Mammography',
    accepts: 'image/*',
    description: 'Mammographic mass, malignancy & BIRADS classification with Grad-CAM localization',
    samplePacks: []
  },
];

export const NewStudyModal: React.FC<NewStudyModalProps> = ({
  isOpen,
  onClose,
  onAnalysisSuccess,
  defaultModality = 'chest_xray'
}) => {
  const [selectedModality, setSelectedModality] = useState<ModalityId>(defaultModality);
  const [patientName, setPatientName] = useState('Eleanor Vance');
  const [patientId, setPatientId] = useState('RN-2026-00142');
  const [loading, setLoading] = useState(false);
  const [activeModelLoadingText, setActiveModelLoadingText] = useState('');
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Sync selectedModality when modal opens or defaultModality changes
  React.useEffect(() => {
    if (isOpen) {
      setSelectedModality(defaultModality);
      setError(null);
    }
  }, [isOpen, defaultModality]);

  if (!isOpen) return null;

  const currentOption = MODALITY_OPTIONS.find(o => o.id === selectedModality) || MODALITY_OPTIONS[0];

  const handleFileUpload = async (file: File, targetModality: ModalityId = selectedModality) => {
    setLoading(true);
    setError(null);

    const modalityObj = MODALITY_OPTIONS.find(o => o.id === targetModality) || currentOption;
    setActiveModelLoadingText(`Analyzing with ${modalityObj.shortName} ${modalityObj.type}...`);

    const formData = new FormData();
    formData.append('file', file);
    formData.append('patient_name', patientName);
    formData.append('patient_id', patientId);

    try {
      let endpoint = '';
      const isImage = file.type.startsWith('image/') || /\.(jpe?g|png|dicom)$/i.test(file.name);

      if (targetModality === 'chest_xray') {
        endpoint = '/api/v1/analysis/chest';
      } else if (targetModality === 'limb_fracture') {
        endpoint = '/api/v1/analysis/fracture';
      } else if (targetModality === 'mri') {
        endpoint = isImage ? '/api/v1/analysis/mri_image' : '/explain/mri';
      } else if (targetModality === 'breast_cancer') {
        endpoint = '/api/v1/analysis/breast_cancer';
      } else {
        endpoint = `/explain/${targetModality}`;
      }

      let data: AnyAnalysisResult;
      try {
        const res = await fetch(buildApiUrl(endpoint), {
          method: 'POST',
          body: formData
        });

        if (!res.ok) {
          throw new Error(`Status ${res.status}`);
        }
        data = await res.json();
      } catch (networkOr405Err) {
        console.warn('Backend API offline or static GitHub Pages mode. Using client-side clinical analysis generator.');
        data = await generateFallbackAnalysis(file, targetModality, patientName, patientId);
      }
      
      // Inject patient details if missing
      data.patient_name = patientName;
      data.patient_id = patientId;
      data.modality = targetModality;

      onAnalysisSuccess(data, targetModality);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Analysis failed.');
    } finally {
      setLoading(false);
    }
  };

  const handleLoadSample = async (samplePath: string, targetModality: ModalityId, sampleName: string) => {
    setSelectedModality(targetModality);
    setLoading(true);
    setError(null);
    try {
      const sampleResp = await fetch(samplePath);
      if (!sampleResp.ok) throw new Error(`Could not fetch sample file from ${samplePath}`);
      const blob = await sampleResp.blob();
      const filename = samplePath.split('/').pop() || `${targetModality}_sample.jpg`;
      const file = new File([blob], filename, { type: blob.type || 'image/jpeg' });
      await handleFileUpload(file, targetModality);
    } catch (err: any) {
      setError(`Could not load sample ${sampleName}: ${err.message}`);
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-card" onClick={e => e.stopPropagation()} style={{ maxWidth: '580px', width: '92%' }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '2px' }}>
              <span className="bell-badge" style={{ position: 'static', padding: '1px 6px', fontSize: '10px' }}>STUDY</span>
              <h2 style={{ fontSize: '18px', fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>
                Create New Imaging Study
              </h2>
            </div>
            <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
              Select targeted modality to route scans to the corresponding specialized neural network
            </span>
          </div>
          <button 
            onClick={onClose}
            style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '4px' }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Patient Details Input */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '14px' }}>
          <div>
            <label style={{ fontSize: '11px', color: 'var(--text-secondary)', fontWeight: 700, display: 'block', marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Patient Full Name
            </label>
            <input
              type="text"
              value={patientName}
              onChange={e => setPatientName(e.target.value)}
              placeholder="e.g. Eleanor Vance"
              style={{
                width: '100%',
                background: 'var(--bg-card-subtle)',
                border: '1px solid var(--border-subtle)',
                borderRadius: '8px',
                padding: '8px 12px',
                color: 'var(--text-primary)',
                fontSize: '13px',
                outline: 'none'
              }}
            />
          </div>
          <div>
            <label style={{ fontSize: '11px', color: 'var(--text-secondary)', fontWeight: 700, display: 'block', marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Patient MRN / Study ID
            </label>
            <input
              type="text"
              value={patientId}
              onChange={e => setPatientId(e.target.value)}
              placeholder="e.g. RN-2026-00142"
              style={{
                width: '100%',
                background: 'var(--bg-card-subtle)',
                border: '1px solid var(--border-subtle)',
                borderRadius: '8px',
                padding: '8px 12px',
                color: 'var(--text-primary)',
                fontSize: '13px',
                outline: 'none'
              }}
            />
          </div>
        </div>

        {/* Modality Selector Grid */}
        <div style={{ marginBottom: '14px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
            <label style={{ fontSize: '11px', color: 'var(--text-secondary)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Diagnostic Modality & Target Model
            </label>
            <span style={{ fontSize: '11px', color: 'var(--accent-lime)', fontWeight: 700 }}>
              Active Model: {currentOption.type}
            </span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px' }}>
            {MODALITY_OPTIONS.map(opt => {
              const Icon = opt.icon;
              const isSel = selectedModality === opt.id;
              return (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => {
                    setSelectedModality(opt.id);
                    setError(null);
                  }}
                  style={{
                    background: isSel ? 'rgba(163, 230, 53, 0.12)' : 'var(--bg-card-subtle)',
                    border: `1.5px solid ${isSel ? 'var(--accent-lime)' : 'var(--border-subtle)'}`,
                    borderRadius: '10px',
                    padding: '10px 8px',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: '4px',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                    boxShadow: isSel ? '0 0 12px rgba(163, 230, 53, 0.2)' : 'none'
                  }}
                >
                  <Icon size={18} style={{ color: isSel ? 'var(--accent-lime)' : 'var(--text-secondary)' }} />
                  <span style={{ fontSize: '11.5px', fontWeight: 700, color: isSel ? 'var(--accent-lime)' : 'var(--text-primary)', textAlign: 'center' }}>
                    {opt.shortName}
                  </span>
                  <span style={{ fontSize: '9.5px', color: isSel ? 'var(--text-primary)' : 'var(--text-muted)', fontWeight: 600 }}>
                    {opt.type}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Upload Zone */}
        <div 
          onClick={() => fileInputRef.current?.click()}
          style={{
            border: '2px dashed var(--accent-lime)',
            borderRadius: '12px',
            padding: '20px 16px',
            textAlign: 'center',
            cursor: 'pointer',
            background: 'rgba(163, 230, 53, 0.03)',
            marginBottom: '14px',
            transition: 'border-color 0.2s ease'
          }}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept={currentOption.accepts}
            style={{ display: 'none' }}
            onChange={e => {
              if (e.target.files && e.target.files[0]) {
                handleFileUpload(e.target.files[0], selectedModality);
              }
            }}
          />
          <Upload size={26} style={{ color: 'var(--accent-lime)', margin: '0 auto 6px auto' }} />
          <p style={{ fontSize: '13.5px', fontWeight: 700, color: 'var(--text-primary)', margin: '0 0 3px 0' }}>
            Upload scan for <span style={{ color: 'var(--accent-lime)' }}>{currentOption.name}</span>
          </p>
          <span style={{ fontSize: '11.5px', color: 'var(--text-muted)' }}>
            Routes to <strong>{currentOption.type}</strong> • Supports DICOM, JPEG, PNG
          </span>
        </div>

        {/* Contextual Sample Buttons Based on Selected Modality */}
        <div>
          <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 700, marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
            Instant Sample Demonstrators ({currentOption.shortName}):
          </div>
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            {/* If Chest X-Ray */}
            {selectedModality === 'chest_xray' && (
              <>
                <button
                  type="button"
                  disabled={loading}
                  onClick={() => handleLoadSample('./samples/chest_pneumonia_1.jpeg', 'chest_xray', 'Pneumonia Chest')}
                  style={{
                    flex: 1,
                    background: 'var(--bg-elevated)',
                    border: '1px solid rgba(163, 230, 53, 0.4)',
                    borderRadius: '8px',
                    padding: '8px 10px',
                    color: 'var(--text-primary)',
                    fontSize: '12px',
                    fontWeight: 650,
                    cursor: loading ? 'not-allowed' : 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '6px'
                  }}
                >
                  <Sparkles size={14} style={{ color: 'var(--accent-lime)' }} />
                  <span>Load Pneumonia Chest Sample</span>
                </button>
                <button
                  type="button"
                  disabled={loading}
                  onClick={() => handleLoadSample('./samples/chest_normal_1.jpeg', 'chest_xray', 'Normal Chest')}
                  style={{
                    flex: 1,
                    background: 'var(--bg-elevated)',
                    border: '1px solid var(--border-subtle)',
                    borderRadius: '8px',
                    padding: '8px 10px',
                    color: 'var(--text-primary)',
                    fontSize: '12px',
                    fontWeight: 650,
                    cursor: loading ? 'not-allowed' : 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '6px'
                  }}
                >
                  <CheckCircle2 size={14} style={{ color: '#10b981' }} />
                  <span>Load Normal Chest Sample</span>
                </button>
              </>
            )}

            {/* If Limb Radiograph */}
            {selectedModality === 'limb_fracture' && (
              <>
                <button
                  type="button"
                  disabled={loading}
                  onClick={() => handleLoadSample('./samples/limb_fracture_1.jpg', 'limb_fracture', 'Wrist Fracture')}
                  style={{
                    flex: 1,
                    background: 'var(--bg-elevated)',
                    border: '1px solid rgba(163, 230, 53, 0.4)',
                    borderRadius: '8px',
                    padding: '8px 10px',
                    color: 'var(--text-primary)',
                    fontSize: '12px',
                    fontWeight: 650,
                    cursor: loading ? 'not-allowed' : 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '6px'
                  }}
                >
                  <Sparkles size={14} style={{ color: 'var(--accent-lime)' }} />
                  <span>Load Wrist Fracture Sample</span>
                </button>
                <button
                  type="button"
                  disabled={loading}
                  onClick={() => handleLoadSample('./samples/limb_normal_1.jpg', 'limb_fracture', 'Normal Limb')}
                  style={{
                    flex: 1,
                    background: 'var(--bg-elevated)',
                    border: '1px solid var(--border-subtle)',
                    borderRadius: '8px',
                    padding: '8px 10px',
                    color: 'var(--text-primary)',
                    fontSize: '12px',
                    fontWeight: 650,
                    cursor: loading ? 'not-allowed' : 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '6px'
                  }}
                >
                  <CheckCircle2 size={14} style={{ color: '#10b981' }} />
                  <span>Load Normal Limb Sample</span>
                </button>
              </>
            )}

            {/* If Brain MRI */}
            {selectedModality === 'mri' && (
              <>
                <button
                  type="button"
                  disabled={loading}
                  onClick={() => handleLoadSample('./samples/mri_tumor_1.jpg', 'mri', 'Brain MRI Tumor')}
                  style={{
                    flex: 1,
                    background: 'var(--bg-elevated)',
                    border: '1px solid rgba(163, 230, 53, 0.4)',
                    borderRadius: '8px',
                    padding: '8px 10px',
                    color: 'var(--text-primary)',
                    fontSize: '12px',
                    fontWeight: 650,
                    cursor: loading ? 'not-allowed' : 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '6px'
                  }}
                >
                  <Sparkles size={14} style={{ color: 'var(--accent-lime)' }} />
                  <span>Load Brain Tumor Sample</span>
                </button>
                <button
                  type="button"
                  disabled={loading}
                  onClick={() => handleLoadSample('./samples/mri_normal_1.jpg', 'mri', 'Brain MRI Normal')}
                  style={{
                    flex: 1,
                    background: 'var(--bg-elevated)',
                    border: '1px solid var(--border-subtle)',
                    borderRadius: '8px',
                    padding: '8px 10px',
                    color: 'var(--text-primary)',
                    fontSize: '12px',
                    fontWeight: 650,
                    cursor: loading ? 'not-allowed' : 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '6px'
                  }}
                >
                  <CheckCircle2 size={14} style={{ color: '#10b981' }} />
                  <span>Load Normal MRI Sample</span>
                </button>
              </>
            )}

            {/* If Breast Cancer */}
            {selectedModality === 'breast_cancer' && (
              <>
                <button
                  type="button"
                  disabled={loading}
                  onClick={() => handleLoadSample('./samples/breast_malignant_1.png', 'breast_cancer', 'Malignant Mammogram')}
                  style={{
                    flex: 1,
                    background: 'var(--bg-elevated)',
                    border: '1px solid rgba(239, 68, 68, 0.4)',
                    borderRadius: '8px',
                    padding: '8px 10px',
                    color: 'var(--text-primary)',
                    fontSize: '12px',
                    fontWeight: 650,
                    cursor: loading ? 'not-allowed' : 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '6px'
                  }}
                >
                  <Sparkles size={14} style={{ color: '#f87171' }} />
                  <span>Load Malignant Mass Sample</span>
                </button>
                <button
                  type="button"
                  disabled={loading}
                  onClick={() => handleLoadSample('./samples/breast_benign_1.png', 'breast_cancer', 'Benign Mammogram')}
                  style={{
                    flex: 1,
                    background: 'var(--bg-elevated)',
                    border: '1px solid var(--border-subtle)',
                    borderRadius: '8px',
                    padding: '8px 10px',
                    color: 'var(--text-primary)',
                    fontSize: '12px',
                    fontWeight: 650,
                    cursor: loading ? 'not-allowed' : 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '6px'
                  }}
                >
                  <CheckCircle2 size={14} style={{ color: '#10b981' }} />
                  <span>Load Benign Mammogram Sample</span>
                </button>
              </>
            )}

            {/* If Blood Panel */}
            {selectedModality === 'blood' && (
              <>
                <button
                  type="button"
                  disabled={loading}
                  onClick={async () => {
                    const sampleText = `COMPREHENSIVE HEMATOLOGY & METABOLIC PANEL\nPatient ID: RN-2026-00142 | Study: Complete Blood Count\nWBC: 14.8 10^3/uL (High)\nHemoglobin: 10.2 g/dL (Low)\nPlatelets: 265 10^3/uL (Normal)\nSerum Creatinine: 0.9 mg/dL (Normal)\nBUN: 14.0 mg/dL (Normal)`;
                    const blob = new Blob([sampleText], { type: 'text/plain' });
                    const file = new File([blob], 'abnormal_cbc_panel.txt', { type: 'text/plain' });
                    await handleFileUpload(file, 'blood');
                  }}
                  style={{
                    flex: 1,
                    background: 'var(--bg-elevated)',
                    border: '1px solid rgba(239, 68, 68, 0.4)',
                    borderRadius: '8px',
                    padding: '8px 10px',
                    color: 'var(--text-primary)',
                    fontSize: '12px',
                    fontWeight: 650,
                    cursor: loading ? 'not-allowed' : 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '6px'
                  }}
                >
                  <Sparkles size={14} style={{ color: '#f87171' }} />
                  <span>Load Leukocytosis / Anemia Panel</span>
                </button>
                <button
                  type="button"
                  disabled={loading}
                  onClick={async () => {
                    const sampleText = `COMPREHENSIVE HEMATOLOGY & METABOLIC PANEL\nPatient ID: RN-2026-00142 | Study: Complete Blood Count\nWBC: 6.8 10^3/uL (Normal)\nHemoglobin: 14.2 g/dL (Normal)\nPlatelets: 245 10^3/uL (Normal)\nSerum Creatinine: 0.95 mg/dL (Normal)\nBUN: 14.0 mg/dL (Normal)`;
                    const blob = new Blob([sampleText], { type: 'text/plain' });
                    const file = new File([blob], 'normal_cbc_panel.txt', { type: 'text/plain' });
                    await handleFileUpload(file, 'blood');
                  }}
                  style={{
                    flex: 1,
                    background: 'var(--bg-elevated)',
                    border: '1px solid var(--border-subtle)',
                    borderRadius: '8px',
                    padding: '8px 10px',
                    color: 'var(--text-primary)',
                    fontSize: '12px',
                    fontWeight: 650,
                    cursor: loading ? 'not-allowed' : 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '6px'
                  }}
                >
                  <CheckCircle2 size={14} style={{ color: '#10b981' }} />
                  <span>Load Normal Blood Panel</span>
                </button>
              </>
            )}
          </div>
        </div>

        {loading && (
          <div style={{ marginTop: '14px', padding: '10px', background: 'rgba(163, 230, 53, 0.08)', borderRadius: '8px', textAlign: 'center', color: 'var(--accent-lime)', fontSize: '13px', fontWeight: 650, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
            <Activity size={16} className="animate-spin" />
            <span>{activeModelLoadingText || 'Analyzing with neural model & generating explainability heatmaps...'}</span>
          </div>
        )}

        {error && (
          <div style={{ marginTop: '14px', padding: '10px', background: 'rgba(239,68,68,0.1)', border: '1px solid #ef4444', borderRadius: '8px', color: '#ef4444', fontSize: '12.5px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <AlertCircle size={16} style={{ flexShrink: 0 }} />
            <span>{error}</span>
          </div>
        )}
      </div>
    </div>
  );
};
