const { SerialPort }     = require('serialport');
const { ReadlineParser } = require('@serialport/parser-readline');
const { upsertReading }  = require('../db/store');

const BAUD_RATE = 115200;

const PORT_PATTERNS = [
  /usbserial/i,
  /usbmodem/i,
  /SLAB_USBtoUART/i,
  /CH340/i,
  /CP210/i,
  /FT232/i,
];

async function detectPort() {
  const ports = await SerialPort.list();
  for (const p of ports) {
    const haystack = `${p.path} ${p.manufacturer ?? ''} ${p.pnpId ?? ''}`;
    if (PORT_PATTERNS.some((re) => re.test(haystack))) return p.path;
  }
  return null;
}

function openPort(path, io) {
  console.log(`[serial] Opening ${path} at ${BAUD_RATE} baud`);

  const port   = new SerialPort({ path, baudRate: BAUD_RATE, autoOpen: false });
  const parser = port.pipe(new ReadlineParser({ delimiter: '\n' }));

  port.open((err) => {
    if (err) {
      console.error(`[serial] Failed to open ${path}:`, err.message);
      scheduleRetry(io);
    }
  });

  port.on('open',  () => console.log(`[serial] Connected — ${path}`));
  port.on('error', (err) => console.error('[serial] Error:', err.message));
  port.on('close', () => {
    console.log('[serial] Port closed — retrying in 5 s');
    scheduleRetry(io);
  });

  parser.on('data', (raw) => {
    const line = raw.trim();
    if (!line) return;

    // Always log raw lines so we can see what firmware is outputting
    console.log(`[serial] raw: ${line}`);

    if (!line.startsWith('{')) return;

    let msg;
    try {
      msg = JSON.parse(line);
    } catch {
      console.warn('[serial] JSON parse failed:', line);
      return;
    }

    // ── Status / calibration messages ──────────────────────────────────────
    if (msg.status) {
      switch (msg.status) {
        case 'ready':
          console.log('[serial] Device ready — beginning calibration');
          break;
        case 'calibrating':
          console.log(`[serial] Calibrating… ${msg.sample}/${msg.of}`);
          break;
        case 'calibrated':
          console.log(`[serial] Baseline set — temp ${msg.baseline_temp}°C`);
          break;
        case 'sensor_error':
          console.error('[serial] Sensor error:', msg.msg);
          break;
        default:
          console.log('[serial] Status:', msg.status);
      }
      io.emit('device_status', msg);
      return;
    }

    // ── Data reading ───────────────────────────────────────────────────────
    const { device_id, temperature } = msg;
    if (!device_id || typeof temperature !== 'number') {
      console.warn('[serial] Ignoring — missing device_id or temperature:', line);
      return;
    }

    const reading = { ...msg, source: 'device', received_at: Date.now() };
    upsertReading(device_id, reading);
    io.emit('reading', reading);
    console.log(
      `[serial] ${device_id}  ${temperature}°C  score=${msg.risk_score}  ${msg.alert_level}`
    );
  });
}

let retryTimer = null;

function scheduleRetry(io) {
  if (retryTimer) return;
  retryTimer = setTimeout(async () => {
    retryTimer = null;
    await startSerialBridge(io);
  }, 5000);
}

async function startSerialBridge(io) {
  const path = await detectPort();
  if (!path) {
    console.log('[serial] No ESP32 detected on any USB port');
    return;
  }
  openPort(path, io);
}

module.exports = { startSerialBridge };
