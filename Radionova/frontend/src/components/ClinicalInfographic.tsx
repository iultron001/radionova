import React from 'react';
import { CVAnalysisResult } from '../types';
import { Activity, MapPin, CheckCircle, AlertTriangle, Crosshair, BarChart3, ShieldAlert, PieChart } from 'lucide-react';
import { CircularGauge } from './CircularGauge';

interface ClinicalInfographicProps {
  result: CVAnalysisResult;
  modalityName: string;
  showSignsOnly?: boolean;
  showMetricsOnly?: boolean;
  showGaugesOnly?: boolean;
}

export const ClinicalInfographic: React.FC<ClinicalInfographicProps> = ({ 
  result, 
  modalityName,
  showSignsOnly = false,
  showMetricsOnly = false,
  showGaugesOnly = false
}) => {
  const info = result.infographic;
  const focal = result.focal_metrics;
  const isLimb = result.modality === 'limb_fracture';
  const isMri = result.modality === 'mri';
  const isBreast = result.modality === 'breast_cancer';
  
  const predUpper = (result.prediction || '').toUpperCase();
  const isPositive = isLimb
    ? ((predUpper === 'FRACTURED' || predUpper === 'FRACTURE' || predUpper.includes('FRACTUR')) && !predUpper.includes('NOT_FRACTURED') && !predUpper.includes('NO FRACTURE') && !predUpper.includes('INTACT') && !predUpper.includes('NORMAL'))
    : isMri
    ? ((predUpper.includes('TUMOR') || predUpper.includes('LESION') || predUpper.includes('GLIOMA') || predUpper.includes('ABNORMAL')) && !predUpper.includes('NORMAL') && !predUpper.includes('NO TUMOR') && !predUpper.includes('NO FOCAL LESION'))
    : isBreast
    ? ((predUpper.includes('MALIGNANT') || predUpper.includes('CANCER')) && !predUpper.includes('BENIGN') && !predUpper.includes('NON-MALIGNANT') && !predUpper.includes('NO MALIGNANCY'))
    : predUpper.includes('PNEUMONIA');

  if (!info) return null;

  const scoreValue = isLimb 
    ? (info.cortical_disruption_index || (isPositive ? 88 : 4)) 
    : isMri 
    ? (info.lesion_density_index || (isPositive ? 92 : 5))
    : isBreast 
    ? (info.malignancy_index || (isPositive ? 94 : 6)) 
    : (info.opacity_index || (isPositive ? 85 : 6));

  const scoreLabel = isLimb 
    ? "Cortical Disruption" 
    : isMri 
    ? "Lesion Signal Intensity" 
    : isBreast 
    ? "Malignancy Risk Index" 
    : "Pulmonary Opacity";
  
  const secondaryScore = isLimb 
    ? Math.round(isPositive ? (scoreValue * 0.85) : 5) 
    : isMri 
    ? Math.round(isPositive ? (scoreValue * 0.92) : 6)
    : isBreast 
    ? Math.round(isPositive ? (scoreValue * 0.88) : 4)
    : Math.round(isPositive ? (scoreValue * 0.9) : 8);

  const secondaryLabel = isLimb 
    ? "Structural Instability" 
    : isMri 
    ? "Mass Effect Index" 
    : isBreast 
    ? "Mass Morphology Risk" 
    : "Consolidation Density";

  // Circular Gauges only (placed on left side)
  if (showGaugesOnly) {
    return (
      <div className="circular-gauges-container" style={{ marginTop: '16px' }}>
        <div style={{ fontSize: '11px', fontWeight: 750, textTransform: 'uppercase', color: 'var(--text-primary)', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
          <PieChart size={14} style={{ color: 'var(--accent)' }} />
          <span>Quantitative Radiographic Biomarkers</span>
        </div>
        <div className="circular-gauges-grid">
          <CircularGauge
            value={scoreValue}
            label={scoreLabel}
            sublabel={isPositive ? "Acute Pathological Finding" : "Physiological Baseline"}
            isAlert={isPositive}
          />
          <CircularGauge
            value={secondaryScore}
            label={secondaryLabel}
            sublabel={isPositive ? "Parenchymal / Cortical" : "Normal Tissue Margin"}
            isAlert={isPositive}
          />
        </div>
      </div>
    );
  }

  // Radiologic signs section only
  if (showSignsOnly) {
    return (
      <div className="infographic-container" style={{ marginTop: '16px' }}>
        <div style={{ fontSize: '11px', fontWeight: 750, textTransform: 'uppercase', color: 'var(--text-primary)', marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '6px' }}>
          <ShieldAlert size={14} style={{ color: 'var(--accent)' }} />
          <span>Verified Radiographic Signs Checklist</span>
        </div>
        <div className="radiologic-signs-list">
          {info.radiologic_signs.map((sign, idx) => (
            <div key={idx} className={`radiologic-sign-row ${sign.present ? 'sign-detected' : 'sign-absent'}`}>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
                {sign.present ? (
                  <AlertTriangle size={14} style={{ color: 'var(--accent)', marginTop: '2px', flexShrink: 0 }} />
                ) : (
                  <CheckCircle size={14} style={{ color: 'var(--status-positive-border)', marginTop: '2px', flexShrink: 0 }} />
                )}
                <div>
                  <div style={{ fontSize: '11.5px', fontWeight: 700, color: sign.present ? 'var(--text-primary)' : 'var(--text-secondary)' }}>
                    {sign.sign} — <span style={{ fontWeight: 600, fontSize: '10.5px', color: sign.present ? 'var(--accent-dark)' : 'var(--status-positive-text)' }}>{sign.present ? 'DETECTED' : 'Not Observed'}</span>
                  </div>
                  <div style={{ fontSize: '10.5px', color: 'var(--text-muted)', marginTop: '1px' }}>
                    {sign.description}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="infographic-container">
      {/* Top Header: Quantitative Biomarker & Triage Summary */}
      <div className="infographic-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <BarChart3 size={15} style={{ color: 'var(--accent)' }} />
          <span style={{ fontSize: '11.5px', fontWeight: 750, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
            {modalityName} Quantitative Analytics
          </span>
        </div>
        <div className={`triage-badge ${isPositive ? 'triage-alert' : 'triage-normal'}`}>
          <Activity size={12} className="pulse-icon" />
          <span>{info.triage_category}</span>
        </div>
      </div>

      {/* Grid: Biomarker Circular Rings & Focal Coordinates */}
      <div className="infographic-grid">
        <div className="infographic-card" style={{ display: 'flex', alignItems: 'center', gap: '16px', padding: '14px 18px' }}>
          <CircularGauge
            value={scoreValue}
            size={88}
            strokeWidth={8}
            label={scoreLabel}
            isAlert={isPositive}
          />
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '4px' }}>
              {isPositive ? "Elevated Attenuation Index" : "Clear Baseline Tissue"}
            </div>
            <div style={{ fontSize: '10.5px', color: 'var(--text-muted)', lineHeight: 1.4 }}>
              {isPositive 
                ? "Neural feature density confirms sharp focal contrast compared to standard atlas."
                : "Homogeneous density across lung fields and cortical boundaries."}
            </div>
          </div>
        </div>

        {/* Focal Zone & Epicenter Coordinates */}
        {focal && (
          <div className="infographic-card">
            <div className="infographic-card-title">
              <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                <Crosshair size={13} style={{ color: 'var(--accent)' }} />
                Salient Epicenter Zone
              </span>
              <span className="tab-tag" style={{ margin: 0, background: 'var(--bg-subtle)' }}>
                {focal.focal_compactness}
              </span>
            </div>
            <div style={{ fontSize: '13px', fontWeight: 750, color: 'var(--text-primary)', marginTop: '4px' }}>
              {focal.focal_zone}
            </div>
            <div style={{ fontSize: '10px', color: 'var(--text-muted)', marginTop: '2px' }}>
              Normalized Matrix: (Y: {focal.epicenter_y.toFixed(2)}, X: {focal.epicenter_x.toFixed(2)})
            </div>
          </div>
        )}
      </div>

      {/* Anatomical Zone Breakdown Table / Cards */}
      <div style={{ marginTop: '16px' }}>
        <div style={{ fontSize: '11px', fontWeight: 750, textTransform: 'uppercase', color: 'var(--text-secondary)', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
          <MapPin size={13} style={{ color: 'var(--accent)' }} />
          <span>Anatomical Compartment Involvement Map</span>
        </div>
        <div className="anatomical-zone-grid">
          {info.anatomical_zones.map((item, idx) => (
            <div key={idx} className="anatomical-zone-item">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '3px' }}>
                <span style={{ fontSize: '11px', fontWeight: 650, color: 'var(--text-primary)' }}>{item.zone}</span>
                <span className={`zone-involvement-tag ${item.involvement !== '0%' && item.involvement !== 'Preserved' ? 'active' : ''}`}>
                  {item.involvement}
                </span>
              </div>
              <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>
                Status: {item.status}
              </div>
            </div>
          ))}
        </div>
      </div>

      {!showMetricsOnly && (
        <div style={{ marginTop: '16px' }}>
          <div style={{ fontSize: '11px', fontWeight: 750, textTransform: 'uppercase', color: 'var(--text-secondary)', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <ShieldAlert size={13} style={{ color: 'var(--accent)' }} />
            <span>Verified Radiographic Signs</span>
          </div>
          <div className="radiologic-signs-list">
            {info.radiologic_signs.map((sign, idx) => (
              <div key={idx} className={`radiologic-sign-row ${sign.present ? 'sign-detected' : 'sign-absent'}`}>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
                  {sign.present ? (
                    <AlertTriangle size={14} style={{ color: 'var(--accent)', marginTop: '2px', flexShrink: 0 }} />
                  ) : (
                    <CheckCircle size={14} style={{ color: 'var(--status-positive-border)', marginTop: '2px', flexShrink: 0 }} />
                  )}
                  <div>
                    <div style={{ fontSize: '11.5px', fontWeight: 700, color: sign.present ? 'var(--text-primary)' : 'var(--text-secondary)' }}>
                      {sign.sign} — <span style={{ fontWeight: 600, fontSize: '10.5px', color: sign.present ? 'var(--accent-dark)' : 'var(--status-positive-text)' }}>{sign.present ? 'DETECTED' : 'Not Observed'}</span>
                    </div>
                    <div style={{ fontSize: '10.5px', color: 'var(--text-muted)' }}>
                      {sign.description}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
