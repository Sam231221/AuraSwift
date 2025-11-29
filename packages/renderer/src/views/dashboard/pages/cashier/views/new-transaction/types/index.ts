/**
 * Type definitions exports
 *
 * @deprecated This file is deprecated. All types have been moved to @/types.
 *
 * Migration: Import types from their new locations:
 * - PaymentMethod, Category → @/types/domain
 * - Shift, Schedule → @/types/domain/shift
 * - BreadcrumbItem → @/types/ui
 */

// Re-export for backward compatibility (will be removed in future)
export * from "./transaction.types";
export * from "./shift.types";
export * from "./payment.types";
