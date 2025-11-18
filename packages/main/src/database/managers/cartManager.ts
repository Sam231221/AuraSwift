import type { CartSession, CartItem } from "../schema.js";
import type { DrizzleDB } from "../drizzle.js";
import { eq, and, desc, asc } from "drizzle-orm";
import * as schema from "../schema.js";

export class CartManager {
  private db: DrizzleDB;
  private uuid: any;

  constructor(drizzle: DrizzleDB, uuid: any) {
    this.db = drizzle;
    this.uuid = uuid;
  }

  /**
   * Create a new cart session
   */
  async createSession(
    sessionData: Omit<CartSession, "id" | "createdAt" | "updatedAt" | "status" | "totalAmount" | "taxAmount">
  ): Promise<CartSession> {
    const sessionId = this.uuid.v4();
    const now = new Date();

    await this.db.insert(schema.cartSessions).values({
      id: sessionId,
      cashierId: sessionData.cashierId,
      shiftId: sessionData.shiftId || "",
      businessId: sessionData.businessId,
      stationId: sessionData.stationId || null,
      status: "ACTIVE",
      totalAmount: 0,
      taxAmount: 0,
      customerAgeVerified: false,
      verificationMethod: "NONE",
      verifiedBy: null,
      completedAt: null,
      createdAt: now,
      updatedAt: now,
    });

    return this.getSessionById(sessionId);
  }

  /**
   * Get cart session by ID
   */
  async getSessionById(sessionId: string): Promise<CartSession> {
    const [session] = await this.db
      .select()
      .from(schema.cartSessions)
      .where(eq(schema.cartSessions.id, sessionId))
      .limit(1);

    if (!session) {
      throw new Error("Cart session not found");
    }

    return session as CartSession;
  }

  /**
   * Get active cart session for a cashier
   */
  async getActiveSession(cashierId: string): Promise<CartSession | null> {
    const [session] = await this.db
      .select()
      .from(schema.cartSessions)
      .where(
        and(
          eq(schema.cartSessions.cashierId, cashierId),
          eq(schema.cartSessions.status, "ACTIVE")
        )
      )
      .orderBy(desc(schema.cartSessions.createdAt))
      .limit(1);

    return (session as CartSession) || null;
  }

  /**
   * Update cart session
   */
  async updateSession(
    sessionId: string,
    updates: Partial<Omit<CartSession, "id" | "createdAt" | "updatedAt">>
  ): Promise<CartSession> {
    const now = new Date();

    await this.db
      .update(schema.cartSessions)
      .set({
        ...updates,
        updatedAt: now,
      })
      .where(eq(schema.cartSessions.id, sessionId))
      .run();

    return this.getSessionById(sessionId);
  }

  /**
   * Complete a cart session
   */
  async completeSession(sessionId: string): Promise<CartSession> {
    return this.updateSession(sessionId, {
      status: "COMPLETED",
      completedAt: new Date(),
    });
  }

  /**
   * Cancel a cart session
   */
  async cancelSession(sessionId: string): Promise<CartSession> {
    return this.updateSession(sessionId, {
      status: "CANCELLED",
    });
  }

  /**
   * Add item to cart
   */
  async addItem(
    itemData: Omit<CartItem, "id" | "addedAt" | "updatedAt">
  ): Promise<CartItem> {
    const itemId = this.uuid.v4();
    const now = new Date();

    await this.db.insert(schema.cartItems).values({
      id: itemId,
      cartSessionId: itemData.cartSessionId,
      productId: itemData.productId,
      itemType: itemData.itemType,
      quantity: itemData.quantity || null,
      weight: itemData.weight || null,
      unitOfMeasure: itemData.unitOfMeasure || null,
      unitPrice: itemData.unitPrice,
      totalPrice: itemData.totalPrice,
      taxAmount: itemData.taxAmount,
      batchId: itemData.batchId || null,
      batchNumber: itemData.batchNumber || null,
      expiryDate: itemData.expiryDate || null,
      ageRestrictionLevel: itemData.ageRestrictionLevel || "NONE",
      ageVerified: itemData.ageVerified || false,
      scaleReadingWeight: itemData.scaleReadingWeight || null,
      scaleReadingStable: itemData.scaleReadingStable ?? true,
      addedAt: now,
      updatedAt: now,
    });

    // Update session totals
    await this.recalculateSessionTotals(itemData.cartSessionId);

    return this.getItemById(itemId);
  }

  /**
   * Get item by ID
   */
  async getItemById(itemId: string): Promise<CartItem> {
    const [item] = await this.db
      .select()
      .from(schema.cartItems)
      .where(eq(schema.cartItems.id, itemId))
      .limit(1);

    if (!item) {
      throw new Error("Cart item not found");
    }

    return item as CartItem;
  }

  /**
   * Get all items for a cart session
   */
  async getItemsBySession(sessionId: string): Promise<CartItem[]> {
    const items = await this.db
      .select()
      .from(schema.cartItems)
      .where(eq(schema.cartItems.cartSessionId, sessionId))
      .orderBy(asc(schema.cartItems.addedAt));

    return items as CartItem[];
  }

  /**
   * Update cart item
   */
  async updateItem(
    itemId: string,
    updates: Partial<Omit<CartItem, "id" | "cartSessionId" | "productId" | "addedAt" | "updatedAt">>
  ): Promise<CartItem> {
    const now = new Date();

    // Get the item to find the session ID
    const item = await this.getItemById(itemId);

    await this.db
      .update(schema.cartItems)
      .set({
        ...updates,
        updatedAt: now,
      })
      .where(eq(schema.cartItems.id, itemId))
      .run();

    // Recalculate session totals
    await this.recalculateSessionTotals(item.cartSessionId);

    return this.getItemById(itemId);
  }

  /**
   * Remove item from cart
   */
  async removeItem(itemId: string): Promise<boolean> {
    // Get the item to find the session ID
    const item = await this.getItemById(itemId);
    const sessionId = item.cartSessionId;

    await this.db
      .delete(schema.cartItems)
      .where(eq(schema.cartItems.id, itemId))
      .run();

    // Recalculate session totals
    await this.recalculateSessionTotals(sessionId);

    return true;
  }

  /**
   * Clear all items from a cart session
   */
  async clearCart(sessionId: string): Promise<boolean> {
    await this.db
      .delete(schema.cartItems)
      .where(eq(schema.cartItems.cartSessionId, sessionId))
      .run();

    // Reset session totals
    await this.updateSession(sessionId, {
      totalAmount: 0,
      taxAmount: 0,
    });

    return true;
  }

  /**
   * Recalculate session totals from items
   */
  private async recalculateSessionTotals(sessionId: string): Promise<void> {
    const items = await this.getItemsBySession(sessionId);

    const totalAmount = items.reduce((sum, item) => sum + item.totalPrice, 0);
    const taxAmount = items.reduce((sum, item) => sum + item.taxAmount, 0);

    await this.updateSession(sessionId, {
      totalAmount,
      taxAmount,
    });
  }
}

