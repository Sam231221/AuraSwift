/**
 * Type definitions for update system
 * Shared between main and renderer processes
 */

export interface UpdateInfo {
  version: string;
  releaseDate: string;
  releaseNotes?: string | string[];
  files?: Array<{
    url: string;
    sha512: string;
    size: number;
  }>;
}

export interface DownloadProgress {
  percent: number;
  transferred: number;
  total: number;
  bytesPerSecond: number;
}

export type UpdateState =
  | "idle"
  | "checking"
  | "available"
  | "downloading"
  | "downloaded"
  | "error"
  | "installing";

export interface UpdateError {
  message: string;
  type: "check" | "download" | "install";
  timestamp: Date;
}

export interface UpdateContextValue {
  state: UpdateState;
  updateInfo: UpdateInfo | null;
  progress: DownloadProgress | null;
  error: UpdateError | null;
  currentVersion: string;
  postponeCount: number;

  // Actions
  downloadUpdate: () => Promise<void>;
  installUpdate: () => Promise<void>;
  postponeUpdate: () => void;
  checkForUpdates: () => Promise<void>;
  dismissError: () => void;
}
