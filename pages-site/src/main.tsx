import './index.css';
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { initSourceidMessenger } from './runtime';
import { initExportToFigma } from './export-to-figma';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

initSourceidMessenger();
initExportToFigma();
