import type { Config } from "drizzle-kit";

export default {
  schema: [
    "./packages/main/src/database/schema/auth.ts",
    "./packages/main/src/database/schema/discounts.ts",
    "./packages/main/src/database/schema/inventory.ts",
    "./packages/main/src/database/schema/printing.ts",
    "./packages/main/src/database/schema/products.ts",
    "./packages/main/src/database/schema/relations.ts",
    "./packages/main/src/database/schema/reports.ts",
    "./packages/main/src/database/schema/shifts.ts",
    "./packages/main/src/database/schema/system.ts",
    "./packages/main/src/database/schema/time-tracking.ts",
    "./packages/main/src/database/schema/transactions.ts",
    "./packages/main/src/database/schema/validation.ts",
  ],
  out: "./packages/main/src/database/migrations",
  dialect: "sqlite",
  dbCredentials: {
    url: "./data/pos_system.db",
  },
  verbose: true,
  strict: true,
} satisfies Config;
