/**
 * Login Page Object
 *
 * Encapsulates interactions with the user selection and PIN-based login page.
 */

import type { Page } from "@playwright/test";
import { BasePage } from "./BasePage";

export class LoginPage extends BasePage {
  // Selectors for user selection and PIN entry
  private readonly userSelectionHeading = 'text="Select User"';
  private readonly userButton = "button:has(h3)"; // User buttons contain h3 with name
  private readonly pinEntryHeading = 'text="Enter PIN"';
  private readonly pinDots = "text=/[●○]+/";
  private readonly numberButton = (digit: string) =>
    `button:has-text("${digit}")`;
  private readonly backButton = 'button:has-text("BACK")';
  private readonly deleteButton = 'button:has-text("DELETE")';
  private readonly errorMessage =
    '.text-red-500, .text-red-600, [class*="text-red"]';

  constructor(page: Page) {
    super(page);
  }

  /**
   * Navigate to login page
   */
  async navigate(): Promise<void> {
    await this.page.waitForLoadState("load");

    // Wait for body and root to be visible
    await this.page.waitForSelector("body", {
      timeout: 10000,
      state: "visible",
    });
    await this.page.waitForSelector("#root", {
      timeout: 10000,
      state: "visible",
    });

    // Wait for React to mount
    await this.page.waitForFunction(
      () => {
        const root = document.getElementById("root");
        if (!root) return false;

        // React must have actually mounted with children or be available
        return (
          root.children.length > 0 ||
          typeof (window as any).React !== "undefined"
        );
      },
      { timeout: 30000 }
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
    // Wait for "Select User" heading to be visible
    await this.page.waitForSelector(this.userSelectionHeading, {
      timeout,
      state: "visible",
    });
  }

  /**
   * Wait for PIN entry screen to be present
   */
  private async waitForPinEntryScreen(timeout: number = 10000): Promise<void> {
    // Wait for "Enter PIN" heading to be visible
    await this.page.waitForSelector(this.pinEntryHeading, {
      timeout,
      state: "visible",
    });
  }

  /**
   * Get all available users
   */
  async getAvailableUsers(): Promise<string[]> {
    await this.waitForUserSelection();

    const userButtons = this.page.locator(this.userButton);
    const count = await userButtons.count();
    const users: string[] = [];

    for (let i = 0; i < count; i++) {
      const userName = await userButtons.nth(i).locator("h3").textContent();
      if (userName) {
        users.push(userName.trim());
      }
    }

    return users;
  }

  /**
   * Select a user by name (firstName lastName) or by index
   */
  async selectUser(userNameOrIndex: string | number): Promise<void> {
    // Wait for user selection grid
    await this.waitForUserSelection();

    if (typeof userNameOrIndex === "number") {
      // Select by index
      const userButton = this.page
        .locator(this.userButton)
        .nth(userNameOrIndex);
      await userButton.click();
    } else {
      // Select by name
      const users = await this.getAvailableUsers();
      const matchingIndex = users.findIndex((name) =>
        name.toLowerCase().includes(userNameOrIndex.toLowerCase())
      );

      if (matchingIndex === -1) {
        // If no match found, try first user
        const userButton = this.page.locator(this.userButton).first();
        await userButton.click();
      } else {
        const userButton = this.page
          .locator(this.userButton)
          .nth(matchingIndex);
        await userButton.click();
      }
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
      const digitButton = this.page.locator(this.numberButton(digit)).first();
      await digitButton.click();
      // Small delay between keypad presses
      await this.page.waitForTimeout(200);
    }

    // If 4 digits entered, wait for auto-submit
    if (pin.length === 4) {
      await this.page.waitForTimeout(1000);
    }
  }

  /**
   * Perform login with user selection and PIN
   * @param userNameOrIndex - User name (partial match) or index number
   * @param pin - 4-digit PIN
   */
  async login(userNameOrIndex: string | number, pin: string): Promise<void> {
    // Select user
    await this.selectUser(userNameOrIndex);

    // Enter PIN (auto-submits when 4 digits entered)
    await this.enterPin(pin);
  }

  /**
   * Delete PIN digits (click delete button)
   */
  async deletePin(times: number = 1): Promise<void> {
    await this.waitForPinEntryScreen();

    for (let i = 0; i < times; i++) {
      const deleteButton = this.page.locator(this.deleteButton).first();
      await deleteButton.click();
      await this.page.waitForTimeout(200);
    }
  }

  /**
   * Go back to user selection from PIN entry
   */
  async goBackToUserSelection(): Promise<void> {
    const backButton = this.page.locator(this.backButton).first();
    await backButton.click();
    await this.waitForUserSelection();
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
      const errorElements = await this.page.locator(this.errorMessage).count();
      return errorElements > 0;
    } catch {
      return false;
    }
  }

  /**
   * Check if user selection grid is visible
   */
  async isUserSelectionVisible(): Promise<boolean> {
    try {
      const heading = this.page.locator(this.userSelectionHeading);
      return await heading.isVisible();
    } catch {
      return false;
    }
  }

  /**
   * Check if PIN entry screen is visible
   */
  async isPinEntryVisible(): Promise<boolean> {
    try {
      const heading = this.page.locator(this.pinEntryHeading);
      return await heading.isVisible();
    } catch {
      return false;
    }
  }

  /**
   * Get selected user name (from PIN entry screen)
   */
  async getSelectedUserName(): Promise<string> {
    await this.waitForPinEntryScreen();
    // Look for the user name in the PIN entry screen
    const userName = this.page.locator("h2").filter({ hasText: /\w+\s+\w+/ });
    if ((await userName.count()) > 0) {
      return (await userName.first().textContent()) || "";
    }
    return "";
  }

  /**
   * Quick login helper (combines navigate + login)
   */
  async quickLogin(
    userNameOrIndex: string | number,
    pin: string
  ): Promise<void> {
    await this.navigate();
    await this.login(userNameOrIndex, pin);
    await this.isLoggedIn();
  }
}
