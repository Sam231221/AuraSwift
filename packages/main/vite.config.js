import { getNodeMajorVersion } from "@app/electron-versions";
import { spawn } from "child_process";
import electronPath from "electron";
import { copyFileSync, mkdirSync, readdirSync, statSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

export default /**
 * @type {import('vite').UserConfig}
 * @see https://vitejs.dev/config/
 */
({
  build: {
    ssr: true,
    sourcemap: process.env.NODE_ENV === 'production' ? false : 'inline',
    outDir: "dist",
    assetsDir: ".",
    target: `node${getNodeMajorVersion()}`,
    lib: {
      entry: "src/index.ts",
      formats: ["es"],
    },
    rollupOptions: {
      output: {
        entryFileNames: "[name].js",
      },
    },
    emptyOutDir: true,
    reportCompressedSize: false,
  },
  plugins: [copyMigrationsPlugin(), handleHotReload()],
});

/**
 * Copy migrations folder to dist after build
 * @return {import('vite').Plugin}
 */
function copyMigrationsPlugin() {
  return {
    name: "@app/copy-migrations",
    closeBundle() {
      // Get the directory of this config file (packages/main/)
      const configDir = dirname(fileURLToPath(import.meta.url));
      const srcMigrations = join(configDir, "src", "database", "migrations");
      const destMigrations = join(configDir, "dist", "migrations");

      // Recursively copy directory
      function copyDir(src, dest) {
        try {
          // Check if source exists
          if (!statSync(src).isDirectory()) {
            console.warn(`Migrations source not found: ${src}`);
            return;
          }

          mkdirSync(dest, { recursive: true });
          const entries = readdirSync(src);

          for (const entry of entries) {
            const srcPath = join(src, entry);
            const destPath = join(dest, entry);

            if (statSync(srcPath).isDirectory()) {
              copyDir(srcPath, destPath);
            } else {
              copyFileSync(srcPath, destPath);
            }
          }
          console.log(`✅ Migrations copied from ${src} to ${dest}`);
        } catch (err) {
          // Only log if it's not a "not found" error
          if (err.code !== "ENOENT") {
            console.error(`❌ Failed to copy migrations: ${err.message}`);
            console.error(`   Source: ${src}`);
            console.error(`   Dest: ${dest}`);
          } else {
            console.warn(
              `⚠️  Migrations source not found: ${src} (this is OK if no migrations exist yet)`
            );
          }
        }
      }

      copyDir(srcMigrations, destMigrations);
    },
  };
}

/**
 * Implement Electron app reload when some file was changed
 * @return {import('vite').Plugin}
 */
function handleHotReload() {
  /** @type {ChildProcess} */
  let electronApp = null;

  /** @type {import('vite').ViteDevServer|null} */
  let rendererWatchServer = null;

  return {
    name: "@app/main-process-hot-reload",

    config(config, env) {
      if (env.mode !== "development") {
        return;
      }

      const rendererWatchServerProvider = config.plugins.find(
        (p) => p.name === "@app/renderer-watch-server-provider"
      );
      if (!rendererWatchServerProvider) {
        throw new Error("Renderer watch server provider not found");
      }

      rendererWatchServer =
        rendererWatchServerProvider.api.provideRendererWatchServer();

      process.env.VITE_DEV_SERVER_URL =
        rendererWatchServer.resolvedUrls.local[0];

      return {
        build: {
          watch: {},
        },
      };
    },

    writeBundle() {
      if (process.env.NODE_ENV !== "development") {
        return;
      }

      /** Kill electron if a process already exists */
      if (electronApp !== null) {
        electronApp.removeListener("exit", process.exit);
        electronApp.kill("SIGINT");
        electronApp = null;
      }

      /** Spawn a new electron process */
      electronApp = spawn(String(electronPath), ["--inspect", "."], {
        stdio: "inherit",
      });

      /** Stops the watch script when the application has been quit */
      electronApp.addListener("exit", process.exit);
    },
  };
}
