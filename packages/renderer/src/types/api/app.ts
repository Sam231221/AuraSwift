/**
 * App API Types
 * 
 * Types for application-level operations.
 * 
 * @module types/api/app
 */

export interface AppAPI {
  restart: () => Promise<{ success: boolean; message?: string }>;
}

