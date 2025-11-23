/**
 * Validation Message Templates
 * 
 * Centralized validation error messages for consistent UX across the application
 */

export const validationMessages = {
  /**
   * Required field message
   */
  required: (field: string) => `${field} is required`,

  /**
   * Minimum length message
   */
  minLength: (field: string, min: number) =>
    `${field} must be at least ${min} character${min > 1 ? "s" : ""}`,

  /**
   * Maximum length message
   */
  maxLength: (field: string, max: number) =>
    `${field} must not exceed ${max} character${max > 1 ? "s" : ""}`,

  /**
   * Email validation message
   */
  email: "Please enter a valid email address",

  /**
   * Phone validation message
   */
  phone: "Please enter a valid phone number",

  /**
   * Positive number message
   */
  positiveNumber: "Must be greater than zero",

  /**
   * Non-negative number message
   */
  nonNegativeNumber: "Cannot be negative",

  /**
   * Integer message
   */
  integer: "Must be a whole number",

  /**
   * Percentage range message
   */
  percentageRange: "Must be between 0 and 100",

  /**
   * Currency format message
   */
  currencyFormat: "Please enter a valid amount",

  /**
   * URL format message
   */
  url: "Please enter a valid URL",

  /**
   * UUID format message
   */
  uuid: "Invalid ID format",

  /**
   * Date format message
   */
  date: "Please enter a valid date",

  /**
   * Invalid format message
   */
  invalidFormat: (field: string, format: string) =>
    `${field} format is invalid. Expected: ${format}`,

  /**
   * Pattern mismatch message
   */
  pattern: (field: string, description: string) =>
    `${field} ${description}`,
} as const;

