#!/bin/bash

# Debug script to test semantic-release version detection locally
# Usage: ./debug-semantic-release.sh

echo "======================================"
echo "Semantic Release Version Debug Script"
echo "======================================"
echo ""

# Check if we're in a git repo
if ! git rev-parse --git-dir > /dev/null 2>&1; then
    echo "❌ Error: Not in a git repository"
    exit 1
fi

echo "📍 Current Branch: $(git branch --show-current)"
echo "📦 Package Version: $(jq -r .version package.json)"
echo ""

# Get last tag
LAST_TAG=$(git describe --tags --abbrev=0 2>/dev/null || echo "none")
echo "🏷️  Last Tag: $LAST_TAG"
echo ""

# Show commits since last tag
if [ "$LAST_TAG" != "none" ]; then
    echo "📝 Commits since $LAST_TAG:"
    git log --pretty=format:"  %h - %s" ${LAST_TAG}..HEAD
else
    echo "📝 All commits (no previous tags):"
    git log --pretty=format:"  %h - %s" --max-count=10
fi
echo ""
echo ""

# Analyze commit types
echo "🔍 Analyzing commit types..."
if [ "$LAST_TAG" != "none" ]; then
    COMMITS=$(git log --pretty=format:"%s" ${LAST_TAG}..HEAD)
else
    COMMITS=$(git log --pretty=format:"%s" HEAD)
fi

FEAT_COUNT=$(echo "$COMMITS" | grep -cE "^feat(\(.*\))?:" || true)
FIX_COUNT=$(echo "$COMMITS" | grep -cE "^fix(\(.*\))?:" || true)
PERF_COUNT=$(echo "$COMMITS" | grep -cE "^perf(\(.*\))?:" || true)
REFACTOR_COUNT=$(echo "$COMMITS" | grep -cE "^refactor(\(.*\))?:" || true)
BUILD_COUNT=$(echo "$COMMITS" | grep -cE "^build(\(.*\))?:" || true)
CHORE_COUNT=$(echo "$COMMITS" | grep -cE "^chore(\(.*\))?:" || true)
DOCS_COUNT=$(echo "$COMMITS" | grep -cE "^docs(\(.*\))?:" || true)
CI_COUNT=$(echo "$COMMITS" | grep -cE "^ci(\(.*\))?:" || true)

echo "  ✨ feat:     $FEAT_COUNT (triggers MINOR bump)"
echo "  🐛 fix:      $FIX_COUNT (triggers PATCH bump)"
echo "  ⚡ perf:     $PERF_COUNT (triggers PATCH bump)"
echo "  ♻️  refactor: $REFACTOR_COUNT (triggers PATCH bump)"
echo "  🏗️  build:    $BUILD_COUNT (triggers PATCH bump)"
echo "  🔧 chore:    $CHORE_COUNT (no release)"
echo "  📝 docs:     $DOCS_COUNT (no release)"
echo "  👷 ci:       $CI_COUNT (no release)"
echo ""

# Calculate what the next version should be
CURRENT_VERSION=$(jq -r .version package.json)
RELEASABLE=$((FEAT_COUNT + FIX_COUNT + PERF_COUNT + REFACTOR_COUNT + BUILD_COUNT))

if [ $RELEASABLE -gt 0 ]; then
    if [ $FEAT_COUNT -gt 0 ]; then
        BUMP_TYPE="MINOR"
        NEXT_VERSION=$(echo "$CURRENT_VERSION" | awk -F. '{$2=$2+1; $3=0; print $1"."$2"."$3}')
    else
        BUMP_TYPE="PATCH"
        NEXT_VERSION=$(echo "$CURRENT_VERSION" | awk -F. '{$3=$3+1; print $1"."$2"."$3}')
    fi
    echo "✅ RELEASABLE: Yes"
    echo "📈 Bump Type: $BUMP_TYPE"
    echo "🎯 Next Version: $NEXT_VERSION"
else
    echo "❌ RELEASABLE: No"
    echo "ℹ️  No commits that trigger a release"
fi
echo ""

# Run semantic-release dry-run
echo "======================================"
echo "Running semantic-release --dry-run"
echo "======================================"
echo ""

if ! command -v npx &> /dev/null; then
    echo "❌ npx not found. Please install Node.js"
    exit 1
fi

# Run semantic-release
echo "Output:"
echo "--------------------------------------"
npx semantic-release --dry-run --no-ci 2>&1 || {
    echo ""
    echo "⚠️  semantic-release exited with an error (this is normal for dry-run)"
}
echo "--------------------------------------"
echo ""

echo "======================================"
echo "Debug Complete"
echo "======================================"
echo ""
echo "💡 Tips:"
echo "  - Make sure commits follow conventional format: type(scope): message"
echo "  - Use 'feat:' for new features (minor version bump)"
echo "  - Use 'fix:' for bug fixes (patch version bump)"
echo "  - Use 'chore:', 'docs:', 'ci:' for non-release commits"
echo ""
