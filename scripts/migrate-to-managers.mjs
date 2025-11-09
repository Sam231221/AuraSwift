#!/usr/bin/env node

/**
 * Migration Script: Old Database API → Manager API
 *
 * This script automatically updates code to use the new manager-based API
 * instead of direct database method calls.
 *
 * Usage:
 *   node scripts/migrate-to-managers.mjs [file-pattern]
 *
 * Examples:
 *   node scripts/migrate-to-managers.mjs                    # Migrate test files
 *   node scripts/migrate-to-managers.mjs "src/**\/*.ts"      # Migrate src folder
 */

import { readFileSync, writeFileSync } from "fs";
import { globSync } from "glob";

// Migration map: old method → new manager method
const MIGRATIONS = [
  // UserManager - Drizzle methods
  {
    pattern: /db\.getUserByEmailDrizzle\(/g,
    replacement: "db.users.getByEmailDrizzle(",
  },
  {
    pattern: /db\.getUserByIdDrizzle\(/g,
    replacement: "db.users.getByIdDrizzle(",
  },
  {
    pattern: /db\.getUsersByBusinessDrizzle\(/g,
    replacement: "db.users.getByBusinessDrizzle(",
  },
  {
    pattern: /db\.searchUsersDrizzle\(/g,
    replacement: "db.users.searchDrizzle(",
  },
  {
    pattern: /db\.getUserWithBusinessDrizzle\(/g,
    replacement: "db.users.getWithBusinessDrizzle(",
  },
  {
    pattern: /db\.createUserDrizzle\(/g,
    replacement: "db.users.createDrizzle(",
  },
  {
    pattern: /db\.updateUserDrizzle\(/g,
    replacement: "db.users.updateDrizzle(",
  },
  {
    pattern: /db\.deleteUserDrizzle\(/g,
    replacement: "db.users.deleteDrizzle(",
  },

  // UserManager - Raw SQL methods to Manager API
  {
    pattern: /\bdb\.getUserByEmail\(/g,
    replacement: "db.users.getUserByEmail(",
  },
  {
    pattern: /\bdb\.getUserById\(/g,
    replacement: "db.users.getUserById(",
  },
  {
    pattern: /\bdb\.getUsersByBusiness\(/g,
    replacement: "db.users.getUsersByBusiness(",
  },
  {
    pattern: /\bdb\.createUser\(/g,
    replacement: "db.users.createUser(",
  },
  {
    pattern: /\bdb\.updateUser\(/g,
    replacement: "db.users.updateUser(",
  },
  {
    pattern: /\bdb\.deleteUser\(/g,
    replacement: "db.users.deleteUser(",
  },

  // ProductManager - Raw SQL methods to Manager API
  {
    pattern: /\bdb\.getProductById\(/g,
    replacement: "db.products.getProductById(",
  },
  {
    pattern: /\bdb\.getProductByPLU\(/g,
    replacement: "db.products.getProductByPLU(",
  },
  {
    pattern: /\bdb\.getProductsByBusiness\(/g,
    replacement: "db.products.getProductsByBusiness(",
  },
  {
    pattern: /\bdb\.createProduct\(/g,
    replacement: "db.products.createProduct(",
  },
  {
    pattern: /\bdb\.updateProduct\(/g,
    replacement: "db.products.updateProduct(",
  },
  {
    pattern: /\bdb\.deleteProduct\(/g,
    replacement: "db.products.deleteProduct(",
  },
  {
    pattern: /\bdb\.getProductModifiers\(/g,
    replacement: "db.products.getProductModifiers(",
  },
  {
    pattern: /\bdb\.createModifier\(/g,
    replacement: "db.products.createModifier(",
  },
  {
    pattern: /\bdb\.createModifierOption\(/g,
    replacement: "db.products.createModifierOption(",
  },
  {
    pattern: /\bdb\.removeModifierFromProduct\(/g,
    replacement: "db.products.removeModifierFromProduct(",
  },

  // CategoryManager - Raw SQL methods to Manager API
  {
    pattern: /\bdb\.createCategory\(/g,
    replacement: "db.categories.createCategory(",
  },
  {
    pattern: /\bdb\.updateCategory\(/g,
    replacement: "db.categories.updateCategory(",
  },
  {
    pattern: /\bdb\.deleteCategory\(/g,
    replacement: "db.categories.deleteCategory(",
  },
  {
    pattern: /\bdb\.getCategoriesByBusiness\(/g,
    replacement: "db.categories.getCategoriesByBusiness(",
  },

  // ProductManager
  {
    pattern: /db\.getProductsByBusinessDrizzle\(/g,
    replacement: "db.products.getByBusinessDrizzle(",
  },
  {
    pattern: /db\.searchProductsDrizzle\(/g,
    replacement: "db.products.searchDrizzle(",
  },
  {
    pattern: /db\.getProductsWithCategoryDrizzle\(/g,
    replacement: "db.products.getWithCategoryDrizzle(",
  },
  {
    pattern: /db\.getLowStockProductsDrizzle\(/g,
    replacement: "db.products.getLowStockDrizzle(",
  },
  {
    pattern: /db\.createProductDrizzle\(/g,
    replacement: "db.products.createDrizzle(",
  },
  {
    pattern: /db\.updateProductDrizzle\(/g,
    replacement: "db.products.updateDrizzle(",
  },
  {
    pattern: /db\.deleteProductDrizzle\(/g,
    replacement: "db.products.deleteDrizzle(",
  },

  // TransactionManager
  {
    pattern: /db\.getTransactionByIdDrizzle\(/g,
    replacement: "db.transactions.getByIdDrizzle(",
  },
  {
    pattern: /db\.getRecentTransactionsDrizzle\(/g,
    replacement: "db.transactions.getRecentDrizzle(",
  },
  {
    pattern: /db\.getTransactionsByShiftDrizzle\(/g,
    replacement: "db.transactions.getByShiftDrizzle(",
  },
  {
    pattern: /db\.getTransactionItemsDrizzle\(/g,
    replacement: "db.transactions.getItemsDrizzle(",
  },
  {
    pattern: /db\.createTransactionDrizzle\(/g,
    replacement: "db.transactions.createDrizzle(",
  },
  {
    pattern: /db\.createTransactionItemDrizzle\(/g,
    replacement: "db.transactions.createItemDrizzle(",
  },
  {
    pattern: /db\.createAppliedModifierDrizzle\(/g,
    replacement: "db.transactions.createAppliedModifierDrizzle(",
  },
  {
    pattern: /db\.createRefundDrizzle\(/g,
    replacement: "db.transactions.createRefundDrizzle(",
  },
  {
    pattern: /db\.voidTransactionDrizzle\(/g,
    replacement: "db.transactions.voidDrizzle(",
  },

  // CategoryManager
  {
    pattern: /db\.getCategoryByIdDrizzle\(/g,
    replacement: "db.categories.getByIdDrizzle(",
  },
  {
    pattern: /db\.getCategoriesByBusinessDrizzle\(/g,
    replacement: "db.categories.getByBusinessDrizzle(",
  },
  {
    pattern: /db\.searchCategoriesDrizzle\(/g,
    replacement: "db.categories.searchDrizzle(",
  },
  {
    pattern: /db\.getCategoryHierarchyDrizzle\(/g,
    replacement: "db.categories.getHierarchyDrizzle(",
  },
  {
    pattern: /db\.createCategoryDrizzle\(/g,
    replacement: "db.categories.createDrizzle(",
  },
  {
    pattern: /db\.updateCategoryDrizzle\(/g,
    replacement: "db.categories.updateDrizzle(",
  },
  {
    pattern: /db\.deleteCategoryDrizzle\(/g,
    replacement: "db.categories.deleteDrizzle(",
  },

  // ShiftManager
  {
    pattern: /db\.createShiftDrizzle\(/g,
    replacement: "db.shifts.createDrizzle(",
  },
  { pattern: /db\.endShiftDrizzle\(/g, replacement: "db.shifts.endDrizzle(" },

  // ScheduleManager
  {
    pattern: /db\.createScheduleDrizzle\(/g,
    replacement: "db.schedules.createDrizzle(",
  },
  {
    pattern: /db\.getSchedulesByBusinessIdDrizzle\(/g,
    replacement: "db.schedules.getByBusinessIdDrizzle(",
  },
  {
    pattern: /db\.getSchedulesByStaffIdDrizzle\(/g,
    replacement: "db.schedules.getByStaffIdDrizzle(",
  },
  {
    pattern: /db\.updateScheduleStatusDrizzle\(/g,
    replacement: "db.schedules.updateStatusDrizzle(",
  },
  {
    pattern: /db\.updateScheduleDrizzle\(/g,
    replacement: "db.schedules.updateDrizzle(",
  },
  {
    pattern: /db\.deleteScheduleDrizzle\(/g,
    replacement: "db.schedules.deleteDrizzle(",
  },

  // SessionManager
  {
    pattern: /db\.deleteUserSessionsDrizzle\(/g,
    replacement: "db.sessions.deleteUserSessionsDrizzle(",
  },
  {
    pattern: /db\.cleanupExpiredSessionsDrizzle\(/g,
    replacement: "db.sessions.cleanupExpiredSessionsDrizzle(",
  },
  {
    pattern: /db\.getActiveSessionsDrizzle\(/g,
    replacement: "db.sessions.getActiveSessionsDrizzle(",
  },

  // AuditLogManager
  {
    pattern: /db\.createAuditLogDrizzle\(/g,
    replacement: "db.auditLogs.createDrizzle(",
  },
  {
    pattern: /db\.getAuditLogsDrizzle\(/g,
    replacement: "db.auditLogs.getDrizzle(",
  },
  {
    pattern: /db\.getAuditLogsByUserDrizzle\(/g,
    replacement: "db.auditLogs.getByUserDrizzle(",
  },
  {
    pattern: /db\.getAuditLogsByResourceDrizzle\(/g,
    replacement: "db.auditLogs.getByResourceDrizzle(",
  },

  // ReportManager
  {
    pattern: /db\.getCurrentCashDrawerBalanceDrizzle\(/g,
    replacement: "db.reports.getCurrentCashDrawerBalanceDrizzle(",
  },
  {
    pattern: /db\.getExpectedCashForShiftDrizzle\(/g,
    replacement: "db.reports.getExpectedCashForShiftDrizzle(",
  },
  {
    pattern: /db\.generateShiftReportDrizzle\(/g,
    replacement: "db.reports.generateShiftReportDrizzle(",
  },
];

function migrateFile(filePath) {
  console.log(`\n📝 Migrating: ${filePath}`);

  let content = readFileSync(filePath, "utf-8");
  let changes = 0;

  for (const { pattern, replacement } of MIGRATIONS) {
    const matches = content.match(pattern);
    if (matches) {
      content = content.replace(pattern, replacement);
      changes += matches.length;
      console.log(
        `   ✓ ${matches.length}x ${pattern.source.split("\\").pop()}`
      );
    }
  }

  if (changes > 0) {
    writeFileSync(filePath, content, "utf-8");
    console.log(`   ✅ ${changes} migrations applied`);
    return changes;
  } else {
    console.log(`   ⏭️  No changes needed`);
    return 0;
  }
}

function main() {
  const args = process.argv.slice(2);
  const filePattern = args[0] || "test-*.{js,mjs,ts}";

  console.log("🚀 Database API Migration Tool");
  console.log("================================");
  console.log(`Pattern: ${filePattern}\n`);

  const files = globSync(filePattern, {
    ignore: ["node_modules/**", "dist/**", "build/**"],
    absolute: true,
  });

  if (files.length === 0) {
    console.log("❌ No files found matching pattern");
    process.exit(1);
  }

  console.log(`Found ${files.length} file(s) to migrate\n`);

  let totalChanges = 0;
  for (const file of files) {
    totalChanges += migrateFile(file);
  }

  console.log("\n================================");
  console.log(`✅ Migration complete!`);
  console.log(`   Files processed: ${files.length}`);
  console.log(`   Total changes: ${totalChanges}`);

  if (totalChanges === 0) {
    console.log("\n💡 All files already using manager API");
  }
}

main();
