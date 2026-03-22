import React from 'react';
import { getAlertConfig, buildAlertMessage, formatTimestamp } from '../utils/formatters';

const SECONDARY = {
  normal:   null,
  monitor:  'Routine observation should continue. No immediate clinical action is required.',
  elevated: 'Assessment of the IV site is recommended at the earliest opportunity. Consider verifying cannula position.',
  critical: 'Prompt evaluation is warranted. Consider discontinuing the current infusion pending clinical assessment.',
};

export default function AlertPanel({ latest, alertSince }) {
  if (!latest) return null;

  const level     = latest.alert_level ?? 'normal';
  const cfg       = getAlertConfig(level);
  const message   = buildAlertMessage(latest);
  const secondary = SECONDARY[level];

  return (
    <div
      className="px-4 py-3.5 rounded-lg"
      style={{
        backgroundColor: '#ffffff',
        border: '1px solid #e8eaed',
        borderLeft: `3px solid ${cfg.color}`,
      }}
    >
      <div className="flex items-start justify-between gap-4">
        <p style={{ fontSize: '13px', color: '#374151', lineHeight: '1.5' }}>{message}</p>
        {alertSince && level !== 'normal' && (
          <span style={{ fontSize: '11px', color: '#9ca3af', flexShrink: 0, marginTop: '1px' }}>
            since {formatTimestamp(alertSince)}
          </span>
        )}
      </div>
      {secondary && (
        <p className="mt-1.5" style={{ fontSize: '12px', color: '#9ca3af', lineHeight: '1.5' }}>
          {secondary}
        </p>
      )}
    </div>
  );
}
