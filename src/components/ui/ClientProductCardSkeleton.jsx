// src/components/ui/ClientProductCardSkeleton.jsx

import React from 'react';

// (Opcional) Puedes añadir este CSS a tu archivo de estilos para el efecto de pulso.
// .skeleton-pulse {
//   animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
// }
// @keyframes pulse {
//   50% { opacity: .5; }
// }

export const ClientProductCardSkeleton = () => (
  <div className="product-card-new skeleton-pulse" style={{ backgroundColor: '#e5e7eb' }}>
    <div className="product-card-header-new" style={{ backgroundColor: '#d1d5db', height: '12rem' }}></div>
    <div className="product-card-content-new">
      <div style={{ height: '1rem', width: '40%', backgroundColor: '#d1d5db', marginBottom: '0.75rem', borderRadius: '4px' }}></div>
      <div style={{ height: '1.25rem', width: '80%', backgroundColor: '#d1d5db', marginBottom: '0.5rem', borderRadius: '4px' }}></div>
      <div style={{ height: '1rem', width: '100%', backgroundColor: '#d1d5db', borderRadius: '4px' }}></div>
    </div>
    <div className="product-card-footer-new">
      <div style={{ height: '1.5rem', width: '50%', backgroundColor: '#d1d5db', borderRadius: '4px' }}></div>
      <div style={{ height: '2.25rem', width: '30%', backgroundColor: '#d1d5db', borderRadius: '4px' }}></div>
    </div>
  </div>
);