# Fonts Directory

This directory contains custom font files for the AuraSwift application.

## Current Font: Inter

The application uses **Inter** font, a professional, modern typeface designed specifically for user interfaces.

## Required Font Files

Place the following files in this directory:

- `Inter-Regular.woff2` (weight: 400)
- `Inter-Medium.woff2` (weight: 500)
- `Inter-SemiBold.woff2` (weight: 600)
- `Inter-Bold.woff2` (weight: 700)

## How to Download Inter Font

### Method 1: Google Webfonts Helper (Recommended)

1. Visit: https://google-webfonts-helper.herokuapp.com/fonts/inter?subsets=latin
2. Select the weights you need: **400 (Regular), 500 (Medium), 600 (SemiBold), 700 (Bold)**
3. Choose **"woff2"** format
4. Click **"Download @font-face CSS"** (optional - CSS is already configured)
5. Download the font files
6. Extract and place the `.woff2` files in this directory

### Method 2: Direct Download from Google Fonts

1. Visit: https://fonts.google.com/specimen/Inter
2. Click **"Download family"**
3. Extract the ZIP file
4. Navigate to `static/` folder
5. Copy the following files to this directory:
   - `Inter-Regular.woff2`
   - `Inter-Medium.woff2`
   - `Inter-SemiBold.woff2`
   - `Inter-Bold.woff2`

### Method 3: Using npm (Alternative)

```bash
npm install --save-dev @fontsource/inter
```

Then copy the font files from `node_modules/@fontsource/inter/files/` to this directory.

## File Naming

Ensure files are named exactly as shown above. The CSS references these exact filenames.

## Verification

After placing the font files:

1. Run `npm run build` in the renderer package
2. Check that files appear in `packages/renderer/dist/fonts/`
3. Test the application - fonts should load correctly

## Font Configuration

The font is configured in:

- `packages/renderer/src/index.css` - @font-face declarations and Tailwind theme

## Troubleshooting

If fonts don't appear:

1. **Check file names** - Must match exactly: `Inter-Regular.woff2`, etc.
2. **Check file paths** - Files should be in `packages/renderer/public/fonts/`
3. **Rebuild** - Run `npm run build` after adding files
4. **Check browser console** - Look for 404 errors on font files
5. **Verify format** - Use `.woff2` format (best compression and compatibility)

## Notes

- **Format**: WOFF2 is recommended (smaller file size, better compression)
- **Fallback**: System fonts are used as fallback if Inter fails to load
- **Performance**: `font-display: swap` ensures text is visible while fonts load
- **Cross-platform**: Fonts work consistently across Windows, macOS, and Linux distributions
