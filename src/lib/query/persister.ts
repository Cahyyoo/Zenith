import { createAsyncStoragePersister } from "@tanstack/query-async-storage-persister";
import { del, get, set } from "idb-keyval";

/** IndexedDB-backed storage for the React Query cache and the offline write queue. */
export const queryPersister = createAsyncStoragePersister({
  key: "zenith-query-cache",
  storage: {
    getItem: async (key) => (await get<string>(key)) ?? null,
    setItem: (key, value: string) => set(key, value),
    removeItem: (key) => del(key),
  },
  throttleTime: 500,
});

/** Bump to discard persisted caches whose shape is no longer compatible. */
export const CACHE_BUSTER = "v1";
