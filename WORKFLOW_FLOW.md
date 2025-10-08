# GitHub Actions Workflow Flow Documentation

This document explains the flow, connections, and data passing between workflows in the AuraSwift project.

## Overview

The AuraSwift project uses a modular GitHub Actions setup with multiple interconnected workflows that handle CI/CD processes for building, testing, and deploying the Electron application across multiple platforms.

## Workflow Architecture

```
[External Trigger] → ci.yml (Main Orchestrator)
                      ├─ prepare job (metadata)
                      ├─ compile-and-test.yml (build & test)
                      └─ deploy.yml (release)
```

## Workflow Files

### 1. `ci.yml` - Main Entry Point

**Purpose**: Central orchestrator that coordinates all CI/CD processes
**Trigger**: Push to main, Pull requests, Manual dispatch, or `workflow_call`
**Location**: `.github/workflows/ci.yml`

### 2. `compile-and-test.yml` - Build & Test

**Purpose**: Builds the application for all platforms and runs tests
**Trigger**: Called by `ci.yml`
**Location**: `.github/workflows/compile-and-test.yml`

### 3. `deploy.yml` - Release & Deploy

**Purpose**: Creates GitHub releases with built artifacts.
**Trigger**: Called by `ci.yml` (only on push to main)
**Location**: `.github/workflows/deploy.yml`

### 4. `codeql.yml` - Security Scanning

**Purpose**: Analyzes code for security vulnerabilities
**Trigger**: Push/PR to main, weekly schedule
**Location**: `.github/workflows/codeql.yml`

## Detailed Flow

### Phase 1: Preparation (`ci.yml` - prepare job)

```yaml
Job: prepare
├─ Checkout repository
├─ Get commit timestamp
├─ Extract app version from package.json
├─ Generate full version string
└─ Output metadata for other jobs
```

**Outputs**:

- `APP_VERSION`: Version from package.json (e.g., "3.1.0")
- `COMMIT_TIMESTAMP`: Unix timestamp of commit
- `APP_FULL_VERSION`: Combined version (e.g., "3.1.0-main.1728234567")

### Phase 2: Build & Test (`compile-and-test.yml`)

```yaml
Job: compile-and-test
├─ Receives inputs from prepare job
├─ Builds on multiple platforms:
│  ├─ windows-latest (Windows builds)
│  ├─ macos-latest (macOS builds)
│  └─ ubuntu-latest (Linux builds)
├─ Runs tests on each platform
├─ Creates build artifacts
└─ Uploads artifacts for download
```

**Platform-specific outputs**:

- Windows: `.exe` installers, portable apps
- macOS: `.dmg` installers, `.zip` archives
- Linux: `.deb` packages

### Phase 3: Deploy (`deploy.yml`)

```yaml
Job: deploy
├─ Condition: Only runs on push to main branch
├─ Downloads artifacts from compile-and-test
├─ Creates GitHub release
└─ Uploads release assets
```

**Release artifacts**:

- All platform-specific installers
- Auto-update configuration files
- Release notes and metadata

## Data Flow & Communication

### Input Parameters

Workflows communicate via inputs passed through `with:` blocks:

```yaml
# Example from ci.yml calling compile-and-test.yml
with:
  renderer-template: ${{ inputs.renderer-template }}
  app-version: ${{ needs.prepare.outputs.APP_FULL_VERSION }}
  distribution-channel: ${{ inputs.distribution-channel }}
```

### Job Dependencies

Jobs use `needs:` to ensure proper execution order:

```yaml
compile-and-test:
  needs: [prepare] # Waits for prepare to complete

deploy:
  needs: [prepare, compile-and-test] # Waits for both jobs
```

### Output Sharing

Data flows between jobs using outputs:

```yaml
# Setting output in prepare job
- id: APP_VERSION
  run: echo "APP_VERSION=$(jq -r .version package.json)" >> $GITHUB_OUTPUT

# Using output in later job
app-version: ${{ needs.prepare.outputs.APP_VERSION }}
```

## Execution Conditions

### Automatic Triggers

- **Push to main**: Triggers full CI/CD pipeline
- **Pull Request**: Triggers build and test only (no deploy)
- **Manual dispatch**: Can be triggered manually

### Conditional Execution

- **Deploy job**: Only runs on push to main branch
- **Security scanning**: Runs on schedule and code changes

## Platform Matrix Strategy

The build process uses a matrix strategy to build for multiple platforms:

```yaml
strategy:
  matrix:
    os:
      - windows-latest
      - ubuntu-latest
      - macos-latest
```

Each matrix job runs independently, creating platform-specific builds.

## Artifact Storage

### Build Artifacts (Temporary - 90 days)

- Stored in GitHub Actions artifacts
- Available for download from workflow runs
- Organized by platform (windows-latest-main, macos-latest-main, etc.)

### Release Assets (Permanent)

- Published to GitHub Releases
- Publicly downloadable
- Include auto-update metadata

## Security & Permissions

### Required Permissions

```yaml
permissions:
  contents: write # Read/write repository content
  id-token: write # OIDC token for attestations
  attestations: write # Build provenance attestations
  security-events: write # Security scanning results
```

### Build Provenance

All builds include cryptographic attestations for supply chain security.

## Troubleshooting

### Common Issues

1. **Billing limits**: Workflows may fail if GitHub Actions minutes are exceeded
2. **Permission errors**: Check repository settings for Actions permissions
3. **Build failures**: Check platform-specific logs in matrix jobs

### Monitoring

- View workflow runs in the **Actions** tab
- Check build status in pull requests
- Monitor releases in the **Releases** section

## Customization

### Adding New Platforms

Add entries to the matrix strategy in `compile-and-test.yml`:

```yaml
matrix:
  os:
    - windows-latest
    - macos-latest
    - ubuntu-latest
    - macos-13 # Add older macOS version
```

### Modifying Build Process

- Edit build commands in `compile-and-test.yml`
- Update electron-builder configuration
- Modify test scripts as needed

### Changing Release Process

- Edit deployment logic in `deploy.yml`
- Update release notes generation
- Modify artifact organization

---

_Last updated: October 2025_
