/**
 * Terminal Discovery for Viva Wallet terminals
 * Supports network scanning and capability detection
 */

import { getLogger } from "../../utils/logger.js";
import { VivaWalletHTTPClient } from "./http-client.js";
import { NetworkScanner } from "./network-scanner.js";
import { TerminalCache } from "./terminal-cache.js";
import { VivaWalletConfigManager } from "./config.js";
import type {
  Terminal,
  TerminalCapabilities,
  TerminalStatusResponse,
} from "./types.js";

const logger = getLogger("TerminalDiscovery");

// =============================================================================
// TERMINAL DISCOVERY
// =============================================================================

export class TerminalDiscovery {
  private networkScanner: NetworkScanner;
  private terminalCache: TerminalCache;
  private configManager: VivaWalletConfigManager;

  constructor() {
    this.networkScanner = new NetworkScanner();
    this.terminalCache = new TerminalCache();
    this.configManager = new VivaWalletConfigManager();
  }

  /**
   * Discover Viva Wallet terminals on local network
   * Uses network scanning or mDNS/Bonjour
   * Supports both dedicated terminals and device-based terminals
   */
  async discoverTerminals(): Promise<Terminal[]> {
    logger.info("Starting terminal discovery...");
    const terminals: Terminal[] = [];

    try {
      // Clear expired terminals from cache
      this.terminalCache.clearExpired();

      // Load configuration to get scan settings
      const config = await this.configManager.loadConfig();

      // Get cached terminals first
      const cachedTerminals = this.terminalCache.getAll();
      terminals.push(...cachedTerminals);
      logger.debug(`Found ${cachedTerminals.length} terminal(s) in cache`);

      // Perform network scan if enabled
      if (config.network?.scanRange) {
        const scanRange = config.network.scanRange;
        const ports = config.network.scanPort
          ? [config.network.scanPort]
          : undefined;

        logger.info(`Scanning network range: ${scanRange}`);

        const discoveredTerminals = await this.networkScanner.scanIPRange(
          scanRange,
          ports,
          (progress) => {
            logger.debug(
              `Scan progress: ${progress.percentage.toFixed(1)}% (${
                progress.scanned
              }/${progress.total}) - Found: ${progress.terminalsFound}`
            );
          }
        );

        // Cache discovered terminals
        for (const terminal of discoveredTerminals) {
          if (!this.terminalCache.has(terminal.id)) {
            this.terminalCache.set(terminal, 60 * 60 * 1000); // 1 hour TTL
            terminals.push(terminal);
          }
        }

        logger.info(
          `Network scan found ${discoveredTerminals.length} terminal(s)`
        );
      } else {
        // Try to auto-detect local network range
        const localRange = await this.networkScanner.getLocalNetworkRange();
        if (localRange) {
          logger.info(`Auto-detected network range: ${localRange}`);
          const discoveredTerminals = await this.networkScanner.scanIPRange(
            localRange
          );

          for (const terminal of discoveredTerminals) {
            if (!this.terminalCache.has(terminal.id)) {
              this.terminalCache.set(terminal, 60 * 60 * 1000);
              terminals.push(terminal);
            }
          }
        }
      }

      // Load configured terminals from settings
      const configuredTerminals = config.terminals
        .filter((t) => t.enabled)
        .map((t) => this.terminalConfigToTerminal(t));

      for (const terminal of configuredTerminals) {
        // Check if already in discovered list
        const existing = terminals.find((t) => t.id === terminal.id);
        if (!existing) {
          terminals.push(terminal);
        }
      }

      // Detect capabilities for all terminals
      for (const terminal of terminals) {
        try {
          const capabilities = await this.detectTerminalCapabilities(terminal);
          terminal.paymentCapabilities = {
            supportsNFC: capabilities.nfcEnabled,
            supportsCardReader: capabilities.hasCardReader,
            supportsChip: capabilities.supportedPaymentMethods.includes("chip"),
            supportsSwipe:
              capabilities.supportedPaymentMethods.includes("swipe"),
            supportsTap: capabilities.supportedPaymentMethods.includes("tap"),
          };
          terminal.terminalType = capabilities.isDeviceBased
            ? "device-based"
            : "dedicated";
        } catch (error) {
          logger.warn(
            `Failed to detect capabilities for ${terminal.id}:`,
            error
          );
        }
      }
    } catch (error) {
      logger.error("Terminal discovery failed:", error);
    }

    logger.info(
      `Terminal discovery complete. Found ${terminals.length} terminal(s)`
    );
    return terminals;
  }

  /**
   * Convert TerminalConfig to Terminal
   */
  private terminalConfigToTerminal(config: {
    id: string;
    name: string;
    ipAddress: string;
    port: number;
    terminalType?: "dedicated" | "device-based";
    deviceInfo?: {
      platform?: "android" | "ios" | "paydroid";
      deviceModel?: string;
      osVersion?: string;
    };
  }): Terminal {
    return {
      id: config.id,
      name: config.name,
      ipAddress: config.ipAddress,
      port: config.port,
      status: "offline",
      capabilities: [],
      lastSeen: new Date(),
      connectionType: "wifi",
      terminalType: config.terminalType || "dedicated",
      deviceInfo: config.deviceInfo
        ? {
            platform: config.deviceInfo.platform || "android",
            deviceModel: config.deviceInfo.deviceModel,
            osVersion: config.deviceInfo.osVersion,
          }
        : undefined,
      paymentCapabilities: {
        supportsNFC: false,
        supportsCardReader: false,
        supportsChip: false,
        supportsSwipe: false,
        supportsTap: false,
      },
    };
  }

  /**
   * Verify terminal connectivity
   */
  async verifyConnection(terminal: Terminal): Promise<boolean> {
    try {
      const httpClient = new VivaWalletHTTPClient(terminal);
      const health = await httpClient.healthCheck({ timeout: 5000 });
      return health.success;
    } catch (error) {
      logger.error(
        `Failed to verify connection to terminal ${terminal.id}:`,
        error
      );
      return false;
    }
  }

  /**
   * Detect terminal type and capabilities
   * Identifies if terminal is device-based or dedicated hardware
   */
  async detectTerminalCapabilities(
    terminal: Terminal
  ): Promise<TerminalCapabilities> {
    try {
      const httpClient = new VivaWalletHTTPClient(terminal);
      const statusResponse = await httpClient.get<TerminalStatusResponse>(
        "/api/status"
      );

      return {
        isDeviceBased: this.isDeviceBased(statusResponse),
        deviceType: this.detectDeviceType(statusResponse),
        hasCardReader: statusResponse.hasCardReader || false,
        supportedPaymentMethods: this.parsePaymentMethods(statusResponse),
        nfcEnabled: statusResponse.nfcEnabled || false,
      };
    } catch (error) {
      logger.warn(
        `Failed to detect capabilities for terminal ${terminal.id}:`,
        error
      );
      return this.getDefaultCapabilities();
    }
  }

  private isDeviceBased(status: TerminalStatusResponse): boolean {
    // Check user agent, device info, or specific headers
    return status.deviceType === "mobile" || status.platform !== undefined;
  }

  private detectDeviceType(
    status: TerminalStatusResponse
  ): "android" | "ios" | "paydroid" | undefined {
    // Parse platform information
    if (status.platform) {
      const platformLower = status.platform.toLowerCase();
      if (platformLower.includes("android")) {
        // Check if it's Paydroid
        if (
          platformLower.includes("paydroid") ||
          status.deviceType === "paydroid"
        ) {
          return "paydroid";
        }
        return "android";
      }
      if (platformLower.includes("ios")) {
        return "ios";
      }
    }
    return undefined;
  }

  private parsePaymentMethods(
    status: TerminalStatusResponse
  ): ("tap" | "chip" | "swipe")[] {
    const methods: ("tap" | "chip" | "swipe")[] = [];

    if (status.capabilities) {
      if (status.capabilities.includes("tap") || status.nfcEnabled) {
        methods.push("tap");
      }
      if (status.capabilities.includes("chip")) {
        methods.push("chip");
      }
      if (status.capabilities.includes("swipe")) {
        methods.push("swipe");
      }
    }

    return methods;
  }

  private getDefaultCapabilities(): TerminalCapabilities {
    return {
      isDeviceBased: false,
      hasCardReader: false,
      supportedPaymentMethods: [],
      nfcEnabled: false,
    };
  }
}
