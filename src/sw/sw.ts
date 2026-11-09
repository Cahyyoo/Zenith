import { defaultCache } from "@serwist/turbopack/worker";
import { NetworkOnly, Serwist, type PrecacheEntry, type SerwistGlobalConfig } from "serwist";

declare global {
  interface WorkerGlobalScope extends SerwistGlobalConfig {
    __SW_MANIFEST: (PrecacheEntry | string)[] | undefined;
  }
}

declare const self: ServiceWorkerGlobalScope;

const serwist = new Serwist({
  precacheEntries: self.__SW_MANIFEST,
  precacheOptions: {
    cleanupOutdatedCaches: true,
    // Every board/tag view shares one precached shell; `_rsc` is deliberately
    // not ignored so React Server Component fetches never receive HTML.
    ignoreURLParametersMatching: [/^utm_/, /^fbclid$/, /^project$/, /^issue$/, /^tag$/],
  },
  skipWaiting: true,
  clientsClaim: true,
  navigationPreload: true,
  runtimeCaching: [
    // Supabase (and any other origin) is never cached by the worker: React
    // Query + IndexedDB own the data, and auth responses must stay fresh.
    { matcher: ({ sameOrigin }) => !sameOrigin, handler: new NetworkOnly() },
    { matcher: ({ url }) => url.pathname.startsWith("/auth/"), handler: new NetworkOnly() },
    ...defaultCache,
  ],
  fallbacks: {
    entries: [
      {
        url: "/~offline",
        matcher: ({ request }) => request.destination === "document",
      },
    ],
  },
});

serwist.addEventListeners();

// ---- Reminder notifications (Web Push from the send-reminders function) ----

type ReminderPayload = { title?: string; body?: string; tag?: string; url?: string };

function readPayload(event: PushEvent): ReminderPayload {
  try {
    const data: unknown = event.data?.json();
    return typeof data === "object" && data !== null ? (data as ReminderPayload) : {};
  } catch {
    return { body: event.data?.text() };
  }
}

self.addEventListener("push", (event) => {
  const payload = readPayload(event);
  event.waitUntil(
    self.registration.showNotification(payload.title ?? "Zenith reminder", {
      body: payload.body ?? "",
      icon: "/pwa-icon/192",
      badge: "/pwa-icon/192",
      tag: payload.tag,
      data: { url: payload.url ?? "/p" },
    }),
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const data: unknown = event.notification.data;
  const target =
    typeof data === "object" && data !== null && "url" in data && typeof data.url === "string" ? data.url : "/p";
  event.waitUntil(
    (async () => {
      const windows = await self.clients.matchAll({ type: "window", includeUncontrolled: true });
      const open = windows.find((client) => new URL(client.url).origin === self.location.origin);
      if (open) {
        await open.focus();
        await open.navigate(target);
        return;
      }
      await self.clients.openWindow(target);
    })(),
  );
});
