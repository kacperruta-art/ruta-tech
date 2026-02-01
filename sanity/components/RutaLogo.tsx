import React from 'react';

export const RutaLogo = () => (
  <div style={{
    display: 'flex',
    alignItems: 'center',
    fontFamily: "'JetBrains Mono', monospace, sans-serif",
    fontWeight: 700,
    fontSize: '1.2rem',
    lineHeight: 1.2,
    color: 'inherit' // Adapts to dark/light mode automatically
  }}>
    <span>RUTA</span>
    <span style={{ color: '#0066aa', margin: '0 4px' }}>//</span>
    <span>TECH</span>
  </div>
);
