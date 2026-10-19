import { withSerwist } from "@serwist/turbopack";
import type { NextConfig } from "next";

// Cache Components is intentionally off: every page is a static shell whose
// data comes from Supabase on the client (React Query + IndexedDB), and the
// Serwist Turbopack route handler relies on classic route segment config.
const nextConfig: NextConfig = {
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default withSerwist(nextConfig);
