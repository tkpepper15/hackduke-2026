function validateReading(req, res, next) {
  const { device_id, temperature, pressure } = req.body;

  if (!device_id || typeof device_id !== 'string' || device_id.trim().length === 0) {
    return res.status(400).json({ error: 'Invalid or missing device_id' });
  }
  if (typeof temperature !== 'number' || isNaN(temperature)) {
    return res.status(400).json({ error: 'temperature must be a number' });
  }
  if (typeof pressure !== 'number' || isNaN(pressure)) {
    return res.status(400).json({ error: 'pressure must be a number' });
  }

  next();
}

module.exports = { validateReading };
