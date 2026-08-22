import React from 'react';
import { 
  Plus, 
  LayoutDashboard, 
  FolderGit2, 
  FileText, 
  MessageSquare,
  Sliders, 
  LogOut 
} from 'lucide-react';
import { PageId } from '../types';

interface SidebarProps {
  activePage: PageId;
  onSelectPage: (page: PageId) => void;
  onNewStudyClick: () => void;
  onLogout: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activePage,
  onSelectPage,
  onNewStudyClick,
  onLogout
}) => {
  return (
    <aside className="radinova-sidebar">
      <div className="sidebar-top">
        {/* + New Study Button */}
        <button className="btn-new-study" onClick={onNewStudyClick}>
          <Plus size={16} />
          <span>New Study</span>
        </button>

        {/* Primary Navigation Links */}
        <nav className="sidebar-nav-list">
          <button
            className={`sidebar-nav-item ${activePage === 'dashboard' ? 'active' : ''}`}
            onClick={() => onSelectPage('dashboard')}
          >
            <LayoutDashboard size={17} />
            <span>Dashboard</span>
          </button>

          <button
            className={`sidebar-nav-item ${activePage === 'studio' ? 'active' : ''}`}
            onClick={() => onSelectPage('studio')}
          >
            <FolderGit2 size={17} />
            <span>My Studies</span>
          </button>

          <button
            className={`sidebar-nav-item ${activePage === 'archive' ? 'active' : ''}`}
            onClick={() => onSelectPage('archive')}
          >
            <FileText size={17} />
            <span>Reports Archive</span>
          </button>

          <button
            className={`sidebar-nav-item ${activePage === 'assistant' ? 'active' : ''}`}
            onClick={() => onSelectPage('assistant')}
          >
            <MessageSquare size={17} />
            <span>AI Consultation</span>
          </button>

          <button
            className={`sidebar-nav-item ${activePage === 'protocols' ? 'active' : ''}`}
            onClick={() => onSelectPage('protocols')}
          >
            <Sliders size={17} />
            <span>Protocols & Specs</span>
          </button>
        </nav>
      </div>

      {/* Bottom Logout */}
      <div className="sidebar-bottom">
        <button className="sidebar-logout-item" onClick={onLogout}>
          <LogOut size={16} />
          <span>Sign Out</span>
        </button>
      </div>
    </aside>
  );
};
