# Native Modules Compatibility with Node.js 22

## Critical Understanding: Two Node.js Versions

In Electron applications, there are **TWO different Node.js versions**:

1. **System Node.js** (22.19.0) - Used for:
   - Building/compiling native modules
   - Running npm scripts
   - Development tools

2. **Electron's Node.js** (bundled with Electron 38.7.0) - Used for:
   - Runtime execution in Electron
   - Running your application code

## How Native Modules Work in Electron

### The Problem
Native modules are compiled for a specific Node.js ABI (Application Binary Interface). When you install a native module with system Node.js 22, it's compiled for Node.js 22. But Electron uses its own Node.js version, so the module won't work at runtime.

### The Solution: electron-rebuild
`electron-rebuild` rebuilds native modules specifically for Electron's bundled Node.js version, not your system Node.js version.

## Your Native Modules

### 1. better-sqlite3@12.4.1
- **Node.js 22 Support**: ✅ Yes (`"node": "20.x || 22.x || 23.x || 24.x"`)
- **N-API**: Uses N-API (stable across Node versions)
- **Rebuild Required**: ✅ Yes (for Electron's Node.js version)
- **Status**: Fully compatible with Node 22 for building

### 2. serialport@13.0.0
- **Node.js 22 Support**: ✅ Yes (`"node": ">=20.0.0"`)
- **N-API**: Uses N-API
- **Rebuild Required**: ✅ Yes (for Electron's Node.js version)
- **Status**: Fully compatible with Node 22 for building

### 3. node-hid@3.2.0
- **Node.js 22 Support**: ✅ Yes (supports Node 18+)
- **N-API**: Uses N-API
- **Rebuild Required**: ✅ Yes (for Electron's Node.js version)
- **Status**: Fully compatible with Node 22 for building

### 4. usb@2.16.0
- **Node.js 22 Support**: ✅ Yes (supports Node 18+)
- **N-API**: Uses N-API
- **Rebuild Required**: ✅ Yes (for Electron's Node.js version)
- **Status**: Fully compatible with Node 22 for building

## Build Process Flow

```
1. Install with Node 22 (system)
   ↓
   npm ci --ignore-scripts
   (Native modules installed but NOT built)
   
2. Rebuild for Electron
   ↓
   npx electron-rebuild --force
   (Rebuilds native modules for Electron's Node.js version)
   
3. Result
   ↓
   Native modules work in Electron runtime
```

## Why This Works

1. **N-API Compatibility**: All your native modules use N-API (Node-API), which provides a stable ABI across Node.js versions. This means:
   - They can be built with Node 22
   - They can be rebuilt for Electron's Node.js version
   - They remain compatible across versions

2. **electron-rebuild Process**:
   - Detects Electron's Node.js version
   - Rebuilds native modules for that specific version
   - Handles all the ABI differences automatically

## Current Configuration

### package.json
```json
{
  "postinstall": "electron-rebuild"
}
```
This automatically rebuilds native modules after `npm install`.

### Workflow (compile-and-test.yml)
```yaml
# Step 1: Install without building native modules
npm ci --ignore-scripts

# Step 2: Explicitly rebuild for Electron
npx electron-rebuild --force --only=better-sqlite3,node-hid,serialport,usb
```

## Verification

To verify native modules are correctly built:

```bash
# Check Electron version
npx electron --version

# Check if native modules are built
ls node_modules/better-sqlite3/build/
ls node_modules/serialport/build/

# Test in Electron
npx electron .
```

## Potential Issues & Solutions

### Issue: `spawn EINVAL` Error
**Cause**: Native modules built for wrong Node.js version or locked files
**Solution**: 
- Use `--ignore-scripts` during install
- Explicitly rebuild with `electron-rebuild`
- Clean workspace before install

### Issue: Module Not Found at Runtime
**Cause**: Native module not rebuilt for Electron's Node.js version
**Solution**: Run `electron-rebuild` explicitly

### Issue: Build Failures on Windows
**Cause**: Missing build tools or locked files
**Solution**:
- Ensure MSBuild 2022 is installed
- Ensure Python 3.x is available
- Clean node_modules before rebuild
- Use retry logic for file locks

## Summary

✅ **All native modules support Node.js 22 for building**
✅ **electron-rebuild handles runtime compatibility**
✅ **N-API ensures stability across versions**
✅ **Current workflow is correctly configured**

**Conclusion**: Node.js 22 is fully compatible with your native modules. The `electron-rebuild` process ensures they work correctly in Electron's runtime environment.

