import React from 'react';
import { riskScoreColor } from '../utils/formatters';

/**
 * Shows a directional delta vs the previous reading.
 * `concerning` controls which direction is colored orange (bad).
 * For temperature: down is concerning. For pressure: up is concerning.
 */
function Delta({ current, previous, concerning }) {
  if (previous == null || current == null) return null;
  const delta = current - previous;
  if (Math.abs(delta) < 0.05) {
    return <span className="text-xs text-clinical-subtle ml-1.5">—</span>;
  }
  const isUp = delta > 0;
  const isConcerning = concerning === 'up' ? isUp : !isUp;
  return (
    <span
      className={`text-xs font-medium ml-1.5 ${
        isConcerning ? 'text-orange-500' : 'text-green-600'
      }`}
    >
      {isUp ? '↑' : '↓'} {Math.abs(delta).toFixed(1)}
    </span>
  );
}

function MetricCard({ label, primary, unit, subtext, warning, delta }) {
  return (
    <div
      className={`bg-white rounded-xl border p-4 flex-1 min-w-0 transition-colors duration-300 ${
        warning ? 'border-orange-300 bg-orange-50/30' : 'border-clinical-border'
      }`}
    >
      <p className="text-[10px] font-semibold uppercase tracking-widest text-clinical-muted mb-1">
        {label}
      </p>
      <div className="flex items-baseline gap-0.5">
        <span className="text-2xl font-semibold text-clinical-text tabular-nums transition-all duration-300">
          {primary}
        </span>
        <span className="text-sm text-clinical-muted ml-0.5">{unit}</span>
        {delta}
      </div>
      {subtext && (
        <p className={`text-xs mt-1.5 ${warning ? 'text-orange-600' : 'text-clinical-muted'}`}>
          {subtext}
        </p>
      )}
    </div>
  );
}

/**
 * Segmented 4-zone gauge track with a floating position marker.
 * Zones correspond exactly to the risk score thresholds.
 */
function SegmentedGauge({ score }) {
  const color = riskScoreColor(score);
  const pct = Math.min(Math.max(score, 0), 100);

  return (
    <div className="bg-white rounded-xl border border-clinical-border p-4 flex-1 min-w-0">
      <p className="text-[10px] font-semibold uppercase tracking-widest text-clinical-muted mb-1">
        Risk Score
      </p>

      <div className="flex items-baseline gap-1 mb-3">
        <span
          className="text-2xl font-semibold tabular-nums transition-colors duration-500"
          style={{ color }}
        >
          {score}
        </span>
        <span className="text-sm text-clinical-muted">/ 100</span>
      </div>

      {/* Track */}
      <div className="relative">
        <div className="flex h-2 rounded-full overflow-hidden">
          {/* Normal: 0–30 = 30% */}
          <div className="flex-none" style={{ width: '30%', backgroundColor: '#bbf7d0' }} />
          {/* Monitor: 30–60 = 30% */}
          <div className="flex-none" style={{ width: '30%', backgroundColor: '#fef08a' }} />
          {/* Elevated: 60–80 = 20% */}
          <div className="flex-none" style={{ width: '20%', backgroundColor: '#fed7aa' }} />
          {/* Critical: 80–100 = 20% */}
          <div className="flex-none" style={{ width: '20%', backgroundColor: '#fecaca' }} />
        </div>

        {/* Position marker */}
        <div
          className="absolute top-1/2 -translate-y-1/2 w-3.5 h-3.5 rounded-full border-2 border-white shadow-md transition-all duration-500"
          style={{ left: `calc(${pct}% - 7px)`, backgroundColor: color }}
        />
      </div>

      <div className="flex justify-between mt-2 text-[9px] text-clinical-subtle select-none">
        <span>Normal</span>
        <span>Monitor</span>
        <span>Elevated</span>
        <span>Critical</span>
      </div>
    </div>
  );
}

export default function MetricsRow({ latest, prevLatest }) {
  const tempDelta = (
    <Delta
      current={latest.temperature}
      previous={prevLatest?.temperature}
      concerning="down"
    />
  );
  const pressDelta = (
    <Delta
      current={latest.pressure}
      previous={prevLatest?.pressure}
      concerning="up"
    />
  );

  return (
    <div className="flex gap-3">
      <MetricCard
        label="Temperature"
        primary={latest.temperature}
        unit="°C"
        subtext={latest.temp_drop > 0 ? `↓ ${latest.temp_drop}°C below baseline` : 'At baseline'}
        warning={latest.temp_drop > 1.0}
        delta={tempDelta}
      />
      <MetricCard
        label="Pressure"
        primary={latest.pressure}
        unit="rpu"
        subtext={latest.pressure_rise > 0 ? `↑ ${latest.pressure_rise} above baseline` : 'At baseline'}
        warning={latest.pressure_rise > 50}
        delta={pressDelta}
      />
      <SegmentedGauge score={latest.risk_score} />
    </div>
  );
}
