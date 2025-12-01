/**
 * Batch selection utilities
 * Handles automatic batch selection using FEFO/FIFO rotation methods
 */

import { toast } from "sonner";
import type { Product } from "@/types/domain";
import { getLogger } from "@/shared/utils/logger";

const logger = getLogger("batch-selection-utils");

/**
 * Result of batch auto-selection attempt
 */
export interface BatchAutoSelectionResult {
  success: boolean;
  primaryBatch?: {
    batchId: string;
    batchNumber: string;
    expiryDate: Date;
  };
  totalAvailable?: number;
  actualQuantity?: number;
  requestedQuantity: number;
  batches?: Array<{
    batchId: string;
    batchNumber: string;
    expiryDate: Date | string | number;
    quantity: number;
  }>;
  error?: string;
  shouldShowModal?: boolean; // Whether to show batch selection modal
}

/**
 * Automatically select batches for a product using FEFO/FIFO
 * @param product - The product to select batches for
 * @param requestedQuantity - The quantity/weight requested
 * @param allowPartial - Whether to allow partial quantities if insufficient stock
 * @returns BatchAutoSelectionResult with selection details
 */
export async function autoSelectBatches(
  product: Product,
  requestedQuantity: number,
  allowPartial: boolean = false
): Promise<BatchAutoSelectionResult> {
  // Validate inputs
  if (!product.id) {
    return {
      success: false,
      requestedQuantity,
      error: "Product ID is required",
    };
  }

  if (!requestedQuantity || requestedQuantity <= 0) {
    return {
      success: false,
      requestedQuantity,
      error: "Requested quantity must be greater than 0",
    };
  }

  const rotationMethod = product.stockRotationMethod || "FEFO";

  try {
    // Attempt automatic batch selection
    const batchResponse = await window.batchesAPI?.selectForSale(
      product.id,
      requestedQuantity,
      rotationMethod
    );

    if (batchResponse?.success && batchResponse.batches?.length > 0) {
      const primaryBatch = batchResponse.batches[0];

      // Calculate total available quantity from all selected batches
      const totalAvailable = batchResponse.batches.reduce(
        (sum: number, batch: { quantity: number }) => sum + batch.quantity,
        0
      );

      // Determine actual quantity to use
      const actualQuantity =
        totalAvailable < requestedQuantity
          ? allowPartial
            ? totalAvailable
            : requestedQuantity
          : requestedQuantity;

      // If partial is not allowed and we don't have enough, indicate modal should be shown
      if (!allowPartial && totalAvailable < requestedQuantity) {
        return {
          success: false,
          requestedQuantity,
          totalAvailable,
          shouldShowModal: true,
          error: `Insufficient stock. Available: ${totalAvailable.toFixed(2)}, Requested: ${requestedQuantity.toFixed(2)}`,
        };
      }

      return {
        success: true,
        primaryBatch: {
          batchId: primaryBatch.batchId,
          batchNumber: primaryBatch.batchNumber,
          expiryDate: new Date(primaryBatch.expiryDate),
        },
        totalAvailable,
        actualQuantity,
        requestedQuantity,
        batches: batchResponse.batches,
      };
    } else {
      // No batches selected - check if batches exist but insufficient
      const availableBatchesResponse =
        await window.batchesAPI?.getActiveBatches(product.id, rotationMethod);

      if (
        availableBatchesResponse?.success &&
        availableBatchesResponse.batches?.length > 0
      ) {
        // Batches exist but insufficient stock
        const totalAvailable = availableBatchesResponse.batches.reduce(
          (sum: number, batch: { currentQuantity: number }) =>
            sum + batch.currentQuantity,
          0
        );

        if (allowPartial && totalAvailable > 0) {
          // Use first batch with available quantity
          const firstBatch = availableBatchesResponse.batches[0];
          return {
            success: true,
            primaryBatch: {
              batchId: firstBatch.id,
              batchNumber: firstBatch.batchNumber,
              expiryDate: new Date(firstBatch.expiryDate),
            },
            totalAvailable,
            actualQuantity: totalAvailable,
            requestedQuantity,
          };
        }

        return {
          success: false,
          requestedQuantity,
          totalAvailable,
          shouldShowModal: true,
          error: `Insufficient stock. Available: ${totalAvailable.toFixed(2)}, Requested: ${requestedQuantity.toFixed(2)}`,
        };
      } else {
        // No batches at all
        return {
          success: false,
          requestedQuantity,
          error: "No batches available for this product",
        };
      }
    }
  } catch (error) {
    logger.error("Batch auto-selection failed:", error);

    const errorMessage =
      error instanceof Error ? error.message : String(error);
    const isInsufficientStock = errorMessage.includes("Insufficient stock");

    if (isInsufficientStock) {
      // Try to get available batches for partial fulfillment
      try {
        const availableBatchesResponse =
          await window.batchesAPI?.getActiveBatches(product.id, rotationMethod);

        if (
          availableBatchesResponse?.success &&
          availableBatchesResponse.batches?.length > 0
        ) {
          const totalAvailable = availableBatchesResponse.batches.reduce(
            (sum: number, batch: { currentQuantity: number }) =>
              sum + batch.currentQuantity,
            0
          );

          if (allowPartial && totalAvailable > 0) {
            const firstBatch = availableBatchesResponse.batches[0];
            return {
              success: true,
              primaryBatch: {
                batchId: firstBatch.id,
                batchNumber: firstBatch.batchNumber,
                expiryDate: new Date(firstBatch.expiryDate),
              },
              totalAvailable,
              actualQuantity: totalAvailable,
              requestedQuantity,
            };
          }

          return {
            success: false,
            requestedQuantity,
            totalAvailable,
            shouldShowModal: true,
            error: errorMessage,
          };
        }
      } catch (fallbackError) {
        logger.error("Failed to get available batches:", fallbackError);
      }
    }

    // Generic error - show modal for manual selection
    return {
      success: false,
      requestedQuantity,
      shouldShowModal: true,
      error: errorMessage,
    };
  }
}

/**
 * Get available batches for a product (for manual selection)
 * @param product - The product to get batches for
 * @returns Array of available batches or null if error
 */
export async function getAvailableBatches(product: Product): Promise<{
  success: boolean;
  batches?: Array<{
    id: string;
    batchNumber: string;
    expiryDate: Date | string | number;
    currentQuantity: number;
    status: string;
  }>;
  error?: string;
}> {
  if (!product.id) {
    return {
      success: false,
      error: "Product ID is required",
    };
  }

  const rotationMethod = product.stockRotationMethod || "FEFO";

  try {
    const response = await window.batchesAPI?.getActiveBatches(
      product.id,
      rotationMethod
    );

    if (response?.success && response.batches) {
      return {
        success: true,
        batches: response.batches,
      };
    } else {
      return {
        success: false,
        error: "No batches available",
      };
    }
  } catch (error) {
    logger.error("Failed to get available batches:", error);
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Failed to load batches",
    };
  }
}

