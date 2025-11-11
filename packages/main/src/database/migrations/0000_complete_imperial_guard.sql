CREATE TABLE `app_settings` (
	`key` text PRIMARY KEY NOT NULL,
	`value` text NOT NULL,
	`createdAt` text NOT NULL,
	`updatedAt` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `applied_modifiers` (
	`id` text PRIMARY KEY NOT NULL,
	`transactionItemId` text NOT NULL,
	`modifierId` text NOT NULL,
	`modifierName` text NOT NULL,
	`optionId` text NOT NULL,
	`optionName` text NOT NULL,
	`price` real NOT NULL,
	`createdAt` text NOT NULL,
	FOREIGN KEY (`transactionItemId`) REFERENCES `transaction_items`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`modifierId`) REFERENCES `modifiers`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `audit_logs` (
	`id` text PRIMARY KEY NOT NULL,
	`userId` text NOT NULL,
	`action` text NOT NULL,
	`resource` text NOT NULL,
	`resourceId` text NOT NULL,
	`details` text,
	`timestamp` text NOT NULL,
	`createdAt` text NOT NULL,
	FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `businesses` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`ownerId` text NOT NULL,
	`address` text DEFAULT '',
	`phone` text DEFAULT '',
	`vatNumber` text DEFAULT '',
	`createdAt` text NOT NULL,
	`updatedAt` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `cash_drawer_counts` (
	`id` text PRIMARY KEY NOT NULL,
	`shiftId` text NOT NULL,
	`businessId` text NOT NULL,
	`countType` text NOT NULL,
	`expectedAmount` real NOT NULL,
	`countedAmount` real NOT NULL,
	`variance` real NOT NULL,
	`notes` text,
	`countedBy` text NOT NULL,
	`timestamp` text NOT NULL,
	`createdAt` text NOT NULL,
	FOREIGN KEY (`shiftId`) REFERENCES `shifts`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`businessId`) REFERENCES `businesses`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`countedBy`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `categories` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`parentId` text,
	`description` text,
	`businessId` text NOT NULL,
	`isActive` integer DEFAULT true,
	`sortOrder` integer DEFAULT 0,
	`createdAt` text NOT NULL,
	`updatedAt` text NOT NULL,
	FOREIGN KEY (`parentId`) REFERENCES `categories`(`id`) ON UPDATE no action ON DELETE set null,
	FOREIGN KEY (`businessId`) REFERENCES `businesses`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `discounts` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`description` text,
	`type` text NOT NULL,
	`value` real NOT NULL,
	`businessId` text NOT NULL,
	`applicableTo` text NOT NULL,
	`categoryIds` text,
	`productIds` text,
	`buyQuantity` integer,
	`getQuantity` integer,
	`getDiscountType` text,
	`getDiscountValue` real,
	`minPurchaseAmount` real,
	`minQuantity` integer,
	`maxDiscountAmount` real,
	`startDate` text,
	`endDate` text,
	`isActive` integer DEFAULT true,
	`usageLimit` integer,
	`usageCount` integer DEFAULT 0,
	`perCustomerLimit` integer,
	`priority` integer DEFAULT 0,
	`daysOfWeek` text,
	`timeStart` text,
	`timeEnd` text,
	`requiresCouponCode` integer DEFAULT false,
	`couponCode` text,
	`combinableWithOthers` integer DEFAULT true,
	`createdAt` text NOT NULL,
	`updatedAt` text NOT NULL,
	`createdBy` text NOT NULL,
	FOREIGN KEY (`businessId`) REFERENCES `businesses`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`createdBy`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `modifier_options` (
	`id` text PRIMARY KEY NOT NULL,
	`modifierId` text NOT NULL,
	`name` text NOT NULL,
	`price` real DEFAULT 0,
	`createdAt` text NOT NULL,
	FOREIGN KEY (`modifierId`) REFERENCES `modifiers`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `modifiers` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`type` text NOT NULL,
	`required` integer DEFAULT false,
	`businessId` text NOT NULL,
	`createdAt` text NOT NULL,
	`updatedAt` text NOT NULL,
	FOREIGN KEY (`businessId`) REFERENCES `businesses`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `print_job_retries` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`job_id` text NOT NULL,
	`attempt` integer NOT NULL,
	`error` text NOT NULL,
	`timestamp` text NOT NULL,
	`next_retry_at` text NOT NULL,
	FOREIGN KEY (`job_id`) REFERENCES `print_jobs`(`job_id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `print_jobs` (
	`job_id` text PRIMARY KEY NOT NULL,
	`printer_name` text NOT NULL,
	`document_path` text,
	`document_type` text NOT NULL,
	`status` text NOT NULL,
	`options` text,
	`metadata` text,
	`created_by` text,
	`business_id` text,
	`created_at` text NOT NULL,
	`started_at` text,
	`completed_at` text,
	`last_retry_at` text,
	`retry_count` integer DEFAULT 0,
	`progress` integer DEFAULT 0,
	`pages_total` integer,
	`pages_printed` integer,
	`error` text,
	FOREIGN KEY (`created_by`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`business_id`) REFERENCES `businesses`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `product_modifiers` (
	`productId` text NOT NULL,
	`modifierId` text NOT NULL,
	FOREIGN KEY (`productId`) REFERENCES `products`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`modifierId`) REFERENCES `modifiers`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `products` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`description` text,
	`price` real NOT NULL,
	`costPrice` real DEFAULT 0,
	`taxRate` real DEFAULT 0,
	`sku` text NOT NULL,
	`plu` text,
	`image` text,
	`category` text NOT NULL,
	`stockLevel` integer DEFAULT 0,
	`minStockLevel` integer DEFAULT 0,
	`businessId` text NOT NULL,
	`isActive` integer DEFAULT true,
	`requiresWeight` integer DEFAULT false,
	`unit` text DEFAULT 'each',
	`pricePerUnit` real,
	`createdAt` text NOT NULL,
	`updatedAt` text NOT NULL,
	FOREIGN KEY (`category`) REFERENCES `categories`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`businessId`) REFERENCES `businesses`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `products_sku_unique` ON `products` (`sku`);--> statement-breakpoint
CREATE UNIQUE INDEX `products_plu_unique` ON `products` (`plu`);--> statement-breakpoint
CREATE TABLE `schedules` (
	`id` text PRIMARY KEY NOT NULL,
	`staffId` text NOT NULL,
	`businessId` text NOT NULL,
	`startTime` text NOT NULL,
	`endTime` text NOT NULL,
	`status` text NOT NULL,
	`assignedRegister` text,
	`notes` text,
	`createdAt` text NOT NULL,
	`updatedAt` text NOT NULL,
	FOREIGN KEY (`staffId`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`businessId`) REFERENCES `businesses`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `sessions` (
	`id` text PRIMARY KEY NOT NULL,
	`userId` text NOT NULL,
	`token` text NOT NULL,
	`expiresAt` text NOT NULL,
	`createdAt` text NOT NULL,
	FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `sessions_token_unique` ON `sessions` (`token`);--> statement-breakpoint
CREATE TABLE `shifts` (
	`id` text PRIMARY KEY NOT NULL,
	`scheduleId` text,
	`cashierId` text NOT NULL,
	`businessId` text NOT NULL,
	`startTime` text NOT NULL,
	`endTime` text,
	`status` text NOT NULL,
	`startingCash` real NOT NULL,
	`finalCashDrawer` real,
	`expectedCashDrawer` real,
	`cashVariance` real,
	`totalSales` real DEFAULT 0,
	`totalTransactions` integer DEFAULT 0,
	`totalRefunds` real DEFAULT 0,
	`totalVoids` real DEFAULT 0,
	`notes` text,
	`createdAt` text NOT NULL,
	`updatedAt` text NOT NULL,
	FOREIGN KEY (`scheduleId`) REFERENCES `schedules`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`cashierId`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`businessId`) REFERENCES `businesses`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `stock_adjustments` (
	`id` text PRIMARY KEY NOT NULL,
	`productId` text NOT NULL,
	`type` text NOT NULL,
	`quantity` integer NOT NULL,
	`reason` text,
	`userId` text NOT NULL,
	`businessId` text NOT NULL,
	`timestamp` text NOT NULL,
	FOREIGN KEY (`productId`) REFERENCES `products`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`businessId`) REFERENCES `businesses`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `suppliers` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`contactPerson` text,
	`email` text,
	`phone` text,
	`address` text,
	`city` text,
	`country` text,
	`taxId` text,
	`paymentTerms` text,
	`businessId` text NOT NULL,
	`isActive` integer DEFAULT true,
	`notes` text,
	`createdAt` text NOT NULL,
	`updatedAt` text NOT NULL,
	FOREIGN KEY (`businessId`) REFERENCES `businesses`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `transaction_items` (
	`id` text PRIMARY KEY NOT NULL,
	`transactionId` text NOT NULL,
	`productId` text NOT NULL,
	`productName` text NOT NULL,
	`quantity` integer NOT NULL,
	`unitPrice` real NOT NULL,
	`totalPrice` real NOT NULL,
	`refundedQuantity` integer DEFAULT 0,
	`weight` real,
	`discountAmount` real DEFAULT 0,
	`appliedDiscounts` text,
	`createdAt` text NOT NULL,
	FOREIGN KEY (`transactionId`) REFERENCES `transactions`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`productId`) REFERENCES `products`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `transactions` (
	`id` text PRIMARY KEY NOT NULL,
	`shiftId` text NOT NULL,
	`businessId` text NOT NULL,
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
	`createdAt` text NOT NULL,
	`originalTransactionId` text,
	`refundReason` text,
	`refundMethod` text,
	`managerApprovalId` text,
	`isPartialRefund` integer DEFAULT false,
	`discountAmount` real DEFAULT 0,
	`appliedDiscounts` text,
	FOREIGN KEY (`shiftId`) REFERENCES `shifts`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`businessId`) REFERENCES `businesses`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`originalTransactionId`) REFERENCES `transactions`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`managerApprovalId`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `users` (
	`id` text PRIMARY KEY NOT NULL,
	`username` text NOT NULL,
	`email` text,
	`password` text,
	`pin` text NOT NULL,
	`firstName` text NOT NULL,
	`lastName` text NOT NULL,
	`businessName` text NOT NULL,
	`role` text NOT NULL,
	`businessId` text NOT NULL,
	`permissions` text NOT NULL,
	`createdAt` text NOT NULL,
	`updatedAt` text NOT NULL,
	`isActive` integer DEFAULT true,
	`address` text DEFAULT '',
	FOREIGN KEY (`businessId`) REFERENCES `businesses`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `users_username_unique` ON `users` (`username`);