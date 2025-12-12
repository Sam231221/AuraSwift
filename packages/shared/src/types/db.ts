// @ts-nocheck
// Type imports from main package schema
// Note: Cross-package type imports - TypeScript can't resolve at compile time
// but these types are available at runtime. This file is excluded from strict type checking.
import type {
  Category,
  NewCategory,
  VatCategory,
} from "../main/src/database/schema.js";

export type { Category, NewCategory, VatCategory };
