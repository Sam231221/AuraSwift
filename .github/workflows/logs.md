Run npm run test:all --if-present

> auraswift@1.7.0 test:all
> npx playwright test ./tests/
> npm warn Unknown env config "build-from-source". This will stop working in the next major version of npm.
> npm warn config cache-max This option has been deprecated in favor of `--prefer-online`
> npm warn config cache-min This option has been deprecated in favor of `--prefer-offline`.
> npm warn Unknown env config "msvs-version". This will stop working in the next major version of npm.
> npm warn Unknown env config "python". This will stop working in the next major version of npm.
> npm warn Unknown env config "target-arch". This will stop working in the next major version of npm.
> npm warn Unknown env config "target-platform". This will stop working in the next major version of npm.
> npm warn Unknown project config "build-from-source". This will stop working in the next major version of npm.
> npm warn Unknown project config "target_platform". This will stop working in the next major version of npm.
> npm warn Unknown project config "target_arch". This will stop working in the next major version of npm.
> npm warn Unknown project config "cache_max". This will stop working in the next major version of npm.
> npm warn Unknown project config "cache_min". This will stop working in the next major version of npm.
> npm warn Unknown project config "msvs-version". This will stop working in the next major version of npm.
> npm warn Unknown project config "python". This will stop working in the next major version of npm.
> Running 20 tests using 2 workers
> [Test Setup] Failed to launch Electron: electron.launch: Process failed to launch!
> Call log:

- <launching> "dist\win-unpacked\auraswift.exe" "--inspect=0" "--remote-debugging-port=0" "--no-sandbox" "--disable-gpu" "--disable-dev-shm-usage" "--disable-extensions"
- <launched> pid=5972
- [pid=5972][out]
- [pid=5972][err] Debugger listening on ws://127.0.0.1:53042/b9885f63-531d-4ca6-958c-ad9496c85083
- [pid=5972][err] For help, see: https://nodejs.org/en/docs/inspector
- <ws connecting> ws://127.0.0.1:53042/b9885f63-531d-4ca6-958c-ad9496c85083
- <ws connected> ws://127.0.0.1:53042/b9885f63-531d-4ca6-958c-ad9496c85083
- [pid=5972][err] Debugger attached.
- [pid=5972][out] Production mode: Using user data directory for database
- [pid=5972][out] Database at: C:\Users\runneradmin\AppData\Roaming\auraswift\AuraSwift\pos_system.db
- [pid=5972][out] Database path: C:\Users\runneradmin\AppData\Roaming\auraswift\AuraSwift\pos_system.db
- [pid=5972][out]
- [pid=5972][out] 🚀 Running Drizzle ORM Migrations...
- [pid=5972][out] 🔒 Production mode: Enhanced safety checks enabled
- [pid=5972][out] 📁 Migrations folder: D:\a\AuraSwift\AuraSwift\dist\win-unpacked\resources\migrations
- [pid=5972][out] 🔍 Checking database integrity...
- [pid=5972][out] ✅ Quick integrity check passed
- [pid=5972][out] ✅ Database integrity check passed
- [pid=5972][out] ✅ Foreign key check passed
- [pid=5972][out] 📦 Backup created: C:\Users\runneradmin\AppData\Roaming\auraswift\AuraSwift\backups\auraswift-backup-2025-11-20T00-04-11-953Z.db
- [pid=5972][out] ⚙️ Applying pending migrations...
- [pid=5972][err] ❌ Migration failed:
- [pid=5972][err] 📍 Database path: C:\Users\runneradmin\AppData\Roaming\auraswift\AuraSwift\pos_system.db
- [pid=5972][err] 📝 Error message: Can't find meta/\_journal.json file
- [pid=5972][err] 📋 Stack trace:
- [pid=5972][err] Error: Can't find meta/\_journal.json file
- [pid=5972][err] at readMigrationFiles (file:///D:/a/AuraSwift/AuraSwift/dist/win-unpacked/resources/app.asar/node_modules/drizzle-orm/migrator.js:8:11)
- [pid=5972][err] at migrate (file:///D:/a/AuraSwift/AuraSwift/dist/win-unpacked/resources/app.asar/node_modules/drizzle-orm/better-sqlite3/migrator.js:3:22)
- [pid=5972][err] at runDrizzleMigrations (file:///D:/a/AuraSwift/AuraSwift/dist/win-unpacked/resources/app.asar/node_modules/@app/main/dist/index.js:1142:11)
- [pid=5972][err] at file:///D:/a/AuraSwift/AuraSwift/dist/win-unpacked/resources/app.asar/node_modules/@app/main/dist/index.js:2936:40
- [pid=5972][err] at DBManager.initialize (file:///D:/a/AuraSwift/AuraSwift/dist/win-unpacked/resources/app.asar/node_modules/@app/main/dist/index.js:2969:7)
- [pid=5972][err] at file:///D:/a/AuraSwift/AuraSwift/dist/win-unpacked/resources/app.asar/node_modules/@app/main/dist/index.js:8725:29
- [pid=5972][err] at getDatabase (file:///D:/a/AuraSwift/AuraSwift/dist/win-unpacked/resources/app.asar/node_modules/@app/main/dist/index.js:8888:5)
- [pid=5972][err] at file:///D:/a/AuraSwift/AuraSwift/dist/win-unpacked/resources/app.asar/node_modules/@app/main/dist/index.js:9047:1
- [pid=5972][err] at ModuleJob.run (node:internal/modules/esm/module_job:343:25)
- [pid=5972][err] at process.processTicksAndRejections (node:internal/process/task_queues:105:5)
- [pid=5972][out] 🔄 Attempting to rollback migration...
- [pid=5972][err] 🔄 Attempting automatic rollback...
- [pid=5972][out] ✅ Database restored from backup
- [pid=5972][out] 📦 Restored from: C:\Users\runneradmin\AppData\Roaming\auraswift\AuraSwift\backups\auraswift-backup-2025-11-20T00-04-11-953Z.db
- [pid=5972][err] ✅ Migration rolled back successfully
- [pid=5972][err] 💡 Database restored to pre-migration state
- [pid=5972][err] ❌ Database migration failed. Check the migration logs above for details. Database path: C:\Users\runneradmin\AppData\Roaming\auraswift\AuraSwift\pos_system.db
- [pid=5972][out] Production mode: Using user data directory for database
- [pid=5972][err] ❌ Database initialization error:
- [pid=5972][err] Path: C:\Users\runneradmin\AppData\Roaming\auraswift\AuraSwift\pos_system.db
- [pid=5972][out] Database at: C:\Users\runneradmin\AppData\Roaming\auraswift\AuraSwift\pos_system.db
- [pid=5972][err] Error: Database migration failed. Check the migration logs above for details. Database path: C:\Users\runneradmin\AppData\Roaming\auraswift\AuraSwift\pos_system.db
- [pid=5972][err] Stack: Error: Database migration failed. Check the migration logs above for details. Database path: C:\Users\runneradmin\AppData\Roaming\auraswift\AuraSwift\pos_system.db
- [pid=5972][err] at file:///D:/a/AuraSwift/AuraSwift/dist/win-unpacked/resources/app.asar/node_modules/@app/main/dist/index.js:2944:17
- [pid=5972][err] at process.processTicksAndRejections (node:internal/process/task_queues:105:5)
- [pid=5972][err] at async file:///D:/a/AuraSwift/AuraSwift/dist/win-unpacked/resources/app.asar/node_modules/@app/main/dist/index.js:8725:5
- [pid=5972][err] Error: Database initialization failed at C:\Users\runneradmin\AppData\Roaming\auraswift\AuraSwift\pos_system.db: Database migration failed. Check the migration logs above for details. Database path: C:\Users\runneradmin\AppData\Roaming\auraswift\AuraSwift\pos_system.db
- [pid=5972][err] at file:///D:/a/AuraSwift/AuraSwift/dist/win-unpacked/resources/app.asar/node_modules/@app/main/dist/index.js:2964:15
- [pid=5972][err] at process.processTicksAndRejections (node:internal/process/task_queues:105:5)
- [pid=5972][err] at async file:///D:/a/AuraSwift/AuraSwift/dist/win-unpacked/resources/app.asar/node_modules/@app/main/dist/index.js:8725:5 {
- [pid=5972][err] [cause]: Error: Database migration failed. Check the migration logs above for details. Database path: C:\Users\runneradmin\AppData\Roaming\auraswift\AuraSwift\pos_system.db
- [pid=5972][err] at file:///D:/a/AuraSwift/AuraSwift/dist/win-unpacked/resources/app.asar/node_modules/@app/main/dist/index.js:2944:17
- [pid=5972][err] at process.processTicksAndRejections (node:internal/process/task_queues:105:5)
- [pid=5972][err] at async file:///D:/a/AuraSwift/AuraSwift/dist/win-unpacked/resources/app.asar/node_modules/@app/main/dist/index.js:8725:5
- [pid=5972][err] } Promise {
- [pid=5972][err] <rejected> Error: Database initialization failed at C:\Users\runneradmin\AppData\Roaming\auraswift\AuraSwift\pos_system.db: Database migration failed. Check the migration logs above for details. Database path: C:\Users\runneradmin\AppData\Roaming\auraswift\AuraSwift\pos_system.db
- [pid=5972][err] at file:///D:/a/AuraSwift/AuraSwift/dist/win-unpacked/resources/app.asar/node_modules/@app/main/dist/index.js:2964:15
- [pid=5972][err] at process.processTicksAndRejections (node:internal/process/task_queues:105:5)
- [pid=5972][err] at async file:///D:/a/AuraSwift/AuraSwift/dist/win-unpacked/resources/app.asar/node_modules/@app/main/dist/index.js:8725:5 {
- [pid=5972][err] [cause]: Error: Database migration failed. Check the migration logs above for details. Database path: C:\Users\runneradmin\AppData\Roaming\auraswift\AuraSwift\pos_system.db
- [pid=5972][err] at file:///D:/a/AuraSwift/AuraSwift/dist/win-unpacked/resources/app.asar/node_modules/@app/main/dist/index.js:2944:17
- [pid=5972][err] at process.processTicksAndRejections (node:internal/process/task_queues:105:5)
- [pid=5972][err] at async file:///D:/a/AuraSwift/AuraSwift/dist/win-unpacked/resources/app.asar/node_modules/@app/main/dist/index.js:8725:5
- [pid=5972][err] }
- [pid=5972][err] }
- <ws disconnected> ws://127.0.0.1:53042/b9885f63-531d-4ca6-958c-ad9496c85083 code=1006 reason=
- [pid=5972] <kill>
- [pid=5972] <will force kill>
- [pid=5972] taskkill stderr: ERROR: The process "5972" not found.
- [pid=5972] <process did exit: exitCode=1, signal=null>
- [pid=5972] starting temporary directories cleanup
- [pid=5972] finished temporary directories cleanup
  [Test Setup] Executable path: dist\win-unpacked\auraswift.exe
  [Test Setup] Launch args: --no-sandbox --disable-gpu --disable-dev-shm-usage --disable-extensions
  [Test Setup] Failed to launch Electron: electron.launch: Process failed to launch!
  Call log:
- <launching> "dist\win-unpacked\auraswift.exe" "--inspect=0" "--remote-debugging-port=0" "--no-sandbox" "--disable-gpu" "--disable-dev-shm-usage" "--disable-extensions"
- <launched> pid=8700
- [pid=8700][out]
- [pid=8700][err] Debugger listening on ws://127.0.0.1:53048/ccb49baf-0b38-4494-9058-d4033e0044bf
- [pid=8700][err] For help, see: https://nodejs.org/en/docs/inspector
- <ws connecting> ws://127.0.0.1:53048/ccb49baf-0b38-4494-9058-d4033e0044bf
- <ws connected> ws://127.0.0.1:53048/ccb49baf-0b38-4494-9058-d4033e0044bf
- [pid=8700][err] Debugger attached.
- [pid=8700][out] Production mode: Using user data directory for database
- [pid=8700][out] Database at: C:\Users\runneradmin\AppData\Roaming\auraswift\AuraSwift\pos_system.db
- [pid=8700][out] Database path: C:\Users\runneradmin\AppData\Roaming\auraswift\AuraSwift\pos_system.db
- [pid=8700][out]
- [pid=8700][out] 🚀 Running Drizzle ORM Migrations...
- [pid=8700][out] 🔒 Production mode: Enhanced safety checks enabled
- [pid=8700][out] 📁 Migrations folder: D:\a\AuraSwift\AuraSwift\dist\win-unpacked\resources\migrations
- [pid=8700][out] 🔍 Checking database integrity...
- [pid=8700][out] ✅ Quick integrity check passed
- [pid=8700][out] ✅ Database integrity check passed
- [pid=8700][out] ✅ Foreign key check passed
- [pid=8700][out] 📦 Backup created: C:\Users\runneradmin\AppData\Roaming\auraswift\AuraSwift\backups\auraswift-backup-2025-11-20T00-04-15-584Z.db
- [pid=8700][out] ⚙️ Applying pending migrations...
- [pid=8700][err] ❌ Migration failed:
- [pid=8700][err] 📍 Database path: C:\Users\runneradmin\AppData\Roaming\auraswift\AuraSwift\pos_system.db
- [pid=8700][err] 📝 Error message: Can't find meta/\_journal.json file
- [pid=8700][err] 📋 Stack trace:
- [pid=8700][err] Error: Can't find meta/\_journal.json file
- [pid=8700][err] at readMigrationFiles (file:///D:/a/AuraSwift/AuraSwift/dist/win-unpacked/resources/app.asar/node_modules/drizzle-orm/migrator.js:8:11)
- [pid=8700][err] at migrate (file:///D:/a/AuraSwift/AuraSwift/dist/win-unpacked/resources/app.asar/node_modules/drizzle-orm/better-sqlite3/migrator.js:3:22)
- [pid=8700][err] at runDrizzleMigrations (file:///D:/a/AuraSwift/AuraSwift/dist/win-unpacked/resources/app.asar/node_modules/@app/main/dist/index.js:1142:11)
- [pid=8700][err] at file:///D:/a/AuraSwift/AuraSwift/dist/win-unpacked/resources/app.asar/node_modules/@app/main/dist/index.js:2936:40
- [pid=8700][err] at DBManager.initialize (file:///D:/a/AuraSwift/AuraSwift/dist/win-unpacked/resources/app.asar/node_modules/@app/main/dist/index.js:2969:7)
- [pid=8700][err] at file:///D:/a/AuraSwift/AuraSwift/dist/win-unpacked/resources/app.asar/node_modules/@app/main/dist/index.js:8725:29
- [pid=8700][err] at getDatabase (file:///D:/a/AuraSwift/AuraSwift/dist/win-unpacked/resources/app.asar/node_modules/@app/main/dist/index.js:8888:5)
- [pid=8700][err] at file:///D:/a/AuraSwift/AuraSwift/dist/win-unpacked/resources/app.asar/node_modules/@app/main/dist/index.js:9047:1
- [pid=8700][err] at ModuleJob.run (node:internal/modules/esm/module_job:343:25)
- [pid=8700][err] at process.processTicksAndRejections (node:internal/process/task_queues:105:5)
- [pid=8700][out] 🔄 Attempting to rollback migration...
- [pid=8700][err] 🔄 Attempting automatic rollback...
- [pid=8700][out] ✅ Database restored from backup
- [pid=8700][out] 📦 Restored from: C:\Users\runneradmin\AppData\Roaming\auraswift\AuraSwift\backups\auraswift-backup-2025-11-20T00-04-15-584Z.db
- [pid=8700][err] ✅ Migration rolled back successfully
- [pid=8700][err] 💡 Database restored to pre-migration state
- [pid=8700][err] ❌ Database migration failed. Check the migration logs above for details. Database path: C:\Users\runneradmin\AppData\Roaming\auraswift\AuraSwift\pos_system.db
- [pid=8700][out] Production mode: Using user data directory for database
- [pid=8700][out] Database at: C:\Users\runneradmin\AppData\Roaming\auraswift\AuraSwift\pos_system.db
- [pid=8700][err] ❌ Database initialization error:
- [pid=8700][err] Path: C:\Users\runneradmin\AppData\Roaming\auraswift\AuraSwift\pos_system.db
- [pid=8700][err] Error: Database migration failed. Check the migration logs above for details. Database path: C:\Users\runneradmin\AppData\Roaming\auraswift\AuraSwift\pos_system.db
- [pid=8700][err] Stack: Error: Database migration failed. Check the migration logs above for details. Database path: C:\Users\runneradmin\AppData\Roaming\auraswift\AuraSwift\pos_system.db
- [pid=8700][err] at file:///D:/a/AuraSwift/AuraSwift/dist/win-unpacked/resources/app.asar/node_modules/@app/main/dist/index.js:2944:17
- [pid=8700][err] at process.processTicksAndRejections (node:internal/process/task_queues:105:5)
- [pid=8700][err] at async file:///D:/a/AuraSwift/AuraSwift/dist/win-unpacked/resources/app.asar/node_modules/@app/main/dist/index.js:8725:5
- [pid=8700][err] Error: Database initialization failed at C:\Users\runneradmin\AppData\Roaming\auraswift\AuraSwift\pos_system.db: Database migration failed. Check the migration logs above for details. Database path: C:\Users\runneradmin\AppData\Roaming\auraswift\AuraSwift\pos_system.db
- [pid=8700][err] at file:///D:/a/AuraSwift/AuraSwift/dist/win-unpacked/resources/app.asar/node_modules/@app/main/dist/index.js:2964:15
- [pid=8700][err] at process.processTicksAndRejections (node:internal/process/task_queues:105:5)
- [pid=8700][err] at async file:///D:/a/AuraSwift/AuraSwift/dist/win-unpacked/resources/app.asar/node_modules/@app/main/dist/index.js:8725:5 {
- [pid=8700][err] [cause]: Error: Database migration failed. Check the migration logs above for details. Database path: C:\Users\runneradmin\AppData\Roaming\auraswift\AuraSwift\pos_system.db
- [pid=8700][err] at file:///D:/a/AuraSwift/AuraSwift/dist/win-unpacked/resources/app.asar/node_modules/@app/main/dist/index.js:2944:17
- [pid=8700][err] at process.processTicksAndRejections (node:internal/process/task_queues:105:5)
- [pid=8700][err] at async file:///D:/a/AuraSwift/AuraSwift/dist/win-unpacked/resources/app.asar/node_modules/@app/main/dist/index.js:8725:5
- [pid=8700][err] } Promise {
- [pid=8700][err] <rejected> Error: Database initialization failed at C:\Users\runneradmin\AppData\Roaming\auraswift\AuraSwift\pos_system.db: Database migration failed. Check the migration logs above for details. Database path: C:\Users\runneradmin\AppData\Roaming\auraswift\AuraSwift\pos_system.db
- [pid=8700][err] at file:///D:/a/AuraSwift/AuraSwift/dist/win-unpacked/resources/app.asar/node_modules/@app/main/dist/index.js:2964:15
- [pid=8700][err] at process.processTicksAndRejections (node:internal/process/task_queues:105:5)
- [pid=8700][err] at async file:///D:/a/AuraSwift/AuraSwift/dist/win-unpacked/resources/app.asar/node_modules/@app/main/dist/index.js:8725:5 {
- [pid=8700][err] [cause]: Error: Database migration failed. Check the migration logs above for details. Database path: C:\Users\runneradmin\AppData\Roaming\auraswift\AuraSwift\pos_system.db
- [pid=8700][err] at file:///D:/a/AuraSwift/AuraSwift/dist/win-unpacked/resources/app.asar/node_modules/@app/main/dist/index.js:2944:17
- [pid=8700][err] at process.processTicksAndRejections (node:internal/process/task_queues:105:5)
- [pid=8700][err] at async file:///D:/a/AuraSwift/AuraSwift/dist/win-unpacked/resources/app.asar/node_modules/@app/main/dist/index.js:8725:5
- [pid=8700][err] }
- [pid=8700][err] }
- <ws disconnected> ws://127.0.0.1:53048/ccb49baf-0b38-4494-9058-d4033e0044bf code=1006 reason=
- [pid=8700] <kill>
- [pid=8700] <will force kill>
- [pid=8700] taskkill stderr: ERROR: The process "8700" not found.
- [pid=8700] <process did exit: exitCode=1, signal=null>
- [pid=8700] starting temporary directories cleanup
- [pid=8700] finished temporary directories cleanup
  [Test Setup] Executable path: dist\win-unpacked\auraswift.exe
  [Test Setup] Launch args: --no-sandbox --disable-gpu --disable-dev-shm-usage --disable-extensions
  [Test Setup] Failed to launch Electron: electron.launch: Process failed to launch!
  Call log:
- <launching> "dist\win-unpacked\auraswift.exe" "--inspect=0" "--remote-debugging-port=0" "--no-sandbox" "--disable-gpu" "--disable-dev-shm-usage" "--disable-extensions"
- <launched> pid=6120
- [pid=6120][out]
- [pid=6120][err] Debugger listening on ws://127.0.0.1:53058/f652e311-54ad-4fa4-a051-ac55ccc8970b
- [pid=6120][err] For help, see: https://nodejs.org/en/docs/inspector
- <ws connecting> ws://127.0.0.1:53058/f652e311-54ad-4fa4-a051-ac55ccc8970b
- <ws connected> ws://127.0.0.1:53058/f652e311-54ad-4fa4-a051-ac55ccc8970b
- [pid=6120][err] Debugger attached.
- [pid=6120][out] Production mode: Using user data directory for database
- [pid=6120][out] Database at: C:\Users\runneradmin\AppData\Roaming\auraswift\AuraSwift\pos_system.db
- [pid=6120][out] Database path: C:\Users\runneradmin\AppData\Roaming\auraswift\AuraSwift\pos_system.db
- [pid=6120][out]
- [pid=6120][out] 🚀 Running Drizzle ORM Migrations...
- [pid=6120][out] 🔒 Production mode: Enhanced safety checks enabled
- [pid=6120][out] 📁 Migrations folder: D:\a\AuraSwift\AuraSwift\dist\win-unpacked\resources\migrations
- [pid=6120][out] 🔍 Checking database integrity...
- [pid=6120][out] ✅ Quick integrity check passed
- [pid=6120][out] ✅ Database integrity check passed
- [pid=6120][out] ✅ Foreign key check passed
- [pid=6120][out] 📦 Backup created: C:\Users\runneradmin\AppData\Roaming\auraswift\AuraSwift\backups\auraswift-backup-2025-11-20T00-04-19-187Z.db
- [pid=6120][out] ⚙️ Applying pending migrations...
- [pid=6120][err] ❌ Migration failed:
- [pid=6120][err] 📍 Database path: C:\Users\runneradmin\AppData\Roaming\auraswift\AuraSwift\pos_system.db
- [pid=6120][err] 📝 Error message: Can't find meta/\_journal.json file
- [pid=6120][err] 📋 Stack trace:
- [pid=6120][err] Error: Can't find meta/\_journal.json file
- [pid=6120][err] at readMigrationFiles (file:///D:/a/AuraSwift/AuraSwift/dist/win-unpacked/resources/app.asar/node_modules/drizzle-orm/migrator.js:8:11)
- [pid=6120][err] at migrate (file:///D:/a/AuraSwift/AuraSwift/dist/win-unpacked/resources/app.asar/node_modules/drizzle-orm/better-sqlite3/migrator.js:3:22)
- [pid=6120][err] at runDrizzleMigrations (file:///D:/a/AuraSwift/AuraSwift/dist/win-unpacked/resources/app.asar/node_modules/@app/main/dist/index.js:1142:11)
- [pid=6120][err] at file:///D:/a/AuraSwift/AuraSwift/dist/win-unpacked/resources/app.asar/node_modules/@app/main/dist/index.js:2936:40
- [pid=6120][err] at DBManager.initialize (file:///D:/a/AuraSwift/AuraSwift/dist/win-unpacked/resources/app.asar/node_modules/@app/main/dist/index.js:2969:7)
- [pid=6120][err] at file:///D:/a/AuraSwift/AuraSwift/dist/win-unpacked/resources/app.asar/node_modules/@app/main/dist/index.js:8725:29
- [pid=6120][err] at getDatabase (file:///D:/a/AuraSwift/AuraSwift/dist/win-unpacked/resources/app.asar/node_modules/@app/main/dist/index.js:8888:5)
- [pid=6120][err] at file:///D:/a/AuraSwift/AuraSwift/dist/win-unpacked/resources/app.asar/node_modules/@app/main/dist/index.js:9047:1
- [pid=6120][err] at ModuleJob.run (node:internal/modules/esm/module_job:343:25)
- [pid=6120][err] at process.processTicksAndRejections (node:internal/process/task_queues:105:5)
- [pid=6120][out] 🔄 Attempting to rollback migration...
- [pid=6120][err] 🔄 Attempting automatic rollback...
- [pid=6120][out] ✅ Database restored from backup
- [pid=6120][out] 📦 Restored from: C:\Users\runneradmin\AppData\Roaming\auraswift\AuraSwift\backups\auraswift-backup-2025-11-20T00-04-19-187Z.db
- [pid=6120][err] ✅ Migration rolled back successfully
- [pid=6120][err] 💡 Database restored to pre-migration state
- [pid=6120][err] ❌ Database migration failed. Check the migration logs above for details. Database path: C:\Users\runneradmin\AppData\Roaming\auraswift\AuraSwift\pos_system.db
- [pid=6120][out] Production mode: Using user data directory for database
- [pid=6120][out] Database at: C:\Users\runneradmin\AppData\Roaming\auraswift\AuraSwift\pos_system.db
- [pid=6120][err] ❌ Database initialization error:
- [pid=6120][err] Path: C:\Users\runneradmin\AppData\Roaming\auraswift\AuraSwift\pos_system.db
- [pid=6120][err] Error: Database migration failed. Check the migration logs above for details. Database path: C:\Users\runneradmin\AppData\Roaming\auraswift\AuraSwift\pos_system.db
- [pid=6120][err] Stack: Error: Database migration failed. Check the migration logs above for details. Database path: C:\Users\runneradmin\AppData\Roaming\auraswift\AuraSwift\pos_system.db
- [pid=6120][err] at file:///D:/a/AuraSwift/AuraSwift/dist/win-unpacked/resources/app.asar/node_modules/@app/main/dist/index.js:2944:17
- [pid=6120][err] at process.processTicksAndRejections (node:internal/process/task_queues:105:5)
- [pid=6120][err] at async file:///D:/a/AuraSwift/AuraSwift/dist/win-unpacked/resources/app.asar/node_modules/@app/main/dist/index.js:8725:5
- [pid=6120][err] Error: Database initialization failed at C:\Users\runneradmin\AppData\Roaming\auraswift\AuraSwift\pos_system.db: Database migration failed. Check the migration logs above for details. Database path: C:\Users\runneradmin\AppData\Roaming\auraswift\AuraSwift\pos_system.db
- [pid=6120][err] at file:///D:/a/AuraSwift/AuraSwift/dist/win-unpacked/resources/app.asar/node_modules/@app/main/dist/index.js:2964:15
- [pid=6120][err] at process.processTicksAndRejections (node:internal/process/task_queues:105:5)
- [pid=6120][err] at async file:///D:/a/AuraSwift/AuraSwift/dist/win-unpacked/resources/app.asar/node_modules/@app/main/dist/index.js:8725:5 {
- [pid=6120][err] [cause]: Error: Database migration failed. Check the migration logs above for details. Database path: C:\Users\runneradmin\AppData\Roaming\auraswift\AuraSwift\pos_system.db
- [pid=6120][err] at file:///D:/a/AuraSwift/AuraSwift/dist/win-unpacked/resources/app.asar/node_modules/@app/main/dist/index.js:2944:17
- [pid=6120][err] at process.processTicksAndRejections (node:internal/process/task_queues:105:5)
- [pid=6120][err] at async file:///D:/a/AuraSwift/AuraSwift/dist/win-unpacked/resources/app.asar/node_modules/@app/main/dist/index.js:8725:5
- [pid=6120][err] } Promise {
- [pid=6120][err] <rejected> Error: Database initialization failed at C:\Users\runneradmin\AppData\Roaming\auraswift\AuraSwift\pos_system.db: Database migration failed. Check the migration logs above for details. Database path: C:\Users\runneradmin\AppData\Roaming\auraswift\AuraSwift\pos_system.db
- [pid=6120][err] at file:///D:/a/AuraSwift/AuraSwift/dist/win-unpacked/resources/app.asar/node_modules/@app/main/dist/index.js:2964:15
- [pid=6120][err] at process.processTicksAndRejections (node:internal/process/task_queues:105:5)
- [pid=6120][err] at async file:///D:/a/AuraSwift/AuraSwift/dist/win-unpacked/resources/app.asar/node_modules/@app/main/dist/index.js:8725:5 {
- [pid=6120][err] [cause]: Error: Database migration failed. Check the migration logs above for details. Database path: C:\Users\runneradmin\AppData\Roaming\auraswift\AuraSwift\pos_system.db
- [pid=6120][err] at file:///D:/a/AuraSwift/AuraSwift/dist/win-unpacked/resources/app.asar/node_modules/@app/main/dist/index.js:2944:17
- [pid=6120][err] at process.processTicksAndRejections (node:internal/process/task_queues:105:5)
- [pid=6120][err] at async file:///D:/a/AuraSwift/AuraSwift/dist/win-unpacked/resources/app.asar/node_modules/@app/main/dist/index.js:8725:5
- [pid=6120][err] }
- [pid=6120][err] }
- <ws disconnected> ws://127.0.0.1:53058/f652e311-54ad-4fa4-a051-ac55ccc8970b code=1006 reason=
- [pid=6120] <kill>
- [pid=6120] <will force kill>
- [pid=6120] taskkill stderr: ERROR: The process "6120" not found.
- [pid=6120] <process did exit: exitCode=1, signal=null>
- [pid=6120] starting temporary directories cleanup
- [pid=6120] finished temporary directories cleanup
  [Test Setup] Executable path: dist\win-unpacked\auraswift.exe
  [Test Setup] Launch args: --no-sandbox --disable-gpu --disable-dev-shm-usage --disable-extensions
  [Test Setup] Failed to launch Electron: electron.launch: Process failed to launch!
  Call log:
- <launching> "dist\win-unpacked\auraswift.exe" "--inspect=0" "--remote-debugging-port=0" "--no-sandbox" "--disable-gpu" "--disable-dev-shm-usage" "--disable-extensions"
- <launched> pid=1068
- [pid=1068][out]
- [pid=1068][err] Debugger listening on ws://127.0.0.1:53062/a7cf0fae-d85e-474b-b6c8-073c6342ff3f
- [pid=1068][err] For help, see: https://nodejs.org/en/docs/inspector
- <ws connecting> ws://127.0.0.1:53062/a7cf0fae-d85e-474b-b6c8-073c6342ff3f
- <ws connected> ws://127.0.0.1:53062/a7cf0fae-d85e-474b-b6c8-073c6342ff3f
- [pid=1068][err] Debugger attached.
- [pid=1068][out] Production mode: Using user data directory for database
- [pid=1068][out] Database at: C:\Users\runneradmin\AppData\Roaming\auraswift\AuraSwift\pos_system.db
- [pid=1068][out] Database path: C:\Users\runneradmin\AppData\Roaming\auraswift\AuraSwift\pos_system.db
- [pid=1068][out]
- [pid=1068][out] 🚀 Running Drizzle ORM Migrations...
- [pid=1068][out] 🔒 Production mode: Enhanced safety checks enabled
- [pid=1068][out] 📁 Migrations folder: D:\a\AuraSwift\AuraSwift\dist\win-unpacked\resources\migrations
- [pid=1068][out] 🔍 Checking database integrity...
- [pid=1068][out] ✅ Quick integrity check passed
- [pid=1068][out] ✅ Database integrity check passed
- [pid=1068][out] ✅ Foreign key check passed
- [pid=1068][out] 📦 Backup created: C:\Users\runneradmin\AppData\Roaming\auraswift\AuraSwift\backups\auraswift-backup-2025-11-20T00-04-22-676Z.db
- [pid=1068][out] ⚙️ Applying pending migrations...
- [pid=1068][err] ❌ Migration failed:
- [pid=1068][err] 📍 Database path: C:\Users\runneradmin\AppData\Roaming\auraswift\AuraSwift\pos_system.db
- [pid=1068][err] 📝 Error message: Can't find meta/\_journal.json file
- [pid=1068][err] 📋 Stack trace:
- [pid=1068][err] Error: Can't find meta/\_journal.json file
- [pid=1068][err] at readMigrationFiles (file:///D:/a/AuraSwift/AuraSwift/dist/win-unpacked/resources/app.asar/node_modules/drizzle-orm/migrator.js:8:11)
- [pid=1068][err] at migrate (file:///D:/a/AuraSwift/AuraSwift/dist/win-unpacked/resources/app.asar/node_modules/drizzle-orm/better-sqlite3/migrator.js:3:22)
- [pid=1068][err] at runDrizzleMigrations (file:///D:/a/AuraSwift/AuraSwift/dist/win-unpacked/resources/app.asar/node_modules/@app/main/dist/index.js:1142:11)
- [pid=1068][err] at file:///D:/a/AuraSwift/AuraSwift/dist/win-unpacked/resources/app.asar/node_modules/@app/main/dist/index.js:2936:40
- [pid=1068][err] at DBManager.initialize (file:///D:/a/AuraSwift/AuraSwift/dist/win-unpacked/resources/app.asar/node_modules/@app/main/dist/index.js:2969:7)
- [pid=1068][err] at file:///D:/a/AuraSwift/AuraSwift/dist/win-unpacked/resources/app.asar/node_modules/@app/main/dist/index.js:8725:29
- [pid=1068][err] at getDatabase (file:///D:/a/AuraSwift/AuraSwift/dist/win-unpacked/resources/app.asar/node_modules/@app/main/dist/index.js:8888:5)
- [pid=1068][err] at file:///D:/a/AuraSwift/AuraSwift/dist/win-unpacked/resources/app.asar/node_modules/@app/main/dist/index.js:9047:1
- [pid=1068][err] at ModuleJob.run (node:internal/modules/esm/module_job:343:25)
- [pid=1068][err] at process.processTicksAndRejections (node:internal/process/task_queues:105:5)
- [pid=1068][err] 🔄 Attempting automatic rollback...
- [pid=1068][out] 🔄 Attempting to rollback migration...
- [pid=1068][out] ✅ Database restored from backup
- [pid=1068][out] 📦 Restored from: C:\Users\runneradmin\AppData\Roaming\auraswift\AuraSwift\backups\auraswift-backup-2025-11-20T00-04-22-676Z.db
- [pid=1068][err] ✅ Migration rolled back successfully
- [pid=1068][err] 💡 Database restored to pre-migration state
- [pid=1068][err] ❌ Database migration failed. Check the migration logs above for details. Database path: C:\Users\runneradmin\AppData\Roaming\auraswift\AuraSwift\pos_system.db
- [pid=1068][out] Production mode: Using user data directory for database
- [pid=1068][out] Database at: C:\Users\runneradmin\AppData\Roaming\auraswift\AuraSwift\pos_system.db
- [pid=1068][err] ❌ Database initialization error:
- [pid=1068][err] Path: C:\Users\runneradmin\AppData\Roaming\auraswift\AuraSwift\pos_system.db
- [pid=1068][err] Error: Database migration failed. Check the migration logs above for details. Database path: C:\Users\runneradmin\AppData\Roaming\auraswift\AuraSwift\pos_system.db
- [pid=1068][err] Stack: Error: Database migration failed. Check the migration logs above for details. Database path: C:\Users\runneradmin\AppData\Roaming\auraswift\AuraSwift\pos_system.db
- [pid=1068][err] at file:///D:/a/AuraSwift/AuraSwift/dist/win-unpacked/resources/app.asar/node_modules/@app/main/dist/index.js:2944:17
- [pid=1068][err] at process.processTicksAndRejections (node:internal/process/task_queues:105:5)
- [pid=1068][err] at async file:///D:/a/AuraSwift/AuraSwift/dist/win-unpacked/resources/app.asar/node_modules/@app/main/dist/index.js:8725:5
- [pid=1068][err] Error: Database initialization failed at C:\Users\runneradmin\AppData\Roaming\auraswift\AuraSwift\pos_system.db: Database migration failed. Check the migration logs above for details. Database path: C:\Users\runneradmin\AppData\Roaming\auraswift\AuraSwift\pos_system.db
- [pid=1068][err] at file:///D:/a/AuraSwift/AuraSwift/dist/win-unpacked/resources/app.asar/node_modules/@app/main/dist/index.js:2964:15
- [pid=1068][err] at process.processTicksAndRejections (node:internal/process/task_queues:105:5)
- [pid=1068][err] at async file:///D:/a/AuraSwift/AuraSwift/dist/win-unpacked/resources/app.asar/node_modules/@app/main/dist/index.js:8725:5 {
- [pid=1068][err] [cause]: Error: Database migration failed. Check the migration logs above for details. Database path: C:\Users\runneradmin\AppData\Roaming\auraswift\AuraSwift\pos_system.db
- [pid=1068][err] at file:///D:/a/AuraSwift/AuraSwift/dist/win-unpacked/resources/app.asar/node_modules/@app/main/dist/index.js:2944:17
- [pid=1068][err] at process.processTicksAndRejections (node:internal/process/task_queues:105:5)
- [pid=1068][err] at async file:///D:/a/AuraSwift/AuraSwift/dist/win-unpacked/resources/app.asar/node_modules/@app/main/dist/index.js:8725:5
- [pid=1068][err] } Promise {
- [pid=1068][err] <rejected> Error: Database initialization failed at C:\Users\runneradmin\AppData\Roaming\auraswift\AuraSwift\pos_system.db: Database migration failed. Check the migration logs above for details. Database path: C:\Users\runneradmin\AppData\Roaming\auraswift\AuraSwift\pos_system.db
- [pid=1068][err] at file:///D:/a/AuraSwift/AuraSwift/dist/win-unpacked/resources/app.asar/node_modules/@app/main/dist/index.js:2964:15
- [pid=1068][err] at process.processTicksAndRejections (node:internal/process/task_queues:105:5)
- [pid=1068][err] at async file:///D:/a/AuraSwift/AuraSwift/dist/win-unpacked/resources/app.asar/node_modules/@app/main/dist/index.js:8725:5 {
- [pid=1068][err] [cause]: Error: Database migration failed. Check the migration logs above for details. Database path: C:\Users\runneradmin\AppData\Roaming\auraswift\AuraSwift\pos_system.db
- [pid=1068][err] at file:///D:/a/AuraSwift/AuraSwift/dist/win-unpacked/resources/app.asar/node_modules/@app/main/dist/index.js:2944:17
- [pid=1068][err] at process.processTicksAndRejections (node:internal/process/task_queues:105:5)
- [pid=1068][err] at async file:///D:/a/AuraSwift/AuraSwift/dist/win-unpacked/resources/app.asar/node_modules/@app/main/dist/index.js:8725:5
- [pid=1068][err] }
- [pid=1068][err] }
- <ws disconnected> ws://127.0.0.1:53062/a7cf0fae-d85e-474b-b6c8-073c6342ff3f code=1006 reason=
- [pid=1068] <kill>
- [pid=1068] <will force kill>
- [pid=1068] taskkill stderr: ERROR: The process "1068" not found.
- [pid=1068] <process did exit: exitCode=1, signal=null>
- [pid=1068] starting temporary directories cleanup
- [pid=1068] finished temporary directories cleanup
  [Test Setup] Executable path: dist\win-unpacked\auraswift.exe
  [Test Setup] Launch args: --no-sandbox --disable-gpu --disable-dev-shm-usage --disable-extensions
  F·F··F··············

1.  tests\e2e.spec.ts:196:3 › Build Environment Debug › Check build output structure ──────────────
    Error: electron.launch: Process failed to launch!
    Call log:
    - <launching> "D:\a\AuraSwift\AuraSwift\node_modules\electron\dist\electron.exe" "--inspect=0" "--remote-debugging-port=0" "packages/entry-point.mjs" "--no-sandbox" "--disable-gpu" "--disable-dev-shm-usage" "--disable-extensions"
    - <launched> pid=6044
    - [pid=6044][out]
    - [pid=6044][err] Debugger listening on ws://127.0.0.1:53046/b26e8b68-0940-4d08-8a95-1255980c270a
    - [pid=6044][err] For help, see: https://nodejs.org/en/docs/inspector
    - <ws connecting> ws://127.0.0.1:53046/b26e8b68-0940-4d08-8a95-1255980c270a
    - <ws connected> ws://127.0.0.1:53046/b26e8b68-0940-4d08-8a95-1255980c270a
    - [pid=6044][err] Debugger attached.
    - [pid=6044][out] Development mode: Using project directory for database
    - [pid=6044][out] Database at: D:\a\AuraSwift\AuraSwift\packages\data\pos_system.db
    - [pid=6044][out] Database path: D:\a\AuraSwift\AuraSwift\packages\data\pos_system.db
    - [pid=6044][out]
    - [pid=6044][out] 🚀 Running Drizzle ORM Migrations...
    - [pid=6044][out] 🛠️ Development mode: Relaxed migration checks
    - [pid=6044][out] 📁 Migrations folder: D:\a\AuraSwift\AuraSwift\packages\main\dist\migrations
    - [pid=6044][out] 🔍 Checking database integrity...
    - [pid=6044][out] ✅ Database integrity check passed
    - [pid=6044][out] ✅ Foreign key check passed
    - [pid=6044][out] 📦 Backup created: D:\a\AuraSwift\AuraSwift\packages\data\backups\auraswift-backup-2025-11-20T00-04-13-043Z.db
    - [pid=6044][out] ⚙️ Applying pending migrations...
    - [pid=6044][out] ⏱️ Migrations completed in 0.00s
    - [pid=6044][out] 🔍 Verifying database integrity after migration...
    - [pid=6044][out] ✅ Database integrity check passed
    - [pid=6044][out] ✅ Foreign key check passed
    - [pid=6044][out] ✅ All migrations completed successfully!
    - [pid=6044][out]
    - [pid=6044][out] ✅ Database initialized successfully
    - [pid=6044][out]
    - [pid=6044][out] ✅ Drizzle ORM initialized
    - [pid=6044][out]
    - [pid=6044][out] 🌱 Checking if seed data is needed...
    - [pid=6044][out] ⏭️ Database already seeded, skipping...
    - [pid=6044][out] info: Office printer IPC handlers registered {"service":"office-printer-service","timestamp":"2025-11-20 00:04:13"}
    - [pid=6044][out] info: PDF-to-Printer library loaded successfully {"service":"office-printer-service","timestamp":"2025-11-20 00:04:13"}
    - [pid=6044][out] info: Printer health monitoring started {"service":"office-printer-service","timestamp":"2025-11-20 00:04:13"}
    - [pid=6044][out] info: Office Printer Service initialized {"service":"office-printer-service","timestamp":"2025-11-20 00:04:13"}
    - [pid=6044][out] ✅ PDF Receipt Service initialized
    - <ws disconnected> ws://127.0.0.1:53046/b26e8b68-0940-4d08-8a95-1255980c270a code=1006 reason=
    - [pid=6044] <kill>
    - [pid=6044] <will force kill>
    - [pid=6044] taskkill stderr: ERROR: The process "6044" not found.
    - [pid=6044] <process did exit: exitCode=0, signal=null>
    - [pid=6044] starting temporary directories cleanup
    - [pid=6044] finished temporary directories cleanup
      143 |
      144 | if (existsSync(devMainEntry)) {
      > 145 | electronApp = await electron.launch({
            |                           ^
      146 | executablePath: electronBinary,
      147 | args: [devMainEntry, ...launchArgs],
      148 | timeout: 60000,
      at Object.base.extend.electronApp.scope (D:\a\AuraSwift\AuraSwift\tests\e2e.spec.ts:145:27)
2.  tests\e2e.spec.ts:262:3 › Vite Build & TypeScript Integration › Vite development assets load correctly
    Error: electron.launch: Process failed to launch!
    Call log:
    - <launching> "D:\a\AuraSwift\AuraSwift\node_modules\electron\dist\electron.exe" "--inspect=0" "--remote-debugging-port=0" "packages/entry-point.mjs" "--no-sandbox" "--disable-gpu" "--disable-dev-shm-usage" "--disable-extensions"
    - <launched> pid=6640
    - [pid=6640][out]
    - [pid=6640][err] Debugger listening on ws://127.0.0.1:53055/ac34f704-cfc9-4ad7-be96-dc6f0a20ae94
    - [pid=6640][err] For help, see: https://nodejs.org/en/docs/inspector
    - <ws connecting> ws://127.0.0.1:53055/ac34f704-cfc9-4ad7-be96-dc6f0a20ae94
    - <ws connected> ws://127.0.0.1:53055/ac34f704-cfc9-4ad7-be96-dc6f0a20ae94
    - [pid=6640][err] Debugger attached.
    - [pid=6640][out] Development mode: Using project directory for database
    - [pid=6640][out] Database at: D:\a\AuraSwift\AuraSwift\packages\data\pos_system.db
    - [pid=6640][out] Database path: D:\a\AuraSwift\AuraSwift\packages\data\pos_system.db
    - [pid=6640][out]
    - [pid=6640][out] 🚀 Running Drizzle ORM Migrations...
    - [pid=6640][out] 🛠️ Development mode: Relaxed migration checks
    - [pid=6640][out] 📁 Migrations folder: D:\a\AuraSwift\AuraSwift\packages\main\dist\migrations
    - [pid=6640][out] 🔍 Checking database integrity...
    - [pid=6640][out] ✅ Database integrity check passed
    - [pid=6640][out] ✅ Foreign key check passed
    - [pid=6640][out] 📦 Backup created: D:\a\AuraSwift\AuraSwift\packages\data\backups\auraswift-backup-2025-11-20T00-04-16-488Z.db
    - [pid=6640][out] ⚙️ Applying pending migrations...
    - [pid=6640][out] ⏱️ Migrations completed in 0.00s
    - [pid=6640][out] 🔍 Verifying database integrity after migration...
    - [pid=6640][out] ✅ Database integrity check passed
    - [pid=6640][out] ✅ Foreign key check passed
    - [pid=6640][out] ✅ All migrations completed successfully!
    - [pid=6640][out]
    - [pid=6640][out] ✅ Database initialized successfully
    - [pid=6640][out]
    - [pid=6640][out] ✅ Drizzle ORM initialized
    - [pid=6640][out]
    - [pid=6640][out] 🌱 Checking if seed data is needed...
    - [pid=6640][out] ⏭️ Database already seeded, skipping...
    - [pid=6640][out] info: Office printer IPC handlers registered {"service":"office-printer-service","timestamp":"2025-11-20 00:04:16"}
    - [pid=6640][out] info: PDF-to-Printer library loaded successfully {"service":"office-printer-service","timestamp":"2025-11-20 00:04:16"}
    - [pid=6640][out] info: Printer health monitoring started {"service":"office-printer-service","timestamp":"2025-11-20 00:04:16"}
    - [pid=6640][out] info: Office Printer Service initialized {"service":"office-printer-service","timestamp":"2025-11-20 00:04:16"}
    - [pid=6640][out] ✅ PDF Receipt Service initialized
    - <ws disconnected> ws://127.0.0.1:53055/ac34f704-cfc9-4ad7-be96-dc6f0a20ae94 code=1006 reason=
    - [pid=6640] <kill>
    - [pid=6640] <will force kill>
    - [pid=6640] taskkill stderr: ERROR: The process "6640" not found.
    - [pid=6640] <process did exit: exitCode=0, signal=null>
    - [pid=6640] starting temporary directories cleanup
    - [pid=6640] finished temporary directories cleanup
      143 |
      144 | if (existsSync(devMainEntry)) {
      > 145 | electronApp = await electron.launch({
            |                           ^
      146 | executablePath: electronBinary,
      147 | args: [devMainEntry, ...launchArgs],
      148 | timeout: 60000,
      at Object.base.extend.electronApp.scope (D:\a\AuraSwift\AuraSwift\tests\e2e.spec.ts:145:27)
3.  tests\e2e.spec.ts:285:3 › Vite Build & TypeScript Integration › TypeScript compilation produces working code
    Error: electron.launch: Process failed to launch!
    Call log: - <launching> "D:\a\AuraSwift\AuraSwift\node_modules\electron\dist\electron.exe" "--inspect=0" "--remote-debugging-port=0" "packages/entry-point.mjs" "--no-sandbox" "--disable-gpu" "--disable-dev-shm-usage" "--disable-extensions" - <launched> pid=5412 - [pid=5412][out] - [pid=5412][err] Debugger listening on ws://127.0.0.1:53060/7fddfe13-a864-44de-9f33-762862792e96 - [pid=5412][err] For help, see: https://nodejs.org/en/docs/inspector - <ws connecting> ws://127.0.0.1:53060/7fddfe13-a864-44de-9f33-762862792e96 - <ws connected> ws://127.0.0.1:53060/7fddfe13-a864-44de-9f33-762862792e96 - [pid=5412][err] Debugger attached. - [pid=5412][out] Development mode: Using project directory for database - [pid=5412][out] Database at: D:\a\AuraSwift\AuraSwift\packages\data\pos_system.db - [pid=5412][out] Database path: D:\a\AuraSwift\AuraSwift\packages\data\pos_system.db - [pid=5412][out] - [pid=5412][out] 🚀 Running Drizzle ORM Migrations... - [pid=5412][out] 🛠️ Development mode: Relaxed migration checks - [pid=5412][out] 📁 Migrations folder: D:\a\AuraSwift\AuraSwift\packages\main\dist\migrations - [pid=5412][out] 🔍 Checking database integrity... - [pid=5412][out] ✅ Database integrity check passed - [pid=5412][out] ✅ Foreign key check passed - [pid=5412][out] 📦 Backup created: D:\a\AuraSwift\AuraSwift\packages\data\backups\auraswift-backup-2025-11-20T00-04-20-048Z.db - [pid=5412][out] ⚙️ Applying pending migrations... - [pid=5412][out] ⏱️ Migrations completed in 0.00s - [pid=5412][out] 🔍 Verifying database integrity after migration... - [pid=5412][out] ✅ Database integrity check passed - [pid=5412][out] ✅ Foreign key check passed - [pid=5412][out] ✅ All migrations completed successfully! - [pid=5412][out] - [pid=5412][out] ✅ Database initialized successfully - [pid=5412][out] - [pid=5412][out] ✅ Drizzle ORM initialized - [pid=5412][out] - [pid=5412][out] 🌱 Checking if seed data is needed... - [pid=5412][out] ⏭️ Database already seeded, skipping... - [pid=5412][out] info: Office printer IPC handlers registered {"service":"office-printer-service","timestamp":"2025-11-20 00:04:20"} - [pid=5412][out] info: PDF-to-Printer library loaded successfully {"service":"office-printer-service","timestamp":"2025-11-20 00:04:20"} - [pid=5412][out] info: Printer health monitoring started {"service":"office-printer-service","timestamp":"2025-11-20 00:04:20"} - [pid=5412][out] info: Office Printer Service initialized {"service":"office-printer-service","timestamp":"2025-11-20 00:04:20"} - [pid=5412][out] ✅ PDF Receipt Service initialized - <ws disconnected> ws://127.0.0.1:53060/7fddfe13-a864-44de-9f33-762862792e96 code=1006 reason= - [pid=5412] <kill> - [pid=5412] <will force kill> - [pid=5412] taskkill stderr: ERROR: The process "5412" not found. - [pid=5412] <process did exit: exitCode=0, signal=null> - [pid=5412] starting temporary directories cleanup - [pid=5412] finished temporary directories cleanup
    143 |
    144 | if (existsSync(devMainEntry)) { > 145 | electronApp = await electron.launch({
    | ^
    146 | executablePath: electronBinary,
    147 | args: [devMainEntry, ...launchArgs],
    148 | timeout: 60000,
    at Object.base.extend.electronApp.scope (D:\a\AuraSwift\AuraSwift\tests\e2e.spec.ts:145:27)
    3 failed
    tests\e2e.spec.ts:196:3 › Build Environment Debug › Check build output structure ───────────────
    tests\e2e.spec.ts:262:3 › Vite Build & TypeScript Integration › Vite development assets load correctly
    tests\e2e.spec.ts:285:3 › Vite Build & TypeScript Integration › TypeScript compilation produces working code
    17 passed (46.7s)
    Error: Process completed with exit code 1.
