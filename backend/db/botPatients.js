/**
 * Bot patients — synthetic readings for demo purposes.
 *
 * bot_baseline    : stable normal site, no infiltration
 * bot_infiltration: 8-minute progressive infiltration cycle
 *                   (normal → monitor → elevated → critical → reset)
 */

const { upsertReading } = require('./store');

const BASELINE_TEMP     = 36.5;
const BASELINE_HUMIDITY = 45;
const CYCLE_MS          = 8 * 60 * 1000; // 8-minute infiltration cycle

function noise(range) {
  return (Math.random() - 0.5) * 2 * range;
}

function alertLevel(score) {
  if (score <= 30) return 'normal';
  if (score <= 60) return 'monitor';
  if (score <= 80) return 'elevated';
  return 'critical';
}

// ── Baseline bot ───────────────────────────────────────────────────────────────
function emitBaseline(io) {
  const temp     = Math.round((BASELINE_TEMP + noise(0.3)) * 10) / 10;
  const humidity = Math.round((BASELINE_HUMIDITY + noise(1.5)) * 10) / 10;

  const reading = {
    device_id:     'bot_baseline',
    temperature:   temp,
    humidity,
    pressure:      null,
    temp_drop:     0,
    humidity_rise: 0,
    pressure_rise: null,
    risk_score:    0,
    alert_level:   'normal',
    source:        'bot',
    timestamp:     Math.floor(Date.now() / 1000),
    received_at:   Date.now(),
  };

  upsertReading('bot_baseline', reading);
  io.emit('reading', reading);
}

// ── Infiltration bot ───────────────────────────────────────────────────────────
function emitInfiltration(io) {
  // phase 0→1 over the 8-minute cycle
  const phase = (Date.now() % CYCLE_MS) / CYCLE_MS;

  // Smooth sigmoid-like progression: flat start, steep middle, plateau
  // phase 0.0–0.15 → normal; 0.15–0.75 → progressive; 0.75–0.90 → peak; 0.90–1.0 → recovery
  let severity = 0;
  if (phase < 0.15) {
    severity = 0;
  } else if (phase < 0.75) {
    severity = Math.pow((phase - 0.15) / 0.60, 1.6);
  } else if (phase < 0.90) {
    severity = 1;
  } else {
    severity = 1 - (phase - 0.90) / 0.10;
  }

  const tempDrop     = Math.round(severity * 4.5 * 10) / 10;        // up to 4.5 °C drop
  const humidityRise = Math.round(severity * 14  * 10) / 10;        // up to 14 % rise
  const temp         = Math.round((BASELINE_TEMP - tempDrop + noise(0.2)) * 10) / 10;
  const humidity     = Math.round((BASELINE_HUMIDITY + humidityRise + noise(1)) * 10) / 10;

  // Approximate risk (backend store.js will recompute with rate)
  const magnitude  = Math.min(tempDrop * 5, 50);
  const humidScore = humidityRise > 2 ? Math.min(((humidityRise - 2) / 3) * 15, 15) : 0;
  const riskScore  = Math.min(Math.round(magnitude + humidScore), 100);

  const reading = {
    device_id:     'bot_infiltration',
    temperature:   temp,
    humidity,
    pressure:      null,
    temp_drop:     tempDrop,
    humidity_rise: humidityRise,
    pressure_rise: null,
    risk_score:    riskScore,
    alert_level:   alertLevel(riskScore),
    source:        'bot',
    timestamp:     Math.floor(Date.now() / 1000),
    received_at:   Date.now(),
  };

  upsertReading('bot_infiltration', reading);
  io.emit('reading', reading);
}

// ── Start ──────────────────────────────────────────────────────────────────────
function startBotPatients(io) {
  // Stagger slightly so they don't emit at identical times
  setInterval(() => emitBaseline(io),     3000);
  setTimeout(() => setInterval(() => emitInfiltration(io), 3000), 1500);

  // Emit initial readings immediately
  emitBaseline(io);
  emitInfiltration(io);

  console.log('[bot] Baseline and infiltration patients started');
}

module.exports = { startBotPatients };
