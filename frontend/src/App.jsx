import React, { useState, useEffect, useRef } from 'react';
import { io } from 'socket.io-client';
import PatientList from './components/PatientList';
import LiveMonitor from './components/LiveMonitor';

const API_URL = 'http://localhost:3001';
const MINI_HISTORY_MAX = 20;

export default function App() {
  const [patients, setPatients] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [latestByPatient, setLatestByPatient] = useState({});
  const [miniHistoryByPatient, setMiniHistoryByPatient] = useState({});
  const [connected, setConnected] = useState(false);
  const hasAutoSelected = useRef(false);

  // Load initial patient list and seed mini histories
  useEffect(() => {
    fetch(`${API_URL}/patients`)
      .then((r) => r.json())
      .then((data) => {
        if (!Array.isArray(data)) return;
        setPatients(data);
        const latestMap = {};
        data.forEach((p) => {
          if (p.latest) latestMap[p.device_id] = p.latest;
        });
        setLatestByPatient(latestMap);
        if (!hasAutoSelected.current && data.length > 0) {
          setSelectedId(data[0].device_id);
          hasAutoSelected.current = true;
        }
        // Seed mini histories from the last 20 readings per patient
        data.forEach((p) => {
          fetch(`${API_URL}/patients/${p.device_id}/history?minutes=1`)
            .then((r) => r.json())
            .then((history) => {
              if (Array.isArray(history)) {
                setMiniHistoryByPatient((prev) => ({
                  ...prev,
                  [p.device_id]: history.slice(-MINI_HISTORY_MAX),
                }));
              }
            })
            .catch(() => {});
        });
      })
      .catch(console.error);
  }, []);

  // Real-time updates via WebSocket
  useEffect(() => {
    const socket = io(API_URL, { transports: ['websocket'] });

    socket.on('connect', () => setConnected(true));
    socket.on('disconnect', () => setConnected(false));

    socket.on('reading', (reading) => {
      const { device_id } = reading;

      setLatestByPatient((prev) => ({ ...prev, [device_id]: reading }));

      setMiniHistoryByPatient((prev) => {
        const current = prev[device_id] ?? [];
        return {
          ...prev,
          [device_id]: [...current, reading].slice(-MINI_HISTORY_MAX),
        };
      });

      setPatients((prev) => {
        const exists = prev.find((p) => p.device_id === device_id);
        if (exists) {
          return prev.map((p) =>
            p.device_id === device_id ? { ...p, latest: reading } : p
          );
        }
        if (!hasAutoSelected.current) {
          setSelectedId(device_id);
          hasAutoSelected.current = true;
        }
        return [...prev, { device_id, latest: reading }];
      });
    });

    return () => socket.disconnect();
  }, []);

  const selectedLatest = latestByPatient[selectedId];

  return (
    <div className="flex h-screen bg-clinical-bg overflow-hidden">
      {/* ── Sidebar ── */}
      <aside className="w-72 flex-shrink-0 bg-white border-r border-clinical-border flex flex-col">
        {/* Header */}
        <div className="px-5 py-4 border-b border-clinical-border">
          <div className="flex items-center gap-2 mb-2">
            <span
              className={`inline-block w-2 h-2 rounded-full transition-colors ${
                connected ? 'bg-green-500' : 'bg-gray-300 animate-pulse'
              }`}
            />
            <span className="text-xs text-clinical-muted">
              {connected ? 'Live' : 'Connecting…'}
            </span>
            {patients.length > 0 && (
              <span className="ml-auto text-xs text-clinical-subtle">
                {patients.length} device{patients.length !== 1 ? 's' : ''}
              </span>
            )}
          </div>
          <h1 className="text-[15px] font-semibold text-clinical-text leading-tight">
            IV Site Monitor
          </h1>
          <p className="text-xs text-clinical-muted">Peripheral IV Surveillance</p>
        </div>

        {/* Patient list */}
        <PatientList
          patients={patients}
          selectedId={selectedId}
          onSelect={setSelectedId}
          miniHistoryByPatient={miniHistoryByPatient}
        />

        {/* Footer */}
        <div className="px-5 py-3 border-t border-clinical-border">
          <p className="text-[10px] text-clinical-subtle">
            For clinical support use only
          </p>
        </div>
      </aside>

      {/* ── Main panel ── */}
      <main className="flex-1 overflow-y-auto">
        {selectedId && selectedLatest ? (
          <LiveMonitor
            key={selectedId}
            patientId={selectedId}
            latest={selectedLatest}
            apiUrl={API_URL}
          />
        ) : (
          <div className="flex items-center justify-center h-full">
            <p className="text-clinical-muted text-sm">
              Select a patient to begin monitoring.
            </p>
          </div>
        )}
      </main>
    </div>
  );
}
