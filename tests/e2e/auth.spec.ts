/**
 * E2E Tests for Authentication Flow
 *
 * Tests the complete authentication journey including login, logout,
 * and session management in the Electron app.
 */

import { expect } from "@playwright/test";
import { LoginPage } from "./page-objects/LoginPage";

// Use the existing E2E test fixtures from e2e.spec.ts
import { test as electronTest } from "../e2e.spec";

electronTest.describe("Authentication Flow", () => {
  let loginPage: LoginPage;

  electronTest.beforeEach(async ({ electronApp }) => {
    const page = await electronApp.firstWindow();
    loginPage = new LoginPage(page);

    // Clear any existing session
    await loginPage.clearStorage();
    await loginPage.navigate();
  });

   electronTest.describe("Login", () => {
     electronTest(
       "should successfully login with valid user and PIN",
       async ({ electronApp }) => {
         const page = await electronApp.firstWindow();

         // Attempt login with test user and PIN
         // Replace with actual test user name from your system
         await loginPage.login("Test Cashier", "1234");

         // Verify redirected to dashboard
         const isLoggedIn = await loginPage.isLoggedIn();
         expect(isLoggedIn).toBe(true);

         // Verify dashboard URL
         const url = page.url();
         expect(url).toContain("#/dashboard");

         // Take screenshot for visual verification
         await loginPage.takeScreenshot("successful-login");
       }
     );

     electronTest(
       "should show error message for invalid PIN",
       async ({ electronApp }) => {
         const page = await electronApp.firstWindow();
         
         // Select a valid user but enter wrong PIN
         await loginPage.selectUser("Test Cashier");
         await loginPage.enterPin("9999");

         // Wait for error to appear (PIN auto-submits on 4 digits)
         await page.waitForTimeout(2000);

         // Should stay on login page (PIN entry screen)
         const isLoggedIn = await loginPage.isLoggedIn(2000);
         expect(isLoggedIn).toBe(false);

         // Should show error message
         const hasError = await loginPage.hasErrorMessage();
         expect(hasError).toBe(true);
       }
     );

     electronTest("should allow going back to user selection", async () => {
       // Select a user
       await loginPage.selectUser("Test Cashier");

       // Verify PIN entry screen is visible
       const isPinVisible = await loginPage.isPinEntryVisible();
       expect(isPinVisible).toBe(true);

       // Go back to user selection
       await loginPage.goBackToUserSelection();

       // Verify user selection is visible again
       const isUserSelectionVisible = await loginPage.isUserSelectionVisible();
       expect(isUserSelectionVisible).toBe(true);
     });

     electronTest("should allow deleting PIN digits", async ({ electronApp }) => {
       const page = await electronApp.firstWindow();
       
       // Select a user
       await loginPage.selectUser("Test Cashier");

       // Enter some PIN digits
       await loginPage.enterPin("12");

       // Delete one digit
       await loginPage.deletePin(1);

       // Should be able to continue entering PIN
       await loginPage.enterPin("34");

       // PIN should auto-submit when 4 digits are entered
       await page.waitForTimeout(1000);
     });

     electronTest(
       "should persist session after window reload",
       async ({ electronApp }) => {
         const page = await electronApp.firstWindow();

         // Login successfully
         await loginPage.login("Test Cashier", "1234");
         const loggedIn = await loginPage.isLoggedIn(15000);

         // Only proceed if login was successful
         expect(loggedIn).toBe(true);

        // Reload the page
        await page.reload();
        await page.waitForLoadState("domcontentloaded");

        // Wait for React to mount after reload
        await page.waitForFunction(
          () => {
            const root = document.getElementById("root");
            return root && root.children.length > 0;
          },
          { timeout: 10000 }
        );

        // Wait for router to navigate (should stay on dashboard if session persisted)
        await page.waitForFunction(() => window.location.hash.length > 0, {
          timeout: 5000,
        });

        // Should still be on dashboard (session persisted)
        const url = page.url();
        expect(url).toContain("#/dashboard");
      }
    );
  });

  electronTest.describe("Logout", () => {
    electronTest.beforeEach(async ({ electronApp }) => {
      const page = await electronApp.firstWindow();

      // Login before each logout test
      await loginPage.login("Test Cashier", "1234");
      const loggedIn = await loginPage.isLoggedIn(15000);

      // Ensure login was successful before testing logout
      expect(loggedIn).toBe(true);

      // Ensure we're on dashboard before logout tests
      await page.waitForFunction(
        () => window.location.hash.includes("/dashboard"),
        { timeout: 5000 }
      );
    });

    electronTest("should successfully logout", async ({ electronApp }) => {
      const page = await electronApp.firstWindow();

      // Trigger logout
      await page.evaluate(() => {
        return (window as any).authAPI?.logout();
      });

      // Wait for redirect to auth page (router navigation)
      await page.waitForFunction(() => window.location.hash.includes("/auth"), {
        timeout: 10000,
      });

      const url = page.url();
      expect(url).toContain("#/auth");
    });

    electronTest(
      "should clear session data on logout",
      async ({ electronApp }) => {
        const page = await electronApp.firstWindow();

        // Logout
        await page.evaluate(() => {
          return (window as any).authAPI?.logout();
        });

        // Wait for logout to complete (router navigates to auth)
        await page.waitForFunction(
          () => window.location.hash.includes("/auth"),
          { timeout: 10000 }
        );

        // Verify session cleared
        const sessionData = await loginPage.getLocalStorageItem("auth_token");
        expect(sessionData).toBeNull();
      }
    );

    electronTest(
      "should redirect to login after logout",
      async ({ electronApp }) => {
        const page = await electronApp.firstWindow();

        await page.evaluate(() => {
          return (window as any).authAPI?.logout();
        });

        // Wait for hash route to change to /auth
        await page.waitForFunction(
          () => window.location.hash.includes("/auth"),
          { timeout: 10000 }
        );

        const url = page.url();
        expect(url).toContain("#/auth");
      }
    );
  });

  electronTest.describe("Session Management", () => {
     electronTest(
       "should validate active session on app start",
       async ({ electronApp }) => {
         const page = await electronApp.firstWindow();

         // Login to create session
         await loginPage.login("Test Cashier", "1234");
         await loginPage.isLoggedIn();

        // Close and reopen would test session persistence
        // In Electron E2E, we simulate by checking session validation
        const sessionValid = await page.evaluate(() => {
          return (window as any).authAPI.validateSession();
        });

        expect(sessionValid).toBeTruthy();
      }
    );

    electronTest(
      "should redirect to login if session is invalid",
      async ({ electronApp }) => {
        const page = await electronApp.firstWindow();

        // Clear session to simulate invalid state
        await loginPage.clearStorage();

        // Try to navigate to dashboard
        await loginPage.navigateToHash("/dashboard");
        await page.waitForTimeout(2000);

        // Should be redirected to auth
        const url = page.url();
        expect(url).toContain("#/auth");
      }
    );
  });

  electronTest.describe("Security", () => {
     electronTest(
       "should not expose PIN in DOM",
       async ({ electronApp }) => {
         const page = await electronApp.firstWindow();

         await loginPage.login("Test Cashier", "1234");

         // Check that PIN is not visible in page content
         const pageContent = await page.content();
         expect(pageContent).not.toContain("1234");
       }
     );

     electronTest("should display PIN as dots/masked", async ({ electronApp }) => {
       const page = await electronApp.firstWindow();

       // Select user
       await loginPage.selectUser("Test Cashier");

       // Enter PIN digits
       await loginPage.enterPin("1234");

       // Verify PIN is displayed as dots (●) not actual digits
       const pinDisplay = await page.locator('text=/[●○]+/').first();
       const pinText = await pinDisplay.textContent();
       
       // PIN should be masked (contain ● characters)
       expect(pinText).toContain("●");
       // PIN should not contain actual digits in display
       expect(pinText).not.toMatch(/[0-9]/);
     });
  });
});
