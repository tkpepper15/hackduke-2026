import React, { useState, useEffect, useRef, useCallback } from 'react';
import AlertPanel from './AlertPanel';
import MetricsRow from './MetricsRow';
import TrendChart from './TrendChart';
import { getAlertConfig, formatTimestamp, getInsGrade, formatDuration } from '../utils/formatters';

const DISPLAY_NAMES = {
  bot_baseline:    'Sim — Baseline',
  bot_infiltration:'Sim — Infiltration',
  patient_001:     'Patient 001',
};

const TIME_WINDOWS = [
  { label: '5m',  value: 5  },
  { label: '15m', value: 15 },
  { label: '30m', value: 30 },
];

// ── Helpers ───────────────────────────────────────────────────────────────────

function wallSec(r) {
  return r.received_at != null ? Math.floor(r.received_at / 1000) : r.timestamp;
}

function findAlertSince(history, currentLevel) {
  if (!history?.length) return null;
  for (let i = history.length - 1; i >= 0; i--) {
    if (history[i].alert_level !== currentLevel) {
      const r = history[i + 1];
      return r ? wallSec(r) : null;
    }
  }
  return wallSec(history[0]);
}

// ── Design tokens ─────────────────────────────────────────────────────────────

const T = {
  card:       { backgroundColor: '#ffffff', border: '1px solid #e8eaed', borderRadius: '8px' },
  label:      { fontSize: '11px', color: '#9ca3af', fontWeight: '500' },
  muted:      { fontSize: '11px', color: '#9ca3af' },
  body:       { fontSize: '13px', color: '#374151' },
  divider:    { borderTop: '1px solid #f3f4f6' },
  STATUS: {
    abnormal:      { color: '#ef4444', label: 'Abnormal'      },
    borderline:    { color: '#f59e0b', label: 'Borderline'    },
    normal:        { color: '#10b981', label: 'Normal'        },
    not_connected: { color: '#d1d5db', label: 'Not connected' },
  },
};

// ── Sub-components ────────────────────────────────────────────────────────────

function INSGradeCard({ grade, alertSince, level }) {
  const cfg      = getInsGrade(grade ?? 0);
  const duration = formatDuration(alertSince);
  const g        = grade ?? 0;
  const valColor = g === 0 ? '#d1d5db' : cfg.color;

  return (
    <div className="flex-1 min-w-0 px-5 py-4" style={T.card}>
      <p style={T.label} className="mb-3">INS Infiltration Scale</p>
      <div className="flex items-baseline gap-1.5">
        <span className="leading-none nums" style={{ fontSize: '40px', fontWeight: '300', color: valColor }}>
          {g}
        </span>
        <span style={{ fontSize: '14px', color: '#d1d5db' }}>/ 4</span>
      </div>
      <p className="mt-2" style={{ ...T.body, color: g === 0 ? '#9ca3af' : cfg.color }}>{cfg.summary}</p>
      {duration && level !== 'normal' && (
        <p className="mt-1" style={T.muted}>Active {duration}</p>
      )}
    </div>
  );
}

function CumulativeDeficitCard({ deficit }) {
  const d   = deficit ?? 0;
  const col = d > 2 ? '#ef4444' : d > 0.5 ? '#f97316' : '#d1d5db';
  const sub = d > 2
    ? 'Prolonged exposure — monitor closely'
    : d > 0.5
    ? 'Moderate cumulative cooling'
    : 'No sustained cooling detected';

  return (
    <div className="flex-1 min-w-0 px-5 py-4" style={T.card}>
      <p style={T.label} className="mb-3">Cumulative Thermal Deficit</p>
      <div className="flex items-baseline gap-1.5">
        <span className="leading-none nums" style={{ fontSize: '40px', fontWeight: '300', color: col }}>
          {d.toFixed(1)}
        </span>
        <span style={{ fontSize: '14px', color: '#d1d5db' }}>°C·min</span>
      </div>
      <p className="mt-2" style={{ ...T.body, color: d === 0 ? '#9ca3af' : col }}>{sub}</p>
    </div>
  );
}

function SignalRow({ label, value, unit, status, detail }) {
  const s = T.STATUS[status] ?? T.STATUS.normal;
  return (
    <div className="flex items-center py-3" style={T.divider}>
      <span className="w-36 flex-shrink-0" style={{ ...T.body, color: '#374151' }}>{label}</span>
      <span className="w-28 flex-shrink-0 tabular-nums"
        style={{ fontSize: '13px', fontWeight: '500', color: s.color }}>
        {value != null ? `${value}${unit}` : '—'}
      </span>
      <span className="flex-1 hidden sm:block" style={T.muted}>{detail}</span>
      <div className="flex items-center gap-1.5 flex-shrink-0">
        <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: s.color }} />
        <span style={{ fontSize: '11px', color: s.color }}>{s.label}</span>
      </div>
    </div>
  );
}

function SignalPanel({ latest }) {
  if (!latest) return null;
  const { temperature, temp_drop = 0, humidity, humidity_rise = 0,
          pressure, pressure_rise, temp_rate = 0, cumulative_deficit = 0 } = latest;

  const tempStatus    = temp_drop > 1.0  ? 'abnormal' : temp_drop > 0.3  ? 'borderline' : 'normal';
  const humidStatus   = humidity == null  ? 'not_connected' : humidity_rise > 3 ? 'abnormal' : humidity_rise > 1 ? 'borderline' : 'normal';
  const rateStatus    = temp_rate < -1.0  ? 'abnormal' : temp_rate < -0.3 ? 'borderline' : 'normal';
  const pressStatus   = pressure == null  ? 'not_connected' : (pressure_rise ?? 0) > 30 ? 'abnormal' : (pressure_rise ?? 0) > 10 ? 'borderline' : 'normal';
  const deficitStatus = cumulative_deficit > 2 ? 'abnormal' : cumulative_deficit > 0.5 ? 'borderline' : 'normal';

  return (
    <div className="px-5 py-4" style={T.card}>
      <p style={T.label} className="mb-1">Signal Convergence</p>
      <SignalRow
        label="Temperature"
        value={temperature}
        unit="°C"
        status={tempStatus}
        detail={temp_drop > 0 ? `${temp_drop.toFixed(1)}°C below baseline` : 'At baseline'}
      />
      <SignalRow
        label="Rate of Change"
        value={temp_rate?.toFixed(1)}
        unit="°C/min"
        status={rateStatus}
        detail={temp_rate < 0 ? `Declining ${Math.abs(temp_rate).toFixed(1)}°C/min` : temp_rate > 0.3 ? `Rising ${temp_rate.toFixed(1)}°C/min` : 'Stable'}
      />
      <SignalRow
        label="Humidity"
        value={humidity}
        unit="%"
        status={humidStatus}
        detail={humidity == null ? 'Sensor not connected' : humidity_rise > 0 ? `${humidity_rise.toFixed(1)}% above baseline` : 'At baseline'}
      />
      <SignalRow
        label="Pressure"
        value={pressure}
        unit=" rpu"
        status={pressStatus}
        detail={pressure == null ? 'Sensor not connected' : (pressure_rise ?? 0) > 0 ? `${pressure_rise} above baseline` : 'At baseline'}
      />
      <div style={{ borderBottom: 'none' }}>
        <SignalRow
          label="Thermal Deficit"
          value={cumulative_deficit?.toFixed(1)}
          unit="°C·min"
          status={deficitStatus}
          detail={cumulative_deficit > 0 ? 'Integrated over recent history' : 'No sustained cooling'}
        />
      </div>
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

export default function LiveMonitor({ patientId, latest, apiUrl }) {
  const [history,    setHistory]    = useState([]);
  const [timeWindow, setTimeWindow] = useState(15);
  const [alertSince, setAlertSince] = useState(null);
  const prevLatestRef = useRef(null);

  const fetchHistory = useCallback(() => {
    fetch(`${apiUrl}/patients/${patientId}/history?minutes=${timeWindow}`)
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data)) {
          setHistory(data);
          if (latest?.alert_level) setAlertSince(findAlertSince(data, latest.alert_level));
        }
      })
      .catch(console.error);
  }, [patientId, timeWindow, apiUrl, latest?.alert_level]);

  useEffect(() => { setHistory([]); fetchHistory(); }, [fetchHistory]);

  useEffect(() => {
    if (!latest) return;
    setHistory((prev) => {
      const cutoffMs = Date.now() - timeWindow * 60 * 1000;
      const trimmed  = prev.filter((r) => (r.received_at ?? r.timestamp * 1000) >= cutoffMs);
      const last     = trimmed[trimmed.length - 1];
      const lastMs   = last   ? (last.received_at   ?? last.timestamp   * 1000) : 0;
      const newMs    = latest.received_at ?? latest.timestamp * 1000;
      if (lastMs === newMs) return trimmed;
      return [...trimmed, latest];
    });
    if (prevLatestRef.current?.alert_level !== latest.alert_level) {
      setAlertSince(latest.received_at ? Math.floor(latest.received_at / 1000) : latest.timestamp);
    }
    prevLatestRef.current = latest;
  }, [latest, timeWindow]);

  const level      = latest?.alert_level ?? 'normal';
  const cfg        = getAlertConfig(level);
  const prevLatest = prevLatestRef.current;

  return (
    <div className="flex flex-col h-full overflow-hidden">

      {/* ── Top bar ── */}
      <div className="flex-shrink-0 flex items-center justify-between px-6"
        style={{ height: '48px', backgroundColor: '#ffffff', borderBottom: '1px solid #e8eaed' }}>

        {/* Breadcrumb */}
        <div className="flex items-center gap-1.5" style={{ fontSize: '12px' }}>
          <span style={{ color: '#9ca3af' }}>Patients</span>
          <span style={{ color: '#e5e7eb' }}>/</span>
          <span style={{ color: '#111827', fontWeight: '500' }}>
            {DISPLAY_NAMES[patientId] ?? patientId}
          </span>
        </div>

        {/* Right meta */}
        <div className="flex items-center gap-4" style={{ fontSize: '11px', color: '#9ca3af' }}>
          <span>
            Updated {formatTimestamp(
              latest?.received_at ? Math.floor(latest.received_at / 1000) : latest?.timestamp
            )}
          </span>

          <span style={{ color: '#e5e7eb' }}>·</span>

          <span style={{ color: latest?.source === 'device' ? '#6b7280' : '#9ca3af' }}>
            {latest?.source === 'device' ? (
              <span className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full inline-block bg-emerald-400 animate-pulse" />
                Device
              </span>
            ) : 'Simulated'}
          </span>

          <span style={{ color: '#e5e7eb' }}>·</span>

          {/* Alert level — only pill in the bar, kept minimal */}
          <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-md"
            style={{
              backgroundColor: `${cfg.color}12`,
              color: cfg.color,
              fontSize: '11px',
              fontWeight: '500',
            }}>
            <span className={`w-1.5 h-1.5 rounded-full inline-block ${level === 'critical' ? 'animate-pulse' : ''}`}
              style={{ backgroundColor: cfg.color }} />
            {cfg.label}
          </span>
        </div>
      </div>

      {/* ── Scrollable content ── */}
      <div className="flex-1 overflow-y-auto" style={{ backgroundColor: '#f7f8fa' }}>
        <div className="px-6 py-5 space-y-4" style={{ maxWidth: '960px', margin: '0 auto' }}>

          {/* Hardware strip — device only */}
          {latest?.source === 'device' && (
            <div className="flex items-center gap-2" style={{ fontSize: '11px', color: '#9ca3af' }}>
              <span style={{ color: '#6b7280', fontWeight: '500' }}>Hardware</span>
              <span style={{ color: '#d1d5db' }}>·</span>
              <span>DHT11 <span style={{ color: '#6b7280' }}>GPIO 4</span></span>
              <span style={{ color: '#d1d5db' }}>·</span>
              <span>FSR 402 <span style={{ color: '#d1d5db' }}>GPIO 34 — offline</span></span>
              <span style={{ color: '#d1d5db' }}>·</span>
              <span>ESP32 <span style={{ color: '#6b7280' }}>USB 115200</span></span>
            </div>
          )}

          {/* Alert panel */}
          <AlertPanel latest={latest} alertSince={alertSince} />

          {/* Metric cards */}
          {latest && <MetricsRow latest={latest} prevLatest={prevLatest} />}

          {/* INS Grade + Deficit */}
          <div className="flex gap-4">
            <INSGradeCard grade={latest?.ins_grade} alertSince={alertSince} level={level} />
            <CumulativeDeficitCard deficit={latest?.cumulative_deficit} />
          </div>

          {/* Signal convergence */}
          <SignalPanel latest={latest} />

          {/* Chart panel */}
          <div style={T.card}>
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-3.5"
              style={{ borderBottom: '1px solid #f3f4f6' }}>
              <span style={{ ...T.label }}>Sensor Trends</span>
              <div className="flex items-center gap-0.5 rounded-md p-0.5"
                style={{ backgroundColor: '#f3f4f6' }}>
                {TIME_WINDOWS.map((w) => (
                  <button key={w.value} onClick={() => setTimeWindow(w.value)}
                    className="px-3 py-1 rounded transition-all"
                    style={{
                      fontSize: '11px',
                      fontWeight: '500',
                      ...(timeWindow === w.value
                        ? { backgroundColor: '#fff', color: '#111827', boxShadow: '0 1px 2px rgba(0,0,0,0.06)' }
                        : { color: '#9ca3af' }),
                    }}>
                    {w.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="px-5 pt-4 pb-2">
              <TrendChart data={history} dataKey="temperature" label="Temperature"    unit="°C"     color="#3b82f6" />
            </div>
            <div style={{ borderTop: '1px solid #f3f4f6', margin: '0 20px' }} />
            <div className="px-5 pt-4 pb-2">
              <TrendChart data={history} dataKey="temp_rate"   label="Rate of Change" unit="°C/min" color="#f97316" />
            </div>
            <div style={{ borderTop: '1px solid #f3f4f6', margin: '0 20px' }} />
            <div className="px-5 pt-4 pb-2">
              <TrendChart data={history} dataKey="humidity"    label="Humidity"       unit="%"      color="#06b6d4" />
            </div>
            <div style={{ borderTop: '1px solid #f3f4f6', margin: '0 20px' }} />
            <div className="px-5 pt-4 pb-5">
              <TrendChart data={history} dataKey="pressure"    label="Pressure"       unit=" rpu"   color="#8b5cf6" />
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
