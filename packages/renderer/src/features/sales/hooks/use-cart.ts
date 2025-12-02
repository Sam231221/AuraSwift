/**
 * Hook for managing cart operations
 * Handles cart session initialization, adding/removing items, and calculating totals
 */

import { useState, useCallback, useMemo, useEffect } from "react";
import { toast } from "sonner";
import type {
  CartSession,
  CartItemWithProduct,
} from "@/types/features/cart";
import type { Product } from "@/types/domain";
import type { Category } from "@/types/domain/category";

import { getLogger } from "@/shared/utils/logger";
const logger = getLogger("use-cart");
import {
  calculateItemPrice,
  calculateCategoryPrice,
  calculateCartTotals,
} from "../utils/price-calculations";
import {
  isWeightedProduct,
  getProductSalesUnit,
} from "../utils/product-helpers";
import {
  useSalesUnitSettings,
  getEffectiveSalesUnit,
} from "@/shared/hooks/use-sales-unit-settings";

interface UseCartProps {
  userId: string | undefined;
  businessId: string | undefined;
  userRole: string | undefined;
  activeShift: { id: string } | null;
  todaySchedule: { id: string } | null;
}

/**
 * Hook for managing cart
 * @param props - Cart configuration props
 * @returns Cart state and operations
 */
export function useCart({
  userId,
  businessId,
  userRole,
  activeShift,
  todaySchedule,
}: UseCartProps) {
  const salesUnitSettings = useSalesUnitSettings(businessId);
  const [cartSession, setCartSession] = useState<CartSession | null>(null);
  const [cartItems, setCartItems] = useState<CartItemWithProduct[]>([]);
  const [loadingCart, setLoadingCart] = useState(false);

  /**
   * Initialize or recover cart session
   */
  const initializeCartSession =
    useCallback(async (): Promise<CartSession | null> => {
      if (!businessId || !userId) {
        logger.warn("Cannot initialize cart: missing user data");
        return null;
      }

      // For cashiers/managers, check if shift exists first
      if (userRole === "cashier" || userRole === "manager") {
        if (!activeShift) {
          setLoadingCart(false);
          return null; // Don't proceed if no shift
        }
      }

      try {
        setLoadingCart(true);

        // Try to get active session first
        const activeSessionResponse = await window.cartAPI.getActiveSession(
          userId
        );

        if (activeSessionResponse.success && activeSessionResponse.data) {
          // Recover existing session
          const session = activeSessionResponse.data as CartSession;
          setCartSession(session);

          // Load items for this session
          const itemsResponse = await window.cartAPI.getItems(session.id);
          if (itemsResponse.success && itemsResponse.data) {
            const items = itemsResponse.data as CartItemWithProduct[];
            setCartItems(items);
            if (items.length > 0) {
              toast.info(`Recovered cart with ${items.length} item(s)`);
            }
          }
          return session;
        } else {
          // Create new session
          // For admin/owner mode, shiftId can be null/undefined
          // For cashier/manager mode, activeShift is required
          const requiresShift =
            userRole === "cashier" || userRole === "manager";
          if (requiresShift && !activeShift) {
            setLoadingCart(false);
            return null;
          }

          const newSessionResponse = await window.cartAPI.createSession({
            cashierId: userId,
            shiftId: activeShift?.id, // Can be undefined for admin mode
            businessId,
          });

          if (newSessionResponse.success && newSessionResponse.data) {
            const session = newSessionResponse.data as CartSession;
            setCartSession(session);
            setCartItems([]);
            return session;
          } else {
            logger.error("Failed to create cart session:", newSessionResponse);
            return null;
          }
        }
      } catch (error) {
        logger.error("Error initializing cart session:", error);
        return null;
      } finally {
        setLoadingCart(false);
      }
    }, [userId, businessId, userRole, activeShift]);

  /**
   * Add product to cart
   */
  const addToCart = useCallback(
    async (
      product: Product,
      weight?: number,
      customPrice?: number,
      ageVerified: boolean = false,
      sessionOverride?: CartSession | null,
      batchData?: {
        batchId: string;
        batchNumber: string;
        expiryDate: Date;
      } | null,
      scaleReading?: {
        weight: number;
        stable: boolean;
      } | null
    ) => {
      // Check if operations are disabled (no active shift but has scheduled shift)
      const operationsDisabled =
        (userRole === "cashier" || userRole === "manager") &&
        !activeShift &&
        todaySchedule;

      if (operationsDisabled) {
        toast.error("Please start your shift before adding items to cart");
        return;
      }

      // Ensure cart session is initialized before adding items
      let currentSession =
        sessionOverride !== undefined ? sessionOverride : cartSession;
      if (!currentSession) {
        logger.info("🛒 Cart session not found, initializing...");
        try {
          const newSession = await initializeCartSession();
          if (!newSession) {
            toast.error("Failed to initialize cart session. Please try again.");
            return;
          }
          currentSession = newSession;
        } catch (error) {
          logger.error("Error initializing cart session:", error);
          toast.error("Failed to initialize cart session. Please try again.");
          return;
        }
      }

      const isWeighted = isWeightedProduct(product);
      const productSalesUnit = getProductSalesUnit(product);
      const salesUnit = getEffectiveSalesUnit(
        productSalesUnit,
        salesUnitSettings
      );

      // Validate weight for weighted items
      if (isWeighted && (!weight || weight <= 0)) {
        toast.error(
          `Please enter a weight for ${product.name}. Weighted items require a weight value.`
        );
        return;
      }

      // Determine item type
      const itemType: "UNIT" | "WEIGHT" = isWeighted ? "WEIGHT" : "UNIT";

      logger.info(
        `🛒 Adding to cart: ${product.name} ${
          isWeighted && weight ? `(${weight.toFixed(2)} ${salesUnit})` : ""
        } ${customPrice ? `@ £${customPrice}` : ""}`
      );

      try {
        // Fetch latest cart items to ensure we have up-to-date data
        const itemsResponse = await window.cartAPI.getItems(currentSession.id);
        const latestCartItems =
          itemsResponse.success && itemsResponse.data
            ? (itemsResponse.data as CartItemWithProduct[])
            : [];

        // Update state with latest cart items to keep it in sync
        if (itemsResponse.success && itemsResponse.data) {
          setCartItems(itemsResponse.data as CartItemWithProduct[]);
        }

        // Calculate pricing using utility function
        let priceCalculation;
        try {
          priceCalculation = calculateItemPrice(product, weight, customPrice);
        } catch (error) {
          const errorMessage =
            error instanceof Error
              ? error.message
              : "Invalid price calculation";
          toast.error(errorMessage);
          return;
        }

        const { unitPrice, totalPrice, taxAmount } = priceCalculation;

        // Check for existing item to update quantity/weight
        const existingItem = latestCartItems.find(
          (item) => item.productId === product.id && item.itemType === itemType
        );

        if (existingItem) {
          // Update existing item
          // For weighted items: quantity = number of items (always increments by 1), weight = total weight
          // For unit items: quantity = number of units (increments by 1)
          const newQuantity =
            existingItem.itemType === "UNIT"
              ? (existingItem.quantity || 0) + 1
              : existingItem.itemType === "WEIGHT"
              ? (existingItem.quantity || 0) + 1 // Each addition = 1 item
              : existingItem.quantity;
          const newWeight =
            existingItem.itemType === "WEIGHT"
              ? (existingItem.weight || 0) + (weight || 0) // Accumulate weight for pricing
              : existingItem.weight;

          // Recalculate totals for updated item
          const newSubtotal =
            existingItem.itemType === "UNIT"
              ? unitPrice * (newQuantity || 1)
              : unitPrice * (newWeight || 0);
          const newTaxAmount = newSubtotal * (product.taxRate ?? 0.08);
          const finalTotalPrice = newSubtotal + newTaxAmount;

          const updateResponse = await window.cartAPI.updateItem(
            existingItem.id,
            {
              quantity: newQuantity ?? undefined,
              weight: newWeight ?? undefined,
              totalPrice: finalTotalPrice,
              taxAmount: newTaxAmount,
            }
          );

          if (updateResponse.success) {
            // Reload cart items
            const itemsResponse = await window.cartAPI.getItems(
              currentSession.id
            );
            if (itemsResponse.success && itemsResponse.data) {
              setCartItems(itemsResponse.data as CartItemWithProduct[]);
            }

            toast.success(
              `Added ${product.name}${
                existingItem.itemType === "UNIT"
                  ? ` (${newQuantity}x)`
                  : ` - ${(newWeight || 0).toFixed(2)} ${salesUnit}`
              }`
            );
          } else {
            const errorMessage =
              updateResponse.message || "Failed to update cart item";
            logger.error("Failed to update cart item:", errorMessage);
            toast.error(errorMessage);
          }
        } else {
          // Add new item to cart (1 item per addition, regardless of weight/price)
          // For weighted items: quantity = 1 (count items), weight = actual weight (for batch deduction & pricing)
          // For unit items: quantity = 1 (one unit to deduct from batch)
          // Note: Transaction handler uses item.weight for weighted items and item.quantity for unit items
          const itemQuantity =
            itemType === "UNIT"
              ? 1 // Each addition = 1 unit (will deduct 1 from batch)
              : itemType === "WEIGHT"
              ? 1 // Each addition = 1 item (quantity always 1, weight stored separately)
              : undefined;

          const addResponse = await window.cartAPI.addItem({
            cartSessionId: currentSession.id,
            productId: product.id,
            itemName: product.name,
            itemType,
            quantity: itemQuantity,
            weight: itemType === "WEIGHT" ? weight ?? undefined : undefined,
            unitOfMeasure: salesUnit,
            unitPrice,
            totalPrice,
            taxAmount,
            batchId: batchData?.batchId,
            batchNumber: batchData?.batchNumber,
            expiryDate: batchData?.expiryDate,
            ageRestrictionLevel: product.ageRestrictionLevel || "NONE",
            ageVerified,
            scaleReadingWeight: scaleReading?.weight,
            scaleReadingStable: scaleReading?.stable ?? true,
          });

          if (addResponse.success) {
            // Reload cart items
            const itemsResponse = await window.cartAPI.getItems(
              currentSession.id
            );
            if (itemsResponse.success && itemsResponse.data) {
              setCartItems(itemsResponse.data as CartItemWithProduct[]);
            }

            toast.success(
              `Added ${product.name}${
                isWeighted && weight
                  ? ` - ${weight.toFixed(2)} ${salesUnit}`
                  : ""
              }`
            );
          } else {
            const errorMessage =
              addResponse.message || "Failed to add item to cart";
            logger.error("Failed to add item to cart:", errorMessage);
            toast.error(errorMessage);
          }
        }
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : "Failed to add item to cart";
        logger.error("Error adding to cart:", error);
        toast.error(errorMessage);
      }
    },
    [
      cartSession,
      userRole,
      activeShift,
      todaySchedule,
      initializeCartSession,
      salesUnitSettings,
    ]
  );

  /**
   * Add category to cart with custom price
   */
  const addCategoryToCart = useCallback(
    async (
      category: Category,
      price: number,
      sessionOverride?: CartSession | null
    ) => {
      // Check if operations are disabled
      const operationsDisabled =
        (userRole === "cashier" || userRole === "manager") &&
        !activeShift &&
        todaySchedule;

      if (operationsDisabled) {
        toast.error("Please start your shift before adding items to cart");
        return;
      }

      // Ensure cart session is initialized
      let currentSession =
        sessionOverride !== undefined ? sessionOverride : cartSession;
      if (!currentSession) {
        logger.info("🛒 Cart session not found, initializing...");
        try {
          const newSession = await initializeCartSession();
          if (!newSession) {
            toast.error("Failed to initialize cart session. Please try again.");
            return;
          }
          currentSession = newSession;
        } catch (error) {
          logger.error("Error initializing cart session:", error);
          toast.error("Failed to initialize cart session. Please try again.");
          return;
        }
      }

      // Calculate pricing using utility function
      let priceCalculation;
      try {
        priceCalculation = calculateCategoryPrice(price);
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : "Invalid price";
        toast.error(errorMessage);
        return;
      }

      const { unitPrice, totalPrice, taxAmount } = priceCalculation;

      logger.info(`🛒 Adding category to cart: ${category.name} @ £${price}`);

      try {
        // Always create a new row for category items since prices can differ each time
        // This allows cashiers to add the same category multiple times with different prices
        const addResponse = await window.cartAPI.addItem({
          cartSessionId: currentSession.id,
          categoryId: category.id,
          itemName: category.name,
          itemType: "UNIT",
          quantity: 1,
          unitOfMeasure: "each",
          unitPrice,
          totalPrice,
          taxAmount,
          ageRestrictionLevel: "NONE",
          ageVerified: false,
        });

        if (addResponse.success) {
          // Reload cart items
          const itemsResponse = await window.cartAPI.getItems(
            currentSession.id
          );
          if (itemsResponse.success && itemsResponse.data) {
            setCartItems(itemsResponse.data as CartItemWithProduct[]);
          }

          toast.success(`Added ${category.name} @ £${price.toFixed(2)}`);
        } else {
          const errorMessage =
            addResponse.message || "Failed to add item to cart";
          logger.error("Failed to add item to cart:", errorMessage);
          toast.error(errorMessage);
        }
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : "Failed to add item to cart";
        logger.error("Error adding category to cart:", error);
        toast.error(errorMessage);
      }
    },
    [cartSession, userRole, activeShift, todaySchedule, initializeCartSession]
  );

  /**
   * Remove item from cart
   */
  const removeFromCart = useCallback(
    async (itemId: string) => {
      if (!cartSession) return;

      try {
        const response = await window.cartAPI.removeItem(itemId);
        if (response.success) {
          // Reload cart items
          const itemsResponse = await window.cartAPI.getItems(cartSession.id);
          if (itemsResponse.success && itemsResponse.data) {
            setCartItems(itemsResponse.data as CartItemWithProduct[]);
          }
          toast.success("Item removed from cart");
        } else {
          toast.error("Failed to remove item from cart");
        }
      } catch (error: unknown) {
        logger.error("Error removing from cart:", error);
        toast.error("Failed to remove item from cart");
      }
    },
    [cartSession]
  );

  /**
   * Calculate cart totals
   */
  const { subtotal, tax, total } = useMemo(() => {
    return calculateCartTotals(cartItems);
  }, [cartItems]);

  /**
   * Update cart session totals when items change
   */
  useEffect(() => {
    if (cartSession && cartSession.status === "ACTIVE") {
      window.cartAPI
        .updateSession(cartSession.id, {
          totalAmount: total,
          taxAmount: tax,
        })
        .catch((error: unknown) =>
          logger.error("Failed to update cart session", error)
        );
    }
  }, [total, tax, cartSession]);

  return {
    cartSession,
    cartItems,
    loadingCart,
    subtotal,
    tax,
    total,
    initializeCartSession,
    addToCart,
    addCategoryToCart,
    removeFromCart,
  };
}
