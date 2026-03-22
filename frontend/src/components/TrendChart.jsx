import React, { useMemo } from 'react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine,
} from 'recharts';
import { formatChartTime, getAlertConfig } from '../utils/formatters';

// ── Data prep ─────────────────────────────────────────────────────────────────

// Normalise a reading's time to Unix seconds, preferring received_at (wall clock)
// over device timestamp (seconds since boot).
function wallSec(r) {
  return r.received_at != null ? Math.floor(r.received_at / 1000) : r.timestamp;
}

function dedupAndFilter(data, key) {
  const seen = new Set();
  return data.filter((r) => {
    const v = r[key];
    if (v == null || !isFinite(v)) return false;
    const ts = wallSec(r);
    if (seen.has(ts)) return false;
    seen.add(ts);
    return true;
  });
}

/**
 * Rolling median with window 15 (~30 s of 2-second data).
 * Median is robust to FSR spikes; larger window smooths sensor noise
 * while preserving genuine multi-minute trends.
 */
function rollingMedian(data, key, w = 15) {
  return data.map((point, i) => {
    const half = Math.floor(w / 2);
    const slice = data
      .slice(Math.max(0, i - half), Math.min(data.length, i + half + 1))
      .map((p) => p[key])
      .sort((a, b) => a - b);
    const mid = Math.floor(slice.length / 2);
    const median = slice.length % 2 === 0 ? (slice[mid - 1] + slice[mid]) / 2 : slice[mid];
    return { ...point, [key]: Math.round(median * 10) / 10 };
  });
}

function findTransitions(data) {
  const out = [];
  for (let i = 1; i < data.length; i++) {
    if (data[i]?.alert_level !== data[i - 1]?.alert_level) {
      out.push({ timestamp: data[i].timestamp, to: data[i].alert_level });
    }
  }
  return out;
}

// ── Custom tooltip ────────────────────────────────────────────────────────────

function CustomTooltip({ active, payload, label, unit }) {
  if (!active || !payload?.length) return null;
  const val = Number(payload[0]?.value);
  if (!isFinite(val)) return null;
  return (
    <div
      className="rounded-lg px-3 py-2"
      style={{
        background: '#ffffff',
        border: '1px solid #e8eaed',
        boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
        fontSize: '12px',
      }}
    >
      <p style={{ color: '#9ca3af' }} className="mb-0.5">{formatChartTime(label)}</p>
      <p style={{ color: '#111827', fontWeight: '500' }} className="tabular-nums">{val.toFixed(1)}{unit}</p>
    </div>
  );
}

// Inline label rendered at a ReferenceLine for an alert transition
function TransitionLabel({ viewBox, level }) {
  const cfg = getAlertConfig(level);
  if (!viewBox) return null;
  const { x, y } = viewBox;
  return (
    <g>
      <rect x={x + 4} y={y + 2} width={48} height={14} rx={3} fill={cfg.color} opacity={0.12} />
      <text x={x + 7} y={y + 13} fontSize={9} fill={cfg.color} fontWeight={600} fontFamily="Inter, sans-serif">
        {cfg.label}
      </text>
    </g>
  );
}

// ── Component ─────────────────────────────────────────────────────────────────

export default function TrendChart({ data, dataKey, label, unit, color }) {
  const { chartData, domain, transitions } = useMemo(() => {
    const clean = dedupAndFilter(data, dataKey);
    const smoothed = rollingMedian(
      clean.map((r) => ({ timestamp: wallSec(r), _v: r[dataKey], alert_level: r.alert_level })),
      '_v',
      15
    ).map((r) => ({ timestamp: r.timestamp, value: r._v, alert_level: r.alert_level }));

    const values = smoothed.map((d) => d.value).filter(isFinite);
    let dom = ['auto', 'auto'];
    if (values.length > 0) {
      const lo = Math.min(...values), hi = Math.max(...values);
      const pad = Math.max((hi - lo) * 0.3, 0.4);
      dom = [
        Math.round((lo - pad) * 10) / 10,
        Math.round((hi + pad) * 10) / 10,
      ];
    }

    return { chartData: smoothed, domain: dom, transitions: findTransitions(smoothed) };
  }, [data, dataKey]);

  const hasData = chartData.length >= 2;
  const gradId = `grad-${dataKey}`;
  const latest = chartData[chartData.length - 1]?.value;

  return (
    <div>
      <div className="flex items-center justify-between mb-2.5">
        <span style={{ fontSize: '11px', color: '#9ca3af', fontWeight: '500' }}>
          {label}
        </span>
        {hasData && latest != null && (
          <span className="tabular-nums" style={{ fontSize: '12px', color: '#374151', fontWeight: '500' }}>
            {latest.toFixed(1)}{unit}
          </span>
        )}
      </div>

      {!hasData ? (
        <div className="h-36 flex items-center justify-center text-xs text-clinical-muted">
          Awaiting data…
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={148}>
          <AreaChart data={chartData} margin={{ top: 6, right: 6, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={color} stopOpacity={0.15} />
                <stop offset="100%" stopColor={color} stopOpacity={0.01} />
              </linearGradient>
            </defs>

            <CartesianGrid strokeDasharray="2 6" stroke="#f3f4f6" vertical={false} />

            <XAxis
              dataKey="timestamp"
              tickFormatter={formatChartTime}
              tick={{ fontSize: 10, fill: '#9ca3af', fontFamily: 'Inter, sans-serif' }}
              axisLine={false}
              tickLine={false}
              minTickGap={72}
            />
            <YAxis
              domain={domain}
              tickFormatter={(v) => (typeof v === 'number' ? v.toFixed(1) : v)}
              tick={{ fontSize: 10, fill: '#9ca3af', fontFamily: 'Inter, sans-serif' }}
              axisLine={false}
              tickLine={false}
              width={46}
              tickCount={4}
            />

            <Tooltip content={<CustomTooltip unit={unit} />} cursor={{ stroke: '#e3e7ec', strokeWidth: 1 }} />

            {/* Alert-level event markers */}
            {transitions.map((t) => (
              <ReferenceLine
                key={`${t.timestamp}-${t.to}`}
                x={t.timestamp}
                stroke={getAlertConfig(t.to).color}
                strokeWidth={1.5}
                strokeDasharray="3 3"
                ifOverflow="extendDomain"
                label={<TransitionLabel level={t.to} />}
              />
            ))}

            {/*
              type="basis" applies cubic B-spline interpolation between data points,
              creating smooth, organic-looking curves instead of jagged lines.
            */}
            <Area
              type="basis"
              dataKey="value"
              stroke={color}
              strokeWidth={2}
              fill={`url(#${gradId})`}
              dot={false}
              activeDot={{ r: 4, strokeWidth: 2, stroke: '#fff', fill: color }}
              isAnimationActive={false}
              connectNulls={false}
            />
          </AreaChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}
