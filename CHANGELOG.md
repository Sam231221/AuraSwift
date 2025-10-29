# Changelog

All notable changes to this project will be documented in this file. See [Conventional Commits](https://conventionalcommits.org) for commit guidelines.

# [1.4.0](https://github.com/Sam231221/AuraSwift/compare/v1.3.0...v1.4.0) (2025-10-29)


### Features

* **updater:** ✨ explicitly set update channel to 'latest' and improve error handling in update checks ([8cdcdb3](https://github.com/Sam231221/AuraSwift/commit/8cdcdb3ac7b0d7df94348483a2f13a7287619dd8))

# [1.3.0](https://github.com/Sam231221/AuraSwift/compare/v1.2.4...v1.3.0) (2025-10-26)


### Features

* **window:** ✨ increase default window dimensions for improved layout ([8925b94](https://github.com/Sam231221/AuraSwift/commit/8925b94c824ff5af77e51f1a6174ccef640e9efd))

## [1.2.4](https://github.com/Sam231221/AuraSwift/compare/v1.2.3...v1.2.4) (2025-10-26)


### Bug Fixes

*  🐛  remove explicit channel setting in AutoUpdater to prevent manifest file lookup issues ([12f5c7e](https://github.com/Sam231221/AuraSwift/commit/12f5c7e198d3331548f6c51f46d215bf9d74f515))

## [1.2.3](https://github.com/Sam231221/AuraSwift/compare/v1.2.2...v1.2.3) (2025-10-26)


### Bug Fixes

*  🐛  force electron-builder to use 'latest' as channel name for YAML files ([82995a8](https://github.com/Sam231221/AuraSwift/commit/82995a8c7a005b465a3af86a8e9a77466159a205))

## [1.2.2](https://github.com/Sam231221/AuraSwift/compare/v1.2.1...v1.2.2) (2025-10-26)


### Bug Fixes

* **app:**  🐛  ensure correct update channel is set for electron-updater ([c9cdd77](https://github.com/Sam231221/AuraSwift/commit/c9cdd77614e1d1c1b88d6b7b57700322f9c68632))
* 🐛 prevent Portable build from overwriting NSIS installer (filename collision) ([7b0fc1f](https://github.com/Sam231221/AuraSwift/commit/7b0fc1ffea11503f18c86d7b585f4442b14579c8))

## [1.2.1](https://github.com/Sam231221/AuraSwift/compare/v1.2.0...v1.2.1) (2025-10-25)


### Bug Fixes

* 🐛 resolve auto-updater httpExecutor error and NSIS installer configuration ([aca6339](https://github.com/Sam231221/AuraSwift/commit/aca6339ed88506f6793e60fba519944be9bb74c7))

# [1.2.0](https://github.com/Sam231221/AuraSwift/compare/v1.1.0...v1.2.0) (2025-10-25)


### Features

* **auto-updater:**  ✨ enhance update check handling and error notifications ([72dfd01](https://github.com/Sam231221/AuraSwift/commit/72dfd018cf2b1624540f7bb02af4a5bad148358f))
* ✨ add new icon files and integrate png2icons for icon conversion ([d114efc](https://github.com/Sam231221/AuraSwift/commit/d114efc2dcdba7a3bf8acd1caa33f7d61fcaf6b2))
* ✨ update installer and uninstaller icons to use ICO format ([5efeddb](https://github.com/Sam231221/AuraSwift/commit/5efeddbaca1a6f7992addb7a379d3c0238e84ac9))

# [1.1.0](https://github.com/Sam231221/AuraSwift/compare/v1.0.0...v1.1.0) (2025-10-24)


### Features

* **auto-update:**  ✨ implement complete auto-update functionality with user dialogs, notifications, and error handling ([c99f247](https://github.com/Sam231221/AuraSwift/commit/c99f2474bc9d29f327be066098dbe4a3a9a51f04))

# 1.0.0 (2025-10-23)


### Bug Fixes

* **tests:** correct btoa function exposure and improve Electron test visibility in CI ([f0babfd](https://github.com/Sam231221/AuraSwift/commit/f0babfd1e21de28fd533979bbe1491e8122c1f3f))
* disable AutoUpdater during tests to prevent GitHub Actions failures ([1441612](https://github.com/Sam231221/AuraSwift/commit/1441612692bc98f8d2d92b58163570e95c9896a7))
* **workflows:** ensure .npmrc configuration for native modules and streamline environment variables ([a25fd02](https://github.com/Sam231221/AuraSwift/commit/a25fd026ba8919589589456aa3c2a19a0e19e4d1))
* **workflows:** ensure node_modules are removed before installing project dependencies ([7d18f87](https://github.com/Sam231221/AuraSwift/commit/7d18f878016eac5728262845e69183eec5233f1e))
* **workflows:** improve error message formatting for module rebuild failures ([e55367a](https://github.com/Sam231221/AuraSwift/commit/e55367a211e6775266cb3f025749a3b2dc8d561c))
* **workflows:** improve error message formatting for npm rebuild failures ([43fa339](https://github.com/Sam231221/AuraSwift/commit/43fa339026be291e69ec2f004044bd6eb9bd5a1b))
* **ci:** prevent native module builds in semantic-release jobs ([d1baa40](https://github.com/Sam231221/AuraSwift/commit/d1baa406de65521509bf41dc83451c8fa53b49f1))
* **workflows:** remove native module verification and clean install steps from compile process ([5b14ed5](https://github.com/Sam231221/AuraSwift/commit/5b14ed5613dcc105da1e774fa90de5ad2b9d7b9a))
* **ci:** resolve multiple workflow issues ([ee70a7a](https://github.com/Sam231221/AuraSwift/commit/ee70a7a863805bd30fdd40d1abfee178ba75743c))
* **workflows:** standardize environment variable naming and streamline native module rebuild process ([74705bc](https://github.com/Sam231221/AuraSwift/commit/74705bc9444d227f0f00431811907e314ea08d79))
* **workflows:** streamline native module rebuild process and add verification step ([87a30ba](https://github.com/Sam231221/AuraSwift/commit/87a30ba0f87976b42c9ef763f125759f4853c47b))
* **action:** update node version to 20.x in setup for Electron template ([bc63cf5](https://github.com/Sam231221/AuraSwift/commit/bc63cf54ff471d9b1a40cec3ccaea04086b24cfb))
* **workflows:** update node_modules removal command to use PowerShell syntax ([49cd79c](https://github.com/Sam231221/AuraSwift/commit/49cd79c4ca78f4ac043d76cec57e7a4a32b55214))


### Code Refactoring

* **ci:** integrate semantic-release into unified workflow ([13c13a3](https://github.com/Sam231221/AuraSwift/commit/13c13a3699d23a9087edb4f1c7f149e6b30b226d))


### Features

* :fire: Added weight based products implementation. ([8ddf299](https://github.com/Sam231221/AuraSwift/commit/8ddf2996fc2fb29b8cdd8e063dec2d22a992b5e8))
* **app:** :fire: Fixed DraweR Component,Product Management Functionality ([df0c0cf](https://github.com/Sam231221/AuraSwift/commit/df0c0cf11a57b9f0464ae833b3a0d2b5c487b579))
* **app:** :fire: Project initiated with Some PreFunctionalities ([a0043e5](https://github.com/Sam231221/AuraSwift/commit/a0043e557e45bdaa7b46d7f9d28ef71600f3a611))
* :fire: Refund transaction functionality, business logic readmes. ([1d8a772](https://github.com/Sam231221/AuraSwift/commit/1d8a77272a16f343338aa5e8a3a0e8c4fa057931))
* :sparkles: Introduced shift functionality with date and calendar components ([582a0c5](https://github.com/Sam231221/AuraSwift/commit/582a0c541a8a83babaf06270ec7627f50c356ff7))
* :sparkles: Refund transaction functionality completion ([f3c4bee](https://github.com/Sam231221/AuraSwift/commit/f3c4beedc61e8e1f18f762bc645394c6a21e7eca))
* **workflows:** ✨ enhance compile job with additional system dependencies and rebuild step for Electron ([d1dd15d](https://github.com/Sam231221/AuraSwift/commit/d1dd15d44e739c811eee5d8aea113db0ccbe8880))
* **workflows:** ✨ enhance module rebuilding process to support scoped packages ([47f2ce9](https://github.com/Sam231221/AuraSwift/commit/47f2ce92835343ca1cdf3a9476f4ef805520da0b))
* **workflows:** ✨Update action.yml and compile-and-test.yml for improved setup and typechecking ([d5c5726](https://github.com/Sam231221/AuraSwift/commit/d5c5726fea98a33427d7f452119adccb38e56438))
* **dashboard-layout:** 🔥 remove unused title prop and adjust layout styles ([f76ab99](https://github.com/Sam231221/AuraSwift/commit/f76ab99d7422536049f30d3baa06f4b5bb5c16e7))
* **cashier:** enhance late shift notifications with detailed time formatting ([e301469](https://github.com/Sam231221/AuraSwift/commit/e3014699e73195df5efc922b0d59a2952cb4403c))
* **test:** trigger release with correct permissions V2 ([70e1a18](https://github.com/Sam231221/AuraSwift/commit/70e1a181bae5ff21f2467e943a3178ef28d4a10e))
* **test:** trigger release with correct permissions v4 ([6959dc9](https://github.com/Sam231221/AuraSwift/commit/6959dc9402bb35f7037771d1d4887f2f51f7230e))
* **test:** trigger release with correct permissions ([8db5026](https://github.com/Sam231221/AuraSwift/commit/8db5026e79a889ef01093ab53e7326612ae5de7e))


### BREAKING CHANGES

* **ci:** workflow structure changed, old release.yml disabled

# Changelog

All notable changes to AuraSwift POS System will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added

- Features currently in development

## [3.1.0] - 2025-10-17

### Added

- ✨ Thermal printer integration with ESC/POS support for USB and Bluetooth printers
- ✨ Staff shift scheduling system with shift duration validation
- ✨ Cash drawer management and reconciliation
- ✨ Product category management with auto-reload functionality
- ✨ Real-time receipt printing for cash and card transactions
- ✨ Automatic printer reconnection on app startup
- ✨ Stripe Terminal integration for card payments

### Fixed

- 🐛 Fixed schedule drawer button visibility issue on Windows platform
- 🐛 Resolved category dropdown not updating after creating new categories
- 🐛 Fixed E2E test failures due to authentication state persistence
- 🐛 Corrected DevTools remaining open during test runs
- 🐛 Fixed printer service import using mock instead of real implementation
- 🐛 Resolved drawer footer structure causing layout issues

### Changed

- ⚡ Disabled auto-updater in test environment for reliable CI/CD
- ⚡ Improved printer connection handling with status checks
- ⚡ Enhanced error handling for receipt printing failures
- ⚡ Added test cleanup for isolated test execution
- 🎨 Improved schedule drawer layout with scrollable content area

### Technical

- Upgraded to Electron 38.1.2
- Updated React to 19.1.1
- Added comprehensive hardware support documentation
- Implemented proper flexbox layout for drawer components
- Added environment-based configuration for auto-updater

## [3.0.0] - 2025-10-01

### Added

- 🎉 Initial release of AuraSwift POS System
- Complete point-of-sale functionality
- User authentication and authorization
- Product management with categories
- Transaction processing (cash and card)
- Receipt printing capability
- Cash drawer integration
- Shift management
- Sales reporting
- Inventory tracking
- Hardware integration (printers, scanners, card readers)

### Technical

- Built with Electron, React 18, TypeScript
- SQLite database for local data storage
- Vite for fast development and building
- Tailwind CSS for styling
- Playwright for E2E testing

[Unreleased]: https://github.com/Sam231221/AuraSwift/compare/v3.1.0...HEAD
[3.1.0]: https://github.com/Sam231221/AuraSwift/compare/v3.0.0...v3.1.0
[3.0.0]: https://github.com/Sam231221/AuraSwift/releases/tag/v3.0.0
