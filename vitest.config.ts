import { defineConfig } from "vitest/config";

// Standalone test config — intentionally does NOT load the Cloudflare/React
// Router Vite plugins, which require the Workers runtime. Unit tests here
// cover pure logic (app/lib/sentences.ts) only.
export default defineConfig({
  test: {
    include: ["app/**/*.test.ts"],
    environment: "node",
  },
});
