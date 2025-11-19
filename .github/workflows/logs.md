Prepare all required actions
Getting action download info
Run ./.github/actions/init-template-with-renderer
Run actions/setup-node@v4
Found in cache @ C:\hostedtoolcache\windows\node\18.20.8\x64
Environment details
Run if [ -d "packages/renderer" ]; then
Run actions/cache@v4
Cache not found for input keys: npm-Windows-node18--51ef0c6ec40fc67f76f517eb344a4b2939862d52f7175875d33564689d16cdc2, npm-Windows-node18--
Run echo "Cleaning npm cache..."
Cleaning npm cache...
npm warn using --force RecomPrepare all required actions
Getting action download info
Run ./.github/actions/init-template-with-renderer
Run actions/setup-node@v4
Found in cache @ C:\hostedtoolcache\windows\node\20.19.5\x64
Environment details
Run if [ -d "packages/renderer" ]; then
Run actions/cache@v4
Cache not found for input keys: npm-Windows-node20--dc506606e3b7e4d2dc6de583d5862de63d33ee6dc4fea9ba724d8fd031a465cc, npm-Windows-node20--
Run echo "Cleaning npm cache..."
Cleaning npm cache...
npm warn using --force Recommended protections disabled.
Removing node_modules directories...
Cleanup complete
Run set -e
Using npm ci for existing project...
npm warn EBADENGINE Unsupported engine {
npm warn EBADENGINE package: '@electron/rebuild@4.0.1',
npm warn EBADENGINE required: { node: '>=22.12.0' },
npm warn EBADENGINE current: { node: 'v20.19.5', npm: '10.8.2' }
npm warn EBADENGINE }
npm warn EBADENGINE Unsupported engine {
npm warn EBADENGINE package: '@semantic-release/github@12.0.2',
npm warn EBADENGINE required: { node: '^22.14.0 || >= 24.10.0' },
npm warn EBADENGINE current: { node: 'v20.19.5', npm: '10.8.2' }
npm warn EBADENGINE }
npm warn EBADENGINE Unsupported engine {
npm warn EBADENGINE package: '@semantic-release/npm@13.1.2',
npm warn EBADENGINE required: { node: '^22.14.0 || >= 24.10.0' },
npm warn EBADENGINE current: { node: 'v20.19.5', npm: '10.8.2' }
npm warn EBADENGINE }
npm warn EBADENGINE Unsupported engine {
npm warn EBADENGINE package: 'node-abi@4.24.0',
npm warn EBADENGINE required: { node: '>=22.12.0' },
npm warn EBADENGINE current: { node: 'v20.19.5', npm: '10.8.2' }
npm warn EBADENGINE }
npm warn EBADENGINE Unsupported engine {
npm warn EBADENGINE package: 'semantic-release@25.0.2',
npm warn EBADENGINE required: { node: '^22.14.0 || >= 24.10.0' },
npm warn EBADENGINE current: { node: 'v20.19.5', npm: '10.8.2' }
npm warn EBADENGINE }
npm warn skipping integrity check for git dependency ssh://git@github.com/electron/node-gyp.git
npm warn deprecated semver-diff@5.0.0: Deprecated as the semver package now supports this built-in.
npm warn deprecated rimraf@2.6.3: Rimraf versions prior to v4 are no longer supported
npm warn deprecated lodash.isequal@4.5.0: This package is deprecated. Use require('node:util').isDeepStrictEqual instead.
npm warn deprecated inflight@1.0.6: This module is not supported, and leaks memory. Do not use it. Check out lru-cache if you want a good and tested way to coalesce async requests by a key value, which is much more comprehensive and powerful.
npm warn deprecated @npmcli/move-file@2.0.1: This functionality has been moved to @npmcli/fs
npm warn deprecated @esbuild-kit/esm-loader@2.6.5: Merged into tsx: https://tsx.is
npm warn deprecated @esbuild-kit/core-utils@3.3.2: Merged into tsx: https://tsx.is
npm warn deprecated rimraf@3.0.2: Rimraf versions prior to v4 are no longer supported
npm warn deprecated rimraf@3.0.2: Rimraf versions prior to v4 are no longer supported
npm warn deprecated glob@7.2.3: Glob versions prior to v9 are no longer supported
npm warn deprecated glob@7.2.3: Glob versions prior to v9 are no longer supported
npm warn deprecated glob@7.2.3: Glob versions prior to v9 are no longer supported
npm warn deprecated glob@8.1.0: Glob versions prior to v9 are no longer supported
npm warn deprecated glob@7.2.3: Glob versions prior to v9 are no longer supported
npm warn deprecated boolean@3.2.0: Package no longer supported. Contact Support at https://www.npmjs.com/support for more info.
npm warn cleanup Failed to remove some directories [
npm warn cleanup [
npm warn cleanup 'D:\\a\\AuraSwift\\AuraSwift\\node_modules\\better-sqlite3',
npm warn cleanup [Error: EBUSY: resource busy or locked, rmdir 'D:\a\AuraSwift\AuraSwift\node_modules\better-sqlite3'] {
npm warn cleanup errno: -4082,
npm warn cleanup code: 'EBUSY',
npm warn cleanup syscall: 'rmdir',
npm warn cleanup path: 'D:\\a\\AuraSwift\\AuraSwift\\node_modules\\better-sqlite3'
npm warn cleanup }
npm warn cleanup ],
npm warn cleanup [
npm warn cleanup 'D:\\a\\AuraSwift\\AuraSwift\\node_modules\\usb',
npm warn cleanup [Error: EBUSY: resource busy or locked, rmdir 'D:\a\AuraSwift\AuraSwift\node_modules\usb'] {
npm warn cleanup errno: -4082,
npm warn cleanup code: 'EBUSY',
npm warn cleanup syscall: 'rmdir',
npm warn cleanup path: 'D:\\a\\AuraSwift\\AuraSwift\\node_modules\\usb'
npm warn cleanup }
npm warn cleanup ],
npm warn cleanup [
npm warn cleanup 'D:\\a\\AuraSwift\\AuraSwift\\node_modules',
npm warn cleanup [Error: EBUSY: resource busy or locked, rmdir 'D:\a\AuraSwift\AuraSwift\node_modules\better-sqlite3'] {
npm warn cleanup errno: -4082,
npm warn cleanup code: 'EBUSY',
npm warn cleanup syscall: 'rmdir',
npm warn cleanup path: 'D:\\a\\AuraSwift\\AuraSwift\\node_modules\\better-sqlite3'
npm warn cleanup }
npm warn cleanup ],
npm warn cleanup [
npm warn cleanup 'D:\\a\\AuraSwift\\AuraSwift\\node_modules\\temp-file',
npm warn cleanup [Error: EPERM: operation not permitted, rmdir 'D:\a\AuraSwift\AuraSwift\node_modules\temp-file\node_modules'] {
npm warn cleanup errno: -4048,
npm warn cleanup code: 'EPERM',
npm warn cleanup syscall: 'rmdir',
npm warn cleanup path: 'D:\\a\\AuraSwift\\AuraSwift\\node_modules\\temp-file\\node_modules'
npm warn cleanup }
npm warn cleanup ],
npm warn cleanup [
npm warn cleanup 'D:\\a\\AuraSwift\\AuraSwift\\node_modules\\npm',
npm warn cleanup [Error: EPERM: operation not permitted, rmdir 'D:\a\AuraSwift\AuraSwift\node_modules\npm\node_modules'] {
npm warn cleanup errno: -4048,
npm warn cleanup code: 'EPERM',
npm warn cleanup syscall: 'rmdir',
npm warn cleanup path: 'D:\\a\\AuraSwift\\AuraSwift\\node_modules\\npm\\node_modules'
npm warn cleanup }
npm warn cleanup ]
npm warn cleanup ]
npm error code 1
npm error path D:\a\AuraSwift\AuraSwift\packages\main\node_modules\@serialport\bindings-cpp
npm error command failed
npm error command C:\Windows\system32\cmd.exe /d /s /c node-gyp-build
npm error node:internal/child_process:420
npm error throw new ErrnoException(err, 'spawn');
npm error ^
npm error
npm error Error: spawn EINVAL
npm error at ChildProcess.spawn (node:internal/child_process:420:11)
npm error at Object.spawn (node:child_process:762:9)
npm error at build (D:\a\AuraSwift\AuraSwift\packages\main\node_modules\node-gyp-build\bin.js:29:8)
npm error at preinstall (D:\a\AuraSwift\AuraSwift\packages\main\node_modules\node-gyp-build\bin.js:38:32)
npm error at Object.<anonymous> (D:\a\AuraSwift\AuraSwift\packages\main\node_modules\node-gyp-build\bin.js:15:3)
npm error at Module.\_compile (node:internal/modules/cjs/loader:1521:14)
npm error at Module.\_extensions..js (node:internal/modules/cjs/loader:1623:10)
npm error at Module.load (node:internal/modules/cjs/loader:1266:32)
npm error at Module.\_load (node:internal/modules/cjs/loader:1091:12)
npm error at Function.executeUserEntryPoint [as runMain] (node:internal/modules/run_main:164:12) {
npm error errno: -4071,
npm error code: 'EINVAL',
npm error syscall: 'spawn'
npm error }
npm error
npm error Node.js v20.19.5
npm error A complete log of this run can be found in: C:\npm\cache_logs\2025-11-19T22_40_12_060Z-debug-0.log
Error: Process completed with exit code 1.mended protections disabled.
Removing node_modules directories...
Cleanup complete
Run set -e
Using npm ci for existing project...
npm warn EBADENGINE Unsupported engine {
npm warn EBADENGINE package: '@electron/rebuild@4.0.1',
npm warn EBADENGINE required: { node: '>=22.12.0' },
npm warn EBADENGINE current: { node: 'v18.20.8', npm: '10.8.2' }
npm warn EBADENGINE }
npm warn EBADENGINE Unsupported engine {
npm warn EBADENGINE package: '@isaacs/balanced-match@4.0.1',
npm warn EBADENGINE required: { node: '20 || >=22' },
npm warn EBADENGINE current: { node: 'v18.20.8', npm: '10.8.2' }
npm warn EBADENGINE }
npm warn EBADENGINE Unsupported engine {
npm warn EBADENGINE package: '@isaacs/brace-expansion@5.0.0',
npm warn EBADENGINE required: { node: '20 || >=22' },
npm warn EBADENGINE current: { node: 'v18.20.8', npm: '10.8.2' }
npm warn EBADENGINE }
npm warn EBADENGINE Unsupported engine {
npm warn EBADENGINE package: '@npmcli/git@7.0.1',
npm warn EBADENGINE required: { node: '^20.17.0 || >=22.9.0' },
npm warn EBADENGINE current: { node: 'v18.20.8', npm: '10.8.2' }
npm warn EBADENGINE }
npm warn EBADENGINE Unsupported engine {
npm warn EBADENGINE package: '@npmcli/map-workspaces@5.0.0',
npm warn EBADENGINE required: { node: '^20.17.0 || >=22.9.0' },
npm warn EBADENGINE current: { node: 'v18.20.8', npm: '10.8.2' }
npm warn EBADENGINE }
npm warn EBADENGINE Unsupported engine {
npm warn EBADENGINE package: '@npmcli/package-json@7.0.3',
npm warn EBADENGINE required: { node: '^20.17.0 || >=22.9.0' },
npm warn EBADENGINE current: { node: 'v18.20.8', npm: '10.8.2' }
npm warn EBADENGINE }
npm warn EBADENGINE Unsupported engine {
npm warn EBADENGINE package: 'glob@12.0.0',
npm warn EBADENGINE required: { node: '20 || >=22' },
npm warn EBADENGINE current: { node: 'v18.20.8', npm: '10.8.2' }
npm warn EBADENGINE }
npm warn EBADENGINE Unsupported engine {
npm warn EBADENGINE package: '@npmcli/promise-spawn@9.0.1',
npm warn EBADENGINE required: { node: '^20.17.0 || >=22.9.0' },
npm warn EBADENGINE current: { node: 'v18.20.8', npm: '10.8.2' }
npm warn EBADENGINE }
npm warn EBADENGINE Unsupported engine {
npm warn EBADENGINE package: '@octokit/auth-token@6.0.0',
npm warn EBADENGINE required: { node: '>= 20' },
npm warn EBADENGINE current: { node: 'v18.20.8', npm: '10.8.2' }
npm warn EBADENGINE }
npm warn EBADENGINE Unsupported engine {
npm warn EBADENGINE package: '@octokit/core@7.0.6',
npm warn EBADENGINE required: { node: '>= 20' },
npm warn EBADENGINE current: { node: 'v18.20.8', npm: '10.8.2' }
npm warn EBADENGINE }
npm warn EBADENGINE Unsupported engine {
npm warn EBADENGINE package: '@octokit/endpoint@11.0.2',
npm warn EBADENGINE required: { node: '>= 20' },
npm warn EBADENGINE current: { node: 'v18.20.8', npm: '10.8.2' }
npm warn EBADENGINE }
npm warn EBADENGINE Unsupported engine {
npm warn EBADENGINE package: '@octokit/graphql@9.0.3',
npm warn EBADENGINE required: { node: '>= 20' },
npm warn EBADENGINE current: { node: 'v18.20.8', npm: '10.8.2' }
npm warn EBADENGINE }
npm warn EBADENGINE Unsupported engine {
npm warn EBADENGINE package: '@octokit/plugin-paginate-rest@14.0.0',
npm warn EBADENGINE required: { node: '>= 20' },
npm warn EBADENGINE current: { node: 'v18.20.8', npm: '10.8.2' }
npm warn EBADENGINE }
npm warn EBADENGINE Unsupported engine {
npm warn EBADENGINE package: '@octokit/plugin-retry@8.0.3',
npm warn EBADENGINE required: { node: '>= 20' },
npm warn EBADENGINE current: { node: 'v18.20.8', npm: '10.8.2' }
npm warn EBADENGINE }
npm warn EBADENGINE Unsupported engine {
npm warn EBADENGINE package: '@octokit/plugin-throttling@11.0.3',
npm warn EBADENGINE required: { node: '>= 20' },
npm warn EBADENGINE current: { node: 'v18.20.8', npm: '10.8.2' }
npm warn EBADENGINE }
npm warn EBADENGINE Unsupported engine {
npm warn EBADENGINE package: '@octokit/request@10.0.7',
npm warn EBADENGINE required: { node: '>= 20' },
npm warn EBADENGINE current: { node: 'v18.20.8', npm: '10.8.2' }
npm warn EBADENGINE }
npm warn EBADENGINE Unsupported engine {
npm warn EBADENGINE package: '@octokit/request-error@7.1.0',
npm warn EBADENGINE required: { node: '>= 20' },
npm warn EBADENGINE current: { node: 'v18.20.8', npm: '10.8.2' }
npm warn EBADENGINE }
npm warn EBADENGINE Unsupported engine {
npm warn EBADENGINE package: '@semantic-release/commit-analyzer@13.0.1',
npm warn EBADENGINE required: { node: '>=20.8.1' },
npm warn EBADENGINE current: { node: 'v18.20.8', npm: '10.8.2' }
npm warn EBADENGINE }
npm warn EBADENGINE Unsupported engine {
npm warn EBADENGINE package: '@semantic-release/github@12.0.2',
npm warn EBADENGINE required: { node: '^22.14.0 || >= 24.10.0' },
npm warn EBADENGINE current: { node: 'v18.20.8', npm: '10.8.2' }
npm warn EBADENGINE }
npm warn EBADENGINE Unsupported engine {
npm warn EBADENGINE package: '@semantic-release/npm@13.1.2',
npm warn EBADENGINE required: { node: '^22.14.0 || >= 24.10.0' },
npm warn EBADENGINE current: { node: 'v18.20.8', npm: '10.8.2' }
npm warn EBADENGINE }
npm warn EBADENGINE Unsupported engine {
npm warn EBADENGINE package: 'normalize-package-data@8.0.0',
npm warn EBADENGINE required: { node: '^20.17.0 || >=22.9.0' },
npm warn EBADENGINE current: { node: 'v18.20.8', npm: '10.8.2' }
npm warn EBADENGINE }
npm warn EBADENGINE Unsupported engine {
npm warn EBADENGINE package: 'read-pkg@10.0.0',
npm warn EBADENGINE required: { node: '>=20' },
npm warn EBADENGINE current: { node: 'v18.20.8', npm: '10.8.2' }
npm warn EBADENGINE }
npm warn EBADENGINE Unsupported engine {
npm warn EBADENGINE package: 'type-fest@5.2.0',
npm warn EBADENGINE required: { node: '>=20' },
npm warn EBADENGINE current: { node: 'v18.20.8', npm: '10.8.2' }
npm warn EBADENGINE }
npm warn EBADENGINE Unsupported engine {
npm warn EBADENGINE package: '@semantic-release/release-notes-generator@14.1.0',
npm warn EBADENGINE required: { node: '>=20.8.1' },
npm warn EBADENGINE current: { node: 'v18.20.8', npm: '10.8.2' }
npm warn EBADENGINE }
npm warn EBADENGINE Unsupported engine {
npm warn EBADENGINE package: '@serialport/parser-byte-length@13.0.0',
npm warn EBADENGINE required: { node: '>=20.0.0' },
npm warn EBADENGINE current: { node: 'v18.20.8', npm: '10.8.2' }
npm warn EBADENGINE }
npm warn EBADENGINE Unsupported engine {
npm warn EBADENGINE package: '@serialport/parser-cctalk@13.0.0',
npm warn EBADENGINE required: { node: '>=20.0.0' },
npm warn EBADENGINE current: { node: 'v18.20.8', npm: '10.8.2' }
npm warn EBADENGINE }
npm warn EBADENGINE Unsupported engine {
npm warn EBADENGINE package: '@serialport/parser-inter-byte-timeout@13.0.0',
npm warn EBADENGINE required: { node: '>=20.0.0' },
npm warn EBADENGINE current: { node: 'v18.20.8', npm: '10.8.2' }
npm warn EBADENGINE }
npm warn EBADENGINE Unsupported engine {
npm warn EBADENGINE package: '@serialport/parser-ready@13.0.0',
npm warn EBADENGINE required: { node: '>=20.0.0' },
npm warn EBADENGINE current: { node: 'v18.20.8', npm: '10.8.2' }
npm warn EBADENGINE }
npm warn EBADENGINE Unsupported engine {
npm warn EBADENGINE package: '@serialport/parser-regex@13.0.0',
npm warn EBADENGINE required: { node: '>=20.0.0' },
npm warn EBADENGINE current: { node: 'v18.20.8', npm: '10.8.2' }
npm warn EBADENGINE }
npm warn EBADENGINE Unsupported engine {
npm warn EBADENGINE package: '@serialport/parser-slip-encoder@13.0.0',
npm warn EBADENGINE required: { node: '>=20.0.0' },
npm warn EBADENGINE current: { node: 'v18.20.8', npm: '10.8.2' }
npm warn EBADENGINE }
npm warn EBADENGINE Unsupported engine {
npm warn EBADENGINE package: '@serialport/parser-spacepacket@13.0.0',
npm warn EBADENGINE required: { node: '>=20.0.0' },
npm warn EBADENGINE current: { node: 'v18.20.8', npm: '10.8.2' }
npm warn EBADENGINE }
npm warn EBADENGINE Unsupported engine {
npm warn EBADENGINE package: '@serialport/stream@13.0.0',
npm warn EBADENGINE required: { node: '>=20.0.0' },
npm warn EBADENGINE current: { node: 'v18.20.8', npm: '10.8.2' }
npm warn EBADENGINE }
npm warn EBADENGINE Unsupported engine {
npm warn EBADENGINE package: '@vitejs/plugin-react@5.1.1',
npm warn EBADENGINE required: { node: '^20.19.0 || >=22.12.0' },
npm warn EBADENGINE current: { node: 'v18.20.8', npm: '10.8.2' }
npm warn EBADENGINE }
npm warn EBADENGINE Unsupported engine {
npm warn EBADENGINE package: 'better-sqlite3@12.4.1',
npm warn EBADENGINE required: { node: '20.x || 22.x || 23.x || 24.x' },
npm warn EBADENGINE current: { node: 'v18.20.8', npm: '10.8.2' }
npm warn EBADENGINE }
npm warn EBADENGINE Unsupported engine {
npm warn EBADENGINE package: 'conf@14.0.0',
npm warn EBADENGINE required: { node: '>=20' },
npm warn EBADENGINE current: { node: 'v18.20.8', npm: '10.8.2' }
npm warn EBADENGINE }
npm warn EBADENGINE Unsupported engine {
npm warn EBADENGINE package: 'create-vite@7.1.2',
npm warn EBADENGINE required: { node: '^20.19.0 || >=22.12.0' },
npm warn EBADENGINE current: { node: 'v18.20.8', npm: '10.8.2' }
npm warn EBADENGINE }
npm warn EBADENGINE Unsupported engine {
npm warn EBADENGINE package: 'electron-store@10.1.0',
npm warn EBADENGINE required: { node: '>=20' },
npm warn EBADENGINE current: { node: 'v18.20.8', npm: '10.8.2' }
npm warn EBADENGINE }
npm warn EBADENGINE Unsupported engine {
npm warn EBADENGINE package: 'glob@11.1.0',
npm warn EBADENGINE required: { node: '20 || >=22' },
npm warn EBADENGINE current: { node: 'v18.20.8', npm: '10.8.2' }
npm warn EBADENGINE }
npm warn EBADENGINE Unsupported engine {
npm warn EBADENGINE package: 'hook-std@4.0.0',
npm warn EBADENGINE required: { node: '>=20' },
npm warn EBADENGINE current: { node: 'v18.20.8', npm: '10.8.2' }
npm warn EBADENGINE }
npm warn EBADENGINE Unsupported engine {
npm warn EBADENGINE package: 'hosted-git-info@9.0.2',
npm warn EBADENGINE required: { node: '^20.17.0 || >=22.9.0' },
npm warn EBADENGINE current: { node: 'v18.20.8', npm: '10.8.2' }
npm warn EBADENGINE }
npm warn EBADENGINE Unsupported engine {
npm warn EBADENGINE package: 'ini@6.0.0',
npm warn EBADENGINE required: { node: '^20.17.0 || >=22.9.0' },
npm warn EBADENGINE current: { node: 'v18.20.8', npm: '10.8.2' }
npm warn EBADENGINE }
npm warn EBADENGINE Unsupported engine {
npm warn EBADENGINE package: 'jackspeak@4.1.1',
npm warn EBADENGINE required: { node: '20 || >=22' },
npm warn EBADENGINE current: { node: 'v18.20.8', npm: '10.8.2' }
npm warn EBADENGINE }
npm warn EBADENGINE Unsupported engine {
npm warn EBADENGINE package: 'json-parse-even-better-errors@5.0.0',
npm warn EBADENGINE required: { node: '^20.17.0 || >=22.9.0' },
npm warn EBADENGINE current: { node: 'v18.20.8', npm: '10.8.2' }
npm warn EBADENGINE }
npm warn EBADENGINE Unsupported engine {
npm warn EBADENGINE package: 'lru-cache@11.2.2',
npm warn EBADENGINE required: { node: '20 || >=22' },
npm warn EBADENGINE current: { node: 'v18.20.8', npm: '10.8.2' }
npm warn EBADENGINE }
npm warn EBADENGINE Unsupported engine {
npm warn EBADENGINE package: 'minimatch@10.1.1',
npm warn EBADENGINE required: { node: '20 || >=22' },
npm warn EBADENGINE current: { node: 'v18.20.8', npm: '10.8.2' }
npm warn EBADENGINE }
npm warn EBADENGINE Unsupported engine {
npm warn EBADENGINE package: 'node-abi@4.24.0',
npm warn EBADENGINE required: { node: '>=22.12.0' },
npm warn EBADENGINE current: { node: 'v18.20.8', npm: '10.8.2' }
npm warn EBADENGINE }
npm warn EBADENGINE Unsupported engine {
npm warn EBADENGINE package: 'npm@11.6.2',
npm warn EBADENGINE required: { node: '^20.17.0 || >=22.9.0' },
npm warn EBADENGINE current: { node: 'v18.20.8', npm: '10.8.2' }
npm warn EBADENGINE }
npm warn EBADENGINE Unsupported engine {
npm warn EBADENGINE package: 'npm-install-checks@8.0.0',
npm warn EBADENGINE required: { node: '^20.17.0 || >=22.9.0' },
npm warn EBADENGINE current: { node: 'v18.20.8', npm: '10.8.2' }
npm warn EBADENGINE }
npm warn EBADENGINE Unsupported engine {
npm warn EBADENGINE package: 'npm-normalize-package-bin@5.0.0',
npm warn EBADENGINE required: { node: '^20.17.0 || >=22.9.0' },
npm warn EBADENGINE current: { node: 'v18.20.8', npm: '10.8.2' }
npm warn EBADENGINE }
npm warn EBADENGINE Unsupported engine {
npm warn EBADENGINE package: 'npm-package-arg@13.0.2',
npm warn EBADENGINE required: { node: '^20.17.0 || >=22.9.0' },
npm warn EBADENGINE current: { node: 'v18.20.8', npm: '10.8.2' }
npm warn EBADENGINE }
npm warn EBADENGINE Unsupported engine {
npm warn EBADENGINE package: 'npm-pick-manifest@11.0.3',
npm warn EBADENGINE required: { node: '^20.17.0 || >=22.9.0' },
npm warn EBADENGINE current: { node: 'v18.20.8', npm: '10.8.2' }
npm warn EBADENGINE }
npm warn EBADENGINE Unsupported engine {
npm warn EBADENGINE package: '@isaacs/balanced-match@4.0.1',
npm warn EBADENGINE required: { node: '20 || >=22' },
npm warn EBADENGINE current: { node: 'v18.20.8', npm: '10.8.2' }
npm warn EBADENGINE }
npm warn EBADENGINE Unsupported engine {
npm warn EBADENGINE package: '@isaacs/brace-expansion@5.0.0',
npm warn EBADENGINE required: { node: '20 || >=22' },
npm warn EBADENGINE current: { node: 'v18.20.8', npm: '10.8.2' }
npm warn EBADENGINE }
npm warn EBADENGINE Unsupported engine {
npm warn EBADENGINE package: '@npmcli/agent@4.0.0',
npm warn EBADENGINE required: { node: '^20.17.0 || >=22.9.0' },
npm warn EBADENGINE current: { node: 'v18.20.8', npm: '10.8.2' }
npm warn EBADENGINE }
npm warn EBADENGINE Unsupported engine {
npm warn EBADENGINE package: '@npmcli/arborist@9.1.6',
npm warn EBADENGINE required: { node: '^20.17.0 || >=22.9.0' },
npm warn EBADENGINE current: { node: 'v18.20.8', npm: '10.8.2' }
npm warn EBADENGINE }
npm warn EBADENGINE Unsupported engine {
npm warn EBADENGINE package: '@npmcli/config@10.4.2',
npm warn EBADENGINE required: { node: '^20.17.0 || >=22.9.0' },
npm warn EBADENGINE current: { node: 'v18.20.8', npm: '10.8.2' }
npm warn EBADENGINE }
npm warn EBADENGINE Unsupported engine {
npm warn EBADENGINE package: '@npmcli/git@7.0.0',
npm warn EBADENGINE required: { node: '^20.17.0 || >=22.9.0' },
npm warn EBADENGINE current: { node: 'v18.20.8', npm: '10.8.2' }
npm warn EBADENGINE }
npm warn EBADENGINE Unsupported engine {
npm warn EBADENGINE package: '@npmcli/map-workspaces@5.0.0',
npm warn EBADENGINE required: { node: '^20.17.0 || >=22.9.0' },
npm warn EBADENGINE current: { node: 'v18.20.8', npm: '10.8.2' }
npm warn EBADENGINE }
npm warn EBADENGINE Unsupported engine {
npm warn EBADENGINE package: '@npmcli/metavuln-calculator@9.0.2',
npm warn EBADENGINE required: { node: '^20.17.0 || >=22.9.0' },
npm warn EBADENGINE current: { node: 'v18.20.8', npm: '10.8.2' }
npm warn EBADENGINE }
npm warn EBADENGINE Unsupported engine {
npm warn EBADENGINE package: '@npmcli/package-json@7.0.1',
npm warn EBADENGINE required: { node: '^20.17.0 || >=22.9.0' },
npm warn EBADENGINE current: { node: 'v18.20.8', npm: '10.8.2' }
npm warn EBADENGINE }
npm warn EBADENGINE Unsupported engine {
npm warn EBADENGINE package: '@npmcli/run-script@10.0.0',
npm warn EBADENGINE required: { node: '^20.17.0 || >=22.9.0' },
npm warn EBADENGINE current: { node: 'v18.20.8', npm: '10.8.2' }
npm warn EBADENGINE }
npm warn EBADENGINE Unsupported engine {
npm warn EBADENGINE package: '@sigstore/bundle@4.0.0',
npm warn EBADENGINE required: { node: '^20.17.0 || >=22.9.0' },
npm warn EBADENGINE current: { node: 'v18.20.8', npm: '10.8.2' }
npm warn EBADENGINE }
npm warn EBADENGINE Unsupported engine {
npm warn EBADENGINE package: '@sigstore/core@3.0.0',
npm warn EBADENGINE required: { node: '^20.17.0 || >=22.9.0' },
npm warn EBADENGINE current: { node: 'v18.20.8', npm: '10.8.2' }
npm warn EBADENGINE }
npm warn EBADENGINE Unsupported engine {
npm warn EBADENGINE package: '@sigstore/sign@4.0.1',
npm warn EBADENGINE required: { node: '^20.17.0 || >=22.9.0' },
npm warn EBADENGINE current: { node: 'v18.20.8', npm: '10.8.2' }
npm warn EBADENGINE }
npm warn EBADENGINE Unsupported engine {
npm warn EBADENGINE package: '@sigstore/tuf@4.0.0',
npm warn EBADENGINE required: { node: '^20.17.0 || >=22.9.0' },
npm warn EBADENGINE current: { node: 'v18.20.8', npm: '10.8.2' }
npm warn EBADENGINE }
npm warn EBADENGINE Unsupported engine {
npm warn EBADENGINE package: '@sigstore/verify@3.0.0',
npm warn EBADENGINE required: { node: '^20.17.0 || >=22.9.0' },
npm warn EBADENGINE current: { node: 'v18.20.8', npm: '10.8.2' }
npm warn EBADENGINE }
npm warn EBADENGINE Unsupported engine {
npm warn EBADENGINE package: '@tufjs/models@4.0.0',
npm warn EBADENGINE required: { node: '^20.17.0 || >=22.9.0' },
npm warn EBADENGINE current: { node: 'v18.20.8', npm: '10.8.2' }
npm warn EBADENGINE }
npm warn EBADENGINE Unsupported engine {
npm warn EBADENGINE package: 'cacache@20.0.1',
npm warn EBADENGINE required: { node: '^20.17.0 || >=22.9.0' },
npm warn EBADENGINE current: { node: 'v18.20.8', npm: '10.8.2' }
npm warn EBADENGINE }
npm warn EBADENGINE Unsupported engine {
npm warn EBADENGINE package: 'cidr-regex@5.0.1',
npm warn EBADENGINE required: { node: '>=20' },
npm warn EBADENGINE current: { node: 'v18.20.8', npm: '10.8.2' }
npm warn EBADENGINE }
npm warn EBADENGINE Unsupported engine {
npm warn EBADENGINE package: 'glob@11.0.3',
npm warn EBADENGINE required: { node: '20 || >=22' },
npm warn EBADENGINE current: { node: 'v18.20.8', npm: '10.8.2' }
npm warn EBADENGINE }
npm warn EBADENGINE Unsupported engine {
npm warn EBADENGINE package: 'hosted-git-info@9.0.2',
npm warn EBADENGINE required: { node: '^20.17.0 || >=22.9.0' },
npm warn EBADENGINE current: { node: 'v18.20.8', npm: '10.8.2' }
npm warn EBADENGINE }
npm warn EBADENGINE Unsupported engine {
npm warn EBADENGINE package: 'ignore-walk@8.0.0',
npm warn EBADENGINE required: { node: '^20.17.0 || >=22.9.0' },
npm warn EBADENGINE current: { node: 'v18.20.8', npm: '10.8.2' }
npm warn EBADENGINE }
npm warn EBADENGINE Unsupported engine {
npm warn EBADENGINE package: 'init-package-json@8.2.2',
npm warn EBADENGINE required: { node: '^20.17.0 || >=22.9.0' },
npm warn EBADENGINE current: { node: 'v18.20.8', npm: '10.8.2' }
npm warn EBADENGINE }
npm warn EBADENGINE Unsupported engine {
npm warn EBADENGINE package: 'is-cidr@6.0.1',
npm warn EBADENGINE required: { node: '>=20' },
npm warn EBADENGINE current: { node: 'v18.20.8', npm: '10.8.2' }
npm warn EBADENGINE }
npm warn EBADENGINE Unsupported engine {
npm warn EBADENGINE package: 'jackspeak@4.1.1',
npm warn EBADENGINE required: { node: '20 || >=22' },
npm warn EBADENGINE current: { node: 'v18.20.8', npm: '10.8.2' }
npm warn EBADENGINE }
npm warn EBADENGINE Unsupported engine {
npm warn EBADENGINE package: 'libnpmaccess@10.0.3',
npm warn EBADENGINE required: { node: '^20.17.0 || >=22.9.0' },
npm warn EBADENGINE current: { node: 'v18.20.8', npm: '10.8.2' }
npm warn EBADENGINE }
npm warn EBADENGINE Unsupported engine {
npm warn EBADENGINE package: 'libnpmdiff@8.0.9',
npm warn EBADENGINE required: { node: '^20.17.0 || >=22.9.0' },
npm warn EBADENGINE current: { node: 'v18.20.8', npm: '10.8.2' }
npm warn EBADENGINE }
npm warn EBADENGINE Unsupported engine {
npm warn EBADENGINE package: 'libnpmexec@10.1.8',
npm warn EBADENGINE required: { node: '^20.17.0 || >=22.9.0' },
npm warn EBADENGINE current: { node: 'v18.20.8', npm: '10.8.2' }
npm warn EBADENGINE }
npm warn EBADENGINE Unsupported engine {
npm warn EBADENGINE package: 'libnpmfund@7.0.9',
npm warn EBADENGINE required: { node: '^20.17.0 || >=22.9.0' },
npm warn EBADENGINE current: { node: 'v18.20.8', npm: '10.8.2' }
npm warn EBADENGINE }
npm warn EBADENGINE Unsupported engine {
npm warn EBADENGINE package: 'libnpmorg@8.0.1',
npm warn EBADENGINE required: { node: '^20.17.0 || >=22.9.0' },
npm warn EBADENGINE current: { node: 'v18.20.8', npm: '10.8.2' }
npm warn EBADENGINE }
npm warn EBADENGINE Unsupported engine {
npm warn EBADENGINE package: 'libnpmpack@9.0.9',
npm warn EBADENGINE required: { node: '^20.17.0 || >=22.9.0' },
npm warn EBADENGINE current: { node: 'v18.20.8', npm: '10.8.2' }
npm warn EBADENGINE }
npm warn EBADENGINE Unsupported engine {
npm warn EBADENGINE package: 'libnpmpublish@11.1.2',
npm warn EBADENGINE required: { node: '^20.17.0 || >=22.9.0' },
npm warn EBADENGINE current: { node: 'v18.20.8', npm: '10.8.2' }
npm warn EBADENGINE }
npm warn EBADENGINE Unsupported engine {
npm warn EBADENGINE package: 'libnpmsearch@9.0.1',
npm warn EBADENGINE required: { node: '^20.17.0 || >=22.9.0' },
npm warn EBADENGINE current: { node: 'v18.20.8', npm: '10.8.2' }
npm warn EBADENGINE }
npm warn EBADENGINE Unsupported engine {
npm warn EBADENGINE package: 'libnpmteam@8.0.2',
npm warn EBADENGINE required: { node: '^20.17.0 || >=22.9.0' },
npm warn EBADENGINE current: { node: 'v18.20.8', npm: '10.8.2' }
npm warn EBADENGINE }
npm warn EBADENGINE Unsupported engine {
npm warn EBADENGINE package: 'libnpmversion@8.0.2',
npm warn EBADENGINE required: { node: '^20.17.0 || >=22.9.0' },
npm warn EBADENGINE current: { node: 'v18.20.8', npm: '10.8.2' }
npm warn EBADENGINE }
npm warn EBADENGINE Unsupported engine {
npm warn EBADENGINE package: 'lru-cache@11.2.2',
npm warn EBADENGINE required: { node: '20 || >=22' },
npm warn EBADENGINE current: { node: 'v18.20.8', npm: '10.8.2' }
npm warn EBADENGINE }
npm warn EBADENGINE Unsupported engine {
npm warn EBADENGINE package: 'make-fetch-happen@15.0.2',
npm warn EBADENGINE required: { node: '^20.17.0 || >=22.9.0' },
npm warn EBADENGINE current: { node: 'v18.20.8', npm: '10.8.2' }
npm warn EBADENGINE }
npm warn EBADENGINE Unsupported engine {
npm warn EBADENGINE package: 'minimatch@10.0.3',
npm warn EBADENGINE required: { node: '20 || >=22' },
npm warn EBADENGINE current: { node: 'v18.20.8', npm: '10.8.2' }
npm warn EBADENGINE }
npm warn EBADENGINE Unsupported engine {
npm warn EBADENGINE package: 'npm-package-arg@13.0.1',
npm warn EBADENGINE required: { node: '^20.17.0 || >=22.9.0' },
npm warn EBADENGINE current: { node: 'v18.20.8', npm: '10.8.2' }
npm warn EBADENGINE }
npm warn EBADENGINE Unsupported engine {
npm warn EBADENGINE package: 'npm-packlist@10.0.2',
npm warn EBADENGINE required: { node: '^20.17.0 || >=22.9.0' },
npm warn EBADENGINE current: { node: 'v18.20.8', npm: '10.8.2' }
npm warn EBADENGINE }
npm warn EBADENGINE Unsupported engine {
npm warn EBADENGINE package: 'npm-pick-manifest@11.0.1',
npm warn EBADENGINE required: { node: '^20.17.0 || >=22.9.0' },
npm warn EBADENGINE current: { node: 'v18.20.8', npm: '10.8.2' }
npm warn EBADENGINE }
npm warn EBADENGINE Unsupported engine {
npm warn EBADENGINE package: 'npm-profile@12.0.0',
npm warn EBADENGINE required: { node: '^20.17.0 || >=22.9.0' },
npm warn EBADENGINE current: { node: 'v18.20.8', npm: '10.8.2' }
npm warn EBADENGINE }
npm warn EBADENGINE Unsupported engine {
npm warn EBADENGINE package: 'npm-registry-fetch@19.0.0',
npm warn EBADENGINE required: { node: '^20.17.0 || >=22.9.0' },
npm warn EBADENGINE current: { node: 'v18.20.8', npm: '10.8.2' }
npm warn EBADENGINE }
npm warn EBADENGINE Unsupported engine {
npm warn EBADENGINE package: 'pacote@21.0.3',
npm warn EBADENGINE required: { node: '^20.17.0 || >=22.9.0' },
npm warn EBADENGINE current: { node: 'v18.20.8', npm: '10.8.2' }
npm warn EBADENGINE }
npm warn EBADENGINE Unsupported engine {
npm warn EBADENGINE package: 'path-scurry@2.0.0',
npm warn EBADENGINE required: { node: '20 || >=22' },
npm warn EBADENGINE current: { node: 'v18.20.8', npm: '10.8.2' }
npm warn EBADENGINE }
npm warn EBADENGINE Unsupported engine {
npm warn EBADENGINE package: 'sigstore@4.0.0',
npm warn EBADENGINE required: { node: '^20.17.0 || >=22.9.0' },
npm warn EBADENGINE current: { node: 'v18.20.8', npm: '10.8.2' }
npm warn EBADENGINE }
npm warn EBADENGINE Unsupported engine {
npm warn EBADENGINE package: 'tuf-js@4.0.0',
npm warn EBADENGINE required: { node: '^20.17.0 || >=22.9.0' },
npm warn EBADENGINE current: { node: 'v18.20.8', npm: '10.8.2' }
npm warn EBADENGINE }
npm warn EBADENGINE Unsupported engine {
npm warn EBADENGINE package: 'walk-up-path@4.0.0',
npm warn EBADENGINE required: { node: '20 || >=22' },
npm warn EBADENGINE current: { node: 'v18.20.8', npm: '10.8.2' }
npm warn EBADENGINE }
npm warn EBADENGINE Unsupported engine {
npm warn EBADENGINE package: 'path-scurry@2.0.1',
npm warn EBADENGINE required: { node: '20 || >=22' },
npm warn EBADENGINE current: { node: 'v18.20.8', npm: '10.8.2' }
npm warn EBADENGINE }
npm warn EBADENGINE Unsupported engine {
npm warn EBADENGINE package: 'proc-log@6.0.0',
npm warn EBADENGINE required: { node: '^20.17.0 || >=22.9.0' },
npm warn EBADENGINE current: { node: 'v18.20.8', npm: '10.8.2' }
npm warn EBADENGINE }
npm warn EBADENGINE Unsupported engine {
npm warn EBADENGINE package: 'react-router@7.9.6',
npm warn EBADENGINE required: { node: '>=20.0.0' },
npm warn EBADENGINE current: { node: 'v18.20.8', npm: '10.8.2' }
npm warn EBADENGINE }
npm warn EBADENGINE Unsupported engine {
npm warn EBADENGINE package: 'react-router-dom@7.9.6',
npm warn EBADENGINE required: { node: '>=20.0.0' },
npm warn EBADENGINE current: { node: 'v18.20.8', npm: '10.8.2' }
npm warn EBADENGINE }
npm warn EBADENGINE Unsupported engine {
npm warn EBADENGINE package: 'semantic-release@25.0.2',
npm warn EBADENGINE required: { node: '^22.14.0 || >= 24.10.0' },
npm warn EBADENGINE current: { node: 'v18.20.8', npm: '10.8.2' }
npm warn EBADENGINE }
npm warn EBADENGINE Unsupported engine {
npm warn EBADENGINE package: 'cliui@9.0.1',
npm warn EBADENGINE required: { node: '>=20' },
npm warn EBADENGINE current: { node: 'v18.20.8', npm: '10.8.2' }
npm warn EBADENGINE }
npm warn EBADENGINE Unsupported engine {
npm warn EBADENGINE package: 'normalize-package-data@8.0.0',
npm warn EBADENGINE required: { node: '^20.17.0 || >=22.9.0' },
npm warn EBADENGINE current: { node: 'v18.20.8', npm: '10.8.2' }
npm warn EBADENGINE }
npm warn EBADENGINE Unsupported engine {
npm warn EBADENGINE package: 'read-package-up@12.0.0',
npm warn EBADENGINE required: { node: '>=20' },
npm warn EBADENGINE current: { node: 'v18.20.8', npm: '10.8.2' }
npm warn EBADENGINE }
npm warn EBADENGINE Unsupported engine {
npm warn EBADENGINE package: 'read-pkg@10.0.0',
npm warn EBADENGINE required: { node: '>=20' },
npm warn EBADENGINE current: { node: 'v18.20.8', npm: '10.8.2' }
npm warn EBADENGINE }
npm warn EBADENGINE Unsupported engine {
npm warn EBADENGINE package: 'type-fest@5.2.0',
npm warn EBADENGINE required: { node: '>=20' },
npm warn EBADENGINE current: { node: 'v18.20.8', npm: '10.8.2' }
npm warn EBADENGINE }
npm warn EBADENGINE Unsupported engine {
npm warn EBADENGINE package: 'yargs@18.0.0',
npm warn EBADENGINE required: { node: '^20.19.0 || ^22.12.0 || >=23' },
npm warn EBADENGINE current: { node: 'v18.20.8', npm: '10.8.2' }
npm warn EBADENGINE }
npm warn EBADENGINE Unsupported engine {
npm warn EBADENGINE package: 'yargs-parser@22.0.0',
npm warn EBADENGINE required: { node: '^20.19.0 || ^22.12.0 || >=23' },
npm warn EBADENGINE current: { node: 'v18.20.8', npm: '10.8.2' }
npm warn EBADENGINE }
npm warn EBADENGINE Unsupported engine {
npm warn EBADENGINE package: 'serialport@13.0.0',
npm warn EBADENGINE required: { node: '>=20.0.0' },
npm warn EBADENGINE current: { node: 'v18.20.8', npm: '10.8.2' }
npm warn EBADENGINE }
npm warn EBADENGINE Unsupported engine {
npm warn EBADENGINE package: '@serialport/parser-delimiter@13.0.0',
npm warn EBADENGINE required: { node: '>=20.0.0' },
npm warn EBADENGINE current: { node: 'v18.20.8', npm: '10.8.2' }
npm warn EBADENGINE }
npm warn EBADENGINE Unsupported engine {
npm warn EBADENGINE package: '@serialport/parser-readline@13.0.0',
npm warn EBADENGINE required: { node: '>=20.0.0' },
npm warn EBADENGINE current: { node: 'v18.20.8', npm: '10.8.2' }
npm warn EBADENGINE }
npm warn EBADENGINE Unsupported engine {
npm warn EBADENGINE package: 'tagged-tag@1.0.0',
npm warn EBADENGINE required: { node: '>=20' },
npm warn EBADENGINE current: { node: 'v18.20.8', npm: '10.8.2' }
npm warn EBADENGINE }
npm warn EBADENGINE Unsupported engine {
npm warn EBADENGINE package: 'undici@7.16.0',
npm warn EBADENGINE required: { node: '>=20.18.1' },
npm warn EBADENGINE current: { node: 'v18.20.8', npm: '10.8.2' }
npm warn EBADENGINE }
npm warn EBADENGINE Unsupported engine {
npm warn EBADENGINE package: 'validate-npm-package-name@7.0.0',
npm warn EBADENGINE required: { node: '^20.17.0 || >=22.9.0' },
npm warn EBADENGINE current: { node: 'v18.20.8', npm: '10.8.2' }
npm warn EBADENGINE }
npm warn EBADENGINE Unsupported engine {
npm warn EBADENGINE package: 'vite@7.1.6',
npm warn EBADENGINE required: { node: '^20.19.0 || >=22.12.0' },
npm warn EBADENGINE current: { node: 'v18.20.8', npm: '10.8.2' }
npm warn EBADENGINE }
npm warn EBADENGINE Unsupported engine {
npm warn EBADENGINE package: 'which@6.0.0',
npm warn EBADENGINE required: { node: '^20.17.0 || >=22.9.0' },
npm warn EBADENGINE current: { node: 'v18.20.8', npm: '10.8.2' }
npm warn EBADENGINE }
npm warn skipping integrity check for git dependency ssh://git@github.com/electron/node-gyp.git
npm warn deprecated semver-diff@5.0.0: Deprecated as the semver package now supports this built-in.
npm warn deprecated rimraf@2.6.3: Rimraf versions prior to v4 are no longer supported
npm warn deprecated lodash.isequal@4.5.0: This package is deprecated. Use require('node:util').isDeepStrictEqual instead.
npm warn deprecated inflight@1.0.6: This module is not supported, and leaks memory. Do not use it. Check out lru-cache if you want a good and tested way to coalesce async requests by a key value, which is much more comprehensive and powerful.
npm warn deprecated @npmcli/move-file@2.0.1: This functionality has been moved to @npmcli/fs
npm warn deprecated @esbuild-kit/esm-loader@2.6.5: Merged into tsx: https://tsx.is
npm warn deprecated @esbuild-kit/core-utils@3.3.2: Merged into tsx: https://tsx.is
npm warn deprecated rimraf@3.0.2: Rimraf versions prior to v4 are no longer supported
npm warn deprecated rimraf@3.0.2: Rimraf versions prior to v4 are no longer supported
npm warn deprecated glob@7.2.3: Glob versions prior to v9 are no longer supported
npm warn deprecated glob@8.1.0: Glob versions prior to v9 are no longer supported
npm warn deprecated glob@7.2.3: Glob versions prior to v9 are no longer supported
npm warn deprecated glob@7.2.3: Glob versions prior to v9 are no longer supported
npm warn deprecated glob@7.2.3: Glob versions prior to v9 are no longer supported
npm warn deprecated boolean@3.2.0: Package no longer supported. Contact Support at https://www.npmjs.com/support for more info.
npm warn cleanup Failed to remove some directories [
npm warn cleanup [
npm warn cleanup 'D:\\a\\AuraSwift\\AuraSwift\\node_modules\\better-sqlite3',
npm warn cleanup [Error: EBUSY: resource busy or locked, rmdir 'D:\a\AuraSwift\AuraSwift\node_modules\better-sqlite3'] {
npm warn cleanup errno: -4082,
npm warn cleanup code: 'EBUSY',
npm warn cleanup syscall: 'rmdir',
npm warn cleanup path: 'D:\\a\\AuraSwift\\AuraSwift\\node_modules\\better-sqlite3'
npm warn cleanup }
npm warn cleanup ],
npm warn cleanup [
npm warn cleanup 'D:\\a\\AuraSwift\\AuraSwift\\node_modules\\usb',
npm warn cleanup [Error: EBUSY: resource busy or locked, rmdir 'D:\a\AuraSwift\AuraSwift\node_modules\usb'] {
npm warn cleanup errno: -4082,
npm warn cleanup code: 'EBUSY',
npm warn cleanup syscall: 'rmdir',
npm warn cleanup path: 'D:\\a\\AuraSwift\\AuraSwift\\node_modules\\usb'
npm warn cleanup }
npm warn cleanup ],
npm warn cleanup [
npm warn cleanup 'D:\\a\\AuraSwift\\AuraSwift\\node_modules',
npm warn cleanup [Error: EBUSY: resource busy or locked, rmdir 'D:\a\AuraSwift\AuraSwift\node_modules\better-sqlite3'] {
npm warn cleanup errno: -4082,
npm warn cleanup code: 'EBUSY',
npm warn cleanup syscall: 'rmdir',
npm warn cleanup path: 'D:\\a\\AuraSwift\\AuraSwift\\node_modules\\better-sqlite3'
npm warn cleanup }
npm warn cleanup ],
npm warn cleanup [
npm warn cleanup 'D:\\a\\AuraSwift\\AuraSwift\\node_modules\\@playwright',
npm warn cleanup [Error: EPERM: operation not permitted, rmdir 'D:\a\AuraSwift\AuraSwift\node_modules\@playwright\test\node_modules\playwright-core\lib\vite\traceViewer'] {
npm warn cleanup errno: -4048,
npm warn cleanup code: 'EPERM',
npm warn cleanup syscall: 'rmdir',
npm warn cleanup path: 'D:\\a\\AuraSwift\\AuraSwift\\node_modules\\@playwright\\test\\node_modules\\playwright-core\\lib\\vite\\traceViewer'
npm warn cleanup }
npm warn cleanup ]
npm warn cleanup ]
npm error code 1
npm error path D:\a\AuraSwift\AuraSwift\packages\main\node_modules\@serialport\bindings-cpp
npm error command failed
npm error command C:\Windows\system32\cmd.exe /d /s /c node-gyp-build
npm error node:internal/child_process:414
npm error throw errnoException(err, 'spawn');
npm error ^
npm error
npm error Error: spawn EINVAL
npm error at ChildProcess.spawn (node:internal/child_process:414:11)
npm error at Object.spawn (node:child_process:761:9)
npm error at build (D:\a\AuraSwift\AuraSwift\packages\main\node_modules\node-gyp-build\bin.js:29:8)
npm error at preinstall (D:\a\AuraSwift\AuraSwift\packages\main\node_modules\node-gyp-build\bin.js:38:32)
npm error at Object.<anonymous> (D:\a\AuraSwift\AuraSwift\packages\main\node_modules\node-gyp-build\bin.js:15:3)
npm error at Module.\_compile (node:internal/modules/cjs/loader:1364:14)
npm error at Module.\_extensions..js (node:internal/modules/cjs/loader:1422:10)
npm error at Module.load (node:internal/modules/cjs/loader:1203:32)
npm error at Module.\_load (node:internal/modules/cjs/loader:1019:12)
npm error at Function.executeUserEntryPoint [as runMain] (node:internal/modules/run_main:128:12) {
npm error errno: -4071,
npm error code: 'EINVAL',
npm error syscall: 'spawn'
npm error }
npm error
npm error Node.js v18.20.8
npm error A complete log of this run can be found in: C:\npm\cache_logs\2025-11-19T22_24_59_608Z-debug-0.log
Error: Process completed with exit code 1.
