import React, { useState, useEffect, useRef, useCallback } from 'react';
import TrendChart from './TrendChart';
import {
  getAlertConfig, formatTimestamp, getInsGrade,
  formatDuration, buildAlertMessage,
} from '../utils/formatters';
import { riskScoreColor } from '../utils/formatters';

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

const INS_ACTIONS = {
  0: null,
  1: [
    'Reassess the site visually within 15 minutes.',
    'Document skin appearance, local temperature, and edema extent.',
    'Apply a warm compress if the patient tolerates it.',
  ],
  2: [
    'Discontinue the infusion.',
    'Remove the cannula and restart at a new site, proximal to or on the contralateral limb.',
    'Document site appearance and time of removal.',
    'Notify the responsible clinician.',
  ],
  3: [
    'Discontinue the infusion and remove the cannula immediately.',
    'Elevate the affected extremity above heart level.',
    'Apply a warm compress and leave in place.',
    'Notify the responsible physician.',
    'Initiate incident documentation.',
  ],
  4: [
    'Discontinue the infusion and remove the cannula immediately.',
    'Elevate the affected extremity.',
    'Notify the physician urgently.',
    'Prepare antidote therapy if the infusate is a vesicant.',
    'Request plastic surgery or wound care consult.',
    'Initiate an incident report.',
  ],
};

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

// ── Divider ───────────────────────────────────────────────────────────────────

function Divider({ className = '' }) {
  return <div className={className} style={{ borderTop: '1px solid #f0f1f3' }} />;
}

// ── Icons ─────────────────────────────────────────────────────────────────────

function SparkleIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 16 16" fill="none" aria-hidden>
      <path d="M8 1.5 C8 1.5 8.6 4.4 10 5.8 C11.4 7.2 14 8 14 8 C14 8 11.4 8.8 10 10.2 C8.6 11.6 8 14.5 8 14.5 C8 14.5 7.4 11.6 6 10.2 C4.6 8.8 2 8 2 8 C2 8 4.6 7.2 6 5.8 C7.4 4.4 8 1.5 8 1.5 Z"
        fill="#7c3aed" opacity="0.85"/>
    </svg>
  );
}

// ── Primary status card ───────────────────────────────────────────────────────

function SiteStatusCard({ latest, alertSince, patientId, apiUrl }) {
  const [assessment, setAssessment] = useState(null);
  const [loading,    setLoading]    = useState(false);
  const prevLevelRef = useRef(null);

  useEffect(() => { setAssessment(null); }, [patientId]);

  useEffect(() => {
    if (!latest?.alert_level) return;
    if (prevLevelRef.current && prevLevelRef.current !== latest.alert_level) {
      setAssessment(null);
    }
    prevLevelRef.current = latest.alert_level;
  }, [latest?.alert_level]);

  async function generateAssessment() {
    setLoading(true);
    try {
      const r = await fetch(`${apiUrl}/ai-summary/${patientId}`);
      if (!r.ok) throw new Error();
      const data = await r.json();
      if (data.summary) setAssessment(data.summary);
    } catch { /* silent */ }
    finally   { setLoading(false); }
  }

  if (!latest) return null;

  const level   = latest.alert_level ?? 'normal';
  const cfg     = getAlertConfig(level);
  const message = buildAlertMessage(latest);
  const dur     = formatDuration(alertSince);
  const ins     = latest.ins_grade ?? 0;
  const insCfg  = getInsGrade(ins);
  const deficit = latest.cumulative_deficit ?? 0;
  const riskCol = riskScoreColor(latest.risk_score ?? 0);
  const actions = INS_ACTIONS[ins];

  return (
    <div className="rounded-lg overflow-hidden" style={{ backgroundColor: '#fff', border: '1px solid #e8eaed' }}>

      {/* colour strip */}
      <div style={{ height: '2px', backgroundColor: cfg.color }} />

      {/* ── Section 1: Status ── */}
      <div className="px-6 py-5">
        <div className="flex items-start justify-between gap-6">

          {/* Left: level label + message */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-2">
              <span
                className={ins > 0 || level !== 'normal' ? (level === 'critical' ? 'animate-pulse' : '') : ''}
                style={{
                  display: 'inline-block',
                  width: '7px', height: '7px',
                  borderRadius: '50%',
                  backgroundColor: cfg.color,
                  flexShrink: 0,
                }}
              />
              <span style={{ fontSize: '12px', fontWeight: '600', color: cfg.color, letterSpacing: '0.01em' }}>
                {cfg.label}
              </span>
              {dur && level !== 'normal' && (
                <span style={{ fontSize: '11px', color: '#9ca3af' }}>· {dur}</span>
              )}
            </div>
            <p style={{ fontSize: '14px', color: '#1f2937', lineHeight: '1.65', fontWeight: '400' }}>
              {message}
            </p>
          </div>

          {/* Right: INS grade */}
          <div className="flex-shrink-0 text-right">
            <p style={{ fontSize: '10px', color: '#9ca3af', marginBottom: '2px', letterSpacing: '0.02em' }}>
              INS grade
            </p>
            <div className="flex items-baseline justify-end gap-0.5">
              <span className="tabular-nums"
                style={{ fontSize: '32px', fontWeight: '300', lineHeight: 1, color: ins === 0 ? '#e5e7eb' : insCfg.color }}>
                {ins}
              </span>
              <span style={{ fontSize: '14px', color: '#e5e7eb', marginLeft: '1px' }}>/4</span>
            </div>
            <p style={{ fontSize: '11px', color: ins === 0 ? '#9ca3af' : insCfg.color, marginTop: '2px', maxWidth: '120px' }}>
              {insCfg.summary}
            </p>
          </div>
        </div>

        {/* Key values row */}
        <div className="flex items-center gap-6 mt-4 pt-4" style={{ borderTop: '1px solid #f0f1f3' }}>
          {[
            { label: 'Temperature', value: latest.temperature != null ? `${latest.temperature}°C` : '—' },
            { label: 'Humidity',    value: latest.humidity    != null ? `${latest.humidity}%`     : '—' },
            { label: 'Pressure',    value: latest.pressure    != null ? `${latest.pressure} rpu`  : '—' },
            { label: 'Risk score',  value: latest.risk_score  != null ? `${latest.risk_score}/100`: '—', color: riskCol },
            { label: 'Deficit',     value: `${deficit.toFixed(1)} °C·min`, color: deficit > 0.5 ? '#f97316' : undefined },
          ].map(({ label, value, color }) => (
            <div key={label}>
              <p style={{ fontSize: '10px', color: '#9ca3af', marginBottom: '2px' }}>{label}</p>
              <p className="tabular-nums" style={{ fontSize: '13px', fontWeight: '500', color: color ?? '#374151' }}>
                {value}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* ── Section 2: Actions ── */}
      <Divider />
      <div className="px-6 py-5">
        <p style={{ fontSize: '11px', fontWeight: '600', color: '#6b7280', marginBottom: '12px', letterSpacing: '0.02em' }}>
          {actions ? `Grade ${ins} protocol` : 'Recommended action'}
        </p>
        {actions ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {actions.map((a, i) => (
              <div key={i} style={{ display: 'flex', gap: '14px', alignItems: 'flex-start' }}>
                <span className="tabular-nums flex-shrink-0"
                  style={{ fontSize: '11px', color: '#d1d5db', fontWeight: '500', minWidth: '14px', lineHeight: '1.65' }}>
                  {i + 1}
                </span>
                <span style={{ fontSize: '13px', color: '#374151', lineHeight: '1.65' }}>{a}</span>
              </div>
            ))}
          </div>
        ) : (
          <p style={{ fontSize: '13px', color: '#9ca3af', lineHeight: '1.65' }}>
            Continue routine monitoring. No immediate clinical action required.
          </p>
        )}
      </div>

      {/* ── Section 3: AI Assessment ── */}
      <Divider />
      <div className="px-6 py-4">
        {assessment && !loading ? (
          <div>
            {/* AI label */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '5px', marginBottom: '8px' }}>
              <SparkleIcon />
              <span style={{ fontSize: '10px', fontWeight: '600', color: '#7c3aed', letterSpacing: '0.05em', textTransform: 'uppercase' }}>
                AI Assessment
              </span>
            </div>
            <p style={{ fontSize: '13px', color: '#4b5563', lineHeight: '1.7' }}>
              {assessment}
            </p>
            <button onClick={generateAssessment}
              style={{ marginTop: '10px', fontSize: '11px', color: '#9ca3af', background: 'none', border: 'none', padding: 0, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
              onMouseEnter={(e) => e.currentTarget.style.color = '#6b7280'}
              onMouseLeave={(e) => e.currentTarget.style.color = '#9ca3af'}>
              ↻ Regenerate
            </button>
          </div>
        ) : loading ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <svg className="animate-spin" width="12" height="12" viewBox="0 0 24 24" fill="none" style={{ color: '#7c3aed' }}>
              <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" strokeOpacity="0.2"/>
              <path d="M12 2a10 10 0 0 1 10 10" stroke="currentColor" strokeWidth="3" strokeLinecap="round"/>
            </svg>
            <span style={{ fontSize: '12px', color: '#9ca3af' }}>Generating AI assessment…</span>
          </div>
        ) : (
          <button
            onClick={generateAssessment}
            style={{
              display: 'inline-flex', alignItems: 'center', gap: '7px',
              padding: '7px 14px',
              fontSize: '12px', fontWeight: '500',
              color: '#7c3aed',
              backgroundColor: '#faf5ff',
              border: '1px solid #e9d5ff',
              borderRadius: '6px',
              cursor: 'pointer',
              transition: 'background-color 0.15s, border-color 0.15s',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = '#f3e8ff';
              e.currentTarget.style.borderColor = '#d8b4fe';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = '#faf5ff';
              e.currentTarget.style.borderColor = '#e9d5ff';
            }}
          >
            <SparkleIcon />
            Generate AI assessment
          </button>
        )}
      </div>
    </div>
  );
}

// ── Signal readings table ─────────────────────────────────────────────────────

const STATUS_DOT = {
  abnormal:      '#ef4444',
  borderline:    '#f59e0b',
  normal:        '#10b981',
  not_connected: '#e5e7eb',
};

const STATUS_COLOR = {
  abnormal:      '#ef4444',
  borderline:    '#f59e0b',
  normal:        '#374151',
  not_connected: '#d1d5db',
};

function SignalRow({ label, value, unit, status, interpretation, isLast }) {
  const dotColor = STATUS_DOT[status]   ?? STATUS_DOT.normal;
  const valColor = STATUS_COLOR[status] ?? STATUS_COLOR.normal;

  return (
    <tr style={isLast ? {} : { borderBottom: '1px solid #f0f1f3' }}>
      <td style={{ padding: '10px 16px 10px 0', fontSize: '12px', color: '#374151', whiteSpace: 'nowrap', width: '1%' }}>
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: dotColor, flexShrink: 0, display: 'inline-block' }} />
          {label}
        </span>
      </td>
      <td className="tabular-nums" style={{ padding: '10px 24px 10px 0', fontSize: '12px', fontWeight: '500', color: valColor, whiteSpace: 'nowrap', width: '1%' }}>
        {value != null ? `${value}${unit}` : '—'}
      </td>
      <td style={{ padding: '10px 0', fontSize: '11px', color: '#9ca3af', lineHeight: '1.4' }}>
        {interpretation}
      </td>
    </tr>
  );
}

function SignalTable({ latest }) {
  if (!latest) return null;
  const {
    temperature, temp_drop = 0, humidity, humidity_rise = 0,
    pressure, pressure_rise = 0, temp_rate = 0, cumulative_deficit = 0,
  } = latest;

  const rows = [
    {
      label:  'Temperature',
      value:  temperature,
      unit:   '°C',
      status: temp_drop > 1.0 ? 'abnormal' : temp_drop > 0.3 ? 'borderline' : 'normal',
      interpretation: temp_drop > 1.0
        ? `${temp_drop.toFixed(1)}°C below baseline — localised cooling`
        : temp_drop > 0.3
        ? `${temp_drop.toFixed(1)}°C below baseline — mild, observe`
        : 'At baseline',
    },
    {
      label:  'Rate of change',
      value:  temp_rate?.toFixed(1),
      unit:   '°C/min',
      status: temp_rate < -1.0 ? 'abnormal' : temp_rate < -0.3 ? 'borderline' : 'normal',
      interpretation: temp_rate < -1.0
        ? `Declining rapidly — consider immediate review`
        : temp_rate < -0.3
        ? `Declining ${Math.abs(temp_rate).toFixed(1)}°C/min — monitor trajectory`
        : 'Stable',
    },
    {
      label:  'Local humidity',
      value:  humidity,
      unit:   '%',
      status: humidity == null ? 'not_connected' : humidity_rise > 3 ? 'abnormal' : humidity_rise > 1 ? 'borderline' : 'normal',
      interpretation: humidity == null
        ? 'Sensor offline'
        : humidity_rise > 3
        ? `${humidity_rise.toFixed(1)}% above baseline — possible surface moisture`
        : humidity_rise > 1
        ? `${humidity_rise.toFixed(1)}% above baseline — mild rise`
        : 'At baseline',
    },
    {
      label:  'Pressure',
      value:  pressure,
      unit:   ' rpu',
      status: pressure == null ? 'not_connected' : pressure_rise > 30 ? 'abnormal' : pressure_rise > 10 ? 'borderline' : 'normal',
      interpretation: pressure == null
        ? 'Sensor offline'
        : pressure_rise > 30
        ? 'Elevated — possible tissue resistance'
        : 'At baseline',
    },
    {
      label:  'Thermal deficit',
      value:  cumulative_deficit?.toFixed(1),
      unit:   ' °C·min',
      status: cumulative_deficit > 2 ? 'abnormal' : cumulative_deficit > 0.5 ? 'borderline' : 'normal',
      interpretation: cumulative_deficit > 2
        ? 'Prolonged cooling — correlate with clinical exam'
        : cumulative_deficit > 0.5
        ? 'Developing — track trend'
        : 'No sustained cooling detected',
    },
  ];

  return (
    <div className="rounded-lg" style={{ backgroundColor: '#fff', border: '1px solid #e8eaed' }}>
      <div className="px-6 py-3" style={{ borderBottom: '1px solid #f0f1f3' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 2fr' }}>
          {['Signal', 'Value', 'Interpretation'].map((h) => (
            <span key={h} style={{ fontSize: '10px', fontWeight: '600', color: '#9ca3af', letterSpacing: '0.04em', textTransform: 'uppercase' }}>
              {h}
            </span>
          ))}
        </div>
      </div>
      <div className="px-6 pb-1">
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <tbody>
            {rows.map((r, i) => (
              <SignalRow key={r.label} {...r} isLast={i === rows.length - 1} />
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ── Main ──────────────────────────────────────────────────────────────────────

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
      const lastMs   = last ? (last.received_at ?? last.timestamp * 1000) : 0;
      const newMs    = latest.received_at ?? latest.timestamp * 1000;
      if (lastMs === newMs) return trimmed;
      return [...trimmed, latest];
    });
    if (prevLatestRef.current?.alert_level !== latest.alert_level) {
      setAlertSince(latest.received_at ? Math.floor(latest.received_at / 1000) : latest.timestamp);
    }
    prevLatestRef.current = latest;
  }, [latest, timeWindow]);

  const level = latest?.alert_level ?? 'normal';
  const cfg   = getAlertConfig(level);

  return (
    <div className="flex flex-col h-full overflow-hidden">

      {/* ── Top bar ── */}
      <div style={{ height: '44px', backgroundColor: '#fff', borderBottom: '1px solid #e8eaed', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 24px', flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px' }}>
          <span style={{ color: '#9ca3af' }}>Patients</span>
          <span style={{ color: '#e5e7eb' }}>/</span>
          <span style={{ fontWeight: '500', color: '#111827' }}>{DISPLAY_NAMES[patientId] ?? patientId}</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', fontSize: '11px', color: '#9ca3af' }}>
          <span>
            {formatTimestamp(latest?.received_at ? Math.floor(latest.received_at / 1000) : latest?.timestamp)}
          </span>
          <span style={{ color: '#e5e7eb' }}>·</span>
          {latest?.source === 'device' ? (
            <span style={{ display: 'flex', alignItems: 'center', gap: '5px', color: '#6b7280' }}>
              <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#34d399', display: 'inline-block', animation: 'pulse 2s infinite' }} />
              Live
            </span>
          ) : (
            <span>Simulated</span>
          )}
          <span style={{ color: '#e5e7eb' }}>·</span>
          <span style={{ display: 'flex', alignItems: 'center', gap: '5px', fontWeight: '500', color: cfg.color }}>
            <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: cfg.color, display: 'inline-block' }} />
            {cfg.label}
          </span>
        </div>
      </div>

      {/* ── Content ── */}
      <div className="flex-1 overflow-y-auto" style={{ backgroundColor: '#f7f8fa' }}>
        <div style={{ maxWidth: '880px', margin: '0 auto', padding: '24px', display: 'flex', flexDirection: 'column', gap: '12px' }}>

          {/* Hardware strip */}
          {latest?.source === 'device' && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '11px', color: '#9ca3af' }}>
              <span style={{ color: '#6b7280', fontWeight: '500' }}>Hardware</span>
              <span style={{ color: '#d1d5db' }}>·</span>
              <span>DHT11 <span style={{ color: '#6b7280' }}>GPIO 4</span></span>
              <span style={{ color: '#d1d5db' }}>·</span>
              <span>FSR 402 <span style={{ color: '#d1d5db' }}>offline</span></span>
              <span style={{ color: '#d1d5db' }}>·</span>
              <span>ESP32 <span style={{ color: '#6b7280' }}>115200 baud</span></span>
            </div>
          )}

          {/* Primary card */}
          <SiteStatusCard latest={latest} alertSince={alertSince} patientId={patientId} apiUrl={apiUrl} />

          {/* Signal table */}
          <SignalTable latest={latest} />

          {/* Charts */}
          <div className="rounded-lg" style={{ backgroundColor: '#fff', border: '1px solid #e8eaed', overflow: 'hidden' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 24px', borderBottom: '1px solid #f0f1f3' }}>
              <span style={{ fontSize: '11px', fontWeight: '600', color: '#9ca3af', letterSpacing: '0.03em', textTransform: 'uppercase' }}>
                Trends
              </span>
              <div style={{ display: 'flex', gap: '2px', backgroundColor: '#f3f4f6', borderRadius: '6px', padding: '2px' }}>
                {TIME_WINDOWS.map((w) => (
                  <button key={w.value} onClick={() => setTimeWindow(w.value)}
                    style={{
                      padding: '3px 12px',
                      borderRadius: '4px',
                      fontSize: '11px',
                      fontWeight: '500',
                      border: 'none',
                      cursor: 'pointer',
                      transition: 'all 0.15s',
                      ...(timeWindow === w.value
                        ? { backgroundColor: '#fff', color: '#111827', boxShadow: '0 1px 2px rgba(0,0,0,0.06)' }
                        : { backgroundColor: 'transparent', color: '#9ca3af' }),
                    }}>
                    {w.label}
                  </button>
                ))}
              </div>
            </div>
            {[
              { key: 'temperature', label: 'Temperature',    unit: '°C',     color: '#3b82f6' },
              { key: 'temp_rate',   label: 'Rate of change', unit: '°C/min', color: '#f97316' },
              { key: 'humidity',    label: 'Humidity',       unit: '%',      color: '#06b6d4' },
              { key: 'pressure',    label: 'Pressure',       unit: ' rpu',   color: '#8b5cf6' },
            ].map(({ key, label, unit, color }, i, arr) => (
              <React.Fragment key={key}>
                <div style={{ padding: '16px 24px 12px' }}>
                  <TrendChart data={history} dataKey={key} label={label} unit={unit} color={color} />
                </div>
                {i < arr.length - 1 && <div style={{ borderTop: '1px solid #f0f1f3', margin: '0 24px' }} />}
              </React.Fragment>
            ))}
          </div>

        </div>
      </div>
    </div>
  );
}
