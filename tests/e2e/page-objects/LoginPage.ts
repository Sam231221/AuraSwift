/**
 * Login Page Object
 *
 * Encapsulates interactions with the user selection and PIN-based login page.
 */

import type { Page } from "@playwright/test";
import { BasePage } from "./BasePage";

export class LoginPage extends BasePage {
  // Selectors for user selection and PIN entry
  private readonly userSelectionGrid = 'text="Select User"';
  private readonly userButton =
    'button:has-text("Select User") ~ div button, [role="button"]:has-text("Select User")';
  private readonly pinEntryScreen = 'text="Enter PIN"';
  private readonly pinKeypadButton =
    'button:has-text("0"), button:has-text("1"), button:has-text("2"), button:has-text("3"), button:has-text("4"), button:has-text("5"), button:has-text("6"), button:has-text("7"), button:has-text("8"), button:has-text("9")';
  private readonly pinDeleteButton =
    'button[aria-label*="delete" i], button:has([data-lucide="delete"]), button:has([data-lucide="Delete"])';
  private readonly backButton =
    'button[aria-label*="back" i], button:has([data-lucide="arrow-left"]), button:has([data-lucide="ArrowLeft"])';
  private readonly errorMessage =
    '[data-testid="error-message"], .error-message, .error, [role="alert"], .text-red-600, .text-red-500';
  private readonly loadingSpinner =
    '[class*="animate-spin"], [class*="spinner"]';

  constructor(page: Page) {
    super(page);
  }

  /**
   * Navigate to login page
   */
  async navigate(): Promise<void> {
    await this.page.waitForLoadState("load");

    // Wait for React to mount
    await this.page.waitForFunction(
      () => {
        const root = document.getElementById("root");
        return root && root.children.length > 0;
      },
      { timeout: 10000 }
    );

    // Ensure we're on the auth page
    const currentHash = this.getCurrentHash();
    if (!currentHash.includes("/auth")) {
      await this.navigateToHash("/auth");
      // Wait for router to navigate
      await this.page.waitForFunction(
        () => window.location.hash.includes("/auth"),
        { timeout: 5000 }
      );
    }

    // Wait for user selection grid to be present
    await this.waitForUserSelection();
  }

  /**
   * Wait for user selection grid to be present
   */
  private async waitForUserSelection(timeout: number = 10000): Promise<void> {
    // Wait for "Select User" heading to appear
    await this.page.waitForSelector('text="Select User"', {
      timeout,
      state: "visible",
    });
  }

  /**
   * Wait for PIN entry screen to be present
   */
  private async waitForPinEntryScreen(timeout: number = 10000): Promise<void> {
    // Wait for "Enter PIN" heading to appear
    await this.page.waitForSelector('text="Enter PIN"', {
      timeout,
      state: "visible",
    });
  }

  /**
   * Select a user by name (firstName lastName)
   */
  async selectUser(userName: string): Promise<void> {
    // Wait for user selection grid
    await this.waitForUserSelection();

    // Find user button by name (firstName lastName)
    const userButton = this.page
      .locator(`button:has-text("${userName}")`)
      .first();

    if ((await userButton.count()) === 0) {
      // Try finding by partial name match
      const parts = userName.split(" ");
      if (parts.length >= 2) {
        const firstName = parts[0];
        const lastName = parts[parts.length - 1];
        const userByFirst = this.page
          .locator(`button:has-text("${firstName}")`)
          .first();
        const userByLast = this.page
          .locator(`button:has-text("${lastName}")`)
          .first();

        if ((await userByFirst.count()) > 0) {
          await userByFirst.click();
        } else if ((await userByLast.count()) > 0) {
          await userByLast.click();
        } else {
          throw new Error(`Could not find user: ${userName}`);
        }
      } else {
        throw new Error(`Could not find user: ${userName}`);
      }
    } else {
      await userButton.click();
    }

    // Wait for PIN entry screen to appear
    await this.waitForPinEntryScreen();
  }

  /**
   * Enter PIN using the numeric keypad
   */
  async enterPin(pin: string): Promise<void> {
    // Wait for PIN entry screen
    await this.waitForPinEntryScreen();

    // Enter each digit of the PIN
    for (const digit of pin) {
      const digitButton = this.page
        .locator(`button:has-text("${digit}")`)
        .first();

      if ((await digitButton.count()) === 0) {
        throw new Error(`Could not find PIN keypad button for digit: ${digit}`);
      }

      await digitButton.click();
      // Small delay between keypad presses
      await this.page.waitForTimeout(100);
    }

    // PIN auto-submits when 4 digits are entered, so wait a bit
    await this.page.waitForTimeout(500);
  }

  /**
   * Perform login with user selection and PIN
   * @param userName - Full name (firstName lastName) or username
   * @param pin - 4-digit PIN
   */
  async login(userName: string, pin: string): Promise<void> {
    // Select user
    await this.selectUser(userName);

    // Enter PIN (auto-submits when 4 digits entered)
    await this.enterPin(pin);
  }

  /**
   * Delete PIN digits (click delete button)
   */
  async deletePin(times: number = 1): Promise<void> {
    await this.waitForPinEntryScreen();

    for (let i = 0; i < times; i++) {
      const deleteButton = this.page.locator(this.pinDeleteButton).first();
      if ((await deleteButton.count()) > 0) {
        await deleteButton.click();
        await this.page.waitForTimeout(100);
      }
    }
  }

  /**
   * Go back to user selection from PIN entry
   */
  async goBackToUserSelection(): Promise<void> {
    const backButton = this.page.locator(this.backButton).first();
    if ((await backButton.count()) > 0) {
      await backButton.click();
      await this.waitForUserSelection();
    }
  }

  /**
   * Check if login was successful (redirected to dashboard)
   */
  async isLoggedIn(timeout: number = 10000): Promise<boolean> {
    try {
      // Wait for URL to contain dashboard hash
      await this.page.waitForFunction(
        () => window.location.hash.includes("/dashboard"),
        { timeout }
      );
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Get error message displayed on login failure
   */
  async getErrorMessage(timeout: number = 5000): Promise<string> {
    // Wait for error message to appear
    await this.page.waitForSelector(this.errorMessage, {
      timeout,
      state: "visible",
    });
    return await this.getTextContent(this.errorMessage);
  }

  /**
   * Check if error message is displayed
   */
  async hasErrorMessage(timeout: number = 5000): Promise<boolean> {
    try {
      // Wait a bit for error message to appear after failed login
      await this.page.waitForTimeout(1000);
      return await this.elementExists(this.errorMessage);
    } catch {
      return false;
    }
  }

  /**
   * Check if user selection grid is visible
   */
  async isUserSelectionVisible(): Promise<boolean> {
    return await this.elementExists('text="Select User"');
  }

  /**
   * Check if PIN entry screen is visible
   */
  async isPinEntryVisible(): Promise<boolean> {
    return await this.elementExists('text="Enter PIN"');
  }

  /**
   * Get selected user name (from PIN entry screen)
   */
  async getSelectedUserName(): Promise<string> {
    await this.waitForPinEntryScreen();
    // The user name should be visible in the PIN entry screen
    const userNameElement = this.page
      .locator("h3, h2")
      .filter({ hasText: /^[A-Z][a-z]+ [A-Z][a-z]+$/ });
    if ((await userNameElement.count()) > 0) {
      return (await userNameElement.first().textContent()) || "";
    }
    return "";
  }

  /**
   * Quick login helper (combines navigate + login)
   */
  async quickLogin(userName: string, pin: string): Promise<void> {
    await this.navigate();
    await this.login(userName, pin);
    await this.isLoggedIn();
  }
}
