PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_transactions` (
	`id` text PRIMARY KEY NOT NULL,
	`shiftId` text,
	`businessId` text NOT NULL,
	`terminal_id` text,
	`type` text NOT NULL,
	`subtotal` real NOT NULL,
	`tax` real NOT NULL,
	`total` real NOT NULL,
	`paymentMethod` text NOT NULL,
	`cashAmount` real,
	`cardAmount` real,
	`status` text NOT NULL,
	`voidReason` text,
	`customerId` text,
	`receiptNumber` text NOT NULL,
	`timestamp` text NOT NULL,
	`created_at` integer NOT NULL,
	`originalTransactionId` text,
	`refundReason` text,
	`refundMethod` text,
	`managerApprovalId` text,
	`isPartialRefund` integer DEFAULT false,
	`discountAmount` real DEFAULT 0,
	`appliedDiscounts` text,
	FOREIGN KEY (`shiftId`) REFERENCES `shifts`(`id`) ON UPDATE no action ON DELETE set null,
	FOREIGN KEY (`businessId`) REFERENCES `businesses`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`terminal_id`) REFERENCES `terminals`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`originalTransactionId`) REFERENCES `transactions`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`managerApprovalId`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
INSERT INTO `__new_transactions`("id", "shiftId", "businessId", "terminal_id", "type", "subtotal", "tax", "total", "paymentMethod", "cashAmount", "cardAmount", "status", "voidReason", "customerId", "receiptNumber", "timestamp", "created_at", "originalTransactionId", "refundReason", "refundMethod", "managerApprovalId", "isPartialRefund", "discountAmount", "appliedDiscounts") SELECT "id", "shiftId", "businessId", "terminal_id", "type", "subtotal", "tax", "total", "paymentMethod", "cashAmount", "cardAmount", "status", "voidReason", "customerId", "receiptNumber", "timestamp", "created_at", "originalTransactionId", "refundReason", "refundMethod", "managerApprovalId", "isPartialRefund", "discountAmount", "appliedDiscounts" FROM `transactions`;--> statement-breakpoint
DROP TABLE `transactions`;--> statement-breakpoint
ALTER TABLE `__new_transactions` RENAME TO `transactions`;--> statement-breakpoint
PRAGMA foreign_keys=ON;--> statement-breakpoint
ALTER TABLE `roles` ADD `shift_required` integer DEFAULT true;