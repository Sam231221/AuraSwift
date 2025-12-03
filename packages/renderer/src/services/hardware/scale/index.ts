/**
 * Scale Hardware Service
 *
 * Hardware integration for scale devices.
 * Provides hooks for scale connection, reading, and weight management.
 */

export { useScaleManager } from "./hooks/use-scale-manager";
export type {
  ScaleDevice,
  ScaleReading,
  ScaleStatus,
  ScaleConfig,
} from "./types/scale.types";

