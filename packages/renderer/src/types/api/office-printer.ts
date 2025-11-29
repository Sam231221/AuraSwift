/**
 * Office Printer API Types
 * 
 * Types for office printer operations.
 * 
 * @module types/api/office-printer
 */

export interface OfficePrinterAPI {
  list: () => Promise<any>;
  getDefault: () => Promise<any>;
  print: (config: {
    jobId: string;
    printerName: string;
    documentPath?: string;
    documentData?: Buffer;
    documentType: "pdf" | "image" | "text" | "raw";
    options?: any;
    metadata?: any;
    createdBy?: string;
    businessId?: string;
  }) => Promise<any>;
  getJobStatus: (jobId: string) => Promise<any>;
  cancel: (jobId: string) => Promise<any>;
  retry: (jobId: string) => Promise<any>;
  getFailedJobs: () => Promise<any>;
  getHealth: (printerName: string) => Promise<any>;
  getMetrics: () => Promise<any>;
  clearQueue: () => Promise<any>;
}

