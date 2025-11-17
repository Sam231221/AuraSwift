ALTER TABLE `businesses` RENAME COLUMN "name" TO "businessName";--> statement-breakpoint
ALTER TABLE `businesses` ADD `firstName` text NOT NULL DEFAULT '';--> statement-breakpoint
ALTER TABLE `businesses` ADD `lastName` text NOT NULL DEFAULT '';--> statement-breakpoint
DROP INDEX IF EXISTS `validation_issues_public_id_unique`;--> statement-breakpoint
DROP INDEX IF EXISTS `shift_validation_issues_public_id_unique`;