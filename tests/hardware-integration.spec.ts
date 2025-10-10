/**
 * Hardware Integration Tests for AuraSwift POS System
 * Tests hardware API exposure and native module loading
 */

import { test, expect } from "@playwright/test";
import type { ElectronApplication } from "playwright";
import { _electron as electron } from "playwright";

process.env.HARDWARE_SIMULATION_MODE = "true";
process.env.PLAYWRIGHT_TEST = "true";

test.describe("Hardware Integration Tests", () => {
  let electronApp: ElectronApplication;

  test.beforeAll(async () => {
    electronApp = await electron.launch({
      args: ["packages/entry-point.mjs"],
      env: {
        ...process.env,
        NODE_ENV: "test",
        HARDWARE_SIMULATION_MODE: "true",
        ELECTRON_DISABLE_GPU: "1",
        ELECTRON_NO_SANDBOX: "1",
      },
    });
  });

  test.afterAll(async () => {
    await electronApp.close();
  });

  test("Native modules are available through main process", async () => {
    const page = await electronApp.firstWindow();
    await page.waitForLoadState("load");
    await page.waitForTimeout(2000);

    // Test if database API is working (better-sqlite3 integration)
    const databaseAPI = await page.evaluate(() => {
      return typeof (window as any).databaseAPI === "object";
    });

    // Test if hardware APIs that depend on native modules are available
    const hardwareAPIs = await page.evaluate(() => {
      return {
        printerAPI: typeof (window as any).printerAPI === "object",
        paymentAPI: typeof (window as any).paymentAPI === "object",
        databaseAPI: typeof (window as any).databaseAPI === "object",
      };
    });

    console.log("Hardware API Status:", hardwareAPIs);

    // All APIs should be available (indicating native modules loaded successfully in main process)
    expect(hardwareAPIs.databaseAPI).toBe(true);
    expect(hardwareAPIs.printerAPI).toBe(true);
    expect(hardwareAPIs.paymentAPI).toBe(true);
  });

  test("Hardware APIs are exposed", async () => {
    const page = await electronApp.firstWindow();
    await page.waitForLoadState("load");
    await page.waitForTimeout(2000);

    const hardwareAPIs = await page.evaluate(() => {
      return {
        printerAPI: typeof (window as any).printerAPI === "object",
        paymentAPI: typeof (window as any).paymentAPI === "object",
      };
    });

    expect(hardwareAPIs.printerAPI).toBe(true);
    expect(hardwareAPIs.paymentAPI).toBe(true);
  });

  test("Printer API methods are available", async () => {
    const page = await electronApp.firstWindow();
    await page.waitForLoadState("load");
    await page.waitForTimeout(2000);

    const printerMethods = await page.evaluate(() => {
      const api = (window as any).printerAPI;
      return api ? Object.keys(api) : [];
    });

    expect(printerMethods).toContain("getStatus");
    expect(printerMethods).toContain("connect");
    expect(printerMethods).toContain("printReceipt");
  });

  test("Payment API methods are available", async () => {
    const page = await electronApp.firstWindow();
    await page.waitForLoadState("load");
    await page.waitForTimeout(2000);

    const paymentMethods = await page.evaluate(() => {
      const api = (window as any).paymentAPI;
      return api ? Object.keys(api) : [];
    });

    expect(paymentMethods).toContain("initializeReader");
    expect(paymentMethods).toContain("getReaderStatus");
    expect(paymentMethods).toContain("processCardPayment");
  });
});
