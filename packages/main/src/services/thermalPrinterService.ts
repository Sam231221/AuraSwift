/**
 * Thermal Printer Service for Electron Main Process
 * Handles communication with thermal receipt printers via Bluetooth/USB
 * Supports DIERI BT Thermal Printer and other ESC/POS compatible printers
 */

import { ipcMain } from "electron";

// Thermal printer library interface
interface ThermalPrinterLib {
  default?: any;
  ThermalPrinter?: any;
  CharacterSet?: any;
  [key: string]: any;
}

interface ThermalPrinter {
  clear(): void;
  alignCenter(): void;
  alignLeft(): void;
  setTextSize(width: number, height: number): void;
  println(text: string): void;
  newLine(): void;
  drawLine(): void;
  cut(): void;
  execute(): Promise<boolean>;
  isConnected(): Promise<boolean>;
}

interface PrinterConfig {
  type: "epson" | "star" | "generic";
  interface: string; // 'BT:XX:XX:XX:XX:XX:XX' or 'COM3' or '/dev/ttyUSB0'
  options?: {
    timeout?: number;
    characterSet?: string;
    removeSpecialCharacters?: boolean;
  };
}

export interface PrinterStatus {
  connected: boolean;
  interface: string;
  type: string;
  lastPrint?: string;
  error?: string;
}

export interface PrintRequest {
  data: Buffer;
  jobId: string;
  timeout?: number;
}

export interface PrintResponse {
  success: boolean;
  jobId: string;
  error?: string;
  timestamp: string;
}

export class ThermalPrinterService {
  private printer: ThermalPrinter | null = null;
  private currentConfig: PrinterConfig | null = null;
  private isInitialized = false;
  private printQueue: PrintRequest[] = [];
  private isProcessingQueue = false;

  constructor() {
    this.setupIpcHandlers();
  }

  /**
   * Setup IPC handlers for renderer communication
   */
  private setupIpcHandlers(): void {
    // Initialize printer
    ipcMain.handle(
      "printer:initialize",
      async (event, config: PrinterConfig) => {
        return await this.initializePrinter(config);
      }
    );

    // Print receipt
    ipcMain.handle(
      "printer:print",
      async (event, printData: Buffer, jobId: string) => {
        return await this.printReceipt(printData, jobId);
      }
    );

    // Get printer status
    ipcMain.handle("printer:status", async () => {
      return await this.getPrinterStatus();
    });

    // Test printer connection
    ipcMain.handle("printer:test", async () => {
      return await this.testPrinter();
    });

    // Disconnect printer
    ipcMain.handle("printer:disconnect", async () => {
      return await this.disconnect();
    });

    // Get available interfaces
    ipcMain.handle("printer:interfaces", async () => {
      return await this.getAvailableInterfaces();
    });
  }

  /**
   * Initialize printer with given configuration
   */
  async initializePrinter(
    config: PrinterConfig
  ): Promise<{ success: boolean; error?: string }> {
    try {
      console.log("🖨️ Initializing thermal printer:", config);

      // Dynamically import the thermal printer library
      let thermalPrinterLib: ThermalPrinterLib;

      try {
        // Try to import node-thermal-printer
        thermalPrinterLib = await import("node-thermal-printer");
      } catch (error) {
        console.warn("node-thermal-printer not available, using fallback");
        return {
          success: false,
          error:
            "Thermal printer library not installed. Please install node-thermal-printer package.",
        };
      }

      // Initialize printer with config
      const { ThermalPrinter } = thermalPrinterLib;
      this.printer = new ThermalPrinter({
        type: config.type || "epson",
        interface: config.interface,
        options: {
          timeout: config.options?.timeout || 5000,
          characterSet: config.options?.characterSet || "CP437",
          removeSpecialCharacters:
            config.options?.removeSpecialCharacters || false,
        },
      });

      this.currentConfig = config;
      this.isInitialized = true;

      console.log("✅ Thermal printer initialized successfully");
      return { success: true };
    } catch (error) {
      console.error("❌ Failed to initialize thermal printer:", error);
      this.isInitialized = false;
      return {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Unknown initialization error",
      };
    }
  }

  /**
   * Print receipt data
   */
  async printReceipt(
    data: Buffer,
    jobId: string = `job_${Date.now()}`
  ): Promise<PrintResponse> {
    const response: PrintResponse = {
      success: false,
      jobId,
      timestamp: new Date().toISOString(),
    };

    try {
      if (!this.printer || !this.isInitialized) {
        throw new Error(
          "Printer not initialized. Please initialize printer first."
        );
      }

      console.log(`🖨️ Printing receipt job ${jobId}...`);

      // Add to queue for processing
      const printRequest: PrintRequest = {
        data,
        jobId,
        timeout: 10000, // 10 second timeout
      };

      this.printQueue.push(printRequest);

      // Process queue if not already processing
      if (!this.isProcessingQueue) {
        await this.processQueue();
      }

      response.success = true;
      console.log(`✅ Receipt job ${jobId} queued successfully`);
    } catch (error) {
      console.error(`❌ Failed to queue print job ${jobId}:`, error);
      response.error =
        error instanceof Error ? error.message : "Unknown print error";
    }

    return response;
  }

  /**
   * Process print queue
   */
  private async processQueue(): Promise<void> {
    if (this.isProcessingQueue || this.printQueue.length === 0) {
      return;
    }

    this.isProcessingQueue = true;

    while (this.printQueue.length > 0) {
      const request = this.printQueue.shift();
      if (!request) continue;

      try {
        await this.executePrintJob(request);
      } catch (error) {
        console.error(
          `❌ Failed to process print job ${request.jobId}:`,
          error
        );
      }

      // Small delay between jobs
      await new Promise((resolve) => setTimeout(resolve, 500));
    }

    this.isProcessingQueue = false;
  }

  /**
   * Execute individual print job
   */
  private async executePrintJob(request: PrintRequest): Promise<void> {
    if (!this.printer) {
      throw new Error("Printer not available");
    }

    console.log(`🖨️ Executing print job ${request.jobId}...`);

    // Send raw data to printer
    const printData = request.data.toString("latin1");

    // Clear printer buffer
    this.printer.clear();

    // Send the formatted receipt data
    // Note: The data already contains ESC/POS commands from receiptGenerator
    const lines = printData.split("\n");
    lines.forEach((line) => {
      this.printer!.println(line);
    });

    // Execute print job with timeout
    const printPromise = this.printer.execute();
    const timeoutPromise = new Promise<boolean>((_, reject) => {
      setTimeout(
        () => reject(new Error("Print timeout")),
        request.timeout || 10000
      );
    });

    const success = await Promise.race([printPromise, timeoutPromise]);

    if (!success) {
      throw new Error("Printer execution failed");
    }

    console.log(`✅ Print job ${request.jobId} completed successfully`);
  }

  /**
   * Get current printer status
   */
  async getPrinterStatus(): Promise<PrinterStatus> {
    const status: PrinterStatus = {
      connected: false,
      interface: this.currentConfig?.interface || "none",
      type: this.currentConfig?.type || "none",
    };

    if (this.printer && this.isInitialized) {
      try {
        status.connected = await this.printer.isConnected();
      } catch (error) {
        status.connected = false;
        status.error =
          error instanceof Error ? error.message : "Connection check failed";
      }
    }

    return status;
  }

  /**
   * Test printer with a simple test print
   */
  async testPrinter(): Promise<{ success: boolean; error?: string }> {
    try {
      if (!this.printer || !this.isInitialized) {
        return { success: false, error: "Printer not initialized" };
      }

      console.log("🧪 Testing thermal printer...");

      // Create test receipt
      this.printer.clear();
      this.printer.alignCenter();
      this.printer.setTextSize(1, 1);
      this.printer.println("PRINTER TEST");
      this.printer.println("=============");
      this.printer.alignLeft();
      this.printer.println("Date: " + new Date().toLocaleString());
      this.printer.println("Status: Connected");
      this.printer.newLine();
      this.printer.alignCenter();
      this.printer.println("Test Successful!");
      this.printer.newLine();
      this.printer.cut();

      const success = await this.printer.execute();

      if (success) {
        console.log("✅ Printer test successful");
        return { success: true };
      } else {
        console.log("❌ Printer test failed");
        return { success: false, error: "Test print execution failed" };
      }
    } catch (error) {
      console.error("❌ Printer test error:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown test error",
      };
    }
  }

  /**
   * Disconnect from printer
   */
  async disconnect(): Promise<{ success: boolean }> {
    try {
      this.printer = null;
      this.currentConfig = null;
      this.isInitialized = false;
      this.printQueue = [];
      this.isProcessingQueue = false;

      console.log("🔌 Printer disconnected");
      return { success: true };
    } catch (error) {
      console.error("❌ Error disconnecting printer:", error);
      return { success: false };
    }
  }

  /**
   * Get available printer interfaces (COM ports, Bluetooth devices)
   */
  async getAvailableInterfaces(): Promise<{
    success: boolean;
    interfaces: Array<{
      type: "usb" | "bluetooth";
      name: string;
      address: string;
    }>;
  }> {
    try {
      const interfaces: Array<{
        type: "usb" | "bluetooth";
        name: string;
        address: string;
      }> = [];

      // On Windows, common COM ports for USB printers
      if (process.platform === "win32") {
        // Add common COM ports
        for (let i = 1; i <= 10; i++) {
          interfaces.push({
            type: "usb",
            name: `COM${i}`,
            address: `COM${i}`,
          });
        }
      }

      // Add example Bluetooth interfaces (in a real implementation, you'd scan for BT devices)
      interfaces.push({
        type: "bluetooth",
        name: "DIERI Thermal Printer",
        address: "BT:00:11:62:AA:BB:CC", // Example MAC address
      });

      return { success: true, interfaces };
    } catch (error) {
      console.error("❌ Error getting printer interfaces:", error);
      return { success: false, interfaces: [] };
    }
  }
}

// Export singleton instance
export const thermalPrinterService = new ThermalPrinterService();
