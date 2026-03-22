/**
 * IV Infiltration Monitor — ESP32 Firmware
 *
 * Hardware:
 *   - DS18B20 temperature sensor  → GPIO 4 (with 4.7kΩ pull-up to 3.3V)
 *   - FSR 406 (or similar)        → GPIO 34 via voltage divider (10kΩ to GND)
 *
 * Dependencies (install via Arduino Library Manager):
 *   - OneWire by Paul Stoffregen
 *   - DallasTemperature by Miles Burton
 *   - ArduinoJson by Benoit Blanchon
 */

#include <WiFi.h>
#include <HTTPClient.h>
#include <OneWire.h>
#include <DallasTemperature.h>
#include <ArduinoJson.h>

// ── Configuration ────────────────────────────────────────────────────────────
const char* WIFI_SSID     = "YOUR_WIFI_SSID";
const char* WIFI_PASS     = "YOUR_WIFI_PASSWORD";
const char* SERVER_URL    = "http://YOUR_SERVER_IP:3001/data";  // backend address
const char* DEVICE_ID     = "patient_001";

// GPIO assignments
#define TEMP_PIN    4
#define FSR_PIN     34   // ADC1 channel only (ADC2 unavailable with WiFi)

// Calibration
const int   CALIBRATION_SAMPLES = 15;
const int   READING_INTERVAL_MS = 1500;

// ── Sensor setup ─────────────────────────────────────────────────────────────
OneWire           oneWire(TEMP_PIN);
DallasTemperature sensors(&oneWire);

float baseline_temp     = 0.0f;
int   baseline_pressure = 0;
bool  calibrated        = false;
int   cal_count         = 0;
float temp_accum        = 0.0f;
long  pressure_accum    = 0;

// ── Risk scoring ─────────────────────────────────────────────────────────────
float calcRiskScore(float tempDrop, int pressureRise) {
  float tempComponent     = min(tempDrop * 0.6f * 5.0f, 60.0f);
  float pressureComponent = min(pressureRise * 0.4f * 0.1f, 40.0f);
  return min(tempComponent + pressureComponent, 100.0f);
}

const char* alertLevel(float score) {
  if (score <= 30) return "normal";
  if (score <= 60) return "monitor";
  if (score <= 80) return "elevated";
  return "critical";
}

// ── WiFi ─────────────────────────────────────────────────────────────────────
void connectWifi() {
  WiFi.begin(WIFI_SSID, WIFI_PASS);
  Serial.print("Connecting to WiFi");
  int attempts = 0;
  while (WiFi.status() != WL_CONNECTED && attempts < 40) {
    delay(500);
    Serial.print(".");
    attempts++;
  }
  if (WiFi.status() == WL_CONNECTED) {
    Serial.printf("\nConnected. IP: %s\n", WiFi.localIP().toString().c_str());
  } else {
    Serial.println("\nWiFi connection failed — will retry.");
  }
}

// ── Setup ─────────────────────────────────────────────────────────────────────
void setup() {
  Serial.begin(115200);
  delay(500);
  Serial.println("[IV Monitor] Starting up…");

  sensors.begin();
  connectWifi();
}

// ── Main loop ─────────────────────────────────────────────────────────────────
void loop() {
  // Reconnect if connection dropped
  if (WiFi.status() != WL_CONNECTED) {
    Serial.println("[wifi] Reconnecting…");
    connectWifi();
    delay(2000);
    return;
  }

  sensors.requestTemperatures();
  float temp     = sensors.getTempCByIndex(0);
  int   pressure = analogRead(FSR_PIN);

  // ── Calibration phase ─────────────────────────────────────────────────────
  if (!calibrated) {
    if (temp == DEVICE_DISCONNECTED_C) {
      Serial.println("[sensor] Temperature sensor not found — check wiring.");
      delay(1000);
      return;
    }
    cal_count++;
    temp_accum     += temp;
    pressure_accum += pressure;
    Serial.printf("[cal] Sample %d/%d  temp=%.2f  pressure=%d\n",
                  cal_count, CALIBRATION_SAMPLES, temp, pressure);
    if (cal_count >= CALIBRATION_SAMPLES) {
      baseline_temp     = temp_accum / CALIBRATION_SAMPLES;
      baseline_pressure = pressure_accum / CALIBRATION_SAMPLES;
      calibrated        = true;
      Serial.printf("[cal] Baseline set — temp=%.2f°C  pressure=%d\n",
                    baseline_temp, baseline_pressure);
    }
    delay(300);
    return;
  }

  // ── Compute deltas ────────────────────────────────────────────────────────
  float temp_drop      = max(0.0f, baseline_temp - temp);
  int   pressure_rise  = max(0, pressure - baseline_pressure);
  float risk_score     = calcRiskScore(temp_drop, pressure_rise);

  // ── Serialize ─────────────────────────────────────────────────────────────
  StaticJsonDocument<256> doc;
  doc["device_id"]     = DEVICE_ID;
  doc["temperature"]   = roundf(temp * 10) / 10.0f;
  doc["pressure"]      = pressure;
  doc["temp_drop"]     = roundf(temp_drop * 10) / 10.0f;
  doc["pressure_rise"] = pressure_rise;
  doc["risk_score"]    = (int)risk_score;
  doc["alert_level"]   = alertLevel(risk_score);
  doc["timestamp"]     = (long)(millis() / 1000);  // replace with NTP in production

  String payload;
  serializeJson(doc, payload);

  // ── HTTP POST ─────────────────────────────────────────────────────────────
  HTTPClient http;
  http.begin(SERVER_URL);
  http.addHeader("Content-Type", "application/json");
  int httpCode = http.POST(payload);

  if (httpCode == 201) {
    Serial.printf("[ok] score=%.0f  level=%s  temp=%.1f  pressure=%d\n",
                  risk_score, alertLevel(risk_score), temp, pressure);
  } else {
    Serial.printf("[err] HTTP %d — %s\n", httpCode, payload.c_str());
  }

  http.end();
  delay(READING_INTERVAL_MS);
}
