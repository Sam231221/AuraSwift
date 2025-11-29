import * as exports from "./index.js";
import { contextBridge } from "electron";

import { logger } from './logger';

// Polyfill btoa for Electron preload context if not available
if (typeof btoa === "undefined") {
  globalThis.btoa = (str: string) =>
    Buffer.from(str, "binary").toString("base64");
}

const isExport = (key: string): key is keyof typeof exports =>
  Object.hasOwn(exports, key);

for (const exportsKey in exports) {
  if (isExport(exportsKey)) {
    try {
      contextBridge.exposeInMainWorld(exportsKey, exports[exportsKey]);
    } catch (error) {
      // Skip if already exposed (e.g., btoa might already exist)
      logger.warn(`Could not expose ${exportsKey}:`, error);
    }
  }
}

// Re-export for tests
export * from "./index.js";
