import type { Config } from "drizzle-kit";

export default {
  schema: "./packages/main/src/database/schema.ts",
  out: "./packages/main/src/database/migrations",
  dialect: "sqlite",
  dbCredentials: {
    url: "./data/pos_system.db",
  },
  verbose: true,
  strict: true,
} satisfies Config;
