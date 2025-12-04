/**
 * React hook for Viva Wallet terminal operations
 * Handles terminal discovery, connection, and status monitoring
 */

import { useState, useEffect, useCallback } from "react";
import { toast } from "sonner";
import { getLogger } from "@/shared/utils/logger";

const logger = getLogger("use-viva-wallet");

// =============================================================================
// TYPES
// =============================================================================

export interface Terminal {
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

// =============================================================================
// HOOK
// =============================================================================

export function useVivaWallet() {
  const [terminals, setTerminals] = useState<Terminal[]>([]);
  const [selectedTerminal, setSelectedTerminal] = useState<Terminal | null>(null);
  const [isDiscovering, setIsDiscovering] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<
    "disconnected" | "connecting" | "connected"
  >("disconnected");

  /**
   * Discover terminals on the local network
   */
  const discoverTerminals = useCallback(async () => {
    setIsDiscovering(true);
    try {
      if (!window.vivaWalletAPI) {
        throw new Error("Viva Wallet API not available");
      }

      const result = await window.vivaWalletAPI.discoverTerminals();

      if (result.success && result.terminals) {
        setTerminals(result.terminals);
        logger.info(`Discovered ${result.terminals.length} terminal(s)`);
        return result.terminals;
      } else {
        throw new Error(result.error || "Failed to discover terminals");
      }
    } catch (error) {
      logger.error("Failed to discover terminals:", error);
      toast.error("Failed to discover terminals. Please check network connection.");
      return [];
    } finally {
      setIsDiscovering(false);
    }
  }, []);

  /**
   * Connect to a specific terminal
   */
  const connectTerminal = useCallback(
    async (terminalId: string) => {
      setIsConnecting(true);
      setConnectionStatus("connecting");

      try {
        if (!window.vivaWalletAPI) {
          throw new Error("Viva Wallet API not available");
        }

        const result = await window.vivaWalletAPI.connectTerminal(terminalId);

        if (result.success && result.terminal) {
          const terminal: Terminal = {
            id: result.terminal.id,
            name: result.terminal.name,
            ipAddress: result.terminal.ipAddress,
            port: result.terminal.port,
            status: result.terminal.status || "online",
            terminalType: result.terminal.terminalType || "dedicated",
            paymentCapabilities: result.terminal.paymentCapabilities || {
              supportsNFC: false,
              supportsCardReader: false,
              supportsChip: false,
              supportsSwipe: false,
              supportsTap: false,
            },
          };
          setSelectedTerminal(terminal);
          setConnectionStatus("connected");
          toast.success(`Connected to ${terminal.name}`);
          logger.info(`Connected to terminal: ${terminal.name}`);
          return true;
        } else {
          throw new Error(result.error || "Failed to connect to terminal");
        }
      } catch (error) {
        logger.error("Failed to connect to terminal:", error);
        setConnectionStatus("disconnected");
        const errorMessage =
          error instanceof Error ? error.message : "Failed to connect to terminal";
        toast.error(errorMessage);
        return false;
      } finally {
        setIsConnecting(false);
      }
    },
    []
  );

  /**
   * Disconnect from the current terminal
   */
  const disconnectTerminal = useCallback(async () => {
    try {
      if (!window.vivaWalletAPI) {
        return;
      }

      await window.vivaWalletAPI.disconnectTerminal();
      setSelectedTerminal(null);
      setConnectionStatus("disconnected");
      logger.info("Disconnected from terminal");
    } catch (error) {
      logger.error("Failed to disconnect terminal:", error);
    }
  }, []);

  /**
   * Refresh terminal status
   */
  const refreshTerminalStatus = useCallback(async () => {
    if (!selectedTerminal) return;

    try {
      const result = await window.vivaWalletAPI?.getTerminalStatus();
      if (result?.success && result?.terminal) {
        const terminalStatus = result.terminal.status;
        // Update terminal in list
        setTerminals((prev) =>
          prev.map((t) =>
            t.id === selectedTerminal.id
              ? {
                  ...t,
                  status: terminalStatus || t.status,
                }
              : t
          )
        );
        // Update selected terminal
        setSelectedTerminal((prev) =>
          prev
            ? {
                ...prev,
                status: terminalStatus || prev.status,
              }
            : null
        );
      }
    } catch (error) {
      logger.error("Failed to get terminal status:", error);
    }
  }, [selectedTerminal]);

  /**
   * Auto-refresh terminal status periodically
   */
  useEffect(() => {
    if (!selectedTerminal || connectionStatus !== "connected") return;

    const interval = setInterval(() => {
      refreshTerminalStatus();
    }, 10000); // Refresh every 10 seconds

    return () => clearInterval(interval);
  }, [selectedTerminal, connectionStatus, refreshTerminalStatus]);

  /**
   * Load saved terminal configuration on mount
   */
  useEffect(() => {
    const loadConfig = async () => {
      try {
        if (!window.vivaWalletAPI) return;

        const configResult = await window.vivaWalletAPI.getConfig();
        if (configResult?.success && configResult.config) {
          const config = configResult.config;
          // Load terminals from config
          if (config.terminals && config.terminals.length > 0) {
            const configuredTerminals: Terminal[] = config.terminals.map((t: any) => ({
              id: t.id,
              name: t.name,
              ipAddress: t.ipAddress,
              port: t.port,
              status: "offline" as const, // Will be updated by status check
              terminalType: t.terminalType || "dedicated",
              paymentCapabilities: {
                supportsNFC: false,
                supportsCardReader: false,
                supportsChip: false,
                supportsSwipe: false,
                supportsTap: false,
              },
            }));
            setTerminals(configuredTerminals);

            // Auto-connect to default terminal if configured
            if (config.defaultTerminalId) {
              const defaultTerminal = configuredTerminals.find(
                (t) => t.id === config.defaultTerminalId
              );
              if (defaultTerminal) {
                await connectTerminal(defaultTerminal.id);
              }
            }
          }
        }
      } catch (error) {
        logger.error("Failed to load Viva Wallet config:", error);
      }
    };

    loadConfig();
  }, [connectTerminal]);

  return {
    terminals,
    selectedTerminal,
    isDiscovering,
    isConnecting,
    connectionStatus,
    discoverTerminals,
    connectTerminal,
    disconnectTerminal,
    setSelectedTerminal,
    refreshTerminalStatus,
  };
}

