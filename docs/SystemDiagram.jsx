import React from 'react';

/**
 * System Architecture Visualization Component
 *
 * Usage:
 * 1. Copy to frontend/src/docs/SystemDiagram.jsx
 * 2. Add route or navigate directly
 * 3. Screenshot at 1920x1080
 */

const SystemDiagram = () => {
  return (
    <div style={{
      width: '100vw',
      height: '100vh',
      background: '#ffffff',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontFamily: 'system-ui, -apple-system, sans-serif',
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
        <div style={{ marginBottom: '40px', borderBottom: '2px solid #e0e0e0', paddingBottom: '16px' }}>
          <h1 style={{
            fontSize: '32px',
            fontWeight: '700',
            margin: '0 0 8px 0',
            color: '#1a1a1a'
          }}>
            VeinVigil System Architecture
          </h1>
          <p style={{
            margin: 0,
            color: '#666',
            fontSize: '16px',
          }}>
            Real-time IV infiltration monitoring through multi-modal sensor fusion and edge-to-cloud data pipeline
          </p>
        </div>

        <svg width="100%" height="650" viewBox="0 0 1300 650">
          <defs>
            {/* Gradient fills */}
            <linearGradient id="hardwareGrad" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" style={{ stopColor: '#4a5568', stopOpacity: 1 }} />
              <stop offset="100%" style={{ stopColor: '#2d3748', stopOpacity: 1 }} />
            </linearGradient>
            <linearGradient id="backendGrad" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" style={{ stopColor: '#3182ce', stopOpacity: 1 }} />
              <stop offset="100%" style={{ stopColor: '#2563eb', stopOpacity: 1 }} />
            </linearGradient>
            <linearGradient id="wsGrad" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" style={{ stopColor: '#10b981', stopOpacity: 1 }} />
              <stop offset="100%" style={{ stopColor: '#059669', stopOpacity: 1 }} />
            </linearGradient>
            <linearGradient id="frontendGrad" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" style={{ stopColor: '#8b5cf6', stopOpacity: 1 }} />
              <stop offset="100%" style={{ stopColor: '#7c3aed', stopOpacity: 1 }} />
            </linearGradient>

            {/* Arrow marker */}
            <marker
              id="arrow"
              markerWidth="12"
              markerHeight="12"
              refX="10"
              refY="4"
              orient="auto"
              markerUnits="strokeWidth"
            >
              <polygon points="0 0, 12 4, 0 8" fill="#64748b" />
            </marker>

            {/* Shadow filter */}
            <filter id="shadow">
              <feDropShadow dx="0" dy="3" stdDeviation="4" floodOpacity="0.2"/>
            </filter>
          </defs>

          {/* Layer 1: Hardware (ESP32) */}
          <g filter="url(#shadow)">
            <rect x="50" y="50" width="250" height="200" rx="12"
                  fill="url(#hardwareGrad)" stroke="#1a252f" strokeWidth="3"/>
            <text x="175" y="90" textAnchor="middle" fill="#ffffff"
                  fontSize="22" fontWeight="700">
              ESP32 DevKit
            </text>
            <text x="175" y="115" textAnchor="middle" fill="#cbd5e0"
                  fontSize="12">
              CP2102 USB-UART Bridge
            </text>

            {/* Sensors */}
            <rect x="70" y="140" width="210" height="40" rx="6" fill="#718096" opacity="0.9"/>
            <text x="175" y="165" textAnchor="middle" fill="#ffffff" fontSize="14" fontWeight="600">
              DHT11 (GPIO 4) + FSR402 (GPIO 32)
            </text>

            <text x="175" y="205" textAnchor="middle" fill="#cbd5e0" fontSize="11">
              Temp/Humidity/Pressure
            </text>
            <text x="175" y="225" textAnchor="middle" fill="#a0aec0" fontSize="10">
              Calibration: 10 samples @ 2s
            </text>
          </g>

          {/* Arrow 1: Hardware -> Serial */}
          <g>
            <path d="M 300 150 L 450 150" stroke="#64748b" strokeWidth="4"
                  fill="none" markerEnd="url(#arrow)"/>
            <rect x="330" y="125" width="90" height="40" rx="6" fill="#f1f5f9" opacity="0.95"/>
            <text x="375" y="142" textAnchor="middle" fontSize="11" fontWeight="600" fill="#334155">
              USB Serial
            </text>
            <text x="375" y="156" textAnchor="middle" fontSize="10" fill="#64748b">
              115200 baud
            </text>
          </g>

          {/* Layer 2: Serial Bridge */}
          <g filter="url(#shadow)">
            <rect x="450" y="80" width="280" height="140" rx="12"
                  fill="url(#backendGrad)" stroke="#1e40af" strokeWidth="3"/>
            <text x="590" y="115" textAnchor="middle" fill="#ffffff"
                  fontSize="20" fontWeight="700">
              Serial Bridge
            </text>
            <text x="590" y="138" textAnchor="middle" fill="#dbeafe" fontSize="11">
              Node.js + SerialPort
            </text>

            <g fill="#bfdbfe" fontSize="11">
              <text x="470" y="165">• Auto-detect /dev/ttyUSB0</text>
              <text x="470" y="183">• Readline parser (JSON)</text>
              <text x="470" y="201">• Forward to enrichment</text>
            </g>
          </g>

          {/* Arrow 2: Serial -> Enrichment */}
          <g>
            <path d="M 590 220 L 590 310" stroke="#64748b" strokeWidth="4"
                  fill="none" markerEnd="url(#arrow)"/>
            <rect x="545" y="250" width="90" height="30" rx="6" fill="#f1f5f9" opacity="0.95"/>
            <text x="590" y="272" textAnchor="middle" fontSize="11" fontWeight="600" fill="#334155">
              upsertReading()
            </text>
          </g>

          {/* Layer 3: Data Enrichment */}
          <g filter="url(#shadow)">
            <rect x="450" y="310" width="280" height="160" rx="12"
                  fill="url(#backendGrad)" stroke="#1e40af" strokeWidth="3"/>
            <text x="590" y="345" textAnchor="middle" fill="#ffffff"
                  fontSize="20" fontWeight="700">
              Time-Series Enrichment
            </text>
            <text x="590" y="368" textAnchor="middle" fill="#dbeafe" fontSize="11">
              In-memory store (600 readings ~20min)
            </text>

            <g fill="#bfdbfe" fontSize="10">
              <text x="470" y="395">• computeTempRate() → °C/min over 10 readings</text>
              <text x="470" y="413">• computeDewPoint() → Magnus approximation</text>
              <text x="470" y="431">• computeRiskScore() → 4-signal fusion (0-100)</text>
              <text x="470" y="449">• Map to INS Scale (0-4) + alert levels</text>
            </g>
          </g>

          {/* Arrow 3: Enrichment -> WebSocket */}
          <g>
            <path d="M 730 390 L 880 390" stroke="#64748b" strokeWidth="4"
                  fill="none" markerEnd="url(#arrow)"/>
            <rect x="770" y="365" width="80" height="40" rx="6" fill="#f1f5f9" opacity="0.95"/>
            <text x="810" y="382" textAnchor="middle" fontSize="10" fontWeight="600" fill="#334155">
              Enriched
            </text>
            <text x="810" y="396" textAnchor="middle" fontSize="10" fill="#64748b">
              Reading
            </text>
          </g>

          {/* Layer 4: WebSocket Server */}
          <g filter="url(#shadow)">
            <rect x="880" y="310" width="230" height="160" rx="12"
                  fill="url(#wsGrad)" stroke="#047857" strokeWidth="3"/>
            <text x="995" y="345" textAnchor="middle" fill="#ffffff"
                  fontSize="20" fontWeight="700">
              Socket.io
            </text>
            <text x="995" y="368" textAnchor="middle" fill="#d1fae5" fontSize="11">
              Real-time Broadcast
            </text>

            <g fill="#d1fae5" fontSize="10">
              <text x="900" y="395">• WebSocket transport</text>
              <text x="900" y="413">• io.emit('reading', data)</text>
              <text x="900" y="431">• io.emit('device_status', msg)</text>
              <text x="900" y="449">• Multi-client broadcast</text>
            </g>
          </g>

          {/* Arrow 4: WebSocket -> Frontend */}
          <g>
            <path d="M 995 470 L 995 540" stroke="#64748b" strokeWidth="4"
                  fill="none" markerEnd="url(#arrow)"/>
            <rect x="950" y="495" width="90" height="30" rx="6" fill="#f1f5f9" opacity="0.95"/>
            <text x="995" y="517" textAnchor="middle" fontSize="11" fontWeight="600" fill="#334155">
              WebSocket
            </text>
          </g>

          {/* Layer 5: Frontend */}
          <g filter="url(#shadow)">
            <rect x="830" y="540" width="330" height="100" rx="12"
                  fill="url(#frontendGrad)" stroke="#6d28d9" strokeWidth="3"/>
            <text x="995" y="575" textAnchor="middle" fill="#ffffff"
                  fontSize="20" fontWeight="700">
              React Dashboard (Vite)
            </text>
            <text x="995" y="598" textAnchor="middle" fill="#ede9fe" fontSize="11">
              LiveMonitor • TrendChart × 5 • Signal Table • INS Protocol Actions
            </text>
            <text x="995" y="618" textAnchor="middle" fill="#ddd6fe" fontSize="10">
              Socket.io client + REST API + Recharts visualization
            </text>
          </g>

          {/* Arrow 5: REST API (dashed) */}
          <g>
            <path d="M 830 590 L 730 420" stroke="#64748b" strokeWidth="3"
                  strokeDasharray="8,4" fill="none" markerEnd="url(#arrow)"/>
            <rect x="745" y="490" width="90" height="40" rx="6" fill="#fef3c7" opacity="0.95"/>
            <text x="790" y="507" textAnchor="middle" fontSize="10" fontWeight="600" fill="#92400e">
              REST API
            </text>
            <text x="790" y="521" textAnchor="middle" fontSize="9" fill="#92400e">
              GET /patients
            </text>
          </g>

          {/* Data flow timeline */}
          <g>
            <rect x="50" y="280" width="330" height="180" rx="8"
                  fill="#ffffff" stroke="#e5e7eb" strokeWidth="2" opacity="0.95"/>
            <text x="215" y="305" textAnchor="middle" fontSize="14" fontWeight="700" fill="#1f2937">
              Data Flow Timeline
            </text>

            {[
              { step: '1', text: 'Sensor calibration (20s)', color: '#10b981' },
              { step: '2', text: 'JSON serialization (2s interval)', color: '#3b82f6' },
              { step: '3', text: 'Backend enrichment (&lt;5ms)', color: '#8b5cf6' },
              { step: '4', text: 'Real-time broadcast', color: '#f59e0b' },
              { step: '5', text: 'Dashboard updates', color: '#ef4444' },
            ].map((item, i) => (
              <g key={i}>
                <circle cx="75" cy={335 + i * 25} r="8" fill={item.color} />
                <text x="75" y={340 + i * 25} textAnchor="middle" fill="#ffffff"
                      fontSize="11" fontWeight="700">
                  {item.step}
                </text>
                <text x="95" y={340 + i * 25} fill="#374151" fontSize="12">
                  {item.text}
                </text>
              </g>
            ))}
          </g>
        </svg>

        {/* Metrics Panel */}
        <div style={{
          marginTop: '32px',
          display: 'grid',
          gridTemplateColumns: 'repeat(5, 1fr)',
          gap: '16px',
        }}>
          {[
            { label: 'Sensor Polling', value: '2s', color: '#10b981' },
            { label: 'Risk Computation', value: '<5ms', color: '#3b82f6' },
            { label: 'History Buffer', value: '600 pts', color: '#8b5cf6' },
            { label: 'Chart Smoothing', value: '15-pt median', color: '#f59e0b' },
            { label: 'Update Latency', value: '<50ms', color: '#ef4444' },
          ].map((metric, i) => (
            <div key={i} style={{
              background: '#fff',
              padding: '16px',
              borderRadius: '8px',
              border: `2px solid ${metric.color}`,
              textAlign: 'center',
            }}>
              <div style={{ fontSize: '11px', color: '#666', marginBottom: '8px' }}>
                {metric.label}
              </div>
              <div style={{ fontSize: '22px', fontWeight: '700', color: metric.color }}>
                {metric.value}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default SystemDiagram;
