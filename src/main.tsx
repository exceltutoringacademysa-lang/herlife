import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './styles.css';
import './native.css';
import './life-studio.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);

// Installation support only. Account data and remote API traffic are never cached.
if ('serviceWorker' in navigator && import.meta.env.PROD) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch(() => {
      // The app remains usable online if the browser disallows service workers.
    });
  });
}
