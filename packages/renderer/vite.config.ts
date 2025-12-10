import path from "path";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";
import { readFileSync } from "fs";
import { fileURLToPath } from "url";

// Read version from root package.json
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootPackageJson = JSON.parse(
  readFileSync(path.resolve(__dirname, "../../package.json"), "utf-8")
);
const appVersion = rootPackageJson.version || "0.0.0";

// Set the version as an environment variable for Vite to pick up
process.env.VITE_APP_VERSION = appVersion;

// https://vite.dev/config/
export default defineConfig({
  // Use relative paths for Electron (critical for file:// protocol)
  base: "./",

  plugins: [react(), tailwindcss()],

  define: {
    global: "globalThis",
    "process.env": "{}",
  },

  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
      "@app/shared": path.resolve(__dirname, "../shared/src"),
    },
  },

  build: {
    minify: "esbuild",
    reportCompressedSize: false,
    sourcemap: process.env.NODE_ENV === "development" ? "inline" : "hidden",
    target: "esnext",
  },

  optimizeDeps: {
    include: ["react", "react-dom"],
    esbuildOptions: {
      define: {
        global: "globalThis",
      },
    },
  },
});
