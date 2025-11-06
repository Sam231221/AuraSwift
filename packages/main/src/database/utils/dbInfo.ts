import fs from "fs";
import { app } from "electron";

export function getDatabaseInfo(dbPath: string): {
  path: string;
  mode: "development" | "production";
  exists: boolean;
  size?: number;
} {
  const isDev =
    process.env.NODE_ENV === "development" ||
    process.env.ELECTRON_IS_DEV === "true" ||
    !app.isPackaged;
  const exists = fs.existsSync(dbPath);
  let size: number | undefined = undefined;
  if (exists) {
    const stats = fs.statSync(dbPath);
    size = stats.size;
  }
  return {
    path: dbPath,
    mode: isDev ? "development" : "production",
    exists,
    size,
  };
}
