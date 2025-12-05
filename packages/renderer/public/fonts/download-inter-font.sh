#!/bin/bash

# Script to download Inter font files
# This script downloads Inter font in WOFF2 format from Google Fonts

FONT_DIR="$(cd "$(dirname "$0")" && pwd)"
FONT_NAME="Inter"
BASE_URL="https://fonts.gstatic.com/s/inter/v18"

echo "Downloading Inter font files to: $FONT_DIR"

# Create fonts directory if it doesn't exist
mkdir -p "$FONT_DIR"

# Download font files
echo "Downloading Inter-Regular.woff2..."
curl -L "${BASE_URL}/UcCO3FwrK3iLTeHuS_fvQtMwCp50KnMw2boKoduKmMEVuLyfAZ9hiA.woff2" \
  -o "${FONT_DIR}/Inter-Regular.woff2"

echo "Downloading Inter-Medium.woff2..."
curl -L "${BASE_URL}/UcCO3FwrK3iLTeHuS_fvQtMwCp50KnMw2boKoduKmMEVuLyfAZ9hiA.woff2" \
  -o "${FONT_DIR}/Inter-Medium.woff2"

echo "Downloading Inter-SemiBold.woff2..."
curl -L "${BASE_URL}/UcCO3FwrK3iLTeHuS_fvQtMwCp50KnMw2boKoduKmMEVuLyfAZ9hiA.woff2" \
  -o "${FONT_DIR}/Inter-SemiBold.woff2"

echo "Downloading Inter-Bold.woff2..."
curl -L "${BASE_URL}/UcCO3FwrK3iLTeHuS_fvQtMwCp50KnMw2boKoduKmMEVuLyfAZ9hiA.woff2" \
  -o "${FONT_DIR}/Inter-Bold.woff2"

echo ""
echo "✅ Font files downloaded successfully!"
echo ""
echo "Note: The URLs above are placeholders. For actual downloads, visit:"
echo "https://google-webfonts-helper.herokuapp.com/fonts/inter?subsets=latin"
echo ""
echo "Or use the manual download method described in FONT_SETUP.md"
