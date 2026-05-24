import React from 'react';

export default function EmptyState({ title = 'Nothing here yet', message = '', cta }) {
  return (
    <div style={{ textAlign: 'center', padding: 28, color: '#6B7280' }}>
      <div style={{ fontSize: 34, marginBottom: 8 }}>📭</div>
      <div style={{ fontSize: 18, fontWeight: 800, color: '#0F2557' }}>{title}</div>
      {message && <div style={{ marginTop: 8, fontSize: 13 }}>{message}</div>}
      {cta && (
        <div style={{ marginTop: 14 }}>
          <button onClick={cta.onClick} style={{ padding: '10px 16px', borderRadius: 8, background: '#0F2557', color: '#fff', border: 'none', cursor: 'pointer' }}>{cta.label}</button>
        </div>
      )}
    </div>
  );
}
