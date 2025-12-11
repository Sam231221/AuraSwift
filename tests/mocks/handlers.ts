/**
 * MSW Request Handlers for API Mocking
 *
 * This file contains all HTTP request handlers for mocking external APIs
 * during testing. Add new handlers as needed for integration tests.
 *
 * @see https://mswjs.io/docs/
 */

import { http, HttpResponse } from "msw";

/**
 * Viva Wallet API Mock Handlers
 */
export const vivaWalletHandlers = [
  // Mock payment initialization
  http.post(
    "https://demo.vivapayments.com/api/payment",
    async ({ request }) => {
      const body = (await request.json()) as any;

      return HttpResponse.json({
        transactionId: `mock-viva-txn-${Date.now()}`,
        status: "PENDING",
        amount: body.amount,
        currency: body.currency || "GBP",
        createdAt: new Date().toISOString(),
      });
    }
  ),

  // Mock payment status check
  http.get(
    "https://demo.vivapayments.com/api/payment/:transactionId",
    ({ params }) => {
      const { transactionId } = params;

      return HttpResponse.json({
        transactionId,
        status: "COMPLETED",
        amount: 10000, // £100.00 in pence
        currency: "GBP",
        completedAt: new Date().toISOString(),
      });
    }
  ),

  // Mock payment cancellation
  http.post(
    "https://demo.vivapayments.com/api/payment/:transactionId/cancel",
    ({ params }) => {
      const { transactionId } = params;

      return HttpResponse.json({
        transactionId,
        status: "CANCELLED",
        cancelledAt: new Date().toISOString(),
      });
    }
  ),
];

/**
 * Receipt Printer Service Mock Handlers
 */
export const printerHandlers = [
  // Mock print job submission
  http.post("/api/printer/print", async ({ request }) => {
    const body = (await request.json()) as any;

    return HttpResponse.json({
      success: true,
      jobId: `print-job-${Date.now()}`,
      status: "queued",
      receipt: body.receipt,
    });
  }),

  // Mock printer status check
  http.get("/api/printer/status", () => {
    return HttpResponse.json({
      connected: true,
      ready: true,
      paperLevel: 75,
      model: "Mock Thermal Printer",
    });
  }),
];

/**
 * Barcode Scanner API Mock Handlers
 */
export const scannerHandlers = [
  // Mock barcode lookup
  http.get("/api/barcode/:code", ({ params }) => {
    const { code } = params;

    // Simulate product lookup
    if (code === "0000000000000") {
      return new HttpResponse(null, { status: 404 });
    }

    return HttpResponse.json({
      barcode: code,
      productId: `product-${code}`,
      name: `Product for barcode ${code}`,
      price: 999, // £9.99 in pence
      stock: 50,
    });
  }),
];

/**
 * Scale Hardware API Mock Handlers
 */
export const scaleHandlers = [
  // Mock weight reading
  http.get("/api/scale/weight", () => {
    return HttpResponse.json({
      weight: 1.234, // kg
      stable: true,
      unit: "kg",
      timestamp: Date.now(),
    });
  }),

  // Mock scale connection status
  http.get("/api/scale/status", () => {
    return HttpResponse.json({
      connected: true,
      calibrated: true,
      model: "Mock Digital Scale",
    });
  }),
];

/**
 * Error Scenarios for Testing
 */
export const errorHandlers = [
  // Network error simulation
  http.post("/api/payment/network-error", () => {
    return HttpResponse.error();
  }),

  // Timeout simulation
  http.post("/api/payment/timeout", async () => {
    await new Promise((resolve) => setTimeout(resolve, 30000));
    return HttpResponse.json({ timeout: true });
  }),

  // Server error
  http.post("/api/payment/server-error", () => {
    return new HttpResponse(null, { status: 500 });
  }),

  // Validation error
  http.post("/api/payment/validation-error", () => {
    return HttpResponse.json(
      {
        error: "VALIDATION_ERROR",
        message: "Invalid payment amount",
        details: { amount: "Must be greater than 0" },
      },
      { status: 400 }
    );
  }),
];

/**
 * Combined default handlers
 * Export this array to use in MSW setup
 */
export const handlers = [
  ...vivaWalletHandlers,
  ...printerHandlers,
  ...scannerHandlers,
  ...scaleHandlers,
  // Error handlers are opt-in, import them explicitly when needed
];
