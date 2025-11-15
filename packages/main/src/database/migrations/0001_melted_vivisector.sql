CREATE TABLE `vat_categories` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`rate_percent` real NOT NULL,
	`code` text NOT NULL,
	`description` text,
	`business_id` text NOT NULL,
	`is_default` integer DEFAULT false,
	`is_active` integer DEFAULT true,
	`createdAt` integer NOT NULL,
	`updatedAt` integer NOT NULL,
	FOREIGN KEY (`business_id`) REFERENCES `businesses`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `vat_business_idx` ON `vat_categories` (`business_id`);--> statement-breakpoint
CREATE INDEX `vat_code_idx` ON `vat_categories` (`code`);--> statement-breakpoint
DROP TABLE `applied_modifiers`;--> statement-breakpoint
DROP TABLE `modifier_options`;--> statement-breakpoint
DROP TABLE `modifiers`;--> statement-breakpoint
DROP TABLE `product_modifiers`;--> statement-breakpoint
DROP TABLE `suppliers`;--> statement-breakpoint
PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_categories` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`parent_id` text,
	`description` text,
	`vat_category_id` text,
	`business_id` text NOT NULL,
	`sort_order` integer DEFAULT 0,
	`color` text,
	`image` text,
	`is_active` integer DEFAULT true,
	`createdAt` integer NOT NULL,
	`updatedAt` integer NOT NULL,
	FOREIGN KEY (`parent_id`) REFERENCES `categories`(`id`) ON UPDATE no action ON DELETE set null,
	FOREIGN KEY (`vat_category_id`) REFERENCES `vat_categories`(`id`) ON UPDATE no action ON DELETE set null,
	FOREIGN KEY (`business_id`) REFERENCES `businesses`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
INSERT INTO `__new_categories`("id", "name", "parent_id", "description", "vat_category_id", "business_id", "sort_order", "color", "image", "is_active", "createdAt", "updatedAt") SELECT "id", "name", "parent_id", "description", "vat_category_id", "business_id", "sort_order", "color", "image", "is_active", "createdAt", "updatedAt" FROM `categories`;--> statement-breakpoint
DROP TABLE `categories`;--> statement-breakpoint
ALTER TABLE `__new_categories` RENAME TO `categories`;--> statement-breakpoint
PRAGMA foreign_keys=ON;--> statement-breakpoint
CREATE INDEX `categories_business_idx` ON `categories` (`business_id`);--> statement-breakpoint
CREATE INDEX `categories_parent_idx` ON `categories` (`parent_id`);--> statement-breakpoint
CREATE INDEX `categories_vat_idx` ON `categories` (`vat_category_id`);--> statement-breakpoint
CREATE UNIQUE INDEX `category_name_business_unique` ON `categories` (`name`,`business_id`);--> statement-breakpoint
CREATE TABLE `__new_products` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`description` text,
	`base_price` real NOT NULL,
	`cost_price` real DEFAULT 0,
	`sku` text NOT NULL,
	`barcode` text,
	`plu` text,
	`image` text,
	`category_id` text,
	`product_type` text DEFAULT 'STANDARD' NOT NULL,
	`sales_unit` text DEFAULT 'PIECE' NOT NULL,
	`uses_scale` integer DEFAULT false,
	`price_per_kg` real,
	`is_generic_button` integer DEFAULT false,
	`generic_default_price` real,
	`track_inventory` integer DEFAULT true,
	`stock_level` real DEFAULT 0,
	`min_stock_level` real DEFAULT 0,
	`reorder_point` real DEFAULT 0,
	`vat_category_id` text,
	`business_id` text NOT NULL,
	`is_active` integer DEFAULT true,
	`allow_price_override` integer DEFAULT false,
	`allow_discount` integer DEFAULT true,
	`createdAt` integer NOT NULL,
	`updatedAt` integer NOT NULL,
	FOREIGN KEY (`category_id`) REFERENCES `categories`(`id`) ON UPDATE no action ON DELETE set null,
	FOREIGN KEY (`vat_category_id`) REFERENCES `vat_categories`(`id`) ON UPDATE no action ON DELETE set null,
	FOREIGN KEY (`business_id`) REFERENCES `businesses`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
INSERT INTO `__new_products`("id", "name", "description", "base_price", "cost_price", "sku", "barcode", "plu", "image", "category_id", "product_type", "sales_unit", "uses_scale", "price_per_kg", "is_generic_button", "generic_default_price", "track_inventory", "stock_level", "min_stock_level", "reorder_point", "vat_category_id", "business_id", "is_active", "allow_price_override", "allow_discount", "createdAt", "updatedAt") SELECT "id", "name", "description", "base_price", "cost_price", "sku", "barcode", "plu", "image", "category_id", "product_type", "sales_unit", "uses_scale", "price_per_kg", "is_generic_button", "generic_default_price", "track_inventory", "stock_level", "min_stock_level", "reorder_point", "vat_category_id", "business_id", "is_active", "allow_price_override", "allow_discount", "createdAt", "updatedAt" FROM `products`;--> statement-breakpoint
DROP TABLE `products`;--> statement-breakpoint
ALTER TABLE `__new_products` RENAME TO `products`;--> statement-breakpoint
CREATE INDEX `products_business_idx` ON `products` (`business_id`);--> statement-breakpoint
CREATE INDEX `products_category_idx` ON `products` (`category_id`);--> statement-breakpoint
CREATE INDEX `products_sku_idx` ON `products` (`sku`);--> statement-breakpoint
CREATE INDEX `products_barcode_idx` ON `products` (`barcode`);--> statement-breakpoint
CREATE INDEX `products_plu_idx` ON `products` (`plu`);--> statement-breakpoint
CREATE INDEX `products_type_idx` ON `products` (`product_type`);--> statement-breakpoint
CREATE UNIQUE INDEX `product_sku_business_unique` ON `products` (`sku`,`business_id`);--> statement-breakpoint
CREATE TABLE `__new_users` (
	`id` text PRIMARY KEY NOT NULL,
	`username` text NOT NULL,
	`email` text,
	`password_hash` text,
	`pin_hash` text NOT NULL,
	`salt` text NOT NULL,
	`firstName` text NOT NULL,
	`lastName` text NOT NULL,
	`businessName` text NOT NULL,
	`role` text NOT NULL,
	`businessId` text NOT NULL,
	`permissions` text NOT NULL,
	`createdAt` integer NOT NULL,
	`updatedAt` integer NOT NULL,
	`lastLoginAt` integer,
	`isActive` integer DEFAULT true,
	`login_attempts` integer DEFAULT 0,
	`locked_until` integer,
	`address` text DEFAULT '',
	FOREIGN KEY (`businessId`) REFERENCES `businesses`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
INSERT INTO `__new_users`("id", "username", "email", "password_hash", "pin_hash", "salt", "firstName", "lastName", "businessName", "role", "businessId", "permissions", "createdAt", "updatedAt", "lastLoginAt", "isActive", "login_attempts", "locked_until", "address") SELECT "id", "username", "email", "password_hash", "pin_hash", "salt", "firstName", "lastName", "businessName", "role", "businessId", "permissions", "createdAt", "updatedAt", "lastLoginAt", "isActive", "login_attempts", "locked_until", "address" FROM `users`;--> statement-breakpoint
DROP TABLE `users`;--> statement-breakpoint
ALTER TABLE `__new_users` RENAME TO `users`;--> statement-breakpoint
CREATE UNIQUE INDEX `users_username_unique` ON `users` (`username`);--> statement-breakpoint
CREATE UNIQUE INDEX `users_email_unique` ON `users` (`email`);--> statement-breakpoint
CREATE TABLE `__new_businesses` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`ownerId` text NOT NULL,
	`email` text DEFAULT '',
	`phone` text DEFAULT '',
	`website` text DEFAULT '',
	`address` text DEFAULT '',
	`country` text DEFAULT '' NOT NULL,
	`city` text DEFAULT '' NOT NULL,
	`postalCode` text DEFAULT '',
	`vatNumber` text DEFAULT '',
	`businessType` text DEFAULT 'retail' NOT NULL,
	`currency` text DEFAULT 'USD' NOT NULL,
	`timezone` text DEFAULT 'UTC' NOT NULL,
	`isActive` integer DEFAULT true,
	`createdAt` integer NOT NULL,
	`updatedAt` integer NOT NULL,
	FOREIGN KEY (`ownerId`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
INSERT INTO `__new_businesses`("id", "name", "ownerId", "email", "phone", "website", "address", "country", "city", "postalCode", "vatNumber", "businessType", "currency", "timezone", "isActive", "createdAt", "updatedAt") SELECT "id", "name", "ownerId", "email", "phone", "website", "address", "country", "city", "postalCode", "vatNumber", "businessType", "currency", "timezone", "isActive", "createdAt", "updatedAt" FROM `businesses`;--> statement-breakpoint
DROP TABLE `businesses`;--> statement-breakpoint
ALTER TABLE `__new_businesses` RENAME TO `businesses`;--> statement-breakpoint
CREATE UNIQUE INDEX `businesses_vatNumber_unique` ON `businesses` (`vatNumber`);--> statement-breakpoint
ALTER TABLE `stock_adjustments` ADD `note` text;