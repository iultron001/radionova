import React from 'react';
import {
  ShieldCheck,
  Cpu,
  CheckCircle2,
  Lock,
  Layers,
  AlertTriangle,
  Settings2
} from 'lucide-react';

const SPEC_ROW = ({ label, value }: { label: string; value: React.ReactNode }) => (
  <div style={{
    display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start',
    padding: '9px 0', borderBottom: '1px solid var(--border-subtle)', gap: '16px'
  }}>
    <span style={{ fontSize: '12.5px', color: 'var(--text-muted)', fontWeight: 600, flexShrink: 0 }}>{label}</span>
    <span style={{ fontSize: '12.5px', color: 'var(--text-primary)', fontWeight: 700, textAlign: 'right', fontFamily: typeof value === 'string' && value.includes('.') ? 'var(--font-mono)' : undefined }}>{value}</span>
  </div>
);

const CHECK_ITEM = ({ children }: { children: React.ReactNode }) => (
  <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', padding: '8px 0', borderBottom: '1px solid var(--border-subtle)' }}>
    <CheckCircle2 size={15} style={{ color: 'var(--accent-lime)', flexShrink: 0, marginTop: '1px' }} />
    <span style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: 1.5 }}>{children}</span>
  </div>
);

const PROTOCOL_CARD = ({
  icon: Icon,
  iconBg,
  iconColor,
  title,
  subtitle,
  children
}: {
  icon: any;
  iconBg: string;
  iconColor: string;
  title: string;
  subtitle: string;
  children: React.ReactNode;
}) => (
  <div style={{
    background: 'var(--bg-card)', border: '1px solid var(--border-subtle)',
    borderRadius: '16px', padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px'
  }}>
    <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
      <div style={{
        width: '44px', height: '44px', borderRadius: '12px',
        background: iconBg, color: iconColor,
        display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0
      }}>
        <Icon size={22} />
      </div>
      <div>
        <h3 style={{ fontSize: '15px', fontWeight: 800, color: 'var(--text-primary)', margin: '0 0 3px 0' }}>{title}</h3>
        <span style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: 600 }}>{subtitle}</span>
      </div>
    </div>
    {children}
  </div>
);

export const ProtocolsPage: React.FC = () => {
  return (
    <div style={{ flex: 1, padding: '28px 32px', overflowY: 'auto', background: 'var(--bg-app)' }}>

      {/* Header */}
      <div style={{ marginBottom: '28px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
          <Settings2 size={18} style={{ color: 'var(--accent-lime)' }} />
          <span style={{ fontSize: '12px', fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--accent-lime)' }}>
            System Configuration & AI Specifications
          </span>
        </div>
        <h1 style={{ fontSize: '22px', fontWeight: 800, color: 'var(--text-primary)', margin: '0 0 6px 0' }}>
          Clinical Protocols & Model Specifications
        </h1>
        <p style={{ fontSize: '13.5px', color: 'var(--text-muted)', margin: 0 }}>
          Validation rules, DenseNet-121 neural architecture configuration, quality gatekeeper thresholds, and compliance protocols.
        </p>
      </div>

      {/* Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '18px' }}>

        {/* Quality Gatekeeper */}
        <PROTOCOL_CARD
          icon={ShieldCheck}
          iconBg="rgba(163,230,53,0.12)"
          iconColor="var(--accent-lime)"
          title="Quality Gatekeeper & Image Validation"
          subtitle="Strict pre-inference anomaly & non-medical filter"
        >
          <p style={{ fontSize: '13px', color: 'var(--text-secondary)', margin: 0, lineHeight: 1.55 }}>
            Every incoming scan passes through a deterministic validation gate to prevent out-of-domain images, artifacts, or extreme noise from triggering false predictions.
          </p>
          <div>
            <CHECK_ITEM><strong>Modality Signature Verification:</strong> Evaluates spatial gradient histogram to confirm valid radiograph / DICOM structure.</CHECK_ITEM>
            <CHECK_ITEM><strong>Minimum Diagnostic Confidence:</strong> Output certainty must exceed 70% threshold to avoid low-confidence warnings.</CHECK_ITEM>
            <CHECK_ITEM><strong>Contrast & Attenuation Normalization:</strong> Re-scales pixel ranges to ImageNet standard (mean=0.485, std=0.229).</CHECK_ITEM>
          </div>
        </PROTOCOL_CARD>

        {/* DenseNet-121 */}
        <PROTOCOL_CARD
          icon={Cpu}
          iconBg="rgba(6,182,212,0.12)"
          iconColor="var(--status-cyan)"
          title="Computer Vision Engine (DenseNet-121)"
          subtitle="Feature reuse via dense connectivity & Grad-CAM"
        >
          <p style={{ fontSize: '13px', color: 'var(--text-secondary)', margin: 0, lineHeight: 1.55 }}>
            DenseNet-121 connects all layers directly with matching feature-map sizes, preserving high-frequency radiologic details like cortical margins and consolidation edges.
          </p>
          <div>
            <SPEC_ROW label="Backbone Architecture" value="DenseNet-121 (PyTorch Torchvision)" />
            <SPEC_ROW label="Explainability Layer" value="features.denseblock4.denselayer16" />
            <SPEC_ROW label="Algorithm" value="Gradient-Weighted Class Activation (Grad-CAM)" />
            <SPEC_ROW label="Colormap" value="OpenCV Jet with 350ms Soft Crossfade" />
          </div>
        </PROTOCOL_CARD>

        {/* LLM Pipeline */}
        <PROTOCOL_CARD
          icon={Layers}
          iconBg="rgba(99,102,241,0.12)"
          iconColor="#818cf8"
          title="LLM Clinical Intelligence Pipeline"
          subtitle="Biomarker extraction, range comparison & risk triage"
        >
          <p style={{ fontSize: '13px', color: 'var(--text-secondary)', margin: 0, lineHeight: 1.55 }}>
            Unstructured clinical reports and laboratory values (CBC, Metabolic Panel, ECG traces, CT descriptions) are parsed into standardized clinical schema with safety hedging.
          </p>
          <div>
            <CHECK_ITEM><strong>Deterministic Fallback Mode:</strong> Built-in clinical matrix activates when network is disconnected or API rate-limited.</CHECK_ITEM>
            <CHECK_ITEM><strong>Quantitative Biomarker Normalization:</strong> Compares numeric values against physiological reference ranges.</CHECK_ITEM>
            <CHECK_ITEM><strong>Triage Tier Categorization:</strong> Stratifies cases into Normal, Low, Moderate, Elevated, or Acute clinical priority.</CHECK_ITEM>
          </div>
        </PROTOCOL_CARD>

        {/* Compliance */}
        <PROTOCOL_CARD
          icon={Lock}
          iconBg="rgba(245,158,11,0.12)"
          iconColor="var(--status-warning)"
          title="HIPAA Privacy & Safety Disclaimer"
          subtitle="Institutional compliance & decision support boundaries"
        >
          <p style={{ fontSize: '13px', color: 'var(--text-secondary)', margin: 0, lineHeight: 1.55 }}>
            RadiNova AI is strictly engineered as a secondary Clinical Decision Support System (CDSS) for licensed healthcare professionals.
          </p>
          <div style={{
            display: 'flex', gap: '10px', alignItems: 'flex-start',
            background: 'rgba(245,158,11,0.06)', border: '1px solid rgba(245,158,11,0.2)',
            borderRadius: '10px', padding: '14px'
          }}>
            <AlertTriangle size={16} style={{ color: 'var(--status-warning)', flexShrink: 0, marginTop: '1px' }} />
            <div style={{ fontSize: '12.5px', lineHeight: 1.55, color: 'var(--text-secondary)' }}>
              <strong style={{ color: 'var(--text-primary)' }}>Standard Regulatory Notice:</strong> AI predictions, Grad-CAM overlays, and biomarker summaries do not constitute an independent diagnostic certificate. The attending licensed physician retains full clinical authority and diagnostic responsibility.
            </div>
          </div>
          <div>
            <SPEC_ROW label="Compliance Standard" value="HIPAA / MCI India Guidelines" />
            <SPEC_ROW label="Data Isolation" value="Per-doctor session partitioning" />
            <SPEC_ROW label="Classification" value="CDSS — Decision Support Only" />
          </div>
        </PROTOCOL_CARD>
      </div>

      {/* Bottom Disclaimer */}
      <div style={{
        marginTop: '20px',
        display: 'flex', alignItems: 'center', gap: '12px',
        background: 'rgba(163,230,53,0.05)', border: '1px solid rgba(163,230,53,0.2)',
        borderRadius: '10px', padding: '12px 16px',
        fontSize: '12px', color: 'var(--text-secondary)'
      }}>
        <ShieldCheck size={16} style={{ color: 'var(--accent-lime)', flexShrink: 0 }} />
        <span>
          <strong style={{ color: 'var(--text-primary)' }}>RadiNova AI Decision Support:</strong> All neural classifications and Grad-CAM explainability maps are intended for physician decision support only and require clinical correlation by a qualified healthcare professional.
        </span>
      </div>
    </div>
  );
};
