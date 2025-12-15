# Database System Analysis Report

## Overview
This report analyzes the current mechanisms for Database Backup, Rollback, and Cleanup in the AuraSwift application. It highlights critical issues, potential data loss scenarios, and recommendations for improvement.

## 1. Backup Scenarios & Issues

### 1.1. Redundant Backups on Boot Loops
**Finding:**
In `drizzle-migrator.ts`, the `runDrizzleMigrations` function creates a backup *before* every migration attempt. If a migration fails consistently (e.g., due to a breaking schema change or data corruption), the application will enter a "boot loop" where the user restarts the app, forcing a new migration attempt.
**Issue:**
Each restart creates a new backup of the *same* pre-migration state. `cleanupOldBackups` retains only the latest 10 backups.
**Impact:**
A user restarting the app 10 times in frustration will flood the backup folder with 10 identical copies of the same database state, effectively wiping out *older* valid backups (from days or weeks ago) which might be the only true recovery point.
**Recommendation:**
Implement a check to skip backup creation if the database file is identical (hash or size+mtime) to the latest existing backup, or increase the backup limit significantly.

### 1.2. Hidden `.old` Backups
**Finding:**
In `db-repair.ts`, `createFreshDatabase` renames the corrupt database to `pos_system.db.old.<timestamp>`.
**Issue:**
The Recovery Dialog (`showRecoveryDialog` in `db-recovery-dialog.ts`) offers a "Restore from Backup" option, but this logic typically searches in the `backups/` subdirectory. It does not scan for or offer `.old` files located in the root database directory.
**Impact:**
If a user chooses "Start Fresh" but later realizes they need their old data, they cannot access it through the UI, leading to perceived data loss.
**Recommendation:**
Update the "Restore from Backup" logic to also look for and offer `*.old.*` files from the main database directory.

### 1.3. Silent Failure on Path Migration
**Finding:**
In `db-manager.ts`, if `shouldMigrateDatabasePath()` returns `true` but `migrateDatabaseFromOldPath()` fails (returns `migrated: false`), the system logs a warning and *continues* execution using `getDatabasePath()` (which points to the new, empty location).
**Issue:**
The application effectively ignores the failure and initializes a fresh, empty database.
**Impact:**
The user is presented with an empty application (no products, no sales) without any error message or notification that their data failed to migrate. This causes panic and perceived total data loss.
**Recommendation:**
If path migration fails, the application MUST show a blocking error dialog explaining the situation and offering options (retry, or manually move file), rather than silently starting fresh.

### 1.4. Lack of Manual Backup
**Finding:**
There is no exposed functionality for the user to trigger a backup manually via the UI. Backups only occur during migrations or failures.
**Recommendation:**
Expose a manual backup IPC handler and UI control.

## 2. Rollback Scenarios & Issues

### 2.1. Double Connection Closure & Ownership Confusion
**Finding:**
`rollbackMigration` in `drizzle-migrator.ts` attempts to close the `rawDb` connection before overwriting the file. However, `DBManager` also holds a reference to this connection (`this.db`) and attempts to close it again upon failure receipt.
**Issue:**
While `better-sqlite3`'s `close()` is generally idempotent, having multiple owners responsible for closing the connection can lead to race conditions or errors if one attempts to query a closed connection during the error handling flow.
**Recommendation:**
Centralize connection management. `drizzle-migrator` should signal the need for closure, or `DBManager` should be the only one closing it.

### 2.2. Rollback Atomicity on Windows
**Issue:**
On Windows, `copyFileSync` (restore) will fail if any process (including the app's own lingering handles or strict antivirus scanners) has a lock on `dbPath`. If `rawDb.close()` doesn't fully release the file immediately (async I/O lag), the rollback copy might fail, leaving the database in a half-migrated or corrupt state.
**Recommendation:**
Implement a retry mechanism with a small delay for the rollback copy operation on Windows.

## 3. DB Cleanup Scenarios & Issues

### 3.1. `emptyAllTables` Exposed to Production
**Finding:**
`packages/main/src/database/index.ts` exposes `emptyAllTables()`.
**Issue:**
There is no check for `process.env.NODE_ENV !== 'production'` inside this function.
**Impact:**
If this function is accidentally called (e.g. via a dev debug command or malicious IPC injection if not properly guarded), it will wipe the entire database.
**Recommendation:**
Add a strict environment check or `isDev` guard inside `emptyAllTables`.

### 3.2. Missing Audit Log Rotation (Critical)
**Finding:**
`AuditLogManager.ts` has no method to clean up or rotate old logs.
**Issue:**
Audit logs grow with every action. On a local SQLite database, this table will eventually become massive, degrading performance and consuming disk space.
**Recommendation:**
Implement a cleanup job (running at startup or daily) that deletes audit logs older than X days (e.g. 90 days), configurable via settings.

### 3.3. Unverified Session Cleanup
**Finding:**
`SessionManager` has `cleanupExpiredSessions`, but it is not called automatically within the Manager's initialization or any visible scheduled task in the file I reviewed.
**Issue:**
Expired sessions may accumulate indefinitely if not triggered externally.
**Recommendation:**
Ensure `cleanupExpiredSessions` is called on app startup or via a cron job.

### 3.4. Transaction History Archiving
**Finding:**
There is no evidence of archiving or pruning old transactions (`transactions` table).
**Issue:**
Similar to audit logs, transaction history will grow indefinitely.
**Recommendation:**
Implement an archiving strategy or "Year End" procedure to move old transactions to an archive file/table if the DB size becomes unmanageable.
