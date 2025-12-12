/**
 * Seed API Type Definitions
 */

export type SeedPreset = "minimal" | "small" | "medium" | "large" | "xlarge";

export interface SeedConfig {
  categories: number;
  products: number;
  batchSize?: number;
  clearExisting?: boolean;
}

export interface SeedResponse {
  success: boolean;
  message: string;
  error?: string;
}

export interface SeedAPI {
  /**
   * Seed categories and products with a preset configuration
   * @param preset - "minimal", "small", "medium", "large", or "xlarge"
   * @returns Promise with success status and message
   */
  runPreset: (preset: SeedPreset) => Promise<SeedResponse>;

  /**
   * Seed with custom configuration
   * @param config - Custom seed configuration
   * @returns Promise with success status and message
   */
  runCustom: (config: SeedConfig) => Promise<SeedResponse>;
}

declare global {
  interface Window {
    seedAPI: SeedAPI;
  }
}
