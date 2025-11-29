/**
 * Database API Types
 * 
 * Types for database management operations.
 * 
 * @module types/api/database
 */

import type { APIResponse } from './common';

export interface DatabaseAPI {
  getInfo: () => Promise<APIResponse>;
  backup: () => Promise<APIResponse>;
  empty: () => Promise<APIResponse>;
  import: () => Promise<APIResponse>;
}

