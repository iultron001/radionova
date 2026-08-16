import React from 'react';
import { ModalityId, ModalityMeta } from '../types';

interface TabNavigationProps {
  activeTab: ModalityId;
  onSelectTab: (tab: ModalityId) => void;
}

export const MODALITIES: ModalityMeta[] = [
  {
    id: 'chest_xray',
    name: 'Chest X-Ray',
    category: 'CV_MODEL',
    badge: 'PRIORITY #1 • DENSENET-121',
    accepts: 'image/*',
    description: 'Deep Learning pneumonia detection (Normal vs Pneumonia) with Grad-CAM explainability heatmap.'
  },
  {
    id: 'blood',
    name: 'Blood Test',
    category: 'LLM_PIPELINE',
    badge: 'LLM EXPLANATION PIPELINE',
    accepts: '.pdf,.txt,.csv,image/*',
    description: 'Multi-parameter laboratory hematology and metabolic panel plain-language clinical interpretation.'
  },
  {
    id: 'limb_fracture',
    name: 'Limb (Fracture)',
    category: 'CV_MODEL',
    badge: 'PRIORITY #2 • DENSENET-121',
    accepts: 'image/*',
    description: 'Osseous disruption and cortical fracture detection with Grad-CAM focus mapping.'
  },
  {
    id: 'mri',
    name: 'MRI',
    category: 'LLM_PIPELINE',
    badge: 'LLM EXPLANATION PIPELINE',
    accepts: '.pdf,.txt,image/*',
    description: 'Multi-sequence Magnetic Resonance Imaging structural scan interpretation and plain-language summary.'
  },
  {
    id: 'ecg',
    name: 'ECG',
    category: 'LLM_PIPELINE',
    badge: 'LLM EXPLANATION PIPELINE',
    accepts: '.pdf,.txt,image/*',
    description: '12-Lead Electrocardiogram rhythm, conduction interval, and ST-T segment morphological review.'
  },
  {
    id: 'ct',
    name: 'CT Scan',
    category: 'LLM_PIPELINE',
    badge: 'LLM EXPLANATION PIPELINE',
    accepts: '.pdf,.txt,image/*',
    description: 'Cross-sectional computed tomography attenuation and soft-tissue anatomical review.'
  }
];

export const TabNavigation: React.FC<TabNavigationProps> = ({ activeTab, onSelectTab }) => {
  return (
    <nav className="tab-nav" aria-label="Diagnostic Modality Navigation">
      {MODALITIES.map((mod, index) => {
        const isActive = activeTab === mod.id;
        return (
          <button
            key={mod.id}
            className={`tab-btn ${isActive ? 'active' : ''}`}
            onClick={() => onSelectTab(mod.id)}
          >
            <div className="tab-num">MODALITY 0{index + 1}</div>
            <div className="tab-label">{mod.name}</div>
            <div className="tab-tag">
              {mod.category === 'CV_MODEL' ? 'CV MODEL' : 'LLM MODALITY'}
            </div>
          </button>
        );
      })}
    </nav>
  );
};
