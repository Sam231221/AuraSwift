# Changelog

All notable changes to this project will be documented in this file. See [Conventional Commits](https://conventionalcommits.org) for commit guidelines.

# [1.5.0](https://github.com/Sam231221/AuraSwift/compare/v1.4.0...v1.5.0) (2025-11-10)


### Bug Fixes

* **stock-management:** enhance stock adjustment functionality with input fields for quantity and reason ([a16b541](https://github.com/Sam231221/AuraSwift/commit/a16b541491be62653facbcfc92a1adf95521e39f))
* **database:** implement database migration system for adding address and discount fields ([7577f5b](https://github.com/Sam231221/AuraSwift/commit/7577f5bd7807c0d58bc57107b1b2a8cc9870103f))
* **database:** integrate Drizzle ORM into database initialization and manager instances ([aa2cd29](https://github.com/Sam231221/AuraSwift/commit/aa2cd29ecfd0213ce99596a5afa1f6da6f908182))


### Features

* **database:** ✨ add IPC handlers for database backup, emptying, and import functionality ([1dad607](https://github.com/Sam231221/AuraSwift/commit/1dad607b350c0ba435bb05686c028e70c078046b))
* **database-migrations:** ✨ implement database migration system with version tracking and integrity checks ([0cab8ef](https://github.com/Sam231221/AuraSwift/commit/0cab8ef13843b738c03d6f21114b84ecea75a41d))
* **gitignore:** enhance documentation directory patterns for better matching ([be4bf4a](https://github.com/Sam231221/AuraSwift/commit/be4bf4a1ce6ecc1a0e318132ae40365a0c4c06ec))
* **database:** implement core data management with core refactors ([c2a09bf](https://github.com/Sam231221/AuraSwift/commit/c2a09bfcf5de2657918b61e2ea523ca6c761b619))
* **database-versioning:** implement database versioning and migration system with backup and integrity checks ([62fdc5d](https://github.com/Sam231221/AuraSwift/commit/62fdc5dc4eb3647039a1b4ff0675e0f27e495e20))
* **discounts:** implement discount management system with creation, updating, and retrieval functionalities ([f5ebf5b](https://github.com/Sam231221/AuraSwift/commit/f5ebf5b2664e6b48ed3fc2e9b18ac6c32ac464d2))
* Integrate Drizzle ORM into UserManager and create schema definition ([55b06d7](https://github.com/Sam231221/AuraSwift/commit/55b06d7afeaba80cef3702643937df28375684fc))

# [1.4.0](https://github.com/Sam231221/AuraSwift/compare/v1.3.0...v1.4.0) (2025-11-05)


### Features

* **auto-updater:** ✨ add error handling and notification for update failures ([dc90e29](https://github.com/Sam231221/AuraSwift/commit/dc90e29e4e7fa56dc88e874818fbf6b98a3a74d6))

# [1.3.0](https://github.com/Sam231221/AuraSwift/compare/v1.2.0...v1.3.0) (2025-11-05)


### Bug Fixes

* **new-transaction-view:** 💡 format cash amount input to two decimal places ([3bdbdd0](https://github.com/Sam231221/AuraSwift/commit/3bdbdd07644ed2d00ce9a7ea6a64d4a80f035c95))
* **pdf-receipt-generator:** 💡 suppress unused variable warnings in savePDFToFile function ([22ccf67](https://github.com/Sam231221/AuraSwift/commit/22ccf670ac46fb1684a4f469baaa2d6d1b7670a2))


### Features

*  ✨ implement office printer management hooks and types ([73fcf17](https://github.com/Sam231221/AuraSwift/commit/73fcf170bf7cfcd0fc1aad1e4f8eccb1cf7b4784))
* **manage-categories:** ✨ enhance category management with hierarchical display, reordering, and expand/collapse functionality ([1e50ec1](https://github.com/Sam231221/AuraSwift/commit/1e50ec1363b06dcd124dfec0632f3013cc8269aa))
* **product-management:** ✨ enhance product validation and error handling, add multiSelect support for modifiers ([d48c037](https://github.com/Sam231221/AuraSwift/commit/d48c037a609731053cf35847327aaba345af18f9))
* **new-transaction-view:** ✨ implement category management with breadcrumb navigation and load categories from backend ([ea433f5](https://github.com/Sam231221/AuraSwift/commit/ea433f59c15f6a3a586cb4b9052724dc27ab5d12))
* **pdf-receipt-generator:** ✨ implement PDF receipt generation with customizable layout and data structure ([febd84c](https://github.com/Sam231221/AuraSwift/commit/febd84cc945e152a82e63456a216495985676135))
* **pdf-receipt-generator:** ✨ implement PDF receipt generation with options for printing, downloading, and emailing ([c2cdb75](https://github.com/Sam231221/AuraSwift/commit/c2cdb7518aac9daebe8a85b901e0695f62a54965))
* **new-transaction-view:** ✨ improve layout and styling for buttons and input fields ([11c3bbe](https://github.com/Sam231221/AuraSwift/commit/11c3bbe9dd647165275fbbe261390fac97d0ec9f))

# [1.2.0](https://github.com/Sam231221/AuraSwift/compare/v1.1.0...v1.2.0) (2025-11-03)


### Bug Fixes

* **cashier-management:** ✨ improve form validation and error handling for cashier creation ([5699222](https://github.com/Sam231221/AuraSwift/commit/569922236b7af21b1a73690321bd8161050879f5))
* **window-manager:** 🐛 enable DevTools based on configuration and prevent opening via keyboard shortcuts when disabled ([779c6bc](https://github.com/Sam231221/AuraSwift/commit/779c6bc081a3bf96ec2bfbfe2a5e327bfda11e55))
* **product-management:** 🐛 enhance form validation and error handling for product creation ([98f2de4](https://github.com/Sam231221/AuraSwift/commit/98f2de4cb3c929c4a06a6e31925fdee3dbce93e3))
* **staff-schedules-view:** 🐛 filter cashiers to exclude managers and admins from the list ([0718dee](https://github.com/Sam231221/AuraSwift/commit/0718deeefcfd7a0f225695a2a85a3867ce11044f))
* **preload:** 🐛 handle errors when exposing exports in main world ([4c1a074](https://github.com/Sam231221/AuraSwift/commit/4c1a07436e5f9c0bd055361a047d810d00a793a1))
* **user-management:** 🚑 improve form validation and error handling for user creation ([49dd79d](https://github.com/Sam231221/AuraSwift/commit/49dd79d5cfff0252cdeadf6f6ee3ac93a2d4f66b))
* **window-manager:** 🚫 disable DevTools and prevent opening via keyboard shortcuts ([b5b8819](https://github.com/Sam231221/AuraSwift/commit/b5b8819539ad15e3fae0ef332e0edb6c914df4e4))
* **main:** fix Toaster component for enhanced notification handling ([68113d0](https://github.com/Sam231221/AuraSwift/commit/68113d018013ef31fa00b6a98a95282d6c107518))


### Features

* **auth-api:**  ✨ add PLU uniqueness checks and migration script for existing duplicates ([b0f85f2](https://github.com/Sam231221/AuraSwift/commit/b0f85f2c017e89679ccf136030e9f4a56c599818))
* **database:** ✨ add UNIQUE constraint on (name, businessId) for categories and handle duplicate names during migration ([ada668d](https://github.com/Sam231221/AuraSwift/commit/ada668dd807e2ddcbae215a5d5438f92ce94ea40))
* **manage-categories:** ✨ implement category validation and error handling for form submissions ([b4e1e9b](https://github.com/Sam231221/AuraSwift/commit/b4e1e9b20cb835bb5933896a6ee81ba0dfd9cfac))
* **product-management:** ✨ implement centralized product validation schema using Zod for improved error handling ([7579dba](https://github.com/Sam231221/AuraSwift/commit/7579dba64b3cb062b1050af4e2f6a5f80290dcf8))

# [1.1.0](https://github.com/Sam231221/AuraSwift/compare/v1.0.4...v1.1.0) (2025-11-01)


### Bug Fixes

* **autoUpdater:** 🚑 update dialog detail text for clarity on background download ([438a93e](https://github.com/Sam231221/AuraSwift/commit/438a93e2e3e9eebd23b41c221fe4cad176000b25))


### Features

* **autoUpdater:**  ✨ implement reminder notifications for postponed updates ([7cb2df1](https://github.com/Sam231221/AuraSwift/commit/7cb2df1aac9e3a1ac67dc6b345da671038022b83))

## [1.0.4](https://github.com/Sam231221/AuraSwift/compare/v1.0.3...v1.0.4) (2025-11-01)


### Bug Fixes

* **auth:** simplify button text in login form ([c791e9a](https://github.com/Sam231221/AuraSwift/commit/c791e9aa054922b1dcdbfb579219dbc842b3bf56))

## [1.0.3](https://github.com/Sam231221/AuraSwift/compare/v1.0.2...v1.0.3) (2025-11-01)


### Bug Fixes

* **ci:** remove deprecated debug script for semantic-release version detection ([6819f5c](https://github.com/Sam231221/AuraSwift/commit/6819f5c5a13969f9ec72f2cc65fb4379eda0c5f7))
* **ci:** streamline semantic-release installation and enhance build artifact verification ([a9844b4](https://github.com/Sam231221/AuraSwift/commit/a9844b45fa45d2edb8d16852251467abfa04f5cf))
* **ci:** update artifact verification checks for Windows build outputs ([9d5ae68](https://github.com/Sam231221/AuraSwift/commit/9d5ae68c714798d3ab6639f9ec17ec342e56ac26))
* **ci:** update asset paths for Windows installers in release configuration ([4842dd5](https://github.com/Sam231221/AuraSwift/commit/4842dd555bc862769fc0fbd21dfd24cde11b6378))

## [1.0.2](https://github.com/Sam231221/AuraSwift/compare/v1.0.1...v1.0.2) (2025-10-31)


### Bug Fixes

* **ci:** enhance build process with detailed artifact listing and improved logging ([5db1aeb](https://github.com/Sam231221/AuraSwift/commit/5db1aeb8d27b39bd71aca16a1fdcdc5c9b5c9243))
* **ci:** improve logging messages in CI workflows for better clarity and consistency ([516f6aa](https://github.com/Sam231221/AuraSwift/commit/516f6aa188cb2e9379e31d997cd6d92fa7c01637))
* **ci:** update build output messages to use Write-Host for better readability in PowerShell ([1ad7ba9](https://github.com/Sam231221/AuraSwift/commit/1ad7ba930e19d14e4d19aebdeb3ebd4fb71c3c0d))

## [1.0.1](https://github.com/Sam231221/AuraSwift/compare/v1.0.0...v1.0.1) (2025-10-31)


### Bug Fixes

* **app:** 🚑 enhance auto-updater with Squirrel.Windows event handling and build artifact verification ([f094870](https://github.com/Sam231221/AuraSwift/commit/f09487097b40dc8a9faa8c5b44f772635f52b640))
* **ci:** 🚑 enhance semantic-release version detection and manual version bump logic ([643975f](https://github.com/Sam231221/AuraSwift/commit/643975fa5307dcf19c24b01128c9392bc5121d78))
* **ci:** 🚑 optimize workflows by adjusting schedules, adding caching, and enhancing dependency management ([3377cd8](https://github.com/Sam231221/AuraSwift/commit/3377cd8dc9990cd16f31aafe1310ec7bd5db4a4f))
* **ci:** 🚑 streamline CI workflows by optimizing dependency installation and caching for typecheck and build processes ([41f93d6](https://github.com/Sam231221/AuraSwift/commit/41f93d690d8f26d2241e34de42cd3d2ee26a17f0))
* **ci:** add step to download build artifacts after setting environment variables ([ce13dd0](https://github.com/Sam231221/AuraSwift/commit/ce13dd0c05b5c559aff8c492c21f01956c80056f))
* **ci:** enhance Electron installation verification and caching in workflow ([e50dd38](https://github.com/Sam231221/AuraSwift/commit/e50dd38bd49278b047a7a108263236a98be93ec5))
* **ci:** improve version detection with better commit counting and debugging ([1a10d00](https://github.com/Sam231221/AuraSwift/commit/1a10d006287ec4de3e848d102ec852248b9bce9e))
* **ci:** remove publisherName from Windows build configuration ([1bcd495](https://github.com/Sam231221/AuraSwift/commit/1bcd495728f5781f7b662a42b5351b9cf0545f08))
* **ci:** streamline semantic-release setup and enhance Squirrel.Windows event handling ([8ee8a56](https://github.com/Sam231221/AuraSwift/commit/8ee8a565ebf5fc9ba26bd0c35d1b1dec4fcd729a))
