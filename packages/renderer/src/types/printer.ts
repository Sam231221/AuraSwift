/**
 * Transaction and receipt types for thermal printer integration
 */

export interface TransactionItem {
  id: string;
  name: string;
  quantity: number;
  price: number;
  total: number;
  tax?: number;
  discount?: number;
  category?: string;
  sku?: string;
  barcode?: string;
}

export interface PaymentMethod {
  type: "cash" | "card" | "digital" | "other";
  amount: number;
  reference?: string;
  last4?: string;
  cardType?: string;
}

export interface TransactionData {
  id: string;
  timestamp: Date;
  cashierId: string;
  cashierName: string;
  businessId: string;
  businessName: string;
  items: TransactionItem[];
  subtotal: number;
  tax: number;
  discount: number;
  total: number;
  amountPaid: number;
  change: number;
  paymentMethods: PaymentMethod[];
  receiptNumber: string;
  customerInfo?: {
    id?: string;
    name?: string;
    email?: string;
    phone?: string;
  };
  notes?: string;
  refundedAmount?: number;
  isRefund?: boolean;
  originalTransactionId?: string;
}

export interface ReceiptConfig {
  businessName: string;
  businessAddress?: string;
  businessPhone?: string;
  businessEmail?: string;
  businessWebsite?: string;
  taxId?: string;
  receiptFooter?: string;
  showBusinessLogo?: boolean;
  paperWidth?: number; // in mm (58mm or 80mm)
  charactersPerLine?: number; // calculated based on paper width
}

export interface PrinterInterface {
  type: "usb" | "bluetooth" | "network";
  name: string;
  address: string;
  description?: string;
  isDefault?: boolean;
}

export interface PrinterConfig {
  type: string; // 'epson', 'star', 'generic'
  interface: string; // connection string
  width?: number; // paper width in mm
  characterSet?: string; // character encoding
  baudRate?: number; // for serial connections
  timeout?: number; // connection timeout in ms
}

export interface PrinterStatus {
  connected: boolean;
  interface: string;
  type: string;
  error?: string;
  paperStatus?: "ok" | "low" | "empty";
  temperature?: "normal" | "high";
  batteryLevel?: number; // for portable printers
  lastPrintTime?: Date;
}

export interface PrintJob {
  id: string;
  transactionId: string;
  data: TransactionData;
  timestamp: Date;
  status: "pending" | "printing" | "success" | "error" | "cancelled";
  retryCount: number;
  maxRetries: number;
  error?: string;
  estimatedPrintTime?: number; // in seconds
}

export interface PrintResult {
  success: boolean;
  jobId?: string;
  error?: string;
  printTime?: number;
}

export interface ReceiptTemplate {
  header: string[];
  showDate: boolean;
  showCashier: boolean;
  showCustomer: boolean;
  itemFormat: "detailed" | "simple";
  showTax: boolean;
  showDiscount: boolean;
  footer: string[];
  customFields?: Record<string, string>;
}

export type PrinterEvent =
  | { type: "connected"; interface: string }
  | { type: "disconnected"; reason?: string }
  | { type: "print_started"; jobId: string }
  | { type: "print_completed"; jobId: string; success: boolean }
  | { type: "paper_low" }
  | { type: "paper_empty" }
  | { type: "error"; message: string; code?: string };

export type PrintQuality = "draft" | "normal" | "high";

export interface PrintOptions {
  quality?: PrintQuality;
  copies?: number;
  cutPaper?: boolean;
  openDrawer?: boolean;
  playSound?: boolean;
  timeout?: number;
}

export interface ReceiptSection {
  type: "header" | "items" | "totals" | "payment" | "footer";
  content: string[];
  alignment?: "left" | "center" | "right";
  format?: "normal" | "bold" | "italic" | "underline";
}

export interface ESCPOSCommand {
  command: string;
  data?: string | number | Buffer;
  description?: string;
}

export interface PrinterCapabilities {
  supportsCutting: boolean;
  supportsDrawer: boolean;
  supportsBarcodes: boolean;
  supportsQRCodes: boolean;
  supportsImages: boolean;
  maxPaperWidth: number; // in mm
  supportedCharacterSets: string[];
  supportedBaudRates?: number[];
  hasDisplay?: boolean;
  batteryPowered?: boolean;
}

// Utility type for printer method results
export type PrinterMethodResult<T = void> = Promise<{
  success: boolean;
  data?: T;
  error?: string;
}>;

// Type guards
export const isTransactionData = (data: unknown): data is TransactionData => {
  return (
    typeof data === "object" &&
    data !== null &&
    typeof (data as Record<string, unknown>).id === "string" &&
    Array.isArray((data as Record<string, unknown>).items) &&
    typeof (data as Record<string, unknown>).total === "number"
  );
};

export const isPrintJob = (job: unknown): job is PrintJob => {
  return (
    typeof job === "object" &&
    job !== null &&
    typeof (job as Record<string, unknown>).id === "string" &&
    typeof (job as Record<string, unknown>).transactionId === "string" &&
    isTransactionData((job as Record<string, unknown>).data)
  );
};
