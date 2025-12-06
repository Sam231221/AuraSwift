import path from "path";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";
import { visualizer } from "rollup-plugin-visualizer";
import { readFileSync } from "fs";
import { fileURLToPath } from "url";

// Read version from root package.json
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootPackageJson = JSON.parse(
  readFileSync(path.resolve(__dirname, "../../package.json"), "utf-8")
);
const appVersion = rootPackageJson.version || "0.0.0";

// Set the version as an environment variable for Vite to pick up
// Vite automatically exposes process.env.VITE_* variables as import.meta.env.VITE_*
process.env.VITE_APP_VERSION = appVersion;

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    // Bundle visualizer - only runs when ANALYZE env var is set
    process.env.ANALYZE === "true" &&
      visualizer({
        open: true,
        filename: "./dist/stats.html",
        gzipSize: true,
        brotliSize: true,
      }),
  ].filter(Boolean),
  define: {
    // Provide global and process for Node.js polyfills
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
    // Electron: Enable minification for production (esbuild is fastest)
    minify: "esbuild",
    // Electron: Report sizes (helpful for monitoring, but no compression needed)
    reportCompressedSize: false, // Not relevant for local files
    // Electron: Source maps for production debugging (Electron apps benefit from source maps)
    sourcemap: process.env.NODE_ENV === "development" ? "inline" : "hidden", // Hidden for production
    // Electron: Target Electron's Chromium version for optimal performance
    target: "esnext", // Electron uses modern Chromium
    // CSS code splitting (beneficial for desktop apps)
    cssCodeSplit: true,
    // Electron: Larger chunks acceptable (local disk vs network)
    // VS Code uses ~1MB chunks, we can be more lenient
    chunkSizeWarningLimit: 1000, // Warn if chunk > 1MB (desktop app)
    rollupOptions: {
      // Tree-shaking (critical for desktop apps - reduce memory footprint)
      treeshake: {
        moduleSideEffects: false,
        preset: "recommended",
        // Electron: More aggressive tree-shaking for desktop apps
        propertyReadSideEffects: false,
        tryCatchDeoptimization: false,
      },
      output: {
        // Intelligent chunking strategy for optimal code-splitting
        manualChunks: (id) => {
          // Feature-based chunking (prioritize by size and usage)
          const featurePatterns = [
            { pattern: "/features/inventory/", name: "feature-inventory" },
            { pattern: "/features/sales/", name: "feature-sales" },
            { pattern: "/features/users/", name: "feature-users" },
            { pattern: "/features/rbac/", name: "feature-rbac" },
            { pattern: "/features/settings/", name: "feature-settings" },
            { pattern: "/features/staff/", name: "feature-staff" },
            { pattern: "/features/auth/", name: "feature-auth" },
            { pattern: "/features/dashboard/", name: "feature-dashboard" },
          ];

          for (const { pattern, name } of featurePatterns) {
            if (id.includes(pattern)) {
              return name;
            }
          }

          // Navigation system chunk
          if (id.includes("/navigation/")) {
            return "navigation";
          }

          // Shared utilities chunk
          if (id.includes("/shared/")) {
            return "shared";
          }

          // Vendor chunking strategy (optimize for caching)
          if (id.includes("node_modules")) {
            // React core (rarely changes, separate chunk)
            if (id.includes("react") || id.includes("react-dom")) {
              return "vendor-react";
            }

            // UI libraries (Radix UI - separate for better caching)
            if (id.includes("@radix-ui")) {
              return "vendor-ui-radix";
            }

            // Form libraries (often used together)
            if (
              id.includes("react-hook-form") ||
              id.includes("zod") ||
              id.includes("@hookform")
            ) {
              return "vendor-forms";
            }

            // State management
            if (id.includes("zustand") || id.includes("jotai")) {
              return "vendor-state";
            }

            // Large libraries (separate to prevent bloating main vendor)
            if (
              id.includes("date-fns") ||
              id.includes("lodash") ||
              id.includes("moment")
            ) {
              return "vendor-utils";
            }

            // Other vendors (group smaller libraries)
            return "vendor";
          }

          return undefined; // Let Rollup handle other modules
        },

        // Better chunk naming for debugging
        chunkFileNames: (chunkInfo) => {
          const facadeModuleId = chunkInfo.facadeModuleId
            ? chunkInfo.facadeModuleId
                .split("/")
                .pop()
                ?.replace(/\.[^.]*$/, "")
            : "chunk";
          return `chunks/${facadeModuleId}-[hash].js`;
        },

        // Entry chunk naming
        entryFileNames: "assets/[name]-[hash].js",

        // Asset naming
        assetFileNames: (assetInfo) => {
          const info = assetInfo.name?.split(".") || [];
          const ext = info[info.length - 1];
          if (/png|jpe?g|svg|gif|tiff|bmp|ico/i.test(ext)) {
            return `assets/images/[name]-[hash][extname]`;
          }
          if (/woff2?|eot|ttf|otf/i.test(ext)) {
            return `assets/fonts/[name]-[hash][extname]`;
          }
          return `assets/[name]-[hash][extname]`;
        },
      },
    },
  },
  // Optimize dependencies
  optimizeDeps: {
    // Pre-bundle these dependencies for faster dev server
    include: ["react", "react-dom"],
    esbuildOptions: {
      // Provide Buffer polyfill
      define: {
        global: "globalThis",
      },
    },
  },
});
