/**
 * Configuration management for Viva Wallet service
 * Handles loading, saving, and validation of terminal configurations
 */

import { safeStorage } from "electron";
import { getLogger } from "../../utils/logger.js";
import { getDatabase } from "../../database/index.js";
import type { VivaWalletConfig, TerminalConfig } from "./types.js";

const logger = getLogger("VivaWalletConfig");

// =============================================================================
// CONFIGURATION MANAGER
// =============================================================================

export class VivaWalletConfigManager {
  private configCache: VivaWalletConfig | null = null;
  private readonly CONFIG_KEY = "viva_wallet_config";

  /**
   * Get default configuration
   */
  private getDefaultConfig(): VivaWalletConfig {
    return {
      enabled: false,
      terminals: [],
      timeout: {
        connection: 10000, // 10 seconds
        transaction: 300000, // 5 minutes
        polling: 2000, // 2 seconds
      },
      retry: {
        maxAttempts: 3,
        backoffMultiplier: 2,
        initialDelay: 1000,
      },
      network: {
        scanRange: undefined,
        scanPort: 8080,
        useMDNS: false,
      },
    };
  }

  /**
   * Load configuration from database
   */
  async loadConfig(): Promise<VivaWalletConfig> {
    if (this.configCache) {
      return this.configCache;
    }

    try {
      const db = await getDatabase();
      const configJson = db.settings.getSetting(this.CONFIG_KEY);

      if (!configJson) {
        logger.info("No Viva Wallet config found, using defaults");
        this.configCache = this.getDefaultConfig();
        return this.configCache;
      }

      const config: VivaWalletConfig = JSON.parse(configJson);

      // Decrypt API keys for terminals
      if (config.terminals) {
        for (const terminal of config.terminals) {
          if (terminal.apiKey) {
            terminal.apiKey = await this.decryptApiKey(terminal.apiKey);
          }
        }
      }

      // Merge with defaults to ensure all fields exist
      this.configCache = {
        ...this.getDefaultConfig(),
        ...config,
        timeout: {
          ...this.getDefaultConfig().timeout,
          ...config.timeout,
        },
        retry: {
          ...this.getDefaultConfig().retry,
          ...config.retry,
        },
        network: {
          ...this.getDefaultConfig().network,
          ...config.network,
        },
      };

      logger.info("Viva Wallet config loaded successfully");
      return this.configCache;
    } catch (error) {
      logger.error("Failed to load Viva Wallet config:", error);
      this.configCache = this.getDefaultConfig();
      return this.configCache;
    }
  }

  /**
   * Save configuration to database
   */
  async saveConfig(config: VivaWalletConfig): Promise<void> {
    try {
      const db = await getDatabase();

      // Create a copy for storage (with encrypted API keys)
      const configToSave: VivaWalletConfig = {
        ...config,
        terminals: await Promise.all(
          config.terminals.map(async (terminal) => {
            const terminalCopy = { ...terminal };
            if (terminalCopy.apiKey) {
              // Encrypt API key before saving
              terminalCopy.apiKey = await this.encryptApiKey(
                terminalCopy.apiKey
              );
            }
            return terminalCopy;
          })
        ),
      };

      // Save to database
      db.settings.setSetting(this.CONFIG_KEY, JSON.stringify(configToSave));

      // Update cache
      this.configCache = config;

      logger.info("Viva Wallet config saved successfully");
    } catch (error) {
      logger.error("Failed to save Viva Wallet config:", error);
      throw error;
    }
  }

  /**
   * Encrypt API key using Electron safe storage
   */
  private async encryptApiKey(key: string): Promise<string> {
    try {
      if (!safeStorage.isEncryptionAvailable()) {
        logger.warn(
          "Safe storage encryption not available, storing in plaintext"
        );
        // In production, this should throw an error
        // For now, store with a prefix to indicate it's unencrypted
        return `UNENCRYPTED:${key}`;
      }

      const encrypted = safeStorage.encryptString(key);
      // Store as base64 for JSON serialization
      return encrypted.toString("base64");
    } catch (error) {
      logger.error("Failed to encrypt API key:", error);
      throw new Error("Failed to encrypt API key");
    }
  }

  /**
   * Decrypt API key using Electron safe storage
   */
  private async decryptApiKey(encryptedKey: string): Promise<string> {
    try {
      // Check if it's unencrypted (development/fallback)
      if (encryptedKey.startsWith("UNENCRYPTED:")) {
        return encryptedKey.replace("UNENCRYPTED:", "");
      }

      if (!safeStorage.isEncryptionAvailable()) {
        logger.warn("Safe storage encryption not available");
        // Return as-is if encryption not available
        return encryptedKey;
      }

      // Convert from base64 back to buffer
      const buffer = Buffer.from(encryptedKey, "base64");
      return safeStorage.decryptString(buffer);
    } catch (error) {
      logger.error("Failed to decrypt API key:", error);
      throw new Error("Failed to decrypt API key");
    }
  }

  /**
   * Validate terminal configuration
   */
  validateTerminalConfig(config: TerminalConfig): {
    valid: boolean;
    errors: string[];
  } {
    const errors: string[] = [];

    // Validate IP address format
    const ipRegex =
      /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;
    if (!ipRegex.test(config.ipAddress)) {
      errors.push("Invalid IP address format");
    }

    // Validate port range
    if (config.port < 1 || config.port > 65535) {
      errors.push("Port must be between 1 and 65535");
    }

    // Validate API key
    if (!config.apiKey || config.apiKey.trim().length === 0) {
      errors.push("API key is required");
    }

    // Validate name
    if (!config.name || config.name.trim().length === 0) {
      errors.push("Terminal name is required");
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }

  /**
   * Clear configuration cache
   */
  clearCache(): void {
    this.configCache = null;
  }
}
