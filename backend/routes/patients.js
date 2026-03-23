const express = require('express');
const router = express.Router();
const { getAllPatients, getPatient, getHistory, clearHistory } = require('../db/store');

// GET /patients — list all active devices with their latest reading
router.get('/', (_req, res) => {
  res.json(getAllPatients());
});

// GET /patients/:id — latest reading + summary for a single patient
router.get('/:id', (req, res) => {
  const patient = getPatient(req.params.id);
  if (!patient) return res.status(404).json({ error: 'Patient not found' });
  res.json({ device_id: patient.device_id, latest: patient.latest });
});

// GET /patients/:id/history?minutes=15 — time-series data
router.get('/:id/history', (req, res) => {
  const minutes = req.query.minutes ? parseInt(req.query.minutes, 10) : null;
  const sinceTimestamp =
    minutes != null && !isNaN(minutes)
      ? Math.floor(Date.now() / 1000) - minutes * 60
      : null;

  const history = getHistory(req.params.id, sinceTimestamp);
  if (history === null) return res.status(404).json({ error: 'Patient not found' });

  res.json(history);
});

// DELETE /patients/:id/history — clear all readings (keeps calibration)
router.delete('/:id/history', (req, res) => {
  const success = clearHistory(req.params.id);
  if (!success) return res.status(404).json({ error: 'Patient not found' });
  res.json({ status: 'cleared' });
});

module.exports = router;
