-- Migration: Add dual-mode sales support
-- Adds shift_required field to roles table for RBAC-based shift requirement detection
-- Note: transactions.shiftId nullable change will be handled by Drizzle Kit migration generation

-- Add shift_required field to roles table (SQLite supports ADD COLUMN)
ALTER TABLE `roles` ADD COLUMN `shift_required` integer DEFAULT 1;--> statement-breakpoint

-- Update existing roles: admin and owner don't require shifts
UPDATE `roles` SET `shift_required` = 0 WHERE `name` IN ('admin', 'owner');--> statement-breakpoint

-- Update existing roles: cashier, manager, supervisor require shifts (explicit for clarity)
UPDATE `roles` SET `shift_required` = 1 WHERE `name` IN ('cashier', 'manager', 'supervisor');--> statement-breakpoint

