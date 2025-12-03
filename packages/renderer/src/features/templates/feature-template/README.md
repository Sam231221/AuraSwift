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

## See Also

- [Feature Structure Guide](../docs/FEATURE_STRUCTURE.md)
- [Navigation Integration Guide](../docs/NAVIGATION_INTEGRATION.md)

