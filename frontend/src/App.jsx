import React, { useState, useEffect, useRef } from 'react';
import { io } from 'socket.io-client';
import PatientList from './components/PatientList';
import LiveMonitor from './components/LiveMonitor';

const API_URL = 'http://localhost:3001';
const MINI_HISTORY_MAX = 20;

// Minimal IV-drop SVG logo
function IVIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden>
      <path
        d="M8 1.5C8 1.5 4 7 4 10.5a4 4 0 0 0 8 0C12 7 8 1.5 8 1.5Z"
        fill="white"
        opacity="0.95"
      />
      <path d="M6 10.5 Q8 9 10 10.5" stroke="white" strokeWidth="0.9" fill="none" opacity="0.55" />
    </svg>
  );
}

export default function App() {
  const [patients, setPatients] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [latestByPatient, setLatestByPatient] = useState({});
  const [miniHistoryByPatient, setMiniHistoryByPatient] = useState({});
  const [connected, setConnected] = useState(false);
  const hasAutoSelected = useRef(false);

  useEffect(() => {
    fetch(`${API_URL}/patients`)
      .then((r) => r.json())
      .then((data) => {
        if (!Array.isArray(data)) return;
        setPatients(data);
        const map = {};
        data.forEach((p) => { if (p.latest) map[p.device_id] = p.latest; });
        setLatestByPatient(map);
        if (!hasAutoSelected.current && data.length > 0) {
          setSelectedId(data[0].device_id);
          hasAutoSelected.current = true;
        }
        data.forEach((p) => {
          fetch(`${API_URL}/patients/${p.device_id}/history?minutes=1`)
            .then((r) => r.json())
            .then((h) => {
              if (Array.isArray(h)) {
                setMiniHistoryByPatient((prev) => ({
                  ...prev,
                  [p.device_id]: h.slice(-MINI_HISTORY_MAX),
                }));
              }
            })
            .catch(() => {});
        });
      })
      .catch(console.error);
  }, []);

  useEffect(() => {
    const socket = io(API_URL, { transports: ['websocket'] });
    socket.on('connect', () => setConnected(true));
    socket.on('disconnect', () => setConnected(false));
    socket.on('reading', (reading) => {
      const { device_id } = reading;
      setLatestByPatient((prev) => ({ ...prev, [device_id]: reading }));
      setMiniHistoryByPatient((prev) => ({
        ...prev,
        [device_id]: [...(prev[device_id] ?? []), reading].slice(-MINI_HISTORY_MAX),
      }));
      setPatients((prev) => {
        const exists = prev.find((p) => p.device_id === device_id);
        if (exists) return prev.map((p) => p.device_id === device_id ? { ...p, latest: reading } : p);
        if (!hasAutoSelected.current) { setSelectedId(device_id); hasAutoSelected.current = true; }
        return [...prev, { device_id, latest: reading }];
      });
    });
    return () => socket.disconnect();
  }, []);

  const selectedLatest = latestByPatient[selectedId];

  return (
    <div className="flex h-screen overflow-hidden" style={{ backgroundColor: '#1a1b1e' }}>

      {/* ── Sidebar ── */}
      <aside className="w-56 flex-shrink-0 flex flex-col" style={{ backgroundColor: '#1a1b1e', borderRight: '1px solid #2c2d31' }}>

        {/* Brand */}
        <div className="px-4 pt-5 pb-4" style={{ borderBottom: '1px solid #2c2d31' }}>
          <div className="flex items-center gap-2.5">
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
              style={{ background: 'linear-gradient(135deg, #3574f0 0%, #1a56c4 100%)' }}
            >
              <IVIcon />
            </div>
            <div className="min-w-0">
              <p className="text-[13px] font-semibold leading-none" style={{ color: '#ebebeb' }}>
                IV Monitor
              </p>
              <p className="text-[10px] mt-0.5" style={{ color: '#5c5e6e' }}>
                IV Surveillance
              </p>
            </div>
          </div>

          {/* Live indicator */}
          <div className="flex items-center gap-1.5 mt-3.5">
            <span
              className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${
                connected ? 'bg-emerald-400' : 'animate-pulse'
              }`}
              style={connected ? {} : { backgroundColor: '#5c5e6e' }}
            />
            <span className="text-[10px]" style={{ color: connected ? '#6fcf97' : '#5c5e6e' }}>
              {connected ? 'Live' : 'Connecting…'}
            </span>
          </div>
        </div>

        {/* Section label */}
        <div className="px-4 pt-4 pb-1.5 flex items-center justify-between">
          <span className="text-[9px] font-semibold uppercase tracking-[0.12em]" style={{ color: '#5c5e6e' }}>
            Patients
          </span>
          {patients.length > 0 && (
            <span
              className="text-[9px] font-medium px-1.5 py-0.5 rounded"
              style={{ backgroundColor: '#2c2d31', color: '#9b9da8' }}
            >
              {patients.length}
            </span>
          )}
        </div>

        {/* Patient list */}
        <div className="flex-1 overflow-y-auto sidebar-scroll px-2 pb-3">
          <PatientList
            patients={patients}
            selectedId={selectedId}
            onSelect={setSelectedId}
            miniHistoryByPatient={miniHistoryByPatient}
          />
        </div>

        {/* Footer */}
        <div className="px-4 py-3" style={{ borderTop: '1px solid #2c2d31' }}>
          <p className="text-[9px]" style={{ color: '#4b5563' }}>
            Clinical monitoring only
          </p>
        </div>
      </aside>

      {/* ── Main ── */}
      <main className="flex-1 overflow-hidden flex flex-col" style={{ backgroundColor: '#f7f8fa' }}>
        {selectedId && selectedLatest ? (
          <LiveMonitor
            key={selectedId}
            patientId={selectedId}
            latest={selectedLatest}
            apiUrl={API_URL}
          />
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <p className="text-sm text-clinical-muted">Select a patient to begin monitoring.</p>
          </div>
        )}
      </main>
    </div>
  );
}
