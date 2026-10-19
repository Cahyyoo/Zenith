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
