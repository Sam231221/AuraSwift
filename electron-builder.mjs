import pkg from './package.json' with {type: 'json'};
import mapWorkspaces from '@npmcli/map-workspaces';
import {join} from 'node:path';
import {pathToFileURL} from 'node:url';

export default /** @type import('electron-builder').Configuration */
({
  directories: {
    output: 'dist',
    buildResources: 'buildResources',
  },
  generateUpdatesFilesForAllChannels: true,
  // Note: Differential updates are automatically enabled for NSIS and Squirrel targets
  // in electron-builder 26.x. No explicit configuration needed.
  publish: {
    provider: 'github',
    owner: 'Sam231221',
    repo: 'AuraSwift',
    releaseType: 'release',
    channel: 'latest'  // Explicitly set channel to 'latest' to generate latest.yml
  },
  mac: {
    target: [
      {
        target: 'dmg',
        arch: ['x64', 'arm64']
      },
      {
        target: 'zip',
        arch: ['x64', 'arm64']
      }
    ],
    icon: 'buildResources/icon.icns',
    // Platform-specific file exclusions for macOS
    // Exclude Windows and Linux binaries, but keep macOS (darwin) binaries
    files: [
      '!**/node_modules/**/prebuilds/win32-*/**',
      '!**/node_modules/**/prebuilds/linux-*/**',
      '!**/node_modules/**/prebuilds/android-*/**',
      '!**/node_modules/**/bin/win32-*/**',
      '!**/node_modules/**/bin/linux-*/**',
      '!**/node_modules/**/bin/android-*/**',
    ]
  },
  win: {
    target: [
      {
        target: 'nsis',
        arch: ['x64']  // Focus on x64 only - Windows 10 Enterprise typically uses x64
      },
      {
        target: 'squirrel',
        arch: ['x64']  // Focus on x64 only
      }
    ],
    icon: 'buildResources/icon.ico',
    verifyUpdateCodeSignature: false,  // Set to true when you have code signing certificate
    requestedExecutionLevel: 'asInvoker',  // Don't require admin by default - let NSIS handle elevation
    // Ensure compatibility with Windows 10 Enterprise
    // Note: electron-builder automatically includes Visual C++ Redistributables for native modules
    // (better-sqlite3, node-hid, serialport, usb) when needed
    // The app is built on windows-2022 runner for better Windows 10 Enterprise compatibility
    // Platform-specific file exclusions for Windows
    // Exclude macOS, Linux, and non-x64 Windows binaries, but keep win32-x64 binaries
    files: [
      '!**/node_modules/**/prebuilds/darwin-*/**',
      '!**/node_modules/**/prebuilds/linux-*/**',
      '!**/node_modules/**/prebuilds/android-*/**',
      '!**/node_modules/**/prebuilds/win32-ia32/**',
      '!**/node_modules/**/prebuilds/win32-arm64/**',
      '!**/node_modules/**/bin/darwin-*/**',
      '!**/node_modules/**/bin/linux-*/**',
      '!**/node_modules/**/bin/android-*/**',
      '!**/node_modules/**/bin/win32-ia32/**',
      '!**/node_modules/**/bin/win32-arm64/**',
    ]
  },
  squirrelWindows: {
    // iconUrl is required for Squirrel - must be a public URL
    iconUrl: 'https://raw.githubusercontent.com/Sam231221/AuraSwift/main/buildResources/icon.ico',
    // Optional: Add a loading GIF during installation
    // loadingGif: 'buildResources/install-spinner.gif'
  },
  nsis: {
    oneClick: false,                    // Show installation wizard (not one-click)
    perMachine: false,                  // Install for current user (better for Enterprise environments)
    allowElevation: true,               // Allow elevation if user wants to install for all users
    allowToChangeInstallationDirectory: true,  // Let user choose install location
    createDesktopShortcut: true,        // Create desktop shortcut
    createStartMenuShortcut: true,      // Create Start Menu shortcut
    shortcutName: 'AuraSwift',         // Shortcut name
    deleteAppDataOnUninstall: true,    // Remove user data when uninstalling
    menuCategory: true,                 // Create program group in Start Menu
    runAfterFinish: true,              // Run app after installation completes
    installerIcon: 'buildResources/icon.ico',
    uninstallerIcon: 'buildResources/icon.ico',
    // installerHeader requires .bmp format (150x57 pixels), not .ico
    // Removing it to use default NSIS header
    license: undefined,                 // Path to license.txt (optional)
    // Request execution level is set in win.requestedExecutionLevel (not in nsis config)
    // Include Visual C++ Redistributables check/install
    // Note: electron-builder will automatically include VC++ Redist if needed
    // but we ensure compatibility with Windows 10 Enterprise
    include: undefined,                 // Use default includes
  },
  linux: {
    target: ['deb'],
  },
  /**
   * It is recommended to avoid using non-standard characters such as spaces in artifact names,
   * as they can unpredictably change during deployment, making them impossible to locate and download for update.
   */
  artifactName: '${productName}-${version}-${os}-${arch}.${ext}',
  files: [
    'LICENSE*',
    pkg.main,
    '!node_modules/@app/**',
    // Exclude development and unnecessary files
    '!**/*.d.ts',  // Exclude TypeScript definitions
    '!**/*.map',   // Exclude source maps
    '!**/test/**',
    '!**/tests/**',
    '!**/__tests__/**',
    '!**/*.test.*',
    '!**/*.spec.*',
    // Exclude source files from native modules (saves ~19MB)
    '!**/node_modules/**/*.c',      // C source files
    '!**/node_modules/**/*.cpp',   // C++ source files
    '!**/node_modules/**/*.h',      // Header files
    '!**/node_modules/**/*.hpp',   // C++ header files
    '!**/node_modules/**/deps/**',  // Source dependencies (e.g., better-sqlite3/deps/sqlite3/)
    // Exclude build artifacts from native modules (saves ~5-10MB)
    '!**/node_modules/**/build/**',     // Build directories
    '!**/node_modules/**/obj/**',      // Object files directories
    '!**/node_modules/**/Release/**',   // Release build artifacts
    '!**/node_modules/**/Debug/**',     // Debug build artifacts
    '!**/node_modules/**/*.o',          // Object files
    '!**/node_modules/**/*.a',          // Static libraries
    // Note: Platform-specific binary exclusions are handled in mac/win configs
    // Global exclusions here apply to all platforms
    // Legacy module-specific exclusions (kept for compatibility)
    '!**/usb/prebuilds/darwin-*/**',
    '!**/usb/prebuilds/linux-*/**',
    '!**/usb/prebuilds/android-*/**',
    '!**/usb/prebuilds/win32-ia32/**',
    '!**/usb/prebuilds/win32-arm64/**',
    '!**/usb/bin/darwin-*/**',
    '!**/better-sqlite3/bin/darwin-*/**',
    '!**/better-sqlite3/bin/linux-*/**',
    '!**/better-sqlite3/bin/android-*/**',
    '!**/node-hid/prebuilds/darwin-*/**',
    '!**/node-hid/prebuilds/linux-*/**',
    '!**/node-hid/prebuilds/android-*/**',
    '!**/node-hid/prebuilds/win32-ia32/**',
    '!**/node-hid/prebuilds/win32-arm64/**',
    '!**/serialport/prebuilds/darwin-*/**',
    '!**/serialport/prebuilds/linux-*/**',
    '!**/serialport/prebuilds/android-*/**',
    '!**/serialport/prebuilds/win32-ia32/**',
    '!**/serialport/prebuilds/win32-arm64/**',
    ...await getListOfFilesFromEachWorkspace(),
  ],
  // Unpack native modules from asar (required for native .node files)
  // Unpacking entire module directory ensures all dependencies are accessible
  asarUnpack: [
    '**/better-sqlite3/**',
    '**/node-hid/**',
    '**/serialport/**',
    '**/usb/**',
  ],
  // Include migrations as extraResources so they're accessible outside asar if needed
  // IMPORTANT: Include ALL files including meta/_journal.json and snapshot files
  extraResources: [
    {
      from: 'packages/main/dist/migrations',
      to: 'migrations',
      filter: ['**/*'],  // Include all files: .sql, meta/_journal.json, meta/*.json
    },
  ],
});

/**
 * By default, electron-builder copies each package into the output compilation entirety,
 * including the source code, tests, configuration, assets, and any other files.
 *
 * So you may get compiled app structure like this:
 * ```
 * app/
 * ├── node_modules/
 * │   └── workspace-packages/
 * │       ├── package-a/
 * │       │   ├── src/            # Garbage. May be safely removed
 * │       │   ├── dist/
 * │       │   │   └── index.js    # Runtime code
 * │       │   ├── vite.config.js  # Garbage
 * │       │   ├── .env            # some sensitive config
 * │       │   └── package.json
 * │       ├── package-b/
 * │       ├── package-c/
 * │       └── package-d/
 * ├── packages/
 * │   └── entry-point.js
 * └── package.json
 * ```
 *
 * To prevent this, we read the “files”
 * property from each package's package.json
 * and add all files that do not match the patterns to the exclusion list.
 *
 * This way,
 * each package independently determines which files will be included in the final compilation and which will not.
 *
 * So if `package-a` in its `package.json` describes
 * ```json
 * {
 *   "name": "package-a",
 *   "files": [
 *     "dist/**\/"
 *   ]
 * }
 * ```
 *
 * Then in the compilation only those files and `package.json` will be included:
 * ```
 * app/
 * ├── node_modules/
 * │   └── workspace-packages/
 * │       ├── package-a/
 * │       │   ├── dist/
 * │       │   │   └── index.js    # Runtime code
 * │       │   └── package.json
 * │       ├── package-b/
 * │       ├── package-c/
 * │       └── package-d/
 * ├── packages/
 * │   └── entry-point.js
 * └── package.json
 * ```
 */
async function getListOfFilesFromEachWorkspace() {

  /**
   * @type {Map<string, string>}
   */
  const workspaces = await mapWorkspaces({
    cwd: process.cwd(),
    pkg,
  });

  const allFilesToInclude = [];

  for (const [name, path] of workspaces) {
    const pkgPath = join(path, 'package.json');
    const {default: workspacePkg} = await import(pathToFileURL(pkgPath), {with: {type: 'json'}});

    let patterns = workspacePkg.files || ['dist/**', 'package.json'];

    patterns = patterns.map(p => join('node_modules', name, p));
    allFilesToInclude.push(...patterns);
  }

  return allFilesToInclude;
}
