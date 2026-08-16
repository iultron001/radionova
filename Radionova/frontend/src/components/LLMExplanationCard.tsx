import React from 'react';
import { LLMExplanationContent } from '../types';
import { FileSearch, CheckCircle2, HelpCircle } from 'lucide-react';

interface LLMExplanationCardProps {
  explanation: LLMExplanationContent;
  source: 'LLM_LIVE_API' | 'TEMPLATE_FALLBACK';
  filename: string;
  modality: string;
}

export const LLMExplanationCard: React.FC<LLMExplanationCardProps> = ({
  explanation,
  source,
  filename,
  modality
}) => {
  return (
    <div className="card-swiss">
      <div className="card-swiss-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <FileSearch size={16} />
          <div>
            <span className="card-title">{explanation.title || `${modality.toUpperCase()} Clinical Review`}</span>
            {filename && (
              <div style={{ fontSize: '10px', color: 'var(--text-muted)', textTransform: 'none' }}>
                Document: {filename}
              </div>
            )}
          </div>
        </div>
        <span className="tab-tag" style={{ background: 'var(--bg-subtle)' }}>
          {source === 'LLM_LIVE_API' ? 'LIVE LLM INFERENCE' : 'STANDARDIZED TEMPLATE PIPELINE'}
        </span>
      </div>

      <div style={{ marginBottom: '18px' }}>
        <div style={{ fontSize: '11px', fontWeight: 800, textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '4px' }}>
          Plain-Language Interpretation
        </div>
        <p style={{ fontSize: '14px', lineHeight: '1.6', fontWeight: 500, color: 'var(--text-primary)' }}>
          {explanation.plain_language_summary}
        </p>
      </div>

      {explanation.key_findings && explanation.key_findings.length > 0 && (
        <div style={{ marginBottom: '18px', background: 'var(--bg-subtle)', padding: '16px', borderLeft: '3px solid var(--text-primary)' }}>
          <div style={{ fontSize: '11px', fontWeight: 800, textTransform: 'uppercase', marginBottom: '8px' }}>
            Structured Key Findings
          </div>
          <ul style={{ listStyle: 'none' }}>
            {explanation.key_findings.map((kf, i) => (
              <li key={i} style={{ fontSize: '12px', marginBottom: '6px', display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
                <CheckCircle2 size={14} style={{ marginTop: '2px', flexShrink: 0 }} />
                <span>{kf}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {explanation.hedging_statement && (
        <div style={{ marginBottom: '16px', padding: '10px 14px', background: 'var(--status-alert-bg)', border: '1px solid var(--accent-light)', fontSize: '12px', color: 'var(--status-alert-text)' }}>
          <strong>Clinical Hedging Statement:</strong> {explanation.hedging_statement}
        </div>
      )}

      {explanation.recommended_clinical_questions && explanation.recommended_clinical_questions.length > 0 && (
        <div>
          <div style={{ fontSize: '11px', fontWeight: 800, textTransform: 'uppercase', marginBottom: '6px', color: 'var(--text-primary)' }}>
            Suggested Follow-Up Clinical Questions
          </div>
          <ul style={{ listStyle: 'none' }}>
            {explanation.recommended_clinical_questions.map((q, i) => (
              <li key={i} style={{ fontSize: '12px', marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-secondary)' }}>
                <HelpCircle size={13} />
                <span>{q}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};
