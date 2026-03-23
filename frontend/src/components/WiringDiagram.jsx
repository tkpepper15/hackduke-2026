import React from 'react';

export default function WiringDiagram() {
  const pinStyle = {
    padding: '4px 8px',
    fontSize: '10px',
    fontWeight: '600',
    borderRadius: '3px',
    border: '1px solid',
  };

  const wireStyle = {
    height: '2px',
    backgroundColor: '#d1d5db',
  };

  return (
    <div style={{
      backgroundColor: '#fff',
      border: '1px solid #e8eaed',
      borderRadius: '8px',
      padding: '24px',
    }}>
      <h3 style={{
        fontSize: '11px',
        fontWeight: '600',
        color: '#9ca3af',
        letterSpacing: '0.03em',
        textTransform: 'uppercase',
        marginBottom: '20px',
      }}>
        Circuit Configuration
      </h3>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>

        {/* DHT11 Section */}
        <div>
          <div style={{
            fontSize: '12px',
            fontWeight: '600',
            color: '#374151',
            marginBottom: '12px',
          }}>
            DHT11 Temperature/Humidity Sensor
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            {/* DHT11 Box */}
            <div style={{
              padding: '16px',
              border: '2px solid #06b6d4',
              borderRadius: '8px',
              backgroundColor: '#ecfeff',
              minWidth: '100px',
              textAlign: 'center',
            }}>
              <div style={{ fontSize: '13px', fontWeight: '700', color: '#0891b2' }}>DHT11</div>
              <div style={{ fontSize: '10px', color: '#0e7490', marginTop: '4px' }}>Digital</div>
            </div>

            {/* Connections */}
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {/* VCC */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div style={{ ...pinStyle, backgroundColor: '#fee2e2', borderColor: '#fca5a5', color: '#dc2626' }}>
                  VCC
                </div>
                <div style={{ ...wireStyle, flex: 1, backgroundColor: '#fca5a5' }} />
                <div style={{ ...pinStyle, backgroundColor: '#fee2e2', borderColor: '#fca5a5', color: '#dc2626' }}>
                  VIN (5V)
                </div>
              </div>

              {/* Signal */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div style={{ ...pinStyle, backgroundColor: '#dbeafe', borderColor: '#93c5fd', color: '#2563eb' }}>
                  Signal
                </div>
                <div style={{ ...wireStyle, flex: 1, backgroundColor: '#93c5fd' }} />
                <div style={{ ...pinStyle, backgroundColor: '#dbeafe', borderColor: '#93c5fd', color: '#2563eb' }}>
                  GPIO 4
                </div>
              </div>

              {/* GND */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div style={{ ...pinStyle, backgroundColor: '#f3f4f6', borderColor: '#9ca3af', color: '#4b5563' }}>
                  GND
                </div>
                <div style={{ ...wireStyle, flex: 1, backgroundColor: '#9ca3af' }} />
                <div style={{ ...pinStyle, backgroundColor: '#f3f4f6', borderColor: '#9ca3af', color: '#4b5563' }}>
                  GND
                </div>
              </div>
            </div>

            {/* ESP32 Box */}
            <div style={{
              padding: '16px',
              border: '2px solid #3b82f6',
              borderRadius: '8px',
              backgroundColor: '#eff6ff',
              minWidth: '100px',
              textAlign: 'center',
            }}>
              <div style={{ fontSize: '13px', fontWeight: '700', color: '#2563eb' }}>ESP32</div>
              <div style={{ fontSize: '10px', color: '#1d4ed8', marginTop: '4px' }}>DevKit</div>
            </div>
          </div>
        </div>

        {/* FSR402 Section */}
        <div>
          <div style={{
            fontSize: '12px',
            fontWeight: '600',
            color: '#374151',
            marginBottom: '12px',
          }}>
            FSR402 Pressure Sensor (Voltage Divider)
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            {/* FSR Box */}
            <div style={{
              padding: '16px',
              border: '2px solid #8b5cf6',
              borderRadius: '8px',
              backgroundColor: '#f5f3ff',
              minWidth: '100px',
              textAlign: 'center',
            }}>
              <div style={{ fontSize: '13px', fontWeight: '700', color: '#7c3aed' }}>FSR402</div>
              <div style={{ fontSize: '10px', color: '#6d28d9', marginTop: '4px' }}>Analog</div>
            </div>

            {/* Voltage Divider Circuit */}
            <div style={{ flex: 1, position: 'relative' }}>
              {/* Top wire: 3.3V → FSR */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                marginBottom: '24px',
              }}>
                <div style={{ ...pinStyle, backgroundColor: '#fee2e2', borderColor: '#fca5a5', color: '#dc2626' }}>
                  Terminal 1
                </div>
                <div style={{ ...wireStyle, flex: 1, backgroundColor: '#fca5a5' }} />
                <div style={{ ...pinStyle, backgroundColor: '#fee2e2', borderColor: '#fca5a5', color: '#dc2626' }}>
                  3.3V
                </div>
              </div>

              {/* Junction box */}
              <div style={{
                position: 'absolute',
                left: '120px',
                top: '48px',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '4px',
              }}>
                <div style={{
                  width: '8px',
                  height: '8px',
                  borderRadius: '50%',
                  backgroundColor: '#8b5cf6',
                  border: '2px solid #6d28d9',
                }} />
                <div style={{ fontSize: '9px', color: '#6d28d9', fontWeight: '600' }}>Junction</div>
              </div>

              {/* Middle wire: FSR Terminal 2 → GPIO 32 (with junction) */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                marginBottom: '24px',
              }}>
                <div style={{ ...pinStyle, backgroundColor: '#f5f3ff', borderColor: '#c4b5fd', color: '#7c3aed' }}>
                  Terminal 2
                </div>
                <div style={{ ...wireStyle, width: '110px', backgroundColor: '#c4b5fd' }} />
                <div style={{ width: '12px' }} /> {/* Space for junction */}
                <div style={{ ...wireStyle, flex: 1, backgroundColor: '#93c5fd' }} />
                <div style={{ ...pinStyle, backgroundColor: '#dbeafe', borderColor: '#93c5fd', color: '#2563eb' }}>
                  GPIO 32
                </div>
              </div>

              {/* Bottom wire: 47kΩ → GND (from junction) */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                paddingLeft: '120px',
              }}>
                <div style={{ ...wireStyle, width: '2px', height: '20px', backgroundColor: '#c4b5fd' }} />
                <div style={{
                  ...pinStyle,
                  backgroundColor: '#fef3c7',
                  borderColor: '#fbbf24',
                  color: '#d97706',
                  fontSize: '9px',
                }}>
                  47kΩ
                </div>
                <div style={{ ...wireStyle, flex: 1, backgroundColor: '#9ca3af' }} />
                <div style={{ ...pinStyle, backgroundColor: '#f3f4f6', borderColor: '#9ca3af', color: '#4b5563' }}>
                  GND
                </div>
              </div>
            </div>

            {/* ESP32 Box (right side) */}
            <div style={{
              padding: '16px',
              border: '2px solid #3b82f6',
              borderRadius: '8px',
              backgroundColor: '#eff6ff',
              minWidth: '100px',
              textAlign: 'center',
            }}>
              <div style={{ fontSize: '13px', fontWeight: '700', color: '#2563eb' }}>ESP32</div>
              <div style={{ fontSize: '10px', color: '#1d4ed8', marginTop: '4px' }}>DevKit</div>
            </div>
          </div>

          {/* Explanation */}
          <div style={{
            marginTop: '12px',
            padding: '12px',
            backgroundColor: '#fef3c7',
            borderRadius: '6px',
            fontSize: '11px',
            color: '#92400e',
            lineHeight: '1.5',
          }}>
            <strong>Why 47kΩ?</strong> FSR has very high resistance (~10MΩ) at rest. A 10kΩ pull-down
            only yields ~90 ADC units when pressed. 47kΩ provides ~1500 ADC units under moderate pressure,
            giving clinically useful sensitivity.
          </div>
        </div>

        {/* ADC Configuration Note */}
        <div style={{
          padding: '12px 16px',
          backgroundColor: '#f0f9ff',
          borderLeft: '3px solid #3b82f6',
          borderRadius: '6px',
        }}>
          <div style={{ fontSize: '11px', fontWeight: '600', color: '#1e40af', marginBottom: '4px' }}>
            ESP32 ADC Configuration
          </div>
          <div style={{ fontSize: '11px', color: '#1e3a8a', lineHeight: '1.6' }}>
            • <code style={{ backgroundColor: '#dbeafe', padding: '2px 6px', borderRadius: '3px' }}>
              analogSetAttenuation(ADC_11db)
            </code> - Full 0-3.3V range
            <br />
            • 12-bit resolution: 0-4095 values
            <br />
            • GPIO 32 is ADC1_CH4 (WiFi-compatible)
          </div>
        </div>
      </div>
    </div>
  );
}
