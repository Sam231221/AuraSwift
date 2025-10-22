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
