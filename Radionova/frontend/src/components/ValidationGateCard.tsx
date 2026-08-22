import React from 'react';
import { ShieldAlert, AlertTriangle, RefreshCw, Eye } from 'lucide-react';
import { CVAnalysisResult } from '../types';

interface ValidationGateCardProps {
  result: CVAnalysisResult;
  modalityName: string;
  onRetryUpload: () => void;
}

export const ValidationGateCard: React.FC<ValidationGateCardProps> = ({
  result,
  modalityName,
  onRetryUpload
}) => {
  const isInvalid = result.status === 'invalid_image';

  const gatekeeperConf = result.gatekeeper_confidence !== undefined && result.gatekeeper_confidence !== null
    ? (result.gatekeeper_confidence * 100).toFixed(1)
    : null;

  const diagnosticConf = result.diagnostic_confidence !== undefined && result.diagnostic_confidence !== null
    ? (result.diagnostic_confidence * 100).toFixed(1)
    : (result.confidence ? (result.confidence * 100).toFixed(1) : null);

  return (
    <div className="validation-gate-card">
      {/* Header Badge & Title */}
      <div className="validation-gate-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          {isInvalid ? (
            <div className="validation-gate-icon-badge invalid-badge">
              <ShieldAlert size={20} />
            </div>
          ) : (
            <div className="validation-gate-icon-badge uncertain-badge">
              <AlertTriangle size={20} />
            </div>
          )}
          <div>
            <div className="validation-gate-title">
              {isInvalid ? 'Modality Validation Gatekeeper' : 'Diagnostic Confidence Gate'}
            </div>
            <div className="validation-gate-subtitle">
              {isInvalid
                ? 'Pre-Inference Modality Filter (Layer 2 Active)'
                : 'Post-Softmax Reliability Threshold Gate (Layer 1 Active)'}
            </div>
          </div>
        </div>

        <span className="validation-status-pill">
          {isInvalid ? 'INVALID SCAN' : 'UNCERTAIN RESULT'}
        </span>
      </div>

      {/* Main Warning & Reason Box */}
      <div className="validation-gate-reason-box">
        <div className="validation-gate-reason-text">
          {result.reason || (isInvalid
            ? `This image does not match standard ${modalityName} radiologic criteria.`
            : 'Result uncertain — please upload a clearer image of the correct type.')}
        </div>
        <p className="validation-gate-guidance-subtext">
          {isInvalid
            ? 'Our neural gatekeeper filter prevents out-of-distribution or mismatched medical scans from producing misleading diagnostic predictions.'
            : 'The diagnostic model encountered borderline radiographic features below the required clinical certainty threshold (70.0%).'}
        </p>
      </div>

      {/* Confidence Scores Matrix (Logged and Displayed for Transparency) */}
      <div className="validation-scores-grid">
        <div className="validation-score-tile">
          <span className="validation-score-label">Gatekeeper Modality Validity</span>
          <div className="validation-score-value">
            {gatekeeperConf !== null ? `${gatekeeperConf}%` : 'N/A'}
          </div>
          <span className="validation-score-sub">
            {isInvalid ? 'Below 65% Modality Gate' : 'Verified In-Distribution'}
          </span>
        </div>

        <div className="validation-score-tile">
          <span className="validation-score-label">Diagnostic Softmax Confidence</span>
          <div className="validation-score-value">
            {diagnosticConf !== null ? `${diagnosticConf}%` : 'Bypassed (Fail-Fast)'}
          </div>
          <span className="validation-score-sub">
            {isInvalid ? 'Diagnostic Model Not Executed' : 'Below 70% Certainty Gate'}
          </span>
        </div>
      </div>

      {/* Image Preview & Retry Call-To-Action */}
      <div className="validation-preview-cta-row">
        {result.original_image && (
          <div className="validation-image-preview-container">
            <div className="validation-preview-label">
              <Eye size={12} style={{ display: 'inline', marginRight: '4px' }} />
              Uploaded Source Image
            </div>
            <img
              src={`data:image/jpeg;base64,${result.original_image}`}
              alt="Uploaded scan preview"
              className="validation-preview-img"
            />
          </div>
        )}

        <div className="validation-action-container">
          <div style={{ fontSize: '13.5px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '4px' }}>
            Recommended Next Step
          </div>
          <p style={{ fontSize: '12.5px', color: 'var(--text-secondary)', lineHeight: 1.4, margin: '0 0 12px 0' }}>
            Please verify the anatomical orientation and upload a clean, uncorrupted {modalityName} radiograph.
          </p>

          <button
            type="button"
            className="btn-swiss validation-retry-btn"
            onClick={onRetryUpload}
          >
            <RefreshCw size={15} className="spin-on-hover" />
            Try a Different Image
          </button>
        </div>
      </div>
    </div>
  );
};
