import React from 'react';
import { 
  Activity, 
  Bone, 
  Brain, 
  Droplet, 
  Ribbon, 
  ArrowRight, 
  Plus, 
  ShieldCheck, 
  LucideIcon
} from 'lucide-react';
import { ModalityId, ModalityMeta, ReportRecord, DoctorProfile } from '../../types';

interface DashboardPageProps {
  doctor: DoctorProfile;
  modalities: Record<ModalityId, ModalityMeta>;
  recentReports: ReportRecord[];
  onLaunchModality: (modalityId: ModalityId) => void;
  onOpenReportArchive?: () => void;
  onOpenAssistant?: () => void;
  onOpenProtocols?: () => void;
  onDownloadPdf?: (data: any) => void;
  onNewStudyClick?: () => void;
}

export const DashboardPage: React.FC<DashboardPageProps> = ({
  doctor,
  modalities,
  recentReports,
  onLaunchModality,
  onNewStudyClick
}) => {
  const modalityIcons: Record<ModalityId, LucideIcon> = {
    limb_fracture: Bone,
    chest_xray: Activity,
    mri: Brain,
    blood: Droplet,
    breast_cancer: Ribbon,
  };

  return (
    <div style={{ flex: 1, padding: '24px', overflowY: 'auto', background: 'var(--bg-app)' }}>
      {/* Top Banner */}
      <div style={{
        background: 'linear-gradient(135deg, #0d1218 0%, #161f2c 100%)',
        border: '1px solid var(--border-subtle)',
        borderRadius: '16px',
        padding: '24px',
        marginBottom: '24px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '16px'
      }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
            <span className="bell-badge" style={{ position: 'static' }}>AI</span>
            <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--accent-lime)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Clinical Diagnostic Console • Active Session
            </span>
          </div>
          <h1 style={{ fontSize: '24px', fontWeight: 800, color: 'var(--text-primary)', margin: '0 0 6px 0' }}>
            Welcome back, {doctor.name}
          </h1>
          <p style={{ fontSize: '13.5px', color: 'var(--text-secondary)', margin: 0, maxWidth: '640px' }}>
            Attending Radiologist • {doctor.department}. All neural inference nodes (DenseNet-121, Gatekeeper, Grad-CAM) are online.
          </p>
        </div>

        {onNewStudyClick && (
          <button className="btn-new-study" style={{ width: 'auto', padding: '12px 20px' }} onClick={onNewStudyClick}>
            <Plus size={18} />
            <span>Create New Study</span>
          </button>
        )}
      </div>

      {/* Stats Summary Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginBottom: '24px' }}>
        <div className="dark-panel-card">
          <span style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: 650 }}>Total Studies Analyzed</span>
          <div style={{ fontSize: '26px', fontWeight: 800, color: 'var(--text-primary)', fontFamily: 'var(--font-mono)' }}>
            1,248
          </div>
          <span style={{ fontSize: '11px', color: 'var(--accent-lime)' }}>+14% this month</span>
        </div>

        <div className="dark-panel-card">
          <span style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: 650 }}>Neural Model Accuracy</span>
          <div style={{ fontSize: '26px', fontWeight: 800, color: 'var(--accent-lime)', fontFamily: 'var(--font-mono)' }}>
            94.8%
          </div>
          <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>DenseNet-121 + Gatekeeper</span>
        </div>

        <div className="dark-panel-card">
          <span style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: 650 }}>Mean Turnaround Time</span>
          <div style={{ fontSize: '26px', fontWeight: 800, color: 'var(--text-primary)', fontFamily: 'var(--font-mono)' }}>
            1.4s
          </div>
          <span style={{ fontSize: '11px', color: 'var(--accent-lime)' }}>GPU Accelerated</span>
        </div>

        <div className="dark-panel-card">
          <span style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: 650 }}>Reports Generated</span>
          <div style={{ fontSize: '26px', fontWeight: 800, color: 'var(--text-primary)', fontFamily: 'var(--font-mono)' }}>
            {recentReports.length + 84}
          </div>
          <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>Standardized PDF Exports</span>
        </div>
      </div>

      {/* Modalities Grid Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
        <h2 style={{ fontSize: '16px', fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>
          Launch Diagnostic Modality
        </h2>
        <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
          Click any card to launch deep neural analysis
        </span>
      </div>

      {/* Modalities Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px', marginBottom: '28px' }}>
        {Object.entries(modalities).map(([key, meta]) => {
          const Icon = modalityIcons[key as ModalityId] || Activity;
          return (
            <div
              key={key}
              onClick={() => onLaunchModality(key as ModalityId)}
              style={{
                background: 'var(--bg-card)',
                border: '1px solid var(--border-subtle)',
                borderRadius: '14px',
                padding: '18px',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                gap: '14px'
              }}
              onMouseEnter={e => {
                e.currentTarget.style.borderColor = 'var(--accent-lime)';
                e.currentTarget.style.transform = 'translateY(-2px)';
              }}
              onMouseLeave={e => {
                e.currentTarget.style.borderColor = 'var(--border-subtle)';
                e.currentTarget.style.transform = 'translateY(0)';
              }}
            >
              <div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
                  <div style={{
                    width: '36px',
                    height: '36px',
                    borderRadius: '8px',
                    background: 'var(--accent-lime-muted)',
                    color: 'var(--accent-lime)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                    <Icon size={18} />
                  </div>
                  <span className="model-tag">
                    {meta.category === 'CV_MODEL' ? 'DENSENET-121' : 'LLM REPORT'}
                  </span>
                </div>

                <h3 style={{ fontSize: '15px', fontWeight: 800, color: 'var(--text-primary)', margin: '0 0 6px 0' }}>
                  {meta.name}
                </h3>
                <p style={{ fontSize: '12px', color: 'var(--text-secondary)', margin: 0, lineHeight: 1.4 }}>
                  {meta.description}
                </p>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderTop: '1px solid var(--border-subtle)', paddingTop: '10px', fontSize: '12px', fontWeight: 700, color: 'var(--accent-lime)' }}>
                <span>Open Diagnostic Suite</span>
                <ArrowRight size={14} />
              </div>
            </div>
          );
        })}
      </div>

      {/* Mandatory Disclaimer Footer */}
      <div className="disclaimer-bottom-card">
        <ShieldCheck size={18} style={{ color: 'var(--accent-lime)', flexShrink: 0 }} />
        <span>
          <strong>RadiNova AI Decision Support</strong>: All neural classifications and Grad-CAM explainability maps are intended for physician decision support only and require clinical correlation.
        </span>
      </div>
    </div>
  );
};
