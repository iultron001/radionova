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
        {viewMode === 'original' && (
          <img 
            src={originalImage} 
            alt={`Original ${modality}`} 
            className="viewer-img" 
          />
        )}

        {viewMode === 'gradcam' && (
          <img 
            src={gradcamOverlay} 
            alt={`Grad-CAM Overlay ${modality}`} 
            className="viewer-img" 
          />
        )}

        {viewMode === 'split' && (
          <div style={{ position: 'relative', width: '100%', display: 'flex', justifyContent: 'center' }}>
            <img 
              src={originalImage} 
              alt="Original Base" 
              className="viewer-img" 
            />
            <img 
              src={gradcamOverlay} 
              alt="Grad-CAM Layer" 
              className="viewer-img" 
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                opacity: opacity,
                mixBlendMode: 'screen'
              }} 
            />
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
            Adjustable Alpha
          </button>
        </div>

        {viewMode === 'split' && (
          <div className="opacity-slider-group">
            <span>Heatmap Alpha: {Math.round(opacity * 100)}%</span>
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
