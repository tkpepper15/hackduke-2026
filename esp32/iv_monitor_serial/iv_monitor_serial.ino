/**
 * IV Infiltration Monitor — Serial-only firmware (no WiFi)
 * Raw DHT11 read via pulseIn() — no timing library needed.
 *
 * Hardware:
 *   DHT11 S (signal) → GPIO 4 (D4)
 *   DHT11 +  (VCC)   → VIN (5V)
 *   DHT11 -  (GND)   → GND
 *
 * Dependencies (Arduino Library Manager):
 *   - ArduinoJson  by Benoit Blanchon (v6)
 *
 * Outputs temperature + humidity each reading.
 * Backend computes dew point and uses humidity rise as a
 * secondary infiltration indicator (wet-dressing signal).
 */

#include <ArduinoJson.h>

// ── Configuration ─────────────────────────────────────────────────────────────
#define TEMP_PIN             4
#define FSR_PIN              32
#define DEVICE_ID            "patient_001"
#define CALIBRATION_SAMPLES  10
#define READING_INTERVAL_MS  2000

// ── Calibration state ─────────────────────────────────────────────────────────
float baseline_temp     = 0.0f;
float baseline_humidity = 0.0f;
int   baseline_pressure = 0;
bool  calibrated        = false;
int   cal_count         = 0;
float temp_accum        = 0.0f;
float humid_accum       = 0.0f;
long  pressure_accum    = 0;

// ── Helpers ───────────────────────────────────────────────────────────────────
void emitStatus(const char* status, const char* msg = nullptr) {
  StaticJsonDocument<128> doc;
  doc["status"] = status;
  if (msg) doc["msg"] = msg;
  serializeJson(doc, Serial);
  Serial.println();
}

// ── Raw DHT11 read via pulseIn ────────────────────────────────────────────────
// Returns true and sets temp + humidity on success.
bool readDHT11(float &temp, float &humidity) {
  byte data[5] = {0};

  pinMode(TEMP_PIN, OUTPUT);
  digitalWrite(TEMP_PIN, LOW);
  delay(20);
  pinMode(TEMP_PIN, INPUT_PULLUP);
  delayMicroseconds(25);

  // Sensor responds: ~80 µs LOW then ~80 µs HIGH.
  // pulseIn(HIGH) skips the LOW and measures the HIGH — robust regardless
  // of where we are in the LOW when we start.
  unsigned long response = pulseIn(TEMP_PIN, HIGH, 1000);
  if (response == 0 || response > 300) return false;

  // Read 40 bits. Each bit = 50 µs LOW + HIGH (26 µs = 0, 70 µs = 1).
  for (int i = 0; i < 40; i++) {
    unsigned long t = pulseIn(TEMP_PIN, HIGH, 500);
    if (t == 0) return false;
    data[i / 8] <<= 1;
    if (t > 50) data[i / 8] |= 1;
  }

  // Verify checksum
  if (((data[0] + data[1] + data[2] + data[3]) & 0xFF) != data[4]) return false;

  humidity = (float)data[0];   // byte 0: humidity integer
  temp     = (float)data[2];   // byte 2: temperature integer
  return true;
}

// ── Setup ─────────────────────────────────────────────────────────────────────
void setup() {
  Serial.begin(115200);
  analogSetAttenuation(ADC_11db);
  delay(2000);
  emitStatus("ready", "Place sensor on arm, then send 'C' to calibrate");
}

void resetCalibration() {
  calibrated = false;
  cal_count = 0;
  temp_accum = 0.0f;
  humid_accum = 0.0f;
  pressure_accum = 0;
  emitStatus("calibration_reset", "Starting calibration...");
}

// ── Loop ──────────────────────────────────────────────────────────────────────
void loop() {
  // Check for calibration command
  if (Serial.available() > 0) {
    char cmd = Serial.read();
    if (cmd == 'C' || cmd == 'c') {
      resetCalibration();
    }
  }

  float temperature = 0.0f;
  float humidity    = 0.0f;

  if (!readDHT11(temperature, humidity)) {
    emitStatus("sensor_error", "DHT11 read failed");
    delay(READING_INTERVAL_MS);
    return;
  }

  int pressure = analogRead(FSR_PIN);

  // DEBUG: Print raw ADC value to Serial (remove after testing)
  Serial.print("[DEBUG] Raw ADC on GPIO ");
  Serial.print(FSR_PIN);
  Serial.print(": ");
  Serial.println(pressure);

  // ── Calibration phase ────────────────────────────────────────────────────
  if (!calibrated) {
    cal_count++;
    temp_accum     += temperature;
    humid_accum    += humidity;
    pressure_accum += pressure;

    StaticJsonDocument<128> cal;
    cal["status"] = "calibrating";
    cal["sample"] = cal_count;
    cal["of"]     = CALIBRATION_SAMPLES;
    serializeJson(cal, Serial);
    Serial.println();

    if (cal_count >= CALIBRATION_SAMPLES) {
      baseline_temp     = temp_accum     / CALIBRATION_SAMPLES;
      baseline_humidity = humid_accum    / CALIBRATION_SAMPLES;
      baseline_pressure = pressure_accum / CALIBRATION_SAMPLES;
      calibrated        = true;

      StaticJsonDocument<192> done;
      done["status"]             = "calibrated";
      done["baseline_temp"]      = baseline_temp;
      done["baseline_humidity"]  = baseline_humidity;
      done["baseline_pressure"]  = baseline_pressure;
      serializeJson(done, Serial);
      Serial.println();
    }

    delay(READING_INTERVAL_MS);
    return;
  }

  // ── Live reading ──────────────────────────────────────────────────────────
  float temp_drop     = max(0.0f, baseline_temp - temperature);
  float humidity_rise = max(0.0f, humidity - baseline_humidity);
  int   pressure_rise = max(0, pressure - baseline_pressure);
  float risk_score    = min(temp_drop * 3.0f, 100.0f); // backend overrides this

  StaticJsonDocument<256> doc;
  doc["device_id"]       = DEVICE_ID;
  doc["temperature"]     = temperature;
  doc["humidity"]        = humidity;
  doc["pressure"]        = pressure;
  doc["temp_drop"]       = roundf(temp_drop * 10) / 10.0f;
  doc["humidity_rise"]   = roundf(humidity_rise * 10) / 10.0f;
  doc["pressure_rise"]   = pressure_rise;
  doc["risk_score"]      = (int)risk_score;
  doc["alert_level"]     = "normal"; // backend recomputes
  doc["timestamp"]       = (long)(millis() / 1000);

  serializeJson(doc, Serial);
  Serial.println();

  delay(READING_INTERVAL_MS);
}
