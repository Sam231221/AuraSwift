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
    // Electron: Disable CSS code splitting - bundle CSS together for reliability
    cssCodeSplit: false, // Single CSS file for Electron
    // Electron: Larger chunks acceptable (local disk vs network)
    chunkSizeWarningLimit: 2000, // Warn if chunk > 2MB (desktop apps can handle it)
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
        // ELECTRON FIX: Simplified chunking for reliable path resolution
        // Electron apps don't benefit from aggressive code splitting like web apps
        // Dynamic imports with file:// protocol can fail in packaged apps
        manualChunks: (id) => {
          // Only split heavy vendor libraries to keep bundles manageable
          if (id.includes("node_modules")) {
            // React ecosystem (stable, rarely changes)
            if (id.includes("react") || id.includes("react-dom")) {
              return "vendor-react";
            }

            // All other vendors in one chunk for reliability
            return "vendor";
          }

          // Bundle all app code together (features, navigation, shared)
          // This prevents dynamic import path resolution issues in Electron
          return undefined;
        },

        // Simpler chunk naming (no subdirectories for Electron)
        chunkFileNames: "assets/[name]-[hash].js",
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
