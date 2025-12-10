import { createLogger, format, transports } from "winston";
import * as path from "path";
import { app } from "electron";

/**
 * Shared logger factory for all services.
 * Usage: import { getLogger } from "../utils/logger";
 * const logger = getLogger("office-printer-service");
 */
export function getLogger(service: string) {
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
