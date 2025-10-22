# 🔄 Workflow Architecture - Semantic Release Integration

## 📋 Overview

The CI/CD pipeline has been redesigned to integrate semantic-release for automated versioning and changelog generation while maintaining the existing build and test infrastructure.

---

## 🏗️ Workflow Structure

### **Primary Workflow: `ci.yml`**

The main entry point that handles everything:

```
Push to main / PR / Manual trigger
    ↓
┌─────────────────────────────────────┐
│  Job 1: PREPARE                     │
│  - Analyze commits with semantic-   │
│    release (dry-run)                │
│  - Determine version number         │
│  - Set SHOULD_RELEASE flag          │
└─────────────────────────────────────┘
    ↓
┌─────────────────────────────────────┐
│  Job 2: COMPILE-AND-TEST            │
│  - Calls compile-and-test.yml       │
│  - Builds Windows installer         │
│  - Runs E2E tests                   │
│  - Uploads artifacts                │
└─────────────────────────────────────┘
    ↓
┌─────────────────────────────────────┐
│  Job 3: SEMANTIC-RELEASE            │
│  (Only if: main branch + releasable)│
│  - Downloads build artifacts        │
│  - Updates CHANGELOG.md             │
│  - Bumps package.json version       │
│  - Creates git tag                  │
│  - Creates GitHub Release           │
│  - Uploads installer files          │
└─────────────────────────────────────┘
```

---

## 🎯 Version Determination Logic

### For Pull Requests & Non-Main Branches:

```
Version: Current version from package.json
Format: 3.1.0-main.1760732709
Release: NO
```

### For Main Branch (Push):

```
Semantic-release analyzes commits:

✅ Has feat/fix commits → NEW RELEASE
   Version: 3.2.0 (semantic versioning)
   Format: 3.2.0 (clean, no timestamp)
   Release: YES

❌ Only docs/chore commits → NO RELEASE
   Version: 3.1.0-main.1760732709
   Format: Current version + timestamp
   Release: NO
```

---

## 📝 Commit Message → Version Impact

| Commit Type | Example                      | Version Change | Release? |
| ----------- | ---------------------------- | -------------- | -------- |
| `feat:`     | `feat(sales): add discounts` | 3.1.0 → 3.2.0  | ✅ YES   |
| `fix:`      | `fix(drawer): correct calc`  | 3.1.0 → 3.1.1  | ✅ YES   |
| `perf:`     | `perf(db): optimize query`   | 3.1.0 → 3.1.1  | ✅ YES   |
| `refactor:` | `refactor(auth): simplify`   | 3.1.0 → 3.1.1  | ✅ YES   |
| `docs:`     | `docs: update readme`        | No change      | ❌ NO    |
| `test:`     | `test: add unit tests`       | No change      | ❌ NO    |
| `chore:`    | `chore: update deps`         | No change      | ❌ NO    |
| `ci:`       | `ci: fix workflow`           | No change      | ❌ NO    |

### Breaking Changes (Major Version):

```bash
git commit -m "feat(auth): new login system

BREAKING CHANGE: old tokens no longer valid"
```

Result: 3.1.0 → 4.0.0

---

## 🚀 What Happens on Push to Main

### Scenario 1: Releasable Commits (feat/fix)

```bash
# You push:
git commit -m "feat(sales): add discount codes"
git push origin main

# GitHub Actions:
1. ✅ Prepare: Detects feat → will release 3.2.0
2. ✅ Build: Compiles AuraSwift-Setup-3.2.0.exe
3. ✅ Test: Runs E2E tests
4. ✅ Release:
   - Updates package.json to 3.2.0
   - Updates CHANGELOG.md with features
   - Creates git tag v3.2.0
   - Creates GitHub Release "v3.2.0"
   - Uploads installer + manifest
   - Commits "chore(release): 3.2.0 [skip ci]"
```

### Scenario 2: Non-Releasable Commits (docs/chore)

```bash
# You push:
git commit -m "docs: update readme"
git push origin main

# GitHub Actions:
1. ✅ Prepare: No releasable commits → skip release
2. ✅ Build: Compiles for testing (v3.1.0-main.1760732709)
3. ✅ Test: Runs E2E tests
4. ⏭️ Release: SKIPPED (no release needed)
```

### Scenario 3: Pull Request

```bash
# You create PR:
git checkout -b feature/new-thing
git commit -m "feat(inventory): barcode scanner"
git push origin feature/new-thing

# GitHub Actions:
1. ✅ Prepare: PR detected → no release
2. ✅ Build: Compiles for testing
3. ✅ Test: Runs E2E tests
4. ⏭️ Release: SKIPPED (PRs don't release)
```

---

## 📦 What Gets Created

### GitHub Release (Automated by Semantic-Release):

```
Release: v3.2.0
Created: October 22, 2025

## 🎉 What's Changed

### ✨ Features
* **sales**: add discount code support (abc1234)
* **inventory**: implement barcode scanner (def5678)

### 🐛 Bug Fixes
* **drawer**: correct cash calculation (ghi9012)
* **auth**: fix session timeout issue (jkl3456)

### 📚 Documentation
* update hardware integration guide (mno7890)

**Full Changelog**: https://github.com/Sam231221/AuraSwift/compare/v3.1.0...v3.2.0

Files:
📦 AuraSwift-Setup-3.2.0.exe
📄 latest.yml
🔒 Checksums
```

### Updated Files in Repo:

- ✅ `package.json` → version: "3.2.0"
- ✅ `package-lock.json` → version: "3.2.0"
- ✅ `CHANGELOG.md` → new section for v3.2.0
- ✅ Git tag → `v3.2.0`
- ✅ Commit → `chore(release): 3.2.0 [skip ci]`

---

## 🔧 Configuration Files

### `.releaserc.json` (Semantic-Release Config)

```json
{
  "branches": ["main"],
  "plugins": [
    "@semantic-release/commit-analyzer", // Analyzes commits
    "@semantic-release/release-notes-generator", // Generates notes
    "@semantic-release/changelog", // Updates CHANGELOG.md
    "@semantic-release/npm", // Updates package.json (no publish)
    "@semantic-release/git", // Commits changes
    "@semantic-release/github" // Creates GitHub release
  ]
}
```

---

## 🎨 Workflow Files Status

| File                   | Status            | Purpose                             |
| ---------------------- | ----------------- | ----------------------------------- |
| `ci.yml`               | ✅ **ACTIVE**     | Main workflow with semantic-release |
| `compile-and-test.yml` | ✅ **ACTIVE**     | Reusable build & test workflow      |
| `release.yml`          | ⚠️ **DEPRECATED** | Replaced by ci.yml integration      |
| `deploy.yml`           | ⚠️ **DEPRECATED** | Replaced by semantic-release        |
| `codeql.yml`           | ✅ **ACTIVE**     | Security scanning                   |

---

## 🔄 Migration Changes

### Before (Old System):

```
Push to main
  ↓
ci.yml → prepare (timestamp version)
  ↓
ci.yml → compile-and-test
  ↓
ci.yml → deploy (creates release with timestamp version)

AND SEPARATELY:

Push to main
  ↓
release.yml → runs independently
  ↓
Creates ANOTHER release with semantic version
```

**Problem**: Two releases created, version conflict

### After (New System):

```
Push to main
  ↓
ci.yml → prepare (semantic version if releasable)
  ↓
ci.yml → compile-and-test
  ↓
ci.yml → semantic-release (creates ONE release)
```

**Solution**: Single workflow, consistent versioning

---

## 🎯 Benefits

| Aspect              | Before                         | After                      |
| ------------------- | ------------------------------ | -------------------------- |
| **Workflows**       | 2 workflows run (ci + release) | 1 unified workflow         |
| **Releases**        | 2 releases created             | 1 professional release     |
| **Version Format**  | `3.1.0-main.1760732709`        | `3.2.0`                    |
| **Changelog**       | Manual or missing              | Auto-generated             |
| **Version Bumps**   | Manual                         | Automatic based on commits |
| **CI Time**         | ~15-20 min (builds twice)      | ~8-10 min (builds once)    |
| **Release Quality** | Inconsistent                   | Professional, consistent   |

---

## 📚 Developer Workflow

### Daily Development:

```bash
# 1. Create feature branch
git checkout -b feat/new-feature

# 2. Make changes and commit with conventional format
git commit -m "feat(sales): add refund functionality"
git commit -m "fix(ui): correct button alignment"

# 3. Push and create PR
git push origin feat/new-feature

# 4. CI runs: builds and tests (no release)

# 5. Merge PR to main
# GitHub UI: Merge pull request

# 6. CI runs on main: builds, tests, and releases!
# - Version automatically bumped to 3.2.0
# - CHANGELOG.md updated
# - GitHub Release created
```

### Hotfix:

```bash
git checkout -b hotfix/critical-bug
git commit -m "fix(payment): prevent duplicate charges"
git push origin hotfix/critical-bug
# Merge to main → Auto releases v3.1.1
```

### Breaking Changes:

```bash
git commit -m "feat(database): migrate to new schema

BREAKING CHANGE: requires database migration"
# Merge to main → Auto releases v4.0.0
```

---

## 🧪 Testing the Workflow

### Test Locally (Dry-Run):

```bash
# See what version would be created
npm run semantic-release:dry-run

# Check current version
cat package.json | grep version
```

### Test in GitHub Actions:

```bash
# 1. Push a feature commit
git commit -m "feat(test): testing semantic release"
git push origin main

# 2. Watch GitHub Actions
# Go to: https://github.com/Sam231221/AuraSwift/actions

# 3. Check the release
# Go to: https://github.com/Sam231221/AuraSwift/releases
```

---

## 🔐 Required Secrets

| Secret     | Purpose                      | Where Used                    |
| ---------- | ---------------------------- | ----------------------------- |
| `GH_TOKEN` | GitHub personal access token | ci.yml (semantic-release job) |

**Permissions needed:**

- ✅ Contents: Read and write
- ✅ Issues: Read and write (optional)
- ✅ Pull requests: Read and write (optional)

---

## 🚨 Troubleshooting

### No Release Created

**Check:**

1. Are commits using conventional format?
2. Is commit on main branch?
3. Are only `docs`/`chore` commits pushed?

### Version Not Updated

**Check:**

1. Is GH_TOKEN set in repository secrets?
2. Does token have write permissions?
3. Check workflow logs for errors

### Build Failed

**Check:**

1. Did compile-and-test.yml succeed?
2. Are native modules building correctly?
3. Check Playwright test logs

---

## 📊 Monitoring

### GitHub Actions Dashboard:

- View: https://github.com/Sam231221/AuraSwift/actions
- Filter by workflow: "Entry CI"

### Releases Page:

- View: https://github.com/Sam231221/AuraSwift/releases
- Each release shows version, changelog, files

### CHANGELOG.md:

- Updated automatically on each release
- Shows full history of changes

---

## ✅ Summary

**One Workflow. Automatic Versioning. Professional Releases.**

- ✅ Push to main → automatic build, test, and release
- ✅ Semantic versioning based on commit messages
- ✅ Auto-generated changelog
- ✅ Single source of truth (ci.yml)
- ✅ No manual version bumping
- ✅ No duplicate workflows
- ✅ Professional, consistent releases

**Next Steps:**

1. Commit these workflow changes
2. Push to main with a `feat:` or `fix:` commit
3. Watch the magic happen! 🎉
