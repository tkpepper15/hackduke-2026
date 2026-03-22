// ── Alert level config ────────────────────────────────────────────────────────

export const ALERT_CONFIG = {
  normal: {
    label: 'Normal',
    color: '#1a9e50',
    badgeClass: 'text-emerald-700 bg-emerald-50 border-emerald-200',
    panelBg: 'bg-emerald-50',
    panelBorder: 'border-emerald-100',
    dotClass: 'bg-emerald-500',
    textClass: 'text-emerald-900',
    mutedClass: 'text-emerald-700',
  },
  monitor: {
    label: 'Monitor',
    color: '#d98a00',
    badgeClass: 'text-amber-700 bg-amber-50 border-amber-200',
    panelBg: 'bg-amber-50',
    panelBorder: 'border-amber-100',
    dotClass: 'bg-amber-400',
    textClass: 'text-amber-900',
    mutedClass: 'text-amber-700',
  },
  elevated: {
    label: 'Elevated',
    color: '#d45f00',
    badgeClass: 'text-orange-700 bg-orange-50 border-orange-200',
    panelBg: 'bg-orange-50',
    panelBorder: 'border-orange-100',
    dotClass: 'bg-orange-500',
    textClass: 'text-orange-900',
    mutedClass: 'text-orange-700',
  },
  critical: {
    label: 'Critical',
    color: '#d91a0d',
    badgeClass: 'text-red-700 bg-red-50 border-red-200',
    panelBg: 'bg-red-50',
    panelBorder: 'border-red-100',
    dotClass: 'bg-red-500',
    textClass: 'text-red-900',
    mutedClass: 'text-red-700',
  },
};

export function getAlertConfig(level) {
  return ALERT_CONFIG[level] ?? ALERT_CONFIG.normal;
}

// ── INS Infiltration Scale ────────────────────────────────────────────────────

export const INS_GRADES = {
  0: { label: 'Grade 0', summary: 'No symptoms',          color: '#1a9e50', bg: '#f0fdf4', border: '#bbf7d0' },
  1: { label: 'Grade 1', summary: 'Skin cool, mild edema < 1 in., possible blanching', color: '#d98a00', bg: '#fffbeb', border: '#fde68a' },
  2: { label: 'Grade 2', summary: 'Skin cool, edema 1–6 in., possible pain',           color: '#d45f00', bg: '#fff7ed', border: '#fed7aa' },
  3: { label: 'Grade 3', summary: 'Gross edema > 6 in., possible numbness',            color: '#d91a0d', bg: '#fef2f2', border: '#fecaca' },
  4: { label: 'Grade 4', summary: 'Taut skin, circulatory impairment, severe pain',    color: '#7f1d1d', bg: '#fef2f2', border: '#f87171' },
};

export function getInsGrade(grade) {
  return INS_GRADES[grade ?? 0] ?? INS_GRADES[0];
}

export function formatDuration(sinceUnixSec) {
  if (!sinceUnixSec) return null;
  const secs = Math.max(0, Math.floor(Date.now() / 1000) - sinceUnixSec);
  if (secs < 60) return `${secs}s`;
  const mins = Math.floor(secs / 60);
  const rem  = secs % 60;
  if (mins < 60) return `${mins}m ${rem}s`;
  return `${Math.floor(mins / 60)}h ${mins % 60}m`;
}

// ── Alert messages ────────────────────────────────────────────────────────────

export function buildAlertMessage(reading) {
  if (!reading) return '';
  const {
    alert_level: level,
    temp_drop = 0,
    pressure_rise = 0,
    temp_rate = 0,
    humidity_rise = 0,
  } = reading;

  const dropping    = temp_rate < -0.3;
  const rapid       = temp_rate < -1.5;
  const moistening  = humidity_rise > 2;   // surface moisture accumulation

  switch (level) {
    case 'normal':
      return 'No indications of infiltration. Site conditions remain stable.';

    case 'monitor': {
      if (rapid && moistening)
        return 'Accelerating temperature decline alongside rising local humidity suggests early fluid accumulation. Close observation is recommended.';
      if (rapid)
        return 'Temperature is declining at an accelerating rate. Close observation is recommended to detect further progression.';
      if (moistening && temp_drop > 0.3)
        return 'A minor temperature reduction with increased local humidity has been observed. These combined changes warrant continued observation.';
      if (dropping && temp_drop > 0.5)
        return 'A gradual reduction in local temperature with a continuing downward trend has been noted. Continued observation is recommended.';
      if (temp_drop > 0.3 && pressure_rise > 20)
        return 'Subtle combined changes in local temperature and pressure have been noted. Continued observation is recommended.';
      if (temp_drop > 0.3)
        return 'A minor reduction in local temperature has been observed. Continued observation is recommended.';
      if (pressure_rise > 20)
        return 'A mild increase in localized pressure has been detected. Continued observation is recommended.';
      return 'Subtle changes detected. Continued observation recommended.';
    }

    case 'elevated': {
      if (moistening)
        return 'Declining temperature and elevated local humidity are consistent with early-stage infiltration and possible fluid reaching the skin surface. Clinical review is advised.';
      if (rapid)
        return 'Rapidly declining temperature with a sustained downward trend is consistent with early-stage infiltration. Clinical review is advised promptly.';
      return 'Patterns consistent with early-stage infiltration. Combined sensor changes suggest developing fluid extravasation. Clinical review is advised.';
    }

    case 'critical':
      return 'Significant deviation detected across multiple signals. Marked changes in local temperature and moisture indicate a high likelihood of infiltration. Immediate clinical assessment is recommended.';

    default:
      return 'Site status is currently undetermined. Sensor data is being evaluated.';
  }
}

// ── Formatting helpers ────────────────────────────────────────────────────────

export function formatTimestamp(timestamp) {
  if (!timestamp) return '—';
  return new Date(timestamp * 1000).toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
}

export function formatChartTime(timestamp) {
  if (!timestamp) return '';
  return new Date(timestamp * 1000).toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function riskScoreColor(score) {
  if (score > 80) return '#d91a0d';
  if (score > 60) return '#d45f00';
  if (score > 30) return '#d98a00';
  return '#1a9e50';
}
