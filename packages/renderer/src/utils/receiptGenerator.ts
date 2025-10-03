/**
 * Receipt Generator Utility
 * Formats transaction data for thermal receipt printing using ESC/POS commands
 * Optimized for 58mm thermal printers (32 characters per line)
 */

// Receipt Generator types and interfaces

export interface ReceiptData {
  // Store Information
  storeName: string;
  storeAddress: string;
  storePhone: string;
  vatNumber?: string;

  // Transaction Details
  receiptNumber: string;
  transactionId: string;
  date: string;
  time: string;
  cashierId: string;
  cashierName: string;

  // Items
  items: ReceiptItem[];

  // Financial
  subtotal: number;
  tax: number;
  total: number;
  paymentMethod: "cash" | "card" | "mobile" | "mixed";
  cashAmount?: number;
  cardAmount?: number;
  change?: number;

  // Additional
  loyaltyPoints?: number;
  loyaltyBalance?: number;
  returnPolicy?: string;
}

export interface ReceiptItem {
  name: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  weight?: number;
  unit?: string;
  sku?: string;
}

export class ReceiptGenerator {
  private static readonly LINE_WIDTH = 32; // Characters per line for 58mm printer
  private static readonly SEPARATOR = "-".repeat(32);

  /**
   * Generate formatted receipt text for thermal printing
   */
  static generateReceiptText(data: ReceiptData): string {
    let receipt = "";

    // ESC/POS initialization commands
    receipt += "\x1B\x40"; // ESC @ - Initialize printer

    // Store Header (centered, double height)
    receipt += "\x1B\x61\x01"; // ESC a 1 - Center alignment
    receipt += "\x1D\x21\x11"; // GS ! 0x11 - Double height and width
    receipt += this.centerText(data.storeName) + "\n";
    receipt += "\x1D\x21\x00"; // GS ! 0x00 - Normal text size

    if (data.storeAddress) {
      receipt += this.centerText(data.storeAddress) + "\n";
    }
    if (data.storePhone) {
      receipt += this.centerText(data.storePhone) + "\n";
    }
    if (data.vatNumber) {
      receipt += this.centerText(`VAT: ${data.vatNumber}`) + "\n";
    }

    receipt += "\n";

    // Reset to left alignment
    receipt += "\x1B\x61\x00"; // ESC a 0 - Left alignment

    // Transaction details
    receipt += this.SEPARATOR + "\n";
    receipt += this.formatLine("Receipt:", `#${data.receiptNumber}`) + "\n";
    receipt += this.formatLine("Date:", data.date) + "\n";
    receipt += this.formatLine("Time:", data.time) + "\n";
    receipt += this.formatLine("Cashier:", data.cashierName) + "\n";
    receipt += this.SEPARATOR + "\n";

    // Items
    receipt += "ITEMS:\n";
    data.items.forEach((item) => {
      // Item name
      receipt += this.wrapText(item.name) + "\n";

      // Quantity and price line
      let qtyLine = "";
      if (item.weight && item.unit) {
        qtyLine = `${item.quantity}x @ £${item.unitPrice.toFixed(2)}/${
          item.unit
        }`;
        const weightLine = `Weight: ${item.weight.toFixed(2)} ${item.unit}`;
        receipt += `  ${weightLine}\n`;
      } else {
        qtyLine = `${item.quantity}x @ £${item.unitPrice.toFixed(2)}`;
      }

      const priceLine = `£${item.totalPrice.toFixed(2)}`;
      receipt += this.formatLine(`  ${qtyLine}`, priceLine) + "\n";

      if (item.sku) {
        receipt += `  SKU: ${item.sku}\n`;
      }
      receipt += "\n";
    });

    // Totals
    receipt += this.SEPARATOR + "\n";
    receipt +=
      this.formatLine("Subtotal:", `£${data.subtotal.toFixed(2)}`) + "\n";
    receipt += this.formatLine("Tax (8%):", `£${data.tax.toFixed(2)}`) + "\n";

    // Total (bold/emphasized)
    receipt += "\x1B\x45\x01"; // ESC E 1 - Bold on
    receipt += this.formatLine("TOTAL:", `£${data.total.toFixed(2)}`) + "\n";
    receipt += "\x1B\x45\x00"; // ESC E 0 - Bold off

    receipt += this.SEPARATOR + "\n";

    // Payment details
    receipt += "PAYMENT:\n";
    receipt +=
      this.formatLine(
        "Method:",
        this.getPaymentMethodText(data.paymentMethod)
      ) + "\n";

    if (data.paymentMethod === "cash") {
      receipt +=
        this.formatLine("Cash:", `£${(data.cashAmount || 0).toFixed(2)}`) +
        "\n";
      if (data.change && data.change > 0) {
        receipt +=
          this.formatLine("Change:", `£${data.change.toFixed(2)}`) + "\n";
      }
    } else if (
      data.paymentMethod === "card" ||
      data.paymentMethod === "mobile"
    ) {
      receipt +=
        this.formatLine(
          "Amount:",
          `£${(data.cardAmount || data.total).toFixed(2)}`
        ) + "\n";
    } else if (data.paymentMethod === "mixed") {
      if (data.cashAmount) {
        receipt +=
          this.formatLine("Cash:", `£${data.cashAmount.toFixed(2)}`) + "\n";
      }
      if (data.cardAmount) {
        receipt +=
          this.formatLine("Card:", `£${data.cardAmount.toFixed(2)}`) + "\n";
      }
    }

    // Loyalty points (if applicable)
    if (data.loyaltyPoints !== undefined || data.loyaltyBalance !== undefined) {
      receipt += "\n";
      if (data.loyaltyPoints) {
        receipt +=
          this.formatLine("Points Earned:", data.loyaltyPoints.toString()) +
          "\n";
      }
      if (data.loyaltyBalance !== undefined) {
        receipt +=
          this.formatLine("Points Balance:", data.loyaltyBalance.toString()) +
          "\n";
      }
    }

    receipt += "\n";

    // Footer
    receipt += "\x1B\x61\x01"; // Center alignment
    receipt += this.centerText("Thank you for shopping with us!") + "\n";
    receipt += "\n";

    if (data.returnPolicy) {
      receipt += this.centerText("Return Policy:") + "\n";
      receipt += this.wrapText(data.returnPolicy, true) + "\n";
    }

    receipt += this.centerText("Keep this receipt for returns") + "\n";
    receipt += "\n";

    // Transaction barcode (for easy returns)
    receipt += this.centerText(`ID: ${data.transactionId}`) + "\n";

    // Reset alignment
    receipt += "\x1B\x61\x00"; // Left alignment

    // Add extra line feeds before cut
    receipt += "\x1B\x64\x03"; // ESC d 3 - Feed 3 lines

    // Paper cut command
    receipt += "\x1D\x56\x42"; // GS V 66 - Partial cut

    return receipt;
  }

  /**
   * Generate ESC/POS byte buffer for direct printer communication
   */
  static generateReceiptBuffer(data: ReceiptData): Buffer {
    const receiptText = this.generateReceiptText(data);
    return Buffer.from(receiptText, "latin1"); // Use latin1 for ESC/POS compatibility
  }

  /**
   * Format a line with left and right aligned text
   */
  private static formatLine(left: string, right: string): string {
    const totalLength = this.LINE_WIDTH;
    const rightLength = right.length;
    const leftLength = totalLength - rightLength;

    if (left.length > leftLength) {
      return left.substring(0, leftLength - 1) + right;
    }

    const padding = " ".repeat(leftLength - left.length);
    return left + padding + right;
  }

  /**
   * Center text within the line width
   */
  private static centerText(text: string): string {
    if (text.length >= this.LINE_WIDTH) {
      return text.substring(0, this.LINE_WIDTH);
    }

    const padding = Math.floor((this.LINE_WIDTH - text.length) / 2);
    return " ".repeat(padding) + text;
  }

  /**
   * Wrap long text to fit within line width
   */
  private static wrapText(text: string, centered = false): string {
    if (text.length <= this.LINE_WIDTH) {
      return centered ? this.centerText(text) : text;
    }

    const words = text.split(" ");
    const lines: string[] = [];
    let currentLine = "";

    words.forEach((word) => {
      if ((currentLine + word).length > this.LINE_WIDTH) {
        if (currentLine) {
          lines.push(
            centered ? this.centerText(currentLine.trim()) : currentLine.trim()
          );
          currentLine = word + " ";
        } else {
          // Word is longer than line width, split it
          lines.push(
            centered
              ? this.centerText(word.substring(0, this.LINE_WIDTH))
              : word.substring(0, this.LINE_WIDTH)
          );
          currentLine = word.substring(this.LINE_WIDTH) + " ";
        }
      } else {
        currentLine += word + " ";
      }
    });

    if (currentLine) {
      lines.push(
        centered ? this.centerText(currentLine.trim()) : currentLine.trim()
      );
    }

    return lines.join("\n");
  }

  /**
   * Get human-readable payment method text
   */
  private static getPaymentMethodText(method: string): string {
    switch (method) {
      case "cash":
        return "Cash";
      case "card":
        return "Card";
      case "mobile":
        return "Mobile Pay";
      case "mixed":
        return "Mixed Payment";
      default:
        return "Unknown";
    }
  }

  /**
   * Create receipt data from transaction information
   */
  static createReceiptData(
    transactionData: {
      receiptNumber: string;
      id?: string;
      items: Array<{
        productName: string;
        quantity: number;
        unitPrice: number;
        totalPrice: number;
        weight?: number;
        unit?: string;
        sku?: string;
      }>;
      subtotal: number;
      tax: number;
      total: number;
      paymentMethod: "cash" | "card" | "mobile" | "mixed";
      cashAmount?: number;
      cardAmount?: number;
    },
    storeInfo: {
      name: string;
      address: string;
      phone: string;
      vatNumber?: string;
    },
    cashierInfo: {
      id: string;
      name: string;
    }
  ): ReceiptData {
    const now = new Date();

    return {
      // Store info
      storeName: storeInfo.name,
      storeAddress: storeInfo.address,
      storePhone: storeInfo.phone,
      vatNumber: storeInfo.vatNumber,

      // Transaction details
      receiptNumber: transactionData.receiptNumber,
      transactionId: transactionData.id || transactionData.receiptNumber,
      date: now.toLocaleDateString("en-GB"),
      time: now.toLocaleTimeString("en-GB", {
        hour: "2-digit",
        minute: "2-digit",
      }),
      cashierId: cashierInfo.id,
      cashierName: cashierInfo.name,

      // Items
      items: transactionData.items.map((item) => ({
        name: item.productName,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        totalPrice: item.totalPrice,
        weight: item.weight,
        unit: item.unit,
        sku: item.sku,
      })),

      // Financial
      subtotal: transactionData.subtotal,
      tax: transactionData.tax,
      total: transactionData.total,
      paymentMethod: transactionData.paymentMethod,
      cashAmount: transactionData.cashAmount,
      cardAmount: transactionData.cardAmount,
      change: transactionData.cashAmount
        ? transactionData.cashAmount - transactionData.total
        : undefined,

      // Additional
      returnPolicy:
        "Items can be returned within 30 days with receipt. Perishable items excluded.",
    };
  }
}
