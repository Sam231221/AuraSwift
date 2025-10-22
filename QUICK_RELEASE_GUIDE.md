# Quick Release Guide

## ✅ Your Release System is Ready!

Your project now has a professional release management system with:

- ✨ Semantic versioning (v3.1.1, v3.2.0, etc.)
- 📝 Automated changelog generation
- 🤖 GitHub Actions workflow for releases
- 🎯 Conventional commit support

---

## 🚀 How to Create a Release (3 Steps)

### Step 1: Make Your Changes & Commit Using Conventional Commits

```bash
# Feature additions
git commit -m "feat(sales): add discount code support"
git commit -m "feat(inventory): implement barcode scanner"

# Bug fixes
git commit -m "fix(drawer): correct cash count calculation"
git commit -m "fix(schedule): button not showing on Windows"

# Performance improvements
git commit -m "perf(database): optimize product search query"

# Refactoring
git commit -m "refactor(auth): simplify login flow"

# Documentation
git commit -m "docs(readme): update installation instructions"
```

### Step 2: Create Version Bump & Changelog

Choose the right command based on changes:

```bash
# For bug fixes (3.1.0 → 3.1.1)
npm run release:patch

# For new features (3.1.0 → 3.2.0)
npm run release:minor

# For breaking changes (3.1.0 → 4.0.0)
npm run release:major

# Or let it auto-determine based on commits
npm run release
```

This will:

- ✅ Update package.json and package-lock.json versions
- ✅ Generate/update CHANGELOG.md
- ✅ Create a git commit with the version bump
- ✅ Create a git tag (e.g., v3.1.1)

### Step 3: Push to GitHub

```bash
git push origin main --follow-tags
```

This triggers the GitHub Actions workflow which will:

- 🏗️ Build your Windows installer
- 📦 Create a GitHub Release
- 📄 Add changelog notes to the release
- ⬆️ Upload the .exe installer

---

## 📊 Release Types Explained

| Type      | When to Use                | Version Change | Example                        |
| --------- | -------------------------- | -------------- | ------------------------------ |
| **Patch** | Bug fixes, small tweaks    | 3.1.0 → 3.1.1  | Fixed drawer button visibility |
| **Minor** | New features, enhancements | 3.1.0 → 3.2.0  | Added thermal printer support  |
| **Major** | Breaking changes           | 3.1.0 → 4.0.0  | Changed database schema        |

---

## 🎯 Conventional Commit Format

```
<type>(<scope>): <subject>

<optional body>

<optional footer>
```

### Common Types:

- `feat`: New feature
- `fix`: Bug fix
- `perf`: Performance improvement
- `refactor`: Code refactoring
- `docs`: Documentation changes
- `test`: Test additions/changes
- `chore`: Build process, dependencies
- `style`: Formatting, no code change

### Example Scopes:

- `sales`, `inventory`, `auth`, `schedule`, `drawer`, `printer`

### Examples:

```bash
git commit -m "feat(printer): add receipt customization"
git commit -m "fix(auth): prevent session timeout on idle"
git commit -m "perf(sales): cache product list for faster load"
```

---

## 🧪 Testing Before Release

```bash
# Test what would happen without making changes
npm run release:dry-run

# Check current version
npm run version:current

# View recent commits (to verify conventional format)
git log --oneline -10
```

---

## 🎨 Your Changelog Will Look Like:

```markdown
## [3.1.1](https://github.com/Sam231221/AuraSwift/compare/v3.1.0...v3.1.1) (2025-01-17)

### ✨ Features

- **printer**: add receipt customization ([abc123])
- **sales**: implement discount code support ([def456])

### 🐛 Bug Fixes

- **drawer**: correct cash count calculation ([ghi789])
- **schedule**: button not showing on Windows ([jkl012])

### ⚡ Performance

- **sales**: cache product list for faster load ([mno345])
```

---

## ❌ Common Mistakes to Avoid

1. **Don't use timestamp versions anymore**

   - ❌ v3.1.0-main.1760732709
   - ✅ v3.1.1

2. **Don't skip commit message format**

   - ❌ `git commit -m "fixed bug"`
   - ✅ `git commit -m "fix(drawer): correct cash count"`

3. **Don't forget to push tags**

   - ❌ `git push origin main`
   - ✅ `git push origin main --follow-tags`

4. **Don't manually edit CHANGELOG.md before release**
   - Let `standard-version` generate it
   - You can edit after if needed

---

## 🔧 Quick Commands Reference

```bash
# Check current version
npm run version:current

# Test release (no changes)
npm run release:dry-run

# Create patch release
npm run release:patch

# Create minor release
npm run release:minor

# Create major release
npm run release:major

# Auto-determine version
npm run release

# Push with tags
git push origin main --follow-tags

# View recent commits
git log --oneline -10

# View all tags
git tag -l

# View changelog
cat CHANGELOG.md
```

---

## 🎯 Your Next Release

To create your first proper release with this new system:

1. **Review your recent commits** (make sure they follow convention going forward):

   ```bash
   git log --oneline -20
   ```

2. **Create a patch release** (since we just set up the system):

   ```bash
   npm run release:patch
   ```

   This will create v3.1.1

3. **Review the changes**:

   ```bash
   git log -1                    # See the version bump commit
   cat CHANGELOG.md              # See the updated changelog
   ```

4. **Push to GitHub**:

   ```bash
   git push origin main --follow-tags
   ```

5. **Watch the GitHub Actions workflow**:
   - Go to: https://github.com/Sam231221/AuraSwift/actions
   - Watch the "Release" workflow build and publish

---

## 📚 More Information

- See `RELEASING.md` for detailed release process
- See `RELEASE_MANAGEMENT_PLAN.md` for overall strategy
- See `.versionrc.json` for configuration options

---

## ✅ What's Changed From Before

### Before (Bad):

```
Version: v3.1.0-main.1760732709
Description: (empty)
Files: Just the .exe
```

### After (Good):

```
Version: v3.1.1
Description:
  ### ✨ Features
  * add thermal printer support

  ### 🐛 Bug Fixes
  * fix drawer button visibility
  * fix E2E test failures

Files: Windows installer + blockmap + update manifest
```

---

**You're all set! 🎉**

Your next release will be professional, properly versioned, and include a beautiful changelog.
