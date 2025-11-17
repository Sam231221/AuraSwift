CREATE TABLE `app_settings` (
	`key` text PRIMARY KEY NOT NULL,
	`value` text NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer
);
--> statement-breakpoint
CREATE TABLE `attendance_reports` (
	`id` text PRIMARY KEY NOT NULL,
	`business_id` text NOT NULL,
	`user_id` text NOT NULL,
	`user_name` text NOT NULL,
	`period_start_date` text NOT NULL,
	`period_end_date` text NOT NULL,
	`period_type` text NOT NULL,
	`total_shifts` integer DEFAULT 0 NOT NULL,
	`completed_shifts` integer DEFAULT 0 NOT NULL,
	`incomplete_shifts` integer DEFAULT 0 NOT NULL,
	`total_hours` real DEFAULT 0 NOT NULL,
	`regular_hours` real DEFAULT 0 NOT NULL,
	`overtime_hours` real DEFAULT 0 NOT NULL,
	`late_clock_ins` integer DEFAULT 0 NOT NULL,
	`missed_clock_outs` integer DEFAULT 0 NOT NULL,
	`tardiness_minutes` integer DEFAULT 0 NOT NULL,
	`average_hours_per_shift` real DEFAULT 0 NOT NULL,
	`average_tardiness_minutes` real DEFAULT 0 NOT NULL,
	`report_generated_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`data_up_to` text NOT NULL
);
--> statement-breakpoint
CREATE INDEX `attendance_report_user_period_idx` ON `attendance_reports` (`user_id`,`period_start_date`);--> statement-breakpoint
CREATE INDEX `attendance_report_business_period_idx` ON `attendance_reports` (`business_id`,`period_type`);--> statement-breakpoint
CREATE INDEX `attendance_report_generated_at_idx` ON `attendance_reports` (`report_generated_at`);--> statement-breakpoint
CREATE UNIQUE INDEX `attendance_report_unique` ON `attendance_reports` (`user_id`,`period_start_date`,`period_end_date`,`business_id`);--> statement-breakpoint
CREATE TABLE `audit_logs` (
	`id` text PRIMARY KEY NOT NULL,
	`userId` text NOT NULL,
	`action` text NOT NULL,
	`resource` text NOT NULL,
	`resourceId` text NOT NULL,
	`entityType` text,
	`entityId` text,
	`details` text,
	`ipAddress` text,
	`terminalId` text,
	`timestamp` text NOT NULL,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `breaks` (
	`id` text PRIMARY KEY NOT NULL,
	`shiftId` text NOT NULL,
	`userId` text NOT NULL,
	`type` text DEFAULT 'rest' NOT NULL,
	`startTime` text NOT NULL,
	`endTime` text,
	`duration` integer,
	`isPaid` integer DEFAULT false,
	`status` text DEFAULT 'active' NOT NULL,
	`notes` text,
	`created_at` integer NOT NULL,
	`updated_at` integer,
	FOREIGN KEY (`shiftId`) REFERENCES `time_shifts`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `businesses` (
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
	`created_at` integer NOT NULL,
	`updated_at` integer
);
--> statement-breakpoint
CREATE UNIQUE INDEX `businesses_vatNumber_unique` ON `businesses` (`vatNumber`);--> statement-breakpoint
CREATE TABLE `cash_drawer_counts` (
	`id` text PRIMARY KEY NOT NULL,
	`business_id` text NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP,
	`shift_id` text NOT NULL,
	`count_type` text NOT NULL,
	`expected_amount` real NOT NULL,
	`counted_amount` real NOT NULL,
	`variance` real NOT NULL,
	`notes` text,
	`counted_by` text NOT NULL,
	`timestamp` text NOT NULL,
	FOREIGN KEY (`shift_id`) REFERENCES `shifts`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`counted_by`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `cash_drawer_counts_shift_idx` ON `cash_drawer_counts` (`shift_id`);--> statement-breakpoint
CREATE INDEX `cash_drawer_counts_business_idx` ON `cash_drawer_counts` (`business_id`);--> statement-breakpoint
CREATE INDEX `cash_drawer_counts_timestamp_idx` ON `cash_drawer_counts` (`timestamp`);--> statement-breakpoint
CREATE INDEX `cash_drawer_counts_counted_by_idx` ON `cash_drawer_counts` (`counted_by`);--> statement-breakpoint
CREATE UNIQUE INDEX `cash_drawer_counts_shift_type_unique` ON `cash_drawer_counts` (`shift_id`,`count_type`);--> statement-breakpoint
CREATE TABLE `categories` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`parent_id` text,
	`description` text,
	`vat_category_id` text,
	`vat_override_percent` real,
	`business_id` text NOT NULL,
	`sort_order` integer DEFAULT 0,
	`color` text,
	`image` text,
	`is_active` integer DEFAULT true,
	`created_at` integer NOT NULL,
	`updated_at` integer,
	FOREIGN KEY (`parent_id`) REFERENCES `categories`(`id`) ON UPDATE no action ON DELETE set null,
	FOREIGN KEY (`vat_category_id`) REFERENCES `vat_categories`(`id`) ON UPDATE no action ON DELETE set null,
	FOREIGN KEY (`business_id`) REFERENCES `businesses`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `categories_business_idx` ON `categories` (`business_id`);--> statement-breakpoint
CREATE INDEX `categories_parent_idx` ON `categories` (`parent_id`);--> statement-breakpoint
CREATE INDEX `categories_vat_idx` ON `categories` (`vat_category_id`);--> statement-breakpoint
CREATE UNIQUE INDEX `category_name_business_unique` ON `categories` (`name`,`business_id`);--> statement-breakpoint
CREATE TABLE `clock_events` (
	`id` text PRIMARY KEY NOT NULL,
	`userId` text NOT NULL,
	`terminalId` text NOT NULL,
	`locationId` text,
	`type` text NOT NULL,
	`timestamp` text NOT NULL,
	`method` text NOT NULL,
	`status` text DEFAULT 'confirmed' NOT NULL,
	`geolocation` text,
	`ipAddress` text,
	`notes` text,
	`created_at` integer NOT NULL,
	`updated_at` integer,
	FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
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
	`created_at` integer NOT NULL,
	`updated_at` integer,
	`createdBy` text NOT NULL,
	FOREIGN KEY (`businessId`) REFERENCES `businesses`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`createdBy`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `expiry_notifications` (
	`id` text PRIMARY KEY NOT NULL,
	`product_batch_id` text NOT NULL,
	`notification_type` text NOT NULL,
	`days_until_expiry` integer NOT NULL,
	`message` text NOT NULL,
	`status` text DEFAULT 'PENDING' NOT NULL,
	`channels` text DEFAULT '[]' NOT NULL,
	`acknowledged_by` text,
	`acknowledged_at` integer,
	`business_id` text NOT NULL,
	`scheduled_for` integer NOT NULL,
	`sent_at` integer,
	`created_at` integer NOT NULL,
	`updated_at` integer,
	FOREIGN KEY (`product_batch_id`) REFERENCES `product_batches`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`acknowledged_by`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`business_id`) REFERENCES `businesses`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `notifications_batch_idx` ON `expiry_notifications` (`product_batch_id`);--> statement-breakpoint
CREATE INDEX `notifications_status_idx` ON `expiry_notifications` (`status`);--> statement-breakpoint
CREATE INDEX `notifications_scheduled_idx` ON `expiry_notifications` (`scheduled_for`);--> statement-breakpoint
CREATE INDEX `notifications_business_idx` ON `expiry_notifications` (`business_id`);--> statement-breakpoint
CREATE INDEX `notifications_type_idx` ON `expiry_notifications` (`notification_type`);--> statement-breakpoint
CREATE TABLE `expiry_settings` (
	`id` text PRIMARY KEY NOT NULL,
	`business_id` text NOT NULL,
	`critical_alert_days` integer DEFAULT 3 NOT NULL,
	`warning_alert_days` integer DEFAULT 7 NOT NULL,
	`info_alert_days` integer DEFAULT 14 NOT NULL,
	`notify_via_email` integer DEFAULT true,
	`notify_via_push` integer DEFAULT true,
	`notify_via_dashboard` integer DEFAULT true,
	`auto_disable_expired` integer DEFAULT true,
	`allow_sell_near_expiry` integer DEFAULT false,
	`near_expiry_threshold` integer DEFAULT 2,
	`notification_recipients` text DEFAULT '[]' NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer,
	FOREIGN KEY (`business_id`) REFERENCES `businesses`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `expiry_settings_business_idx` ON `expiry_settings` (`business_id`);--> statement-breakpoint
CREATE UNIQUE INDEX `expiry_settings_business_unique` ON `expiry_settings` (`business_id`);--> statement-breakpoint
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
CREATE TABLE `product_batches` (
	`id` text PRIMARY KEY NOT NULL,
	`product_id` text NOT NULL,
	`batch_number` text NOT NULL,
	`manufacturing_date` integer,
	`expiry_date` integer NOT NULL,
	`initial_quantity` real NOT NULL,
	`current_quantity` real NOT NULL,
	`supplier_id` text,
	`purchase_order_number` text,
	`cost_price` real,
	`status` text DEFAULT 'ACTIVE' NOT NULL,
	`business_id` text NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer,
	FOREIGN KEY (`product_id`) REFERENCES `products`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`supplier_id`) REFERENCES `suppliers`(`id`) ON UPDATE no action ON DELETE set null,
	FOREIGN KEY (`business_id`) REFERENCES `businesses`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `batches_product_idx` ON `product_batches` (`product_id`);--> statement-breakpoint
CREATE INDEX `batches_expiry_idx` ON `product_batches` (`expiry_date`);--> statement-breakpoint
CREATE INDEX `batches_status_idx` ON `product_batches` (`status`);--> statement-breakpoint
CREATE INDEX `batches_business_idx` ON `product_batches` (`business_id`);--> statement-breakpoint
CREATE INDEX `batches_number_idx` ON `product_batches` (`batch_number`);--> statement-breakpoint
CREATE INDEX `batches_supplier_idx` ON `product_batches` (`supplier_id`);--> statement-breakpoint
CREATE INDEX `batches_product_status_expiry_idx` ON `product_batches` (`product_id`,`status`,`expiry_date`);--> statement-breakpoint
CREATE INDEX `batches_business_status_expiry_idx` ON `product_batches` (`business_id`,`status`,`expiry_date`);--> statement-breakpoint
CREATE INDEX `batches_product_status_quantity_idx` ON `product_batches` (`product_id`,`status`,`current_quantity`);--> statement-breakpoint
CREATE UNIQUE INDEX `batch_number_product_business_unique` ON `product_batches` (`batch_number`,`product_id`,`business_id`);--> statement-breakpoint
CREATE TABLE `products` (
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
	`vat_override_percent` real,
	`business_id` text NOT NULL,
	`is_active` integer DEFAULT true,
	`allow_price_override` integer DEFAULT false,
	`allow_discount` integer DEFAULT true,
	`has_expiry` integer DEFAULT false,
	`shelf_life_days` integer,
	`requires_batch_tracking` integer DEFAULT false,
	`stock_rotation_method` text DEFAULT 'FIFO',
	`created_at` integer NOT NULL,
	`updated_at` integer,
	FOREIGN KEY (`category_id`) REFERENCES `categories`(`id`) ON UPDATE no action ON DELETE set null,
	FOREIGN KEY (`vat_category_id`) REFERENCES `vat_categories`(`id`) ON UPDATE no action ON DELETE set null,
	FOREIGN KEY (`business_id`) REFERENCES `businesses`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `products_business_idx` ON `products` (`business_id`);--> statement-breakpoint
CREATE INDEX `products_category_idx` ON `products` (`category_id`);--> statement-breakpoint
CREATE INDEX `products_sku_idx` ON `products` (`sku`);--> statement-breakpoint
CREATE INDEX `products_barcode_idx` ON `products` (`barcode`);--> statement-breakpoint
CREATE INDEX `products_plu_idx` ON `products` (`plu`);--> statement-breakpoint
CREATE INDEX `products_type_idx` ON `products` (`product_type`);--> statement-breakpoint
CREATE UNIQUE INDEX `product_sku_business_unique` ON `products` (`sku`,`business_id`);--> statement-breakpoint
CREATE TABLE `schedules` (
	`id` text PRIMARY KEY NOT NULL,
	`staffId` text NOT NULL,
	`businessId` text NOT NULL,
	`startTime` text NOT NULL,
	`endTime` text NOT NULL,
	`status` text NOT NULL,
	`assignedRegister` text,
	`notes` text,
	`created_at` integer NOT NULL,
	`updated_at` integer,
	FOREIGN KEY (`staffId`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`businessId`) REFERENCES `businesses`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `sessions` (
	`id` text PRIMARY KEY NOT NULL,
	`userId` text NOT NULL,
	`token` text NOT NULL,
	`expiresAt` text NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer,
	FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `sessions_token_unique` ON `sessions` (`token`);--> statement-breakpoint
CREATE TABLE `pos_shift_reports` (
	`id` text PRIMARY KEY NOT NULL,
	`business_id` text NOT NULL,
	`shift_id` text NOT NULL,
	`user_id` text NOT NULL,
	`user_name` text NOT NULL,
	`total_sales` real DEFAULT 0 NOT NULL,
	`total_refunds` real DEFAULT 0 NOT NULL,
	`total_voids` real DEFAULT 0 NOT NULL,
	`net_sales` real DEFAULT 0 NOT NULL,
	`transaction_count` integer DEFAULT 0 NOT NULL,
	`average_transaction_value` real DEFAULT 0 NOT NULL,
	`expected_cash_amount` real DEFAULT 0 NOT NULL,
	`counted_cash_amount` real DEFAULT 0 NOT NULL,
	`cash_variance` real DEFAULT 0 NOT NULL,
	`planned_start` text,
	`actual_start` text NOT NULL,
	`planned_end` text,
	`actual_end` text,
	`shift_duration_minutes` integer DEFAULT 0 NOT NULL,
	`late_minutes` integer DEFAULT 0,
	`early_minutes` integer DEFAULT 0,
	`report_generated_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`period_covered` text NOT NULL
);
--> statement-breakpoint
CREATE INDEX `shift_report_view_shift_idx` ON `pos_shift_reports` (`shift_id`);--> statement-breakpoint
CREATE INDEX `shift_report_view_business_idx` ON `pos_shift_reports` (`business_id`);--> statement-breakpoint
CREATE INDEX `shift_report_view_user_idx` ON `pos_shift_reports` (`user_id`);--> statement-breakpoint
CREATE INDEX `shift_report_view_period_idx` ON `pos_shift_reports` (`period_covered`);--> statement-breakpoint
CREATE INDEX `shift_report_view_generated_at_idx` ON `pos_shift_reports` (`report_generated_at`);--> statement-breakpoint
CREATE TABLE `shift_validation_issues` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`public_id` text NOT NULL,
	`business_id` text NOT NULL,
	`validation_id` text NOT NULL,
	`type` text NOT NULL,
	`message` text NOT NULL,
	`code` text NOT NULL,
	`severity` text DEFAULT 'medium',
	`category` text NOT NULL,
	`resolved` integer DEFAULT false,
	`resolved_at` text,
	`resolved_by` text,
	`resolution_notes` text,
	`related_entity_id` text,
	`related_entity_type` text,
	`data_snapshot` text
);
--> statement-breakpoint
CREATE UNIQUE INDEX `shift_validation_issues_public_id_unique` ON `shift_validation_issues` (`public_id`);--> statement-breakpoint
CREATE INDEX `validation_issues_validation_idx` ON `shift_validation_issues` (`validation_id`);--> statement-breakpoint
CREATE INDEX `validation_issues_type_idx` ON `shift_validation_issues` (`type`);--> statement-breakpoint
CREATE INDEX `validation_issues_severity_idx` ON `shift_validation_issues` (`severity`);--> statement-breakpoint
CREATE INDEX `validation_issues_category_idx` ON `shift_validation_issues` (`category`);--> statement-breakpoint
CREATE INDEX `validation_issues_resolved_idx` ON `shift_validation_issues` (`resolved`);--> statement-breakpoint
CREATE INDEX `validation_issues_business_idx` ON `shift_validation_issues` (`business_id`);--> statement-breakpoint
CREATE INDEX `validation_issues_related_entity_idx` ON `shift_validation_issues` (`related_entity_type`,`related_entity_id`);--> statement-breakpoint
CREATE INDEX `validation_issues_status_severity_idx` ON `shift_validation_issues` (`resolved`,`severity`);--> statement-breakpoint
CREATE TABLE `shift_validations` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`public_id` text NOT NULL,
	`business_id` text NOT NULL,
	`shift_id` text NOT NULL,
	`valid` integer NOT NULL,
	`requires_review` integer NOT NULL,
	`violation_count` integer DEFAULT 0 NOT NULL,
	`warning_count` integer DEFAULT 0 NOT NULL,
	`critical_issue_count` integer DEFAULT 0 NOT NULL,
	`unresolved_issue_count` integer DEFAULT 0 NOT NULL,
	`validated_at` text,
	`validated_by` text,
	`validation_method` text DEFAULT 'auto',
	`resolution` text DEFAULT 'pending',
	`resolved_at` text,
	`resolved_by` text,
	`resolution_notes` text
);
--> statement-breakpoint
CREATE INDEX `shift_validations_shift_idx` ON `shift_validations` (`shift_id`);--> statement-breakpoint
CREATE INDEX `shift_validations_business_idx` ON `shift_validations` (`business_id`);--> statement-breakpoint
CREATE INDEX `shift_validations_valid_idx` ON `shift_validations` (`valid`);--> statement-breakpoint
CREATE INDEX `shift_validations_requires_review_idx` ON `shift_validations` (`requires_review`);--> statement-breakpoint
CREATE INDEX `shift_validations_resolution_idx` ON `shift_validations` (`resolution`);--> statement-breakpoint
CREATE INDEX `shift_validations_unresolved_count_idx` ON `shift_validations` (`unresolved_issue_count`);--> statement-breakpoint
CREATE UNIQUE INDEX `shift_validations_public_id_unique` ON `shift_validations` (`public_id`);--> statement-breakpoint
CREATE UNIQUE INDEX `shift_validations_shift_unique` ON `shift_validations` (`shift_id`);--> statement-breakpoint
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
	`created_at` integer NOT NULL,
	`updated_at` integer,
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
	`note` text,
	`userId` text NOT NULL,
	`businessId` text NOT NULL,
	`timestamp` text NOT NULL,
	FOREIGN KEY (`productId`) REFERENCES `products`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`businessId`) REFERENCES `businesses`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `stock_movements` (
	`id` text PRIMARY KEY NOT NULL,
	`product_id` text NOT NULL,
	`batch_id` text,
	`movement_type` text NOT NULL,
	`quantity` real NOT NULL,
	`reason` text,
	`reference` text,
	`from_batch_id` text,
	`to_batch_id` text,
	`user_id` text NOT NULL,
	`business_id` text NOT NULL,
	`timestamp` integer NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer,
	FOREIGN KEY (`product_id`) REFERENCES `products`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`batch_id`) REFERENCES `product_batches`(`id`) ON UPDATE no action ON DELETE set null,
	FOREIGN KEY (`from_batch_id`) REFERENCES `product_batches`(`id`) ON UPDATE no action ON DELETE set null,
	FOREIGN KEY (`to_batch_id`) REFERENCES `product_batches`(`id`) ON UPDATE no action ON DELETE set null,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`business_id`) REFERENCES `businesses`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `movements_product_idx` ON `stock_movements` (`product_id`);--> statement-breakpoint
CREATE INDEX `movements_batch_idx` ON `stock_movements` (`batch_id`);--> statement-breakpoint
CREATE INDEX `movements_timestamp_idx` ON `stock_movements` (`timestamp`);--> statement-breakpoint
CREATE INDEX `movements_type_idx` ON `stock_movements` (`movement_type`);--> statement-breakpoint
CREATE INDEX `movements_business_idx` ON `stock_movements` (`business_id`);--> statement-breakpoint
CREATE INDEX `movements_batch_timestamp_idx` ON `stock_movements` (`batch_id`,`timestamp`);--> statement-breakpoint
CREATE INDEX `movements_product_timestamp_idx` ON `stock_movements` (`product_id`,`timestamp`);--> statement-breakpoint
CREATE INDEX `movements_reference_idx` ON `stock_movements` (`reference`);--> statement-breakpoint
CREATE TABLE `suppliers` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`contact_person` text,
	`email` text,
	`phone` text,
	`address` text,
	`business_id` text NOT NULL,
	`is_active` integer DEFAULT true,
	`created_at` integer NOT NULL,
	`updated_at` integer,
	FOREIGN KEY (`business_id`) REFERENCES `businesses`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `suppliers_business_idx` ON `suppliers` (`business_id`);--> statement-breakpoint
CREATE INDEX `suppliers_name_idx` ON `suppliers` (`name`);--> statement-breakpoint
CREATE TABLE `time_corrections` (
	`id` text PRIMARY KEY NOT NULL,
	`clockEventId` text,
	`shiftId` text,
	`userId` text NOT NULL,
	`correctionType` text NOT NULL,
	`originalTime` text,
	`correctedTime` text NOT NULL,
	`timeDifference` integer NOT NULL,
	`reason` text NOT NULL,
	`requestedBy` text NOT NULL,
	`approvedBy` text,
	`status` text DEFAULT 'pending' NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer,
	FOREIGN KEY (`clockEventId`) REFERENCES `clock_events`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`shiftId`) REFERENCES `time_shifts`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`requestedBy`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`approvedBy`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `time_shifts` (
	`id` text PRIMARY KEY NOT NULL,
	`userId` text NOT NULL,
	`businessId` text NOT NULL,
	`clockInId` text NOT NULL,
	`clockOutId` text,
	`scheduleId` text,
	`status` text DEFAULT 'active' NOT NULL,
	`totalHours` real,
	`regularHours` real,
	`overtimeHours` real,
	`breakDuration` integer,
	`notes` text,
	`created_at` integer NOT NULL,
	`updated_at` integer,
	FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`businessId`) REFERENCES `businesses`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`clockInId`) REFERENCES `clock_events`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`clockOutId`) REFERENCES `clock_events`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`scheduleId`) REFERENCES `schedules`(`id`) ON UPDATE no action ON DELETE no action
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
	`created_at` integer NOT NULL,
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
	`created_at` integer NOT NULL,
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
	`password_hash` text,
	`pin_hash` text NOT NULL,
	`salt` text NOT NULL,
	`firstName` text NOT NULL,
	`lastName` text NOT NULL,
	`businessName` text NOT NULL,
	`role` text NOT NULL,
	`businessId` text NOT NULL,
	`permissions` text NOT NULL,
	`lastLoginAt` integer,
	`isActive` integer DEFAULT true,
	`login_attempts` integer DEFAULT 0,
	`locked_until` integer,
	`address` text DEFAULT '',
	`created_at` integer NOT NULL,
	`updated_at` integer,
	FOREIGN KEY (`businessId`) REFERENCES `businesses`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `users_username_unique` ON `users` (`username`);--> statement-breakpoint
CREATE UNIQUE INDEX `users_email_unique` ON `users` (`email`);--> statement-breakpoint
CREATE TABLE `vat_categories` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`rate_percent` real NOT NULL,
	`code` text NOT NULL,
	`description` text,
	`business_id` text NOT NULL,
	`is_default` integer DEFAULT false,
	`is_active` integer DEFAULT true,
	`created_at` integer NOT NULL,
	`updated_at` integer,
	FOREIGN KEY (`business_id`) REFERENCES `businesses`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `vat_business_idx` ON `vat_categories` (`business_id`);--> statement-breakpoint
CREATE INDEX `vat_code_idx` ON `vat_categories` (`code`);