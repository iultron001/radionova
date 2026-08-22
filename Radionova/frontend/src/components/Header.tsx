import React from 'react';
import { Archive, MessageSquare, LogOut } from 'lucide-react';
import { DoctorProfile } from '../types';

interface HeaderProps {
  onOpenHistory: () => void;
  onOpenAssistant: () => void;
  reportCount: number;
  doctor?: DoctorProfile | null;
  onLogout?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  onOpenHistory,
  onOpenAssistant,
  reportCount,
  doctor,
  onLogout
}) => {
  return (
    <header className="app-header">
      {/* Brand Identity */}
      <div className="brand-group">
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <h1 className="brand-title">RadiNova AI</h1>
          <span className="tab-tag" style={{ background: 'var(--accent-light)', color: 'var(--accent-dark)', borderColor: 'var(--accent-subtle)', margin: 0 }}>
            CLINICAL v2.0
          </span>
        </div>
        <p className="brand-subtitle">
          Multi-Modal Diagnostic Intelligence & Decision Support System
        </p>
      </div>

      {/* Doctor Profile & Action Controls */}
      <div className="header-actions">
        {/* Attending Doctor Profile Badge */}
        {doctor && (
          <div className="doctor-profile-badge">
            <div className="doctor-avatar">{doctor.avatar}</div>
            <div className="doctor-details">
              <div className="doctor-name">{doctor.name}</div>
              <div className="doctor-meta">{doctor.role} • {doctor.licenseNumber}</div>
            </div>
            {onLogout && (
              <button 
                className="doctor-logout-btn" 
                onClick={onLogout}
                title="Sign out of Clinical Portal"
                aria-label="Sign out"
              >
                <LogOut size={13} />
              </button>
            )}
          </div>
        )}

        <button
          className="btn-swiss-outline"
          onClick={onOpenHistory}
          aria-label="Open Reports Archive"
        >
          <Archive size={13} />
          <span>Reports Archive ({reportCount})</span>
        </button>

        <button
          className="btn-swiss"
          onClick={onOpenAssistant}
          aria-label="Open Clinical AI Assistant"
        >
          <MessageSquare size={13} />
          <span>Clinical Assistant</span>
        </button>
      </div>
    </header>
  );
};
