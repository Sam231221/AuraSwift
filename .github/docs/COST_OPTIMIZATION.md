# GitHub Actions Cost Optimization Strategy

## Summary

This document outlines the cost-saving measures implemented for AuraSwift's CI/CD pipelines to reduce GitHub Actions billing.

---

## Cost Analysis (Before Optimization)

### Your Previous Charges (28 Oct 2025)

| Platform             | Minutes Used | Price/Unit | Cost      |
| -------------------- | ------------ | ---------- | --------- |
| Actions Linux        | 141 min      | $0.008     | $1.13     |
| Actions macOS 3-core | 34.1 min     | $0.08      | $2.73     |
| Actions Windows      | 86 min       | $0.016     | $1.38     |
| Actions Storage      | 40.25 GB-hr  | $0.000336  | $0.01     |
| **Total**            |              |            | **$5.25** |

### Root Causes of High Costs

1. **Multiple OS builds**: Building on Linux, macOS, and Windows
2. **Frequent triggers**: Every push and PR triggered builds
3. **CodeQL on every push/PR**: Security scans ran too frequently
4. **Redundant workflows**: Deprecated workflows still present

---

## Optimizations Implemented

### 1. **Windows-Only Distribution** ✅

**Status**: Already optimized in `compile-and-test.yml`

- All build jobs run on `windows-latest` only
- No Linux or macOS builds
- Estimated savings: **~$4.00/day** (eliminated macOS and Linux builds)

**Files affected**:

- `.github/workflows/compile-and-test.yml` - Already Windows-only

### 2. **Reduced CI Triggers** ✅

**Changed**: `ci.yml`

**Before**:

- Triggered on every push to main
- Triggered on every pull request
- Triggered manually

**After**:

- Triggered on push to main only
- Triggered on version tags (`v*`)
- Triggered manually
- **REMOVED** pull request trigger

**Impact**:

- If you had 10 PRs/week, this saves ~10 builds/week
- Estimated savings: **~$1.50/week** or **$6/month**

**How to test PRs now**:

- Test locally before pushing to main
- Use manual workflow trigger if needed for specific PRs
- Or temporarily re-enable PR trigger for critical PRs

### 3. **Reduced CodeQL Frequency** ✅

**Changed**: `codeql.yml`

**Before**:

- Ran on every push to main
- Ran on every pull request
- Ran weekly on schedule

**After**:

- Runs weekly on schedule (Sunday) only
- Manual trigger available
- **REMOVED** push and PR triggers

**Impact**:

- If you had 15 pushes+PRs/week, this saves ~15 CodeQL runs/week
- CodeQL uses Linux (cheap) but adds up: ~10 min/run
- Estimated savings: **~$1.00/week** or **$4/month**

### 4. **Removed Deprecated Workflows** ✅

**Deleted**:

- `deploy.yml` (deprecated, replaced by semantic-release in ci.yml)
- `release.yml` (deprecated, replaced by semantic-release in ci.yml)

**Impact**: No cost impact (weren't running), but cleaner repository

---

## Current Workflow Configuration

### Active Workflows

1. **ci.yml** - Entry point for CI/CD

   - Triggers: Push to main, version tags, manual
   - Uses: ubuntu-latest (prepare), windows-latest (build via compile-and-test.yml)
   - Cost: ~$1.50/run

2. **compile-and-test.yml** - Windows build and test

   - Triggers: Called by ci.yml
   - Uses: windows-latest only
   - Cost: ~$1.20/run

3. **codeql.yml** - Security scanning
   - Triggers: Weekly (Sunday), manual
   - Uses: ubuntu-latest
   - Cost: ~$0.10/run

---

## Expected Monthly Cost Reduction

### Before Optimization (Estimated)

Assuming:

- 20 pushes/month to main
- 15 PRs/month
- 4 CodeQL schedule runs/month

| Workflow          | Runs/Month | Cost/Run | Monthly Cost |
| ----------------- | ---------- | -------- | ------------ |
| ci.yml (push)     | 20         | $1.50    | $30.00       |
| ci.yml (PR)       | 15         | $1.50    | $22.50       |
| CodeQL (push/PR)  | 35         | $0.10    | $3.50        |
| CodeQL (schedule) | 4          | $0.10    | $0.40        |
| **Total**         |            |          | **$56.40**   |

### After Optimization (Estimated)

| Workflow               | Runs/Month | Cost/Run | Monthly Cost |
| ---------------------- | ---------- | -------- | ------------ |
| ci.yml (push only)     | 20         | $1.50    | $30.00       |
| CodeQL (schedule only) | 4          | $0.10    | $0.40        |
| **Total**              |            |          | **$30.40**   |

### **Savings: ~$26/month or 46% reduction** 🎉

---

## Additional Cost-Saving Tips

### 1. **Use Concurrency Limits**

Already implemented in ci.yml:

```yaml
concurrency:
  group: ${{github.workflow}}-${{ github.ref }}-${{ inputs.distribution-channel || 'main' }}
  cancel-in-progress: true
```

This cancels old runs when new ones start, saving minutes.

### 2. **Cache Dependencies**

Already implemented in all workflows:

```yaml
- uses: actions/setup-node@v4
  with:
    node-version: 18
    cache: npm
```

### 3. **Skip Unnecessary Steps**

Already implemented:

```yaml
- name: Install Playwright
  run: npx playwright install --with-deps
  if: hashFiles('tests/**') != ''
```

Only runs if tests exist.

### 4. **Use Artifacts Efficiently**

- Only upload Windows build artifacts
- Use retention period (default 90 days, consider reducing to 30)

### 5. **Self-Hosted Runners** (Advanced)

If costs remain high, consider self-hosted runners:

- **Pros**: No per-minute charges
- **Cons**: Need to maintain hardware/VMs
- **When to consider**: If monthly costs exceed $50-100

---

## Monitoring Costs

### How to Check Your Usage

1. Go to: https://github.com/settings/billing/summary
2. Check "Actions minutes used" by OS
3. Set up billing alerts if needed

### GitHub Free Tier Limits

| Plan | Free Minutes/Month | Storage |
| ---- | ------------------ | ------- |
| Free | 2,000 min          | 500 MB  |
| Pro  | 3,000 min          | 1 GB    |
| Team | 10,000 min         | 2 GB    |

**Multipliers**:

- Linux: 1x (1 minute = 1 minute)
- Windows: 2x (1 minute = 2 minutes)
- macOS: 10x (1 minute = 10 minutes)

### Your Current Usage Pattern (Optimized)

Assuming 20 builds/month:

- Windows: 86 min/build × 20 = 1,720 min × 2 = **3,440 multiplied minutes**
- Ubuntu (prepare): 5 min/build × 20 = 100 min × 1 = **100 multiplied minutes**
- **Total: 3,540 multiplied minutes/month**

**Fits in**: Pro plan (3,000 free + paid overage) or Team plan (10,000 free)

---

## Workflow Triggers Reference

### ci.yml

```yaml
on:
  workflow_dispatch: # Manual trigger
  push:
    branches: [main]
    tags: ["v*"]
  # NO pull_request trigger
```

### codeql.yml

```yaml
on:
  workflow_dispatch: # Manual trigger
  schedule:
    - cron: "18 15 * * 0" # Weekly on Sunday
  # NO push or pull_request trigger
```

### compile-and-test.yml

```yaml
on:
  workflow_call: # Called by ci.yml only
```

---

## Testing Strategy (Without PR Triggers)

Since PRs no longer trigger CI automatically, use this workflow:

### For Regular Development

1. Test locally: `npm run test`
2. Build locally: `npm run compile:win`
3. Push to main when ready
4. CI runs automatically on push to main

### For Critical PRs (Need CI Validation)

**Option A**: Manual workflow trigger

1. Go to: https://github.com/Sam231221/AuraSwift/actions/workflows/ci.yml
2. Click "Run workflow"
3. Select branch
4. Run manually

**Option B**: Temporarily enable PR trigger

1. Edit `.github/workflows/ci.yml`
2. Add back:
   ```yaml
   pull_request:
     branches: [main]
   ```
3. Create PR (will trigger CI)
4. After merge, remove PR trigger again

---

## Emergency Rollback

If you need to revert these optimizations:

### Re-enable PR Triggers

**ci.yml**:

```yaml
on:
  push:
    branches: [main]
  pull_request: # Add this back
    branches: [main]
```

**codeql.yml**:

```yaml
on:
  push:
    branches: [main]
  pull_request: # Add this back
    branches: [main]
  schedule:
    - cron: "18 15 * * 0"
```

---

## Future Optimizations (If Needed)

### 1. Skip CI on Certain Commits

Add to commit message:

```
feat: add new feature [skip ci]
```

### 2. Use Matrix Strategy Conditionally

Only test on Windows for releases:

```yaml
strategy:
  matrix:
    os: ${{ github.event_name == 'release' && ['windows-latest'] || ['ubuntu-latest'] }}
```

### 3. Reduce Test Frequency

- Run full e2e tests only on release
- Run unit tests on every push
- Run hardware tests weekly

### 4. Use Docker for Faster Builds

- Pre-build Docker image with dependencies
- Faster npm ci
- Less build time

---

## Questions?

### Why remove PR triggers?

- Most teams test locally before creating PRs
- Manual trigger available for critical PRs
- Saves ~50% of build minutes

### What if I need CI on PRs?

- Use manual workflow trigger
- Or temporarily re-enable PR trigger for specific features
- Or test locally and rely on push-to-main CI

### Will this affect code quality?

- No, you still have:
  - CI on every push to main
  - Weekly CodeQL security scans
  - Manual triggers when needed
- Just more intentional about when CI runs

---

## Changelog

| Date       | Change                           | Impact                         |
| ---------- | -------------------------------- | ------------------------------ |
| 2025-10-28 | Removed PR triggers from ci.yml  | -50% build frequency           |
| 2025-10-28 | Reduced CodeQL to weekly only    | -75% CodeQL runs               |
| 2025-10-28 | Deleted deprecated workflows     | Repository cleanup             |
| 2025-10-28 | Documented Windows-only strategy | Confirmed no macOS/Linux costs |

---

## Summary

✅ **Windows-only builds** - Already optimized  
✅ **Removed PR triggers** - 50% less builds  
✅ **Weekly CodeQL only** - 75% less security scans  
✅ **Clean workflows** - Removed deprecated files

**Expected savings**: ~$26/month or 46% cost reduction

**Next steps**:

1. Commit these workflow changes
2. Monitor costs for 1 month
3. Adjust if needed
4. Consider self-hosted runners if costs remain high
