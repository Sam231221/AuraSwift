# Scripts Directory

This directory contains utility scripts for database management and development.

## Available Scripts

### `bridge-migration.mjs`

Converts Drizzle Kit generated SQL migrations to TypeScript migrations for the custom versioning system.

**Usage:**

```bash
# Interactive mode - select migration to convert
npm run db:bridge

# Auto mode - convert latest migration
npm run db:bridge -- --auto

# Show help
npm run db:bridge -- --help
```

**What it does:**

1. Reads SQL migrations from `packages/main/src/database/migrations/`
2. Converts them to TypeScript format
3. Adds to `packages/main/src/database/versioning/migrations.ts`
4. Automatically increments version numbers

### `migrate-to-managers.mjs`

Legacy migration script for converting to manager-based architecture.

---

## Migration Workflow

See [MIGRATION_WORKFLOW.md](../docs/MIGRATION_WORKFLOW.md) for complete documentation.

**Quick workflow:**

1. Edit `packages/main/src/database/schema.ts`
2. Run `npm run db:generate` to create SQL migration
3. Run `npm run db:bridge` to convert to TypeScript
4. Run `npm start` to test

---

## Development

### Adding New Scripts

Scripts in this directory should:

- Use `.mjs` extension for ES modules
- Include proper error handling
- Have clear console output with colors
- Be executable (`chmod +x script-name.mjs`)
- Include `#!/usr/bin/env node` shebang

### Script Template

```javascript
#!/usr/bin/env node
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Your script logic here
```
