import React, { useMemo } from 'react';
import {
  ResponsiveContainer,
  ComposedChart,
  Area,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from 'recharts';
import { formatChartTime } from '../utils/formatters';

function CustomTooltip({ active, payload, label, unit, prevValue }) {
  if (!active || !payload?.length) return null;
  const val = Number(payload[0].value);
  const delta = prevValue != null ? val - prevValue : null;

  return (
    <div className="bg-white border border-clinical-border rounded-lg px-3 py-2 shadow-md text-xs min-w-[110px]">
      <p className="text-clinical-muted mb-1">{formatChartTime(label)}</p>
      <p className="font-semibold text-clinical-text text-sm">
        {val.toFixed(1)}{unit}
      </p>
      {delta != null && Math.abs(delta) > 0.05 && (
        <p className={`mt-0.5 font-medium ${delta > 0 ? 'text-orange-500' : 'text-blue-500'}`}>
          {delta > 0 ? '↑' : '↓'} {Math.abs(delta).toFixed(1)}{unit}
        </p>
      )}
    </div>
  );
}

function smooth(data, key, windowSize = 3) {
  return data.map((point, i) => {
    const start = Math.max(0, i - Math.floor(windowSize / 2));
    const end = Math.min(data.length, start + windowSize);
    const slice = data.slice(start, end);
    const avg = slice.reduce((sum, p) => sum + (p[key] ?? 0), 0) / slice.length;
    return { ...point, [key]: Math.round(avg * 10) / 10 };
  });
}

export default function TrendChart({ data, dataKey, label, unit, color }) {
  const chartData = useMemo(() => {
    const mapped = data.map((r) => ({ timestamp: r.timestamp, value: r[dataKey] }));
    return smooth(mapped, 'value', 3);
  }, [data, dataKey]);

  const hasData = chartData.length >= 2;

  // Pass adjacent value into tooltip for delta display
  const tooltipCursorRef = React.useRef(null);
  const getPrevValue = (index) => {
    if (index <= 0) return null;
    return chartData[index - 1]?.value ?? null;
  };

  const gradientId = `grad-${dataKey}`;

  return (
    <div className="bg-white border border-clinical-border rounded-xl p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-clinical-muted">
          {label}
        </h3>
        {hasData && (
          <span className="text-xs text-clinical-subtle">
            {chartData[chartData.length - 1]?.value?.toFixed(1)}{unit}
          </span>
        )}
      </div>

      {!hasData ? (
        <div className="h-44 flex items-center justify-center text-xs text-clinical-muted">
          Awaiting sufficient data…
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={176}>
          <ComposedChart data={chartData} margin={{ top: 4, right: 8, left: -16, bottom: 0 }}>
            <defs>
              <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={color} stopOpacity={0.15} />
                <stop offset="95%" stopColor={color} stopOpacity={0} />
              </linearGradient>
            </defs>

            <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" vertical={false} />

            <XAxis
              dataKey="timestamp"
              tickFormatter={formatChartTime}
              tick={{ fontSize: 10, fill: '#9ca3af' }}
              axisLine={false}
              tickLine={false}
              minTickGap={80}
            />
            <YAxis
              domain={['auto', 'auto']}
              tick={{ fontSize: 10, fill: '#9ca3af' }}
              axisLine={false}
              tickLine={false}
              width={40}
            />

            <Tooltip
              content={<CustomTooltip unit={unit} />}
              cursor={{ stroke: '#e5e7eb', strokeWidth: 1 }}
            />

            <Area
              type="monotone"
              dataKey="value"
              fill={`url(#${gradientId})`}
              stroke="none"
              isAnimationActive={false}
            />
            <Line
              type="monotone"
              dataKey="value"
              stroke={color}
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 4, strokeWidth: 2, stroke: '#fff', fill: color }}
              isAnimationActive={false}
              connectNulls={false}
            />
          </ComposedChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}
