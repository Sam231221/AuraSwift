/**
 * Office Printer Types
 * 
 * Types for office/laser printer integration (HP, Canon, Epson, Brother, Dell, etc.).
 * 
 * @module types/features/printer/office
 */

export interface OfficePrinter {
  name: string;
  displayName: string;
  description?: string;
  driverName?: string;
  portName?: string;
  computerName?: string;
  location?: string;
  shared?: boolean;
  attributes?: string[];
  isDefault?: boolean;
  status?: string;
  priority?: number;
}

export interface PrintJobConfig {
  jobId: string;
  printerName: string;
  documentPath?: string; // Path to PDF or other printable file
  documentData?: Buffer; // Raw document data
  documentType: 'pdf' | 'image' | 'text' | 'raw';
  options?: OfficePrintOptions;
  metadata?: Record<string, unknown>;
  createdBy?: string;
  businessId?: string;
}

export interface OfficePrintOptions {
  copies?: number;
  color?: boolean;
  duplex?: 'simplex' | 'vertical' | 'horizontal';
  paperSize?: 'letter' | 'legal' | 'a4' | 'a3' | 'custom';
  orientation?: 'portrait' | 'landscape';
  quality?: OfficePrintQuality;
  collate?: boolean;
  pageRange?: string; // e.g., "1-5,8,10-12"
  scale?: number; // Percentage, e.g., 100
  fitToPage?: boolean;
}

export interface PrintJobStatus {
  jobId: string;
  status:
    | 'pending'
    | 'queued'
    | 'printing'
    | 'completed'
    | 'failed'
    | 'cancelled'
    | 'retrying';
  printerName: string;
  progress: number; // 0-100
  pagesTotal?: number;
  pagesPrinted?: number;
  error?: string;
  retryCount: number;
  maxRetries: number;
  createdAt: string;
  startedAt?: string;
  completedAt?: string;
  lastRetryAt?: string;
}

export interface PrinterHealth {
  printerName: string;
  isAvailable: boolean;
  status: OfficePrinterStatus;
  jobsInQueue: number;
  paperStatus?: 'ok' | 'low' | 'out' | 'jammed';
  tonerStatus?: string;
  lastChecked: string;
  errorMessage?: string;
}

export interface PrintMetrics {
  totalJobs: number;
  successfulJobs: number;
  failedJobs: number;
  retriedJobs: number;
  averagePrintTime: number;
}

export interface OfficePrinterAPI {
  // Printer Discovery
  list(): Promise<{
    success: boolean;
    printers: OfficePrinter[];
    error?: string;
  }>;

  getDefault(): Promise<{
    success: boolean;
    printer?: OfficePrinter;
    error?: string;
  }>;

  // Print Operations
  print(config: PrintJobConfig): Promise<{
    success: boolean;
    jobId: string;
    error?: string;
  }>;

  // Job Management
  getJobStatus(jobId: string): Promise<{
    success: boolean;
    status?: PrintJobStatus;
    error?: string;
  }>;

  cancel(jobId: string): Promise<{
    success: boolean;
    error?: string;
  }>;

  retry(jobId: string): Promise<{
    success: boolean;
    error?: string;
  }>;

  getFailedJobs(): Promise<{
    success: boolean;
    jobs: PrintJobStatus[];
    error?: string;
  }>;

  // Health & Monitoring
  getHealth(printerName: string): Promise<{
    success: boolean;
    health?: PrinterHealth;
    error?: string;
  }>;

  getMetrics(): Promise<PrintMetrics>;

  // Queue Management
  clearQueue(): Promise<{
    success: boolean;
    cleared: number;
  }>;
}

// Export utility types
export type PrintJobState =
  | 'pending'
  | 'queued'
  | 'printing'
  | 'completed'
  | 'failed'
  | 'cancelled'
  | 'retrying';

export type OfficePrinterStatus =
  | 'idle'
  | 'printing'
  | 'error'
  | 'offline'
  | 'paused';

export type PaperSize = 'letter' | 'legal' | 'a4' | 'a3' | 'custom';

export type OfficePrintQuality = 'draft' | 'normal' | 'high' | 'best';

export type DuplexMode = 'simplex' | 'vertical' | 'horizontal';

export type Orientation = 'portrait' | 'landscape';

// Utility function types
export interface PrinterSelection {
  printer: OfficePrinter;
  options: OfficePrintOptions;
}

export interface PrintJobResult {
  success: boolean;
  jobId?: string;
  error?: string;
  timestamp: string;
}
