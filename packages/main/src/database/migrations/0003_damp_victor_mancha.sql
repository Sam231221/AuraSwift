ALTER TABLE `clock_events` ADD `schedule_id` text REFERENCES schedules(id);--> statement-breakpoint
CREATE INDEX `clock_events_schedule_idx` ON `clock_events` (`schedule_id`);--> statement-breakpoint
ALTER TABLE `time_corrections` ADD `break_id` text REFERENCES breaks(id);--> statement-breakpoint
CREATE INDEX `time_corrections_break_idx` ON `time_corrections` (`break_id`);