/**
 * Expiry Settings API Types
 * 
 * Types for expiry settings management operations.
 * 
 * @module types/api/expiry-settings
 */

import type { APIResponse } from './common';

export interface ExpirySettingsAPI {
  get: (businessId: string) => Promise<APIResponse>;
}

