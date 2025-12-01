import { ipcMain } from "electron";
import { getDatabase } from "../database/index.js";
import { getLogger } from "../utils/logger.js";
import {
  logAction,
  validateSessionAndPermission,
} from "../utils/authHelpers.js";
import { PERMISSIONS } from "@app/shared/constants/permissions";
import { transactionValidator } from "../utils/transactionValidator.js";
const logger = getLogger("transactionHandlers");

export function registerTransactionHandlers() {
  // Transaction API endpoints
  ipcMain.handle(
    "transactions:create",
    async (event, sessionToken, transactionData) => {
      try {
        const db = await getDatabase();

        // Validate session and check SALES_WRITE permission
        const auth = await validateSessionAndPermission(
          db,
          sessionToken,
          PERMISSIONS.SALES_WRITE
        );

        if (!auth.success) {
          return { success: false, message: auth.message, code: auth.code };
        }

        const user = auth.user!;

        // Validate transaction requirements using TransactionValidator
        // This will automatically find active shift if shiftId not provided and shift is required
        const validation = await transactionValidator.validateTransaction(
          user,
          transactionData.shiftId || null,
          db
        );

        if (!validation.valid) {
          return {
            success: false,
            message: validation.errors.join(", "),
            code: validation.code || "VALIDATION_ERROR",
          };
        }

        // If shift is required but shiftId not provided, get active shift and add it to transactionData
        if (validation.requiresShift && !transactionData.shiftId) {
          const activeShift = db.timeTracking.getActiveShift(user.id);
          if (activeShift) {
            transactionData.shiftId = activeShift.id;
            logger.info(
              `[createTransaction] Auto-assigned active shift ${activeShift.id} to transaction for user ${user.id}`
            );
          }
        }

        const transaction = await db.transactions.createTransaction(
          transactionData
        );

        // Audit log the transaction creation
        await logAction(db, user, "create", "transaction", transaction.id, {
          shiftId: transactionData.shiftId || "none",
          shiftRequired: validation.requiresShift,
          total: transactionData.total,
          paymentMethod: transactionData.paymentMethod,
        });

        // Convert to plain object to ensure serialization works
        const serializedTransaction = JSON.parse(JSON.stringify(transaction));

        return {
          success: true,
          transaction: serializedTransaction,
        };
      } catch (error) {
        logger.error("Create transaction IPC error:", error);
        return {
          success: false,
          message: "Failed to create transaction",
        };
      }
    }
  );

  ipcMain.handle("transactions:getByShift", async (event, shiftId) => {
    try {
      const db = await getDatabase();
      const transactions = await db.transactions.getTransactionsByShift(
        shiftId
      );

      // Convert to plain objects to ensure serialization works
      const serializedTransactions = JSON.parse(JSON.stringify(transactions));

      return {
        success: true,
        data: serializedTransactions,
      };
    } catch (error) {
      logger.error("Get transactions by shift IPC error:", error);
      return {
        success: false,
        message: "Failed to get transactions",
      };
    }
  });

  ipcMain.handle(
    "transactions:createFromCart",
    async (event, sessionToken, data) => {
      try {
        logger.info("Creating transaction from cart:", {
          cartSessionId: data.cartSessionId,
          shiftId: data.shiftId,
          businessId: data.businessId,
          paymentMethod: data.paymentMethod,
        });

        const db = await getDatabase();

        // Validate session and check SALES_WRITE permission
        const auth = await validateSessionAndPermission(
          db,
          sessionToken,
          PERMISSIONS.SALES_WRITE
        );

        if (!auth.success) {
          return { success: false, message: auth.message, code: auth.code };
        }

        const user = auth.user!;

        // Validate transaction requirements using TransactionValidator
        const validation = await transactionValidator.validateTransaction(
          user,
          data.shiftId || null,
          db
        );

        if (!validation.valid) {
          return {
            success: false,
            message: validation.errors.join(", "),
            code: validation.code || "VALIDATION_ERROR",
          };
        }

        // Get cart session
        const cartSession = await db.cart.getSessionById(data.cartSessionId);
        if (!cartSession) {
          logger.error("Cart session not found:", data.cartSessionId);
          return {
            success: false,
            message: "Cart session not found",
          };
        }

        // Get all cart items
        const cartItems = await db.cart.getItemsBySession(data.cartSessionId);
        if (!cartItems || cartItems.length === 0) {
          logger.error("Cart is empty:", data.cartSessionId);
          return {
            success: false,
            message: "Cart is empty",
          };
        }

        logger.info(`Processing ${cartItems.length} cart items`);

        // Validate that all items have either productId or categoryId
        const invalidItems = cartItems.filter(
          (item) => !item.productId && !item.categoryId
        );
        if (invalidItems.length > 0) {
          logger.error(
            `Found ${invalidItems.length} cart items without productId or categoryId`
          );
          return {
            success: false,
            message:
              "Some cart items are invalid. Each item must have either a product ID or category ID.",
          };
        }

        // Calculate totals from all cart items
        const subtotal = cartItems.reduce(
          (sum, item) => sum + item.totalPrice,
          0
        );
        const tax = cartItems.reduce((sum, item) => sum + item.taxAmount, 0);
        const total = subtotal + tax;

        logger.info("Calculated totals:", { subtotal, tax, total });

        // ============================================================
        // BATCH-AWARE CHECKOUT: FEFO Batch Selection and Deduction
        // ============================================================
        // For products with requiresBatchTracking = true, we:
        // 1. Select batches using FEFO (First-Expiry-First-Out)
        // 2. Deduct quantities from selected batches
        // 3. Assign batch info to transaction items
        // ============================================================

        // Map to track batch selections for each cart item
        interface BatchSelection {
          batchId: string;
          batchNumber: string;
          expiryDate: number;
          quantity: number;
        }
        const batchSelectionsMap = new Map<string, BatchSelection[]>();

        // Pre-process: Select batches for products that require batch tracking
        for (const item of cartItems) {
          if (!item.productId) continue; // Skip category items

          try {
            const product = await db.products.getProductById(item.productId);

            // Check if product requires batch tracking
            if (product.requiresBatchTracking) {
              // Calculate quantity needed (always use quantity field, not weight)
              // For weighted items: quantity = 1 (each addition = 1 item)
              // For unit items: quantity = number of units
              // Weight is only used for pricing, not for batch operations
              const quantityNeeded = item.quantity || 1;

              // If cart item already has batch info (pre-selected), use it
              if (item.batchId && item.batchNumber) {
                logger.info(
                  `📦 Cart item already has batch info: ${item.batchNumber}`
                );
                batchSelectionsMap.set(item.id, [
                  {
                    batchId: item.batchId,
                    batchNumber: item.batchNumber,
                    expiryDate:
                      typeof item.expiryDate === "number"
                        ? item.expiryDate
                        : item.expiryDate instanceof Date
                        ? item.expiryDate.getTime()
                        : new Date(item.expiryDate || Date.now()).getTime(),
                    quantity: quantityNeeded,
                  },
                ]);
              } else {
                // Auto-select batches using FEFO
                const rotationMethod =
                  (product.stockRotationMethod as "FIFO" | "FEFO" | "NONE") ||
                  "FEFO";

                logger.info(
                  `📦 Auto-selecting batches for ${product.name} using ${rotationMethod}`
                );

                try {
                  const selectedBatches = await db.batches.selectBatchesForSale(
                    item.productId,
                    quantityNeeded,
                    rotationMethod
                  );

                  if (selectedBatches.length > 0) {
                    const batchSelections: BatchSelection[] =
                      selectedBatches.map((batch) => ({
                        batchId: batch.batchId,
                        batchNumber: batch.batchNumber,
                        expiryDate: batch.expiryDate.getTime(),
                        quantity: batch.quantity,
                      }));
                    batchSelectionsMap.set(item.id, batchSelections);

                    logger.info(
                      `✅ Selected ${selectedBatches.length} batch(es) for ${product.name}:`,
                      selectedBatches.map(
                        (b) => `${b.batchNumber} (qty: ${b.quantity})`
                      )
                    );
                  }
                } catch (batchError) {
                  logger.warn(
                    `⚠️ Could not auto-select batches for ${product.name}:`,
                    batchError instanceof Error
                      ? batchError.message
                      : "Unknown error"
                  );
                  // Continue without batch tracking for this item
                  // The sale will still go through, but without batch deduction
                }
              }
            }
          } catch (productError) {
            logger.warn(
              `Could not get product ${item.productId} for batch processing:`,
              productError
            );
            // Continue with next item
          }
        }

        // Create transaction items from cart items (with batch info from selections)
        const transactionItems = cartItems.map((item) => {
          // Get batch selection for this item (use first batch if multiple)
          const batchSelections = batchSelectionsMap.get(item.id);
          const primaryBatch = batchSelections?.[0];

          // Convert expiryDate to timestamp in milliseconds
          let expiryDateTimestamp: number | null = null;

          // Use batch expiry date if available, otherwise use cart item's expiry date
          if (primaryBatch?.expiryDate) {
            expiryDateTimestamp = primaryBatch.expiryDate;
          } else if (item.expiryDate) {
            try {
              if (item.expiryDate instanceof Date) {
                expiryDateTimestamp = item.expiryDate.getTime();
              } else if (typeof item.expiryDate === "string") {
                expiryDateTimestamp = new Date(item.expiryDate).getTime();
                if (isNaN(expiryDateTimestamp)) {
                  logger.warn(`Invalid expiryDate string: ${item.expiryDate}`);
                  expiryDateTimestamp = null;
                }
              } else if (typeof item.expiryDate === "number") {
                expiryDateTimestamp = item.expiryDate;
              }
            } catch (e) {
              logger.warn(`Error parsing expiryDate for item ${item.id}:`, e);
            }
          }

          return {
            productId: item.productId || null,
            categoryId: item.categoryId || null,
            productName: item.itemName || "Unknown Item",
            quantity: item.itemType === "UNIT" ? item.quantity || 1 : 1,
            weight: item.itemType === "WEIGHT" ? item.weight || null : null,
            unitPrice: item.unitPrice,
            totalPrice: item.totalPrice,
            taxAmount: item.taxAmount,
            unitOfMeasure: item.unitOfMeasure || null,
            // Use batch info from FEFO selection or cart item
            batchId: primaryBatch?.batchId || item.batchId || null,
            batchNumber: primaryBatch?.batchNumber || item.batchNumber || null,
            expiryDate: expiryDateTimestamp,
            ageRestrictionLevel: item.ageRestrictionLevel || "NONE",
            ageVerified: item.ageVerified || false,
            // Store cart item ID for reference
            cartItemId: item.id,
          } as any;
        });

        logger.info(
          `Creating transaction with ${transactionItems.length} items`
        );

        // Create transaction using createTransactionWithItems
        const transaction = await db.transactions.createTransactionWithItems({
          shiftId: data.shiftId,
          businessId: data.businessId,
          type: "sale",
          subtotal,
          tax,
          total,
          paymentMethod: data.paymentMethod,
          cashAmount: data.cashAmount || null,
          cardAmount: data.cardAmount || null,
          status: "completed",
          receiptNumber: data.receiptNumber,
          timestamp: new Date().toISOString(),
          voidReason: null,
          customerId: null,
          originalTransactionId: null,
          refundReason: null,
          refundMethod: null,
          managerApprovalId: null,
          isPartialRefund: false,
          discountAmount: 0,
          appliedDiscounts: null,
          items: transactionItems,
        } as any);

        logger.info("Transaction created successfully:", transaction.id);

        // ============================================================
        // BATCH-AWARE INVENTORY UPDATE
        // ============================================================
        // For products with batch tracking: deduct from batches (FEFO)
        // For products without batch tracking: use standard stock adjustment
        // ============================================================

        try {
          const cashierId = cartSession.cashierId;

          for (const item of transaction.items) {
            // Only update inventory for products (not category items)
            if (!item.productId) {
              continue;
            }

            // Get product to check if inventory/batch tracking is enabled
            try {
              const product = await db.products.getProductById(item.productId);

              if (!product.trackInventory) {
                logger.info(
                  `Skipping inventory update for product ${item.productId} - tracking disabled`
                );
                continue;
              }

              // Calculate quantity to decrement (always use quantity field, not weight)
              // For weighted items: quantity = 1 (each addition = 1 item)
              // For unit items: quantity = number of units
              // Weight is only used for pricing, not for batch operations
              const quantityToDecrement = item.quantity || 1;

              // ============================================================
              // BATCH DEDUCTION (FEFO/FIFO)
              // ============================================================
              if (product.requiresBatchTracking) {
                // Get batch selections for this item
                const batchSelections = batchSelectionsMap.get(
                  (item as any).cartItemId
                );

                if (batchSelections && batchSelections.length > 0) {
                  logger.info(
                    `📦 Deducting from ${batchSelections.length} batch(es) for ${product.name}`
                  );

                  for (const batchSelection of batchSelections) {
                    try {
                      // Deduct quantity from batch
                      await db.batches.updateBatchQuantity(
                        batchSelection.batchId,
                        batchSelection.quantity,
                        "OUTBOUND"
                      );

                      // Create stock movement record for audit trail
                      await db.stockMovements.createStockMovement({
                        productId: item.productId,
                        batchId: batchSelection.batchId,
                        movementType: "OUTBOUND",
                        quantity: batchSelection.quantity,
                        reason: `Sale - Transaction ${transaction.id}`,
                        reference: transaction.id,
                        userId: cashierId,
                        businessId: data.businessId,
                      });

                      logger.info(
                        `✅ Deducted ${batchSelection.quantity} from batch ${batchSelection.batchNumber}`
                      );
                    } catch (batchDeductError) {
                      logger.error(
                        `Failed to deduct from batch ${batchSelection.batchNumber}:`,
                        batchDeductError
                      );
                      // Continue with other batches - don't fail the transaction
                    }
                  }

                  // Skip standard stock adjustment - batch deduction handles it
                  continue;
                } else {
                  logger.warn(
                    `⚠️ Product ${product.name} requires batch tracking but no batches were selected. Using standard stock adjustment.`
                  );
                }
              }

              // ============================================================
              // STANDARD STOCK ADJUSTMENT (non-batch tracked products)
              // ============================================================
              const currentStock = product.stockLevel ?? 0;
              if (currentStock < quantityToDecrement) {
                logger.warn(
                  `⚠️ Insufficient stock for product ${item.productId}. Current: ${currentStock}, Required: ${quantityToDecrement}`
                );
              }

              // Create stock adjustment to record the sale
              try {
                db.inventory.createStockAdjustment({
                  productId: item.productId,
                  type: "sale",
                  quantity: quantityToDecrement,
                  reason: `Sale - Transaction ${transaction.id}`,
                  note: null,
                  userId: cashierId,
                  businessId: data.businessId,
                });
                logger.info(
                  `✅ Updated inventory for product ${item.productId}: -${quantityToDecrement}`
                );
              } catch (inventoryError) {
                logger.error(
                  `Failed to update inventory for product ${item.productId}:`,
                  inventoryError
                );
              }
            } catch (productError) {
              logger.error(
                `Failed to get product ${item.productId} for inventory update:`,
                productError
              );
            }
          }
        } catch (inventoryError) {
          logger.error(
            "Error updating inventory after transaction:",
            inventoryError
          );
          // Don't fail the transaction if inventory update fails
          // Transaction is already saved, inventory can be corrected manually
        }

        // Convert to plain object to ensure serialization works
        const serializedTransaction = JSON.parse(JSON.stringify(transaction));

        return {
          success: true,
          data: serializedTransaction,
        };
      } catch (error) {
        logger.error("Create transaction from cart IPC error:", error);
        if (error instanceof Error) {
          logger.error("Error stack:", error.stack);
        }
        const errorMessage =
          error instanceof Error
            ? error.message
            : typeof error === "string"
            ? error
            : "Failed to create transaction from cart";
        return {
          success: false,
          message: errorMessage,
        };
      }
    }
  );

  // Shift reconciliation endpoints for auto-ended shifts
  ipcMain.handle(
    "shift:reconcile",
    async (event, shiftId, reconciliationData) => {
      try {
        const db = await getDatabase();

        // Update shift with actual cash drawer amount and manager approval
        const updatedShift = db.shifts.reconcileShift(
          shiftId,
          reconciliationData
        );

        // Convert to plain object to ensure serialization works
        const serializedShift = JSON.parse(JSON.stringify(updatedShift));

        return {
          success: true,
          shift: serializedShift,
        };
      } catch (error) {
        logger.error("Reconcile shift IPC error:", error);
        return {
          success: false,
          message: "Failed to reconcile shift",
        };
      }
    }
  );

  ipcMain.handle(
    "shift:getPendingReconciliation",
    async (event, businessId) => {
      try {
        const db = await getDatabase();
        const pendingShifts =
          db.shifts.getPendingReconciliationShifts(businessId);

        // Convert to plain objects to ensure serialization works
        const serializedShifts = JSON.parse(JSON.stringify(pendingShifts));

        return {
          success: true,
          shifts: serializedShifts,
        };
      } catch (error) {
        logger.error("Get pending reconciliation shifts IPC error:", error);
        return {
          success: false,
          message: "Failed to get pending reconciliation shifts",
        };
      }
    }
  );

  // Refund Transaction API endpoints
  ipcMain.handle("refunds:getTransactionById", async (event, transactionId) => {
    try {
      const db = await getDatabase();
      const transaction = await db.transactions.getTransactionById(
        transactionId
      );

      // Convert to plain object to ensure serialization works
      const serializedTransaction = transaction
        ? JSON.parse(JSON.stringify(transaction))
        : null;

      return {
        success: !!serializedTransaction,
        transaction: serializedTransaction,
        message: serializedTransaction ? undefined : "Transaction not found",
      };
    } catch (error) {
      logger.error("Get transaction by ID IPC error:", error);
      return {
        success: false,
        message: "Failed to get transaction",
      };
    }
  });

  ipcMain.handle(
    "refunds:getTransactionByReceipt",
    async (event, receiptNumber) => {
      try {
        const db = await getDatabase();
        const transaction = await db.transactions.getTransactionByReceiptNumber(
          receiptNumber
        );

        // Convert to plain object to ensure serialization works
        const serializedTransaction = transaction
          ? JSON.parse(JSON.stringify(transaction))
          : null;

        return {
          success: !!serializedTransaction,
          transaction: serializedTransaction,
          message: serializedTransaction ? undefined : "Transaction not found",
        };
      } catch (error) {
        logger.error("Get transaction by receipt IPC error:", error);
        return {
          success: false,
          message: "Failed to get transaction",
        };
      }
    }
  );

  ipcMain.handle(
    "refunds:getRecentTransactions",
    async (event, businessId, limit = 50) => {
      try {
        const db = await getDatabase();
        const transactions = await db.transactions.getRecentTransactions(
          businessId,
          limit
        );

        // Convert to plain objects to ensure serialization works
        const serializedTransactions = JSON.parse(JSON.stringify(transactions));

        return {
          success: true,
          transactions: serializedTransactions,
        };
      } catch (error) {
        logger.error("Get recent transactions IPC error:", error);
        return {
          success: false,
          message: "Failed to get recent transactions",
        };
      }
    }
  );

  ipcMain.handle(
    "refunds:getShiftTransactions",
    async (event, shiftId, limit = 50) => {
      try {
        const db = await getDatabase();
        const transactions = await db.transactions.getShiftTransactions(
          shiftId,
          limit
        );

        // Convert to plain objects to ensure serialization works
        const serializedTransactions = JSON.parse(JSON.stringify(transactions));

        return {
          success: true,
          transactions: serializedTransactions,
        };
      } catch (error) {
        logger.error("Get shift transactions IPC error:", error);
        return {
          success: false,
          message: "Failed to get shift transactions",
        };
      }
    }
  );

  ipcMain.handle(
    "refunds:validateEligibility",
    async (event, transactionId, refundItems) => {
      try {
        const db = await getDatabase();
        const validation = db.transactions.validateRefundEligibility(
          transactionId,
          refundItems
        );

        return {
          success: true,
          validation,
        };
      } catch (error) {
        logger.error("Validate refund eligibility IPC error:", error);
        return {
          success: false,
          message: "Failed to validate refund eligibility",
        };
      }
    }
  );

  ipcMain.handle("refunds:create", async (event, sessionToken, refundData) => {
    try {
      const db = await getDatabase();

      // Validate session and check TRANSACTIONS_OVERRIDE permission
      const auth = await validateSessionAndPermission(
        db,
        sessionToken,
        PERMISSIONS.TRANSACTIONS_OVERRIDE
      );

      if (!auth.success) {
        return { success: false, message: auth.message, code: auth.code };
      }

      const user = auth.user!;

      // Validate refund eligibility first
      const validation = await db.transactions.validateRefundEligibility(
        refundData.originalTransactionId,
        refundData.refundItems
      );
      if (!validation.isValid) {
        return {
          success: false,
          message: `Refund not allowed: ${validation.errors.join(", ")}`,
          errors: validation.errors,
        };
      }

      const refundTransaction = await db.transactions.createRefundTransaction(
        refundData
      );

      // Audit log the refund
      await logAction(
        db,
        user,
        "create_refund",
        "transaction",
        refundTransaction.id,
        {
          originalTransactionId: refundData.originalTransactionId,
          refundAmount: refundTransaction.total,
          refundMethod: refundData.refundMethod,
          isPartialRefund: refundData.isPartialRefund,
        }
      );

      return {
        success: true,
        transaction: refundTransaction,
      };
    } catch (error) {
      logger.error("Create refund IPC error:", error);
      return {
        success: false,
        message: "Failed to create refund",
      };
    }
  });

  // Void transaction handlers
  ipcMain.handle("voids:validateEligibility", async (event, transactionId) => {
    try {
      const db = await getDatabase();
      const validation = db.transactions.validateVoidEligibility(transactionId);

      return {
        success: true,
        data: validation,
      };
    } catch (error) {
      logger.error("Validate void eligibility IPC error:", error);
      return {
        success: false,
        message: "Failed to validate void eligibility",
      };
    }
  });

  ipcMain.handle("voids:create", async (event, sessionToken, voidData) => {
    try {
      const db = await getDatabase();

      // Validate session and check TRANSACTIONS_OVERRIDE permission
      const auth = await validateSessionAndPermission(
        db,
        sessionToken,
        PERMISSIONS.TRANSACTIONS_OVERRIDE
      );

      if (!auth.success) {
        return { success: false, message: auth.message, code: auth.code };
      }

      const user = auth.user!;

      // Validate void eligibility first
      const validation = db.transactions.validateVoidEligibility(
        voidData.transactionId
      );

      if (!validation.isValid) {
        return {
          success: false,
          message: `Void not allowed: ${validation.errors.join(", ")}`,
          errors: validation.errors,
        };
      }

      // Check if manager approval is required but not provided
      if (validation.requiresManagerApproval && !voidData.managerApprovalId) {
        return {
          success: false,
          message: "Manager approval required for this void operation",
          requiresManagerApproval: true,
        };
      }

      // If manager approval ID provided, validate it's a real manager
      if (voidData.managerApprovalId) {
        const manager = db.users.getUserById(voidData.managerApprovalId);
        if (!manager) {
          return {
            success: false,
            message: "Invalid manager approval: User not found",
            code: "INVALID_MANAGER_APPROVAL",
          };
        }
        // Check if user has manager, admin, or owner role via RBAC
        const userRoles = db.userRoles.getActiveRolesByUser(manager.id);
        const rolesWithDetails = db.userRoles.getRolesWithDetailsForUser(
          manager.id
        );
        const hasManagerRole = rolesWithDetails.some((ur) =>
          ["manager", "admin", "owner"].includes(ur.role.name)
        );
        if (!hasManagerRole) {
          return {
            success: false,
            message: "Invalid manager approval: User is not a manager",
            code: "INVALID_MANAGER_APPROVAL",
          };
        }
      }

      const result = db.transactions.voidTransaction(voidData);

      // Audit log the void
      await logAction(
        db,
        user,
        "void_transaction",
        "transaction",
        voidData.transactionId,
        {
          reason: voidData.reason,
          managerApprovalId: voidData.managerApprovalId || "none",
          requiresManagerApproval: validation.requiresManagerApproval,
        }
      );

      return result;
    } catch (error) {
      logger.error("Create void IPC error:", error);
      return {
        success: false,
        message: "Failed to void transaction",
      };
    }
  });

  // Additional void API handlers for transaction lookup
  ipcMain.handle("voids:getTransactionById", async (event, transactionId) => {
    try {
      const db = await getDatabase();
      const transaction =
        db.transactions.getTransactionByIdAnyStatus(transactionId);

      return {
        success: true,
        data: transaction,
      };
    } catch (error) {
      logger.error("Get transaction by ID for void IPC error:", error);
      return {
        success: false,
        message: "Failed to get transaction",
      };
    }
  });

  ipcMain.handle(
    "voids:getTransactionByReceipt",
    async (event, receiptNumber) => {
      try {
        const db = await getDatabase();
        const transaction =
          db.transactions.getTransactionByReceiptNumberAnyStatus(receiptNumber);

        return {
          success: true,
          data: transaction,
        };
      } catch (error) {
        logger.error("Get transaction by receipt for void IPC error:", error);
        return {
          success: false,
          message: "Failed to get transaction",
        };
      }
    }
  );

  // Cash Drawer handlers are in cash-drawer.handlers.ts
  // Removed duplicate handlers:
  // - cashDrawer:getExpectedCash
  // - cashDrawer:createCount
  // - cashDrawer:getCountsByShift
}
