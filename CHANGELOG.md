# Changelog

All notable changes to this project will be documented in this file. See [Conventional Commits](https://conventionalcommits.org) for commit guidelines.

# [1.8.0](https://github.com/Sam231221/AuraSwift/compare/v1.7.1...v1.8.0) (2025-11-24)


### chore

* **WindowManager:** add type annotation for update check result and improve update check logic for better clarity ([](https://github.com/Sam231221/AuraSwift/commit/f9b02559afb1a663a64aea5a898a828f22f38f38))
* **release:** migrate from .releaserc.json to .releaserc.js for enhanced semantic release configuration and remove deprecated versioning files ([](https://github.com/Sam231221/AuraSwift/commit/76621aa86356438b5adc847f8b960b9bc942a171))
* **database:** remove DATABASE_CONFIG.md and test-db-path.mjs files to streamline database configuration and testing utilities ([](https://github.com/Sam231221/AuraSwift/commit/88ec3742cb717bc98b4ff111de062f32cfb54f8e))
* remove unused assets and scripts, including react.svg and bridge-migration.mjs, to streamline the project structure ([](https://github.com/Sam231221/AuraSwift/commit/1480f4c3ac99fc379957b06d410002ff938ce6a0))


### feat

* **staff-schedules:** add delete confirmation dialog, improve error handling with toast notifications, and enhance shift validation logic for better user experience ([](https://github.com/Sam231221/AuraSwift/commit/65862b60048019a921533dedcb9e3f70f55466ef))
* **transactions:** add IPC handler for creating transactions from cart, including validation and total calculation ([](https://github.com/Sam231221/AuraSwift/commit/d6830a7a568b5601c3ef626543162ab06570fcff))
* **cashier:** add NoActiveShiftModal component to handle scenarios with no scheduled or ended shifts, enhancing user feedback and experience ([](https://github.com/Sam231221/AuraSwift/commit/b750deefa522ed984a214cadc4316c3c97a0666d))
* **tests:** add script to run Vitest with graceful handling of "no tests found" case; update test run command in package.json ([](https://github.com/Sam231221/AuraSwift/commit/944d38dcbe131c561523150fcf060f7c40421c4d))
* **build:** enhance build configuration with improved file exclusions, conditional sourcemaps for production, and add bundle visualizer for performance analysis ([](https://github.com/Sam231221/AuraSwift/commit/f8bcd1294691e391e9d024ac5097895f0f542ae7))
* **database:** enhance DBManager to ensure database directory creation and validation; improve error handling in recovery dialogs for test and CI modes ([](https://github.com/Sam231221/AuraSwift/commit/225f605bab3235fae4a847b58b1fa3cb1d1f7e35))
* **shift-management:** enhance shift creation logic with device tracking, validation for starting cash limits, and improved error handling during shift creation ([](https://github.com/Sam231221/AuraSwift/commit/2f4a15c000963f50bb42fe32748d97dc9f3db994))
* **auto-updater:** enhance update handling with improved error management, user notifications, and consistent state management ([](https://github.com/Sam231221/AuraSwift/commit/8da2e4134b423428e35ff828cca71da6a1445ca9))
* **database:** implement comprehensive database validation, migration, and recovery mechanisms. ([](https://github.com/Sam231221/AuraSwift/commit/f51db1ea14f6fcd198e16833a2e26b45b5b18c02))
* **transactions:** implement inventory update logic after transaction creation and enhance payment method options ([](https://github.com/Sam231221/AuraSwift/commit/5c8be4eed52994b1d8d22ceee9cbc113b7a86add))
* **auto-updater:** implement request timeout, retry logic, and performance metrics tracking for update checks ([](https://github.com/Sam231221/AuraSwift/commit/1a957167b3a96b505d65a6d9f164d7202813907d))
* **auto-updater:** implement smart scheduling for update checks based on user activity and enhance caching mechanism for update results ([](https://github.com/Sam231221/AuraSwift/commit/f34d4bf6b24d5adc12d887de24f1d1f7d4111f8a))
* **staff-schedules:** implement time picker component for improved time selection, enhance validation feedback, and optimize performance with memoization and callbacks ([](https://github.com/Sam231221/AuraSwift/commit/c27409cf0c6804c44d1ed9ef2e08dbd4e1b562e8))
* **tests:** integrate Vitest for testing framework, add comprehensive test structure and utilities ([](https://github.com/Sam231221/AuraSwift/commit/6975537a73d1c987cc7edf946df04469c4fdd4a4))
* **validation:** introduce new validation schemas and hooks for login, registration, and payment forms; enhance existing schemas for better error handling and user experience ([](https://github.com/Sam231221/AuraSwift/commit/b2d7b3622c3c38a0f3d6e8d92c606a755049e656))


### fix

* **transactions:** expand payment method options and update unused parameter for interface compatibility ([](https://github.com/Sam231221/AuraSwift/commit/be484948e29b25e05ae76810d208bc7d5f5a4b31))
* **imports:** optimize date-fns imports in staff schedules view and hook to reduce bundle size ([](https://github.com/Sam231221/AuraSwift/commit/1e104185b4a9bb0ddce694a991db6c77d684f5ef))
* **dependencies:** update package-lock.json to include new dev dependencies and adjust existing ones for improved build performance ([](https://github.com/Sam231221/AuraSwift/commit/fa6d7706d6bfd3777cf0b1c5e26728a7719d6803))
* **release:** update release configuration to use ES module syntax and remove unnecessary comments ([](https://github.com/Sam231221/AuraSwift/commit/d5ead1bda1d770375e6afa225b4097d48c9d26c4))


### refactor

* **cashier:** clean up unused imports, enhance button formatting for better readability, and ensure card reader readiness in payment processing ([](https://github.com/Sam231221/AuraSwift/commit/29db7a3d59a896c91e940f0d3137c02bf7d00d5f))
* **database:** enhance transaction items schema to support category items and update transaction manager for improved item handling ([](https://github.com/Sam231221/AuraSwift/commit/198f2c7ba8f15eff03a9a117e3c422d45322ebc7))
* **views:** major Files and Folders refactors ([](https://github.com/Sam231221/AuraSwift/commit/4c9086fcdef910db0e84f78c5c6fd41b4d52e8e4))
* **payment:** remove Stripe integration references, simplify payment service, and update related interfaces ([](https://github.com/Sam231221/AuraSwift/commit/f4d9382c65eb099950a6e2e3e4c32d101d901a0d))


### style

* **cashier:** enhance button dimensions for improved accessibility and visual consistency across transaction components, including adjustments to padding and layout in various modals and panels ([](https://github.com/Sam231221/AuraSwift/commit/067f6ee5f457be43fbcceda48ffc57b9729f820d))
* **dashboard:** enhance UI responsiveness and visual consistency across admin, cashier, and manager dashboard pages, including adjustments to layout, spacing, and typography ([](https://github.com/Sam231221/AuraSwift/commit/7fe32af53601a713aed88f6920ee2cfbd1d05b5d))
* **cashier:** improve UI responsiveness and visual consistency across transaction components, including adjustments to layout, spacing, and typography ([](https://github.com/Sam231221/AuraSwift/commit/1b530f2ed6ee56b172c3c910b3a9dbf1b73c8751))
* **auth:** update UI components for improved responsiveness and visual consistency, including adjustments to layout, spacing, and typography across authentication views ([](https://github.com/Sam231221/AuraSwift/commit/e0a07861d2b513718254fd64b7345e7ddc94a048))

## [1.7.1](https://github.com/Sam231221/AuraSwift/compare/v1.7.0...v1.7.1) (2025-11-20)


### Bug Fixes

* **electron-builder:** modify requestExecutionLevel configuration for Windows compatibility ([1006373](https://github.com/Sam231221/AuraSwift/commit/1006373e260fb41168080fdc9b832c3a5e02256f))
* **ci:** update electron-builder configuration for Windows 10 Enterprise compatibility and adjust CI workflow to use windows-2022 ([ca2cc0f](https://github.com/Sam231221/AuraSwift/commit/ca2cc0fb687875c44862d1161aded86442e4dfb6))

# [1.7.0](https://github.com/Sam231221/AuraSwift/compare/v1.6.0...v1.7.0) (2025-11-20)


### Bug Fixes

* adjust padding and layout for New Transaction View and Dashboard Layout ([628051f](https://github.com/Sam231221/AuraSwift/commit/628051fde9570763503066a26a9d0838a5d8edd2))
* **package:** downgrade Node.js engine requirement from 22.x to 18.x for compatibility ([f219b47](https://github.com/Sam231221/AuraSwift/commit/f219b47a8c7d7e403c968b2d67a9bade165ffbc1))
* **ci:** downgrade Node.js version from 22 to 20 in CI workflows for consistency ([758b0a9](https://github.com/Sam231221/AuraSwift/commit/758b0a9e8d2682bd2958edb305275c40b4a2dc58))
* **ci:** downgrade Node.js version from 22.x to 18.x across workflows and action configuration ([bc79a8d](https://github.com/Sam231221/AuraSwift/commit/bc79a8d54464547ba51e0c8b051327ff6f6d9a2d))
* **ci:** downgrade Node.js version to 18.x and clean up incompatible node_modules for improved CI compatibility ([28fb093](https://github.com/Sam231221/AuraSwift/commit/28fb093d1046a3df083b91dc697db19641005e53))
* enhance product and schedule handling with serialization and new SKU retrieval method ([d604335](https://github.com/Sam231221/AuraSwift/commit/d604335be1d97163715f88fa80d41877f3e93211))
* **ci:** enhance workspace verification and refine node_modules cleanup process in CI workflows ([e548a3f](https://github.com/Sam231221/AuraSwift/commit/e548a3f2bfbdefcdb6f756a16dfe80a49e5f4512))
* ensure email is always a string and use it as username with default PIN for new users ([675b6a6](https://github.com/Sam231221/AuraSwift/commit/675b6a644542620c74113bb39c81581be61b20e7))
* **ci:** improve commit type counting in CI workflows using awk for robustness ([fadaf56](https://github.com/Sam231221/AuraSwift/commit/fadaf56db4015594f9bfb9cc1af37b5f89c331b8))
* **product-management:** improve error handling and loading state in product and category loading functions. ([37d6d2a](https://github.com/Sam231221/AuraSwift/commit/37d6d2aac901ee76808eacdb1551baa036df69a0))
* **ci:** improve package verification output in CI workflows for clarity and consistency ([99f6275](https://github.com/Sam231221/AuraSwift/commit/99f62759cde31b8f3b37851a164bf618cc085572))
* **ci:** optimize CI workflows by removing unnecessary comments and adjusting Node.js version to 18.x ([a2b7654](https://github.com/Sam231221/AuraSwift/commit/a2b76547d9e38eb8c54f4159354331039773ac92))
* **ci:** refactor package verification logic for improved readability in CI workflows ([885fbfd](https://github.com/Sam231221/AuraSwift/commit/885fbfd705b36733acb018facb1d2ad676c7f00e))
* remove unused state for search query in New Transaction View ([374870b](https://github.com/Sam231221/AuraSwift/commit/374870b59f518153e7c8e8e108a2bfa9bce47224))
* remove unused unit options from Product Management View ([b94036c](https://github.com/Sam231221/AuraSwift/commit/b94036cfe4788490281d4f113cbee710519870d7))
* restrict DevTools access to development environment only ([224cb14](https://github.com/Sam231221/AuraSwift/commit/224cb1490c22feec45dd129608e6361ec93e50e1))
* **scale-display:** simplify ScaleDisplay component and update weight product handling. ([b1c7177](https://github.com/Sam231221/AuraSwift/commit/b1c7177f3ded6e0e1726d32aae96f0f2d66bf6b7))
* **ci:** standardize Node.js version to 18.x and enhance caching strategy in CI workflows for compatibility ([b1f2f91](https://github.com/Sam231221/AuraSwift/commit/b1f2f91c6ff9e927a27c5ed134fd54a92fb3f4a1))
* **ci:** standardize output messages for workspace and package verification in CI workflows ([8dce76a](https://github.com/Sam231221/AuraSwift/commit/8dce76ac2d2a186e297f237a52bc9344d2aecd7d))
* update background gradient styles in AuthHeroSection and AuthPage ([de07ff1](https://github.com/Sam231221/AuraSwift/commit/de07ff16a544b45b24eca84262b63a7a9dc9a9ba))
* update build script and enhance CI workflow to verify workspace packages and ensure Electron installation ([f175eb7](https://github.com/Sam231221/AuraSwift/commit/f175eb7dbbd5783fdfdb4c59d217908143db3ec8))
* **auth:** update business and user types to include detailed attributes ([b77e22e](https://github.com/Sam231221/AuraSwift/commit/b77e22e40412a68ecdb0e37ec83aaa712ecb7bf8))
* **database:** update business seeding structure for clarity ([571309a](https://github.com/Sam231221/AuraSwift/commit/571309a9b0f8a286274e590cbe642c819aae397e))
* update demo PIN for cashier role in AuthPage ([746a412](https://github.com/Sam231221/AuraSwift/commit/746a412b80510d9ec0b87309de248e29355e9943))
* update extraResources filter to include all migration files and improve database migration handling ([1c36442](https://github.com/Sam231221/AuraSwift/commit/1c36442cd0d85312bf7a199d1c31a89171ebf079))
* **cart:** update import path for CartSession and CartItem types to use the correct module reference ([797ad3f](https://github.com/Sam231221/AuraSwift/commit/797ad3f5e2cfd1904bee815f1aed11b88fc5e1fe))
* **cart:** update migration script to handle missing category and item names during cart item transfer ([f05f53c](https://github.com/Sam231221/AuraSwift/commit/f05f53cae33caf59cb3a52edb9c746ccda299a8e))
* **ci:** update Node.js engine requirements and adjust CI workflows for consistency across packages ([b15a157](https://github.com/Sam231221/AuraSwift/commit/b15a1570fdc2c94e3db0837e70a115a3bc3339b4))
* **ci:** update Node.js version from 18.x to 22.x across workflows and action configuration ([d1a0e2b](https://github.com/Sam231221/AuraSwift/commit/d1a0e2b8bc46caf8ccae810e3bdb27cd4740926f))
* **ci:** update Node.js version to 20 and streamline dependency installation process ([b4c26f4](https://github.com/Sam231221/AuraSwift/commit/b4c26f4a0f1f026bb78059ea5fe1aeedee442d8a))
* **ci:** update Node.js version to 20.x and refine dependency installation logic for improved handling of existing projects ([2c40d9f](https://github.com/Sam231221/AuraSwift/commit/2c40d9fdf8f8d7609173e92c8add50d9a48f4f77))
* **ci:** update Node.js version to 22 and adjust engine requirements across packages for consistency ([6bdace1](https://github.com/Sam231221/AuraSwift/commit/6bdace1f1c5ac20530c71ce6cd97cabd922dfc64))
* **ci:** update Node.js version to 22 and modify dependency installation to skip native builds ([5f87f72](https://github.com/Sam231221/AuraSwift/commit/5f87f7213f0383c6f0b0747e6ff466c46d16824e))
* **transactions:** update price display logic to correctly format prices based on product requirements ([2306150](https://github.com/Sam231221/AuraSwift/commit/230615061f96fb3a357b7864e61d13ac68f714a5))
* update stock adjustment creation to use inventory service ([161b08b](https://github.com/Sam231221/AuraSwift/commit/161b08b3409b9df9895e578ad11d182d2dfd9e9b))
* upgrade Node.js version to 20.x across package.json and CI workflows for improved compatibility and performance ([6bc6f69](https://github.com/Sam231221/AuraSwift/commit/6bc6f69d681b76c671518717628051758754eb9b))


### Features

* add AuthHeader component and integrate it into AuthPage; refactor AuthHeroSection ([a9539ba](https://github.com/Sam231221/AuraSwift/commit/a9539bad60ce4c3c286abd77e0a32ba40481b5e0))
* **product-management:** add batch management features and expiry tracking to product forms ([0e73f73](https://github.com/Sam231221/AuraSwift/commit/0e73f73584f265101b3f0ac7b8c7015b5c2871e9))
* **cart:** add category handling with custom price input in transaction view. ([37827b6](https://github.com/Sam231221/AuraSwift/commit/37827b694ac4c65316fa890b0194d45819192296))
* add comprehensive documentation for Node.js 22 compatibility, native module handling, and build process improvements ([da783f3](https://github.com/Sam231221/AuraSwift/commit/da783f385fadbb4f37b960b45bee18ef4d83fb49))
* add database seeding script for default business and users ([7770816](https://github.com/Sam231221/AuraSwift/commit/77708162e2c71d97e68a770e25fdcdfd25988844))
* **database:** add printing, products, and validation schemas ([869b518](https://github.com/Sam231221/AuraSwift/commit/869b51835f586f1482165e1d82e389722a03f138))
* add Quick Actions Carousel component and integrate it into New Transaction View ([c10210c](https://github.com/Sam231221/AuraSwift/commit/c10210c2741878612c9742d39bfb8f7b8df7cc8c))
* **scale-integration:** add scale service and API for weight measurement functionality ([011be89](https://github.com/Sam231221/AuraSwift/commit/011be89efbb4b47f188c0faa13a3d5d0ec75e5f3))
* **database:** add updatedAt field to transaction items and enhance cost price validation in batch forms ([6e700a7](https://github.com/Sam231221/AuraSwift/commit/6e700a7221c0f3be6cee415039628a47976c406e))
* add username and PIN authentication to users table ([70ba336](https://github.com/Sam231221/AuraSwift/commit/70ba33625875cee8fd02374a431bf7f176e7c9d1))
* **cart:** enhance cart item handling to support category items ([d521711](https://github.com/Sam231221/AuraSwift/commit/d521711ec3c77fe6e0c94149112693b09a6e40bb))
* **cart:** enhance cart item retrieval by populating product information. ([90e101b](https://github.com/Sam231221/AuraSwift/commit/90e101b1821dd5e5e1e1c6bab1c67da45d27a6bb))
* enhance category, inventory, product, and supplier managers; add job status polling for office printer ([af93cc4](https://github.com/Sam231221/AuraSwift/commit/af93cc4af7f14609ee9b90841fd48455f9ff85b4))
* enhance database migration safety with integrity checks and downgrade prevention ([bd7cb4e](https://github.com/Sam231221/AuraSwift/commit/bd7cb4e9116ace1ae1ca08149533461c7d7faf9a))
* **migrations:** enhance migration handling and build process ([31ba330](https://github.com/Sam231221/AuraSwift/commit/31ba3302779e37308b3e8b4137ab82807adea924))
* **product:** enhance product management with VAT configuration and refactor product schema ([566013d](https://github.com/Sam231221/AuraSwift/commit/566013d2c1de7534e487af48e9e23b40d305f5b3))
* **time-tracking:** enhance shift management and clock-out functionality ([ba0138b](https://github.com/Sam231221/AuraSwift/commit/ba0138b139aff387a761167c50e36794b938f077))
* **time-tracking:** enhance today's schedule retrieval and shift management. ([bda0869](https://github.com/Sam231221/AuraSwift/commit/bda0869975befa8d124e3631483e357ff18d631d))
* **transaction-manager:** enhance transaction item handling with itemType and tax calculations ([c51f15a](https://github.com/Sam231221/AuraSwift/commit/c51f15a38ac5e9d776343ac6351eb70e1ca31908))
* **database:** expand schema with new business, user, product, transaction, and audit types. ([8c70aa7](https://github.com/Sam231221/AuraSwift/commit/8c70aa7cc2b787302a6426aa9299d900e75ace47))
* **product-management:** implement age restriction features in product schema and forms ([89ea278](https://github.com/Sam231221/AuraSwift/commit/89ea27805fa835c7b9387596921d2d7a2aa4bc12))
* **cart-management:** implement cart session and item management in database schema ([fd2ce59](https://github.com/Sam231221/AuraSwift/commit/fd2ce59b64e147bf65ffe0ed0158580a52c91b07))
* **cart:** implement cart session management and enhance item handling. ([c4d6f3c](https://github.com/Sam231221/AuraSwift/commit/c4d6f3c918ba581523ed405647dba41c473d917c))
* **time-tracking:** implement clock-in/out functionality and enhance shift management ([488e5d0](https://github.com/Sam231221/AuraSwift/commit/488e5d026c9346cb6cfcb03661afa8ef33ed5ff8))
* **auth:** implement getAllActiveUsers API and update user authentication to use username and PIN ([8cdb51f](https://github.com/Sam231221/AuraSwift/commit/8cdb51f0574f8a9d412a66c71d58175189555757))
* implement new payment panel and numeric keypad components; enhance new transaction view layout ([fafdc91](https://github.com/Sam231221/AuraSwift/commit/fafdc91beb2d2982796897e18c5af52b2879012a))
* **vat:** implement VAT category management with IPC integration and UI enhancements ([e1506b7](https://github.com/Sam231221/AuraSwift/commit/e1506b7fc414dbc2a5c20e272fcde473ca6e10f0))
* implement Zod validation schemas for authentication and add IPC handler to retrieve all active users ([ef9fe5e](https://github.com/Sam231221/AuraSwift/commit/ef9fe5e1e610f237e412b8f19037d94242fd1e88))
* **product:** reset stock adjustment form on modal open and improve input handling ([cebd5bc](https://github.com/Sam231221/AuraSwift/commit/cebd5bc607ffd426ba48eb1e4e68f22e8d544741))
* **database:** update migration process and enhance data handling for new transaction items ([b6e0f81](https://github.com/Sam231221/AuraSwift/commit/b6e0f819a93171463a49e5f8d45b47dc4521ba8e))
* **dependencies:** update package-lock.json with new dependencies for node-hid and serialport. ([0d8c888](https://github.com/Sam231221/AuraSwift/commit/0d8c888aa43397e91b610672cebb39dc5c1a6f46))

# [1.6.0](https://github.com/Sam231221/AuraSwift/compare/v1.5.0...v1.6.0) (2025-11-10)


### Bug Fixes

* **database:** Migration system fixes ([5c473cc](https://github.com/Sam231221/AuraSwift/commit/5c473cc8f9441c301af5ae4da716934f85ed17d6))
* **database:** remove unused database migration scripts and add migration journal ([845d294](https://github.com/Sam231221/AuraSwift/commit/845d294473c71cf0601d5b3727befd2b7da7bd6d))
* **database:** update manager constructors to include Drizzle ORM and refactor supplier query logic ([a45a86a](https://github.com/Sam231221/AuraSwift/commit/a45a86a593b1b4975544c86e1fd5eb32269cfdf5))


### Features

* **database:** integrate new managers for business, cash drawer, discount, and inventory with Drizzle ORM ([14d26eb](https://github.com/Sam231221/AuraSwift/commit/14d26ebae2e7f78e8cdde0e5a08799d63393bcfd))

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
