# Release Process Guide

This document describes how to create and publish releases for AuraSwift POS System.

## 📋 Prerequisites

Before creating a release, ensure:

- [ ] All tests are passing (`npm run test:all`)
- [ ] No critical bugs or blockers
- [ ] Documentation is updated
- [ ] All changes are committed to `main` branch
- [ ] You have push access to the repository

## 🎯 Release Types

### Patch Release (v3.1.0 → v3.1.1)

**When:** Bug fixes, minor improvements, security patches  
**Example:** Fixing printer connection timeout

### Minor Release (v3.1.0 → v3.2.0)

**When:** New features, enhancements, backward-compatible changes  
**Example:** Adding inventory management feature

### Major Release (v3.0.0 → v4.0.0)

**When:** Breaking changes, major rewrites, incompatible updates  
**Example:** Database schema changes that require migration

## 🚀 Release Steps

### Quick Release (Recommended)

```bash
# 1. Ensure you're on main branch
git checkout main
git pull origin main

# 2. Run appropriate release command
npm run release:patch   # For bug fixes
npm run release:minor   # For new features
npm run release:major   # For breaking changes

# 3. Review the changes
git log -1
git show

# 4. Push to GitHub (triggers automatic build and release)
git push origin main --follow-tags
```

### What Happens Automatically

1. ✅ Version number is bumped in `package.json`
2. ✅ CHANGELOG.md is updated with commit messages
3. ✅ Git commit is created
4. ✅ Git tag is created (e.g., `v3.2.0`)
5. ✅ GitHub Actions workflow triggers on tag push
6. ✅ Windows installer is built
7. ✅ GitHub Release is created
8. ✅ Installer is uploaded to release
9. ✅ Release notes are generated

## 📝 Writing Good Commit Messages

Use conventional commit format for automatic changelog generation:

### Format

```
<type>(<scope>): <subject>

<body>

<footer>
```

### Types

- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code style (formatting, no logic change)
- `refactor`: Code restructuring
- `perf`: Performance improvement
- `test`: Test changes
- `build`: Build system changes
- `ci`: CI/CD changes
- `chore`: Maintenance tasks

### Examples

**Good commit messages:**

```bash
git commit -m "feat(inventory): add low stock alerts"
git commit -m "fix(printer): resolve Windows 11 connection timeout"
git commit -m "docs(readme): update installation instructions"
git commit -m "perf(database): add indexes for faster queries"
```

**Bad commit messages:**

```bash
git commit -m "fixed stuff"           # ❌ Not descriptive
git commit -m "updated code"          # ❌ No type/scope
git commit -m "asdfasdf"              # ❌ Not meaningful
```

## 🔍 Manual Release (If Automated Fails)

### Step 1: Build Locally

```bash
npm run compile:win
```

### Step 2: Create Release on GitHub

1. Go to https://github.com/Sam231221/AuraSwift/releases
2. Click "Draft a new release"
3. Choose/create tag: `v3.2.0`
4. Fill in release title: `AuraSwift v3.2.0 - [Feature Name]`
5. Copy relevant section from CHANGELOG.md to description
6. Upload `dist/*.exe` files
7. Publish release

## 📊 Release Checklist

### Before Release

- [ ] Run full test suite: `npm run test:all:clean`
- [ ] Build successfully: `npm run build`
- [ ] Test app locally: `npm start`
- [ ] Review all changes since last release
- [ ] Update documentation if needed
- [ ] Check CHANGELOG.md is accurate

### During Release

- [ ] Bump version correctly (patch/minor/major)
- [ ] Verify CHANGELOG.md generated correctly
- [ ] Push tags: `git push origin main --follow-tags`
- [ ] Wait for GitHub Actions to complete

### After Release

- [ ] Verify release on GitHub
- [ ] Download and test installer
- [ ] Test auto-updater (if applicable)
- [ ] Update documentation site
- [ ] Announce release (if public)
- [ ] Monitor for issues

## 🎨 Release Notes Template

If writing manually, use this template:

```markdown
# AuraSwift v3.2.0 - Inventory Management Update

**Release Date:** October 17, 2025  
**Platform:** Windows

## 🎉 What's New

### Features

- ✨ **Inventory Management** - Track stock levels in real-time
- ✨ **Low Stock Alerts** - Notifications when products run low

### Improvements

- ⚡ Faster transaction processing
- 🎨 Redesigned UI with better UX

### Bug Fixes

- 🐛 Fixed printer connection issues
- 🐛 Resolved cash drawer counting errors

## 📦 Installation

**New Users:** Download and run the installer as Administrator  
**Existing Users:** Auto-update will prompt you (recommended)

## 📖 Full Changelog

See [CHANGELOG.md](./CHANGELOG.md) for complete details

## 🆘 Support

- 📧 Email: sameershahithakuri123@gmail.com
- 🐛 Issues: https://github.com/Sam231221/AuraSwift/issues
```

## 🔧 Troubleshooting

### Build Fails

```bash
# Clean and rebuild
rm -rf node_modules dist
npm install
npm run compile:win
```

### Tests Fail

```bash
# Clean database and retest
npm run db:dev:clean
npm run test:all
```

### Can't Push Tags

```bash
# Check remote
git remote -v

# Force push tags (use carefully!)
git push origin main --tags --force
```

### Version Mismatch

```bash
# Reset to last tag
git reset --hard $(git describe --tags --abbrev=0)

# Or manually fix package.json and retry
```

## 📅 Release Schedule

### Recommended Cadence

- **Patch Releases:** As needed (critical bugs, security)
- **Minor Releases:** Monthly (new features)
- **Major Releases:** Quarterly or when needed

### Example Timeline

```
Week 1-2: Development
Week 3: Testing
Week 4: Release
  → Monday: Feature freeze
  → Tuesday: Final testing
  → Wednesday: Create release
  → Thursday: Monitor for issues
  → Friday: Hotfix if needed
```

## 🎯 Quick Commands Reference

```bash
# Check current version
npm run version:current

# Bump version
npm run release:patch    # 3.1.0 → 3.1.1
npm run release:minor    # 3.1.0 → 3.2.0
npm run release:major    # 3.0.0 → 4.0.0

# Generate changelog
npm run changelog

# Build
npm run compile:win

# Test
npm run test:all:clean
```

## 📚 Additional Resources

- [Semantic Versioning](https://semver.org/)
- [Keep a Changelog](https://keepachangelog.com/)
- [Conventional Commits](https://www.conventionalcommits.org/)
- [GitHub Releases](https://docs.github.com/en/repositories/releasing-projects-on-github/about-releases)

---

**Last Updated:** October 17, 2025  
**Maintained By:** Sameer Shahi  
**Questions?** Open an issue or contact via email
