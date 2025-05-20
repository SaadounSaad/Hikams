// src/main.tsx - Avec FavoritesProvider
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { FavoritesProvider } from './context/FavoritesContext';
import './index.css';

// Configuration du Root avec le provider des favoris
const root = ReactDOM.createRoot(
  document.getElementById('root') as HTMLElement
);

root.render(
  <React.StrictMode>
    <FavoritesProvider>
      <App />
    </FavoritesProvider>
  </React.StrictMode>
);