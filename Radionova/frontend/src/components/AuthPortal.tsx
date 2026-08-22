import React, { useState } from 'react';
import { ArrowLeft, ArrowRight, Shield, Activity, CheckCircle2 } from 'lucide-react';
import { DoctorProfile } from '../types';

interface AuthPortalProps {
  onLogin: (doctor: DoctorProfile) => void;
  onOpenPatientPortal?: () => void;
  onBack?: () => void;
}

const PRESET_DOCTORS: DoctorProfile[] = [
  {
    id: 'DR-RAD-2201',
    name: 'Dr. Priya Sharma',
    email: 'p.sharma@radinova.health',
    role: 'Chief Radiologist',
    department: 'Dept. of Radiology & Imaging Sciences',
    licenseNumber: 'MCI-22018-DL',
    avatar: 'PS'
  },
  {
    id: 'DR-ORTHO-3384',
    name: 'Dr. Arjun Mehta',
    email: 'a.mehta@radinova.health',
    role: 'Orthopedic Trauma Specialist',
    department: 'Dept. of Orthopedic Surgery',
    licenseNumber: 'MCI-33847-MH',
    avatar: 'AM'
  },
  {
    id: 'DR-EMERG-5517',
    name: 'Dr. Kavitha Nair',
    email: 'k.nair@radinova.health',
    role: 'Emergency Medicine Physician',
    department: 'Acute Care & Emergency Medicine',
    licenseNumber: 'MCI-55173-KL',
    avatar: 'KN'
  }
];

const CAPABILITIES = [
  'Chest X-Ray — Pneumonia Detection (DenseNet-121)',
  'Limb Radiograph — Fracture Analysis + Grad-CAM',
  'Brain MRI — Neuroimaging & Tumor Analysis',
  'Blood Panel — Biomarker Synthesis (Dual Doctor / Guest View)',
  'Breast Cancer — Mammography Screening (DenseNet-121)',
];

export const AuthPortal: React.FC<AuthPortalProps> = ({ onLogin, onBack }) => {
  const [selectedDocId, setSelectedDocId] = useState<string>('');
  const [loginLoading, setLoginLoading] = useState<string | null>(null);

  const handleQuickSelect = (doc: DoctorProfile) => {
    setSelectedDocId(doc.id);
    setLoginLoading(doc.id);
    // Brief visual delay for feedback
    setTimeout(() => {
      onLogin(doc);
      setLoginLoading(null);
    }, 400);
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: '#080c10',
      display: 'flex',
      fontFamily: "'Plus Jakarta Sans', -apple-system, sans-serif"
    }}>
      {/* ── LEFT BRANDING PANEL ── */}
      <div style={{
        width: '45%',
        background: 'linear-gradient(160deg, #0d1218 0%, #0a1520 100%)',
        borderRight: '1px solid rgba(255,255,255,0.07)',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        padding: '48px',
      }}>
        {/* Brand */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{
            width: '42px', height: '42px',
            background: 'rgba(163,230,53,0.15)',
            border: '1px solid #a3e635',
            borderRadius: '10px',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: '#a3e635',
            boxShadow: '0 0 16px rgba(163,230,53,0.2)'
          }}>
            <Activity size={22} />
          </div>
          <div>
            <div style={{ fontSize: '20px', fontWeight: 800, color: '#f8fafc', letterSpacing: '-0.02em' }}>RadiNova AI</div>
            <div style={{ fontSize: '11px', color: '#64748b', fontWeight: 600 }}>AI-Powered Clinical Intelligence</div>
          </div>
        </div>

        {/* Headline */}
        <div>
          <h1 style={{
            fontSize: '48px', fontWeight: 900, lineHeight: 1.05,
            letterSpacing: '-0.03em', color: '#f8fafc', margin: '0 0 20px 0'
          }}>
            Multi-Modal<br />
            <span style={{ color: '#a3e635' }}>Diagnostic</span><br />
            Intelligence
          </h1>
          <p style={{ fontSize: '15px', color: '#94a3b8', lineHeight: 1.6, margin: '0 0 32px 0', maxWidth: '380px' }}>
            Advanced AI-assisted analytics for radiology, trauma imaging, neuroimaging, and clinical pathology reports.
          </p>

          {/* Capabilities */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {CAPABILITIES.map((cap, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <CheckCircle2 size={15} style={{ color: '#a3e635', flexShrink: 0 }} />
                <span style={{ fontSize: '13px', color: '#94a3b8', fontWeight: 500 }}>{cap}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Footer note */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Shield size={13} style={{ color: '#64748b' }} />
          <span style={{ fontSize: '12px', color: '#475569', fontWeight: 600 }}>
            MCI Compliant · Institutional Node RD-CLUSTER-IN-01
          </span>
        </div>
      </div>

      {/* ── RIGHT LOGIN PANEL ── */}
      <div style={{
        flex: 1,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '48px 40px',
        overflowY: 'auto'
      }}>
        <div style={{ width: '100%', maxWidth: '440px' }}>
          {/* Back button */}
          {onBack && (
            <button
              onClick={onBack}
              style={{
                display: 'flex', alignItems: 'center', gap: '6px',
                background: 'transparent', border: 'none',
                color: '#64748b', fontSize: '13px', fontWeight: 600,
                cursor: 'pointer', marginBottom: '32px', padding: 0
              }}
              onMouseEnter={e => e.currentTarget.style.color = '#f8fafc'}
              onMouseLeave={e => e.currentTarget.style.color = '#64748b'}
            >
              <ArrowLeft size={14} />
              Back to Home
            </button>
          )}

          {/* Header */}
          <div style={{ marginBottom: '32px' }}>
            <p style={{
              fontSize: '11px', fontWeight: 700, letterSpacing: '0.08em',
              textTransform: 'uppercase', color: '#a3e635', margin: '0 0 10px 0'
            }}>
              Clinical Access Portal
            </p>
            <h2 style={{
              fontSize: '26px', fontWeight: 800, color: '#f8fafc',
              margin: '0 0 8px 0', letterSpacing: '-0.02em'
            }}>
              Select Physician Profile
            </h2>
            <p style={{ fontSize: '13.5px', color: '#64748b', margin: 0 }}>
              Click a profile to instantly access the diagnostic workspace.
            </p>
          </div>

          {/* Doctor Cards */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {PRESET_DOCTORS.map(doc => {
              const isSel = selectedDocId === doc.id;
              const isLoading = loginLoading === doc.id;
              return (
                <button
                  key={doc.id}
                  type="button"
                  onClick={() => handleQuickSelect(doc)}
                  disabled={loginLoading !== null}
                  style={{
                    width: '100%',
                    background: isSel ? 'rgba(163,230,53,0.08)' : '#121820',
                    border: `1px solid ${isSel ? '#a3e635' : 'rgba(255,255,255,0.09)'}`,
                    borderRadius: '14px',
                    padding: '18px 20px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '16px',
                    cursor: loginLoading ? 'not-allowed' : 'pointer',
                    transition: 'all 0.2s ease',
                    textAlign: 'left'
                  }}
                  onMouseEnter={e => {
                    if (!loginLoading) {
                      e.currentTarget.style.borderColor = '#a3e635';
                      e.currentTarget.style.background = 'rgba(163,230,53,0.06)';
                    }
                  }}
                  onMouseLeave={e => {
                    if (!isSel) {
                      e.currentTarget.style.borderColor = 'rgba(255,255,255,0.09)';
                      e.currentTarget.style.background = '#121820';
                    }
                  }}
                >
                  {/* Avatar */}
                  <div style={{
                    width: '48px', height: '48px', borderRadius: '12px',
                    background: isSel
                      ? 'linear-gradient(135deg, #65a30d, #a3e635)'
                      : 'rgba(255,255,255,0.06)',
                    color: isSel ? '#080c10' : '#94a3b8',
                    fontWeight: 800, fontSize: '15px',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    flexShrink: 0,
                    transition: 'all 0.2s ease'
                  }}>
                    {isLoading ? '...' : doc.avatar}
                  </div>

                  {/* Info */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{
                      fontSize: '15px', fontWeight: 800, color: '#f8fafc',
                      marginBottom: '3px', letterSpacing: '-0.01em'
                    }}>
                      {doc.name}
                    </div>
                    <div style={{ fontSize: '12.5px', color: '#a3e635', fontWeight: 600, marginBottom: '2px' }}>
                      {doc.role}
                    </div>
                    <div style={{ fontSize: '11.5px', color: '#475569', fontWeight: 500 }}>
                      {doc.department}
                    </div>
                  </div>

                  {/* Arrow */}
                  <ArrowRight size={16} style={{ color: isSel ? '#a3e635' : '#475569', flexShrink: 0 }} />
                </button>
              );
            })}
          </div>

          {/* License note */}
          <p style={{
            fontSize: '11.5px', color: '#334155', textAlign: 'center',
            marginTop: '24px', lineHeight: 1.5
          }}>
            Access is restricted to licensed healthcare professionals.<br />
            All sessions are logged under institutional compliance policy.
          </p>
        </div>
      </div>
    </div>
  );
};
