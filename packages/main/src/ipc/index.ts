import { registerAgeVerificationHandlers } from "./age-verification.handlers.js";
import { registerAuthHandlers } from "./auth.handlers.js";
import { registerBatchHandlers } from "./batch.handlers.js";
import { registerBusinessHandlers } from "./business.handlers.js";
import { registerCartHandlers } from "./cart.handlers.js";
import { registerCashDrawerHandlers } from "./cash-drawer.handlers.js";
import { registerCategoryHandlers } from "./category.handlers.js";
import { registerDbHandlers } from "./db.handler.js";
import { registerExpiryProductHandlers } from "./expiryProduct.handlers.js";
import { registerSalesUnitSettingsHandlers } from "./sales-unit-settings.handlers.js";
import { registerProductHandlers } from "./product.handlers.js";
import { registerRoleHandlers } from "./role.handlers.js";
import { registerSeedHandlers } from "./seed.handlers.js";
import { registerShiftHandlers } from "./shift.handlers.js";
import { registerSupplierHandlers } from "./supplier.handlers.js";
import { registerTimeTrackingHandlers } from "./time-tracking.handlers.js";
import { registerTransactionHandlers } from "./transaction.handler.js";
import { registerUpdateHandlers } from "./update.handlers.js";

export function registerAllIpcHandlers() {
  registerAgeVerificationHandlers();
  registerAuthHandlers();
  registerBatchHandlers();
  registerBusinessHandlers();
  registerCartHandlers();
  registerCashDrawerHandlers();
  registerCategoryHandlers();
  registerDbHandlers();
  registerExpiryProductHandlers();
  registerSalesUnitSettingsHandlers();
  registerProductHandlers();
  registerRoleHandlers();
  registerSeedHandlers();
  registerShiftHandlers();
  registerSupplierHandlers();
  registerTimeTrackingHandlers();
  registerTransactionHandlers();
  registerUpdateHandlers();
}
