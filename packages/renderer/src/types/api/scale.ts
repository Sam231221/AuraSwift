/**
 * Scale API Types
 * 
 * Types for scale hardware integration operations.
 * 
 * @module types/api/scale
 */

export interface ScaleReading {
  weight: number;
  stable: boolean;
  unit: "g" | "kg" | "lb" | "oz";
  timestamp: string;
  rawReadings?: number[];
}

export interface ScaleAPI {
  discover: () => Promise<any>;
  connect: (config: any) => Promise<{ success: boolean; error?: string }>;
  disconnect: () => Promise<{ success: boolean; error?: string }>;
  getStatus: () => Promise<any>;
  tare: () => Promise<{ success: boolean; error?: string }>;
  startReading: () => void;
  stopReading: () => void;
  onReading: (callback: (reading: ScaleReading) => void) => () => void;
}

