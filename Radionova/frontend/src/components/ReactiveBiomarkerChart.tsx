import React, { useState } from 'react';
import { ReportParameterItem } from '../types';
import { Activity, Sliders, Layers } from 'lucide-react';

interface ReactiveBiomarkerChartProps {
  parameters?: ReportParameterItem[];
  modality: string;
}

interface OrganMetric {
  system: string;
  score: number; // 0 to 100
  status: 'OPTIMAL' | 'MODERATE' | 'ALERT';
  markers: string;
}

export const ReactiveBiomarkerChart: React.FC<ReactiveBiomarkerChartProps> = ({
  parameters = [],
  modality
}) => {
  const [activeTab, setActiveTab] = useState<'spectrum' | 'systems'>('spectrum');
  const [hoveredParam, setHoveredParam] = useState<string | null>(null);

  // Generate dynamic organ system distribution metrics based on parameters or modality
  const getOrganMetrics = (): OrganMetric[] => {
    if (modality.toLowerCase().includes('blood') || modality.toLowerCase().includes('hematology')) {
      return [
        { system: 'Hematologic & Oxygenation', score: 94, status: 'OPTIMAL', markers: 'RBC, Hb, Hct' },
        { system: 'Immune & Inflammatory', score: 76, status: 'MODERATE', markers: 'WBC, Lymphocytes, CRP' },
        { system: 'Renal & Fluid Clearance', score: 92, status: 'OPTIMAL', markers: 'BUN, Creatinine, eGFR' },
        { system: 'Electrolyte & Osmotic Balance', score: 96, status: 'OPTIMAL', markers: 'Na+, K+, Cl-, CO2' },
        { system: 'Hemostasis & Platelets', score: 90, status: 'OPTIMAL', markers: 'Platelet Count, MPV' }
      ];
    } else if (modality.toLowerCase().includes('mri') || modality.toLowerCase().includes('brain')) {
      return [
        { system: 'Cerebral Parenchymal Volume', score: 95, status: 'OPTIMAL', markers: 'Cortical Gray / White Matter' },
        { system: 'Vascular & Perfusion Signal', score: 88, status: 'OPTIMAL', markers: 'DWI / MRA Flow Voids' },
        { system: 'Ventricular & CSF Clearance', score: 92, status: 'OPTIMAL', markers: 'Lateral / 3rd Ventricles' },
        { system: 'White Matter Tract Integrity', score: 82, status: 'MODERATE', markers: 'T2-FLAIR Subcortical' }
      ];
    } else if (modality.toLowerCase().includes('ecg') || modality.toLowerCase().includes('cardiac')) {
      return [
        { system: 'Sinus Rhythm & Chronotropy', score: 92, status: 'OPTIMAL', markers: 'P-Wave, R-R Regularity' },
        { system: 'Ventricular Depolarization', score: 90, status: 'OPTIMAL', markers: 'QRS Axis & Duration (<120ms)' },
        { system: 'Myocardial Repolarization', score: 85, status: 'MODERATE', markers: 'ST Elevation / T Inversion' },
        { system: 'AV Nodal Conduction', score: 95, status: 'OPTIMAL', markers: 'PR Interval (120-200ms)' }
      ];
    } else {
      return [
        { system: 'Tissue Attenuation Density', score: 90, status: 'OPTIMAL', markers: 'Hounsfield Units Profile' },
        { system: 'Anatomical Symmetry', score: 94, status: 'OPTIMAL', markers: 'Axial / Coronal Planes' },
        { system: 'Focal Lesion Demarcation', score: 86, status: 'OPTIMAL', markers: 'Soft Tissue Margin' }
      ];
    }
  };

  const organMetrics = getOrganMetrics();

  // Helper to calculate relative spectrum position (0% = low, 50% = middle of normal range, 100% = high)
  const getSpectrumPosition = (param: ReportParameterItem): number => {
    if (param.status === 'NORMAL') return 50;
    if (param.status === 'HIGH' || param.status === 'ALERT' || param.status.includes('ELEVATED')) return 85;
    return 15;
  };

  return (
    <div className="reactive-chart-container">
      {/* Chart Header & Mode Toggle */}
      <div className="reactive-chart-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '7px' }}>
          <Activity size={15} style={{ color: 'var(--accent)' }} />
          <span style={{ fontSize: '11px', fontWeight: 750, textTransform: 'uppercase', letterSpacing: '0.04em', color: 'var(--text-primary)' }}>
            Reactive Physiological Spectrum
          </span>
        </div>

        <div className="reactive-chart-toggle">
          <button
            className={`chart-tab-btn ${activeTab === 'spectrum' ? 'active' : ''}`}
            onClick={() => setActiveTab('spectrum')}
          >
            <Sliders size={11} />
            <span>Biomarker Range</span>
          </button>
          <button
            className={`chart-tab-btn ${activeTab === 'systems' ? 'active' : ''}`}
            onClick={() => setActiveTab('systems')}
          >
            <Layers size={11} />
            <span>System Balance</span>
          </button>
        </div>
      </div>

      {/* Mode 1: Interactive Biomarker Range Spectrum */}
      {activeTab === 'spectrum' && (
        <div className="spectrum-list">
          {parameters.length === 0 ? (
            <div style={{ fontSize: '11px', color: 'var(--text-muted)', textAlign: 'center', padding: '16px' }}>
              Standard physiological baseline parameters mapped to clinical reference ranges.
            </div>
          ) : (
            parameters.slice(0, 6).map((param, idx) => {
              const pos = getSpectrumPosition(param);
              const isAlert = param.status !== 'NORMAL';

              return (
                <div
                  key={idx}
                  className={`spectrum-item ${hoveredParam === param.name ? 'hovered' : ''}`}
                  onMouseEnter={() => setHoveredParam(param.name)}
                  onMouseLeave={() => setHoveredParam(null)}
                >
                  <div className="spectrum-item-info">
                    <span className="spectrum-param-name">{param.name}</span>
                    <span className="spectrum-param-value">
                      <strong>{param.value}</strong> {param.unit}
                    </span>
                  </div>

                  {/* Tri-Zone Interactive Spectrum Bar (Low | Normal Safe Zone | High) */}
                  <div className="spectrum-track-wrapper">
                    <div className="spectrum-track">
                      <div className="zone zone-low" title="Sub-optimal / Low" />
                      <div className="zone zone-normal" title="Normal Physiological Window" />
                      <div className="zone zone-high" title="Elevated / High" />
                    </div>

                    {/* Animated Cursor Marker */}
                    <div
                      className={`spectrum-indicator ${isAlert ? 'alert' : 'normal'}`}
                      style={{ left: `${pos}%` }}
                    >
                      <div className="indicator-dot" />
                      <div className="indicator-tooltip">
                        Ref: {param.reference}
                      </div>
                    </div>
                  </div>

                  <div className="spectrum-labels">
                    <span>Low</span>
                    <span className="safe-window-text">Standard Normal Range ({param.reference})</span>
                    <span>High</span>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {/* Mode 2: Multi-Organ System Balance Distribution */}
      {activeTab === 'systems' && (
        <div className="system-metrics-list">
          {organMetrics.map((om, idx) => (
            <div key={idx} className="system-metric-row">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                <div>
                  <span style={{ fontSize: '11.5px', fontWeight: 700, color: 'var(--text-primary)' }}>
                    {om.system}
                  </span>
                  <span style={{ fontSize: '10px', color: 'var(--text-muted)', marginLeft: '8px' }}>
                    ({om.markers})
                  </span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span style={{ fontSize: '11px', fontWeight: 800, color: om.status === 'OPTIMAL' ? 'var(--status-positive-text)' : 'var(--accent)' }}>
                    {om.score}%
                  </span>
                  <span className={`status-pill ${om.status === 'OPTIMAL' ? 'normal' : 'alert'}`}>
                    {om.status}
                  </span>
                </div>
              </div>

              <div className="progress-track" style={{ height: '6px' }}>
                <div
                  className="progress-fill animated-bar"
                  style={{
                    width: `${om.score}%`,
                    backgroundColor: om.status === 'OPTIMAL' ? 'var(--status-positive-border)' : 'var(--accent)'
                  }}
                />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
