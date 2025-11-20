PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_transaction_items` (
	`id` text PRIMARY KEY NOT NULL,
	`transactionId` text NOT NULL,
	`productId` text,
	`category_id` text,
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
	`updated_at` integer,
	FOREIGN KEY (`transactionId`) REFERENCES `transactions`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`productId`) REFERENCES `products`(`id`) ON UPDATE no action ON DELETE set null,
	FOREIGN KEY (`category_id`) REFERENCES `categories`(`id`) ON UPDATE no action ON DELETE set null,
	FOREIGN KEY (`batch_id`) REFERENCES `product_batches`(`id`) ON UPDATE no action ON DELETE set null,
	FOREIGN KEY (`cart_item_id`) REFERENCES `cart_items`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
INSERT INTO `__new_transaction_items`("id", "transactionId", "productId", "category_id", "productName", "item_type", "quantity", "weight", "unit_of_measure", "unitPrice", "totalPrice", "tax_amount", "refundedQuantity", "discountAmount", "appliedDiscounts", "batch_id", "batch_number", "expiry_date", "age_restriction_level", "age_verified", "cart_item_id", "created_at", "updated_at") SELECT "id", "transactionId", "productId", NULL as "category_id", "productName", "item_type", "quantity", "weight", "unit_of_measure", "unitPrice", "totalPrice", "tax_amount", "refundedQuantity", "discountAmount", "appliedDiscounts", "batch_id", "batch_number", "expiry_date", "age_restriction_level", "age_verified", "cart_item_id", "created_at", "updated_at" FROM `transaction_items`;--> statement-breakpoint
DROP TABLE `transaction_items`;--> statement-breakpoint
ALTER TABLE `__new_transaction_items` RENAME TO `transaction_items`;--> statement-breakpoint
PRAGMA foreign_keys=ON;