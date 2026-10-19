"use client";
import { useEffect } from "react";
export default function OfflineShell() {
  useEffect(() => {
    if (
      process.env.NODE_ENV !== "production" ||
      !("serviceWorker" in navigator)
    )
      return;
    void navigator.serviceWorker
      .register("/sw.js")
      .then(() => navigator.serviceWorker.ready)
      .then((registration) => {
        const urls = performance
          .getEntriesByType("resource")
          .map((entry) => entry.name);
        registration.active?.postMessage({ type: "CACHE_SHELL", urls });
      })
      .catch(() => {
        /* Offline shell may be unavailable in private/restricted browsers. */
      });
  }, []);
  return null;
}
