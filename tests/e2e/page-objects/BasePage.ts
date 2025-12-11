/**
 * Base Page Object
 * 
 * Common functionality shared by all page objects.
 * Provides reusable methods for E2E tests.
 */

import type { Page } from '@playwright/test';

export class BasePage {
  constructor(protected page: Page) {}

  /**
   * Wait for page to be fully loaded
   */
  async waitForPageLoad(timeout: number = 5000): Promise<void> {
    await this.page.waitForLoadState('domcontentloaded');
    await this.page.waitForLoadState('networkidle', { timeout });
  }

  /**
   * Navigate to a specific hash route
   */
  async navigateToHash(hash: string): Promise<void> {
    const currentUrl = this.page.url();
    const baseUrl = currentUrl.split('#')[0];
    await this.page.goto(`${baseUrl}#${hash}`);
    await this.waitForPageLoad();
  }

  /**
   * Get current hash route
   */
  getCurrentHash(): string {
    const url = this.page.url();
    return url.split('#')[1] || '';
  }

  /**
   * Click element with retry
   */
  async clickWithRetry(selector: string, maxRetries: number = 3): Promise<void> {
    for (let i = 0; i < maxRetries; i++) {
      try {
        await this.page.click(selector, { timeout: 5000 });
        return;
      } catch (error) {
        if (i === maxRetries - 1) throw error;
        await this.page.waitForTimeout(1000);
      }
    }
  }

  /**
   * Fill input with validation
   */
  async fillInput(selector: string, value: string): Promise<void> {
    await this.page.fill(selector, value);
    
    // Verify value was set
    const actualValue = await this.page.inputValue(selector);
    if (actualValue !== value) {
      throw new Error(`Failed to set input value. Expected: ${value}, Got: ${actualValue}`);
    }
  }

  /**
   * Wait for element and check visibility
   */
  async waitForElement(selector: string, timeout: number = 5000): Promise<void> {
    await this.page.waitForSelector(selector, { state: 'visible', timeout });
  }

  /**
   * Check if element exists (without waiting)
   */
  async elementExists(selector: string): Promise<boolean> {
    return (await this.page.locator(selector).count()) > 0;
  }

  /**
   * Get text content of element
   */
  async getTextContent(selector: string): Promise<string> {
    const element = await this.page.locator(selector);
    return (await element.textContent()) || '';
  }

  /**
   * Take screenshot with descriptive name
   */
  async takeScreenshot(name: string): Promise<void> {
    await this.page.screenshot({ 
      path: `test-results/screenshots/${name}-${Date.now()}.png`,
      fullPage: true 
    });
  }

  /**
   * Wait for notification/toast to appear
   */
  async waitForNotification(text?: string, timeout: number = 5000): Promise<void> {
    if (text) {
      await this.page.waitForSelector(`text=${text}`, { timeout });
    } else {
      // Wait for any toast/notification
      await this.page.waitForSelector('[role="alert"], .toast, .notification', { timeout });
    }
  }

  /**
   * Clear browser storage (localStorage, sessionStorage)
   */
  async clearStorage(): Promise<void> {
    await this.page.evaluate(() => {
      localStorage.clear();
      sessionStorage.clear();
    });
  }

  /**
   * Get localStorage value
   */
  async getLocalStorageItem(key: string): Promise<string | null> {
    return await this.page.evaluate((k) => localStorage.getItem(k), key);
  }

  /**
   * Set localStorage value
   */
  async setLocalStorageItem(key: string, value: string): Promise<void> {
    await this.page.evaluate(
      ({ k, v }) => localStorage.setItem(k, v),
      { k: key, v: value }
    );
  }

  /**
   * Wait for URL to contain specific hash
   */
  async waitForHashRoute(hash: string, timeout: number = 5000): Promise<void> {
    await this.page.waitForURL(`**#${hash}`, { timeout });
  }

  /**
   * Reload page and wait for load
   */
  async reload(): Promise<void> {
    await this.page.reload();
    await this.waitForPageLoad();
  }
}

