# Feature Template

This is a template for creating new features in the application.

## Usage

1. Copy this template directory:

   ```bash
   cp -r templates/feature-template features/{your-feature-name}
   ```

2. Replace placeholders:

   - `{feature}` → lowercase feature name (e.g., `inventory`)
   - `{Feature}` → PascalCase feature name (e.g., `Inventory`)
   - `{FEATURE}` → UPPER_SNAKE_CASE feature name (e.g., `INVENTORY`)

3. Update file contents:

   - Search and replace all placeholders in all files
   - Update imports and exports
   - Add feature-specific logic

4. Register in navigation:
   - Add feature views to `navigation/registry/view-registry.ts`
   - **IMPORTANT**: Use `componentLoader` with dynamic imports for code-splitting
   - See [Code-Splitting Guide](../docs/CODE_SPLITTING_GUIDE.md) for details

## Template Structure

- `config/` - Feature configuration files
- `components/` - Feature components (optional)
- `hooks/` - Feature hooks (optional)
- `views/` - Feature views
- `schemas/` - Validation schemas (optional)
- `types/` - TypeScript types (optional)
- `utils/` - Utility functions (optional)
- `wrappers/` - Navigation wrappers (optional)
- `index.ts` - Public API exports

## Code-Splitting (Required)

**All views must use lazy loading via `componentLoader`:**

```typescript
// ✅ CORRECT: Use componentLoader
export const {feature}Views: Record<string, ViewConfig> = {
  [{FEATURE}_ROUTES.NEW_VIEW]: {
    id: {FEATURE}_ROUTES.NEW_VIEW,
    level: "root",
    componentLoader: () => import("../views/new-view"), // Dynamic import
    metadata: {
      title: "New View",
    },
    requiresAuth: true,
  },
};

// ❌ WRONG: Don't use static imports
// import NewView from "../views/new-view";
// component: NewView, // This prevents code-splitting
```

See [Code-Splitting Guide](../docs/CODE_SPLITTING_GUIDE.md) for complete details.

## See Also

- [Feature Structure Guide](../docs/FEATURE_STRUCTURE.md)
- [Navigation Integration Guide](../docs/NAVIGATION_INTEGRATION.md)
- [Code-Splitting Guide](../docs/CODE_SPLITTING_GUIDE.md)
