import React from 'react';

export default function SkeletonCard({ height = 100 }) {
  return (
    <div style={{ background: '#F3F4F6', borderRadius: 8, height, width: '100%', animation: 'pulse 1.2s infinite', border: '1px solid #EEF2F7' }} />
  );
}
