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
    sessionData: Omit<
      CartSession,
      "id" | "createdAt" | "updatedAt" | "status" | "totalAmount" | "taxAmount"
    >
  ): Promise<CartSession> {
    const sessionId = this.uuid.v4();
    const now = new Date();

    await this.db.insert(schema.cartSessions).values({
      id: sessionId,
      cashierId: sessionData.cashierId,
      shiftId: sessionData.shiftId || "",
      businessId: sessionData.businessId,
      terminal_id: sessionData.terminal_id || null,
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
   * Supports both product items (productId) and category items (categoryId)
   * At least one of productId or categoryId must be provided
   */
  async addItem(
    itemData: Omit<CartItem, "id" | "addedAt" | "updatedAt">
  ): Promise<CartItem> {
    // Validate that at least one of productId or categoryId is set
    if (!itemData.productId && !itemData.categoryId) {
      throw new Error(
        "Either productId or categoryId must be provided for cart item"
      );
    }

    // Validate that both are not set (mutually exclusive)
    if (itemData.productId && itemData.categoryId) {
      throw new Error(
        "Cart item cannot have both productId and categoryId. Only one should be set."
      );
    }

    const itemId = this.uuid.v4();
    const now = new Date();

    await this.db.insert(schema.cartItems).values({
      id: itemId,
      cartSessionId: itemData.cartSessionId,
      productId: itemData.productId || null,
      categoryId: itemData.categoryId || null,
      itemName: itemData.itemName || null,
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
   * Populates product information when productId is present
   */
  async getItemById(itemId: string): Promise<CartItem> {
    const [itemWithProduct] = await this.db
      .select({
        // Cart item fields
        id: schema.cartItems.id,
        cartSessionId: schema.cartItems.cartSessionId,
        productId: schema.cartItems.productId,
        categoryId: schema.cartItems.categoryId,
        itemName: schema.cartItems.itemName,
        itemType: schema.cartItems.itemType,
        quantity: schema.cartItems.quantity,
        weight: schema.cartItems.weight,
        unitOfMeasure: schema.cartItems.unitOfMeasure,
        unitPrice: schema.cartItems.unitPrice,
        totalPrice: schema.cartItems.totalPrice,
        taxAmount: schema.cartItems.taxAmount,
        batchId: schema.cartItems.batchId,
        batchNumber: schema.cartItems.batchNumber,
        expiryDate: schema.cartItems.expiryDate,
        ageRestrictionLevel: schema.cartItems.ageRestrictionLevel,
        ageVerified: schema.cartItems.ageVerified,
        scaleReadingWeight: schema.cartItems.scaleReadingWeight,
        scaleReadingStable: schema.cartItems.scaleReadingStable,
        addedAt: schema.cartItems.addedAt,
        updatedAt: schema.cartItems.updatedAt,
        // Product fields (optional, only when productId is set)
        product: schema.products,
      })
      .from(schema.cartItems)
      .leftJoin(
        schema.products,
        eq(schema.cartItems.productId, schema.products.id)
      )
      .where(eq(schema.cartItems.id, itemId))
      .limit(1);

    if (!itemWithProduct) {
      throw new Error("Cart item not found");
    }

    const item = {
      id: itemWithProduct.id,
      cartSessionId: itemWithProduct.cartSessionId,
      productId: itemWithProduct.productId || undefined,
      categoryId: itemWithProduct.categoryId || undefined,
      itemName: itemWithProduct.itemName || undefined,
      itemType: itemWithProduct.itemType as "UNIT" | "WEIGHT",
      quantity: itemWithProduct.quantity || undefined,
      weight: itemWithProduct.weight || undefined,
      unitOfMeasure: itemWithProduct.unitOfMeasure || undefined,
      unitPrice: itemWithProduct.unitPrice,
      totalPrice: itemWithProduct.totalPrice,
      taxAmount: itemWithProduct.taxAmount,
      batchId: itemWithProduct.batchId || undefined,
      batchNumber: itemWithProduct.batchNumber || undefined,
      expiryDate: itemWithProduct.expiryDate
        ? (itemWithProduct.expiryDate as Date | string)
        : undefined,
      ageRestrictionLevel: (itemWithProduct.ageRestrictionLevel || "NONE") as
        | "NONE"
        | "AGE_16"
        | "AGE_18"
        | "AGE_21",
      ageVerified: Boolean(itemWithProduct.ageVerified),
      scaleReadingWeight: itemWithProduct.scaleReadingWeight || undefined,
      scaleReadingStable: Boolean(itemWithProduct.scaleReadingStable),
      addedAt: itemWithProduct.addedAt as Date | string,
      updatedAt: itemWithProduct.updatedAt as Date | string,
    } as CartItem;

    // If product exists, add it to the item
    if (itemWithProduct.product) {
      (item as any).product = itemWithProduct.product as any;
    }

    return item;
  }

  /**
   * Get all items for a cart session
   * Populates product information when productId is present
   */
  async getItemsBySession(sessionId: string): Promise<CartItem[]> {
    const itemsWithProducts = await this.db
      .select({
        // Cart item fields
        id: schema.cartItems.id,
        cartSessionId: schema.cartItems.cartSessionId,
        productId: schema.cartItems.productId,
        categoryId: schema.cartItems.categoryId,
        itemName: schema.cartItems.itemName,
        itemType: schema.cartItems.itemType,
        quantity: schema.cartItems.quantity,
        weight: schema.cartItems.weight,
        unitOfMeasure: schema.cartItems.unitOfMeasure,
        unitPrice: schema.cartItems.unitPrice,
        totalPrice: schema.cartItems.totalPrice,
        taxAmount: schema.cartItems.taxAmount,
        batchId: schema.cartItems.batchId,
        batchNumber: schema.cartItems.batchNumber,
        expiryDate: schema.cartItems.expiryDate,
        ageRestrictionLevel: schema.cartItems.ageRestrictionLevel,
        ageVerified: schema.cartItems.ageVerified,
        scaleReadingWeight: schema.cartItems.scaleReadingWeight,
        scaleReadingStable: schema.cartItems.scaleReadingStable,
        addedAt: schema.cartItems.addedAt,
        updatedAt: schema.cartItems.updatedAt,
        // Product fields (optional, only when productId is set)
        product: schema.products,
      })
      .from(schema.cartItems)
      .leftJoin(
        schema.products,
        eq(schema.cartItems.productId, schema.products.id)
      )
      .where(eq(schema.cartItems.cartSessionId, sessionId))
      .orderBy(asc(schema.cartItems.addedAt));

    // Transform the results to match CartItem interface with product populated
    return itemsWithProducts.map((row) => {
      const item = {
        id: row.id,
        cartSessionId: row.cartSessionId,
        productId: row.productId || undefined,
        categoryId: row.categoryId || undefined,
        itemName: row.itemName || undefined,
        itemType: row.itemType as "UNIT" | "WEIGHT",
        quantity: row.quantity || undefined,
        weight: row.weight || undefined,
        unitOfMeasure: row.unitOfMeasure || undefined,
        unitPrice: row.unitPrice,
        totalPrice: row.totalPrice,
        taxAmount: row.taxAmount,
        batchId: row.batchId || undefined,
        batchNumber: row.batchNumber || undefined,
        expiryDate: row.expiryDate
          ? (row.expiryDate as Date | string)
          : undefined,
        ageRestrictionLevel: (row.ageRestrictionLevel || "NONE") as
          | "NONE"
          | "AGE_16"
          | "AGE_18"
          | "AGE_21",
        ageVerified: Boolean(row.ageVerified),
        scaleReadingWeight: row.scaleReadingWeight || undefined,
        scaleReadingStable: Boolean(row.scaleReadingStable),
        addedAt: row.addedAt as Date | string,
        updatedAt: row.updatedAt as Date | string,
      } as CartItem;

      // If product exists, add it to the item
      if (row.product) {
        (item as any).product = row.product as any;
      }

      return item;
    }) as CartItem[];
  }

  /**
   * Update cart item
   */
  async updateItem(
    itemId: string,
    updates: Partial<
      Omit<
        CartItem,
        "id" | "cartSessionId" | "productId" | "addedAt" | "updatedAt"
      >
    >
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
