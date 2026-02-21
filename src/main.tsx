// Main entry point for the application
import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

createRoot(document.getElementById("root")!).render(<App />);

// Aggressive service worker cache busting for mobile
if ('serviceWorker' in navigator) {
  window.addEventListener('load', async () => {
    // Force unregister ALL existing service workers and clear ALL caches
    const registrations = await navigator.serviceWorker.getRegistrations();
    for (const registration of registrations) {
      // Force waiting SW to activate immediately
      if (registration.waiting) {
        registration.waiting.postMessage({ type: 'SKIP_WAITING' });
      }
      // Listen for new SW and reload when it takes over
      registration.addEventListener('updatefound', () => {
        const newWorker = registration.installing;
        if (newWorker) {
          newWorker.addEventListener('statechange', () => {
            if (newWorker.state === 'activated') {
              window.location.reload();
            }
          });
        }
      });
      // Force check for updates
      registration.update().catch(() => {});
    }

    // Nuke all caches to guarantee fresh content
    if ('caches' in window) {
      const cacheNames = await caches.keys();
      await Promise.all(cacheNames.map(name => caches.delete(name)));
    }
  });

  // Detect controller change (new SW activated) and reload
  let refreshing = false;
  navigator.serviceWorker.addEventListener('controllerchange', () => {
    if (!refreshing) {
      refreshing = true;
      window.location.reload();
    }
  });
}
