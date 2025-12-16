-- Performance Optimization Migration
-- Adds composite indexes for efficient pagination and filtering of large datasets
-- Target: 15k+ categories, 60k+ products

-- ============================================================================
-- PRODUCTS TABLE INDEXES
-- ============================================================================

-- Composite index for business + category + active status queries
-- Used by: getProductsByBusinessPaginated with category filter
CREATE INDEX IF NOT EXISTS `products_biz_cat_active_idx` ON `products` (`business_id`, `category_id`, `is_active`);

-- Composite index for business + active + name (for sorted queries)
-- Used by: getProductsByBusinessPaginated with name sorting
CREATE INDEX IF NOT EXISTS `products_biz_active_name_idx` ON `products` (`business_id`, `is_active`, `name`);

-- Index for search optimization (name contains)
-- Note: SQLite LIKE with leading wildcard can't use standard indexes,
-- but this helps with prefix searches and sorted results
CREATE INDEX IF NOT EXISTS `products_name_lower_idx` ON `products` (`business_id`, `name` COLLATE NOCASE);

-- ============================================================================
-- CATEGORIES TABLE INDEXES  
-- ============================================================================

-- Composite index for business + parent + active status queries
-- Used by: getCategoryChildren for lazy loading category tree
CREATE INDEX IF NOT EXISTS `categories_biz_parent_active_idx` ON `categories` (`business_id`, `parent_id`, `is_active`);

-- Index for sorted category queries
-- Used by: getCategoryChildren with sortOrder
CREATE INDEX IF NOT EXISTS `categories_biz_parent_sort_idx` ON `categories` (`business_id`, `parent_id`, `sort_order`);
