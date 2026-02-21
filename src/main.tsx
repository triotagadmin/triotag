// Main entry point for the application
import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

createRoot(document.getElementById("root")!).render(<App />);

// Clear stale service worker caches on load
if ('serviceWorker' in navigator) {
  window.addEventListener('load', async () => {
    // Force update any waiting service worker
    const registration = await navigator.serviceWorker.getRegistration();
    if (registration?.waiting) {
      registration.waiting.postMessage({ type: 'SKIP_WAITING' });
    }
    // Clean old caches
    if ('caches' in window) {
      const cacheNames = await caches.keys();
      await Promise.all(
        cacheNames
          .filter(name => name !== 'lovable-cache')
          .map(name => caches.delete(name))
      );
    }
  });
}
