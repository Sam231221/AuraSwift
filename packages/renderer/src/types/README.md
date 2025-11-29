# Types Directory

This directory contains all TypeScript type definitions for the renderer package, organized by domain and purpose.

## 📁 Structure

```
types/
├── domain/          # Business domain types (User, Product, Transaction, etc.)
├── enums/           # Shared enumerations and constants
├── features/        # Feature-specific types (batches, cart, import, printer)
├── api/             # IPC API contracts (Phase 4 complete)
├── ui/              # UI-specific types (breadcrumb, forms, tables)
└── index.ts         # Central barrel export
```

## 🎯 Usage

### Importing Types

**Recommended: Use barrel imports**

```typescript
// Import from main barrel
import { User, Product, AgeRestrictionLevel } from "@/types";

// Or import from specific domain
import { User, Business } from "@/types/domain";
import { AgeRestrictionLevel, VerificationMethod } from "@/types/enums";
```

**Also supported: Direct imports**

```typescript
import { User } from "@/types/domain/user";
import { AgeRestrictionLevel } from "@/types/enums/age-restriction";
```

## 📚 Type Categories

### Domain Types (`/domain`)

Core business entities that represent the application's data model:

- **`user.ts`** - User, UserForLogin, Role, Permission (RBAC-based)
- **`business.ts`** - Business/Organization
- **`product.ts`** - Product, StockAdjustment, ProductResponse
- **`category.ts`** - Category, VatCategory
- **`shift.ts`** - Shift, Schedule
- **`payment.ts`** - PaymentMethod types
- **`transaction.ts`** - Transaction, TransactionItem, TransactionData

### Enum Types (`/enums`)

Shared enumerations with configuration:

- **`age-restriction.ts`** - AgeRestrictionLevel + AGE_RESTRICTIONS config
- **`verification-method.ts`** - VerificationMethod
- **`batch-status.ts`** - BatchStatus
- **`cart-status.ts`** - CartSessionStatus

### Feature Types (`/features`)

Feature-specific types:

- **`batches/`** - Product batch tracking, expiry, suppliers, notifications
- **`cart/`** - Cart sessions, cart items, age verification
- **`import/`** - CSV import progress, results, options
- **`printer/`** - Thermal and office printer types
  - `thermal.ts` - ESC/POS thermal receipt printers
  - `office.ts` - Laser/office printers (HP, Canon, Epson, etc.)
- **`stock/`** - Stock movements and adjustments

## 🚫 Deprecated Locations

The following type locations are **deprecated** and should not be used for new code:

- ❌ `src/shared/types/` - Use `src/types/domain/` instead
- ❌ `src/types/auth-store.d.ts` - Use `src/types/api/` (Phase 4)
- ❌ `src/types/printer.ts` - Use `src/types/features/printer/` (Phase 2)
- ❌ `src/features/products/types/` - Use `src/types/domain/product`
- ❌ `src/views/**/types/` - Use `src/types/domain/` or `src/types/features/`

### Migration Guide

```typescript
// ❌ Old (deprecated)
import { User } from "@/shared/types/user";
import { Product } from "@/features/products/types/product.types";
import { AgeRestrictionLevel } from "@/views/dashboard/pages/cashier/types/cart.types";

// ✅ New (recommended)
import { User, Product, AgeRestrictionLevel } from "@/types";
```

## 🔄 Type Duplication Resolution

Previously duplicated types now have a **single source of truth**:

| Type                  | Old Locations                                            | New Location                         |
| --------------------- | -------------------------------------------------------- | ------------------------------------ |
| `User`                | `shared/types/user.ts`, `views/auth/types/auth.types.ts` | `types/domain/user.ts`               |
| `AgeRestrictionLevel` | `cart.types.ts`, `age-restriction.types.ts`              | `types/enums/age-restriction.ts`     |
| `VerificationMethod`  | Multiple with different casing                           | `types/enums/verification-method.ts` |
| `PaymentMethod`       | `printer.ts`, `transaction.types.ts`                     | `types/domain/payment.ts`            |

## 📝 Best Practices

### 1. Single Source of Truth

Each type should be defined **once** and imported everywhere else.

### 2. Predictable Locations

- Business entities → `domain/`
- Shared constants/enums → `enums/`
- Feature-specific → `features/[feature-name]/`
- API contracts → `api/`

### 3. Use Barrel Exports

Import from `@/types` or `@/types/domain` rather than deep paths.

### 4. Document Types

Add JSDoc comments explaining:

- Purpose of the type
- Important fields
- Related types
- Migration notes (for deprecated types)

### 5. Avoid Inline Types

Define types in this directory rather than inline in components.

## 🔧 Maintenance

### Adding New Types

1. Determine the category (domain, enum, feature, api, ui)
2. Create the type file in the appropriate folder
3. Export from the folder's `index.ts`
4. Document in this README

### Deprecating Types

1. Add `@deprecated` JSDoc tag with new location
2. Keep the old type temporarily for backward compatibility
3. Update all imports to use new location
4. Remove old type after migration complete

## 🚀 Migration Status

- ✅ **Phase 1 Complete**: Domain types and enums migrated
- ✅ **Phase 2 Complete**: Feature types migrated
- ✅ **Phase 3 Complete**: API types extracted from global.d.ts
- ✅ **Phase 4 Complete**: Preload and Renderer API types organized
- ✅ **Phase 5 Complete**: All imports updated to new structure
- ✅ **Phase 6 Complete**: Deprecation notices added, ESLint rules configured
- ✅ **Phase 7 Complete**: TypeScript compilation verified, documentation updated

**Migration Complete!** All types are now organized in the new structure. Old type files are marked as deprecated and will be removed in a future cleanup.

See `.agent/TYPE_STRUCTURE_REFACTORING_PLAN.md` for full migration plan.

## 📞 Questions?

For questions about type organization or migration, refer to:

- Full migration plan: `.agent/TYPE_STRUCTURE_REFACTORING_PLAN.md`
- Team lead or senior developer
