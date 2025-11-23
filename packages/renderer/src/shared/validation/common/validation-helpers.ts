/**
 * Validation Helper Functions
 * 
 * Utility functions for working with Zod schemas and validation errors
 */

import { z } from "zod";

/**
 * Transform Zod errors into a flat record of field errors
 * Useful for displaying errors outside of react-hook-form context
 */
export function getFieldErrors(error: z.ZodError): Record<string, string> {
  const fieldErrors: Record<string, string> = {};

  error.issues.forEach((issue) => {
    const path = issue.path.join(".");
    if (path && !fieldErrors[path]) {
      fieldErrors[path] = issue.message;
    }
  });

  return fieldErrors;
}

/**
 * Get all error messages as an array
 * Useful for displaying general error messages
 */
export function getAllErrorMessages(error: z.ZodError): string[] {
  return error.issues.map((issue) => issue.message);
}

/**
 * Get the first error message
 * Useful for toast notifications
 */
export function getFirstErrorMessage(error: z.ZodError): string {
  const firstIssue = error.issues[0];
  if (!firstIssue) return "Validation failed";
  
  const path = firstIssue.path.length > 0 
    ? `${firstIssue.path.join(".")}: ${firstIssue.message}`
    : firstIssue.message;
  
  return path;
}

/**
 * Get error message for a specific field
 */
export function getFieldError(error: z.ZodError, fieldPath: string | string[]): string | undefined {
  const path = Array.isArray(fieldPath) ? fieldPath.join(".") : fieldPath;
  
  const issue = error.issues.find((issue) => {
    return issue.path.join(".") === path;
  });
  
  return issue?.message;
}

/**
 * Check if a value passes validation for a given schema
 */
export function isValid<T extends z.ZodTypeAny>(
  schema: T,
  value: unknown
): value is z.infer<T> {
  return schema.safeParse(value).success;
}

/**
 * Safe parse with error handling
 * Returns a consistent result format
 */
export function safeValidate<T extends z.ZodTypeAny>(
  schema: T,
  value: unknown
): {
  success: boolean;
  data?: z.infer<T>;
  errors?: Record<string, string>;
  errorMessage?: string;
} {
  const result = schema.safeParse(value);

  if (result.success) {
    return {
      success: true,
      data: result.data,
    };
  }

  return {
    success: false,
    errors: getFieldErrors(result.error),
    errorMessage: getFirstErrorMessage(result.error),
  };
}

