import { relations } from "drizzle-orm";
import { businesses, users } from "./auth.js";
import { products } from "./products.js";
import {
  suppliers,
  productBatches,
  expirySettings,
  expiryNotifications,
  stockMovements,
} from "./inventory.js";
import { shiftReports } from "./reports.js";
import { shiftValidations, shiftValidationIssues } from "./validation.js";

// ============================================
// EXPIRY TRACKING RELATIONS
// ============================================

export const suppliersRelations = relations(suppliers, ({ one, many }) => ({
  business: one(businesses, {
    fields: [suppliers.businessId],
    references: [businesses.id],
  }),
  batches: many(productBatches),
}));

export const productBatchesRelations = relations(
  productBatches,
  ({ one, many }) => ({
    product: one(products, {
      fields: [productBatches.productId],
      references: [products.id],
    }),
    supplier: one(suppliers, {
      fields: [productBatches.supplierId],
      references: [suppliers.id],
    }),
    business: one(businesses, {
      fields: [productBatches.businessId],
      references: [businesses.id],
    }),
    notifications: many(expiryNotifications),
    movements: many(stockMovements),
    fromMovements: many(stockMovements, {
      relationName: "fromBatch",
    }),
    toMovements: many(stockMovements, {
      relationName: "toBatch",
    }),
  })
);

export const expirySettingsRelations = relations(
  expirySettings,
  ({ one }) => ({
    business: one(businesses, {
      fields: [expirySettings.businessId],
      references: [businesses.id],
    }),
  })
);

export const expiryNotificationsRelations = relations(
  expiryNotifications,
  ({ one }) => ({
    batch: one(productBatches, {
      fields: [expiryNotifications.productBatchId],
      references: [productBatches.id],
    }),
    acknowledgedByUser: one(users, {
      fields: [expiryNotifications.acknowledgedBy],
      references: [users.id],
    }),
    business: one(businesses, {
      fields: [expiryNotifications.businessId],
      references: [businesses.id],
    }),
  })
);

export const stockMovementsRelations = relations(
  stockMovements,
  ({ one }) => ({
    product: one(products, {
      fields: [stockMovements.productId],
      references: [products.id],
    }),
    batch: one(productBatches, {
      fields: [stockMovements.batchId],
      references: [productBatches.id],
    }),
    fromBatch: one(productBatches, {
      fields: [stockMovements.fromBatchId],
      references: [productBatches.id],
      relationName: "fromBatch",
    }),
    toBatch: one(productBatches, {
      fields: [stockMovements.toBatchId],
      references: [productBatches.id],
      relationName: "toBatch",
    }),
    user: one(users, {
      fields: [stockMovements.userId],
      references: [users.id],
    }),
    business: one(businesses, {
      fields: [stockMovements.businessId],
      references: [businesses.id],
    }),
  })
);

// ============================================
// VALIDATION RELATIONS
// ============================================

export const shiftValidationsRelations = relations(
  shiftValidations,
  ({ one, many }) => ({
    issues: many(shiftValidationIssues),
    shiftReport: one(shiftReports, {
      fields: [shiftValidations.shiftId],
      references: [shiftReports.shiftId],
    }),
  })
);

export const shiftValidationIssuesRelations = relations(
  shiftValidationIssues,
  ({ one }) => ({
    validation: one(shiftValidations, {
      fields: [shiftValidationIssues.validationId],
      references: [shiftValidations.id],
    }),
  })
);

