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
  // CRITICAL FOR ELECTRON: Use relative paths instead of absolute paths
  // This ensures file:// protocol can resolve chunks correctly
  base: "./",

  plugins: [
    // CRITICAL FOR ELECTRON: Fix dynamic imports for file:// protocol
    // Vite uses import.meta.url which doesn't work in Electron production builds
    // This plugin ensures chunks are loaded with correct relative paths
    {
      name: 'electron-dynamic-import-fix',
      enforce: 'post' as const,
      generateBundle(_options: unknown, bundle: Record<string, unknown>) {
        // Only apply in production builds
        if (process.env.NODE_ENV !== 'production') return;
        
        for (const [_fileName, output] of Object.entries(bundle)) {
          const chunk = output as { type?: string; code?: string };
          if (chunk.type === 'chunk' && chunk.code) {
            // Replace __vite__mapDeps and import.meta.url with relative path resolution
            // This ensures dynamic imports work with file:// protocol
            chunk.code = chunk.code.replace(
              /import\.meta\.url/g,
              'document.baseURI || document.URL'
            );
          }
        }
      },
    },
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
    // CRITICAL FOR ELECTRON: Disable modulepreload to enable true lazy loading
    // Electron loads from local disk (no network latency), so preloading is counterproductive
    // This allows features to load on-demand, reducing memory usage and startup time
    modulePreload: false,
    
    // Electron: Enable minification for production (esbuild is fastest)
    minify: "esbuild",
    // Electron: Report sizes (helpful for monitoring, but no compression needed)
    reportCompressedSize: false, // Not relevant for local files
    // Electron: Source maps for production debugging (Electron apps benefit from source maps)
    sourcemap: process.env.NODE_ENV === "development" ? "inline" : "hidden", // Hidden for production
    // Electron: Target Electron's Chromium version for optimal performance
    target: "esnext", // Electron uses modern Chromium
    // Electron: CSS code splitting is fine with relative paths
    cssCodeSplit: true, // Split CSS for better lazy loading
    // Electron: Larger chunks acceptable (local disk vs network)
    chunkSizeWarningLimit: 1500, // Warn if chunk > 1.5MB (desktop app)
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
        // ELECTRON-OPTIMIZED: Smart chunking strategy for desktop apps
        // With base: './' and modulePreload: false, features load truly on-demand
        manualChunks: (id) => {
          // IMPORTANT: Don't bundle feature code - let Vite create separate lazy chunks
          // This enables true on-demand loading when navigating to features
          if (id.includes("/features/")) {
            // Extract feature name for chunk naming
            const match = id.match(/\/features\/(\w+)\//)
            if (match) {
              return `feature-${match[1]}`;
            }
          }

          // Navigation system (used everywhere)
          if (id.includes("/navigation/")) {
            return "navigation";
          }

          // Shared utilities
          if (id.includes("/shared/")) {
            return "shared";
          }

          // Vendor chunking (optimize for better memory usage)
          if (id.includes("node_modules")) {
            // React core (most stable dependency)
            if (id.includes("react") || id.includes("react-dom")) {
              return "vendor-react";
            }

            // UI libraries (Radix UI components)
            if (id.includes("@radix-ui")) {
              return "vendor-ui-radix";
            }

            // Form libraries (heavy dependencies)
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

            // Large utility libraries
            if (
              id.includes("date-fns") ||
              id.includes("lodash") ||
              id.includes("moment")
            ) {
              return "vendor-utils";
            }

            // Other vendors
            return "vendor";
          }

          return undefined;
        },

        // ELECTRON: Keep chunks in assets/ (no subdirectories)
        // Relative paths work perfectly with base: './'
        chunkFileNames: "assets/[name]-[hash].js",
        entryFileNames: "assets/[name]-[hash].js",

        // ELECTRON: Optimize chunk size for granular lazy loading
        experimentalMinChunkSize: 0, // Allow small chunks for better on-demand loading

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
