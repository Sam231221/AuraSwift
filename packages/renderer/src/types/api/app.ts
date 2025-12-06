/**
 * App API Types
 *
 * Types for application-level operations.
 *
 * @module types/api/app
 */

export interface AppAPI {
  getVersion: () => Promise<{
    success: boolean;
    version: string;
    error?: string;
  }>;
  restart: () => Promise<{ success: boolean; message?: string }>;
  quit: () => Promise<{ success: boolean; message?: string }>;
}
