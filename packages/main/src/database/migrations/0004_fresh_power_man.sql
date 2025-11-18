ALTER TABLE `shifts` ADD `timeShiftId` text REFERENCES time_shifts(id);--> statement-breakpoint
ALTER TABLE `transaction_items` ADD `updated_at` integer;