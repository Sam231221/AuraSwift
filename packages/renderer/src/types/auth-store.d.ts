/**
 * @deprecated This file is deprecated. Use @/types/api instead.
 * @see /Users/admin/Documents/Developer/Electron/AuraSwift/packages/renderer/src/types/api
 * 
 * All API types have been extracted to organized modules in /types/api.
 * The Window interface is now defined in /shared/types/global.d.ts
 * which imports from the organized API modules.
 * 
 * Migration: Import API types from @/types/api:
 * ```typescript
 * import { AuthAPI, ProductAPI, CartAPI } from '@/types/api';
 * ```
 * 
 * This file will be removed in a future version.
 */

// Re-export from new location for backward compatibility
export * from './api';
