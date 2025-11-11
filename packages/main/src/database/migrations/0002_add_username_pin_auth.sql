-- Migration: Add username/PIN authentication
-- Date: 2025-11-11
-- Description: Adds username and pin columns to users table, makes email/password optional

-- Add new columns to users table
ALTER TABLE `users` ADD `username` text NOT NULL DEFAULT '';
ALTER TABLE `users` ADD `pin` text NOT NULL DEFAULT '';

-- Create unique index on username
CREATE UNIQUE INDEX `users_username_unique` ON `users` (`username`);

-- Note: SQLite doesn't support modifying column constraints directly
-- The email and password columns remain as-is in the database
-- Application logic handles them as optional fields
