import { createLogger, format, transports } from "winston";
import * as path from "path";

/**
 * Check if we're running in Electron context
 */
function isElectronContext(): boolean {
  try {
    // Try to require electron - will fail in CLI/tsx context
    require.resolve("electron");
    return true;
  } catch {
    return false;
  }
}

/**
 * Create a simple console logger for non-Electron contexts
 */
function createConsoleLogger(service: string) {
  const prefix = `[${service}]`;
  return {
    info: (...args: any[]) => console.log(prefix, ...args),
    error: (...args: any[]) => console.error(prefix, ...args),
    warn: (...args: any[]) => console.warn(prefix, ...args),
    debug: (...args: any[]) => console.debug(prefix, ...args),
  };
}

/**
 * Shared logger factory for all services.
 * Usage: import { getLogger } from "../utils/logger";
 * const logger = getLogger("office-printer-service");
 *
 * Works in both Electron and CLI (tsx) contexts.
 */
export function getLogger(service: string) {
  // If not in Electron context (e.g., running with tsx), use simple console logger
  if (!isElectronContext()) {
    return createConsoleLogger(service);
  }

  // Import electron dynamically only when in Electron context
  const { app } = require("electron");

  // Sanitize service name for file use
  const safeService = service.replace(/[^a-zA-Z0-9-_]/g, "_");
  const logger = createLogger({
    level: process.env.NODE_ENV === "production" ? "info" : "debug",
    format: format.combine(
      format.timestamp({ format: "YYYY-MM-DD HH:mm:ss" }),
      format.errors({ stack: true }),
      format.splat(),
      format.json()
    ),
    defaultMeta: { service },
    transports: [
      new transports.File({
        filename: path.join(
          app.getPath("userData"),
          "logs",
          `${safeService}-error.log`
        ),
        level: "error",
        maxsize: 5242880,
        maxFiles: 5,
      }),
      new transports.File({
        filename: path.join(
          app.getPath("userData"),
          "logs",
          `${safeService}-combined.log`
        ),
        maxsize: 5242880,
        maxFiles: 5,
      }),
    ],
  });

  if (process.env.NODE_ENV !== "production") {
    logger.add(
      new transports.Console({
        format: format.combine(format.colorize(), format.simple()),
      })
    );
  }

  return logger;
}
