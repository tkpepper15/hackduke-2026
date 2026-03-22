const express = require('express');
const router  = express.Router();
const { getPatient, getHistory } = require('../db/store');

const GEMINI_URL =
  'https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent';

/** Summarise trend over a slice of readings for one field. */
function trendSummary(readings, field) {
  const vals = readings.map((r) => r[field]).filter((v) => v != null && isFinite(v));
  if (vals.length < 2) return null;
  const first = vals[0], last = vals[vals.length - 1];
  const min   = Math.min(...vals), max = Math.max(...vals);
  const delta = last - first;
  const dir   = Math.abs(delta) < 0.2 ? 'stable' : delta > 0 ? 'increasing' : 'decreasing';
  return { first, last, min, max, delta: Math.round(delta * 10) / 10, dir, n: vals.length };
}

/** Convert history into a compact narrative block for the prompt. */
function buildTrendBlock(history) {
  if (!history || history.length < 3) return 'Trend history: insufficient data (monitoring just started).';

  // Bin into thirds so we can describe early/mid/late phase
  const third = Math.floor(history.length / 3);
  const early = history.slice(0, third);
  const late  = history.slice(-third);

  const tempEarly = trendSummary(early, 'temperature');
  const tempLate  = trendSummary(late,  'temperature');
  const rateEarly = trendSummary(early, 'temp_rate');
  const rateLate  = trendSummary(late,  'temp_rate');
  const humidEarly = trendSummary(early, 'humidity');
  const humidLate  = trendSummary(late,  'humidity');

  const spanMinutes = history.length > 0
    ? Math.round(
        ((history[history.length - 1].received_at ?? 0) - (history[0].received_at ?? 0)) / 60000
      )
    : 0;

  // Alert level escalation
  const levels = history.map((r) => r.alert_level).filter(Boolean);
  const uniqueLevels = [...new Set(levels)];
  const levelProgression = uniqueLevels.length > 1
    ? `Alert level progressed through: ${uniqueLevels.join(' → ')}.`
    : `Alert level has remained ${uniqueLevels[0] ?? 'unknown'} throughout.`;

  // INS grade escalation
  const grades = history.map((r) => r.ins_grade).filter((g) => g != null);
  const gradeMin = Math.min(...grades), gradeMax = Math.max(...grades);
  const gradeNote = gradeMax > gradeMin
    ? `INS grade escalated from ${gradeMin} to ${gradeMax} during the monitoring window.`
    : `INS grade has remained at ${gradeMax} throughout.`;

  const lines = [
    `Monitoring window: ~${spanMinutes} minute(s), ${history.length} readings.`,
    levelProgression,
    gradeNote,
  ];

  if (tempEarly && tempLate) {
    lines.push(
      `Temperature: opened at ${tempEarly.first}°C, now ${tempLate.last}°C ` +
      `(overall change ${tempLate.last - tempEarly.first > 0 ? '+' : ''}${(tempLate.last - tempEarly.first).toFixed(1)}°C; ` +
      `min ${Math.min(tempEarly.min, tempLate.min)}°C, max ${Math.max(tempEarly.max, tempLate.max)}°C).`
    );
  }

  if (rateEarly && rateLate) {
    lines.push(
      `Rate of change: early phase ${rateEarly.dir} (avg ~${((rateEarly.first + rateEarly.last) / 2).toFixed(1)}°C/min), ` +
      `recent phase ${rateLate.dir} (avg ~${((rateLate.first + rateLate.last) / 2).toFixed(1)}°C/min).`
    );
  }

  if (humidEarly && humidLate) {
    lines.push(
      `Local humidity: opened at ${humidEarly.first}%, now ${humidLate.last}% (${humidLate.dir}).`
    );
  }

  return lines.join('\n');
}

function buildPrompt(latest, history) {
  const {
    temperature, temp_drop = 0, temp_rate = 0,
    humidity, humidity_rise = 0, dew_point,
    pressure, pressure_rise,
    risk_score, alert_level, ins_grade, cumulative_deficit = 0,
  } = latest;

  const trendBlock = buildTrendBlock(history);

  return `You are a peripheral IV site monitoring assistant integrated into a clinical surveillance system. A clinician has requested an on-demand analysis of the current IV site.

Using the snapshot data and the trend history below, write a clinical assessment of 3–4 sentences suitable for nursing or medical staff. Focus on what the trends reveal — whether the site is stable, deteriorating, or showing early signs of infiltration. Integrate the signals into a single coherent interpretation. Use calm, professional, observational language. Do not mention AI, algorithms, scoring systems, or sensor names. Do not use bullet points.

--- CURRENT SNAPSHOT ---
Temperature: ${temperature}°C (${temp_drop > 0.1 ? `${temp_drop.toFixed(1)}°C below baseline` : 'at baseline'}, trend ${Math.abs(temp_rate) < 0.2 ? 'stable' : temp_rate < 0 ? `declining ${Math.abs(temp_rate).toFixed(1)}°C/min` : `rising ${temp_rate.toFixed(1)}°C/min`})
Local humidity: ${humidity != null ? `${humidity}%${humidity_rise > 0.5 ? ` (+${humidity_rise.toFixed(1)}% above baseline)` : ', at baseline'}${dew_point != null ? `, dew point ${dew_point}°C` : ''}` : 'not connected'}
Pressure: ${pressure != null ? `${pressure} rpu${(pressure_rise ?? 0) > 0 ? ` (+${pressure_rise} above baseline)` : ', at baseline'}` : 'not connected'}
Alert level: ${alert_level}
INS Infiltration Grade: ${ins_grade}/4
Cumulative thermal deficit: ${cumulative_deficit.toFixed(1)}°C·min

--- TREND HISTORY ---
${trendBlock}

Provide a 3–4 sentence clinical assessment only. No preamble, no headings.`;
}

router.get('/:deviceId', async (req, res) => {
  const patient = getPatient(req.params.deviceId);
  if (!patient?.latest) return res.status(404).json({ error: 'No data available' });

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return res.status(500).json({ error: 'GEMINI_API_KEY not configured' });

  // Pass last 15 min of history for trend analysis
  const history = getHistory(req.params.deviceId, Math.floor((Date.now() - 15 * 60 * 1000) / 1000));

  try {
    const response = await fetch(`${GEMINI_URL}?key=${apiKey}`, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: buildPrompt(patient.latest, history ?? []) }] }],
        generationConfig: { maxOutputTokens: 1024, temperature: 0.25 },
      }),
    });

    if (!response.ok) {
      const err = await response.text();
      throw new Error(`Gemini ${response.status}: ${err}`);
    }

    const data = await response.json();
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
    if (!text) throw new Error('Empty response from Gemini');

    res.json({ summary: text, generated_at: Date.now() });
  } catch (err) {
    console.error('[ai-summary]', err.message);
    res.status(502).json({ error: err.message });
  }
});

module.exports = router;
