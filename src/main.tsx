import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import {MusicProvider} from './MusicCinema';
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
import './slp-private-media.css';
import './companion.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <MusicProvider><App /></MusicProvider>
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

import './reader-ai-upgrade.css';

import './device-workspace.css';

import './slp-study-responsive.css';

import './phone-editor-fix.css';

import './notes-studio.css';

import './rich-note-editor.css';

import './multimedia-notes.css';

import './premium-life.css';

import './music-cinema.css';
