import type { StockMovement } from "../schema.js";
import type { DrizzleDB } from "../drizzle.js";
import { eq, and, desc, gte, lte } from "drizzle-orm";
import * as schema from "../schema.js";
import type { BatchManager } from "./batchManager.js";

export interface StockMovementResponse {
  success: boolean;
  message: string;
  movement?: StockMovement;
  movements?: StockMovement[];
  errors?: string[];
}

export interface CreateStockMovementData {
  productId: string;
  batchId?: string; // Primary batch affected
  movementType: "INBOUND" | "OUTBOUND" | "ADJUSTMENT" | "TRANSFER" | "WASTE";
  quantity: number;
  reason?: string;
  reference?: string; // Transaction ID, PO number, etc.
  fromBatchId?: string; // For transfers
  toBatchId?: string; // For transfers
  userId: string;
  businessId: string;
}

export class StockMovementManager {
  private db: DrizzleDB;
  private uuid: any;
  private batchManager: BatchManager | null = null;

  constructor(drizzle: DrizzleDB, uuid: any, batchManager?: BatchManager) {
    this.db = drizzle;
    this.uuid = uuid;
    this.batchManager = batchManager || null;
  }

  /**
   * Set batch manager (for batch quantity updates)
   */
  setBatchManager(batchManager: BatchManager): void {
    this.batchManager = batchManager;
  }

  /**
   * Create a stock movement
   */
  async createStockMovement(
    movementData: CreateStockMovementData
  ): Promise<StockMovement> {
    const movementId = this.uuid.v4();
    const now = new Date();

    // Validate required fields
    if (!movementData.productId) {
      throw new Error("Product ID is required");
    }
    if (!movementData.userId) {
      throw new Error("User ID is required");
    }
    if (!movementData.businessId) {
      throw new Error("Business ID is required");
    }
    if (movementData.quantity <= 0) {
      throw new Error("Quantity must be greater than 0");
    }

    // Validate movement type
    if (
      !["INBOUND", "OUTBOUND", "ADJUSTMENT", "TRANSFER", "WASTE"].includes(
        movementData.movementType
      )
    ) {
      throw new Error("Invalid movement type");
    }

    // For TRANSFER, both fromBatchId and toBatchId are required
    if (movementData.movementType === "TRANSFER") {
      if (!movementData.fromBatchId || !movementData.toBatchId) {
        throw new Error("Transfer requires both fromBatchId and toBatchId");
      }
    }

    // Create stock movement record
    await this.db.insert(schema.stockMovements).values({
      id: movementId,
      productId: movementData.productId,
      batchId: movementData.batchId ?? null,
      movementType: movementData.movementType,
      quantity: movementData.quantity,
      reason: movementData.reason ?? null,
      reference: movementData.reference ?? null,
      fromBatchId: movementData.fromBatchId ?? null,
      toBatchId: movementData.toBatchId ?? null,
      userId: movementData.userId,
      businessId: movementData.businessId,
      timestamp: now,
      createdAt: now,
      updatedAt: now,
    });

    // Update batch quantities if batch manager is available
    if (this.batchManager && movementData.batchId) {
      if (
        movementData.movementType === "OUTBOUND" ||
        movementData.movementType === "WASTE"
      ) {
        await this.batchManager.updateBatchQuantity(
          movementData.batchId,
          movementData.quantity,
          "OUTBOUND"
        );
      } else if (movementData.movementType === "INBOUND") {
        await this.batchManager.updateBatchQuantity(
          movementData.batchId,
          movementData.quantity,
          "INBOUND"
        );
      }
    }

    // Handle transfers
    if (
      movementData.movementType === "TRANSFER" &&
      this.batchManager &&
      movementData.fromBatchId &&
      movementData.toBatchId
    ) {
      // Deduct from source batch
      await this.batchManager.updateBatchQuantity(
        movementData.fromBatchId,
        movementData.quantity,
        "OUTBOUND"
      );
      // Add to destination batch
      await this.batchManager.updateBatchQuantity(
        movementData.toBatchId,
        movementData.quantity,
        "INBOUND"
      );
    }

    return this.getMovementById(movementId);
  }

  /**
   * Get movement by ID
   */
  async getMovementById(id: string): Promise<StockMovement> {
    const [movement] = await this.db
      .select()
      .from(schema.stockMovements)
      .where(eq(schema.stockMovements.id, id))
      .limit(1);

    if (!movement) {
      throw new Error("Stock movement not found");
    }

    return movement as StockMovement;
  }

  /**
   * Get movements by product ID
   */
  async getMovementsByProduct(productId: string): Promise<StockMovement[]> {
    const movements = await this.db
      .select()
      .from(schema.stockMovements)
      .where(eq(schema.stockMovements.productId, productId))
      .orderBy(desc(schema.stockMovements.timestamp));

    return movements as StockMovement[];
  }

  /**
   * Get movements by batch ID
   */
  async getMovementsByBatch(batchId: string): Promise<StockMovement[]> {
    const movements = await this.db
      .select()
      .from(schema.stockMovements)
      .where(eq(schema.stockMovements.batchId, batchId))
      .orderBy(desc(schema.stockMovements.timestamp));

    return movements as StockMovement[];
  }

  /**
   * Get movements by business ID
   */
  async getMovementsByBusiness(
    businessId: string,
    filters?: {
      productId?: string;
      batchId?: string;
      movementType?: "INBOUND" | "OUTBOUND" | "ADJUSTMENT" | "TRANSFER" | "WASTE";
      startDate?: Date;
      endDate?: Date;
    }
  ): Promise<StockMovement[]> {
    const conditions = [eq(schema.stockMovements.businessId, businessId)];

    if (filters?.productId) {
      conditions.push(eq(schema.stockMovements.productId, filters.productId));
    }

    if (filters?.batchId) {
      conditions.push(eq(schema.stockMovements.batchId, filters.batchId));
    }

    if (filters?.movementType) {
      conditions.push(
        eq(schema.stockMovements.movementType, filters.movementType)
      );
    }

    if (filters?.startDate) {
      conditions.push(
        gte(schema.stockMovements.timestamp, filters.startDate.getTime())
      );
    }

    if (filters?.endDate) {
      conditions.push(
        lte(schema.stockMovements.timestamp, filters.endDate.getTime())
      );
    }

    const movements = await this.db
      .select()
      .from(schema.stockMovements)
      .where(and(...conditions))
      .orderBy(desc(schema.stockMovements.timestamp));

    return movements as StockMovement[];
  }
}

