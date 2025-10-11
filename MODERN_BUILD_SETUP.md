# Modern Windows Build Setup for Native Modules

## ❌ DEPRECATED: windows-build-tools

**DO NOT USE:** `windows-build-tools` package is deprecated since 2021 and causes build failures.

## ✅ MODERN APPROACH: Node.js 18+ Built-in Toolchain

### Why the Modern Approach?

- **Node.js 18+** includes all necessary build tools
- **GitHub Actions runners** come with MSBuild 2022 pre-installed
- **No deprecated dependencies** - more secure and reliable
- **Faster builds** - no unnecessary package installations

### Current Configuration

#### 1. Build Environment Setup

```yaml
- name: Setup Node.js 18 for native module compatibility
  uses: actions/setup-node@v4
  with:
    node-version: "18"
    cache: "npm"

- name: Setup MSBuild (Windows)
  uses: microsoft/setup-msbuild@v2

- name: Setup Python for node-gyp
  uses: actions/setup-python@v5
  with:
    python-version: "3.x"
```

#### 2. NPM Configuration (.npmrc)

**CRITICAL:** Use hyphens (not underscores) for npm v9+ compatibility:

```ini
# ✅ Correct format (hyphens)
msvs-version=2022
python=python

# ❌ WRONG (causes npm errors in npm v9+)
msvs_version=2022
npm_config_python=python
```

#### 3. Environment Variables

```yaml
- name: Configure environment for Windows native modules
  env:
    PYTHON: python
    MSVS_VERSION: 2022 # Use standard env var names
```

#### 4. Native Module Rebuild Process

- **Clean npm cache** to avoid corruption
- **Remove build directories** for fresh rebuild
- **Rebuild modules individually** for better error tracking
- **Use modern electron-rebuild** with proper environment

### Supported Native Modules

✅ **better-sqlite3** v12.4.1 - Database operations  
✅ **node-hid** v3.2.0 - USB HID devices (card readers)  
✅ **serialport** v13.0.0 - Serial communication (printers)  
✅ **usb** v2.16.0 - Direct USB device access  
✅ **node-addon-api** v8.5.0 - Native module support

### Troubleshooting

#### If Native Modules Still Fail:

1. **Check Node.js version** - Must be 18+
2. **Verify MSBuild availability** - Should be 2022
3. **Check Python version** - Should be 3.x
4. **Review module versions** - Ensure compatibility

#### Common Issues:

- **"npm error msvs_version is not a valid npm option"** - Using underscores instead of hyphens in npm config
- **"npm error python is not a valid npm option"** - Invalid npm config format (npm v9+ compatibility issue)
- **"Cannot find module"** - Usually a build path issue
- **"Python not found"** - Environment variable issue
- **"MSBuild not found"** - Missing Visual Studio components

#### NPM Configuration Errors (npm v9+):

❌ **These will fail:**

```bash
npm install --msvs_version=2022 --python=python
```

✅ **Use these instead:**

```bash
npm config set msvs-version 2022
npm config set python python
npm install
```

### Migration from windows-build-tools

If you see references to `windows-build-tools`:

❌ **Remove this:**

```yaml
npm install --global windows-build-tools
```

✅ **Use this instead:**

```yaml
# Already included in Node.js 18+ and GitHub Actions
- uses: actions/setup-node@v4
  with:
    node-version: "18"
```

### Verification

Run these commands to verify your setup:

```bash
node --version          # Should be 18+
python --version        # Should be 3.x
npm list <module-name>  # Check module installation
```

---

**Last Updated:** October 2025  
**Node.js Version:** 18+  
**MSBuild Version:** 2022  
**Status:** ✅ Production Ready
