/**
 * React hook for Viva Wallet settings management
 * Handles terminal configuration, discovery, and settings persistence
 */

import { useState, useEffect, useCallback } from "react";
import { toast } from "sonner";
import { getLogger } from "@/shared/utils/logger";

const logger = getLogger("use-viva-wallet-settings");

// =============================================================================
// TYPES
// =============================================================================

export interface TerminalConfig {
  id: string;
  name: string;
  ipAddress: string;
  port: number;
  apiKey: string;
  enabled: boolean;
  autoConnect: boolean;
  terminalType?: "dedicated" | "device-based";
  deviceInfo?: {
    platform?: "android" | "ios" | "paydroid";
    deviceModel?: string;
    osVersion?: string;
  };
  lastSeen?: Date;
}

export interface DiscoveredTerminal {
  id: string;
  name: string;
  ipAddress: string;
  port: number;
  status: "online" | "offline" | "busy";
  terminalType: "dedicated" | "device-based";
  paymentCapabilities: {
    supportsNFC: boolean;
    supportsCardReader: boolean;
    supportsChip: boolean;
    supportsSwipe: boolean;
    supportsTap: boolean;
  };
}

export interface VivaWalletConfig {
  enabled: boolean;
  terminals: TerminalConfig[];
  defaultTerminalId?: string;
  timeout: {
    connection: number;
    transaction: number;
    polling: number;
  };
  retry: {
    maxAttempts: number;
    backoffMultiplier: number;
    initialDelay: number;
  };
  network: {
    scanRange?: string;
    scanPort?: number;
    useMDNS?: boolean;
  };
}

// =============================================================================
// HOOK
// =============================================================================

export function useVivaWalletSettings() {
  const [enabled, setEnabled] = useState(false);
  const [terminals, setTerminals] = useState<TerminalConfig[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isDiscovering, setIsDiscovering] = useState(false);
  const [discoveredTerminals, setDiscoveredTerminals] = useState<
    DiscoveredTerminal[]
  >([]);
  const [isTestingConnection, setIsTestingConnection] = useState<string | null>(
    null
  );

  /**
   * Load configuration on mount
   */
  useEffect(() => {
    loadConfig();
  }, []);

  /**
   * Load configuration from backend
   */
  const loadConfig = useCallback(async () => {
    try {
      setIsLoading(true);
      if (!window.vivaWalletAPI) {
        logger.error("Viva Wallet API not available");
        return;
      }

      const result = await window.vivaWalletAPI.getConfig();
      if (result?.success && result.config) {
        const config = result.config as VivaWalletConfig;
        setEnabled(config.enabled ?? false);
        setTerminals(config.terminals ?? []);
      } else {
        // Use defaults
        setEnabled(false);
        setTerminals([]);
      }
    } catch (error) {
      logger.error("Failed to load Viva Wallet config:", error);
      toast.error("Failed to load Viva Wallet settings");
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Save configuration to backend
   */
  const saveSettings = useCallback(async () => {
    try {
      setIsSaving(true);
      if (!window.vivaWalletAPI) {
        throw new Error("Viva Wallet API not available");
      }

      // Convert terminals to match API type (ensure terminalType is not undefined)
      const terminalsForApi = terminals.map((t) => ({
        id: t.id,
        name: t.name,
        ipAddress: t.ipAddress,
        port: t.port,
        apiKey: t.apiKey,
        enabled: t.enabled,
        autoConnect: t.autoConnect,
        terminalType: (t.terminalType || "dedicated") as
          | "dedicated"
          | "device-based",
        deviceInfo: t.deviceInfo,
      }));

      const config = {
        enabled,
        terminals: terminalsForApi,
        defaultTerminalId: terminals.find((t) => t.autoConnect)?.id,
        timeout: {
          connection: 30000,
          transaction: 300000,
          polling: 2000,
        },
        retry: {
          maxAttempts: 3,
          backoffMultiplier: 2,
          initialDelay: 1000,
        },
        network: {
          scanRange: "192.168.1.0/24",
          scanPort: 8080,
          useMDNS: false,
        },
      };

      const result = await window.vivaWalletAPI.saveConfig(config);
      if (result?.success) {
        toast.success("Settings saved successfully");
        logger.info("Viva Wallet settings saved");
        return true;
      } else {
        // APIResponse uses 'message' not 'error'
        const errorMessage =
          (result as any).error || result.message || "Failed to save settings";
        throw new Error(errorMessage);
      }
    } catch (error) {
      logger.error("Failed to save Viva Wallet config:", error);
      toast.error(
        error instanceof Error ? error.message : "Failed to save settings"
      );
      return false;
    } finally {
      setIsSaving(false);
    }
  }, [enabled, terminals]);

  /**
   * Discover terminals on the network
   */
  const discoverTerminals = useCallback(async () => {
    setIsDiscovering(true);
    setDiscoveredTerminals([]);
    try {
      if (!window.vivaWalletAPI) {
        throw new Error("Viva Wallet API not available");
      }

      const result = await window.vivaWalletAPI.discoverTerminals();
      if (result?.success && result.terminals) {
        const discovered: DiscoveredTerminal[] = result.terminals.map(
          (t: any) => ({
            id: t.id || `temp-${Date.now()}-${Math.random()}`,
            name: t.name || `${t.ipAddress}:${t.port}`,
            ipAddress: t.ipAddress,
            port: t.port,
            status: t.status || "offline",
            terminalType: t.terminalType || "dedicated",
            paymentCapabilities: t.paymentCapabilities || {
              supportsNFC: false,
              supportsCardReader: false,
              supportsChip: false,
              supportsSwipe: false,
              supportsTap: false,
            },
          })
        );
        setDiscoveredTerminals(discovered);
        toast.success(`Discovered ${discovered.length} terminal(s)`);
        return discovered;
      } else {
        throw new Error(result?.error || "Failed to discover terminals");
      }
    } catch (error) {
      logger.error("Failed to discover terminals:", error);
      toast.error(
        error instanceof Error
          ? error.message
          : "Failed to discover terminals. Please check network connection."
      );
      return [];
    } finally {
      setIsDiscovering(false);
    }
  }, []);

  /**
   * Add a terminal to the configuration
   */
  const addTerminal = useCallback(
    (terminal: DiscoveredTerminal | Partial<TerminalConfig>) => {
      const newTerminal: TerminalConfig = {
        id: terminal.id || `terminal-${Date.now()}`,
        name: terminal.name || "New Terminal",
        ipAddress: terminal.ipAddress || "",
        port: terminal.port || 8080,
        apiKey: (terminal as TerminalConfig).apiKey || "",
        enabled: true,
        autoConnect: false,
        terminalType: terminal.terminalType,
        deviceInfo: (terminal as DiscoveredTerminal).paymentCapabilities
          ? undefined
          : (terminal as TerminalConfig).deviceInfo,
      };

      setTerminals((prev) => [...prev, newTerminal]);
      toast.success(`Added terminal: ${newTerminal.name}`);
      return newTerminal;
    },
    []
  );

  /**
   * Update an existing terminal
   */
  const updateTerminal = useCallback(
    (terminalId: string, updates: Partial<TerminalConfig>) => {
      setTerminals((prev) =>
        prev.map((t) => (t.id === terminalId ? { ...t, ...updates } : t))
      );
      toast.success("Terminal updated");
    },
    []
  );

  /**
   * Delete a terminal
   */
  const deleteTerminal = useCallback((terminalId: string) => {
    setTerminals((prev) => prev.filter((t) => t.id !== terminalId));
    toast.success("Terminal removed");
  }, []);

  /**
   * Test connection to a terminal
   */
  const testConnection = useCallback(
    async (terminalId: string) => {
      setIsTestingConnection(terminalId);
      try {
        if (!window.vivaWalletAPI) {
          throw new Error("Viva Wallet API not available");
        }

        // First, try to connect to the terminal
        const connectResult = await window.vivaWalletAPI.connectTerminal(
          terminalId
        );
        if (connectResult?.success) {
          // Then test the connection
          const testResult = await window.vivaWalletAPI.testConnection(
            terminalId
          );
          if (testResult?.success) {
            toast.success("Connection test successful");
            // Update terminal status
            updateTerminal(terminalId, {
              lastSeen: new Date(),
            });
            return true;
          } else {
            throw new Error(testResult?.error || "Connection test failed");
          }
        } else {
          throw new Error(
            connectResult?.error || "Failed to connect to terminal"
          );
        }
      } catch (error) {
        logger.error(
          `Failed to test connection for terminal ${terminalId}:`,
          error
        );
        toast.error(
          error instanceof Error ? error.message : "Connection test failed"
        );
        return false;
      } finally {
        setIsTestingConnection(null);
      }
    },
    [updateTerminal]
  );

  /**
   * Set enabled state
   */
  const setEnabledState = useCallback((value: boolean) => {
    setEnabled(value);
  }, []);

  return {
    enabled,
    terminals,
    isLoading,
    isSaving,
    isDiscovering,
    discoveredTerminals,
    isTestingConnection,
    setEnabled: setEnabledState,
    loadConfig,
    saveSettings,
    discoverTerminals,
    addTerminal,
    updateTerminal,
    deleteTerminal,
    testConnection,
  };
}
