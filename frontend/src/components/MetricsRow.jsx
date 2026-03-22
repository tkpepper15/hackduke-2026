import React from 'react';
import { riskScoreColor } from '../utils/formatters';

const CARD = { backgroundColor: '#ffffff', border: '1px solid #e8eaed', borderRadius: '8px' };
const LABEL = { fontSize: '11px', color: '#9ca3af', fontWeight: '500' };
const MUTED = { fontSize: '11px', color: '#9ca3af' };

function Delta({ current, previous, concerning }) {
  if (previous == null || current == null) return null;
  const delta = current - previous;
  if (Math.abs(delta) < 0.05) return null;
  const isUp = delta > 0;
  const isConcerning = concerning === 'up' ? isUp : !isUp;
  return (
    <span className="text-[11px] font-medium ml-1.5 nums"
      style={{ color: isConcerning ? '#f97316' : '#10b981' }}>
      {isUp ? '↑' : '↓'} {Math.abs(delta).toFixed(1)}
    </span>
  );
}

function MetricCard({ label, primary, unit, subtext, color, delta }) {
  return (
    <div className="flex-1 min-w-0 px-5 py-4" style={CARD}>
      <p style={LABEL} className="mb-3">{label}</p>
      <div className="flex items-baseline gap-0.5">
        <span className="leading-none nums" style={{ fontSize: '32px', fontWeight: '300', color: color ?? '#111827' }}>
          {primary}
        </span>
        <span className="ml-1" style={{ fontSize: '13px', color: '#d1d5db' }}>{unit}</span>
        {delta}
      </div>
      {subtext && (
        <div className="mt-2" style={MUTED}>{subtext}</div>
      )}
    </div>
  );
}

function RiskGauge({ score }) {
  const color = riskScoreColor(score);
  const pct   = Math.min(Math.max(score, 0), 100);

  return (
    <div className="flex-1 min-w-0 px-5 py-4" style={CARD}>
      <p style={LABEL} className="mb-3">Risk Score</p>
      <div className="flex items-baseline gap-1 mb-4">
        <span className="leading-none nums" style={{ fontSize: '32px', fontWeight: '300', color, transition: 'color 0.5s' }}>
          {score}
        </span>
        <span className="ml-0.5" style={{ fontSize: '13px', color: '#d1d5db' }}>/ 100</span>
      </div>

      {/* Track */}
      <div className="relative h-1 rounded-full" style={{ backgroundColor: '#f3f4f6' }}>
        <div className="absolute inset-y-0 left-0 rounded-full"
          style={{
            width: `${pct}%`,
            background: `linear-gradient(to right, #10b981, ${color})`,
            transition: 'width 0.5s',
          }} />
      </div>

      <div className="flex justify-between mt-1.5" style={MUTED}>
        <span>Normal</span>
        <span>Monitor</span>
        <span>Elevated</span>
        <span>Critical</span>
      </div>
    </div>
  );
}

function rateLabel(rate) {
  if (rate == null || Math.abs(rate) < 0.3) return null;
  return (
    <span style={{ fontSize: '11px', color: rate < 0 ? '#f97316' : '#10b981' }}>
      {rate < 0 ? 'Declining' : 'Rising'} {Math.abs(rate).toFixed(1)} °C/min
    </span>
  );
}

export default function MetricsRow({ latest, prevLatest }) {
  const pressNull = latest.pressure == null;
  const humidNull = latest.humidity == null;
  const rateNote  = rateLabel(latest.temp_rate);
  const tempWarn  = latest.temp_drop > 1.0;

  const tempSub = rateNote ?? (latest.temp_drop > 0
    ? `${latest.temp_drop.toFixed(1)}°C below baseline`
    : 'At baseline');

  const humidSub = humidNull
    ? 'Not connected'
    : latest.humidity_rise > 2
    ? `${latest.humidity_rise.toFixed(1)}% above baseline`
    : latest.dew_point != null
    ? `Dew point ${latest.dew_point}°C`
    : 'At baseline';

  return (
    <div className="flex gap-4 flex-wrap">
      <MetricCard
        label="Temperature"
        primary={latest.temperature}
        unit="°C"
        subtext={tempSub}
        color={tempWarn ? '#f97316' : '#111827'}
        delta={<Delta current={latest.temperature} previous={prevLatest?.temperature} concerning="down" />}
      />
      <MetricCard
        label="Humidity"
        primary={humidNull ? '—' : latest.humidity}
        unit={humidNull ? '' : '%'}
        subtext={humidSub}
        color={humidNull ? '#d1d5db' : latest.humidity_rise > 2 ? '#f97316' : '#111827'}
        delta={humidNull ? null : <Delta current={latest.humidity} previous={prevLatest?.humidity} concerning="up" />}
      />
      <MetricCard
        label="Pressure"
        primary={pressNull ? '—' : latest.pressure}
        unit={pressNull ? '' : 'rpu'}
        subtext={pressNull ? 'Not connected' : latest.pressure_rise > 0 ? `${latest.pressure_rise} above baseline` : 'At baseline'}
        color={pressNull ? '#d1d5db' : '#111827'}
        delta={pressNull ? null : <Delta current={latest.pressure} previous={prevLatest?.pressure} concerning="up" />}
      />
      <RiskGauge score={latest.risk_score} />
    </div>
  );
}
