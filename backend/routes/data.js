const express = require('express');
const router = express.Router();
const { upsertReading } = require('../db/store');
const { validateReading } = require('../middleware/validate');

// POST /data  — ingest a single sensor reading from an ESP32 device
router.post('/', validateReading, (req, res) => {
  const io = req.app.get('io');

  const reading = {
    ...req.body,
    received_at: Date.now(),
  };

  upsertReading(reading.device_id, reading);

  // Broadcast to dashboard clients in real time
  io.emit('reading', reading);

  res.status(201).json({ status: 'accepted' });
});

module.exports = router;
