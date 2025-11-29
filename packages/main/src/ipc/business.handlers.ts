// Business Management IPC Handlers
// Note: auth:getBusinessById is handled in auth.handlers.ts with RBAC validation
// This file is kept for future business-specific handlers

import { getLogger } from "../utils/logger.js";

const logger = getLogger("businessHandlers");

export function registerBusinessHandlers() {
  // Business-specific handlers will be added here in the future
  // For now, auth:getBusinessById is handled in auth.handlers.ts
  logger.info("Business handlers registered (no handlers yet)");
}
