/**
 * Unit Tests for Cart Calculations
 * 
 * Tests the core business logic for calculating cart totals, taxes, and discounts.
 * This is critical functionality that must be thoroughly tested.
 */

import { describe, it, expect } from 'vitest';

/**
 * Calculate cart subtotal (sum of all item prices before tax/discounts)
 */
export function calculateSubtotal(items: Array<{ quantity: number; unitPrice: number }>): number {
  return items.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0);
}

/**
 * Calculate tax amount
 */
export function calculateTax(subtotal: number, taxRate: number): number {
  if (subtotal < 0) throw new Error('Subtotal cannot be negative');
  if (taxRate < 0 || taxRate > 100) throw new Error('Tax rate must be between 0 and 100');
  
  return subtotal * (taxRate / 100);
}

/**
 * Calculate discount amount
 */
export function calculateDiscount(
  subtotal: number,
  discountType: 'percentage' | 'fixed',
  discountValue: number
): number {
  if (subtotal < 0) throw new Error('Subtotal cannot be negative');
  if (discountValue < 0) throw new Error('Discount value cannot be negative');

  if (discountType === 'percentage') {
    if (discountValue > 100) throw new Error('Percentage discount cannot exceed 100%');
    return subtotal * (discountValue / 100);
  }
  
  // For fixed discounts, cap at subtotal amount
  return Math.min(discountValue, subtotal);
}

/**
 * Calculate cart total
 */
export function calculateTotal(
  subtotal: number,
  tax: number,
  discount: number
): number {
  const total = subtotal + tax - discount;
  
  // Ensure total doesn't go negative
  return Math.max(0, total);
}

describe('cartCalculations', () => {
  describe('calculateSubtotal', () => {
    it('should calculate subtotal for single item', () => {
      const items = [{ quantity: 2, unitPrice: 10.00 }];
      
      const result = calculateSubtotal(items);
      
      expect(result).toBe(20.00);
    });

    it('should calculate subtotal for multiple items', () => {
      const items = [
        { quantity: 2, unitPrice: 10.00 },
        { quantity: 3, unitPrice: 5.00 },
        { quantity: 1, unitPrice: 25.00 },
      ];
      
      const result = calculateSubtotal(items);
      
      expect(result).toBe(60.00); // (2*10) + (3*5) + (1*25)
    });

    it('should return 0 for empty cart', () => {
      const result = calculateSubtotal([]);
      
      expect(result).toBe(0);
    });

    it('should handle decimal quantities (for weighed items)', () => {
      const items = [{ quantity: 1.5, unitPrice: 10.00 }];
      
      const result = calculateSubtotal(items);
      
      expect(result).toBe(15.00);
    });

    it('should handle very small amounts without rounding errors', () => {
      const items = [{ quantity: 1, unitPrice: 0.01 }];
      
      const result = calculateSubtotal(items);
      
      expect(result).toBe(0.01);
    });
  });

  describe('calculateTax', () => {
    it('should calculate 20% VAT correctly', () => {
      const result = calculateTax(100, 20);
      
      expect(result).toBe(20);
    });

    it('should calculate 0% tax (zero-rated items)', () => {
      const result = calculateTax(100, 0);
      
      expect(result).toBe(0);
    });

    it('should calculate 5% reduced VAT', () => {
      const result = calculateTax(100, 5);
      
      expect(result).toBe(5);
    });

    it('should handle decimal subtotals', () => {
      const result = calculateTax(123.45, 20);
      
      expect(result).toBeCloseTo(24.69, 2);
    });

    it('should throw error for negative subtotal', () => {
      expect(() => calculateTax(-100, 20))
        .toThrow('Subtotal cannot be negative');
    });

    it('should throw error for negative tax rate', () => {
      expect(() => calculateTax(100, -10))
        .toThrow('Tax rate must be between 0 and 100');
    });

    it('should throw error for tax rate over 100', () => {
      expect(() => calculateTax(100, 101))
        .toThrow('Tax rate must be between 0 and 100');
    });
  });

  describe('calculateDiscount', () => {
    describe('percentage discounts', () => {
      it('should calculate 10% discount', () => {
        const result = calculateDiscount(100, 'percentage', 10);
        
        expect(result).toBe(10);
      });

      it('should calculate 50% discount', () => {
        const result = calculateDiscount(100, 'percentage', 50);
        
        expect(result).toBe(50);
      });

      it('should calculate 100% discount (free)', () => {
        const result = calculateDiscount(100, 'percentage', 100);
        
        expect(result).toBe(100);
      });

      it('should throw error for percentage over 100', () => {
        expect(() => calculateDiscount(100, 'percentage', 101))
          .toThrow('Percentage discount cannot exceed 100%');
      });

      it('should handle decimal percentages', () => {
        const result = calculateDiscount(100, 'percentage', 12.5);
        
        expect(result).toBe(12.5);
      });
    });

    describe('fixed discounts', () => {
      it('should apply fixed discount when less than subtotal', () => {
        const result = calculateDiscount(100, 'fixed', 20);
        
        expect(result).toBe(20);
      });

      it('should cap fixed discount at subtotal amount', () => {
        const result = calculateDiscount(100, 'fixed', 150);
        
        expect(result).toBe(100);
      });

      it('should handle discount equal to subtotal', () => {
        const result = calculateDiscount(100, 'fixed', 100);
        
        expect(result).toBe(100);
      });
    });

    describe('error handling', () => {
      it('should throw error for negative subtotal', () => {
        expect(() => calculateDiscount(-100, 'percentage', 10))
          .toThrow('Subtotal cannot be negative');
      });

      it('should throw error for negative discount value', () => {
        expect(() => calculateDiscount(100, 'percentage', -10))
          .toThrow('Discount value cannot be negative');
      });
    });
  });

  describe('calculateTotal', () => {
    it('should calculate total with tax and discount', () => {
      const subtotal = 100;
      const tax = 20; // 20% VAT
      const discount = 10; // £10 off
      
      const result = calculateTotal(subtotal, tax, discount);
      
      expect(result).toBe(110); // 100 + 20 - 10
    });

    it('should calculate total with only tax', () => {
      const result = calculateTotal(100, 20, 0);
      
      expect(result).toBe(120);
    });

    it('should calculate total with only discount', () => {
      const result = calculateTotal(100, 0, 10);
      
      expect(result).toBe(90);
    });

    it('should handle total that would be negative', () => {
      const result = calculateTotal(100, 0, 150);
      
      expect(result).toBe(0); // Never go negative
    });

    it('should handle zero subtotal', () => {
      const result = calculateTotal(0, 0, 0);
      
      expect(result).toBe(0);
    });

    it('should handle decimal amounts correctly', () => {
      const result = calculateTotal(99.99, 19.998, 5.00);
      
      expect(result).toBeCloseTo(114.988, 2);
    });
  });

  describe('complete cart calculation flow', () => {
    it('should calculate complete cart with tax and discount', () => {
      // Arrange: Cart with 3 items
      const items = [
        { quantity: 2, unitPrice: 10.00 },  // £20
        { quantity: 1, unitPrice: 15.00 },  // £15
        { quantity: 3, unitPrice: 5.00 },   // £15
      ];
      const taxRate = 20; // 20% VAT
      const discountType: 'percentage' = 'percentage';
      const discountValue = 10; // 10% off
      
      // Act: Calculate total
      const subtotal = calculateSubtotal(items);
      const discount = calculateDiscount(subtotal, discountType, discountValue);
      const subtotalAfterDiscount = subtotal - discount;
      const tax = calculateTax(subtotalAfterDiscount, taxRate);
      const total = calculateTotal(subtotal, tax, discount);
      
      // Assert
      expect(subtotal).toBe(50.00);
      expect(discount).toBe(5.00);
      expect(subtotalAfterDiscount).toBe(45.00);
      expect(tax).toBe(9.00);
      expect(total).toBe(54.00); // £50 - £5 + £9
    });

    it('should handle cart with no discount', () => {
      const items = [{ quantity: 1, unitPrice: 100.00 }];
      const taxRate = 20;
      
      const subtotal = calculateSubtotal(items);
      const tax = calculateTax(subtotal, taxRate);
      const total = calculateTotal(subtotal, tax, 0);
      
      expect(total).toBe(120.00);
    });

    it('should handle cart with 100% discount', () => {
      const items = [{ quantity: 1, unitPrice: 100.00 }];
      const discount = calculateDiscount(100, 'percentage', 100);
      const total = calculateTotal(100, 0, discount);
      
      expect(total).toBe(0);
    });
  });
});

