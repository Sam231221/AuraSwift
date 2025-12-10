import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  plugins: [react()] as any,
  test: {
    globals: true,
    environment: "jsdom",
    setupFiles: ["./tests/setup.ts"],
    include: ["tests/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}"],
    exclude: [
      "node_modules",
      "dist",
      ".idea",
      ".git",
      ".cache",
      "tests/e2e",
      "tests/**/*.spec.ts", // Exclude Playwright specs
    ],
    coverage: {
      provider: "v8",
      reporter: ["text", "json", "html", "lcov"],
      exclude: [
        "node_modules/",
        "tests/",
        "**/*.d.ts",
        "**/*.config.*",
        "**/dist/",
        "**/build/",
        "**/*.spec.ts",
        "**/migrations/",
        "**/seed.ts",
      ],
      thresholds: {
        lines: 70,
        functions: 70,
        branches: 65,
        statements: 70,
      },
    },
    testTimeout: 10000,
    hookTimeout: 10000,
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./packages/renderer/src"),
      "@app/main": path.resolve(__dirname, "./packages/main/src"),
      "@app/preload": path.resolve(__dirname, "./packages/preload/src"),
      "@app/shared": path.resolve(__dirname, "./packages/shared/src"),
    },
  },
});
