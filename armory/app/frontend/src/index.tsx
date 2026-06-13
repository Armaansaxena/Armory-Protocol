import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { Buffer } from 'buffer';
import process from 'process';

// Polyfill for the browser
(window as any).Buffer = Buffer;
(window as any).process = process;

const root = ReactDOM.createRoot(
  document.getElementById('root') as HTMLElement
);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
