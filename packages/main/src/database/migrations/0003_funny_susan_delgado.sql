CREATE TABLE `cart_items` (
	`id` text PRIMARY KEY NOT NULL,
	`cart_session_id` text NOT NULL,
	`product_id` text NOT NULL,
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
	FOREIGN KEY (`product_id`) REFERENCES `products`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`batch_id`) REFERENCES `product_batches`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE INDEX `cart_items_session_idx` ON `cart_items` (`cart_session_id`);--> statement-breakpoint
CREATE INDEX `cart_items_product_idx` ON `cart_items` (`product_id`);--> statement-breakpoint
CREATE INDEX `cart_items_batch_idx` ON `cart_items` (`batch_id`);--> statement-breakpoint
CREATE INDEX `cart_items_type_idx` ON `cart_items` (`item_type`);--> statement-breakpoint
CREATE TABLE `cart_sessions` (
	`id` text PRIMARY KEY NOT NULL,
	`cashier_id` text NOT NULL,
	`shift_id` text NOT NULL,
	`business_id` text NOT NULL,
	`station_id` text,
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
	FOREIGN KEY (`shift_id`) REFERENCES `shifts`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`business_id`) REFERENCES `businesses`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`verified_by`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `cart_sessions_status_idx` ON `cart_sessions` (`status`,`cashier_id`);--> statement-breakpoint
CREATE INDEX `cart_sessions_created_idx` ON `cart_sessions` (`created_at`);--> statement-breakpoint
CREATE INDEX `cart_sessions_shift_idx` ON `cart_sessions` (`shift_id`);--> statement-breakpoint
CREATE INDEX `cart_sessions_business_idx` ON `cart_sessions` (`business_id`);--> statement-breakpoint
PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_transaction_items` (
	`id` text PRIMARY KEY NOT NULL,
	`transactionId` text NOT NULL,
	`productId` text NOT NULL,
	`productName` text NOT NULL,
	`item_type` text NOT NULL,
	`quantity` integer,
	`weight` real,
	`unit_of_measure` text,
	`unitPrice` real NOT NULL,
	`totalPrice` real NOT NULL,
	`tax_amount` real NOT NULL,
	`refundedQuantity` integer DEFAULT 0,
	`discountAmount` real DEFAULT 0,
	`appliedDiscounts` text,
	`batch_id` text,
	`batch_number` text,
	`expiry_date` integer,
	`age_restriction_level` text DEFAULT 'NONE',
	`age_verified` integer DEFAULT false,
	`cart_item_id` text,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`transactionId`) REFERENCES `transactions`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`productId`) REFERENCES `products`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`batch_id`) REFERENCES `product_batches`(`id`) ON UPDATE no action ON DELETE set null,
	FOREIGN KEY (`cart_item_id`) REFERENCES `cart_items`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
-- Copy data from old table, handling missing columns gracefully
-- Old table (0002) has: id, transactionId, productId, productName, quantity, unitPrice, totalPrice, refundedQuantity, weight, discountAmount, appliedDiscounts, created_at
-- Old table does NOT have: item_type, tax_amount, cart_item_id, unit_of_measure, batch_id, batch_number, expiry_date, age_restriction_level, age_verified
INSERT INTO `__new_transaction_items`(
  "id", "transactionId", "productId", "productName", "item_type", 
  "quantity", "weight", "unit_of_measure", "unitPrice", "totalPrice", 
  "tax_amount", "refundedQuantity", "discountAmount", "appliedDiscounts", 
  "batch_id", "batch_number", "expiry_date", "age_restriction_level", 
  "age_verified", "cart_item_id", "created_at"
) 
SELECT 
  "id", 
  "transactionId", 
  "productId", 
  "productName", 
  'UNIT' as "item_type",  -- New required column, default to UNIT for existing items
  "quantity", 
  "weight",  -- Old table has this column
  NULL as "unit_of_measure",  -- New column, not in old table
  "unitPrice", 
  "totalPrice", 
  0 as "tax_amount",  -- New required column, default to 0
  COALESCE("refundedQuantity", 0) as "refundedQuantity",
  COALESCE("discountAmount", 0) as "discountAmount",
  "appliedDiscounts", 
  NULL as "batch_id",  -- New column, not in old table
  NULL as "batch_number",  -- New column, not in old table
  NULL as "expiry_date",  -- New column, not in old table
  'NONE' as "age_restriction_level",  -- New column, default to NONE
  0 as "age_verified",  -- New column, default to false
  NULL as "cart_item_id",  -- New column, not in old table
  "created_at"
FROM `transaction_items`;--> statement-breakpoint
DROP TABLE `transaction_items`;--> statement-breakpoint
ALTER TABLE `__new_transaction_items` RENAME TO `transaction_items`;--> statement-breakpoint
PRAGMA foreign_keys=ON;