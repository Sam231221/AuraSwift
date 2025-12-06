#!/usr/bin/env node

/**
 * Script to run Vitest with graceful handling of "no tests found" case
 * This allows CI to pass when no unit tests exist yet
 *
 * Environment variables:
 * - VITEST_FAIL_ON_NO_TESTS=true - Exit with error code if no tests found (useful for CI)
 */

import { spawn } from "node:child_process";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { globSync } from "glob";

const __dirname = dirname(fileURLToPath(import.meta.url));
const rootDir = join(__dirname, "..");

// Check if there are any actual unit test files (not .example files, not .spec.ts files which are Playwright tests)
const testFiles = globSync("tests/**/*.test.{js,mjs,cjs,ts,mts,cts,jsx,tsx}", {
  cwd: rootDir,
  ignore: ["**/*.example", "**/e2e/**", "**/node_modules/**", "**/dist/**"], // Exclude examples, e2e tests, and build artifacts
});

if (testFiles.length === 0) {
  const failOnNoTests = process.env.VITEST_FAIL_ON_NO_TESTS === "true";
  console.log("No unit tests found, skipping...");
  process.exit(failOnNoTests ? 1 : 0);
}

// Run vitest if test files exist
const vitest = spawn("npx", ["vitest", "run"], {
  cwd: rootDir,
  stdio: "inherit",
  // Removed shell: true for security - not needed when using npx directly
});

// Handle process signals for graceful shutdown
const cleanup = (signal) => {
  if (vitest && !vitest.killed) {
    vitest.kill(signal);
  }
};

process.on("SIGINT", () => {
  cleanup("SIGINT");
  process.exit(130); // Standard exit code for SIGINT
});

process.on("SIGTERM", () => {
  cleanup("SIGTERM");
  process.exit(143); // Standard exit code for SIGTERM
});

vitest.on("close", (code) => {
  process.exit(code ?? 0);
});

vitest.on("error", (error) => {
  console.error("Failed to run vitest:", error.message);
  if (error.code === "ENOENT") {
    console.error(
      "Error: vitest not found. Make sure it is installed: npm install"
    );
  }
  process.exit(1);
});
