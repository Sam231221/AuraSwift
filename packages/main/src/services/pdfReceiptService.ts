/**
 * PDF Receipt Generation Service (Main Process)
 * Generates PDF receipts using pdfkit in Node.js environment
 * Exposes IPC handler for renderer process to request PDF generation
 */

import { ipcMain } from "electron";
import PDFDocument from "pdfkit";

interface ReceiptItem {
  name: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  weight?: number;
  unit?: string;
  sku?: string;
}

interface ReceiptData {
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
  footerMessage?: string;
}

/**
 * Generate PDF receipt buffer
 */
async function generatePDFReceipt(data: ReceiptData): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({
        size: "LETTER",
        margins: {
          top: 50,
          bottom: 50,
          left: 60,
          right: 60,
        },
      });

      const buffers: Buffer[] = [];
      doc.on("data", buffers.push.bind(buffers));
      doc.on("end", () => {
        const pdfBuffer = Buffer.concat(buffers);
        resolve(pdfBuffer);
      });
      doc.on("error", reject);

      let y = 50; // Start position
      const pageWidth = 612 - 120; // Letter width minus margins
      const leftMargin = 60;
      const rightMargin = 60;

      // ========================================
      // HEADER SECTION
      // ========================================
      doc.font("Helvetica-Bold").fontSize(24);
      doc.text(data.storeName, leftMargin, y, {
        width: pageWidth,
        align: "center",
      });
      y += 35;

      doc.font("Helvetica").fontSize(10);
      doc.text(data.storeAddress, leftMargin, y, {
        width: pageWidth,
        align: "center",
      });
      y += 15;

      doc.text(data.storePhone, leftMargin, y, {
        width: pageWidth,
        align: "center",
      });
      y += 15;

      if (data.vatNumber) {
        doc.text(`VAT: ${data.vatNumber}`, leftMargin, y, {
          width: pageWidth,
          align: "center",
        });
        y += 15;
      }

      y += 10;
      doc
        .moveTo(leftMargin, y)
        .lineTo(612 - rightMargin, y)
        .stroke("#000000");
      y += 20;

      // ========================================
      // RECEIPT TITLE
      // ========================================
      doc.font("Helvetica-Bold").fontSize(18);
      doc.text("RECEIPT", leftMargin, y, {
        width: pageWidth,
        align: "center",
      });
      y += 30;

      // ========================================
      // TRANSACTION INFO
      // ========================================
      doc.font("Helvetica").fontSize(10);

      // Left column
      doc.text(`Receipt #: ${data.receiptNumber}`, leftMargin, y);
      // Right column
      doc.text(`Date: ${data.date}`, leftMargin + 300, y, {
        width: 200,
        align: "right",
      });
      y += 15;

      doc.text(`Transaction: ${data.transactionId}`, leftMargin, y);
      doc.text(`Time: ${data.time}`, leftMargin + 300, y, {
        width: 200,
        align: "right",
      });
      y += 15;

      y += 25;

      // ========================================
      // ITEMS SECTION HEADER
      // ========================================
      doc
        .moveTo(leftMargin, y)
        .lineTo(612 - rightMargin, y)
        .stroke("#000000");
      y += 12;

      doc.font("Helvetica-Bold").fontSize(10);
      doc.text("Item", leftMargin, y);
      doc.text("Qty", leftMargin + 280, y, { width: 60, align: "center" });
      doc.text("Price", leftMargin + 340, y, { width: 80, align: "right" });
      doc.text("Total", leftMargin + 420, y, { width: 80, align: "right" });
      y += 15;

      doc
        .moveTo(leftMargin, y)
        .lineTo(612 - rightMargin, y)
        .stroke("#CCCCCC");
      y += 12;

      // ========================================
      // ITEMS LIST
      // ========================================
      doc.font("Helvetica").fontSize(10);

      for (const item of data.items) {
        // Check if we need a new page
        if (y > 680) {
          doc.addPage();
          y = 50;
        }

        const itemStartY = y;

        // Item name (with wrapping support)
        doc.text(item.name, leftMargin, y, { width: 260, continued: false });
        const nameHeight = doc.heightOfString(item.name, { width: 260 });

        // SKU on next line if exists
        let skuHeight = 0;
        if (item.sku) {
          y += nameHeight + 2;
          doc.fontSize(8).fillColor("#666666");
          doc.text(`SKU: ${item.sku}`, leftMargin + 10, y);
          skuHeight = 10;
          doc.fontSize(10).fillColor("#000000");
        }

        // Quantity (aligned to same line as item name)
        const qtyText = `${item.quantity} × £${item.unitPrice.toFixed(2)}`;
        doc.text(qtyText, leftMargin + 280, itemStartY, {
          width: 60,
          align: "center",
        });

        // Unit Price
        doc.text(
          `£${item.unitPrice.toFixed(2)}`,
          leftMargin + 340,
          itemStartY,
          {
            width: 80,
            align: "right",
          }
        );

        // Total Price
        doc.text(
          `£${item.totalPrice.toFixed(2)}`,
          leftMargin + 420,
          itemStartY,
          {
            width: 80,
            align: "right",
          }
        );

        // Move Y position for next item
        y = itemStartY + Math.max(nameHeight, 12) + skuHeight + 8;
      }

      y += 10;

      // ========================================
      // TOTALS SECTION
      // ========================================
      doc
        .moveTo(leftMargin, y)
        .lineTo(612 - rightMargin, y)
        .stroke("#CCCCCC");
      y += 15;

      doc.font("Helvetica").fontSize(11);

      // Subtotal
      doc.text("Subtotal:", leftMargin + 320, y);
      doc.text(`£${data.subtotal.toFixed(2)}`, leftMargin + 420, y, {
        width: 80,
        align: "right",
      });
      y += 18;

      // Tax
      doc.text("Tax:", leftMargin + 320, y);
      doc.text(`£${data.tax.toFixed(2)}`, leftMargin + 420, y, {
        width: 80,
        align: "right",
      });
      y += 15;

      // Total line
      doc
        .moveTo(leftMargin + 320, y)
        .lineTo(612 - rightMargin, y)
        .stroke("#000000");
      y += 12;

      // Total amount
      doc.font("Helvetica-Bold").fontSize(14);
      doc.text("TOTAL:", leftMargin + 320, y);
      doc.text(`£${data.total.toFixed(2)}`, leftMargin + 420, y, {
        width: 80,
        align: "right",
      });
      y += 25;

      // ========================================
      // PAYMENT DETAILS
      // ========================================
      if (data.paymentMethod === "cash" && data.cashAmount) {
        doc.font("Helvetica").fontSize(11);

        doc.text("Cash Received:", leftMargin + 320, y);
        doc.text(`£${data.cashAmount.toFixed(2)}`, leftMargin + 420, y, {
          width: 80,
          align: "right",
        });
        y += 18;

        if (data.change && data.change > 0) {
          doc.text("Change:", leftMargin + 320, y);
          doc.text(`£${data.change.toFixed(2)}`, leftMargin + 420, y, {
            width: 80,
            align: "right",
          });
          y += 20;
        }
      }

      y += 15;

      // ========================================
      // FOOTER SECTION
      // ========================================
      doc
        .moveTo(leftMargin, y)
        .lineTo(612 - rightMargin, y)
        .stroke("#000000");
      y += 20;

      doc.font("Helvetica-Bold").fontSize(13);
      doc.text("Thank you for your business!", leftMargin, y, {
        width: pageWidth,
        align: "center",
      });
      y += 25;

      if (data.returnPolicy) {
        doc.fontSize(8).font("Helvetica").fillColor("#666666");
        doc.text(data.returnPolicy, leftMargin, y, {
          width: pageWidth,
          align: "center",
        });
        doc.fillColor("#000000");
        y += 20;
      }

      doc.fontSize(8).font("Helvetica").fillColor("#999999");
      doc.text(`Transaction Reference: ${data.transactionId}`, leftMargin, y, {
        width: pageWidth,
        align: "center",
      });

      doc.end();
    } catch (error) {
      reject(error);
    }
  });
}

/**
 * Initialize IPC handlers for PDF receipt generation
 */
export function initializePDFReceiptService() {
  // Handle PDF generation request from renderer
  ipcMain.handle(
    "receipt:generate-pdf",
    async (_event, receiptData: ReceiptData) => {
      try {
        console.log("📄 Generating PDF receipt:", receiptData.receiptNumber);

        const pdfBuffer = await generatePDFReceipt(receiptData);

        console.log(
          "✅ PDF receipt generated successfully, size:",
          pdfBuffer.length,
          "bytes"
        );

        // Return buffer as base64 string for safe IPC transfer
        return {
          success: true,
          data: pdfBuffer.toString("base64"),
        };
      } catch (error) {
        console.error("❌ Error generating PDF receipt:", error);
        return {
          success: false,
          error: error instanceof Error ? error.message : "Unknown error",
        };
      }
    }
  );

  console.log("✅ PDF Receipt Service initialized");
}

// Auto-initialize when module is imported
initializePDFReceiptService();
