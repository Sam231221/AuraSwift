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
CREATE INDEX `idx_suppliers_businessId` ON `suppliers` (`businessId`);
--> statement-breakpoint
CREATE INDEX `idx_suppliers_name` ON `suppliers` (`name`);
--> statement-breakpoint
CREATE INDEX `idx_suppliers_isActive` ON `suppliers` (`isActive`);