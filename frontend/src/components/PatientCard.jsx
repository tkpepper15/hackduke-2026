import React from 'react';
import { getAlertConfig, formatTimestamp, riskScoreColor } from '../utils/formatters';

/**
 * Tiny SVG sparkline showing the last N risk scores.
 * Drawn as a polyline normalized to the local min/max range.
 */
function MiniSparkline({ history }) {
  if (!history || history.length < 3) return null;

  const scores = history.map((r) => r.risk_score);
  const min = Math.min(...scores);
  const max = Math.max(...scores);
  const range = max - min || 1;

  const W = 56;
  const H = 18;

  const points = scores
    .map((s, i) => {
      const x = (i / (scores.length - 1)) * W;
      const y = H - ((s - min) / range) * (H - 2) - 1;
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(' ');

  const latestColor = riskScoreColor(scores[scores.length - 1]);

  return (
    <svg
      width={W}
      height={H}
      className="overflow-visible flex-shrink-0"
      aria-hidden="true"
    >
      <polyline
        points={points}
        fill="none"
        stroke={latestColor}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        opacity="0.7"
      />
      {/* Endpoint dot */}
      <circle
        cx={W}
        cy={parseFloat(points.split(' ').pop().split(',')[1])}
        r="2"
        fill={latestColor}
      />
    </svg>
  );
}

export default function PatientCard({ patient, isSelected, onClick, miniHistory }) {
  const latest = patient.latest;
  const level = latest?.alert_level ?? 'normal';
  const cfg = getAlertConfig(level);

  return (
    <button
      onClick={onClick}
      className={`w-full text-left rounded-lg border overflow-hidden transition-all focus:outline-none ${
        isSelected
          ? 'border-blue-400 shadow-sm'
          : 'border-clinical-border bg-white hover:border-gray-300 hover:shadow-sm'
      }`}
    >
      {/* Status color accent strip */}
      <div className="h-0.5 w-full" style={{ backgroundColor: cfg.color }} />

      <div className={`px-3 py-2.5 ${isSelected ? 'bg-blue-50' : 'bg-white'}`}>
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-[13px] font-medium text-clinical-text truncate">
            {patient.device_id}
          </span>
          <span
            className={`text-[11px] px-2 py-0.5 rounded-full border font-medium flex-shrink-0 ml-2 ${cfg.badgeClass}`}
          >
            {cfg.label}
          </span>
        </div>

        {latest ? (
          <>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <span
                  className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${cfg.dotClass} ${
                    level === 'critical' ? 'animate-pulse' : ''
                  }`}
                />
                <span className="text-[11px] text-clinical-muted">
                  {latest.temperature}°C &middot; {latest.pressure}&thinsp;rpu
                </span>
              </div>
              <MiniSparkline history={miniHistory} />
            </div>

            <div className="flex items-center justify-between mt-1">
              <p className="text-[10px] text-clinical-subtle">
                {formatTimestamp(latest.timestamp)}
              </p>
              <span
                className="text-[10px] font-semibold tabular-nums"
                style={{ color: riskScoreColor(latest.risk_score) }}
              >
                {latest.risk_score}
              </span>
            </div>
          </>
        ) : (
          <p className="text-[11px] text-clinical-muted">Awaiting data…</p>
        )}
      </div>
    </button>
  );
}
