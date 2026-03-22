import React from 'react';
import PatientCard from './PatientCard';

export default function PatientList({ patients, selectedId, onSelect, miniHistoryByPatient }) {
  if (patients.length === 0) {
    return (
      <p className="text-[11px] text-sidebar-subtle text-center py-8 px-2">
        No active devices detected.
      </p>
    );
  }

  return (
    <div className="space-y-0.5">
      {patients.map((p) => (
        <PatientCard
          key={p.device_id}
          patient={p}
          isSelected={p.device_id === selectedId}
          onClick={() => onSelect(p.device_id)}
          miniHistory={miniHistoryByPatient?.[p.device_id]}
        />
      ))}
    </div>
  );
}
