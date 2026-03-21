/**
 * In-memory time-series store.
 * Structured for fast latest-read lookups and efficient history slicing.
 * Drop-in replacement with Firestore or MongoDB is straightforward.
 */

const MAX_READINGS_PER_PATIENT = 600; // ~20 minutes at 2 s/reading

/** @type {Map<string, { device_id: string, latest: object|null, readings: object[] }>} */
const store = new Map();

function upsertReading(deviceId, reading) {
  if (!store.has(deviceId)) {
    store.set(deviceId, { device_id: deviceId, latest: null, readings: [] });
  }
  const patient = store.get(deviceId);
  patient.latest = reading;
  patient.readings.push(reading);
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
    return patient.readings.filter((r) => r.timestamp >= sinceTimestamp);
  }
  return patient.readings;
}

module.exports = { upsertReading, getPatient, getAllPatients, getHistory };
