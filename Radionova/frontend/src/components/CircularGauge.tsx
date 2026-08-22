import React from 'react';

interface CircularGaugeProps {
  value: number; // 0 to 100
  size?: number;
  strokeWidth?: number;
  label: string;
  sublabel?: string;
  color?: string;
  trackColor?: string;
  isAlert?: boolean;
}

export const CircularGauge: React.FC<CircularGaugeProps> = ({
  value,
  size = 110,
  strokeWidth = 9,
  label,
  sublabel,
  color,
  trackColor = 'var(--bg-subtle)',
  isAlert = false
}) => {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const clampedValue = Math.min(Math.max(value, 0), 100);
  const strokeDashoffset = circumference - (clampedValue / 100) * circumference;
  
  const gaugeColor = color || (isAlert ? 'var(--accent)' : 'var(--status-positive-border)');

  return (
    <div className="circular-gauge-card">
      <div className="circular-gauge-wrapper" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="circular-gauge-svg">
          {/* Background Track Circle */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke={trackColor}
            strokeWidth={strokeWidth}
            fill="none"
          />
          {/* Animated Value Ring */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke={gaugeColor}
            strokeWidth={strokeWidth}
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            fill="none"
            className="circular-gauge-ring"
            style={{
              transformOrigin: '50% 50%',
              transform: 'rotate(-90deg)',
              transition: 'stroke-dashoffset 900ms cubic-bezier(0.16, 1, 0.3, 1)'
            }}
          />
        </svg>
        {/* Center Percentage Display */}
        <div className="circular-gauge-center">
          <span className="circular-gauge-num" style={{ color: gaugeColor }}>
            {clampedValue}<span style={{ fontSize: '11px', fontWeight: 700 }}>%</span>
          </span>
        </div>
      </div>

      <div className="circular-gauge-meta">
        <div className="circular-gauge-label">{label}</div>
        {sublabel && <div className="circular-gauge-sublabel">{sublabel}</div>}
      </div>
    </div>
  );
};
