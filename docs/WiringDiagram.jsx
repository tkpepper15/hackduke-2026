import React from 'react';

/**
 * Circuit Wiring Diagram - Professional Schematic Style
 *
 * Usage:
 * 1. Import this component in your React app
 * 2. Navigate to the route
 * 3. Screenshot at 1920x1080 for optimal quality
 */

const WiringDiagram = () => {
  return (
    <div style={{
      width: '100vw',
      height: '100vh',
      background: '#ffffff',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontFamily: 'monospace',
      padding: '40px',
    }}>
      <div style={{
        width: '100%',
        maxWidth: '1400px',
        background: '#fafafa',
        border: '2px solid #e0e0e0',
        borderRadius: '12px',
        padding: '48px',
      }}>
        {/* Header */}
        <div style={{ marginBottom: '32px', borderBottom: '2px solid #e0e0e0', paddingBottom: '16px' }}>
          <h1 style={{
            fontSize: '28px',
            fontWeight: '700',
            margin: '0 0 8px 0',
            fontFamily: 'system-ui',
            color: '#1a1a1a'
          }}>
            VeinVigil - Circuit Schematic
          </h1>
          <p style={{
            margin: 0,
            color: '#666',
            fontSize: '14px',
            fontFamily: 'system-ui'
          }}>
            ESP32 DevKit with DHT11 Temperature/Humidity Sensor and FSR402 Pressure Sensor
          </p>
        </div>

        <svg width="100%" height="700" viewBox="0 0 1300 700">
          <defs>
            {/* Grid pattern for background */}
            <pattern id="grid" width="20" height="20" patternUnits="userSpaceOnUse">
              <path d="M 20 0 L 0 0 0 20" fill="none" stroke="#e8e8e8" strokeWidth="0.5"/>
            </pattern>

            {/* Component shadows */}
            <filter id="shadow">
              <feDropShadow dx="0" dy="2" stdDeviation="3" floodOpacity="0.15"/>
            </filter>
          </defs>

          {/* Background grid */}
          <rect width="1300" height="700" fill="url(#grid)" />

          {/* ESP32 DevKit Board */}
          <g filter="url(#shadow)">
            <rect x="500" y="200" width="300" height="300" rx="8"
                  fill="#2c3e50" stroke="#1a252f" strokeWidth="3"/>
            <text x="650" y="235" textAnchor="middle" fill="#ecf0f1"
                  fontSize="20" fontWeight="700" fontFamily="system-ui">
              ESP32 DevKit
            </text>
            <text x="650" y="260" textAnchor="middle" fill="#95a5a6"
                  fontSize="12" fontFamily="system-ui">
              CP2102 USB-to-UART Bridge
            </text>

            {/* Pin labels */}
            <g fill="#ecf0f1" fontSize="13" fontWeight="500">
              {/* Left side pins */}
              <text x="520" y="310" textAnchor="start">3V3</text>
              <circle cx="510" cy="307" r="4" fill="#e74c3c" />

              <text x="520" y="340" textAnchor="start">GPIO 4</text>
              <circle cx="510" cy="337" r="4" fill="#3498db" />

              <text x="520" y="370" textAnchor="start">GND</text>
              <circle cx="510" cy="367" r="4" fill="#34495e" />

              {/* Right side pins */}
              <text x="780" y="310" textAnchor="end">GPIO 32</text>
              <circle cx="790" cy="307" r="4" fill="#9b59b6" />

              <text x="780" y="340" textAnchor="end">GND</text>
              <circle cx="790" cy="337" r="4" fill="#34495e" />
            </g>

            {/* USB Port indicator */}
            <rect x="625" y="195" width="50" height="10" rx="2" fill="#7f8c8d" stroke="#5d6d7e" strokeWidth="1"/>
            <text x="650" y="190" textAnchor="middle" fill="#7f8c8d" fontSize="10">USB</text>
          </g>

          {/* DHT11 Sensor */}
          <g filter="url(#shadow)">
            <rect x="100" y="280" width="180" height="120" rx="6"
                  fill="#3498db" stroke="#2980b9" strokeWidth="2"/>
            <text x="190" y="315" textAnchor="middle" fill="#ffffff"
                  fontSize="18" fontWeight="700" fontFamily="system-ui">
              DHT11
            </text>
            <text x="190" y="335" textAnchor="middle" fill="#ecf0f1"
                  fontSize="11" fontFamily="system-ui">
              Temperature/Humidity
            </text>

            {/* Pins */}
            <g fill="#ecf0f1" fontSize="11">
              <circle cx="290" cy="355" r="3" fill="#e74c3c" />
              <text x="265" y="359" textAnchor="end">VCC</text>

              <circle cx="290" cy="375" r="3" fill="#f39c12" />
              <text x="265" y="379" textAnchor="end">DATA</text>

              <circle cx="290" cy="395" r="3" fill="#34495e" />
              <text x="265" y="399" textAnchor="end">GND</text>
            </g>
          </g>

          {/* FSR402 Sensor */}
          <g filter="url(#shadow)">
            <rect x="1020" y="100" width="160" height="200" rx="6"
                  fill="#9b59b6" stroke="#8e44ad" strokeWidth="2"/>
            <text x="1100" y="140" textAnchor="middle" fill="#ffffff"
                  fontSize="18" fontWeight="700" fontFamily="system-ui">
              FSR402
            </text>
            <text x="1100" y="160" textAnchor="middle" fill="#ecf0f1"
                  fontSize="11" fontFamily="system-ui">
              Force Sensitive
            </text>
            <text x="1100" y="175" textAnchor="middle" fill="#ecf0f1"
                  fontSize="11" fontFamily="system-ui">
              Resistor
            </text>

            {/* Resistance indicator */}
            <text x="1100" y="200" textAnchor="middle" fill="#f1c40f"
                  fontSize="10" fontWeight="600">
              ΔR: 10MΩ → 200Ω
            </text>

            {/* Terminals */}
            <g fill="#ecf0f1" fontSize="11">
              <circle cx="1040" cy="230" r="4" fill="#e74c3c" />
              <text x="1055" y="235" textAnchor="start">T1</text>

              <circle cx="1040" cy="270" r="4" fill="#f39c12" />
              <text x="1055" y="275" textAnchor="start">T2</text>
            </g>
          </g>

          {/* 47kΩ Resistor */}
          <g filter="url(#shadow)">
            <rect x="1020" y="430" width="100" height="50" rx="4"
                  fill="#f39c12" stroke="#d68910" strokeWidth="2"/>
            <text x="1070" y="458" textAnchor="middle" fill="#ffffff"
                  fontSize="16" fontWeight="700">
              47kΩ
            </text>
            <text x="1070" y="473" textAnchor="middle" fill="#fef5e7"
                  fontSize="9">
              ±5%
            </text>

            {/* Resistor symbol stripes */}
            <line x1="1030" y1="438" x2="1030" y2="472" stroke="#8b4513" strokeWidth="2"/>
            <line x1="1045" y1="438" x2="1045" y2="472" stroke="#8b4513" strokeWidth="2"/>
            <line x1="1060" y1="438" x2="1060" y2="472" stroke="#ff8c00" strokeWidth="2"/>
            <line x1="1075" y1="438" x2="1075" y2="472" stroke="#ffd700" strokeWidth="2"/>
          </g>

          {/* Wires - 3.3V Rail (Red) */}
          <path d="M 510 307 L 350 307 L 350 280 L 290 355"
                stroke="#e74c3c" strokeWidth="3" fill="none" strokeLinecap="round"/>
          <path d="M 350 307 L 350 150 L 1040 150 L 1040 230"
                stroke="#e74c3c" strokeWidth="3" fill="none" strokeLinecap="round"/>

          {/* Wire - GPIO 4 to DHT11 DATA (Blue) */}
          <path d="M 510 337 L 400 337 L 400 375 L 290 375"
                stroke="#3498db" strokeWidth="3" fill="none" strokeLinecap="round"/>

          {/* Wire - GPIO 32 to FSR T2 and Resistor (Purple) */}
          <path d="M 790 307 L 900 307 L 900 270 L 1040 270"
                stroke="#9b59b6" strokeWidth="3" fill="none" strokeLinecap="round"/>
          <path d="M 900 307 L 900 430 L 1020 430"
                stroke="#9b59b6" strokeWidth="3" fill="none" strokeLinecap="round"/>

          {/* Wire - GND (Black) */}
          <path d="M 510 367 L 450 367 L 450 550 L 290 550 L 290 395"
                stroke="#2c3e50" strokeWidth="3" fill="none" strokeLinecap="round"/>
          <path d="M 450 550 L 1070 550 L 1070 480"
                stroke="#2c3e50" strokeWidth="3" fill="none" strokeLinecap="round"/>

          {/* Ground symbol */}
          <line x1="450" y1="550" x2="450" y2="570" stroke="#2c3e50" strokeWidth="3"/>
          <line x1="435" y1="570" x2="465" y2="570" stroke="#2c3e50" strokeWidth="3"/>
          <line x1="440" y1="580" x2="460" y2="580" stroke="#2c3e50" strokeWidth="2"/>
          <line x1="444" y1="588" x2="456" y2="588" stroke="#2c3e50" strokeWidth="1.5"/>
          <text x="450" y="605" textAnchor="middle" fontSize="12" fontWeight="600">GND</text>

          {/* Wire labels */}
          <g fill="#555" fontSize="11" fontWeight="600">
            <text x="420" y="295" textAnchor="middle">+3.3V</text>
            <text x="450" y="325" textAnchor="middle">1-Wire Data</text>
            <text x="840" y="295" textAnchor="middle">ADC (GPIO 32)</text>
            <text x="950" y="465" textAnchor="middle">Pull-down</text>
          </g>

          {/* Voltage divider annotation */}
          <g>
            <rect x="870" y="320" width="180" height="90" rx="6"
                  fill="#fff3cd" stroke="#ffc107" strokeWidth="2" strokeDasharray="4,2"/>
            <text x="960" y="345" textAnchor="middle" fontSize="13" fontWeight="700" fill="#856404">
              Voltage Divider
            </text>
            <text x="960" y="365" textAnchor="middle" fontSize="10" fill="#856404">
              V_GPIO = 3.3V × R1/(R_FSR+R1)
            </text>
            <text x="960" y="382" textAnchor="middle" fontSize="10" fill="#856404">
              ADC: 0-4095 (12-bit)
            </text>
            <text x="960" y="399" textAnchor="middle" fontSize="10" fill="#856404">
              Resolution: ~0.8mV
            </text>
          </g>
        </svg>

        {/* Component Specifications Table */}
        <div style={{
          marginTop: '32px',
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gap: '20px',
        }}>
          {/* DHT11 */}
          <div style={{
            background: '#fff',
            border: '2px solid #3498db',
            borderRadius: '8px',
            padding: '16px',
          }}>
            <h3 style={{
              margin: '0 0 12px 0',
              fontSize: '16px',
              fontWeight: '700',
              color: '#3498db',
              fontFamily: 'system-ui',
            }}>
              DHT11 Sensor
            </h3>
            <table style={{ width: '100%', fontSize: '12px', fontFamily: 'system-ui' }}>
              <tbody>
                <tr>
                  <td style={{ padding: '4px 0', color: '#666' }}>Connection</td>
                  <td style={{ padding: '4px 0', textAlign: 'right', fontWeight: '600' }}>GPIO 4 (1-Wire)</td>
                </tr>
                <tr>
                  <td style={{ padding: '4px 0', color: '#666' }}>Temperature</td>
                  <td style={{ padding: '4px 0', textAlign: 'right', fontWeight: '600' }}>±2°C accuracy</td>
                </tr>
                <tr>
                  <td style={{ padding: '4px 0', color: '#666' }}>Humidity</td>
                  <td style={{ padding: '4px 0', textAlign: 'right', fontWeight: '600' }}>±5% RH</td>
                </tr>
                <tr>
                  <td style={{ padding: '4px 0', color: '#666' }}>Protocol</td>
                  <td style={{ padding: '4px 0', textAlign: 'right', fontWeight: '600' }}>40-bit custom</td>
                </tr>
                <tr>
                  <td style={{ padding: '4px 0', color: '#666' }}>Pull-up</td>
                  <td style={{ padding: '4px 0', textAlign: 'right', fontWeight: '600' }}>Internal 47kΩ</td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* FSR402 */}
          <div style={{
            background: '#fff',
            border: '2px solid #9b59b6',
            borderRadius: '8px',
            padding: '16px',
          }}>
            <h3 style={{
              margin: '0 0 12px 0',
              fontSize: '16px',
              fontWeight: '700',
              color: '#9b59b6',
              fontFamily: 'system-ui',
            }}>
              FSR402 Sensor
            </h3>
            <table style={{ width: '100%', fontSize: '12px', fontFamily: 'system-ui' }}>
              <tbody>
                <tr>
                  <td style={{ padding: '4px 0', color: '#666' }}>Connection</td>
                  <td style={{ padding: '4px 0', textAlign: 'right', fontWeight: '600' }}>GPIO 32 (ADC1)</td>
                </tr>
                <tr>
                  <td style={{ padding: '4px 0', color: '#666' }}>No pressure</td>
                  <td style={{ padding: '4px 0', textAlign: 'right', fontWeight: '600' }}>10MΩ → ADC 50</td>
                </tr>
                <tr>
                  <td style={{ padding: '4px 0', color: '#666' }}>Moderate</td>
                  <td style={{ padding: '4px 0', textAlign: 'right', fontWeight: '600' }}>100kΩ → ADC 1500</td>
                </tr>
                <tr>
                  <td style={{ padding: '4px 0', color: '#666' }}>Firm press</td>
                  <td style={{ padding: '4px 0', textAlign: 'right', fontWeight: '600' }}>20kΩ → ADC 3000</td>
                </tr>
                <tr>
                  <td style={{ padding: '4px 0', color: '#666' }}>Maximum</td>
                  <td style={{ padding: '4px 0', textAlign: 'right', fontWeight: '600' }}>200Ω → ADC 4095</td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* ESP32 ADC */}
          <div style={{
            background: '#fff',
            border: '2px solid #f39c12',
            borderRadius: '8px',
            padding: '16px',
          }}>
            <h3 style={{
              margin: '0 0 12px 0',
              fontSize: '16px',
              fontWeight: '700',
              color: '#f39c12',
              fontFamily: 'system-ui',
            }}>
              ESP32 ADC Config
            </h3>
            <table style={{ width: '100%', fontSize: '12px', fontFamily: 'system-ui' }}>
              <tbody>
                <tr>
                  <td style={{ padding: '4px 0', color: '#666' }}>Channel</td>
                  <td style={{ padding: '4px 0', textAlign: 'right', fontWeight: '600' }}>ADC1_CH4</td>
                </tr>
                <tr>
                  <td style={{ padding: '4px 0', color: '#666' }}>Resolution</td>
                  <td style={{ padding: '4px 0', textAlign: 'right', fontWeight: '600' }}>12-bit (0-4095)</td>
                </tr>
                <tr>
                  <td style={{ padding: '4px 0', color: '#666' }}>Attenuation</td>
                  <td style={{ padding: '4px 0', textAlign: 'right', fontWeight: '600' }}>ADC_11db</td>
                </tr>
                <tr>
                  <td style={{ padding: '4px 0', color: '#666' }}>Range</td>
                  <td style={{ padding: '4px 0', textAlign: 'right', fontWeight: '600' }}>0-3.3V</td>
                </tr>
                <tr>
                  <td style={{ padding: '4px 0', color: '#666' }}>Step size</td>
                  <td style={{ padding: '4px 0', textAlign: 'right', fontWeight: '600' }}>~0.8mV</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Design notes */}
        <div style={{
          marginTop: '24px',
          padding: '16px',
          background: '#e8f4f8',
          borderLeft: '4px solid #3498db',
          borderRadius: '4px',
        }}>
          <p style={{ margin: 0, fontSize: '12px', color: '#2c3e50', fontFamily: 'system-ui', lineHeight: '1.6' }}>
            <strong>Design Note:</strong> GPIO 32 is on ADC1 (compatible with WiFi). ADC2 channels cannot be used when WiFi is active.
            The 47kΩ pull-down resistor was selected after testing—10kΩ yielded insufficient dynamic range (~90 ADC units max),
            while 47kΩ provides 1500+ ADC units under clinically relevant pressure levels, with adequate noise rejection.
          </p>
        </div>
      </div>
    </div>
  );
};

export default WiringDiagram;
