/**
 * Main Schema Index
 * 
 * This file re-exports all schema tables, types, and utilities.
 * Import from this file for a single entry point to the schema.
 */

// Common utilities
export * from "./common.js";

// Tables by domain
export * from "./auth.js";
export * from "./products.js";
export * from "./inventory.js";
export * from "./transactions.js";
export * from "./shifts.js";
export * from "./validation.js";
export * from "./reports.js";
export * from "./discounts.js";
export * from "./time-tracking.js";
export * from "./printing.js";
export * from "./system.js";

// Types and interfaces
export * from "./types.js";

// Relations
export * from "./relations.js";

