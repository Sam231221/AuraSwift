import path from "path";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";
import { visualizer } from "vite-bundle-visualizer";

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    // Bundle visualizer - only runs when ANALYZE env var is set
    process.env.ANALYZE === "true" &&
      visualizer({
        open: true,
        filename: "dist/stats.html",
        gzipSize: true,
        brotliSize: true,
      }),
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    // Enable minification for production
    minify: "esbuild", // esbuild is faster than terser
    // Report compressed size (disabled for faster builds, enable if needed)
    reportCompressedSize: false,
    // Chunk size warning limit (in KB)
    chunkSizeWarningLimit: 1000,
    rollupOptions: {
      output: {
        // Manual chunk splitting for better caching
        manualChunks: {
          // Vendor chunk for React and core libraries
          vendor: ["react", "react-dom", "react-router-dom"],
          // UI library chunk
          "ui-vendor": [
            "@radix-ui/react-dialog",
            "@radix-ui/react-dropdown-menu",
            "@radix-ui/react-select",
            "@radix-ui/react-tabs",
          ],
          // State management chunk
          "state-vendor": [
            "@reduxjs/toolkit",
            "react-redux",
            "@tanstack/react-query",
          ],
        },
      },
    },
  },
  // Optimize dependencies
  optimizeDeps: {
    // Pre-bundle these dependencies for faster dev server
    include: [
      "react",
      "react-dom",
      "react-router-dom",
      "@tanstack/react-query",
      "@reduxjs/toolkit",
    ],
  },
});
