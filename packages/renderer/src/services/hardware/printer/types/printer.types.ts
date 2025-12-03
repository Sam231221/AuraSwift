/**
 * Printer Hardware Types
 */

export type PrintStatus =
  | "idle"
  | "printing"
  | "success"
  | "error"
  | "cancelled";

export interface PrinterInfo {
  connected: boolean;
  interface: string;
  type: string;
  error?: string;
}

export interface PrintJob {
  id: string;
  transactionId: string;
  data: any; // TransactionData
  timestamp: Date;
  status: PrintStatus;
  retryCount: number;
}

