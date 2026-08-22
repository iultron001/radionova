import React from 'react';
import {
  Activity,
  HeartHandshake,
  Lock,
  Shield,
  Zap,
  Brain,
  ArrowRight,
  Bone,
  Droplet,
  Stethoscope,
  Ribbon
} from 'lucide-react';
import { GeminiSymptomChat } from '../GeminiSymptomChat';

interface LandingPageProps {
  onStartPatientTriage: () => void;
  onOpenDoctorLogin: () => void;
}

const MODALITIES = [
  { 
    id: 'chest',
    label: 'Chest Radiography', 
    sub: 'Pneumonia & Infiltrate Detection',
    badge: 'DenseNet-121 + Grad-CAM',
    icon: Activity
  },
  { 
    id: 'fracture',
    label: 'Limb & Bone Fracture', 
    sub: 'Osseous Disruption Analysis',
    badge: '2-Layer Gatekeeper CV',
    icon: Bone
  },
  { 
    id: 'mri',
    label: 'Brain MRI Neuroimaging', 
    sub: 'Parenchymal Disruption Report',
    badge: 'Neuro Diagnostic Suite',
    icon: Brain
  },
  { 
    id: 'blood',
    label: 'Hematology Panel', 
    sub: 'CBC & Metabolic Risk Ranges',
    badge: 'Dual Doctor / Patient View',
    icon: Droplet
  },
  { 
    id: 'breast_cancer',
    label: 'Breast Cancer Screening', 
    sub: 'Mammographic Mass Detection',
    badge: 'BIRADS • DenseNet-121',
    icon: Ribbon
  },
];

const ARCHITECTURE_FEATURES = [
  {
    icon: Bone,
    title: 'Two-Layer Gatekeeper CV Pipeline',
    desc: 'Pre-inference classification validates radiograph anatomy and image domain before executing the DenseNet-121 model, eliminating out-of-domain false positives.',
    tag: 'CV MODEL + GATEKEEPER',
  },
  {
    icon: Activity,
    title: 'Grad-CAM Visual Explainability',
    desc: 'Gradient-weighted class activation mapping highlights high-density radiologic focal regions directly on the original scan with seamless heatmap overlays.',
    tag: 'EXPLAINABLE AI',
  },
  {
    icon: HeartHandshake,
    title: 'Patient Symptom Triage Companion',
    desc: 'Conversational assistant with turn limits, structured schema extraction, and proactive red-flag acute risk screening — completely free without registration.',
    tag: 'GUEST ACCESS',
  },
  {
    icon: Ribbon,
    title: 'Breast Cancer Screening Suite',
    desc: 'Mammographic mass detection and BIRADS classification with DenseNet-121 + Grad-CAM localization. Model stub ready for your trained weights.',
    tag: 'MAMMOGRAPHY CV MODEL',
  },
];

export const LandingPage: React.FC<LandingPageProps> = ({
  onStartPatientTriage,
  onOpenDoctorLogin,
}) => {
  return (
    <div className="landing-shell">

      {/* ── TOP NAVIGATION ── */}
      <header className="landing-nav">
        <div className="landing-brand">
          <div className="landing-brand-icon">
            <Activity size={20} />
          </div>
          <span className="landing-brand-name">RadiNova AI</span>
          <span className="landing-brand-tag">CLINICAL SUITE</span>
        </div>

        <div className="landing-nav-right">
          <div className="landing-status-dot-wrap">
            <span className="landing-live-dot" />
            <span className="landing-live-label">Neural Inference Nodes Active</span>
          </div>
          <button
            className="landing-doctor-login-btn"
            onClick={onOpenDoctorLogin}
          >
            <Lock size={13} />
            <span>Doctor / Clinician Login</span>
          </button>
        </div>
      </header>

      {/* ── HERO SECTION ── */}
      <section className="landing-hero">
        <div className="landing-hero-content">
          <div className="landing-hero-eyebrow">
            <Shield size={14} />
            <span>AI-Assisted Clinical Decision Support System</span>
          </div>

          <h1 className="landing-hero-h1">
            Multi-Modal<br />
            <span className="landing-hero-accent">Diagnostic</span><br />
            Intelligence
          </h1>

          <p className="landing-hero-body">
            Advanced neural decision support for radiology, orthopedic trauma, neuroimaging, ECG,
            and pathology — with verifiable Grad-CAM explainability and safe patient triage.
          </p>

          <div style={{
            background: 'rgba(217, 119, 6, 0.08)',
            border: '1px solid rgba(217, 119, 6, 0.3)',
            borderRadius: '8px',
            padding: '10px 14px',
            marginBottom: '32px',
            maxWidth: '560px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            <span style={{ fontSize: '12px', color: '#f59e0b', fontWeight: 600 }}>
              AI-assisted prediction / decision support — requires review by a qualified healthcare professional.
            </span>
          </div>

          {/* ── TWO CLEAR GATEWAY PANELS ── */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(2, 1fr)',
            gap: '16px',
            maxWidth: '620px',
            marginBottom: '20px'
          }}>
            {/* Panel 1: Patient / Guest */}
            <div
              onClick={onStartPatientTriage}
              style={{
                background: 'linear-gradient(135deg, #121922 0%, #182230 100%)',
                border: '1px solid rgba(163, 230, 53, 0.3)',
                borderRadius: '14px',
                padding: '20px',
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
                e.currentTarget.style.boxShadow = '0 8px 24px rgba(163, 230, 53, 0.15)';
              }}
              onMouseLeave={e => {
                e.currentTarget.style.borderColor = 'rgba(163, 230, 53, 0.3)';
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = 'none';
              }}
            >
              <div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
                  <div style={{
                    width: '36px', height: '36px', borderRadius: '10px',
                    background: 'var(--accent-lime-muted)', color: 'var(--accent-lime)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center'
                  }}>
                    <HeartHandshake size={20} />
                  </div>
                  <span style={{
                    fontSize: '10px', fontWeight: 800, letterSpacing: '0.05em',
                    color: 'var(--accent-lime)', background: 'var(--accent-lime-subtle)',
                    padding: '2px 6px', borderRadius: '4px'
                  }}>
                    GUEST ACCESS
                  </span>
                </div>
                <h3 style={{ fontSize: '16px', fontWeight: 800, color: 'var(--text-primary)', margin: '0 0 4px 0' }}>
                  Patient Triage
                </h3>
                <p style={{ fontSize: '12.5px', color: 'var(--text-secondary)', margin: 0, lineHeight: 1.45 }}>
                  Describe symptoms in plain language. AI triage screens red-flags without login.
                </p>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--accent-lime)', fontSize: '13px', fontWeight: 700 }}>
                <span>Start Symptom Triage</span>
                <ArrowRight size={14} />
              </div>
            </div>

            {/* Panel 2: Doctor / Clinician */}
            <div
              onClick={onOpenDoctorLogin}
              style={{
                background: 'linear-gradient(135deg, #10151c 0%, #141c26 100%)',
                border: '1px solid var(--border-subtle)',
                borderRadius: '14px',
                padding: '20px',
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
                e.currentTarget.style.boxShadow = '0 8px 24px rgba(0, 0, 0, 0.3)';
              }}
              onMouseLeave={e => {
                e.currentTarget.style.borderColor = 'var(--border-subtle)';
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = 'none';
              }}
            >
              <div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
                  <div style={{
                    width: '36px', height: '36px', borderRadius: '10px',
                    background: 'rgba(255,255,255,0.06)', color: 'var(--text-primary)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center'
                  }}>
                    <Stethoscope size={18} />
                  </div>
                  <span style={{
                    fontSize: '10px', fontWeight: 800, letterSpacing: '0.05em',
                    color: 'var(--text-muted)', background: 'rgba(255,255,255,0.04)',
                    padding: '2px 6px', borderRadius: '4px'
                  }}>
                    CLINICAL AUTH
                  </span>
                </div>
                <h3 style={{ fontSize: '16px', fontWeight: 800, color: 'var(--text-primary)', margin: '0 0 4px 0' }}>
                  Doctor Workspace
                </h3>
                <p style={{ fontSize: '12.5px', color: 'var(--text-secondary)', margin: 0, lineHeight: 1.45 }}>
                  Access DenseNet-121 vision models, Grad-CAM, studies, and PDF reporting.
                </p>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-primary)', fontSize: '13px', fontWeight: 700 }}>
                <span>Physician Sign In</span>
                <ArrowRight size={14} />
              </div>
            </div>
          </div>

          <p className="landing-guest-note">
            * Guest triage is strictly non-diagnostic and accessible without institutional registration.
          </p>
        </div>

        {/* ── MODALITY CARDS GRID (HERO RIGHT) ── */}
        <div className="landing-modality-grid">
          {MODALITIES.map((m) => {
            const Icon = m.icon;
            return (
              <div key={m.id} className="landing-modality-pill">
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
                  <div style={{
                    width: '28px', height: '28px', borderRadius: '6px',
                    background: 'var(--accent-lime-muted)', color: 'var(--accent-lime)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center'
                  }}>
                    <Icon size={15} />
                  </div>
                  <span style={{ fontSize: '10px', fontWeight: 700, color: 'var(--accent-lime)' }}>
                    {m.badge}
                  </span>
                </div>
                <span className="landing-modality-label">{m.label}</span>
                <span className="landing-modality-sub">{m.sub}</span>
              </div>
            );
          })}
        </div>
      </section>

      {/* ── GEMINI AI SYMPTOM CHAT SECTION (TASK 6) ── */}
      <section style={{ maxWidth: '1240px', margin: '0 auto 48px auto', padding: '0 24px' }}>
        <GeminiSymptomChat onOpenDoctorLogin={onOpenDoctorLogin} />
      </section>

      {/* ── SECTION DIVIDER ── */}
      <div className="landing-section-divider">
        <span>Clinical Decision Support Architecture</span>
      </div>

      {/* ── FEATURES GRID ── */}
      <section className="landing-features" style={{ gridTemplateColumns: 'repeat(2, 1fr)' }}>
        {ARCHITECTURE_FEATURES.map((f) => {
          const Icon = f.icon;
          return (
            <div key={f.title} className="landing-feature-card">
              <div className="landing-feature-header">
                <div className="landing-feature-icon-wrap">
                  <Icon size={20} />
                </div>
                <span className="landing-feature-tag">{f.tag}</span>
              </div>
              <h3 className="landing-feature-title">{f.title}</h3>
              <p className="landing-feature-desc">{f.desc}</p>
            </div>
          );
        })}
      </section>

      {/* ── FOOTER ── */}
      <footer className="landing-footer">
        <div className="landing-footer-inner">
          <div className="landing-footer-brand">
            <Activity size={15} />
            <span>RadiNova AI</span>
          </div>
          <div className="landing-footer-badges">
            <span className="landing-footer-badge">
              <Zap size={11} />
              DenseNet-121
            </span>
            <span className="landing-footer-badge">
              <Shield size={11} />
              2-Layer Gatekeeper
            </span>
            <span className="landing-footer-badge">
              <Activity size={11} />
              Grad-CAM
            </span>
            <span className="landing-footer-badge">
              <Brain size={11} />
              Gemini LLM
            </span>
          </div>
          <span className="landing-footer-note">
            HIPAA & MCI Compliant CDSS Architecture • Node RD-CLUSTER-IN-01
          </span>
        </div>
      </footer>

    </div>
  );
};

