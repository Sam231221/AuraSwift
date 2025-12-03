/**
 * Scale Hardware Types
 */

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

