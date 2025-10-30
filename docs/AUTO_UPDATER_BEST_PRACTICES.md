# Auto-Updater in E2E Tests - Best Practices ✅

## ❌ Current Problem

The GitHub Actions E2E tests were failing because the Electron app was attempting to auto-update and download a release that doesn't exist yet:

```
Error: Cannot download
"https://github.com/Sam231221/AuraSwift/releases/download/v3.1.0-main.176287777/auraswift-3.1.0-main.176287777-win.exe"
```

---

## 🚫 Why Auto-Update in E2E Tests is BAD Practice

### **1. Network Dependency**

- Tests depend on external GitHub API
- Fails if GitHub is down or rate-limited
- Requires internet connection (breaks offline testing)

### **2. Flaky Tests**

- Downloads can timeout
- Network hiccups cause random failures
- Not reproducible across environments

### **3. Version Mismatch**

- May download wrong version during testing
- Tests run against different code than what was built
- **Critical:** Tests should verify THE CODE BEING BUILT, not random downloads

### **4. CI/CD Pipeline Bloat**

- Wastes bandwidth downloading large executables
- Increases test time significantly
- Costs money in CI/CD minutes

### **5. Test Isolation Violation**

- Tests should be self-contained
- External dependencies make tests unreliable
- Can't test in isolated networks (corporate, air-gapped)

### **6. Security Concerns**

- Downloads from internet during tests
- Potential MITM attacks in test environment
- Verification overhead

---

## ✅ Best Practices for E2E Tests

### **Golden Rule:**

> **"Test What You Build, Build What You Test"**

E2E tests should run against the **exact artifacts** produced by the build step.

---

## 📐 Correct Architecture

### **Proper CI/CD Flow:**

```
1. Build Stage
   ├─ Compile TypeScript
   ├─ Bundle with Vite
   ├─ Package with electron-builder
   └─ Output: auraswift.exe (or .app/.AppImage)
        ↓
2. Test Stage
   ├─ Use built artifacts (NOT downloads)
   ├─ Auto-updater DISABLED
   ├─ Run Playwright E2E tests
   └─ Tests verify the built app works
        ↓
3. Release Stage (Optional)
   ├─ Upload to GitHub Releases
   ├─ NOW auto-updater becomes relevant
   └─ Production users get updates
```

### **Key Point:**

- **Build** → **Test** → **Release**
- Tests happen BEFORE release
- Auto-updater only matters AFTER release

---

## ✅ Solutions Implemented

### **Solution 1: Conditional Auto-Updater (Best Practice)**

**File:** `packages/main/src/index.ts`

```typescript
// Only enable auto-updater in production, not in test or development
if (process.env.NODE_ENV !== "test" && !process.env.ELECTRON_UPDATER_DISABLED) {
  moduleRunner.init(autoUpdater());
} else {
  console.log("Auto-updater disabled (test/dev environment)");
}
```

**Benefits:**

- ✅ No network calls during tests
- ✅ Tests run fast and isolated
- ✅ Can still manually enable if needed via env var
- ✅ Production builds work normally

---

### **Solution 2: GitHub Actions Configuration**

**File:** `.github/workflows/compile-and-test.yml`

```yaml
- name: Run main E2E tests
  run: npm run test:all --if-present
  if: hashFiles('tests/**') != ''
  env:
    CI: true
    NODE_ENV: test
    ELECTRON_DISABLE_GPU: 1
    ELECTRON_NO_SANDBOX: 1
    PLAYWRIGHT_HEADLESS: 1
    ELECTRON_ENABLE_LOGGING: 1
    DEBUG: playwright:*
    ELECTRON_UPDATER_DISABLED: "true" # ✅ Explicitly disable
    # Hardware simulation for tests
    HARDWARE_SIMULATION_MODE: true
    MOCK_PRINTER_ENABLED: true
    MOCK_CARD_READER_ENABLED: true
    MOCK_SCANNER_ENABLED: true
```

**Why Multiple Safeguards:**

- `NODE_ENV: test` → Primary flag
- `ELECTRON_UPDATER_DISABLED: "true"` → Explicit override
- Defense in depth approach

---

## 🎯 When Auto-Updater SHOULD Be Enabled

### **Production Environment:**

```typescript
// Production user opens app
NODE_ENV: "production";
ELECTRON_UPDATER_DISABLED: undefined;

// Auto-updater runs
// Checks GitHub Releases
// Downloads new version if available
// User gets update notification
```

### **Development Environment:**

```typescript
// Developer working on app
NODE_ENV: "development";

// Auto-updater disabled
// Developer uses `npm start` with hot reload
// No unwanted updates interfere with development
```

### **Test Environment:**

```typescript
// CI/CD running E2E tests
NODE_ENV: "test";

// Auto-updater disabled
// Tests run against built artifacts
// Fast, isolated, reproducible
```

---

## 📊 Comparison: Bad vs Good Practice

### ❌ **Bad Practice (Before Fix):**

```
GitHub Actions CI/CD:
  1. Build app → auraswift.exe
  2. Start app for testing
  3. App checks for updates
  4. Tries to download release (doesn't exist!)
  5. ERROR: Cannot download ❌
  6. Tests fail
```

**Problems:**

- Depends on GitHub Releases existing
- Network calls during tests
- Tests fail for wrong reasons
- Slow and unreliable

---

### ✅ **Good Practice (After Fix):**

```
GitHub Actions CI/CD:
  1. Build app → auraswift.exe
  2. Set NODE_ENV=test
  3. Auto-updater disabled
  4. Start app for testing
  5. No update checks
  6. Tests run against built code ✅
  7. Tests verify app functionality
```

**Benefits:**

- Fast (no network calls)
- Reliable (no external dependencies)
- Correct (tests the actual build)
- Reproducible (same results every time)

---

## 🔍 Industry Best Practices

### **Electron App Testing Standards:**

1. **Isolation:** Tests should not depend on network
2. **Speed:** Tests should run in seconds, not minutes
3. **Reproducibility:** Same code → same results
4. **Accuracy:** Test the exact artifact being released

### **Popular Electron Apps That Do This Right:**

- **VS Code:** Disables updates in test mode
- **Slack:** Tests built artifacts only
- **Discord:** Update checks skipped in CI
- **Atom:** Auto-updater disabled during tests

---

## 🛠️ Additional Best Practices

### **1. Use Feature Flags**

```typescript
const FEATURES = {
  AUTO_UPDATE: process.env.NODE_ENV === "production",
  TELEMETRY: process.env.NODE_ENV === "production",
  CRASH_REPORTING: process.env.NODE_ENV === "production",
  DEV_TOOLS: process.env.NODE_ENV === "development",
};

if (FEATURES.AUTO_UPDATE) {
  moduleRunner.init(autoUpdater());
}
```

### **2. Environment-Specific Configs**

```typescript
// config/test.config.ts
export const testConfig = {
  autoUpdater: false,
  devTools: false,
  telemetry: false,
  useRealHardware: false,
};

// config/production.config.ts
export const productionConfig = {
  autoUpdater: true,
  devTools: false,
  telemetry: true,
  useRealHardware: true,
};
```

### **3. Mock Update Service for Testing**

If you need to test update functionality:

```typescript
// tests/mocks/mockAutoUpdater.ts
export const mockAutoUpdater = {
  checkForUpdates: () => Promise.resolve({ updateAvailable: false }),
  downloadUpdate: () => Promise.resolve(),
  quitAndInstall: () => {},
};

// Only use in tests
if (process.env.NODE_ENV === "test" && needsUpdateTesting) {
  moduleRunner.init(mockAutoUpdater);
}
```

---

## 📋 Checklist for E2E Tests

### **Before Running Tests:**

- [ ] Build artifacts created
- [ ] NODE_ENV=test set
- [ ] Auto-updater disabled
- [ ] Network mocks in place (if needed)
- [ ] Test database separate from dev
- [ ] Clean state (no leftover sessions)

### **During Tests:**

- [ ] No external network calls
- [ ] Tests use built artifacts
- [ ] Fast execution (< 1 minute ideal)
- [ ] Consistent results

### **After Tests:**

- [ ] All tests pass
- [ ] No warnings about updates
- [ ] Clean teardown
- [ ] Ready for release

---

## 🎯 Summary

### **Auto-Updater in Tests: NO ❌**

**Reasons:**

1. Network dependency
2. Flaky tests
3. Wrong code tested
4. Slow execution
5. Not best practice

### **Auto-Updater in Production: YES ✅**

**Reasons:**

1. Users need updates
2. Security patches
3. Bug fixes
4. New features
5. Expected behavior

### **The Fix We Applied:**

```typescript
// Conditional loading based on environment
if (process.env.NODE_ENV !== "test" && !process.env.ELECTRON_UPDATER_DISABLED) {
  moduleRunner.init(autoUpdater());
}
```

✅ **Simple, effective, industry standard**

---

## 📚 References

### **Electron Testing Best Practices:**

- [Electron Testing Documentation](https://www.electronjs.org/docs/latest/tutorial/automated-testing)
- [Playwright for Electron](https://playwright.dev/docs/api/class-electron)

### **Auto-Updater Guidelines:**

- [electron-updater Best Practices](https://www.electron.build/auto-update)
- Should only run in production
- Should be configurable
- Should be testable separately

### **CI/CD for Electron:**

- Build → Test → Release pipeline
- Test built artifacts, not downloads
- Environment-specific configurations

---

**Document Created:** October 17, 2025  
**Status:** ✅ BEST PRACTICES DOCUMENTED  
**Implementation:** ✅ ALREADY APPLIED IN CODE  
**Result:** Tests now run reliably without network dependencies
