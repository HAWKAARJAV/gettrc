import React from 'react';

// Inject the keyframe once (idempotent)
if (typeof document !== 'undefined' && !document.getElementById('unread-badge-style')) {
  const s = document.createElement('style');
  s.id = 'unread-badge-style';
  s.textContent = `@keyframes badge-pulse { 0%,100%{transform:scale(1)} 50%{transform:scale(1.15)} }`;
  document.head.appendChild(s);
}

export default function UnreadBadge({ count = 0 }) {
  if (!count) return null;
  const display = count > 99 ? '99+' : String(count);
  return (
    <span style={{
      background: '#EF4444', color: '#fff',
      padding: '2px 6px', borderRadius: 999,
      fontSize: 11, fontWeight: 800,
      minWidth: 20, display: 'inline-block', textAlign: 'center',
      animation: 'badge-pulse 1.6s ease-in-out infinite',
    }}>
      {display}
    </span>
  );
}
