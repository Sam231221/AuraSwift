PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_cart_sessions` (
	`id` text PRIMARY KEY NOT NULL,
	`cashier_id` text NOT NULL,
	`shift_id` text,
	`business_id` text NOT NULL,
	`terminal_id` text,
	`status` text DEFAULT 'ACTIVE' NOT NULL,
	`total_amount` real DEFAULT 0,
	`tax_amount` real DEFAULT 0,
	`customer_age_verified` integer DEFAULT false,
	`verification_method` text DEFAULT 'NONE',
	`verified_by` text,
	`completed_at` integer,
	`created_at` integer NOT NULL,
	`updated_at` integer,
	FOREIGN KEY (`cashier_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`shift_id`) REFERENCES `shifts`(`id`) ON UPDATE no action ON DELETE set null,
	FOREIGN KEY (`business_id`) REFERENCES `businesses`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`terminal_id`) REFERENCES `terminals`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`verified_by`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
INSERT INTO `__new_cart_sessions`("id", "cashier_id", "shift_id", "business_id", "terminal_id", "status", "total_amount", "tax_amount", "customer_age_verified", "verification_method", "verified_by", "completed_at", "created_at", "updated_at") SELECT "id", "cashier_id", "shift_id", "business_id", "terminal_id", "status", "total_amount", "tax_amount", "customer_age_verified", "verification_method", "verified_by", "completed_at", "created_at", "updated_at" FROM `cart_sessions`;--> statement-breakpoint
DROP TABLE `cart_sessions`;--> statement-breakpoint
ALTER TABLE `__new_cart_sessions` RENAME TO `cart_sessions`;--> statement-breakpoint
PRAGMA foreign_keys=ON;--> statement-breakpoint
CREATE INDEX `cart_sessions_status_idx` ON `cart_sessions` (`status`,`cashier_id`);--> statement-breakpoint
CREATE INDEX `cart_sessions_created_idx` ON `cart_sessions` (`created_at`);--> statement-breakpoint
CREATE INDEX `cart_sessions_shift_idx` ON `cart_sessions` (`shift_id`);--> statement-breakpoint
CREATE INDEX `cart_sessions_business_idx` ON `cart_sessions` (`business_id`);