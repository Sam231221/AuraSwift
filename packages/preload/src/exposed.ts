import * as exports from "./index.js";
import { contextBridge } from "electron";

// Polyfill btoa for Electron preload context if not available
if (typeof btoa === "undefined") {
  globalThis.btoa = (str: string) =>
    Buffer.from(str, "binary").toString("base64");
}

// Expose btoa function to renderer for testing purposes
contextBridge.exposeInMainWorld("btoa", (str: string) =>
  Buffer.from(str, "binary").toString("base64")
);

const isExport = (key: string): key is keyof typeof exports =>
  Object.hasOwn(exports, key);

for (const exportsKey in exports) {
  if (isExport(exportsKey)) {
    contextBridge.exposeInMainWorld(exportsKey, exports[exportsKey]);
  }
}

// Re-export for tests
export * from "./index.js";
