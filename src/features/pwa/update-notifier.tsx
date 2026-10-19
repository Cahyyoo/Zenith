"use client";

import { useEffect } from "react";
import { toast } from "sonner";

/**
 * The service worker activates new versions immediately (skipWaiting), but an
 * open page keeps running the old JavaScript. When a new worker takes control
 * of a page that already had one, offer a reload. Queued offline writes are
 * persisted, so reloading never loses work.
 */
export function UpdateNotifier() {
  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;
    const hadController = navigator.serviceWorker.controller !== null;

    const onControllerChange = () => {
      if (!hadController) return; // First install, not an update.
      toast("Zenith was updated", {
        id: "app-update",
        description: "Reload to use the latest version.",
        duration: Number.POSITIVE_INFINITY,
        action: { label: "Reload", onClick: () => window.location.reload() },
      });
    };

    navigator.serviceWorker.addEventListener("controllerchange", onControllerChange);
    return () => navigator.serviceWorker.removeEventListener("controllerchange", onControllerChange);
  }, []);

  return null;
}
