import React from 'react';
import { ModalityId } from '../types';
import { 
  Activity, 
  Droplet, 
  Bone, 
  Brain, 
  Ribbon,
  X,
  LucideIcon
} from 'lucide-react';

interface TabNavigationProps {
  activeTab: ModalityId;
  onSelectTab: (tab: ModalityId) => void;
  isDrawer?: boolean;
  onCloseDrawer?: () => void;
}

interface ModalityTabConfig {
  id: ModalityId;
  num: string;
  label: string;
  tag: string;
  icon: LucideIcon;
}

export const MODALITY_CONFIGS: ModalityTabConfig[] = [
  { id: 'chest_xray', num: '01', label: 'Chest Radiography', tag: 'CV Model', icon: Activity },
  { id: 'limb_fracture', num: '02', label: 'Limb & Bone Fracture', tag: 'CV Model', icon: Bone },
  { id: 'mri', num: '03', label: 'Brain MRI Neuro', tag: 'CV Model', icon: Brain },
  { id: 'blood', num: '04', label: 'Hematology & Blood', tag: 'LLM Parser', icon: Droplet },
  { id: 'breast_cancer', num: '05', label: 'Breast Cancer Screening', tag: 'CV Model', icon: Ribbon },
];

export const TabNavigation: React.FC<TabNavigationProps> = ({
  activeTab,
  onSelectTab,
  isDrawer = false,
  onCloseDrawer
}) => {
  return (
    <nav className="vertical-sidebar-nav" aria-label="Clinical Modalities Navigation">
      <div className="sidebar-nav-header">
        <span className="sidebar-nav-title">Diagnostic Suites</span>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span className="sidebar-nav-count">5 Modalities</span>
          {isDrawer && onCloseDrawer && (
            <button 
              onClick={onCloseDrawer}
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}
            >
              <X size={18} />
            </button>
          )}
        </div>
      </div>

      <div className="sidebar-nav-list">
        {MODALITY_CONFIGS.map((item) => {
          const isActive = activeTab === item.id;
          const Icon = item.icon;

          return (
            <button
              key={item.id}
              className={`sidebar-tab-btn ${isActive ? 'active' : ''}`}
              onClick={() => {
                onSelectTab(item.id);
                if (isDrawer && onCloseDrawer) onCloseDrawer();
              }}
              aria-selected={isActive}
              role="tab"
            >
              <div className="sidebar-tab-left">
                <span className="sidebar-tab-num">{item.num}</span>
                <div className={`sidebar-tab-icon-wrap ${isActive ? 'active' : ''}`}>
                  <Icon size={18} />
                </div>
              </div>

              <div className="sidebar-tab-content">
                <span className="sidebar-tab-label">{item.label}</span>
                <span className={`sidebar-tab-tag ${isActive ? 'active' : ''}`}>
                  {item.tag}
                </span>
              </div>
            </button>
          );
        })}
      </div>
    </nav>
  );
};
