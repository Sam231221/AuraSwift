/**
 * Auth Store API Types
 * 
 * Types for the secure storage API (electron-store based).
 * 
 * @module types/api/auth-store
 */

export interface AuthStoreAPI {
  set: (key: string, value: string) => Promise<void>;
  get: (key: string) => Promise<string | null>;
  delete: (key: string) => Promise<void>;
}
