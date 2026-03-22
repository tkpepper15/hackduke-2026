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

function rollingMedian(data, key, w = 15) {
  return data.map((point, i) => {
    const half  = Math.floor(w / 2);
    const slice = data
      .slice(Math.max(0, i - half), Math.min(data.length, i + half + 1))
      .map((p) => p[key])
      .sort((a, b) => a - b);
    const mid    = Math.floor(slice.length / 2);
    const median = slice.length % 2 === 0 ? (slice[mid - 1] + slice[mid]) / 2 : slice[mid];
    return { ...point, [key]: Math.round(median * 10) / 10 };
  });
}

/**
 * Return at most one reference line per alert-level change, with a minimum
 * gap of MIN_GAP_SEC between consecutive markers so rapid oscillations
 * (e.g. a bot cycling every few seconds) don't flood the chart.
 */
function findTransitions(data, minGapSec = 90) {
  const out   = [];
  let lastTs  = -Infinity;
  for (let i = 1; i < data.length; i++) {
    if (data[i]?.alert_level !== data[i - 1]?.alert_level) {
      const ts = data[i].timestamp;
      if (ts - lastTs >= minGapSec) {
        out.push({ timestamp: ts, to: data[i].alert_level });
        lastTs = ts;
      }
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
    <div style={{
      background: '#ffffff',
      border: '1px solid #e8eaed',
      borderRadius: '6px',
      boxShadow: '0 2px 8px rgba(0,0,0,0.07)',
      padding: '6px 10px',
      fontSize: '12px',
    }}>
      <p style={{ color: '#9ca3af', marginBottom: '2px' }}>{formatChartTime(label)}</p>
      <p style={{ color: '#111827', fontWeight: '500' }} className="tabular-nums">
        {val % 1 === 0 ? val : val.toFixed(1)}{unit}
      </p>
    </div>
  );
}

/** Small tick mark at top of a transition line — no text, no badge. */
function TransitionTick({ viewBox, level }) {
  const cfg = getAlertConfig(level);
  if (!viewBox) return null;
  const x = viewBox.x;
  return (
    <g>
      <polygon
        points={`${x},2 ${x - 3.5},10 ${x + 3.5},10`}
        fill={cfg.color}
        opacity={0.65}
      />
    </g>
  );
}

// ── Component ─────────────────────────────────────────────────────────────────

export default function TrendChart({ data, dataKey, label, unit, color }) {
  const { chartData, domain, transitions } = useMemo(() => {
    const clean    = dedupAndFilter(data, dataKey);
    const smoothed = rollingMedian(
      clean.map((r) => ({ timestamp: wallSec(r), _v: r[dataKey], alert_level: r.alert_level })),
      '_v',
      15
    ).map((r) => ({ timestamp: r.timestamp, value: r._v, alert_level: r.alert_level }));

    const values = smoothed.map((d) => d.value).filter(isFinite);
    let dom = ['auto', 'auto'];
    if (values.length > 0) {
      const lo  = Math.min(...values), hi = Math.max(...values);
      const pad = Math.max((hi - lo) * 0.25, 0.3);
      dom = [
        Math.round((lo - pad) * 10) / 10,
        Math.round((hi + pad) * 10) / 10,
      ];
    }

    return { chartData: smoothed, domain: dom, transitions: findTransitions(smoothed) };
  }, [data, dataKey]);

  const hasData = chartData.length >= 2;
  const gradId  = `grad-${dataKey}`;
  const latest  = chartData[chartData.length - 1]?.value;

  // Y-axis formatter: drop trailing .0 for whole numbers
  const yFmt = (v) => {
    if (typeof v !== 'number') return v;
    return v % 1 === 0 ? String(v) : v.toFixed(1);
  };

  return (
    <div>
      {/* Chart header */}
      <div className="flex items-center justify-between mb-3">
        <span style={{ fontSize: '11px', color: '#9ca3af', fontWeight: '500' }}>{label}</span>
        {hasData && latest != null && (
          <span className="tabular-nums" style={{ fontSize: '12px', color: '#374151', fontWeight: '500' }}>
            {latest % 1 === 0 ? latest : latest.toFixed(1)}{unit}
          </span>
        )}
      </div>

      {!hasData ? (
        <div style={{ height: '120px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <span style={{ fontSize: '12px', color: '#d1d5db' }}>Awaiting data…</span>
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={130}>
          <AreaChart data={chartData} margin={{ top: 10, right: 4, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%"   stopColor={color} stopOpacity={0.12} />
                <stop offset="100%" stopColor={color} stopOpacity={0}    />
              </linearGradient>
            </defs>

            <CartesianGrid strokeDasharray="2 6" stroke="#f0f1f3" vertical={false} />

            <XAxis
              dataKey="timestamp"
              tickFormatter={formatChartTime}
              tick={{ fontSize: 10, fill: '#c4c9d4', fontFamily: 'Inter, sans-serif' }}
              axisLine={false}
              tickLine={false}
              minTickGap={80}
            />
            <YAxis
              domain={domain}
              tickFormatter={yFmt}
              tick={{ fontSize: 10, fill: '#c4c9d4', fontFamily: 'Inter, sans-serif' }}
              axisLine={false}
              tickLine={false}
              width={40}
              tickCount={3}
            />

            <Tooltip
              content={<CustomTooltip unit={unit} />}
              cursor={{ stroke: '#e8eaed', strokeWidth: 1 }}
            />

            {/* Sparse transition markers — deduped, no text labels */}
            {transitions.map((t) => (
              <ReferenceLine
                key={`${t.timestamp}-${t.to}`}
                x={t.timestamp}
                stroke={getAlertConfig(t.to).color}
                strokeWidth={1}
                strokeDasharray="3 4"
                strokeOpacity={0.35}
                ifOverflow="extendDomain"
                label={<TransitionTick level={t.to} />}
              />
            ))}

            <Area
              type="basis"
              dataKey="value"
              stroke={color}
              strokeWidth={1.75}
              fill={`url(#${gradId})`}
              dot={false}
              activeDot={{ r: 3.5, strokeWidth: 2, stroke: '#fff', fill: color }}
              isAnimationActive={false}
              connectNulls={false}
            />
          </AreaChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}
