/**
 * PDF Receipt Generator for Office Printers (HP LaserJet, Canon, Epson, etc.)
 * Generates professional A4/Letter size receipts using pdfkit
 * Designed for use with officePrinterService
 */

import PDFDocument from "pdfkit";

export interface ReceiptData {
  // Store Information
  storeName: string;
  storeAddress: string;
  storePhone: string;
  vatNumber?: string;

  // Transaction Details
  receiptNumber: string;
  transactionId: string;
  date: string; // Format: DD/MM/YYYY
  time: string; // Format: HH:MM
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
  footerMessage?: string;
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

/**
 * Generate PDF receipt buffer for printing
 * Returns Promise<Buffer> that can be saved to file or sent to printer
 */
export async function generatePDFReceipt(data: ReceiptData): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({
        size: "LETTER", // Can be 'A4' for European printers
        margins: {
          top: 40,
          bottom: 40,
          left: 50,
          right: 50,
        },
        info: {
          Title: `Receipt ${data.receiptNumber}`,
          Author: data.storeName,
          Subject: "Sales Receipt",
          CreationDate: new Date(),
        },
      });

      const buffers: Buffer[] = [];
      doc.on("data", buffers.push.bind(buffers));
      doc.on("end", () => {
        const pdfBuffer = Buffer.concat(buffers);
        resolve(pdfBuffer);
      });
      doc.on("error", reject);

      // Start building receipt
      let currentY = doc.y;

      // =====================================================
      // HEADER SECTION
      // =====================================================
      doc
        .font("Helvetica-Bold")
        .fontSize(22)
        .text(data.storeName, { align: "center" });

      currentY = doc.y;
      doc
        .font("Helvetica")
        .fontSize(10)
        .text(data.storeAddress, { align: "center" })
        .text(data.storePhone, { align: "center" });

      if (data.vatNumber) {
        doc.text(`VAT: ${data.vatNumber}`, { align: "center" });
      }

      currentY = doc.y + 10;
      doc.moveTo(50, currentY).lineTo(562, currentY).stroke("#000000");

      // =====================================================
      // TRANSACTION INFO SECTION
      // =====================================================
      currentY = doc.y + 15;
      doc.y = currentY;

      doc.fontSize(10).font("Helvetica-Bold");
      doc.text("RECEIPT", 50, currentY);
      doc.font("Helvetica");
      doc.text(`#${data.receiptNumber}`, 400, currentY, {
        align: "right",
        width: 112,
      });

      currentY = doc.y + 5;
      doc.text("Date:", 50, currentY);
      doc.text(data.date, 150, currentY);
      doc.text("Time:", 300, currentY);
      doc.text(data.time, 350, currentY);

      currentY = doc.y + 5;
      doc.text("Cashier:", 50, currentY);
      doc.text(data.cashierName, 150, currentY);

      currentY = doc.y + 5;
      doc.text("Transaction ID:", 50, currentY);
      doc.text(data.transactionId, 150, currentY);

      currentY = doc.y + 10;
      doc.moveTo(50, currentY).lineTo(562, currentY).stroke("#000000");

      // =====================================================
      // ITEMS SECTION
      // =====================================================
      currentY = doc.y + 15;
      doc.y = currentY;

      doc.fontSize(12).font("Helvetica-Bold");
      doc.text("ITEMS", 50, currentY);

      currentY = doc.y + 10;
      doc.fontSize(9).font("Helvetica-Bold");
      doc.text("Item", 50, currentY);
      doc.text("Qty", 300, currentY, { width: 50, align: "center" });
      doc.text("Price", 350, currentY, { width: 80, align: "right" });
      doc.text("Total", 430, currentY, { width: 82, align: "right" });

      currentY = doc.y + 5;
      doc.moveTo(50, currentY).lineTo(562, currentY).stroke("#CCCCCC");

      // Render each item
      currentY = doc.y + 8;
      doc.font("Helvetica").fontSize(10);

      for (const item of data.items) {
        // Check if we need a new page
        if (currentY > 700) {
          doc.addPage();
          currentY = 50;
        }

        // Item name (can wrap to multiple lines)
        doc.text(item.name, 50, currentY, { width: 240 });
        const nameHeight = doc.heightOfString(item.name, { width: 240 });

        // Weight information (if applicable)
        if (item.weight && item.unit) {
          const weightY = currentY + nameHeight + 2;
          doc.fontSize(8).fillColor("#666666");
          doc.text(
            `Weight: ${item.weight.toFixed(2)} ${item.unit}`,
            60,
            weightY
          );
          doc.fillColor("#000000").fontSize(10);
        }

        // SKU (if available)
        if (item.sku) {
          const skuY = currentY + nameHeight + (item.weight ? 12 : 2);
          doc.fontSize(8).fillColor("#666666");
          doc.text(`SKU: ${item.sku}`, 60, skuY);
          doc.fillColor("#000000").fontSize(10);
        }

        // Quantity
        const qtyText =
          item.weight && item.unit
            ? `${item.quantity} × £${item.unitPrice.toFixed(2)}/${item.unit}`
            : `${item.quantity} × £${item.unitPrice.toFixed(2)}`;

        doc.text(qtyText, 300, currentY, { width: 50, align: "center" });

        // Unit Price
        doc.text(`£${item.unitPrice.toFixed(2)}`, 350, currentY, {
          width: 80,
          align: "right",
        });

        // Total Price
        doc.font("Helvetica-Bold");
        doc.text(`£${item.totalPrice.toFixed(2)}`, 430, currentY, {
          width: 82,
          align: "right",
        });
        doc.font("Helvetica");

        // Move to next item
        let itemHeight = nameHeight;
        if (item.weight && item.unit) itemHeight += 12;
        if (item.sku) itemHeight += 10;
        currentY = currentY + itemHeight + 8;
      }

      // Bottom border after items
      currentY = doc.y + 5;
      doc.moveTo(50, currentY).lineTo(562, currentY).stroke("#CCCCCC");

      // =====================================================
      // TOTALS SECTION
      // =====================================================
      currentY = currentY + 15;
      doc.y = currentY;
      doc.fontSize(11).font("Helvetica");

      // Subtotal
      doc.text("Subtotal:", 350, currentY);
      doc.text(`£${data.subtotal.toFixed(2)}`, 430, currentY, {
        width: 82,
        align: "right",
      });

      currentY = doc.y + 8;

      // Tax
      doc.text("Tax (8%):", 350, currentY);
      doc.text(`£${data.tax.toFixed(2)}`, 430, currentY, {
        width: 82,
        align: "right",
      });

      currentY = doc.y + 15;
      doc.moveTo(350, currentY).lineTo(562, currentY).stroke("#000000");

      // Total (bold and larger)
      currentY = currentY + 10;
      doc.fontSize(14).font("Helvetica-Bold");
      doc.text("TOTAL:", 350, currentY);
      doc.text(`£${data.total.toFixed(2)}`, 430, currentY, {
        width: 82,
        align: "right",
      });

      currentY = doc.y + 15;
      doc.moveTo(50, currentY).lineTo(562, currentY).stroke("#000000");

      // =====================================================
      // PAYMENT SECTION
      // =====================================================
      currentY = currentY + 15;
      doc.y = currentY;
      doc.fontSize(11).font("Helvetica-Bold");
      doc.text("PAYMENT DETAILS", 50, currentY);

      currentY = doc.y + 10;
      doc.font("Helvetica").fontSize(10);

      // Payment method
      const paymentMethodText = data.paymentMethod.toUpperCase();
      doc.text("Payment Method:", 50, currentY);
      doc.text(paymentMethodText, 200, currentY);

      currentY = doc.y + 8;

      // Cash payment details
      if (data.paymentMethod === "cash" && data.cashAmount !== undefined) {
        doc.text("Cash Received:", 50, currentY);
        doc.text(`£${data.cashAmount.toFixed(2)}`, 430, currentY, {
          width: 82,
          align: "right",
        });

        if (data.change !== undefined && data.change > 0) {
          currentY = doc.y + 8;
          doc.font("Helvetica-Bold");
          doc.text("Change:", 50, currentY);
          doc.text(`£${data.change.toFixed(2)}`, 430, currentY, {
            width: 82,
            align: "right",
          });
          doc.font("Helvetica");
        }
      }

      // Card payment details
      if (
        (data.paymentMethod === "card" || data.paymentMethod === "mobile") &&
        data.cardAmount !== undefined
      ) {
        doc.text("Card Amount:", 50, currentY);
        doc.text(`£${data.cardAmount.toFixed(2)}`, 430, currentY, {
          width: 82,
          align: "right",
        });
      }

      // Mixed payment
      if (data.paymentMethod === "mixed") {
        if (data.cashAmount !== undefined && data.cashAmount > 0) {
          doc.text("Cash:", 50, currentY);
          doc.text(`£${data.cashAmount.toFixed(2)}`, 430, currentY, {
            width: 82,
            align: "right",
          });
          currentY = doc.y + 8;
        }
        if (data.cardAmount !== undefined && data.cardAmount > 0) {
          doc.text("Card:", 50, currentY);
          doc.text(`£${data.cardAmount.toFixed(2)}`, 430, currentY, {
            width: 82,
            align: "right",
          });
        }
      }

      // =====================================================
      // LOYALTY SECTION (Optional)
      // =====================================================
      if (
        data.loyaltyPoints !== undefined ||
        data.loyaltyBalance !== undefined
      ) {
        currentY = doc.y + 15;
        doc.moveTo(50, currentY).lineTo(562, currentY).stroke("#CCCCCC");

        currentY = currentY + 10;
        doc.fontSize(10).font("Helvetica-Bold");
        doc.text("LOYALTY PROGRAM", 50, currentY);

        currentY = doc.y + 8;
        doc.font("Helvetica");

        if (data.loyaltyPoints !== undefined) {
          doc.text("Points Earned:", 50, currentY);
          doc.text(data.loyaltyPoints.toString(), 200, currentY);
          currentY = doc.y + 6;
        }

        if (data.loyaltyBalance !== undefined) {
          doc.text("Points Balance:", 50, currentY);
          doc.text(data.loyaltyBalance.toString(), 200, currentY);
        }
      }

      // =====================================================
      // FOOTER SECTION
      // =====================================================
      currentY = doc.y + 25;
      doc.moveTo(50, currentY).lineTo(562, currentY).stroke("#000000");

      currentY = currentY + 15;
      doc
        .fontSize(12)
        .font("Helvetica-Bold")
        .text("Thank you for shopping with us!", { align: "center" });

      currentY = doc.y + 10;
      doc
        .fontSize(9)
        .font("Helvetica")
        .text("Keep this receipt for returns and exchanges", {
          align: "center",
        });

      // Return policy
      if (data.returnPolicy) {
        currentY = doc.y + 10;
        doc.fontSize(8).fillColor("#666666");
        doc.text("RETURN POLICY", { align: "center" });
        currentY = doc.y + 5;
        doc.text(data.returnPolicy, 50, currentY, {
          align: "center",
          width: 462,
        });
        doc.fillColor("#000000");
      } else {
        currentY = doc.y + 10;
        doc.fontSize(8).fillColor("#666666");
        doc.text("Items can be returned within 30 days with receipt", {
          align: "center",
        });
        doc.text("Perishable items excluded", { align: "center" });
        doc.fillColor("#000000");
      }

      // Custom footer message
      if (data.footerMessage) {
        currentY = doc.y + 10;
        doc.fontSize(9).font("Helvetica-Bold");
        doc.text(data.footerMessage, { align: "center" });
      }

      // Transaction ID barcode/reference
      currentY = doc.y + 15;
      doc.fontSize(8).font("Helvetica").fillColor("#999999");
      doc.text(`Transaction Reference: ${data.transactionId}`, {
        align: "center",
      });
      doc.text(`Generated: ${new Date().toISOString()}`, { align: "center" });

      // Finalize PDF
      doc.end();
    } catch (error) {
      reject(error);
    }
  });
}

/**
 * Create receipt data from transaction information
 * Helper function to transform transaction data into ReceiptData format
 */
export function createReceiptData(
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

/**
 * Save PDF buffer to file
 * Note: This function should be called from the main process where Node.js fs is available
 * In renderer, use IPC to send buffer to main process for file operations
 */
export function savePDFToFile(
  _buffer: Buffer,
  _filePath: string
): Promise<void> {
  return new Promise((_resolve, reject) => {
    // This function is intended for main process use
    // In renderer, you should:
    // 1. Generate PDF buffer
    // 2. Send to main via IPC
    // 3. Main process saves and prints
    reject(
      new Error(
        "savePDFToFile should only be called from main process. Use IPC bridge instead."
      )
    );
  });
}

/**
 * Example usage:
 *
 * const receiptData = createReceiptData(
 *   transactionData,
 *   { name: "My Store", address: "123 Main St", phone: "555-1234" },
 *   { id: "cashier-1", name: "John Doe" }
 * );
 *
 * const pdfBuffer = await generatePDFReceipt(receiptData);
 * await savePDFToFile(pdfBuffer, "/tmp/receipt-123.pdf");
 *
 * // Then print via officePrinterAPI
 * await window.officePrinterAPI.print({
 *   jobId: "job-123",
 *   printerName: "HP Color LaserJet Pro MFP M3302fdw",
 *   documentPath: "/tmp/receipt-123.pdf",
 *   documentType: "pdf",
 *   options: { copies: 1, color: false }
 * });
 */
