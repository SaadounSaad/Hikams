// src/main.tsx - Version corrigée sans FavoritesProvider
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';

// Configuration du Root sans provider externe
const root = ReactDOM.createRoot(
  document.getElementById('root') as HTMLElement
);

root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);