/**
 * Transaction-related type definitions
 */

export interface PaymentMethod {
  type: "cash" | "card" | "mobile" | "voucher" | "split";
  amount?: number;
}

export interface BreadcrumbItem {
  id: string | null;
  name: string;
}

export interface Category {
  id: string;
  name: string;
  description?: string;
  businessId: string;
  isActive: boolean;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
  parentId?: string | null;
}

