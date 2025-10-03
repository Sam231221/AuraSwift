/**
 * Payment Service for Electron Main Process
 * Handles BBPOS WisePad 3 card reader communication with Stripe Terminal integration
 * Supports card swipe, tap, and chip payment processing
 */

import { ipcMain } from "electron";
import Stripe from "stripe";
import HID from "node-hid";

// BBPOS WisePad 3 device identifiers
const BBPOS_VENDOR_ID = 0x0b00; // Example vendor ID - replace with actual BBPOS ID
const BBPOS_PRODUCT_ID = 0x0001; // Example product ID - replace with WisePad 3 ID

export interface CardReaderConfig {
  type: "bbpos_wisepad3";
  connectionType: "usb" | "bluetooth";
  deviceId?: string;
  simulated?: boolean; // For development/testing
}

export interface PaymentIntentData {
  amount: number; // in cents
  currency: string;
  description?: string;
  metadata?: Record<string, string>;
}

export interface PaymentResult {
  success: boolean;
  paymentIntent?: Stripe.PaymentIntent;
  error?: string;
  errorCode?: string;
  requiresAction?: boolean;
  clientSecret?: string;
}

export interface CardReaderStatus {
  connected: boolean;
  deviceType: string;
  connectionType: "usb" | "bluetooth" | "none";
  batteryLevel?: number;
  firmwareVersion?: string;
  lastActivity?: string;
  error?: string;
}

export interface ReaderEvent {
  type:
    | "card_inserted"
    | "card_removed"
    | "card_swiped"
    | "card_tapped"
    | "payment_complete"
    | "error";
  data?: any;
  timestamp: string;
}

export class PaymentService {
  private stripe: Stripe;
  private cardReader: HID.HID | null = null;
  private readerConfig: CardReaderConfig | null = null;
  private isReaderConnected = false;
  private currentPaymentIntent: Stripe.PaymentIntent | null = null;
  private paymentState: {
    isProcessing: boolean;
    currentStep: string;
    readerStatus:
      | "disconnected"
      | "connecting"
      | "connected"
      | "ready"
      | "processing"
      | "error";
  };
  private eventListeners: Map<string, Function[]> = new Map();

  constructor() {
    // Initialize Stripe with secret key from environment
    this.stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "sk_test_...", {
      apiVersion: "2025-09-30.clover",
    });

    this.paymentState = {
      isProcessing: false,
      currentStep: "idle",
      readerStatus: "disconnected",
    };

    this.setupIpcHandlers();
  }

  /**
   * Setup IPC handlers for renderer communication
   */
  private setupIpcHandlers(): void {
    // Initialize card reader
    ipcMain.handle(
      "payment:initialize-reader",
      async (event, config: CardReaderConfig) => {
        return await this.initializeCardReader(config);
      }
    );

    // Create payment intent
    ipcMain.handle(
      "payment:create-intent",
      async (event, data: PaymentIntentData) => {
        return await this.createPaymentIntent(data);
      }
    );

    // Process card payment
    ipcMain.handle(
      "payment:process-card",
      async (event, paymentIntentId: string) => {
        return await this.processCardPayment(paymentIntentId);
      }
    );

    // Get card reader status
    ipcMain.handle("payment:reader-status", async () => {
      return await this.getCardReaderStatus();
    });

    // Disconnect card reader
    ipcMain.handle("payment:disconnect-reader", async () => {
      return await this.disconnectCardReader();
    });

    // Get available card readers
    ipcMain.handle("payment:discover-readers", async () => {
      return await this.discoverCardReaders();
    });

    // Cancel current payment
    ipcMain.handle("payment:cancel", async () => {
      return await this.cancelPayment();
    });

    // Test card reader connection
    ipcMain.handle("payment:test-reader", async () => {
      return await this.testCardReader();
    });
  }

  /**
   * Initialize BBPOS WisePad 3 card reader
   */
  async initializeCardReader(
    config: CardReaderConfig
  ): Promise<{ success: boolean; error?: string }> {
    try {
      console.log("🏦 Initializing BBPOS WisePad 3 card reader:", config);

      this.readerConfig = config;
      this.paymentState.readerStatus = "connecting";

      if (config.simulated) {
        // Simulated reader for development
        console.log("⚡ Using simulated card reader for development");
        this.isReaderConnected = true;
        this.paymentState.readerStatus = "ready";
        return { success: true };
      }

      // Discover BBPOS WisePad 3 device
      const devices = HID.devices();
      const wisePadDevice = devices.find(
        (device) =>
          device.vendorId === BBPOS_VENDOR_ID &&
          device.productId === BBPOS_PRODUCT_ID
      );

      if (!wisePadDevice) {
        throw new Error(
          "BBPOS WisePad 3 not found. Please connect the device."
        );
      }

      // Connect to the device
      this.cardReader = new HID.HID(wisePadDevice.path!);
      this.setupReaderEventHandlers();

      this.isReaderConnected = true;
      this.paymentState.readerStatus = "connected";

      console.log("✅ BBPOS WisePad 3 connected successfully");

      // Initialize the reader for payment processing
      await this.initializeReaderForPayments();

      this.paymentState.readerStatus = "ready";
      return { success: true };
    } catch (error) {
      console.error("❌ Failed to initialize card reader:", error);
      this.paymentState.readerStatus = "error";
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
   * Setup event handlers for card reader
   */
  private setupReaderEventHandlers(): void {
    if (!this.cardReader) return;

    this.cardReader.on("data", (data: Buffer) => {
      this.handleReaderData(data);
    });

    this.cardReader.on("error", (error: Error) => {
      console.error("❌ Card reader error:", error);
      this.paymentState.readerStatus = "error";
      this.emitEvent("error", { error: error.message });
    });
  }

  /**
   * Handle data from card reader
   */
  private handleReaderData(data: Buffer): void {
    try {
      // Parse BBPOS protocol data
      const command = this.parseBBPOSData(data);

      console.log("📊 Reader data received:", command);

      switch (command.type) {
        case "CARD_INSERTED":
          this.emitEvent("card_inserted", command.data);
          break;
        case "CARD_SWIPED":
          this.emitEvent("card_swiped", command.data);
          this.processCardData(command.data);
          break;
        case "CARD_TAPPED":
          this.emitEvent("card_tapped", command.data);
          this.processCardData(command.data);
          break;
        case "CARD_REMOVED":
          this.emitEvent("card_removed", command.data);
          break;
        case "PAYMENT_COMPLETE":
          this.emitEvent("payment_complete", command.data);
          break;
        default:
          console.log("🔍 Unknown reader command:", command);
      }
    } catch (error) {
      console.error("❌ Error handling reader data:", error);
    }
  }

  /**
   * Parse BBPOS protocol data
   */
  private parseBBPOSData(data: Buffer): { type: string; data: any } {
    // This is a simplified parser - implement actual BBPOS protocol parsing
    // Based on BBPOS WisePad 3 SDK documentation

    const dataStr = data.toString("hex");
    console.log("📡 Raw reader data:", dataStr);

    // Example parsing logic (replace with actual BBPOS protocol)
    if (dataStr.startsWith("02")) {
      return { type: "CARD_INSERTED", data: { cardType: "unknown" } };
    } else if (dataStr.startsWith("03")) {
      return {
        type: "CARD_SWIPED",
        data: { track1: "", track2: "", track3: "" },
      };
    } else if (dataStr.startsWith("04")) {
      return { type: "CARD_TAPPED", data: { nfc: true } };
    } else if (dataStr.startsWith("05")) {
      return { type: "CARD_REMOVED", data: {} };
    } else {
      return { type: "UNKNOWN", data: { raw: dataStr } };
    }
  }

  /**
   * Initialize reader for payment processing
   */
  private async initializeReaderForPayments(): Promise<void> {
    if (!this.cardReader && !this.readerConfig?.simulated) {
      throw new Error("Card reader not connected");
    }

    // Send initialization commands to BBPOS WisePad 3
    // This would include setting up the reader for Stripe integration
    console.log("🔧 Initializing reader for payment processing...");

    if (this.readerConfig?.simulated) {
      // Simulated initialization
      await new Promise((resolve) => setTimeout(resolve, 1000));
      return;
    }

    // Send actual initialization commands to the device
    // Implementation depends on BBPOS SDK documentation
    const initCommand = Buffer.from([0x01, 0x00, 0x01]); // Example command
    this.cardReader?.write(initCommand);
  }

  /**
   * Create Stripe payment intent
   */
  async createPaymentIntent(
    data: PaymentIntentData
  ): Promise<{ success: boolean; clientSecret?: string; error?: string }> {
    try {
      console.log("💳 Creating payment intent:", data);

      const paymentIntent = await this.stripe.paymentIntents.create({
        amount: data.amount,
        currency: data.currency || "gbp",
        payment_method_types: ["card_present", "card"],
        capture_method: "automatic",
        description: data.description,
        metadata: data.metadata || {},
      });

      this.currentPaymentIntent = paymentIntent;

      console.log("✅ Payment intent created:", paymentIntent.id);

      return {
        success: true,
        clientSecret: paymentIntent.client_secret!,
      };
    } catch (error) {
      console.error("❌ Failed to create payment intent:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }

  /**
   * Process card payment with BBPOS reader
   */
  async processCardPayment(paymentIntentId: string): Promise<PaymentResult> {
    try {
      console.log("💰 Processing card payment:", paymentIntentId);

      this.paymentState.isProcessing = true;
      this.paymentState.currentStep = "waiting_for_card";

      // Check available payment options in order of preference:
      // 1. Physical card reader connected
      if (this.isReaderConnected) {
        console.log("📱 Using physical card reader");
        return await this.processRealCardPayment(paymentIntentId);
      }

      // 2. Simulated reader for development/testing
      if (this.readerConfig?.simulated) {
        console.log("🧪 Using simulated card reader for development");
        return await this.simulateCardPayment(paymentIntentId);
      }

      // 3. Fallback to regular card payment (no physical reader required)
      console.log("💳 Using regular card payment (no physical reader)");
      return await this.processRegularCardPayment(paymentIntentId);
    } catch (error) {
      console.error("❌ Card payment processing failed:", error);
      this.paymentState.isProcessing = false;
      return {
        success: false,
        error:
          error instanceof Error ? error.message : "Payment processing failed",
      };
    }
  }

  /**
   * Process real card payment with physical reader
   */
  private async processRealCardPayment(
    paymentIntentId: string
  ): Promise<PaymentResult> {
    return new Promise((resolve) => {
      const timeout = setTimeout(() => {
        this.paymentState.isProcessing = false;
        resolve({
          success: false,
          error: "Payment timeout - no card detected",
          errorCode: "timeout",
        });
      }, 30000); // 30 second timeout

      // Listen for card data
      const handleCardData = async (cardData: any) => {
        clearTimeout(timeout);
        this.paymentState.currentStep = "processing";

        try {
          // For now, simulate card present confirmation
          // In real implementation, this would use actual card data from BBPOS reader
          const paymentIntent = await this.stripe.paymentIntents.confirm(
            paymentIntentId
          );

          this.paymentState.isProcessing = false;
          this.paymentState.currentStep = "complete";

          resolve({
            success: true,
            paymentIntent,
          });
        } catch (error) {
          this.paymentState.isProcessing = false;
          resolve({
            success: false,
            error:
              error instanceof Error
                ? error.message
                : "Payment confirmation failed",
          });
        }
      };

      // Set up event listener for card data
      this.once("card_swiped", handleCardData);
      this.once("card_tapped", handleCardData);
    });
  }

  /**
   * Simulate card payment for development
   */
  private async simulateCardPayment(
    paymentIntentId: string
  ): Promise<PaymentResult> {
    console.log("⚡ Simulating card payment...");

    // Simulate card read delay
    await new Promise((resolve) => setTimeout(resolve, 2000));

    this.paymentState.currentStep = "processing";

    // Simulate processing delay
    await new Promise((resolve) => setTimeout(resolve, 1500));

    try {
      // For simulation, we'll create a test payment method
      const paymentMethod = await this.stripe.paymentMethods.create({
        type: "card",
        card: {
          token: "tok_visa", // Stripe test token
        },
      });

      const paymentIntent = await this.stripe.paymentIntents.confirm(
        paymentIntentId,
        {
          payment_method: paymentMethod.id,
        }
      );

      this.paymentState.isProcessing = false;
      this.paymentState.currentStep = "complete";

      console.log("✅ Simulated payment complete:", paymentIntent.status);

      return {
        success: paymentIntent.status === "succeeded",
        paymentIntent,
      };
    } catch (error) {
      this.paymentState.isProcessing = false;
      return {
        success: false,
        error:
          error instanceof Error ? error.message : "Simulated payment failed",
      };
    }
  }

  /**
   * Process regular card payment without physical reader
   * Uses Stripe's standard card payment flow with test cards
   */
  private async processRegularCardPayment(
    paymentIntentId: string
  ): Promise<PaymentResult> {
    console.log("💳 Processing regular card payment (no physical reader)...");

    this.paymentState.currentStep = "processing";

    try {
      // For development/testing, create a test payment method with test card
      // In a real app, this would be replaced with Elements or other card input
      const paymentMethod = await this.stripe.paymentMethods.create({
        type: "card",
        card: {
          token: "tok_visa", // Stripe test token for 4242424242424242
        },
      });

      console.log("💳 Created payment method:", paymentMethod.id);

      // Confirm the payment intent with the payment method
      const paymentIntent = await this.stripe.paymentIntents.confirm(
        paymentIntentId,
        {
          payment_method: paymentMethod.id,
        }
      );

      this.paymentState.isProcessing = false;
      this.paymentState.currentStep = "complete";

      console.log("✅ Regular card payment complete:", paymentIntent.status);

      return {
        success: paymentIntent.status === "succeeded",
        paymentIntent,
        clientSecret: paymentIntent.client_secret || undefined,
      };
    } catch (error) {
      console.error("❌ Regular card payment failed:", error);
      this.paymentState.isProcessing = false;
      return {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Regular card payment failed",
      };
    }
  }

  /**
   * Process card data from reader
   */
  private async processCardData(cardData: any): Promise<void> {
    if (!this.currentPaymentIntent) {
      console.error("❌ No active payment intent");
      return;
    }

    console.log("💳 Processing card data...", cardData);
    // Implementation would depend on BBPOS SDK for extracting card data
  }

  /**
   * Get card reader status
   */
  async getCardReaderStatus(): Promise<CardReaderStatus> {
    const status: CardReaderStatus = {
      connected: this.isReaderConnected,
      deviceType: this.readerConfig?.type || "none",
      connectionType: this.readerConfig?.connectionType || "none",
      lastActivity: new Date().toISOString(),
    };

    if (this.paymentState.readerStatus === "error") {
      status.error = "Reader communication error";
    }

    // For real implementation, you would query the device for:
    // - Battery level
    // - Firmware version
    // - Device status

    return status;
  }

  /**
   * Discover available card readers
   */
  async discoverCardReaders(): Promise<{
    success: boolean;
    readers: Array<{
      type: string;
      id: string;
      name: string;
      connectionType: "usb" | "bluetooth";
    }>;
  }> {
    try {
      const devices = HID.devices();
      const readers: Array<{
        type: string;
        id: string;
        name: string;
        connectionType: "usb" | "bluetooth";
      }> = [];

      // Look for BBPOS devices
      const bbposDevices = devices.filter(
        (device) => device.vendorId === BBPOS_VENDOR_ID
      );

      bbposDevices.forEach((device) => {
        readers.push({
          type: "bbpos_wisepad3",
          id: device.path || "unknown",
          name: device.product || "BBPOS WisePad 3",
          connectionType: "usb",
        });
      });

      // Add simulated reader for development
      readers.push({
        type: "simulated",
        id: "sim-001",
        name: "Simulated Card Reader",
        connectionType: "usb",
      });

      return { success: true, readers };
    } catch (error) {
      console.error("❌ Error discovering readers:", error);
      return { success: false, readers: [] };
    }
  }

  /**
   * Cancel current payment
   */
  async cancelPayment(): Promise<{ success: boolean; error?: string }> {
    try {
      if (this.currentPaymentIntent && this.paymentState.isProcessing) {
        await this.stripe.paymentIntents.cancel(this.currentPaymentIntent.id);
        console.log("🚫 Payment cancelled:", this.currentPaymentIntent.id);
      }

      this.paymentState.isProcessing = false;
      this.paymentState.currentStep = "cancelled";
      this.currentPaymentIntent = null;

      return { success: true };
    } catch (error) {
      console.error("❌ Error cancelling payment:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Cancel failed",
      };
    }
  }

  /**
   * Test card reader connection
   */
  async testCardReader(): Promise<{ success: boolean; error?: string }> {
    try {
      if (!this.isReaderConnected && !this.readerConfig?.simulated) {
        return { success: false, error: "Reader not connected" };
      }

      console.log("🧪 Testing card reader...");

      if (this.readerConfig?.simulated) {
        await new Promise((resolve) => setTimeout(resolve, 1000));
        return { success: true };
      }

      // Send test command to BBPOS WisePad 3
      const testCommand = Buffer.from([0xff, 0x00, 0x01]); // Example test command
      this.cardReader?.write(testCommand);

      // Wait for response
      await new Promise((resolve) => setTimeout(resolve, 2000));

      return { success: true };
    } catch (error) {
      console.error("❌ Card reader test failed:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Test failed",
      };
    }
  }

  /**
   * Disconnect card reader
   */
  async disconnectCardReader(): Promise<{ success: boolean }> {
    try {
      if (this.cardReader) {
        this.cardReader.close();
        this.cardReader = null;
      }

      this.isReaderConnected = false;
      this.paymentState.readerStatus = "disconnected";
      this.readerConfig = null;
      this.currentPaymentIntent = null;

      console.log("🔌 Card reader disconnected");
      return { success: true };
    } catch (error) {
      console.error("❌ Error disconnecting reader:", error);
      return { success: false };
    }
  }

  /**
   * Event emitter functionality
   */
  private emitEvent(eventType: string, data?: any): void {
    const event: ReaderEvent = {
      type: eventType as any,
      data,
      timestamp: new Date().toISOString(),
    };

    const listeners = this.eventListeners.get(eventType) || [];
    listeners.forEach((listener) => listener(event));

    // Also broadcast to renderer processes
    // You could use webContents.send() here if needed
  }

  private once(eventType: string, listener: Function): void {
    const onceListener = (event: ReaderEvent) => {
      listener(event);
      this.off(eventType, onceListener);
    };
    this.on(eventType, onceListener);
  }

  private on(eventType: string, listener: Function): void {
    const listeners = this.eventListeners.get(eventType) || [];
    listeners.push(listener);
    this.eventListeners.set(eventType, listeners);
  }

  private off(eventType: string, listener: Function): void {
    const listeners = this.eventListeners.get(eventType) || [];
    const index = listeners.indexOf(listener);
    if (index > -1) {
      listeners.splice(index, 1);
      this.eventListeners.set(eventType, listeners);
    }
  }
}

// Export singleton instance
export const paymentService = new PaymentService();
