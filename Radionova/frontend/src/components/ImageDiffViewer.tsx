import React, { useState } from 'react';
import { Eye, Layers, Sliders } from 'lucide-react';

interface ImageDiffViewerProps {
  originalImage: string;
  gradcamOverlay: string;
  modality: string;
}

export const ImageDiffViewer: React.FC<ImageDiffViewerProps> = ({
  originalImage,
  gradcamOverlay,
  modality
}) => {
  const [viewMode, setViewMode] = useState<'gradcam' | 'original' | 'split'>('gradcam');
  const [opacity, setOpacity] = useState<number>(0.85);

  return (
    <div>
      <div className="viewer-container">
        {viewMode !== 'split' ? (
          <div className="viewer-crossfade-stage">
            {/* Base Original Radiograph */}
            <img 
              src={originalImage} 
              alt={`Original ${modality}`} 
              className="viewer-crossfade-img"
              style={{ opacity: 1, zIndex: 1 }}
            />
            {/* Grad-CAM Heatmap Layer with Smooth 350ms Crossfade */}
            <img 
              src={gradcamOverlay} 
              alt={`Grad-CAM Overlay ${modality}`} 
              className="viewer-crossfade-img"
              style={{
                opacity: viewMode === 'gradcam' ? 1 : 0,
                zIndex: 2,
                pointerEvents: 'none'
              }}
            />
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', width: '100%', padding: '16px', alignItems: 'center' }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                Original Radiograph
              </div>
              <img 
                src={originalImage} 
                alt="Original Base" 
                className="viewer-img" 
                style={{ width: '100%', maxHeight: '380px', objectFit: 'contain' }}
              />
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '11px', fontWeight: 600, color: 'var(--accent)', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                Grad-CAM Activation Map
              </div>
              <img 
                src={gradcamOverlay} 
                alt="Grad-CAM Layer" 
                className="viewer-img" 
                style={{ width: '100%', maxHeight: '380px', objectFit: 'contain', opacity: opacity }}
              />
            </div>
          </div>
        )}
      </div>

      <div className="viewer-controls">
        <div className="view-toggle">
          <button
            className={`toggle-btn ${viewMode === 'gradcam' ? 'active' : ''}`}
            onClick={() => setViewMode('gradcam')}
          >
            <Layers size={12} style={{ display: 'inline', marginRight: '4px' }} />
            Grad-CAM Heatmap
          </button>
          <button
            className={`toggle-btn ${viewMode === 'original' ? 'active' : ''}`}
            onClick={() => setViewMode('original')}
          >
            <Eye size={12} style={{ display: 'inline', marginRight: '4px' }} />
            Original Radiograph
          </button>
          <button
            className={`toggle-btn ${viewMode === 'split' ? 'active' : ''}`}
            onClick={() => setViewMode('split')}
          >
            <Sliders size={12} style={{ display: 'inline', marginRight: '4px' }} />
            Side-by-Side
          </button>
        </div>

        {viewMode === 'split' && (
          <div className="opacity-slider-group">
            <span>Alpha: {Math.round(opacity * 100)}%</span>
            <input
              type="range"
              min="0.1"
              max="1.0"
              step="0.05"
              value={opacity}
              onChange={(e) => setOpacity(parseFloat(e.target.value))}
              style={{ cursor: 'pointer' }}
            />
          </div>
        )}
      </div>
    </div>
  );
};
