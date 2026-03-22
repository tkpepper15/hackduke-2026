/**
 * Mock data generator for demo / development.
 * Simulates three patients in distinct physiological states:
 *   patient_001 — stable, no infiltration
 *   patient_002 — gradual, developing infiltration (score rises over time)
 *   patient_003 — established elevated risk
 */

const { upsertReading } = require('./store');

const PATIENTS = [
  { id: 'patient_001', baselineTemp: 36.8, baselinePressure: 748 },
  { id: 'patient_002', baselineTemp: 37.1, baselinePressure: 762 },
  { id: 'patient_003', baselineTemp: 36.5, baselinePressure: 755 },
];

const SCENARIOS = {
  patient_001: 'normal',
  patient_002: 'developing',
  patient_003: 'elevated',
};

let tick = 0;

function noise(scale = 1) {
  return (Math.random() - 0.5) * scale;
}

function calcRiskScore(tempDrop, pressureRise) {
  const tempComponent = Math.min(tempDrop * 0.6 * 5, 60);
  const pressComponent = Math.min(pressureRise * 0.4 * 0.1, 40);
  return Math.min(Math.round(tempComponent + pressComponent), 100);
}

function alertLevel(score) {
  if (score <= 30) return 'normal';
  if (score <= 60) return 'monitor';
  if (score <= 80) return 'elevated';
  return 'critical';
}

function generateReading(patient, scenario) {
  let tempDrop = 0;
  let pressureRise = 0;

  switch (scenario) {
    case 'normal':
      tempDrop = Math.max(0, 0.15 + noise(0.12));
      pressureRise = Math.max(0, 8 + noise(6));
      break;

    case 'developing':
      // Slow progression capped at critical threshold after ~8 minutes
      tempDrop = Math.min(3.0, 0.2 + tick * 0.008 + Math.abs(noise(0.08)));
      pressureRise = Math.min(180, 15 + tick * 0.7 + Math.abs(noise(8)));
      break;

    case 'elevated':
      tempDrop = 1.7 + noise(0.15);
      pressureRise = 82 + noise(10);
      break;

    case 'critical':
      tempDrop = 3.0 + noise(0.2);
      pressureRise = 165 + noise(15);
      break;

    default:
      break;
  }

  const temperature = Math.round((patient.baselineTemp - tempDrop) * 10) / 10;
  const pressure = Math.round(patient.baselinePressure + pressureRise);
  const riskScore = calcRiskScore(tempDrop, pressureRise);

  return {
    device_id: patient.id,
    temperature,
    pressure,
    temp_drop: Math.round(tempDrop * 10) / 10,
    pressure_rise: Math.round(pressureRise),
    risk_score: riskScore,
    alert_level: alertLevel(riskScore),
    source: 'mock',
    timestamp: Math.floor(Date.now() / 1000),
  };
}

function startMockDataGeneration(io) {
  console.log(`[mock] seeding ${PATIENTS.length} patients with historical data`);

  // Pre-seed ~5 minutes of historical readings so charts load with data
  PATIENTS.forEach((patient) => {
    const scenario = SCENARIOS[patient.id];
    for (let i = 150; i >= 0; i--) {
      const reading = generateReading(patient, scenario);
      reading.timestamp = Math.floor(Date.now() / 1000) - i * 2;
      upsertReading(patient.id, reading);
    }
  });

  // Live updates every 2 seconds
  setInterval(() => {
    tick++;
    PATIENTS.forEach((patient) => {
      const reading = generateReading(patient, SCENARIOS[patient.id]);
      upsertReading(patient.id, reading);
      // Broadcast to all connected WebSocket clients
      io.emit('reading', reading);
    });
  }, 2000);
}

module.exports = { startMockDataGeneration };
