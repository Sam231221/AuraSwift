/**
 * MSW Server Setup for Node.js Testing
 *
 * This file sets up the Mock Service Worker server for use in Node.js
 * test environments (Vitest, Jest, etc.). It intercepts HTTP requests
 * and returns mocked responses based on the handlers defined.
 *
 * Import this in test files that need API mocking:
 * ```ts
 * import { server } from '../mocks/server';
 * ```
 *
 * @see https://mswjs.io/docs/getting-started/integrate/node
 */

import { setupServer } from "msw/node";
import { beforeAll, afterEach, afterAll } from "vitest";
import { handlers } from "./handlers";

/**
 * Create MSW server instance with default handlers
 */
export const server = setupServer(...handlers);

/**
 * Start server before all tests
 *
 * Options:
 * - onUnhandledRequest: 'warn' - Log warnings for unhandled requests
 */
beforeAll(() => {
  server.listen({
    onUnhandledRequest: "warn",
  });
});

/**
 * Reset handlers after each test to ensure test isolation
 * This prevents one test from affecting another's mock behavior
 */
afterEach(() => {
  server.resetHandlers();
});

/**
 * Clean up after all tests
 * This ensures the server doesn't leak into other test files
 */
afterAll(() => {
  server.close();
});

/**
 * Export handler groups for selective use
 */
export {
  vivaWalletHandlers,
  printerHandlers,
  scannerHandlers,
  scaleHandlers,
  errorHandlers,
} from "./handlers";
