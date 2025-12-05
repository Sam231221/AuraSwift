# Quick Start: Inter Font Setup

## ✅ What's Already Done

The Inter font has been fully configured in the codebase:

- ✅ `@font-face` declarations added to `index.css`
- ✅ Tailwind CSS theme configured with Inter
- ✅ Body font-family set to Inter
- ✅ Font rendering optimizations applied

## 📥 What You Need to Do

**Download the Inter font files** and place them in this directory:

### Step 1: Download Font Files

**Option A: Google Webfonts Helper (Easiest)**

1. Go to: https://google-webfonts-helper.herokuapp.com/fonts/inter?subsets=latin
2. Select weights: **400, 500, 600, 700**
3. Choose format: **woff2**
4. Download the files
5. Extract and copy the `.woff2` files here

**Option B: Google Fonts Direct**

1. Go to: https://fonts.google.com/specimen/Inter
2. Click "Download family"
3. Extract ZIP → go to `static/` folder
4. Copy these files here:
   - `Inter-Regular.woff2`
   - `Inter-Medium.woff2`
   - `Inter-SemiBold.woff2`
   - `Inter-Bold.woff2`

### Step 2: Verify Files

After downloading, you should have:

```
packages/renderer/public/fonts/
  ├── Inter-Regular.woff2
  ├── Inter-Medium.woff2
  ├── Inter-SemiBold.woff2
  └── Inter-Bold.woff2
```

### Step 3: Build and Test

```bash
# Build the renderer
npm run build

# Verify fonts are copied to dist
ls packages/renderer/dist/fonts/

# Build full Electron app
npm run compile
```

## 🎯 Expected Result

- ✅ Font loads in development (`npm start`)
- ✅ Font loads in production build
- ✅ Font works in Windows distribution
- ✅ Consistent font appearance across all platforms

## 🔍 Verification Checklist

- [ ] Font files are in `packages/renderer/public/fonts/`
- [ ] Files are named exactly: `Inter-Regular.woff2`, etc.
- [ ] Files are `.woff2` format
- [ ] Build completes without errors
- [ ] Fonts appear in `packages/renderer/dist/fonts/` after build
- [ ] Application shows Inter font (not system default)

## 🐛 Troubleshooting

**Fonts not showing?**

1. Check browser DevTools → Network tab for 404 errors
2. Verify file names match exactly (case-sensitive)
3. Clear build cache: `rm -rf packages/renderer/dist && npm run build`
4. Check `packages/renderer/dist/fonts/` contains the files

**Still using system font?**

1. Open DevTools → Elements → Computed styles
2. Check `font-family` value - should show "Inter"
3. Verify CSS is loading: check `index.css` in Sources tab

## 📚 More Information

See `FONT_SETUP.md` in the renderer package for detailed documentation.
