# Database Seeding in AuraSwift

AuraSwift provides two separate mechanisms for seeding the database with default data:

---

## 1. Automatic Seeding on App Startup (`seed.ts`)

- **File:** `packages/main/src/database/seed.ts`
- **How it works:**
  - This TypeScript module exports the function `seedDefaultData`, which is called automatically by the Electron app during database initialization.
  - The call is made in `packages/main/src/database/index.ts`:
    ```ts
    const { seedDefaultData } = await import("./seed.js");
    await seedDefaultData(drizzle, schema);
    ```
  - The function checks if any users exist in the database. If not, it inserts a default business, admin, manager, and cashier users, and some default app settings.
  - This ensures that a fresh database is always initialized with the required minimum data, without manual intervention.
- **When to use:**
  - On first run of the Electron app
  - During development, testing, or production, whenever the app starts with an empty database
- **Notes:**
  - This process is safe: it will not overwrite or duplicate data if the database is already seeded.
  - It uses Drizzle ORM for type-safe, programmatic seeding.

---

## 2. Manual CLI-Based Seeding (`seed-database.mjs`)

- **File:** `seed-database.mjs` (project root)
- **How it works:**
  - This is a standalone Node.js script that seeds the SQLite database directly using raw SQL and the `better-sqlite3` library.
  - Run it manually from the command line:
    ```sh
    npm run db:seed
    # or
    node seed-database.mjs
    ```
  - The script will insert the same default business, users, and app settings as the automatic seeder, but is intended for quick resets, CI, or production automation.
- **When to use:**
  - When you want to manually reset or initialize the database from the CLI
  - During deployment, CI/CD, or for local development setup
- **Notes:**
  - This script does not use Drizzle ORM; it interacts with the database using SQL statements.
  - It is independent of the Electron app and can be run without starting the app.

---

## Summary Table

| File                | Used By      | How Triggered     | ORM/SQL     | Typical Use Case               |
| ------------------- | ------------ | ----------------- | ----------- | ------------------------------ |
| `seed.ts`           | Electron app | On app startup    | Drizzle ORM | Auto-seed on first run         |
| `seed-database.mjs` | CLI/manual   | `npm run db:seed` | Raw SQL     | Manual/automated seeding/reset |

---

**Best Practice:**

- Keep both files in sync regarding the data they insert.
- Use the automatic seeder for app-driven workflows, and the manual script for CLI/automation needs.
