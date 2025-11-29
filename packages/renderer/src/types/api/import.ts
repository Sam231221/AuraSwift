/**
 * Import API Types
 * 
 * Types for data import operations.
 * 
 * @module types/api/import
 */

export interface ImportProgress {
  stage: 'categories' | 'suppliers' | 'products' | 'complete';
  total: number;
  processed: number;
  succeeded: number;
  failed: number;
  currentItem?: string;
}

export interface ImportAPI {
  selectFile: (
    fileType?: 'department' | 'product'
  ) => Promise<{ success: boolean; filePath?: string; message?: string }>;
  parseFile: (filePath: string) => Promise<any>;
  validate: (data: any[], businessId: string) => Promise<any>;
  executeImport: (
    departmentData: any[],
    productData: any[],
    businessId: string,
    options: any
  ) => Promise<any>;
  importDepartments: (
    departmentData: any[],
    businessId: string,
    options?: any
  ) => Promise<any>;
  importProducts: (
    productData: any[],
    businessId: string,
    options?: any
  ) => Promise<any>;
  onProgress: (callback: (progress: ImportProgress) => void) => () => void;
}

