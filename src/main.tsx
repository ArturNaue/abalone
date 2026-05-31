import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import './index.css'

// PWA Auto-Update:
// Wenn der SW eine neue Version gefunden hat (updatefound), blockiert die App
// das Spiel und zeigt eine Ladeanzeige. Sobald der neue SW aktiv ist,
// wird die Seite neu geladen. Im Offline-Modus passiert nichts.
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.ready.then(registration => {
    registration.addEventListener('updatefound', () => {
      if (!navigator.onLine) return;
      window.dispatchEvent(new CustomEvent('sw-update-start'));
    });
  });

  navigator.serviceWorker.addEventListener('controllerchange', () => {
    if (navigator.onLine) {
      window.location.reload();
    }
  });
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
