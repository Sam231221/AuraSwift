/**
 * PDF Receipt API Types
 * 
 * Types for PDF receipt generation operations.
 * 
 * @module types/api/pdf-receipt
 */

export interface PdfReceiptAPI {
  generatePDF: (receiptData: Record<string, unknown>) => Promise<{
    success: boolean;
    data?: string;
    error?: string;
  }>;
}

