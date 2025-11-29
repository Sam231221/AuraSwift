/**
 * Import API Types - Preload
 * 
 * Type definitions for data import IPC APIs.
 * 
 * @module preload/types/api/import
 */

export interface ImportProgress {
  stage: 'categories' | 'suppliers' | 'products' | 'complete';
  total: number;
  processed: number;
  succeeded: number;
  failed: number;
  currentItem?: string;
}

export interface ImportResult {
  success: boolean;
  categoriesCreated: number;
  categoriesUpdated: number;
  vatCategoriesCreated: number;
  suppliersCreated: number;
  suppliersUpdated: number;
  productsCreated: number;
  productsUpdated: number;
  productsSkipped: number;
  batchesCreated: number;
  errors: Array<{
    row?: number;
    item?: string;
    field?: string;
    message: string;
    code: string;
  }>;
  warnings: string[];
  duration: number;
}

export interface ImportOptions {
  onDuplicateSku?: 'skip' | 'update' | 'error';
  onDuplicateBarcode?: 'skip' | 'update' | 'error';
  createMissingCategories?: boolean;
  updateStockLevels?: boolean;
  stockUpdateMode?: 'replace' | 'add';
  mapVatFromPercentage?: boolean;
  defaultVatCategoryId?: string;
  batchSize?: number;
  defaultExpiryDays?: number;
}

export interface ImportAPIPreload {
  selectFile: (fileType?: 'department' | 'product') => Promise<{ success: boolean; filePath?: string; message?: string }>;

  parseFile: (filePath: string) => Promise<any>;

  validate: (data: any[], businessId: string) => Promise<any>;

  executeImport: (
    departmentData: any[],
    productData: any[],
    businessId: string,
    options: ImportOptions
  ) => Promise<ImportResult>;

  importDepartments: (
    departmentData: any[],
    businessId: string,
    options?: Partial<ImportOptions>
  ) => Promise<ImportResult>;

  importProducts: (
    productData: any[],
    businessId: string,
    options?: Partial<ImportOptions>
  ) => Promise<ImportResult>;

  onProgress: (callback: (progress: ImportProgress) => void) => () => void;
}

