import React from 'react';
import { 
  Activity, 
  LayoutDashboard, 
  FolderGit2, 
  FileText, 
  Sliders,
  LogOut
} from 'lucide-react';
import { PageId, DoctorProfile } from '../types';

interface NavbarProps {
  activePage: PageId;
  onSelectPage: (page: PageId) => void;
  reportCount: number;
  doctor: DoctorProfile;
  onLogout: () => void;
  hasActiveResult?: boolean;
}

export const Navbar: React.FC<NavbarProps> = ({
  activePage,
  onSelectPage,
  doctor,
  onLogout,
}) => {
  return (
    <header className="radinova-topbar">
      {/* Brand Identity */}
      <div className="radinova-brand" onClick={() => onSelectPage('dashboard')}>
        <div className="brand-icon-wrap">
          <Activity size={20} />
        </div>
        <div className="brand-info">
          <span className="brand-title">RadiNova AI</span>
          <span className="brand-subtitle">Clinical Decision Support</span>
        </div>
      </div>

      {/* Center Pill Navigation */}
      <nav className="topbar-pill-nav">
        <button
          className={`topbar-pill-tab ${activePage === 'dashboard' ? 'active' : ''}`}
          onClick={() => onSelectPage('dashboard')}
        >
          <LayoutDashboard size={14} />
          <span>Dashboard</span>
        </button>

        <button
          className={`topbar-pill-tab ${activePage === 'studio' ? 'active' : ''}`}
          onClick={() => onSelectPage('studio')}
        >
          <FolderGit2 size={14} />
          <span>Studies & Studio</span>
        </button>

        <button
          className={`topbar-pill-tab ${activePage === 'archive' ? 'active' : ''}`}
          onClick={() => onSelectPage('archive')}
        >
          <FileText size={14} />
          <span>Reports</span>
        </button>

        <button
          className={`topbar-pill-tab ${activePage === 'protocols' ? 'active' : ''}`}
          onClick={() => onSelectPage('protocols')}
        >
          <Sliders size={14} />
          <span>Protocols</span>
        </button>
      </nav>

      {/* Right Controls: Doctor Profile & Sign Out */}
      <div className="topbar-actions" style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <div className="doctor-profile-chip" title={`${doctor.name} (${doctor.role}) • ${doctor.department}`}>
          <div className="doctor-avatar-circle">
            {doctor.avatar || 'DR'}
          </div>
          <div className="doctor-meta-text">
            <span className="doctor-name-text">{doctor.name}</span>
            <span className="doctor-role-text">{doctor.role.split('&')[0].trim()}</span>
          </div>
        </div>

        <button
          onClick={onLogout}
          style={{
            background: 'rgba(239, 68, 68, 0.08)',
            border: '1px solid rgba(239, 68, 68, 0.25)',
            color: '#f87171',
            borderRadius: '8px',
            padding: '6px 12px',
            fontSize: '12.5px',
            fontWeight: 650,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            transition: 'all 0.2s ease'
          }}
          onMouseEnter={e => {
            e.currentTarget.style.background = 'rgba(239, 68, 68, 0.16)';
            e.currentTarget.style.borderColor = '#ef4444';
          }}
          onMouseLeave={e => {
            e.currentTarget.style.background = 'rgba(239, 68, 68, 0.08)';
            e.currentTarget.style.borderColor = 'rgba(239, 68, 68, 0.25)';
          }}
          title="Sign out to Home / Guest mode"
        >
          <LogOut size={13} />
          <span>Sign Out</span>
        </button>
      </div>
    </header>
  );
};
