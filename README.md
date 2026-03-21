# IV Site Monitor

Real-time peripheral IV infiltration surveillance system. Streams physiological sensor data from an ESP32 to a Node.js backend and displays it on a React dashboard with live trend charts and clinical alert interpretation.

---

## System Overview

```
ESP32 (FSR + DS18B20)
       │  POST /data (JSON, every 1.5 s)
       ▼
Node.js + Express + Socket.io  (port 3001)
       │  WebSocket broadcast
       ▼
React Dashboard  (port 5173)
```

**Sensors:**
| Sensor | Type | Measures |
|--------|------|----------|
| DS18B20 | Digital thermometer | Skin temperature near IV site |
| FSR 406 | Analog force sensor | Localised pressure (swelling proxy) |

**Risk scoring (0–100):**
```
risk_score = min(temp_drop × 0.6 × 5, 60) + min(pressure_rise × 0.4 × 0.1, 40)
```

| Score  | Alert Level |
|--------|-------------|
| 0–30   | Normal      |
| 31–60  | Monitor     |
| 61–80  | Elevated    |
| 81–100 | Critical    |

---

## Prerequisites

- Node.js ≥ 18
- npm ≥ 9
- Arduino IDE 2.x (for ESP32 firmware, optional)

---

## Quick Start

### 1 — Backend

```bash
cd backend
cp .env.example .env   # adjust PORT / FRONTEND_URL if needed
npm install
npm run dev            # starts on http://localhost:3001
```

The server automatically seeds three simulated patients:
- **patient_001** — stable, no infiltration
- **patient_002** — gradual developing infiltration (risk rises over ~8 minutes)
- **patient_003** — established elevated risk

### 2 — Frontend

```bash
cd frontend
npm install
npm run dev            # opens at http://localhost:5173
```

---

## API Reference

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/data` | Ingest a sensor reading |
| `GET`  | `/patients` | List all active devices + latest reading |
| `GET`  | `/patients/:id` | Latest reading for one patient |
| `GET`  | `/patients/:id/history?minutes=15` | Time-series readings |
| `GET`  | `/health` | Health check |

### POST /data — payload schema

```json
{
  "device_id":     "patient_001",
  "temperature":   36.4,
  "pressure":      812,
  "temp_drop":     1.1,
  "pressure_rise": 58,
  "risk_score":    72,
  "alert_level":   "elevated",
  "timestamp":     1711039200
}
```

Only `device_id`, `temperature`, and `pressure` are required.

---

## Connecting the ESP32

### Hardware wiring

```
DS18B20 DATA  →  GPIO 4  (with 4.7 kΩ pull-up to 3.3 V)
FSR signal    →  GPIO 34 (voltage divider: FSR + 10 kΩ to GND)
```

### Firmware setup

1. Open `esp32/iv_monitor.ino` in Arduino IDE.
2. Install libraries via Library Manager:
   - **OneWire** (Paul Stoffregen)
   - **DallasTemperature** (Miles Burton)
   - **ArduinoJson** (Benoit Blanchon)
3. Edit the configuration block at the top of the sketch:

```cpp
const char* WIFI_SSID  = "YOUR_WIFI_SSID";
const char* WIFI_PASS  = "YOUR_WIFI_PASSWORD";
const char* SERVER_URL = "http://192.168.1.x:3001/data";  // your machine's LAN IP
const char* DEVICE_ID  = "patient_001";
```

4. Select board: **ESP32 Dev Module** → Upload.
5. Open Serial Monitor at 115200 baud to watch calibration and POST status.

> The device calibrates over 15 samples (~5 s) before transmitting. Keep the sensor undisturbed during calibration.

---

## Project Structure

```
hackduke-2026/
├── backend/
│   ├── server.js               # Express + Socket.io entry point
│   ├── routes/
│   │   ├── data.js             # POST /data
│   │   └── patients.js         # GET /patients endpoints
│   ├── db/
│   │   ├── store.js            # In-memory time-series store
│   │   └── mockData.js         # Demo data generator (3 patients)
│   ├── middleware/
│   │   └── validate.js         # Input validation
│   └── .env.example
├── frontend/
│   ├── src/
│   │   ├── App.jsx             # Root layout, socket + REST wiring
│   │   ├── components/
│   │   │   ├── PatientList.jsx
│   │   │   ├── PatientCard.jsx
│   │   │   ├── LiveMonitor.jsx  # Main monitoring panel
│   │   │   ├── AlertPanel.jsx   # Clinical interpretation
│   │   │   ├── MetricsRow.jsx   # Temp / pressure / risk gauge
│   │   │   └── TrendChart.jsx   # Recharts line chart with smoothing
│   │   └── utils/
│   │       └── formatters.js    # Alert config, messages, time formatting
│   └── tailwind.config.js
└── esp32/
    └── iv_monitor.ino
```

---

## Replacing In-Memory Storage with Firestore

The store interface (`upsertReading`, `getPatient`, `getAllPatients`, `getHistory`) is intentionally minimal. To swap in Firestore:

1. `npm install firebase-admin` in `/backend`
2. Create `backend/db/firestore.js` implementing the same four exports
3. Update the `require` in `routes/data.js` and `routes/patients.js`

---

## Design Notes

- Charts apply a 3-point rolling average to reduce FSR noise while preserving real trends.
- `patient_002` naturally progresses Normal → Monitor → Elevated → Critical over ~8 minutes — useful for live demos.
- Alert messages integrate both temperature and pressure into a single sentence; no raw algorithm logic is exposed.
- Critical status indicators use CSS `animate-pulse` for immediate visual salience.
