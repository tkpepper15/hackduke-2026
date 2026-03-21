import React, { useState, useEffect, useRef, useCallback } from 'react';
import AlertPanel from './AlertPanel';
import MetricsRow from './MetricsRow';
import TrendChart from './TrendChart';
import { getAlertConfig, formatTimestamp } from '../utils/formatters';

const TIME_WINDOWS = [
  { label: '5 min', value: 5 },
  { label: '15 min', value: 15 },
  { label: '30 min', value: 30 },
];

/**
 * Scan history backwards to find when the current alert level first began.
 * Returns the timestamp of the first reading at the current level in the
 * most recent uninterrupted run.
 */
function findAlertSince(history, currentLevel) {
  if (!history || history.length === 0) return null;
  for (let i = history.length - 1; i >= 0; i--) {
    if (history[i].alert_level !== currentLevel) {
      return history[i + 1]?.timestamp ?? null;
    }
  }
  return history[0]?.timestamp ?? null;
}

export default function LiveMonitor({ patientId, latest, apiUrl }) {
  const [history, setHistory] = useState([]);
  const [timeWindow, setTimeWindow] = useState(15);
  const [alertSince, setAlertSince] = useState(null);

  const prevLatestRef = useRef(null);
  const prevLatest = prevLatestRef.current;

  const fetchHistory = useCallback(() => {
    fetch(`${apiUrl}/patients/${patientId}/history?minutes=${timeWindow}`)
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data)) {
          setHistory(data);
          if (latest?.alert_level) {
            setAlertSince(findAlertSince(data, latest.alert_level));
          }
        }
      })
      .catch(console.error);
  }, [patientId, timeWindow, apiUrl, latest?.alert_level]);

  useEffect(() => {
    setHistory([]);
    fetchHistory();
  }, [fetchHistory]);

  // Append live readings, trim to window, track prevLatest and alertSince
  useEffect(() => {
    if (!latest) return;

    setHistory((prev) => {
      const cutoff = Math.floor(Date.now() / 1000) - timeWindow * 60;
      const trimmed = prev.filter((r) => r.timestamp >= cutoff);
      const last = trimmed[trimmed.length - 1];
      if (last?.timestamp === latest.timestamp) return trimmed;
      return [...trimmed, latest];
    });

    // Detect alert level transitions for the "since" timestamp
    if (prevLatestRef.current?.alert_level !== latest.alert_level) {
      setAlertSince(latest.timestamp);
    }

    prevLatestRef.current = latest;
  }, [latest, timeWindow]);

  const level = latest?.alert_level ?? 'normal';
  const cfg = getAlertConfig(level);

  return (
    <div className="px-7 py-6 max-w-4xl mx-auto space-y-4">
      {/* ── Header ── */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-[17px] font-semibold text-clinical-text tracking-tight">
            {patientId}
          </h2>
          <p className="text-xs text-clinical-muted mt-0.5">
            Last updated: {formatTimestamp(latest?.timestamp)}
          </p>
        </div>
        <div
          className={`flex items-center gap-2 px-3.5 py-1.5 rounded-full border text-sm font-medium ${cfg.badgeClass}`}
        >
          <span
            className={`w-2 h-2 rounded-full ${cfg.dotClass} ${
              level === 'critical' ? 'animate-pulse' : ''
            }`}
          />
          {cfg.label}
        </div>
      </div>

      {/* ── Alert interpretation ── */}
      <AlertPanel latest={latest} alertSince={alertSince} />

      {/* ── Metric cards ── */}
      {latest && <MetricsRow latest={latest} prevLatest={prevLatest} />}

      {/* ── Time window + chart section ── */}
      <div className="bg-white border border-clinical-border rounded-xl p-4 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-clinical-muted">
            Trend
          </h3>
          <div className="flex gap-1.5">
            {TIME_WINDOWS.map((w) => (
              <button
                key={w.value}
                onClick={() => setTimeWindow(w.value)}
                className={`px-3 py-1 text-xs rounded-md border transition-colors ${
                  timeWindow === w.value
                    ? 'bg-slate-700 text-white border-slate-700'
                    : 'bg-white text-clinical-muted border-clinical-border hover:border-gray-400'
                }`}
              >
                {w.label}
              </button>
            ))}
          </div>
        </div>

        <TrendChart
          data={history}
          dataKey="temperature"
          label="Temperature"
          unit="°C"
          color="#3b82f6"
        />
        <TrendChart
          data={history}
          dataKey="pressure"
          label="Pressure"
          unit=" rpu"
          color="#8b5cf6"
        />
      </div>
    </div>
  );
}
