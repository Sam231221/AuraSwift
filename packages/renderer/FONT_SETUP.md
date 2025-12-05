# Font Setup Guide for Electron App

## Problem

Custom fonts work in development but appear as default/system fonts in the packaged Windows distribution.

## Solution

Fonts need to be:

1. **Local files** (not loaded from CDN/external URLs)
2. **Properly declared** with `@font-face` in CSS
3. **Placed in the `public` directory** so Vite bundles them
4. **Referenced correctly** in your CSS

## Step-by-Step Setup

### 1. Place Font Files

Place your font files in: `packages/renderer/public/fonts/`

Example structure:

```
packages/renderer/public/fonts/
  ├── YourFont-Regular.woff2
  ├── YourFont-Regular.woff
  ├── YourFont-Medium.woff2
  ├── YourFont-Medium.woff
  ├── YourFont-SemiBold.woff2
  ├── YourFont-SemiBold.woff
  ├── YourFont-Bold.woff2
  └── YourFont-Bold.woff
```

**Recommended formats:**

- `.woff2` (best compression, modern browsers)
- `.woff` (fallback for older browsers)

### 2. Update CSS with @font-face

Edit `packages/renderer/src/index.css` and add your `@font-face` declarations:

```css
@font-face {
  font-family: "YourFont";
  src: url("/fonts/YourFont-Regular.woff2") format("woff2"), url("/fonts/YourFont-Regular.woff") format("woff");
  font-weight: 400;
  font-style: normal;
  font-display: swap;
}

@font-face {
  font-family: "YourFont";
  src: url("/fonts/YourFont-Medium.woff2") format("woff2"), url("/fonts/YourFont-Medium.woff") format("woff");
  font-weight: 500;
  font-style: normal;
  font-display: swap;
}

@font-face {
  font-family: "YourFont";
  src: url("/fonts/YourFont-SemiBold.woff2") format("woff2"), url("/fonts/YourFont-SemiBold.woff") format("woff");
  font-weight: 600;
  font-style: normal;
  font-display: swap;
}

@font-face {
  font-family: "YourFont";
  src: url("/fonts/YourFont-Bold.woff2") format("woff2"), url("/fonts/YourFont-Bold.woff") format("woff");
  font-weight: 700;
  font-style: normal;
  font-display: swap;
}
```

### 3. Configure Font in Tailwind CSS

In the `@theme inline` block in `packages/renderer/src/index.css`, add:

```css
@theme inline {
  --font-sans: "YourFont", system-ui, -apple-system, sans-serif;
  /* ... other theme variables ... */
}
```

### 4. Apply Font to Body

In the `@layer base` block, update the body styles:

```css
@layer base {
  body {
    @apply bg-background text-foreground;
    font-family: var(--font-sans, system-ui, -apple-system, sans-serif);
  }
}
```

Or use Tailwind's font utility classes throughout your app:

```tsx
<div className="font-sans">Your content</div>
```

## Common Font Sources

### Google Fonts

1. Visit [Google Fonts](https://fonts.google.com/)
2. Select your font
3. Click "Download family" or use [google-webfonts-helper](https://gwfh.mranftl.com/fonts)
4. Extract and place `.woff2` files in `public/fonts/`

### Custom Font Files

If you have `.ttf` or `.otf` files:

1. Convert to `.woff2` using tools like:
   - [CloudConvert](https://cloudconvert.com/)
   - [Font Squirrel Webfont Generator](https://www.fontsquirrel.com/tools/webfont-generator)
2. Place converted files in `public/fonts/`

## Verification

### Development

1. Run `npm start` (or your dev command)
2. Open DevTools → Network tab
3. Check that font files load successfully
4. Inspect elements to verify font-family is applied

### Production Build

1. Run `npm run build`
2. Check `packages/renderer/dist/fonts/` - font files should be there
3. Build Windows distribution: `npm run compile`
4. Test the packaged app - fonts should work!

## Troubleshooting

### Fonts still not working in packaged app?

1. **Check font file paths:**

   - Use relative paths starting with `/fonts/` (not `./fonts/` or `../fonts/`)
   - Vite serves `public` files from root in production

2. **Verify files are included:**

   - Check `packages/renderer/dist/fonts/` after build
   - Font files should be copied there automatically

3. **Check font-family name:**

   - Ensure font-family name in `@font-face` matches what you use in CSS
   - Use quotes around font names with spaces: `'Your Font Name'`

4. **Font format issues:**

   - Prefer `.woff2` format (smaller, better compression)
   - Include `.woff` as fallback
   - Electron's Chromium supports both formats

5. **Clear build cache:**
   ```bash
   rm -rf packages/renderer/dist
   npm run build
   ```

## Example: Using Inter Font

If you want to use Inter font:

1. Download Inter from [Google Fonts](https://fonts.google.com/specimen/Inter)
2. Place files in `public/fonts/`:

   - `Inter-Regular.woff2`
   - `Inter-Medium.woff2`
   - `Inter-SemiBold.woff2`
   - `Inter-Bold.woff2`

3. Update CSS:

```css
@font-face {
  font-family: "Inter";
  src: url("/fonts/Inter-Regular.woff2") format("woff2");
  font-weight: 400;
  font-display: swap;
}
/* ... add other weights ... */

@theme inline {
  --font-sans: "Inter", system-ui, sans-serif;
}
```

## Notes

- **Font paths in Electron:** Use absolute paths starting with `/` - Vite handles the mapping
- **Font loading:** `font-display: swap` ensures text is visible while fonts load
- **File size:** `.woff2` files are typically 30-50% smaller than `.woff`
- **Build process:** Vite automatically copies `public/` files to `dist/` during build
- **Electron-builder:** Automatically includes `dist/` files in the packaged app
