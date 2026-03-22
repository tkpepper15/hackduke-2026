import React from 'react';
import { riskScoreColor } from '../utils/formatters';

const LEVEL_COLOR = {
  normal:   '#10b981',
  monitor:  '#f59e0b',
  elevated: '#f97316',
  critical: '#ef4444',
};

const DISPLAY_NAMES = {
  bot_baseline:    'Sim — Baseline',
  bot_infiltration:'Sim — Infiltration',
  patient_001:     'Patient 001',
};

function MiniSparkline({ history }) {
  if (!history || history.length < 3) return null;
  const scores = history.map((r) => r.risk_score);
  const min = Math.min(...scores), max = Math.max(...scores);
  const range = max - min || 1;
  const W = 36, H = 12;
  const points = scores
    .map((s, i) => {
      const x = (i / (scores.length - 1)) * W;
      const y = H - ((s - min) / range) * (H - 2) - 1;
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(' ');
  return (
    <svg width={W} height={H} className="overflow-visible flex-shrink-0" aria-hidden>
      <polyline
        points={points}
        fill="none"
        stroke={riskScoreColor(scores[scores.length - 1])}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        opacity="0.6"
      />
    </svg>
  );
}

function SourceTag({ source }) {
  if (source === 'device') {
    return (
      <span style={{ fontSize: '9px', fontWeight: '600', color: '#10b981', letterSpacing: '0.04em' }}>
        LIVE
      </span>
    );
  }
  if (source === 'bot') {
    return (
      <span style={{ fontSize: '9px', fontWeight: '500', color: '#818cf8', letterSpacing: '0.04em' }}>
        SIM
      </span>
    );
  }
  return null;
}

export default function PatientCard({ patient, isSelected, onClick, miniHistory }) {
  const latest      = patient.latest;
  const level       = latest?.alert_level ?? 'normal';
  const dotColor    = LEVEL_COLOR[level] ?? LEVEL_COLOR.normal;
  const displayName = DISPLAY_NAMES[patient.device_id] ?? patient.device_id;

  return (
    <button
      onClick={onClick}
      className="w-full text-left px-3 py-2 mb-0.5 rounded-md transition-colors focus:outline-none"
      style={{
        backgroundColor: isSelected ? '#25262a' : 'transparent',
        borderLeft: isSelected ? '2px solid #3b82f6' : '2px solid transparent',
      }}
      onMouseEnter={(e) => { if (!isSelected) e.currentTarget.style.backgroundColor = '#212226'; }}
      onMouseLeave={(e) => { if (!isSelected) e.currentTarget.style.backgroundColor = 'transparent'; }}
    >
      {/* Row 1 */}
      <div className="flex items-center gap-2">
        <span
          className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${level === 'critical' ? 'animate-pulse' : ''}`}
          style={{ backgroundColor: dotColor }}
        />
        <span className="flex-1 truncate" style={{ fontSize: '12px', fontWeight: '500', color: '#e5e7eb' }}>
          {displayName}
        </span>
        <span style={{ fontSize: '10px', color: dotColor, flexShrink: 0 }}>
          {level.charAt(0).toUpperCase() + level.slice(1)}
        </span>
      </div>

      {/* Row 2 */}
      {latest && (
        <div className="flex items-center justify-between mt-1 pl-3.5 gap-2">
          <span style={{ fontSize: '10px', color: '#4b5563' }} className="tabular-nums">
            {latest.temperature}°C
            {latest.humidity != null ? ` · ${latest.humidity}%` : ''}
          </span>
          <div className="flex items-center gap-2 flex-shrink-0">
            <SourceTag source={latest.source} />
            <MiniSparkline history={miniHistory} />
          </div>
        </div>
      )}
    </button>
  );
}
