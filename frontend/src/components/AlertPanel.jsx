import React from 'react';
import { getAlertConfig, buildAlertMessage, formatTimestamp } from '../utils/formatters';

const SECONDARY = {
  normal: null,
  monitor:
    'Routine observation should continue. No immediate clinical action is required.',
  elevated:
    'Assessment of the IV site is recommended at the earliest opportunity. Consider verifying cannula position.',
  critical:
    'Prompt evaluation is warranted. Consider discontinuing the current infusion pending clinical assessment.',
};

export default function AlertPanel({ latest, alertSince }) {
  if (!latest) return null;

  const level = latest.alert_level ?? 'normal';
  const cfg = getAlertConfig(level);
  const message = buildAlertMessage(latest);
  const secondary = SECONDARY[level];

  return (
    <div
      className={`rounded-xl border px-4 py-3.5 border-l-4 ${cfg.panelClass}`}
      style={{ borderLeftColor: cfg.color }}
    >
      <div className="flex items-start gap-3">
        <span
          className={`mt-[3px] w-2.5 h-2.5 rounded-full flex-shrink-0 ${cfg.dotClass} ${
            level === 'critical' ? 'animate-pulse' : ''
          }`}
        />
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-4">
            <p className={`text-sm font-medium leading-snug ${cfg.textClass}`}>
              {message}
            </p>
            {alertSince && level !== 'normal' && (
              <span className="text-[10px] text-clinical-muted whitespace-nowrap flex-shrink-0 mt-0.5">
                since {formatTimestamp(alertSince)}
              </span>
            )}
          </div>
          {secondary && (
            <p className="text-xs text-clinical-muted mt-1.5 leading-snug">{secondary}</p>
          )}
        </div>
      </div>
    </div>
  );
}
