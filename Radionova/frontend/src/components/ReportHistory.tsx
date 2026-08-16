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
    <div style={{
      position: 'fixed',
      top: 0,
      right: 0,
      bottom: 0,
      width: '420px',
      background: 'var(--bg-card)',
      borderLeft: '2px solid var(--text-primary)',
      zIndex: 1100,
      boxShadow: '-10px 0 30px rgba(0,0,0,0.15)',
      display: 'flex',
      flexDirection: 'column'
    }}>
      <div style={{
        background: 'var(--text-primary)',
        color: 'var(--text-inverse)',
        padding: '16px 20px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <FileText size={16} />
          <span style={{ fontSize: '13px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Clinical Reports Archive
          </span>
        </div>
        <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#FFF', cursor: 'pointer' }}>
          <X size={18} />
        </button>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: '20px' }}>
        {history.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--text-muted)' }}>
            <FileText size={32} style={{ marginBottom: '12px', opacity: 0.4 }} />
            <div style={{ fontSize: '13px', fontWeight: 700, textTransform: 'uppercase', marginBottom: '4px' }}>
              No Studies Recorded
            </div>
            <p style={{ fontSize: '12px' }}>Upload and analyze an imaging study or lab panel to generate clinical records.</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            {history.map(item => (
              <div 
                key={item.id} 
                style={{
                  border: '1px solid var(--border-medium)',
                  background: 'var(--bg-main)',
                  padding: '14px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '8px'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div>
                    <span className="tab-tag" style={{ background: 'var(--text-primary)', color: '#FFF', border: 'none' }}>
                      {item.modality.replace('_', ' ').toUpperCase()}
                    </span>
                    <div style={{ fontSize: '13px', fontWeight: 800, marginTop: '4px' }}>{item.title}</div>
                  </div>
                  <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>{item.timestamp}</span>
                </div>

                {item.prediction && (
                  <div style={{ fontSize: '12px', fontWeight: 600 }}>
                    Result: <span style={{ color: 'var(--accent)' }}>{item.prediction}</span> 
                    {item.confidence !== undefined && ` (${(item.confidence * 100).toFixed(1)}%)`}
                  </div>
                )}

                <button
                  className="btn-swiss-outline"
                  style={{ alignSelf: 'flex-start', display: 'flex', alignItems: 'center', gap: '6px', marginTop: '4px' }}
                  onClick={() => onDownloadPdf(item)}
                >
                  <Download size={12} />
                  Download Clinical PDF
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {history.length > 0 && (
        <div style={{ padding: '16px 20px', borderTop: '1px solid var(--border-medium)', background: 'var(--bg-subtle)', display: 'flex', justifyContent: 'flex-end' }}>
          <button 
            onClick={onClearHistory} 
            className="btn-swiss-outline" 
            style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '10px' }}
          >
            <Trash2 size={12} />
            Clear Archive
          </button>
        </div>
      )}
    </div>
  );
};
