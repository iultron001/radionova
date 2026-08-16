import React from 'react';
import { Activity, FileText, MessageSquare } from 'lucide-react';

interface HeaderProps {
  onToggleHistory: () => void;
  onToggleChat: () => void;
  historyCount: number;
}

export const Header: React.FC<HeaderProps> = ({ onToggleHistory, onToggleChat, historyCount }) => {
  return (
    <>
      {/* Permanent Mandatory Safety Notice */}
      <div className="disclaimer-banner">
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <span className="disclaimer-badge">MANDATORY NOTICE</span>
          <span>For educational / research purposes only — not a substitute for professional medical diagnosis.</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Activity size={14} />
          <span>ACADEMIC PROTOTYPE v1.0</span>
        </div>
      </div>

      <header className="app-header">
        <div>
          <h1 className="brand-title">RadiNova AI</h1>
          <p className="brand-subtitle">Clinical Decision Support & Diagnostic Imaging System</p>
        </div>

        <div className="header-actions">
          <button 
            className="btn-swiss-outline" 
            onClick={onToggleHistory}
            style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
          >
            <FileText size={14} />
            Reports Archive ({historyCount})
          </button>
          <button 
            className="btn-swiss" 
            onClick={onToggleChat}
            style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
          >
            <MessageSquare size={14} />
            Clinical Assistant
          </button>
        </div>
      </header>
    </>
  );
};
