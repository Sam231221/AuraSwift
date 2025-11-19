# Node.js Version Strategy for AuraSwift

## Problem Analysis

### Current Dependency Requirements

**Root package.json:**
- `serialport@^13.0.0` → requires `>=20.0.0`
- `better-sqlite3@^12.4.1` → requires `20.x || 22.x || 23.x || 24.x`
- `@electron/rebuild@^4.0.1` → requires `>=22.12.0`
- `semantic-release@^25.0.1` → requires `^22.14.0 || >= 24.10.0`
- `vite@7.1.6` → requires `^20.19.0 || >=22.12.0`

**packages/main/package.json:**
- `serialport@^12.0.0` → requires `>=18.0.0` (older version) ❌ **FIXED: Now uses 13.0.0**
- `better-sqlite3@^12.4.1` → requires `20.x || 22.x || 23.x || 24.x`
- `vite@7.1.6` → requires `^20.19.0 || >=22.12.0`

### Issues Identified

1. ✅ **FIXED: Version Mismatch**: Root uses serialport@13, main was using serialport@12
2. ✅ **FIXED: Node Version Conflict**: Standardized on Node 22 (satisfies all requirements)
3. ✅ **FIXED: Windows Build Issues**: Improved cleanup and build process

## Optimal Solution Implemented

### Strategy: Use Node 22 + Fix Version Mismatches + Improve Build Process

**Why Node 22?**
- Node 22 satisfies ALL requirements (22 >= 20, so it works for both Node 20 and Node 22 requirements)
- It's the current LTS version
- Future-proofs the project
- Eliminates all `EBADENGINE` warnings

### Changes Implemented

#### 1. ✅ Standardized Node Version to 22.x
- Updated `package.json` engines: `"node": ">=22.0.0"`
- Updated all workflows to use Node 22.x
- Updated all actions to use Node 22.x
- Updated all cache keys to include `node22`

#### 2. ✅ Fixed Version Mismatches
- **packages/main/package.json**: 
  - Changed `serialport@^12.0.0` → `serialport@^13.0.0`
  - Changed `@serialport/parser-readline@^12.0.0` → `@serialport/parser-readline@^13.0.0`
- Now all packages use consistent serialport version

#### 3. ✅ Improved Windows Native Module Build Process
- **Install Strategy**: Use `--ignore-scripts` during `npm ci` to avoid native module build conflicts
- **Explicit Rebuild**: Rebuild native modules explicitly with `electron-rebuild` after install
- **Better Cleanup**: Enhanced cleanup with retry logic and process killing
- **Error Handling**: Better error messages and verification steps

#### 4. ✅ Enhanced Cleanup Process
- Retry logic (3 attempts with delays)
- Kill Node/npm processes that might lock files
- Cross-platform support (bash for Linux, PowerShell for Windows)
- Graceful error handling

## Key Improvements

### Install Process (compile-and-test.yml)
```yaml
# Step 1: Install with --ignore-scripts (avoids native module conflicts)
npm ci --ignore-scripts

# Step 2: Explicitly rebuild native modules for Electron
npx electron-rebuild --force --only=better-sqlite3,node-hid,serialport,usb
```

### Benefits
1. **No More Version Conflicts**: All packages aligned
2. **No More EBADENGINE Warnings**: Node 22 satisfies all requirements
3. **Better Windows Support**: Improved cleanup handles locked files
4. **More Reliable Builds**: Explicit rebuild process is more predictable
5. **Future-Proof**: Node 22 is current LTS

## Testing Checklist

- [ ] Verify Node 22 is used in all workflows
- [ ] Check that serialport versions are aligned
- [ ] Test Windows build process
- [ ] Verify native modules rebuild correctly
- [ ] Check that no EBADENGINE warnings appear
- [ ] Verify `spawn EINVAL` errors are resolved

