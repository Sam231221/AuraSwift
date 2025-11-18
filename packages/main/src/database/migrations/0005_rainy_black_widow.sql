PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_cart_items` (
	`id` text PRIMARY KEY NOT NULL,
	`cart_session_id` text NOT NULL,
	`product_id` text,
	`category_id` text,
	`item_name` text,
	`item_type` text NOT NULL,
	`quantity` integer,
	`weight` real,
	`unit_of_measure` text,
	`unit_price` real NOT NULL,
	`total_price` real NOT NULL,
	`tax_amount` real NOT NULL,
	`batch_id` text,
	`batch_number` text,
	`expiry_date` integer,
	`age_restriction_level` text DEFAULT 'NONE',
	`age_verified` integer DEFAULT false,
	`scale_reading_weight` real,
	`scale_reading_stable` integer DEFAULT true,
	`added_at` integer NOT NULL,
	`updated_at` integer,
	FOREIGN KEY (`cart_session_id`) REFERENCES `cart_sessions`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`product_id`) REFERENCES `products`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`category_id`) REFERENCES `categories`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`batch_id`) REFERENCES `product_batches`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
INSERT INTO `__new_cart_items`("id", "cart_session_id", "product_id", "category_id", "item_name", "item_type", "quantity", "weight", "unit_of_measure", "unit_price", "total_price", "tax_amount", "batch_id", "batch_number", "expiry_date", "age_restriction_level", "age_verified", "scale_reading_weight", "scale_reading_stable", "added_at", "updated_at") SELECT "id", "cart_session_id", "product_id", NULL as "category_id", NULL as "item_name", "item_type", "quantity", "weight", "unit_of_measure", "unit_price", "total_price", "tax_amount", "batch_id", "batch_number", "expiry_date", "age_restriction_level", "age_verified", "scale_reading_weight", "scale_reading_stable", "added_at", "updated_at" FROM `cart_items`;--> statement-breakpoint
DROP TABLE `cart_items`;--> statement-breakpoint
ALTER TABLE `__new_cart_items` RENAME TO `cart_items`;--> statement-breakpoint
PRAGMA foreign_keys=ON;--> statement-breakpoint
CREATE INDEX `cart_items_session_idx` ON `cart_items` (`cart_session_id`);--> statement-breakpoint
CREATE INDEX `cart_items_product_idx` ON `cart_items` (`product_id`);--> statement-breakpoint
CREATE INDEX `cart_items_category_idx` ON `cart_items` (`category_id`);--> statement-breakpoint
CREATE INDEX `cart_items_batch_idx` ON `cart_items` (`batch_id`);--> statement-breakpoint
CREATE INDEX `cart_items_type_idx` ON `cart_items` (`item_type`);