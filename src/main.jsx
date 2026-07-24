import React from 'react';
import ReactDOM from 'react-dom/client';
import * as Sentry from '@sentry/react';
import App from './TRCConnectApp';

if (import.meta.env.VITE_SENTRY_DSN) {
  Sentry.init({
    dsn: import.meta.env.VITE_SENTRY_DSN,
    environment: import.meta.env.MODE,
    tracesSampleRate: 0.1,
  });
}

// A production deploy rotates every asset's content hash. Anyone who already
// had the app open in a tab is still holding an index.html that references
// the OLD hashes — the next lazy route they visit tries to fetch a chunk
// that no longer exists on the server and throws an unhandled
// "Failed to fetch dynamically imported module" TypeError (caught live via
// Sentry during a routine deploy). A single reload picks up the new
// index.html and resolves it; the sessionStorage guard stops a reload loop
// if the fetch is failing for a genuine network/offline reason instead.
window.addEventListener('vite:preloadError', () => {
  if (sessionStorage.getItem('trc_chunk_reload')) return;
  sessionStorage.setItem('trc_chunk_reload', '1');
  window.location.reload();
});
window.addEventListener('load', () => {
  setTimeout(() => sessionStorage.removeItem('trc_chunk_reload'), 10_000);
});

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(<App />);
