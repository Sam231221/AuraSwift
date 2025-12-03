/**
 * Update API Type Definitions
 * Defines the interface for update-related IPC communication
 */

import type {
  UpdateInfo,
  DownloadProgress,
  UpdateError,
} from "@app/shared";

export interface UpdateAPI {
  /**
   * Listen for update available event
   */
  onUpdateAvailable: (callback: (info: UpdateInfo) => void) => void;

  /**
   * Listen for download progress updates
   */
  onDownloadProgress: (callback: (progress: DownloadProgress) => void) => void;

  /**
   * Listen for update downloaded event
   */
  onUpdateDownloaded: (callback: (info: UpdateInfo) => void) => void;

  /**
   * Listen for update errors
   */
  onUpdateError: (callback: (error: UpdateError) => void) => void;

  /**
   * Listen for manual check completion
   */
  onUpdateCheckComplete: (
    callback: (hasUpdate: boolean, version?: string) => void
  ) => void;

  /**
   * Listen for install request (from notification or external trigger)
   */
  onInstallRequest: (callback: () => void) => void;

  /**
   * Start downloading the update
   */
  downloadUpdate: () => Promise<void>;

  /**
   * Install the downloaded update (Cursor-style: immediate quit + silent install)
   */
  installUpdate: () => Promise<void>;

  /**
   * Postpone the update
   */
  postponeUpdate: () => Promise<void>;

  /**
   * Manually check for updates
   */
  checkForUpdates: () => Promise<{
    hasUpdate: boolean;
    version?: string;
  }>;

  /**
   * Dismiss error notification
   */
  dismissError: () => Promise<void>;

  /**
   * Remove all listeners for a specific channel
   */
  removeAllListeners: (channel: string) => void;
}

