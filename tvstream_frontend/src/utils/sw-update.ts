// Simple hook to detect when a new service worker is ready
export function onServiceWorkerUpdate(cb: () => void) {
    if (!("serviceWorker" in navigator)) return
    navigator.serviceWorker.addEventListener("controllerchange", () => cb())
  }
  