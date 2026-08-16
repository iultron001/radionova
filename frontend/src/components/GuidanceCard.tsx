import React from 'react';
import { GuidanceData } from '../types';
import { ShieldCheck } from 'lucide-react';

interface GuidanceCardProps {
  guidance: GuidanceData;
}

export const GuidanceCard: React.FC<GuidanceCardProps> = ({ guidance }) => {
  return (
    <div className="guidance-box">
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
        <ShieldCheck size={16} />
        <h3 className="guidance-title">Evidence-Grounded Clinical Decision Support</h3>
      </div>

      <p className="guidance-summary">{guidance.clinical_summary}</p>

      {guidance.differential_considerations && guidance.differential_considerations.length > 0 && (
        <div style={{ marginBottom: '14px' }}>
          <div style={{ fontSize: '11px', fontWeight: 800, textTransform: 'uppercase', marginBottom: '6px', color: 'var(--text-primary)' }}>
            Differential Considerations
          </div>
          <ul className="guidance-list">
            {guidance.differential_considerations.map((item, idx) => (
              <li key={idx}>{item}</li>
            ))}
          </ul>
        </div>
      )}

      {guidance.recommended_followup && guidance.recommended_followup.length > 0 && (
        <div>
          <div style={{ fontSize: '11px', fontWeight: 800, textTransform: 'uppercase', marginBottom: '6px', color: 'var(--text-primary)' }}>
            Recommended Diagnostic Follow-Up
          </div>
          <ul className="guidance-list">
            {guidance.recommended_followup.map((item, idx) => (
              <li key={idx}>{item}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};
