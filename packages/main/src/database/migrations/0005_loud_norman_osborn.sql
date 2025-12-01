CREATE TABLE `sales_unit_settings` (
	`id` text PRIMARY KEY NOT NULL,
	`business_id` text NOT NULL,
	`sales_unit_mode` text DEFAULT 'Varying' NOT NULL,
	`fixed_sales_unit` text DEFAULT 'KG' NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer,
	FOREIGN KEY (`business_id`) REFERENCES `businesses`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `sales_unit_settings_business_idx` ON `sales_unit_settings` (`business_id`);--> statement-breakpoint
CREATE UNIQUE INDEX `sales_unit_settings_business_unique` ON `sales_unit_settings` (`business_id`);