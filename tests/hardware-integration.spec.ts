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

  test("Native modules can be loaded", async () => {
    const moduleStatus = await electronApp.evaluate(() => {
      const modules = [];

      try {
        require("better-sqlite3");
        modules.push({ name: "better-sqlite3", loaded: true });
      } catch (e) {
        modules.push({
          name: "better-sqlite3",
          loaded: false,
          error: String(e),
        });
      }

      try {
        require("node-hid");
        modules.push({ name: "node-hid", loaded: true });
      } catch (e) {
        modules.push({ name: "node-hid", loaded: false, error: String(e) });
      }

      try {
        require("serialport");
        modules.push({ name: "serialport", loaded: true });
      } catch (e) {
        modules.push({ name: "serialport", loaded: false, error: String(e) });
      }

      try {
        require("usb");
        modules.push({ name: "usb", loaded: true });
      } catch (e) {
        modules.push({ name: "usb", loaded: false, error: String(e) });
      }

      return modules;
    });

    console.log("Native Module Status:", moduleStatus);

    // All modules should load successfully
    moduleStatus.forEach((module) => {
      expect(module.loaded).toBe(true);
    });
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
