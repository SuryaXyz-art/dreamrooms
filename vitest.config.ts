import { defineConfig } from "vitest/config";
import path from "node:path";

const srcDirectory = path.resolve(import.meta.dirname, "./src");

export default defineConfig({
  resolve: {
    alias: {
      "@": srcDirectory,
    },
  },
  test: {
    environment: "jsdom",
    setupFiles: ["./src/test/setup.ts"],
    include: ["src/**/*.test.ts", "src/**/*.test.tsx"],
    css: true,
  },
});
