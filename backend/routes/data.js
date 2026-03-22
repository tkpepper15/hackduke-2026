const express = require('express');
const router = express.Router();
const { upsertReading } = require('../db/store');
const { validateReading } = require('../middleware/validate');
const { recalibrate } = require('../serial/bridge');

// POST /data  — ingest a single sensor reading from an ESP32 device
router.post('/', validateReading, (req, res) => {
  const io = req.app.get('io');

  const reading = {
    ...req.body,
    received_at: Date.now(),
  };

  const patient = upsertReading(reading.device_id, reading);

  // Broadcast enriched reading with backend-computed risk score
  io.emit('reading', patient.latest);

  res.status(201).json({ status: 'accepted' });
});

// POST /data/recalibrate  — trigger device recalibration
router.post('/recalibrate', (req, res) => {
  const success = recalibrate();
  if (success) {
    res.json({ status: 'command_sent' });
  } else {
    res.status(503).json({ status: 'error', message: 'Device not connected' });
  }
});

module.exports = router;
