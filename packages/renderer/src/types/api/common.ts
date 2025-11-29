/**
 * Common API Response Types
 * 
 * Shared response types used across all API modules.
 * 
 * @module types/api/common
 */

import type { User } from '../domain/user';
import type { Business } from '../domain/business';

export interface APIResponse {
  success: boolean;
  message: string;
  data?: unknown;
  token?: string;
  user?: User;
  users?: User[];
  business?: Business;
  errors?: string[];
}

export interface PaginatedAPIResponse<T> extends APIResponse {
  data: T[];
  pagination: {
    page: number;
    pageSize: number;
    totalItems: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
  };
}
