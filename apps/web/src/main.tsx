import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './styles/global.css'
import App from './App.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)

// Register service worker in production
if ('serviceWorker' in navigator && import.meta.env.PROD) {
  // Reload once when a new SW takes control (fresh bundles)
  let reloading = false;
  navigator.serviceWorker.addEventListener('controllerchange', () => {
    if (!reloading) {
      reloading = true;
      window.location.reload();
    }
  });

  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch(() => {
      // Service worker registration failed — app works fine without it
    });
  });
}

// Dev-only diagnostics
if (import.meta.env.DEV && 'serviceWorker' in navigator) {
  navigator.serviceWorker.ready.then((reg) => {
    console.info('[SW Diag] Controller:', navigator.serviceWorker.controller?.scriptURL ?? 'none');
    console.info('[SW Diag] Active SW:', reg.active?.scriptURL ?? 'none');
  });
}
