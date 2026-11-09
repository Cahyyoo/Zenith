"use client";

import { useCallback, useEffect, useState } from "react";

import { check } from "@/lib/api-error";
import { env } from "@/lib/env";
import { getSupabase } from "@/lib/supabase/client";

export type NotificationStatus =
  | "loading"
  /** Browser has no Push API (or no service worker, e.g. the dev server). */
  | "unsupported"
  /** iPhone/iPad: push only works once Zenith is added to the Home Screen. */
  | "ios-install"
  /** NEXT_PUBLIC_VAPID_PUBLIC_KEY is not set for this deployment. */
  | "unconfigured"
  | "denied"
  | "off"
  | "on";

function isIos(): boolean {
  const ua = navigator.userAgent;
  return /iPad|iPhone|iPod/.test(ua) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
}

function isStandalone(): boolean {
  return window.matchMedia("(display-mode: standalone)").matches || ("standalone" in navigator && navigator.standalone === true);
}

function urlBase64ToUint8Array(base64: string): Uint8Array<ArrayBuffer> {
  const padded = (base64 + "=".repeat((4 - (base64.length % 4)) % 4)).replace(/-/g, "+").replace(/_/g, "/");
  const raw = atob(padded);
  const bytes = new Uint8Array(new ArrayBuffer(raw.length));
  for (let i = 0; i < raw.length; i += 1) bytes[i] = raw.charCodeAt(i);
  return bytes;
}

async function currentSubscription(): Promise<PushSubscription | null> {
  const registration = await navigator.serviceWorker.getRegistration();
  return registration ? registration.pushManager.getSubscription() : null;
}

async function readStatus(): Promise<NotificationStatus> {
  if (typeof window === "undefined") return "loading";
  if (isIos() && !isStandalone()) return "ios-install";
  if (!("serviceWorker" in navigator) || !("PushManager" in window) || !("Notification" in window)) return "unsupported";
  if (!(await navigator.serviceWorker.getRegistration())) return "unsupported";
  if (!env.NEXT_PUBLIC_VAPID_PUBLIC_KEY) return "unconfigured";
  if (Notification.permission === "denied") return "denied";
  return (await currentSubscription()) ? "on" : "off";
}

/** Removes this device's subscription (used when disabling and on sign-out). */
export async function unsubscribeThisDevice(): Promise<void> {
  if (typeof navigator === "undefined" || !("serviceWorker" in navigator)) return;
  const subscription = await currentSubscription();
  if (!subscription) return;
  check(await getSupabase().from("push_subscriptions").delete().eq("endpoint", subscription.endpoint));
  await subscription.unsubscribe();
}

/** Push reminder state for this device, plus enable / disable / test actions. */
export function usePushNotifications() {
  const [status, setStatus] = useState<NotificationStatus>("loading");
  const [busy, setBusy] = useState(false);

  const refresh = useCallback(() => readStatus().then(setStatus), []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const run = useCallback(
    async (action: () => Promise<void>) => {
      setBusy(true);
      try {
        await action();
      } finally {
        setBusy(false);
        await refresh();
      }
    },
    [refresh],
  );

  const enable = useCallback(
    () =>
      run(async () => {
        const key = env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
        if (!key) return;
        if ((await Notification.requestPermission()) !== "granted") return;
        const registration = await navigator.serviceWorker.ready;
        const subscription =
          (await registration.pushManager.getSubscription()) ??
          (await registration.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: urlBase64ToUint8Array(key) }));
        const json = subscription.toJSON();
        check(
          await getSupabase()
            .from("push_subscriptions")
            .upsert(
              {
                endpoint: subscription.endpoint,
                p256dh: json.keys?.p256dh ?? "",
                auth: json.keys?.auth ?? "",
                user_agent: navigator.userAgent.slice(0, 300),
              },
              { onConflict: "endpoint" },
            ),
        );
      }),
    [run],
  );

  const disable = useCallback(() => run(unsubscribeThisDevice), [run]);

  /** A local notification through the service worker, to check display works. */
  const test = useCallback(async () => {
    const registration = await navigator.serviceWorker.ready;
    await registration.showNotification("Zenith", {
      body: "Notifications are working on this device.",
      icon: "/pwa-icon/192",
      tag: "zenith-test",
    });
  }, []);

  return { status, busy, enable, disable, test };
}
