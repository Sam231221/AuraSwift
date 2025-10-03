/**
 * Thermal Printer Service for Electron Main Process
 * Handles thermal receipt printing with ESC/POS commands and IPC communication
 */

import { ipcMain } from "electron";

// We'll import the printer module dynamically when needed
let printerModuleCache: any = null;

// Printer interfaces type
interface PrinterInterface {
  type: "usb" | "bluetooth";
  name: string;
  address: string;
}

// Transaction data type (simplified for main process)
interface TransactionData {
  id: string;
  timestamp: Date;
  cashierName: string;
  businessName: string;
  items: Array<{
    name: string;
    quantity: number;
    price: number;
    total: number;
  }>;
  subtotal: number;
  tax: number;
  total: number;
  amountPaid: number;
  change: number;
  receiptNumber: string;
}

// Printer configuration type
interface PrinterConfig {
  type: string;
  interface: string;
  width?: number;
  characterSet?: string;
}

class ThermalPrinterService {
  private printer: any | null = null;
  private isConnected = false;
  private currentConfig: PrinterConfig | null = null;
  private printQueue: Array<{ id: string; data: any; timestamp: Date }> = [];
  private isProcessingQueue = false;

  constructor() {
    this.setupIPCHandlers();
  }

  /**
   * Set up IPC handlers for renderer communication
   */
  private setupIPCHandlers() {
    // Get printer status
    ipcMain.handle("printer:getStatus", async () => {
      return {
        connected: this.isConnected,
        interface: this.currentConfig?.interface || "",
        type: this.currentConfig?.type || "",
        error: undefined,
      };
    });

    // Connect to printer
    ipcMain.handle("printer:connect", async (event, config: PrinterConfig) => {
      try {
        return await this.connectPrinter(config);
      } catch (error) {
        return {
          success: false,
          error: error instanceof Error ? error.message : "Connection failed",
        };
      }
    });

    // Disconnect printer
    ipcMain.handle("printer:disconnect", async () => {
      try {
        await this.disconnectPrinter();
        return { success: true };
      } catch (error) {
        return {
          success: false,
          error: error instanceof Error ? error.message : "Disconnect failed",
        };
      }
    });

    // Print receipt
    ipcMain.handle(
      "printer:printReceipt",
      async (event, transactionData: TransactionData) => {
        try {
          return await this.printReceipt(transactionData);
        } catch (error) {
          return {
            success: false,
            error: error instanceof Error ? error.message : "Print failed",
          };
        }
      }
    );

    // Cancel print job
    ipcMain.handle("printer:cancelPrint", async () => {
      try {
        this.clearQueue();
        return { success: true };
      } catch (error) {
        return {
          success: false,
          error: error instanceof Error ? error.message : "Cancel failed",
        };
      }
    });

    // Get available printer interfaces
    ipcMain.handle("printer:getAvailableInterfaces", async () => {
      try {
        return await this.scanForPrinters();
      } catch (error) {
        console.error("Failed to scan for printers:", error);
        return [];
      }
    });
  }

  /**
   * Connect to thermal printer
   */
  private async connectPrinter(
    config: PrinterConfig
  ): Promise<{ success: boolean; error?: string }> {
    try {
      // Mock implementation for now - will be replaced with actual printer integration
      console.log(
        `Mock: Attempting to connect to printer at ${config.interface}`
      );

      // Disconnect existing connection
      if (this.printer) {
        await this.disconnectPrinter();
      }

      // Simulate connection delay
      await new Promise((resolve) => setTimeout(resolve, 1000));

      // Create mock printer instance
      this.printer = { mock: true };

      // Mock connection test
      const isConnected = true;
      if (!isConnected) {
        throw new Error(`Cannot connect to printer at ${config.interface}`);
      }

      this.isConnected = true;
      this.currentConfig = config;

      console.log(`Thermal printer connected: ${config.interface}`);
      return { success: true };
    } catch (error) {
      this.printer = null;
      this.isConnected = false;
      this.currentConfig = null;

      console.error("Printer connection failed:", error);
      return {
        success: false,
        error:
          error instanceof Error ? error.message : "Unknown connection error",
      };
    }
  }

  /**
   * Disconnect from printer
   */
  private async disconnectPrinter(): Promise<void> {
    if (this.printer) {
      try {
        await this.printer.clear();
      } catch (error) {
        console.error("Error clearing printer:", error);
      }
    }

    this.printer = null;
    this.isConnected = false;
    this.currentConfig = null;
    this.clearQueue();

    console.log("Thermal printer disconnected");
  }

  /**
   * Print receipt with transaction data
   */
  private async printReceipt(
    transactionData: TransactionData
  ): Promise<{ success: boolean; error?: string }> {
    if (!this.printer || !this.isConnected) {
      return {
        success: false,
        error: "Printer not connected",
      };
    }

    try {
      // Add to queue
      const jobId = `job_${Date.now()}_${Math.random()
        .toString(36)
        .substr(2, 9)}`;
      this.printQueue.push({
        id: jobId,
        data: transactionData,
        timestamp: new Date(),
      });

      // Process queue if not already processing
      if (!this.isProcessingQueue) {
        await this.processQueue();
      }

      return { success: true };
    } catch (error) {
      console.error("Print receipt failed:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Print failed",
      };
    }
  }

  /**
   * Process print queue
   */
  private async processQueue(): Promise<void> {
    if (this.isProcessingQueue || this.printQueue.length === 0) {
      return;
    }

    this.isProcessingQueue = true;

    try {
      while (this.printQueue.length > 0) {
        const job = this.printQueue.shift();
        if (!job || !this.printer) break;

        await this.executePrintJob(job.data);

        // Small delay between jobs
        await new Promise((resolve) => setTimeout(resolve, 100));
      }
    } catch (error) {
      console.error("Queue processing error:", error);
    } finally {
      this.isProcessingQueue = false;
    }
  }

  /**
   * Execute individual print job
   */
  private async executePrintJob(
    transactionData: TransactionData
  ): Promise<void> {
    if (!this.printer) {
      throw new Error("Printer not available");
    }

    try {
      // Clear any previous content
      this.printer.clear();

      // Format and print receipt
      await this.formatReceipt(transactionData);

      // Send to printer
      await this.printer.execute();

      console.log(
        `Receipt printed successfully for transaction ${transactionData.id}`
      );
    } catch (error) {
      console.error("Print job execution failed:", error);
      throw error;
    }
  }

  /**
   * Format receipt content for thermal printer
   */
  private async formatReceipt(transaction: TransactionData): Promise<void> {
    if (!this.printer) return;

    const printer = this.printer;

    // Header
    printer.alignCenter();
    printer.bold(true);
    printer.println(transaction.businessName || "RECEIPT");
    printer.bold(false);
    printer.println("================================");

    // Transaction info
    printer.alignLeft();
    printer.println(`Receipt #: ${transaction.receiptNumber}`);
    printer.println(
      `Date: ${new Date(transaction.timestamp).toLocaleString()}`
    );
    printer.println(`Cashier: ${transaction.cashierName}`);
    printer.println("--------------------------------");

    // Items
    printer.bold(true);
    printer.println("ITEMS");
    printer.bold(false);
    printer.println("--------------------------------");

    for (const item of transaction.items) {
      const itemLine = this.formatItemLine(
        item.name,
        item.quantity,
        item.price
      );
      printer.println(itemLine.name);
      printer.println(itemLine.details);
    }

    printer.println("--------------------------------");

    // Totals
    printer.println(this.formatMoneyLine("Subtotal:", transaction.subtotal));

    if (transaction.tax > 0) {
      printer.println(this.formatMoneyLine("Tax:", transaction.tax));
    }

    printer.bold(true);
    printer.println(this.formatMoneyLine("TOTAL:", transaction.total));
    printer.bold(false);

    printer.println(this.formatMoneyLine("Paid:", transaction.amountPaid));

    if (transaction.change > 0) {
      printer.println(this.formatMoneyLine("Change:", transaction.change));
    }

    // Footer
    printer.println("");
    printer.alignCenter();
    printer.println("Thank you for your business!");
    printer.println("");

    // Cut paper (if supported)
    try {
      printer.cut();
    } catch (error) {
      console.log("Paper cut not supported on this printer");
    }
  }

  /**
   * Format item line for receipt
   */
  private formatItemLine(
    name: string,
    quantity: number,
    price: number
  ): { name: string; details: string } {
    const maxNameLength = 28;
    const truncatedName =
      name.length > maxNameLength
        ? name.substring(0, maxNameLength - 3) + "..."
        : name;

    const details = `  ${quantity} x $${price.toFixed(2)} = $${(
      quantity * price
    ).toFixed(2)}`;

    return {
      name: truncatedName,
      details: details,
    };
  }

  /**
   * Format money line (label and amount)
   */
  private formatMoneyLine(label: string, amount: number): string {
    const maxLength = 32;
    const amountStr = `$${amount.toFixed(2)}`;
    const spaces = maxLength - label.length - amountStr.length;
    return `${label}${" ".repeat(Math.max(0, spaces))}${amountStr}`;
  }

  /**
   * Map printer type string to enum
   */
  private mapPrinterType(type: string): string {
    switch (type.toLowerCase()) {
      case "star":
        return "STAR";
      case "epson":
      case "dieri":
      case "generic":
      default:
        return "EPSON";
    }
  }

  /**
   * Scan for available printer interfaces
   */
  private async scanForPrinters(): Promise<PrinterInterface[]> {
    const interfaces: PrinterInterface[] = [];

    try {
      // Add some common USB interfaces
      interfaces.push({
        type: "usb",
        name: "Generic USB Thermal Printer",
        address: "usb:0x04b8:0x0202", // Common Epson USB
      });

      // Add some common Bluetooth interfaces (this would need actual BT scanning)
      interfaces.push({
        type: "bluetooth",
        name: "DIERI BT Thermal Printer",
        address: "BT:00:11:22:33:44:55",
      });

      // In a real implementation, you would scan for actual devices
      // For now, we return some common interface patterns
    } catch (error) {
      console.error("Error scanning for printers:", error);
    }

    return interfaces;
  }

  /**
   * Clear print queue
   */
  private clearQueue(): void {
    this.printQueue = [];
    this.isProcessingQueue = false;
  }

  /**
   * Get current queue status
   */
  public getQueueStatus(): { length: number; processing: boolean } {
    return {
      length: this.printQueue.length,
      processing: this.isProcessingQueue,
    };
  }
}

// Initialize the thermal printer service
const thermalPrinterService = new ThermalPrinterService();

console.log("Thermal printer service initialized");

export default thermalPrinterService;
