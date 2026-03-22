/**
 * In-memory time-series store.
 * Enriches each reading with backend-computed rate-of-change and
 * a rate-aware risk score before storing.
 */

const MAX_READINGS_PER_PATIENT = 600; // ~20 minutes at 2 s/reading

/** @type {Map<string, { device_id: string, latest: object|null, readings: object[] }>} */
const store = new Map();

// ── Risk scoring (backend-authoritative) ──────────────────────────────────────

/**
 * Compute temperature rate of change over the last `window` readings.
 * Returns °C/min; negative = cooling, positive = warming.
 */
function computeTempRate(readings, window = 10) {
  if (readings.length < 2) return 0;
  const slice = readings.slice(-Math.min(window, readings.length));
  const oldest = slice[0];
  const newest = slice[slice.length - 1];
  const timeDiffMin = (newest.received_at - oldest.received_at) / 60000;
  if (timeDiffMin < 0.005) return 0;
  const rate = (newest.temperature - oldest.temperature) / timeDiffMin;
  return Math.round(rate * 10) / 10;
}

/**
 * Magnus approximation for dew point (°C).
 * A rising dew point near the IV site indicates increasing local moisture —
 * consistent with subcutaneous fluid reaching the skin surface (wet dressing).
 */
function computeDewPoint(tempC, rhPct) {
  if (tempC == null || rhPct == null) return null;
  const a = 17.625, b = 243.04;
  const lnRH = Math.log(rhPct / 100);
  const num  = b * (lnRH + (a * tempC) / (b + tempC));
  const den  = a  - (lnRH + (a * tempC) / (b + tempC));
  return Math.round((num / den) * 10) / 10;
}

/**
 * Rate-aware, multi-signal risk score (0–100).
 *
 * Temperature magnitude  — up to 50 pts  (primary infiltration signal)
 * Rate of change         — up to 25 pts  (rapid drop = higher urgency)
 * Humidity rise          — up to 15 pts  (wet-dressing surface moisture)
 * Pressure               — up to 10 pts  (FSR, reserved)
 *
 * Noise thresholds prevent DHT11 integer-step artifacts from inflating scores.
 */
function computeRiskScore(tempDrop, pressureRise, tempRate, humidityRise) {
  const magnitude   = Math.min(tempDrop * 5, 50);
  const dropRate    = Math.max(0, -(tempRate ?? 0));
  const rateScore   = dropRate > 0.3 ? Math.min((dropRate - 0.3) * 10, 25) : 0;
  const humidScore  = (humidityRise ?? 0) > 2
    ? Math.min(((humidityRise - 2) / 3) * 15, 15)
    : 0;
  const pressScore  = pressureRise != null ? Math.min(pressureRise * 0.04, 10) : 0;
  return Math.min(Math.round(magnitude + rateScore + humidScore + pressScore), 100);
}

function alertLevel(score) {
  if (score <= 30) return 'normal';
  if (score <= 60) return 'monitor';
  if (score <= 80) return 'elevated';
  return 'critical';
}

/**
 * INS Infiltration Scale (0–4).
 * Standard clinical grading used by infusion nurses.
 */
function insGrade(riskScore) {
  if (riskScore <= 10) return 0;
  if (riskScore <= 30) return 1;
  if (riskScore <= 55) return 2;
  if (riskScore <= 80) return 3;
  return 4;
}

/**
 * Cumulative temperature deficit (°C·min).
 * Area under the temp_drop curve over recent readings.
 * Captures prolonged mild cooling vs brief severe — both matter clinically.
 */
function computeCumulativeDeficit(readings) {
  if (readings.length < 2) return 0;
  const recent = readings.slice(-90); // ~3 min of history at 2s intervals
  let deficit = 0;
  for (let i = 1; i < recent.length; i++) {
    const dt      = (recent[i].received_at - recent[i - 1].received_at) / 60000;
    const avgDrop = ((recent[i].temp_drop ?? 0) + (recent[i - 1].temp_drop ?? 0)) / 2;
    deficit += avgDrop * dt;
  }
  return Math.round(deficit * 10) / 10;
}

// ── Store operations ──────────────────────────────────────────────────────────

function upsertReading(deviceId, reading) {
  if (!store.has(deviceId)) {
    store.set(deviceId, { device_id: deviceId, latest: null, readings: [] });
  }
  const patient = store.get(deviceId);

  // Compute derived fields from history before appending this reading
  const tempRate    = computeTempRate(patient.readings);
  const tempDrop    = reading.temp_drop      ?? 0;
  const pressRise   = reading.pressure_rise  ?? null;
  const humidRise   = reading.humidity_rise  ?? null;
  const dewPoint    = computeDewPoint(reading.temperature, reading.humidity ?? null);
  const riskScore   = computeRiskScore(tempDrop, pressRise, tempRate, humidRise);

  const cumulativeDeficit = computeCumulativeDeficit(patient.readings);

  const enriched = {
    ...reading,
    temp_rate:          tempRate,
    dew_point:          dewPoint,
    risk_score:         riskScore,
    alert_level:        alertLevel(riskScore),
    ins_grade:          insGrade(riskScore),
    cumulative_deficit: cumulativeDeficit,
  };

  patient.latest = enriched;
  patient.readings.push(enriched);
  if (patient.readings.length > MAX_READINGS_PER_PATIENT) {
    patient.readings = patient.readings.slice(-MAX_READINGS_PER_PATIENT);
  }
  return patient;
}

function getPatient(deviceId) {
  return store.get(deviceId) || null;
}

function getAllPatients() {
  return Array.from(store.values()).map(({ device_id, latest }) => ({
    device_id,
    latest,
  }));
}

function getHistory(deviceId, sinceTimestamp) {
  const patient = store.get(deviceId);
  if (!patient) return null;
  if (sinceTimestamp != null) {
    return patient.readings.filter((r) => {
      const wallSec = r.received_at != null ? r.received_at / 1000 : r.timestamp;
      return wallSec >= sinceTimestamp;
    });
  }
  return patient.readings;
}

module.exports = { upsertReading, getPatient, getAllPatients, getHistory };
