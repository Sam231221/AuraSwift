#!/usr/bin/env tsx
/**
 * Feature Validation Script
 *
 * Validates that a feature follows the standard structure and has all required files.
 *
 * Usage:
 *   tsx scripts/validate-feature.ts features/{feature-name}
 */

import { readdir, readFile, stat } from "fs/promises";
import { join, basename } from "path";

interface ValidationResult {
  feature: string;
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

const REQUIRED_FILES = [
  "config/feature-config.ts",
  "config/navigation.ts",
  "config/permissions.ts",
  "index.ts",
];

// Note: REQUIRED_EXPORTS is kept for future validation logic
// const REQUIRED_EXPORTS = {
//   "config/feature-config.ts": [
//     "{feature}Feature",
//     "{feature}Views",
//   ],
//   "index.ts": [
//     "{feature}Feature",
//     "{feature}Views",
//     "{FEATURE}_PERMISSIONS",
//     "{FEATURE}_ROUTES",
//   ],
// };

async function validateFeature(featurePath: string): Promise<ValidationResult> {
  const featureName = basename(featurePath);
  const result: ValidationResult = {
    feature: featureName,
    isValid: true,
    errors: [],
    warnings: [],
  };

  try {
    // Check required files exist
    for (const file of REQUIRED_FILES) {
      const filePath = join(featurePath, file);
      try {
        await stat(filePath);
      } catch {
        result.errors.push(`Missing required file: ${file}`);
        result.isValid = false;
      }
    }

    // Check feature-config.ts exports
    const configPath = join(featurePath, "config/feature-config.ts");
    try {
      const configContent = await readFile(configPath, "utf-8");
      const featureExport = `export const ${featureName}Feature`;
      const viewsExport = `export const ${featureName}Views`;

      if (!configContent.includes(featureExport)) {
        result.errors.push(`Missing export: ${featureName}Feature in feature-config.ts`);
        result.isValid = false;
      }

      if (!configContent.includes(viewsExport)) {
        result.errors.push(`Missing export: ${featureName}Views in feature-config.ts`);
        result.isValid = false;
      }
    } catch (error) {
      result.errors.push(`Cannot read feature-config.ts: ${error}`);
      result.isValid = false;
    }

    // Check index.ts exports
    const indexPath = join(featurePath, "index.ts");
    try {
      const indexContent = await readFile(indexPath, "utf-8");
      const featureExport = `${featureName}Feature`;
      const viewsExport = `${featureName}Views`;
      const permissionsExport = `${featureName.toUpperCase()}_PERMISSIONS`;
      const routesExport = `${featureName.toUpperCase()}_ROUTES`;

      if (!indexContent.includes(featureExport)) {
        result.warnings.push(`Missing export: ${featureName}Feature in index.ts`);
      }

      if (!indexContent.includes(viewsExport)) {
        result.warnings.push(`Missing export: ${featureName}Views in index.ts`);
      }

      if (!indexContent.includes(permissionsExport)) {
        result.warnings.push(`Missing export: ${permissionsExport} in index.ts`);
      }

      if (!indexContent.includes(routesExport)) {
        result.warnings.push(`Missing export: ${routesExport} in index.ts`);
      }
    } catch (error) {
      result.errors.push(`Cannot read index.ts: ${error}`);
      result.isValid = false;
    }

    // Check for views directory
    const viewsPath = join(featurePath, "views");
    try {
      const viewsStat = await stat(viewsPath);
      if (!viewsStat.isDirectory()) {
        result.warnings.push("views exists but is not a directory");
      } else {
        const viewsFiles = await readdir(viewsPath);
        if (viewsFiles.length === 0) {
          result.warnings.push("views directory is empty");
        }
      }
    } catch {
      result.warnings.push("No views directory found (optional but recommended)");
    }

  } catch (error) {
    result.errors.push(`Error validating feature: ${error}`);
    result.isValid = false;
  }

  return result;
}

async function main() {
  const args = process.argv.slice(2);
  
  if (args.length === 0) {
    console.error("Usage: tsx validate-feature.ts <feature-path>");
    console.error("Example: tsx validate-feature.ts features/inventory");
    process.exit(1);
  }

  const featurePath = args[0];
  const result = await validateFeature(featurePath);

  console.log(`\n📋 Validation Results for: ${result.feature}\n`);

  if (result.errors.length > 0) {
    console.log("❌ Errors:");
    result.errors.forEach((error) => console.log(`   - ${error}`));
  }

  if (result.warnings.length > 0) {
    console.log("\n⚠️  Warnings:");
    result.warnings.forEach((warning) => console.log(`   - ${warning}`));
  }

  if (result.isValid && result.errors.length === 0) {
    console.log("✅ Feature structure is valid!");
  } else {
    console.log("\n❌ Feature structure has issues. Please fix the errors above.");
  }

  process.exit(result.isValid ? 0 : 1);
}

main().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});

