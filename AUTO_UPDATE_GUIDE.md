# Auto-Update Guide for AuraSwift

This guide explains how customers automatically receive updates when you release new versions of AuraSwift.

## 🎯 Overview

AuraSwift uses **electron-updater** to automatically deliver updates to customers without requiring manual downloads.

### How It Works:

```
Developer (You)                  GitHub                    Customer's Computer
     │                              │                              │
     │  1. Push code changes        │                              │
     ├─────────────────────────────>│                              │
     │                              │                              │
     │  2. GitHub Actions runs      │                              │
     │     - Builds app             │                              │
     │     - Creates release        │                              │
     │     - Uploads installers     │                              │
     │                              │                              │
     │                              │  3. App checks for updates   │
     │                              │<─────────────────────────────┤
     │                              │                              │
     │                              │  4. Returns: New version!    │
     │                              │─────────────────────────────>│
     │                              │     (with CHANGELOG.md)      │
     │                              │                              │
     │                              │  5. Downloads update files   │
     │                              │<─────────────────────────────┤
     │                              │─────────────────────────────>│
     │                              │                              │
     │                              │                         6. Shows
     │                              │                        "Update Available"
     │                              │                         notification
     │                              │                              │
     │                              │                         7. User clicks
     │                              │                        "Install Update"
     │                              │                              │
     │                              │                         8. App restarts
     │                              │                        with new version
```

---

## ✅ Current Configuration Status

### 1. **AutoUpdater Module** (✅ FULLY IMPLEMENTED)

Location: `packages/main/src/modules/AutoUpdater.ts`

**Features:**

- ✅ Checks for updates on app startup
- ✅ Shows custom dialog with version info and changelog
- ✅ "Download Update" button for user confirmation
- ✅ Background download with progress tracking
- ✅ "Restart Now" / "Restart Later" options after download
- ✅ Notifications for download start and completion
- ✅ "View Release Notes" button linking to GitHub
- ✅ Error handling with user-friendly messages

**Key Event Handlers:**

```typescript
// When update is available
updater.on("update-available", (info) => {
  dialog.showMessageBox({
    title: "🎉 Update Available",
    message: `AuraSwift ${newVersion} is available!`,
    detail: `What's New:\n${releaseNotes}`,
    buttons: ["Download Update", "View Release Notes", "Later"],
  });
});

// When download completes
updater.on("update-downloaded", (info) => {
  dialog.showMessageBox({
    title: "✅ Update Ready to Install",
    message: `AuraSwift ${newVersion} has been downloaded!`,
    buttons: ["Restart Now", "Restart Later"],
  });
});
```

### 2. **Manual Update Check** (✅ IMPLEMENTED)

Location: `packages/main/src/modules/WindowManager.ts`

**Features:**

- ✅ "Help" menu with "Check for Updates..." option
- ✅ "View Release Notes" menu item
- ✅ Works on both Windows and macOS

**Menu Structure:**

```
Help
├── Check for Updates...
├── View Release Notes
├── ─────────────────
└── About AuraSwift
```

### 3. **GitHub Releases Configuration** (✅ CONFIGURED)

Location: `.releaserc.json` + `electron-builder.mjs` + `package.json`

```javascript
// electron-builder.mjs
{
  generateUpdatesFilesForAllChannels: true,
  publish: {
    provider: 'github',
    owner: 'Sam231221',
    repo: 'AuraSwift',
    releaseType: 'release'
  }
}

// package.json
{
  "repository": {
    "type": "git",
    "url": "https://github.com/Sam231221/AuraSwift.git"
  }
}
```

**What gets published:**

- ✅ `AuraSwift-1.0.0-win-x64.exe` - Full installer for new users
- ✅ `latest.yml` - Update manifest (tells app about new version)
- ✅ `AuraSwift-1.0.0-win-x64.exe.blockmap` - Differential update file
  owner: "Sam231221",
  repo: "AuraSwift",
  },
  };

````

---

## 🚀 How to Release Updates to Customers

### **Step 1: Make Your Changes**

```bash
# Make drastic UI changes or add new functionality
git add .
git commit -m "feat(ui): redesign dashboard with modern theme"
git push origin main
````

### **Step 2: GitHub Actions Automatically:**

1. ✅ **Builds** the app for Windows
2. ✅ **Analyzes** your commit message
3. ✅ **Bumps** version (3.1.0 → 3.2.0)
4. ✅ **Generates** CHANGELOG.md entry
5. ✅ **Creates** GitHub Release
6. ✅ **Uploads** installer files

You can monitor at: https://github.com/Sam231221/AuraSwift/actions

### **Step 3: Customer's App Automatically:**

1. ✅ **Checks** for updates (on startup or every 1 hour)
2. ✅ **Downloads** update in background
3. ✅ **Shows** notification with release notes
4. ✅ **Prompts** user to restart and install

---

## 📋 What Customers See

### **1. Update Available Dialog (Automatic on Startup):**

```
╔═══════════════════════════════════════════════════════╗
║  🎉 Update Available                                  ║
║                                                       ║
║  AuraSwift 1.1.0 is available!                       ║
║                                                       ║
║  You are currently using version 1.0.0.              ║
║                                                       ║
║  What's New:                                         ║
║  ✨ Redesigned dashboard with modern theme           ║
║  ✨ Added barcode scanner support                    ║
║  🐛 Fixed printer connection timeout                 ║
║  ⚡ Improved database query performance              ║
║                                                       ║
║  Would you like to download and install this update? ║
║                                                       ║
║  [ Download Update ] [ View Release Notes ] [ Later ]║
╚═══════════════════════════════════════════════════════╝
```

**User Options:**

- **Download Update** → Starts background download, shows notification
- **View Release Notes** → Opens GitHub release page in browser
- **Later** → Dismisses dialog, will check again next time

### **2. Download Starting Notification:**

```
╔═══════════════════════════════════════════╗
║  Downloading Update                       ║
║                                           ║
║  AuraSwift 1.1.0 is being downloaded      ║
║  in the background...                     ║
╚═══════════════════════════════════════════╝
```

_(Download happens silently in background, doesn't block user's work)_

### **3. Update Ready Dialog (After Download Completes):**

```
╔═══════════════════════════════════════════════════════╗
║  ✅ Update Ready to Install                           ║
║                                                       ║
║  AuraSwift 1.1.0 has been downloaded!                ║
║                                                       ║
║  What's New:                                         ║
║  ✨ Redesigned dashboard with modern theme           ║
║  ✨ Added barcode scanner support                    ║
║  🐛 Fixed printer connection timeout                 ║
║                                                       ║
║  The update will be installed when you restart       ║
║  the application.                                    ║
║                                                       ║
║  Would you like to restart now?                      ║
║                                                       ║
║  [ Restart Now ]            [ Restart Later ]        ║
╚═══════════════════════════════════════════════════════╝
```

**User Options:**

- **Restart Now** → App closes, installs update, relaunches automatically ✨
- **Restart Later** → Shows reminder notification, will install on next manual restart

### **4. Manual Check from Menu:**

User can manually check anytime via:

```
Help → Check for Updates...
```

If already up to date:

```
╔═══════════════════════════════════════════╗
║  ✅ You're Up to Date                     ║
║                                           ║
║  AuraSwift 1.1.0 is the latest version   ║
╚═══════════════════════════════════════════╝
```

║ What's New: ║
║ ✨ Redesigned dashboard with modern theme ║
║ ✨ Added barcode scanner support ║
║ 🐛 Fixed printer connection timeout ║
║ ⚡ Improved database query performance ║
║ ║
║ [ Release Notes ] [ Later ] [ Install Now ]║
╚═══════════════════════════════════════════════╝

```

### **Release Notes Link:**

When user clicks "Release Notes", they see your GitHub Release page:

```

https://github.com/Sam231221/AuraSwift/releases/tag/v3.2.0

AuraSwift v3.2.0

📝 Changelog:

- ✨ Redesigned dashboard with modern theme
- ✨ Added barcode scanner support
- 🐛 Fixed printer connection timeout
- ⚡ Improved database query performance

📦 Downloads:

- AuraSwift-Setup-3.2.0.exe (Windows Installer)

```

---

## 🔧 Update Mechanisms Explained

### **1. Full Update (First Install)**

For **new customers** who don't have the app yet:

```

Customer visits: https://github.com/Sam231221/AuraSwift/releases/latest
Downloads: AuraSwift-Setup-3.2.0.exe
Installs: Double-click installer

```

### **2. Differential Update (Existing Customers)**

For **existing customers** with older versions:

```

App checks: latest.yml file on GitHub
Compares: Local version (3.1.0) vs Remote version (3.2.0)
Downloads: Only changed files (~5-20 MB instead of full 200 MB)
Applies: Differential patch using .blockmap file
Installs: On next restart

```

**Benefits:**

- ⚡ **Faster** - Downloads only changes (not full installer)
- 💾 **Smaller** - Saves bandwidth
- 🔄 **Seamless** - Happens in background

---

## 📦 Files Generated for Updates

### **In GitHub Release:**

```

📦 AuraSwift v3.2.0
├── AuraSwift-Setup-3.2.0.exe (200 MB) - Full installer
├── AuraSwift-Setup-3.2.0.exe.blockmap (50 KB) - Differential update map
└── latest.yml (1 KB) - Update manifest

````

### **latest.yml Example:**

```yaml
version: 3.2.0
files:
  - url: AuraSwift-Setup-3.2.0.exe
    sha512: abc123...
    size: 209715200
path: AuraSwift-Setup-3.2.0.exe
sha512: abc123...
releaseDate: "2025-10-24T10:30:00.000Z"
````

**What electron-updater does:**

1. Reads `latest.yml` from GitHub
2. Compares `version: 3.2.0` with local version
3. If newer → downloads `.exe.blockmap` and `.exe`
4. Verifies SHA512 checksum
5. Shows update notification

---

## 🎨 Customizing Update Notifications

### **Option 1: Show Custom Dialog**

Edit `packages/main/src/modules/AutoUpdater.ts`:

```typescript
async runAutoUpdater() {
  const updater = this.getAutoUpdater();

  updater.on('update-available', (info) => {
    dialog.showMessageBox({
      type: 'info',
      title: '🎉 Update Available!',
      message: `AuraSwift ${info.version} is available!`,
      detail: `Current: ${app.getVersion()}\nNew: ${info.version}\n\nRelease Notes:\n${info.releaseNotes}`,
      buttons: ['Download Now', 'Later']
    }).then((result) => {
      if (result.response === 0) {
        updater.downloadUpdate();
      }
    });
  });

  updater.on('update-downloaded', () => {
    dialog.showMessageBox({
      type: 'info',
      title: '✅ Update Ready',
      message: 'Update downloaded successfully!',
      detail: 'Restart AuraSwift to apply the update.',
      buttons: ['Restart Now', 'Later']
    }).then((result) => {
      if (result.response === 0) {
        updater.quitAndInstall();
      }
    });
  });

  return await updater.checkForUpdatesAndNotify();
}
```

### **Option 2: Add Update Menu Item**

Edit `packages/main/src/index.ts`:

```typescript
import { Menu } from "electron";

const menu = Menu.buildFromTemplate([
  {
    label: "Help",
    submenu: [
      {
        label: "Check for Updates",
        click: async () => {
          const { autoUpdater } = require("electron-updater");
          await autoUpdater.checkForUpdates();
        },
      },
      {
        label: "View Release Notes",
        click: () => {
          shell.openExternal("https://github.com/Sam231221/AuraSwift/releases");
        },
      },
    ],
  },
]);

Menu.setApplicationMenu(menu);
```

---

## 🔒 Security Considerations

### **Code Signing (Important for Production)**

Windows shows "Unknown Publisher" warning without code signing:

```
⚠️ Windows Protected Your PC
   Windows Defender SmartScreen prevented an unrecognized app from starting.

   Publisher: Unknown Publisher  ← Fix this with code signing
```

**How to fix:**

1. **Purchase Code Signing Certificate**

   - Options: DigiCert, Sectigo, GlobalSign (~$200-500/year)
   - Choose: "EV Code Signing Certificate" (best) or "Standard Code Signing"

2. **Add to electron-builder.mjs**

   ```javascript
   win: {
     target: ['nsis'],
     certificateFile: 'path/to/certificate.pfx',
     certificatePassword: process.env.CERTIFICATE_PASSWORD,
     signingHashAlgorithms: ['sha256'],
     publisherName: 'Your Company Name'
   }
   ```

3. **Store Certificate in GitHub Secrets**

   ```bash
   # Base64 encode certificate
   base64 certificate.pfx > certificate.txt

   # Add to GitHub Secrets:
   WINDOWS_CERTIFICATE (paste base64 content)
   CERTIFICATE_PASSWORD (your password)
   ```

4. **Update GitHub Actions** (`.github/workflows/compile-and-test.yml`)

   ```yaml
   - name: Decode certificate
     run: |
       echo "${{ secrets.WINDOWS_CERTIFICATE }}" | base64 --decode > certificate.pfx

   - name: Build with code signing
     env:
       CERTIFICATE_PASSWORD: ${{ secrets.CERTIFICATE_PASSWORD }}
     run: npm run compile
   ```

---

## 🧪 Testing Auto-Update Locally

### **Method 1: Simulate GitHub Release**

```bash
# 1. Build your app
npm run compile

# 2. Run local update server
npx simple-update-server

# 3. Point app to local server
# In AutoUpdater.ts:
updater.updateConfigPath = './dev-app-update.yml'

# 4. Create dev-app-update.yml:
provider: generic
url: http://localhost:5000
```

### **Method 2: Test with Real GitHub Release**

```bash
# 1. Create a test release
git tag v0.0.1-test
git push origin v0.0.1-test

# 2. Manually create GitHub Release
# Upload: dist/*.exe, dist/*.yml, dist/*.blockmap

# 3. Install that version locally

# 4. Create newer version
# Version 0.0.2-test with different features

# 5. Run app → Should detect update
```

---

## 📊 Update Analytics (Optional)

Track how many users update:

```typescript
// In AutoUpdater.ts
updater.on("update-downloaded", () => {
  // Send analytics
  fetch("https://your-analytics-endpoint.com/update", {
    method: "POST",
    body: JSON.stringify({
      from_version: app.getVersion(),
      to_version: info.version,
      timestamp: new Date().toISOString(),
    }),
  });
});
```

---

## 🎓 Best Practices

### ✅ Do's:

1. **Always test updates locally first**
2. **Use semantic versioning** (3.1.0 → 3.2.0)
3. **Write clear release notes** (customers read them!)
4. **Sign your code** (removes security warnings)
5. **Test differential updates** (ensure they work)
6. **Keep update files on GitHub** (don't delete old releases)

### ❌ Don'ts:

1. **Don't skip versions** (3.1.0 → 3.5.0 confuses users)
2. **Don't remove old releases** (breaks updates for users on very old versions)
3. **Don't forget to test** (broken updates = angry customers)
4. **Don't make breaking changes without major version bump**
5. **Don't use special characters in version** (only numbers and dots)

---

## 🚨 Troubleshooting

### **Problem: Updates Not Detected**

**Check:**

```typescript
// Is AutoUpdater enabled?
// In packages/main/src/index.ts:
const autoUpdater = new AutoUpdater();
await autoUpdater.enable(); // ← Make sure this is called
```

**Check:**

```bash
# Is publish config in package.json?
npm pkg get repository.url
# Should output: https://github.com/Sam231221/AuraSwift
```

### **Problem: "No published versions" Error**

**Fix:**

1. Create at least one GitHub Release
2. Ensure release has `latest.yml` file
3. Check repository is public (or add GitHub token for private)

### **Problem: Update Downloads But Doesn't Install**

**Check:**

- File permissions (Windows may block download)
- Antivirus interference (whitelist your app)
- User privileges (needs admin to install)

---

## 📝 Summary

Your AuraSwift app already has **complete auto-update capability**:

✅ **AutoUpdater module** - Checks for updates automatically  
✅ **GitHub Releases integration** - Publishes updates automatically  
✅ **Differential updates** - Fast, bandwidth-efficient updates  
✅ **Changelog generation** - Shows users what's new  
✅ **Semantic versioning** - Professional version management

### **Your Update Workflow:**

1. Make changes
2. Commit with conventional format: `feat(ui): new dashboard`
3. Push to main
4. GitHub Actions builds & releases automatically
5. Customers get notified automatically
6. They click "Update" → Done! ✨

**No manual distribution needed!** Your customers will always have the latest version automatically.

---

**Next Steps:**

1. ✅ Make a test feature commit
2. ✅ Watch GitHub Actions create release
3. ✅ Install old version locally
4. ✅ Watch it auto-update to new version
5. ✅ Consider purchasing code signing certificate

---

**Resources:**

- [electron-updater Documentation](https://www.electron.build/auto-update)
- [GitHub Releases Guide](https://docs.github.com/en/repositories/releasing-projects-on-github)
- [Code Signing for Windows](https://www.electron.build/code-signing)
- [Your Releases Page](https://github.com/Sam231221/AuraSwift/releases)
