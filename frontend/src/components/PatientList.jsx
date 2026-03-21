import React from 'react';
import PatientCard from './PatientCard';

export default function PatientList({ patients, selectedId, onSelect, miniHistoryByPatient }) {
  return (
    <div className="flex-1 overflow-y-auto p-3 space-y-2">
      {patients.length === 0 ? (
        <p className="text-xs text-clinical-muted text-center py-10">
          No active devices detected.
        </p>
      ) : (
        patients.map((p) => (
          <PatientCard
            key={p.device_id}
            patient={p}
            isSelected={p.device_id === selectedId}
            onClick={() => onSelect(p.device_id)}
            miniHistory={miniHistoryByPatient?.[p.device_id]}
          />
        ))
      )}
    </div>
  );
}
