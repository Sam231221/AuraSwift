/**
 * Scale Manager Hook
 * Manages scale hardware connection, reading, and state
 */

import { useState, useEffect, useCallback, useRef } from "react";
import { toast } from "sonner";

// =============================================================================
// TYPES
// =============================================================================

export interface ScaleDevice {
  id: string;
  type: "HID" | "SERIAL" | "TCP_IP";
  path?: string;
  vendorId?: number;
  productId?: number;
  manufacturer?: string;
  product?: string;
  serialNumber?: string;
  baudRate?: number;
  address?: string;
  port?: number;
}

export interface ScaleReading {
  weight: number; // in kg
  stable: boolean;
  unit: "g" | "kg" | "lb" | "oz";
  timestamp: string;
  rawReadings?: number[];
}

export interface ScaleStatus {
  connected: boolean;
  deviceType: string;
  connectionType: "HID" | "SERIAL" | "TCP_IP" | "none";
  deviceId?: string;
  lastReading?: ScaleReading;
  error?: string;
  isReading: boolean;
}

export interface ScaleConfig {
  tareWeight?: number;
  minWeight?: number;
  maxWeight?: number;
  stabilityThreshold?: number; // in grams
  stabilityReadings?: number;
  unit?: "g" | "kg" | "lb" | "oz";
  simulated?: boolean;
}

// =============================================================================
// HOOK
// =============================================================================

export function useScaleManager(config?: ScaleConfig) {
  const [scaleStatus, setScaleStatus] = useState<ScaleStatus>({
    connected: false,
    deviceType: "none",
    connectionType: "none",
    isReading: false,
  });
  const [availableScales, setAvailableScales] = useState<ScaleDevice[]>([]);
  const [currentReading, setCurrentReading] = useState<ScaleReading | null>(null);
  const [selectedScale, setSelectedScale] = useState<ScaleDevice | null>(null);
  const [isDiscovering, setIsDiscovering] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const readingListenerRef = useRef<(() => void) | null>(null);

  // Declare window type for scaleAPI
  declare global {
    interface Window {
      scaleAPI: {
        discover: () => Promise<{ success: boolean; devices: ScaleDevice[]; error?: string }>;
        connect: (config: { device: ScaleDevice } & ScaleConfig) => Promise<{ success: boolean; error?: string }>;
        disconnect: () => Promise<{ success: boolean; error?: string }>;
        getStatus: () => Promise<ScaleStatus>;
        tare: () => Promise<{ success: boolean; error?: string }>;
        startReading: () => void;
        stopReading: () => void;
        onReading: (callback: (reading: ScaleReading) => void) => () => void;
      };
    }
  }

  /**
   * Discover available scale devices
   */
  const discoverScales = useCallback(async () => {
    setIsDiscovering(true);
    try {
      const result = await window.scaleAPI.discover();
      if (result.success) {
        setAvailableScales(result.devices);
        if (result.devices.length === 0) {
          toast.info("No scales found. You can use simulated mode for testing.");
        }
        return result.devices;
      } else {
        toast.error(result.error || "Failed to discover scales");
        return [];
      }
    } catch (error) {
      console.error("Scale discovery error:", error);
      toast.error("Error discovering scales");
      return [];
    } finally {
      setIsDiscovering(false);
    }
  }, []);

  /**
   * Connect to a specific scale device
   */
  const connectToScale = useCallback(
    async (device: ScaleDevice, customConfig?: ScaleConfig) => {
      setIsConnecting(true);
      try {
        const connectConfig = {
          device,
          ...(customConfig || config || {}),
        };

        const result = await window.scaleAPI.connect(connectConfig);
        if (result.success) {
          setSelectedScale(device);
          setScaleStatus((prev) => ({
            ...prev,
            connected: true,
            deviceType: device.type,
            connectionType: device.type,
            deviceId: device.id,
            error: undefined,
          }));

          // Start reading
          window.scaleAPI.startReading();

          // Set up reading listener
          if (readingListenerRef.current) {
            readingListenerRef.current();
          }
          readingListenerRef.current = window.scaleAPI.onReading((reading) => {
            setCurrentReading(reading);
            setScaleStatus((prev) => ({
              ...prev,
              lastReading: reading,
              isReading: true,
            }));
          });

          toast.success(`Connected to ${device.manufacturer || device.product || "scale"}`);
          return true;
        } else {
          toast.error(result.error || "Failed to connect to scale");
          setScaleStatus((prev) => ({
            ...prev,
            error: result.error,
          }));
          return false;
        }
      } catch (error) {
        console.error("Scale connection error:", error);
        toast.error("Error connecting to scale");
        return false;
      } finally {
        setIsConnecting(false);
      }
    },
    [config]
  );

  /**
   * Disconnect from scale
   */
  const disconnectScale = useCallback(async () => {
    try {
      if (readingListenerRef.current) {
        readingListenerRef.current();
        readingListenerRef.current = null;
      }

      window.scaleAPI.stopReading();
      const result = await window.scaleAPI.disconnect();

      if (result.success) {
        setSelectedScale(null);
        setCurrentReading(null);
        setScaleStatus({
          connected: false,
          deviceType: "none",
          connectionType: "none",
          isReading: false,
        });
        toast.info("Scale disconnected");
      } else {
        toast.error(result.error || "Failed to disconnect scale");
      }
    } catch (error) {
      console.error("Scale disconnection error:", error);
      toast.error("Error disconnecting from scale");
    }
  }, []);

  /**
   * Tare scale (reset to zero)
   */
  const tareScale = useCallback(async () => {
    try {
      const result = await window.scaleAPI.tare();
      if (result.success) {
        setCurrentReading(null);
        toast.success("Scale tared");
      } else {
        toast.error(result.error || "Failed to tare scale");
      }
    } catch (error) {
      console.error("Scale tare error:", error);
      toast.error("Error taring scale");
    }
  }, []);

  /**
   * Reconnect to scale
   */
  const reconnectScale = useCallback(async () => {
    if (selectedScale) {
      await disconnectScale();
      await connectToScale(selectedScale);
    } else {
      // Try to discover and connect
      const devices = await discoverScales();
      if (devices.length > 0) {
        await connectToScale(devices[0]);
      }
    }
  }, [selectedScale, disconnectScale, connectToScale, discoverScales]);

  /**
   * Get current scale status
   */
  const refreshStatus = useCallback(async () => {
    try {
      const status = await window.scaleAPI.getStatus();
      setScaleStatus(status);
      if (status.lastReading) {
        setCurrentReading(status.lastReading);
      }
    } catch (error) {
      console.error("Error refreshing scale status:", error);
    }
  }, []);

  /**
   * Auto-discover and connect on mount (if enabled)
   */
  useEffect(() => {
    // Auto-discover scales on mount
    discoverScales();

    // Cleanup on unmount
    return () => {
      if (readingListenerRef.current) {
        readingListenerRef.current();
      }
      window.scaleAPI.stopReading();
    };
  }, [discoverScales]);

  /**
   * Periodic status refresh
   */
  useEffect(() => {
    if (scaleStatus.connected) {
      const interval = setInterval(() => {
        refreshStatus();
      }, 5000); // Refresh every 5 seconds

      return () => clearInterval(interval);
    }
  }, [scaleStatus.connected, refreshStatus]);

  return {
    // State
    scaleStatus,
    availableScales,
    currentReading,
    selectedScale,
    isDiscovering,
    isConnecting,

    // Actions
    discoverScales,
    connectToScale,
    disconnectScale,
    tareScale,
    reconnectScale,
    refreshStatus,

    // Computed
    isConnected: scaleStatus.connected,
    isReading: scaleStatus.isReading,
    hasWeight: currentReading ? currentReading.weight > 0 : false,
    isStable: currentReading?.stable || false,
  };
}

