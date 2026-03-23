import React from 'react';

export default function SystemDiagram() {
  const nodeStyle = {
    padding: '16px 24px',
    borderRadius: '8px',
    border: '2px solid',
    backgroundColor: '#fff',
    minWidth: '140px',
    textAlign: 'center',
  };

  const labelStyle = {
    fontSize: '11px',
    fontWeight: '600',
    color: '#6b7280',
    marginBottom: '4px',
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
  };

  const valueStyle = {
    fontSize: '14px',
    fontWeight: '600',
    color: '#111827',
  };

  const subStyle = {
    fontSize: '11px',
    color: '#9ca3af',
    marginTop: '4px',
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
        System Architecture
      </h3>

      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '16px',
      }}>
        {/* ESP32 Node */}
        <div style={{ ...nodeStyle, borderColor: '#3b82f6', flex: 1 }}>
          <div style={labelStyle}>Hardware</div>
          <div style={valueStyle}>ESP32</div>
          <div style={subStyle}>
            DHT11 + FSR402
            <br />
            GPIO 4, 32
          </div>
        </div>

        {/* Arrow */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
          <svg width="40" height="20" viewBox="0 0 40 20" fill="none">
            <path d="M0 10 L35 10" stroke="#d1d5db" strokeWidth="2" />
            <path d="M30 5 L40 10 L30 15" fill="#d1d5db" />
          </svg>
          <div style={{ fontSize: '9px', color: '#9ca3af', whiteSpace: 'nowrap' }}>
            Serial USB
            <br />
            115200 baud
          </div>
        </div>

        {/* Backend Node */}
        <div style={{ ...nodeStyle, borderColor: '#10b981', flex: 1 }}>
          <div style={labelStyle}>Backend</div>
          <div style={valueStyle}>Node.js</div>
          <div style={subStyle}>
            Express + Socket.io
            <br />
            Port 3001
          </div>
        </div>

        {/* Arrow */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
          <svg width="40" height="20" viewBox="0 0 40 20" fill="none">
            <path d="M0 10 L35 10" stroke="#d1d5db" strokeWidth="2" />
            <path d="M30 5 L40 10 L30 15" fill="#d1d5db" />
          </svg>
          <div style={{ fontSize: '9px', color: '#9ca3af', whiteSpace: 'nowrap' }}>
            WebSocket
            <br />
            Real-time
          </div>
        </div>

        {/* Frontend Node */}
        <div style={{ ...nodeStyle, borderColor: '#8b5cf6', flex: 1 }}>
          <div style={labelStyle}>Frontend</div>
          <div style={valueStyle}>React</div>
          <div style={subStyle}>
            Vite + Recharts
            <br />
            Port 5173
          </div>
        </div>
      </div>

      {/* Data Flow Details */}
      <div style={{
        marginTop: '20px',
        padding: '12px 16px',
        backgroundColor: '#f9fafb',
        borderRadius: '6px',
        display: 'flex',
        gap: '24px',
        fontSize: '11px',
        color: '#6b7280',
      }}>
        <div style={{ flex: 1 }}>
          <strong style={{ color: '#374151' }}>Data Format:</strong> JSON
        </div>
        <div style={{ flex: 1 }}>
          <strong style={{ color: '#374151' }}>Frequency:</strong> 2s intervals
        </div>
        <div style={{ flex: 1 }}>
          <strong style={{ color: '#374151' }}>Processing:</strong> Backend computes risk score
        </div>
      </div>
    </div>
  );
}
