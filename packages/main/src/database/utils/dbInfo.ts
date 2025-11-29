import fs from "fs";
import { isDevelopmentMode } from "./environment.js";
import { getLogger } from "../../utils/logger.js";

const logger = getLogger('db-info');

export function getDatabaseInfo(dbPath: string): {
  path: string;
  mode: "development" | "production";
  exists: boolean;
  size?: number;
} {
  const isDev = isDevelopmentMode();
  const exists = fs.existsSync(dbPath);
  let size: number | undefined = undefined;
  if (exists) {
    try {
      const stats = fs.statSync(dbPath);
      size = stats.size;
    } catch (error) {
      // If we can't get stats (permissions, etc.), continue without size
      logger.warn(`Could not get database size for ${dbPath}`, error);
    }
  }
  return {
    path: dbPath,
    mode: isDev ? "development" : "production",
    exists,
    size,
  };
}
