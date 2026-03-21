export const ALERT_CONFIG = {
  normal: {
    label: 'Normal',
    color: '#16a34a',
    badgeClass: 'text-green-700 bg-green-50 border-green-200',
    panelClass: 'bg-green-50 border-green-100',
    dotClass: 'bg-green-500',
    textClass: 'text-green-800',
  },
  monitor: {
    label: 'Monitor',
    color: '#ca8a04',
    badgeClass: 'text-yellow-700 bg-yellow-50 border-yellow-200',
    panelClass: 'bg-yellow-50 border-yellow-100',
    dotClass: 'bg-yellow-400',
    textClass: 'text-yellow-900',
  },
  elevated: {
    label: 'Elevated',
    color: '#ea580c',
    badgeClass: 'text-orange-700 bg-orange-50 border-orange-200',
    panelClass: 'bg-orange-50 border-orange-100',
    dotClass: 'bg-orange-500',
    textClass: 'text-orange-900',
  },
  critical: {
    label: 'Critical',
    color: '#dc2626',
    badgeClass: 'text-red-700 bg-red-50 border-red-200',
    panelClass: 'bg-red-50 border-red-100',
    dotClass: 'bg-red-500',
    textClass: 'text-red-900',
  },
};

export function getAlertConfig(level) {
  return ALERT_CONFIG[level] ?? ALERT_CONFIG.normal;
}

/**
 * Returns a single integrated clinical interpretation sentence for a reading.
 * Integrates both temperature and pressure signals per clinical guidelines.
 */
export function buildAlertMessage(reading) {
  if (!reading) return '';
  const { alert_level: level, temp_drop = 0, pressure_rise = 0 } = reading;

  switch (level) {
    case 'normal':
      return 'No indications of infiltration. Site conditions remain stable.';

    case 'monitor': {
      const bothChanging = temp_drop > 0.3 && pressure_rise > 20;
      if (bothChanging) {
        return 'Subtle combined changes in local temperature and pressure have been noted. Continued observation is recommended.';
      }
      if (temp_drop > 0.3) {
        return 'A minor reduction in local temperature has been observed. Continued observation is recommended.';
      }
      if (pressure_rise > 20) {
        return 'A mild increase in localized pressure has been detected. Continued observation is recommended.';
      }
      return 'Subtle changes detected. Continued observation recommended.';
    }

    case 'elevated':
      return 'Patterns consistent with early-stage infiltration. Combined changes in local temperature and pressure suggest developing fluid extravasation. Clinical review is advised.';

    case 'critical':
      return 'Significant deviation detected. Marked changes in both localized pressure and temperature indicate a high likelihood of infiltration. Immediate clinical assessment is recommended.';

    default:
      return 'Site status is currently undetermined. Sensor data is being evaluated.';
  }
}

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
  if (score > 80) return '#dc2626';
  if (score > 60) return '#ea580c';
  if (score > 30) return '#ca8a04';
  return '#16a34a';
}
