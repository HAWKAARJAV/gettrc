import React from 'react';

export default function WorkflowTimeline({ steps = [] }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      {steps.map((s, i) => (
        <div key={i} style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
          <div style={{ width: 28, display: 'flex', justifyContent: 'center' }}>
            <div style={{ width: 14, height: 14, borderRadius: 999, background: s.active ? '#C9A84C' : s.done ? '#0F2557' : '#E6EAF0', boxShadow: s.active ? '0 0 0 6px rgba(201,168,76,0.12)' : 'none' }} />
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ fontWeight: 800, color: '#0F2557' }}>{s.title}</div>
              <div style={{ fontSize: 12, color: '#6B7280' }}>{s.date || ''}</div>
            </div>
            <div style={{ color: '#6B7280', marginTop: 6 }}>{s.description}</div>
          </div>
        </div>
      ))}
    </div>
  );
}
