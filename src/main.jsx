import React from 'react'; // Importación estándar
import { createRoot } from 'react-dom/client';
import './index.css';
import App from './App.jsx';

createRoot(document.getElementById('root')).render(
  // ✨ Simplemente quitamos las etiquetas <StrictMode> que envolvían a <App />
  <App />
);