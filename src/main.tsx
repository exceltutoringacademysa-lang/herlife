import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './styles.css';
import './native.css';
import './life-studio.css';
import './everyday-tools.css';
import './boutique.css';
import './glass.css';
import './games.css';
import './arcade.css';
import './mobile-polish.css';
import './writing-paper.css';
import './writing-workspace.css';
import './memory-cinema.css';
import './life-additions.css';

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
