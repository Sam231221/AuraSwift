import { ipcRenderer } from 'electron';

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

export const importAPI = {
  /**
   * Select a CSV file using native file dialog
   */
  selectFile: (fileType: 'department' | 'product' = 'product') => 
    ipcRenderer.invoke('import:booker:selectFile', fileType),

  /**
   * Parse a CSV file and return preview data
   */
  parseFile: (filePath: string) => 
    ipcRenderer.invoke('import:booker:parseFile', filePath),

  /**
   * Validate parsed data before import
   */
  validate: (data: any[], businessId: string) =>
    ipcRenderer.invoke('import:booker:validate', data, businessId),

  /**
   * Execute full import (departments + products)
   */
  executeImport: (
    departmentData: any[], 
    productData: any[], 
    businessId: string,
    options: ImportOptions
  ): Promise<ImportResult> => 
    ipcRenderer.invoke('import:booker:execute', departmentData, productData, businessId, options),

  /**
   * Import department data only
   */
  importDepartments: (
    departmentData: any[],
    businessId: string,
    options?: Partial<ImportOptions>
  ): Promise<ImportResult> =>
    ipcRenderer.invoke('import:booker:department', departmentData, businessId, options || {}),

  /**
   * Import product data only
   */
  importProducts: (
    productData: any[],
    businessId: string,
    options?: Partial<ImportOptions>
  ): Promise<ImportResult> =>
    ipcRenderer.invoke('import:booker:product', productData, businessId, options || {}),

  /**
   * Subscribe to import progress updates
   */
  onProgress: (callback: (progress: ImportProgress) => void) => {
    const subscription = (_: any, progress: ImportProgress) => callback(progress);
    ipcRenderer.on('import:booker:progress', subscription);
    return () => ipcRenderer.removeListener('import:booker:progress', subscription);
  }
};
