import { createSerwistRoute } from "@serwist/turbopack";

// App-shell routes precached at install time. They are static and contain no
// user data (all data is loaded client-side), so they are safe to share.
// `/~offline` must be precached too: it is the worker's document fallback.
const APP_SHELL = ["/", "/p", "/p/tags", "/d", "/d/focus", "/d/projects", "/d/board", "/settings", "/login", "/~offline"];

// New revision per build so updated shells replace the cached ones.
const revision = crypto.randomUUID();

export const { dynamic, dynamicParams, revalidate, generateStaticParams, GET } = createSerwistRoute({
  swSrc: "src/sw/sw.ts",
  useNativeEsbuild: true,
  additionalPrecacheEntries: APP_SHELL.map((url) => ({ url, revision })),
});
