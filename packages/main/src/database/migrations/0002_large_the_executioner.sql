CREATE TABLE `age_verification_records` (
	`id` text PRIMARY KEY NOT NULL,
	`transaction_id` text,
	`transaction_item_id` text,
	`product_id` text NOT NULL,
	`verification_method` text NOT NULL,
	`customer_birthdate` integer,
	`calculated_age` integer,
	`id_scan_data` text,
	`verified_by` text NOT NULL,
	`manager_override_id` text,
	`override_reason` text,
	`business_id` text NOT NULL,
	`verified_at` integer NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer,
	FOREIGN KEY (`transaction_id`) REFERENCES `transactions`(`id`) ON UPDATE no action ON DELETE set null,
	FOREIGN KEY (`transaction_item_id`) REFERENCES `transaction_items`(`id`) ON UPDATE no action ON DELETE set null,
	FOREIGN KEY (`product_id`) REFERENCES `products`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`verified_by`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`manager_override_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`business_id`) REFERENCES `businesses`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `age_verification_transaction_idx` ON `age_verification_records` (`transaction_id`);--> statement-breakpoint
CREATE INDEX `age_verification_transaction_item_idx` ON `age_verification_records` (`transaction_item_id`);--> statement-breakpoint
CREATE INDEX `age_verification_product_idx` ON `age_verification_records` (`product_id`);--> statement-breakpoint
CREATE INDEX `age_verification_verified_by_idx` ON `age_verification_records` (`verified_by`);--> statement-breakpoint
CREATE INDEX `age_verification_business_idx` ON `age_verification_records` (`business_id`);--> statement-breakpoint
CREATE INDEX `age_verification_verified_at_idx` ON `age_verification_records` (`verified_at`);--> statement-breakpoint
CREATE INDEX `age_verification_business_date_idx` ON `age_verification_records` (`business_id`,`verified_at`);--> statement-breakpoint
ALTER TABLE `categories` ADD `age_restriction_level` text DEFAULT 'NONE';--> statement-breakpoint
ALTER TABLE `categories` ADD `require_id_scan` integer DEFAULT false;--> statement-breakpoint
ALTER TABLE `products` ADD `age_restriction_level` text DEFAULT 'NONE' NOT NULL;--> statement-breakpoint
ALTER TABLE `products` ADD `require_id_scan` integer DEFAULT false;--> statement-breakpoint
ALTER TABLE `products` ADD `restriction_reason` text;--> statement-breakpoint
CREATE INDEX `products_age_restriction_idx` ON `products` (`age_restriction_level`);