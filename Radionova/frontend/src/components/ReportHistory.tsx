import React from 'react';
import { Download, FileText, Trash2, X } from 'lucide-react';
import { ReportRecord } from '../types';

interface ReportHistoryProps {
  isOpen: boolean;
  onClose: () => void;
  history: ReportRecord[];
  onDownloadPdf: (record: ReportRecord) => void;
  onClearHistory: () => void;
}

export const ReportHistory: React.FC<ReportHistoryProps> = ({
  isOpen,
  onClose,
  history,
  onDownloadPdf,
  onClearHistory
}) => {
  if (!isOpen) return null;

  return (
    <div className="history-drawer">
      <div style={{
        background: 'var(--bg-dark)',
        color: 'var(--text-inverse)',
        padding: '16px 20px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <FileText size={16} />
          <span style={{ fontSize: '13px', fontWeight: 750, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
            Diagnostic Study Archive
          </span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {history.length > 0 && (
            <button 
              onClick={onClearHistory}
              style={{ background: 'none', border: 'none', color: '#DDD', cursor: 'pointer' }}
              title="Clear Study History"
            >
              <Trash2 size={15} />
            </button>
          )}
          <button 
            onClick={onClose} 
            style={{ background: 'none', border: 'none', color: '#FFF', cursor: 'pointer' }}
          >
            <X size={18} />
          </button>
        </div>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: '20px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {history.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--text-muted)', fontSize: '12.5px' }}>
            No archived clinical reports in this session yet. Completed analyses will appear here.
          </div>
        ) : (
          history.map((item) => (
            <div 
              key={item.id} 
              style={{
                border: '1px solid var(--border-medium)',
                background: 'var(--bg-card)',
                padding: '16px',
                borderRadius: 'var(--radius-sm)',
                display: 'flex',
                flexDirection: 'column',
                gap: '8px',
                boxShadow: 'var(--shadow-sm)'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <span className="tab-tag" style={{ background: 'var(--accent-light)', color: 'var(--accent-dark)', borderColor: 'var(--accent-subtle)' }}>
                    {item.modality.toUpperCase()}
                  </span>
                  <div style={{ fontSize: '13px', fontWeight: 750, marginTop: '6px', color: 'var(--text-primary)' }}>
                    {item.predictionOrSummary}
                  </div>
                </div>
                <span style={{ fontSize: '10.5px', color: 'var(--text-muted)' }}>{item.timestamp}</span>
              </div>

              <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)' }}>
                Confidence / Triage: <span style={{ color: 'var(--accent)', fontWeight: 700 }}>{item.confidenceOrTriage}</span>
              </div>

              <button
                className="btn-swiss-outline"
                style={{ alignSelf: 'flex-start', display: 'flex', alignItems: 'center', gap: '6px', marginTop: '6px' }}
                onClick={() => onDownloadPdf(item)}
              >
                <Download size={12} />
                Download PDF Report
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
