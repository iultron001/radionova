import React from 'react';
import { LLMExplanationContent, ReportParameterItem } from '../types';
import { 
  FileText, Activity, AlertTriangle, ShieldCheck, 
  HelpCircle, AlertCircle, Clock, Zap, HeartPulse, Stethoscope
} from 'lucide-react';

interface LLMExplanationCardProps {
  explanation: LLMExplanationContent;
  source: string;
  filename: string;
  modality: string;
  showTableOnly?: boolean;
  role?: 'doctor' | 'guest';
}

export const LLMExplanationCard: React.FC<LLMExplanationCardProps> = ({
  explanation,
  source,
  filename,
  modality,
  showTableOnly = false,
  role = 'doctor'
}) => {
  const stats = explanation.info_stats;
  const triage = explanation.triage_level;
  const shortTerm = explanation.short_term_problems || [];
  const longTerm = explanation.long_term_problems || [];
  const whatToDo = explanation.what_to_do_now || [];
  const precautions = explanation.precautions_and_prevention || [];

  const isAlert = triage?.severity === 'ELEVATED' || triage?.severity === 'ACUTE';
  const urgencyScore = (explanation as any).urgency_score !== undefined 
    ? (explanation as any).urgency_score 
    : (triage?.severity === 'ACUTE' ? 90 : (triage?.severity === 'ELEVATED' ? 65 : (triage?.severity === 'MODERATE' ? 40 : 15)));

  // Table only mode (for Left Column)
  if (showTableOnly) {
    if (!stats || !stats.parameter_breakdown || stats.parameter_breakdown.length === 0) return null;
    return (
      <div className="report-stats-box" style={{ marginTop: '16px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
          <div style={{ fontSize: '11px', fontWeight: 750, textTransform: 'uppercase', color: 'var(--text-primary)' }}>
            Quantitative Biomarker Reference Matrix
          </div>
          <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>
            {stats.total_markers - stats.abnormal_markers} Normal / {stats.abnormal_markers} Flagged
          </div>
        </div>
        <div className="parameter-table-wrapper">
          <table className="parameter-table">
            <thead>
              <tr>
                <th>Biomarker / Measured Index</th>
                <th>Observed</th>
                <th>Reference</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {stats.parameter_breakdown.map((param: ReportParameterItem, idx: number) => (
                <tr key={idx}>
                  <td style={{ fontWeight: 650 }}>{param.name}</td>
                  <td><strong>{param.value}</strong> {param.unit}</td>
                  <td style={{ color: 'var(--text-muted)' }}>{param.reference}</td>
                  <td>
                    <span className={`status-pill ${param.status === 'NORMAL' ? 'normal' : 'alert'}`}>
                      {param.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  // Right Column Content (Narrative, Risks, Action Plan, Precautions)
  // GUEST / PATIENT VIEW: Simple language + Emergency Referral Bar
  if (role === 'guest') {
    const isHighUrgency = urgencyScore >= 70;
    const isModerateUrgency = urgencyScore >= 35 && urgencyScore < 70;
    const urgencyColor = isHighUrgency ? '#ef4444' : isModerateUrgency ? '#f59e0b' : '#10b981';
    const urgencyText = isHighUrgency
      ? 'High Urgency — Immediate Doctor Visit Recommended'
      : isModerateUrgency
      ? 'Moderate Concern — Schedule a Doctor Visit'
      : 'Routine — Results Within Normal Ranges';

    const patientText = (explanation as any).patient_summary || explanation.plain_language_summary;

    return (
      <div className="card-swiss" style={{ borderTop: `4px solid ${urgencyColor}` }}>
        {/* Guest Header */}
        <div className="card-swiss-header">
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span className="bell-badge" style={{ position: 'static', background: 'rgba(163,230,53,0.15)', color: 'var(--accent-lime)' }}>
                PATIENT VIEW
              </span>
              <span className="card-title" style={{ fontSize: '16px' }}>{explanation.title || 'Laboratory & Health Assessment'}</span>
            </div>
            <div style={{ fontSize: '11.5px', color: 'var(--text-muted)', marginTop: '4px' }}>
              Easy-to-understand health breakdown for patients & guests
            </div>
          </div>
          <span className="tab-tag" style={{ background: 'var(--bg-subtle)' }}>
            GUEST MODE
          </span>
        </div>

        {/* ── EMERGENCY REFERRAL BAR (TASK 2) ── */}
        <div style={{
          background: 'var(--bg-card-subtle)',
          border: '1px solid var(--border-subtle)',
          borderRadius: '12px',
          padding: '16px',
          marginBottom: '18px'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <HeartPulse size={16} style={{ color: urgencyColor }} />
              <span style={{ fontSize: '12px', fontWeight: 800, textTransform: 'uppercase', color: 'var(--text-primary)', letterSpacing: '0.04em' }}>
                Doctor Referral & Emergency Indicator
              </span>
            </div>
            <span style={{
              fontSize: '12px',
              fontWeight: 800,
              color: urgencyColor,
              background: isHighUrgency ? 'rgba(239,68,68,0.12)' : isModerateUrgency ? 'rgba(245,158,11,0.12)' : 'rgba(16,185,129,0.12)',
              padding: '2px 8px',
              borderRadius: '9999px',
              border: `1px solid ${urgencyColor}40`
            }}>
              {urgencyScore}% Concern Level
            </span>
          </div>

          {/* Color-Graded Emergency Bar */}
          <div style={{
            position: 'relative',
            height: '14px',
            background: 'rgba(255,255,255,0.06)',
            borderRadius: '9999px',
            overflow: 'hidden',
            margin: '10px 0 6px 0',
            border: '1px solid var(--border-subtle)'
          }}>
            <div style={{
              position: 'absolute',
              top: 0,
              left: 0,
              height: '100%',
              width: `${Math.max(8, Math.min(100, urgencyScore))}%`,
              background: `linear-gradient(90deg, #10b981 0%, #f59e0b 50%, #ef4444 100%)`,
              borderRadius: '9999px',
              transition: 'width 0.6s ease'
            }} />
          </div>

          {/* Bar Scale Labels */}
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', color: 'var(--text-muted)', fontWeight: 600, marginTop: '4px' }}>
            <span style={{ color: '#10b981' }}>● Low (Home Care)</span>
            <span style={{ color: '#f59e0b' }}>● Moderate (See GP)</span>
            <span style={{ color: '#ef4444' }}>● Urgent (Specialist / ER)</span>
          </div>

          <div style={{
            marginTop: '10px',
            padding: '8px 12px',
            background: `${urgencyColor}10`,
            borderLeft: `3px solid ${urgencyColor}`,
            borderRadius: '0 6px 6px 0',
            fontSize: '12px',
            fontWeight: 700,
            color: urgencyColor
          }}>
            {urgencyText}
          </div>
        </div>

        {/* Plain Language Interpretation */}
        <div style={{ marginBottom: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px' }}>
            <FileText size={15} style={{ color: 'var(--accent-lime)' }} />
            <span style={{ fontSize: '12px', fontWeight: 800, textTransform: 'uppercase', color: 'var(--text-primary)' }}>
              What Your Results Mean In Plain English
            </span>
          </div>
          <p style={{
            fontSize: '13px',
            color: 'var(--text-secondary)',
            lineHeight: 1.6,
            background: 'var(--bg-elevated)',
            padding: '14px 16px',
            border: '1px solid var(--border-subtle)',
            borderRadius: '10px'
          }}>
            {patientText}
          </p>
        </div>

        {/* Simplified Action Steps */}
        {whatToDo.length > 0 && (
          <div style={{
            background: 'var(--bg-card-subtle)',
            border: '1px solid var(--border-subtle)',
            borderRadius: '10px',
            padding: '14px 16px',
            marginBottom: '16px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px' }}>
              <Zap size={14} style={{ color: 'var(--accent-lime)' }} />
              <span style={{ fontSize: '11.5px', fontWeight: 800, textTransform: 'uppercase', color: 'var(--text-primary)' }}>
                Recommended Steps for You
              </span>
            </div>
            <ol style={{ paddingLeft: '18px', margin: 0, fontSize: '12.5px', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
              {whatToDo.slice(0, 3).map((step, idx) => (
                <li key={idx} style={{ marginBottom: '4px' }}>{step}</li>
              ))}
            </ol>
          </div>
        )}

        {/* Reassurance & Next Step CTA */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          background: 'rgba(163,230,53,0.06)',
          border: '1px solid rgba(163,230,53,0.25)',
          borderRadius: '10px',
          padding: '12px 16px',
          flexWrap: 'wrap',
          gap: '10px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Stethoscope size={16} style={{ color: 'var(--accent-lime)' }} />
            <span style={{ fontSize: '12px', color: 'var(--text-primary)', fontWeight: 650 }}>
              Need a doctor's confirmation?
            </span>
          </div>
          <span style={{ fontSize: '11.5px', color: 'var(--text-muted)' }}>
            Share this report ID with your physician at your next clinic visit.
          </span>
        </div>
      </div>
    );
  }

  // DOCTOR / CLINICIAN VIEW: High clinical language + full detail
  const doctorText = (explanation as any).doctor_summary || explanation.plain_language_summary;

  return (
    <div className="card-swiss">
      {/* Header & Triage Badge */}
      <div className="card-swiss-header">
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span className="bell-badge" style={{ position: 'static' }}>MD</span>
            <span className="card-title">{explanation.title || `${modality} Comprehensive Evaluation`}</span>
          </div>
          <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>
            Study Record: {filename} • {new Date().toLocaleDateString()} • Clinician Decision Support
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {triage && (
            <div className={`triage-badge ${isAlert ? 'triage-alert' : 'triage-normal'}`}>
              <Activity size={12} className="pulse-icon" />
              <span>{triage.label}</span>
            </div>
          )}
          <span className="tab-tag" style={{ background: 'var(--bg-subtle)' }}>
            {source === 'GEMINI_LLM' ? 'GEMINI FLASH 2.5' : 'CLINICAL PARSER'}
          </span>
        </div>
      </div>

      {/* High Language Clinical Interpretation */}
      <div style={{ marginBottom: '18px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px' }}>
          <FileText size={15} style={{ color: 'var(--accent)' }} />
          <span style={{ fontSize: '11.5px', fontWeight: 750, textTransform: 'uppercase', color: 'var(--text-primary)' }}>
            Physician Clinical Synthesis & Biomarker Interpretation
          </span>
        </div>
        <p style={{ fontSize: '12.5px', color: 'var(--text-secondary)', lineHeight: 1.55, background: 'var(--bg-card-warm)', padding: '14px 16px', border: '1px solid var(--border-light)', borderRadius: 'var(--radius-sm)' }}>
          {doctorText}
        </p>
      </div>

      {/* Short-Term vs Long-Term Risk Analysis */}
      {(shortTerm.length > 0 || longTerm.length > 0) && (
        <div className="risk-grid">
          {shortTerm.length > 0 && (
            <div className="risk-card short-term">
              <div className="risk-card-header">
                <Clock size={14} style={{ color: 'var(--accent)' }} />
                <span>Short-Term Complications (24–72h)</span>
              </div>
              <ul className="risk-list">
                {shortTerm.map((risk: string, idx: number) => (
                  <li key={idx}>{risk}</li>
                ))}
              </ul>
            </div>
          )}

          {longTerm.length > 0 && (
            <div className="risk-card long-term">
              <div className="risk-card-header">
                <AlertTriangle size={14} style={{ color: 'var(--text-primary)' }} />
                <span>Long-Term & Longitudinal Risks</span>
              </div>
              <ul className="risk-list">
                {longTerm.map((risk: string, idx: number) => (
                  <li key={idx}>{risk}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {/* What To Do Now (Immediate Action Plan) */}
      {whatToDo.length > 0 && (
        <div className="action-plan-box">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
            <Zap size={15} style={{ color: 'var(--accent)' }} />
            <span style={{ fontSize: '11.5px', fontWeight: 800, textTransform: 'uppercase', color: 'var(--text-primary)', letterSpacing: '0.03em' }}>
              Immediate Clinical Action Plan ("What to do now")
            </span>
          </div>
          <ol className="action-step-list">
            {whatToDo.map((step: string, idx: number) => (
              <li key={idx}>
                <span className="step-number">{idx + 1}</span>
                <span>{step}</span>
              </li>
            ))}
          </ol>
        </div>
      )}

      {/* Precautions & Prevention Guidelines */}
      {precautions.length > 0 && (
        <div className="prevention-box">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
            <ShieldCheck size={15} style={{ color: 'var(--status-positive-border)' }} />
            <span style={{ fontSize: '11px', fontWeight: 800, textTransform: 'uppercase', color: 'var(--status-positive-text)', letterSpacing: '0.03em' }}>
              Clinical Precautions & Preventative Protocols
            </span>
          </div>
          <ul className="prevention-list">
            {precautions.map((item: string, idx: number) => (
              <li key={idx}>{item}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Suggested Follow-Up Questions */}
      {explanation.recommended_clinical_questions && explanation.recommended_clinical_questions.length > 0 && (
        <div style={{ marginTop: '14px', background: 'var(--bg-card-warm)', padding: '12px 16px', border: '1px solid var(--border-light)', borderRadius: 'var(--radius-sm)' }}>
          <div style={{ fontSize: '10.5px', fontWeight: 750, textTransform: 'uppercase', marginBottom: '6px', color: 'var(--text-secondary)' }}>
            Suggested Diagnostic Follow-Up Questions
          </div>
          <ul style={{ listStyle: 'none' }}>
            {explanation.recommended_clinical_questions.map((q: string, i: number) => (
              <li key={i} style={{ fontSize: '11.5px', marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-secondary)' }}>
                <HelpCircle size={12} style={{ color: 'var(--accent)' }} />
                <span>{q}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Hedging Statement */}
      {explanation.hedging_statement && (
        <div style={{ marginTop: '14px', padding: '10px 14px', background: 'var(--status-alert-bg)', border: '1px solid var(--status-alert-border)', borderRadius: 'var(--radius-sm)', fontSize: '11px', color: 'var(--status-alert-text)', lineHeight: 1.45 }}>
          <AlertCircle size={12} style={{ display: 'inline', marginRight: '6px', verticalAlign: 'middle' }} />
          <strong>Clinical Note:</strong> {explanation.hedging_statement}
        </div>
      )}
    </div>
  );
};
