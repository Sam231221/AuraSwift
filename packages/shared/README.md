# @app/shared

Shared code between main and renderer processes.

## Permissions

The single source of truth for all permissions is:
```
packages/shared/src/constants/permissions.ts
```

### Usage

**In Main Process:**
```typescript
import { PERMISSIONS } from "@app/shared/constants/permissions";
```

**In Renderer Process:**
```typescript
import { PERMISSIONS, getAllAvailablePermissions } from "@app/shared/constants/permissions";
```

### Adding/Editing/Deleting Permissions

**⚠️ IMPORTANT: Only edit ONE file:**
```
packages/shared/src/constants/permissions.ts
```

Both main and renderer will automatically use the updated permissions. No need to edit multiple files!

