# GitHub Actions Cost Optimization for AuraSwift

## Overview

This document explains how to minimize your GitHub Actions billing by optimizing workflow usage and runner selection for the AuraSwift project.

---

## Key Strategies Implemented

### 1. **Windows-Only Distribution Builds**

- **Windows runners** (`windows-latest`) are used only for building and packaging Windows installers.
- No macOS runners (most expensive) are used.
- No unnecessary Windows builds for CI or CodeQL.

### 2. **CI and CodeQL on Ubuntu Runners**

- **CI** (`ci.yml`) and **CodeQL** (`codeql.yml`) workflows use `ubuntu-latest` runners, which are the cheapest ($0.008/min).
- These workflows only run on push to main, release tags, or on a weekly schedule (for CodeQL).

### 3. **Workflow Trigger Optimization**

- Workflows are triggered only when needed:
  - **Builds**: On push to main, release tags, or manual dispatch.
  - **CodeQL**: Weekly schedule or manual dispatch.
  - **CI**: On push to main, release tags, or manual dispatch.
- No builds or scans on every pull request (unless explicitly needed).

### 4. **Deprecated Workflows Removed**

- Old workflows (`deploy.yml`, `release.yml`) have been deleted to avoid accidental runs and extra costs.

---

## Cost Comparison

| Runner Type    | Cost per Minute | Usage Purpose        |
| -------------- | --------------- | -------------------- |
| ubuntu-latest  | $0.008          | CI, CodeQL           |
| windows-latest | $0.016          | Windows builds only  |
| macos-latest   | $0.08           | Not used (expensive) |

**Result:**

- Only essential Windows builds are run (for distribution).
- All other tasks use the cheapest runner.
- No macOS runners are used at all.

---

## Example Workflow Matrix (Optimized)

```yaml
jobs:
  build-windows:
    runs-on: windows-latest
    steps:
      # ...build steps...

  ci:
    runs-on: ubuntu-latest
    steps:
      # ...CI steps...

  codeql:
    runs-on: ubuntu-latest
    steps:
      # ...CodeQL steps...
```

---

## Expected Monthly Cost Reduction

- **Before:** Multiple runners, frequent triggers, macOS usage → $5+ per month
- **After:** Only Windows for builds, Ubuntu for CI/CodeQL, minimal triggers → ~$1 per month

---

## Best Practices

- Use `ubuntu-latest` for all non-Windows-specific jobs
- Restrict workflow triggers to main, tags, or manual
- Only use `windows-latest` for packaging Windows installers
- Avoid macOS runners unless absolutely required
- Periodically review workflow usage and billing

---

## How to Further Reduce Costs

- Use self-hosted runners (free, but you provide hardware)
- Limit artifact retention and log storage
- Disable unnecessary workflows
- Monitor usage in GitHub billing dashboard

---

## Summary

Your workflows are now cost-optimized:

- **Windows builds only when needed**
- **CI/CodeQL on Ubuntu (cheapest)**
- **No macOS runners**
- **Minimal triggers**

This setup ensures you only pay for what you need, with maximum savings.
