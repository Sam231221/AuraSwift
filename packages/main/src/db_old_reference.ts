// ============================================
// SCHEMA CREATION REMOVED
// All database schema is now managed by Drizzle migrations
// See: packages/main/src/database/migrations/
// To create new tables: Update schema.ts → Run npm run db:generate
// ============================================

/* DEPRECATED - Schema now handled by Drizzle migrations
  private initializeTables() {
    // ========================================
    // FINAL SCHEMA DEFINITIONS
    // This is what fresh installations get
    // ========================================

    // First create businesses table (no foreign keys)
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS businesses (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        ownerId TEXT NOT NULL,
        address TEXT DEFAULT '',
        phone TEXT DEFAULT '',
        vatNumber TEXT DEFAULT '',
        createdAt TEXT NOT NULL,
        updatedAt TEXT NOT NULL
      )
    `);

    // Then create users table with foreign key to businesses
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        username TEXT UNIQUE NOT NULL,
        email TEXT,
        password TEXT,
        pin TEXT NOT NULL,
        firstName TEXT NOT NULL,
        lastName TEXT NOT NULL,
        businessName TEXT NOT NULL,
        role TEXT NOT NULL CHECK (role IN ('cashier', 'manager', 'admin')),
        businessId TEXT NOT NULL,
        permissions TEXT NOT NULL,
        createdAt TEXT NOT NULL,
        updatedAt TEXT NOT NULL,
        isActive BOOLEAN DEFAULT 1,
        address TEXT DEFAULT '',
        FOREIGN KEY (businessId) REFERENCES businesses (id)
      )
    `);

    // Sessions table
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS sessions (
        id TEXT PRIMARY KEY,
        userId TEXT NOT NULL,
        token TEXT UNIQUE NOT NULL,
        expiresAt TEXT NOT NULL,
        createdAt TEXT NOT NULL,
        FOREIGN KEY (userId) REFERENCES users (id)
      )
    `);

    // Categories table
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS categories (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        parentId TEXT,
        description TEXT,
        businessId TEXT NOT NULL,
        isActive BOOLEAN DEFAULT 1,
        sortOrder INTEGER DEFAULT 0,
        createdAt TEXT NOT NULL,
        updatedAt TEXT NOT NULL,
        FOREIGN KEY (businessId) REFERENCES businesses (id),
        FOREIGN KEY (parentId) REFERENCES categories (id) ON DELETE SET NULL,
        UNIQUE(name, businessId)
      )
    `);

    // Ensure parentId column exists in categories table (migration for older DBs)
    try {
      this.db.exec(`ALTER TABLE categories ADD COLUMN parentId TEXT;`);
    } catch (err) {
      // Column already exists, ignore error
    }

    // Migration: Add new columns to audit_logs for time tracking system
    try {
      this.db.exec(`ALTER TABLE audit_logs ADD COLUMN entityType TEXT;`);
    } catch (err) {
      // Column already exists, ignore error
    }
    try {
      this.db.exec(`ALTER TABLE audit_logs ADD COLUMN entityId TEXT;`);
    } catch (err) {
      // Column already exists, ignore error
    }
    try {
      this.db.exec(`ALTER TABLE audit_logs ADD COLUMN ipAddress TEXT;`);
    } catch (err) {
      // Column already exists, ignore error
    }
    try {
      this.db.exec(`ALTER TABLE audit_logs ADD COLUMN terminalId TEXT;`);
    } catch (err) {
      // Column already exists, ignore error
    }

    // Migration: Add username and pin columns to users table
    try {
      this.db.exec(`ALTER TABLE users ADD COLUMN username TEXT;`);
    } catch (err) {
      // Column already exists, ignore error
    }
    try {
      this.db.exec(`ALTER TABLE users ADD COLUMN pin TEXT;`);
    } catch (err) {
      // Column already exists, ignore error
    }

    // Migrate existing users: generate username from email and default PIN
    try {
      const usersNeedingMigration = this.db
        .prepare("SELECT id, email FROM users WHERE username IS NULL")
        .all();

      for (const user of usersNeedingMigration) {
        const username = user.email.split("@")[0]; // Use email prefix as username
        const pin = "1234"; // Default PIN, users should change this
        this.db
          .prepare("UPDATE users SET username = ?, pin = ? WHERE id = ?")
          .run(username, pin, user.id);
      }
    } catch (err) {
      // Migration already done or error
    }

    // Migration: Add UNIQUE constraint on (name, businessId) for categories
    // Check if the constraint already exists by trying to insert a duplicate
    try {
      const hasUniqueConstraint = this.db
        .prepare(
          `
        SELECT sql FROM sqlite_master 
        WHERE type='table' AND name='categories'
      `
        )
        .get();

      // Check if UNIQUE constraint exists in table definition
      if (
        !hasUniqueConstraint?.sql?.includes("UNIQUE") ||
        !hasUniqueConstraint?.sql?.includes("name")
      ) {
        console.log(
          "🔄 Migrating categories table to add UNIQUE constraint..."
        );

        // Find and resolve duplicate category names
        const duplicates = this.db
          .prepare(
            `
          SELECT name, businessId, GROUP_CONCAT(id) as ids, COUNT(*) as count
          FROM categories
          GROUP BY name, businessId
          HAVING COUNT(*) > 1
        `
          )
          .all() as Array<{
          name: string;
          businessId: string;
          ids: string;
          count: number;
        }>;

        if (duplicates.length > 0) {
          console.log(
            `   Found ${duplicates.length} duplicate category name(s), resolving...`
          );

          // Resolve duplicates by renaming
          for (const dup of duplicates) {
            const categoryIds = dup.ids.split(",");
            // Keep first, rename others
            for (let i = 1; i < categoryIds.length; i++) {
              const newName = `${dup.name} (${i + 1})`;
              this.db
                .prepare(
                  `UPDATE categories SET name = ?, updatedAt = datetime('now') WHERE id = ?`
                )
                .run(newName, categoryIds[i]);
              console.log(
                `   Renamed duplicate category to: "${newName}" (${categoryIds[i]})`
              );
            }
          }
        }

        // Recreate table with UNIQUE constraint
        this.db.exec("PRAGMA foreign_keys = OFF;");
        this.db.exec("BEGIN TRANSACTION;");

        try {
          // Create new table with UNIQUE constraint
          this.db.exec(`
            CREATE TABLE categories_new (
              id TEXT PRIMARY KEY,
              name TEXT NOT NULL,
              parentId TEXT,
              description TEXT,
              businessId TEXT NOT NULL,
              isActive BOOLEAN DEFAULT 1,
              sortOrder INTEGER DEFAULT 0,
              createdAt TEXT NOT NULL,
              updatedAt TEXT NOT NULL,
              FOREIGN KEY (businessId) REFERENCES businesses (id),
              FOREIGN KEY (parentId) REFERENCES categories_new (id) ON DELETE SET NULL,
              UNIQUE(name, businessId)
            )
          `);

          // Copy data
          this.db.exec(`
            INSERT INTO categories_new (id, name, parentId, description, businessId, isActive, sortOrder, createdAt, updatedAt)
            SELECT 
              id, 
              name, 
              parentId, 
              description, 
              businessId, 
              COALESCE(isActive, 1), 
              COALESCE(sortOrder, 0), 
              COALESCE(createdAt, datetime('now')), 
              COALESCE(updatedAt, datetime('now'))
            FROM categories
          `);

          // Drop old and rename new
          this.db.exec("DROP TABLE categories;");
          this.db.exec("ALTER TABLE categories_new RENAME TO categories;");

          this.db.exec("COMMIT;");
          console.log("Categories table migrated with UNIQUE constraint");
        } catch (migrationError) {
          this.db.exec("ROLLBACK;");
          console.error("Categories migration failed:", migrationError);
          throw migrationError;
        } finally {
          this.db.exec("PRAGMA foreign_keys = ON;");
        }
      }
    } catch (err) {
      console.error(
        "Error checking/migrating categories UNIQUE constraint:",
        err
      );
    }

    // Products table (includes weight-based product fields)
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS products (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        description TEXT,
        price REAL NOT NULL,
        costPrice REAL DEFAULT 0,
        taxRate REAL DEFAULT 0,
        sku TEXT UNIQUE NOT NULL,
        plu TEXT UNIQUE,
        image TEXT,
        category TEXT NOT NULL,
        stockLevel INTEGER DEFAULT 0,
        minStockLevel INTEGER DEFAULT 0,
        businessId TEXT NOT NULL,
        isActive BOOLEAN DEFAULT 1,
        requiresWeight BOOLEAN DEFAULT 0,
        unit TEXT DEFAULT 'each',
        pricePerUnit REAL,
        createdAt TEXT NOT NULL,
        updatedAt TEXT NOT NULL,
        FOREIGN KEY (businessId) REFERENCES businesses (id),
        FOREIGN KEY (category) REFERENCES categories (id)
      )
    `);

    // Modifiers table
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS modifiers (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        type TEXT NOT NULL CHECK (type IN ('single', 'multiple')),
        required BOOLEAN DEFAULT 0,
        businessId TEXT NOT NULL,
        createdAt TEXT NOT NULL,
        updatedAt TEXT NOT NULL,
        FOREIGN KEY (businessId) REFERENCES businesses (id)
      )
    `);

    // Modifier options table
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS modifier_options (
        id TEXT PRIMARY KEY,
        modifierId TEXT NOT NULL,
        name TEXT NOT NULL,
        price REAL DEFAULT 0,
        createdAt TEXT NOT NULL,
        FOREIGN KEY (modifierId) REFERENCES modifiers (id) ON DELETE CASCADE
      )
    `);

    // Product modifiers relationship table
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS product_modifiers (
        productId TEXT NOT NULL,
        modifierId TEXT NOT NULL,
        PRIMARY KEY (productId, modifierId),
        FOREIGN KEY (productId) REFERENCES products (id) ON DELETE CASCADE,
        FOREIGN KEY (modifierId) REFERENCES modifiers (id) ON DELETE CASCADE
      )
    `);

    // Stock adjustments table for tracking inventory changes
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS stock_adjustments (
        id TEXT PRIMARY KEY,
        productId TEXT NOT NULL,
        type TEXT NOT NULL CHECK (type IN ('add', 'remove', 'sale', 'waste', 'adjustment')),
        quantity INTEGER NOT NULL,
        reason TEXT,
        userId TEXT NOT NULL,
        businessId TEXT NOT NULL,
        timestamp TEXT NOT NULL,
        FOREIGN KEY (productId) REFERENCES products (id),
        FOREIGN KEY (userId) REFERENCES users (id),
        FOREIGN KEY (businessId) REFERENCES businesses (id)
      )
    `);

    // App settings table for key-value storage (like user preferences, tokens, etc.)
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS app_settings (
        key TEXT PRIMARY KEY,
        value TEXT NOT NULL,
        createdAt TEXT NOT NULL,
        updatedAt TEXT NOT NULL
      )
    `);

    // Schedules table for planned staff work schedules
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS schedules (
        id TEXT PRIMARY KEY,
        staffId TEXT NOT NULL,
        businessId TEXT NOT NULL,
        startTime TEXT NOT NULL,
        endTime TEXT NOT NULL,
        status TEXT NOT NULL CHECK (status IN ('upcoming', 'active', 'completed', 'missed')),
        assignedRegister TEXT,
        notes TEXT,
        createdAt TEXT NOT NULL,
        updatedAt TEXT NOT NULL,
        FOREIGN KEY (staffId) REFERENCES users (id),
        FOREIGN KEY (businessId) REFERENCES businesses (id)
      )
    `);

    // Shifts table for actual work sessions
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS shifts (
        id TEXT PRIMARY KEY,
        scheduleId TEXT,
        cashierId TEXT NOT NULL,
        businessId TEXT NOT NULL,
        startTime TEXT NOT NULL,
        endTime TEXT,
        status TEXT NOT NULL CHECK (status IN ('active', 'ended')),
        startingCash REAL NOT NULL,
        finalCashDrawer REAL,
        expectedCashDrawer REAL,
        cashVariance REAL,
        totalSales REAL DEFAULT 0,
        totalTransactions INTEGER DEFAULT 0,
        totalRefunds REAL DEFAULT 0,
        totalVoids REAL DEFAULT 0,
        notes TEXT,
        createdAt TEXT NOT NULL,
        updatedAt TEXT NOT NULL,
        FOREIGN KEY (scheduleId) REFERENCES schedules (id),
        FOREIGN KEY (cashierId) REFERENCES users (id),
        FOREIGN KEY (businessId) REFERENCES businesses (id)
      )
    `);

    // Transactions table for sales, refunds, voids (includes refund-specific fields)
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS transactions (
        id TEXT PRIMARY KEY,
        shiftId TEXT NOT NULL,
        businessId TEXT NOT NULL,
        type TEXT NOT NULL CHECK (type IN ('sale', 'refund', 'void')),
        subtotal REAL NOT NULL,
        tax REAL NOT NULL,
        total REAL NOT NULL,
        paymentMethod TEXT NOT NULL CHECK (paymentMethod IN ('cash', 'card', 'mixed')),
        cashAmount REAL,
        cardAmount REAL,
        status TEXT NOT NULL CHECK (status IN ('completed', 'voided', 'pending')),
        voidReason TEXT,
        customerId TEXT,
        receiptNumber TEXT NOT NULL,
        timestamp TEXT NOT NULL,
        createdAt TEXT NOT NULL,
        originalTransactionId TEXT,
        refundReason TEXT,
        refundMethod TEXT CHECK (refundMethod IN ('original', 'store_credit', 'cash', 'card')),
        managerApprovalId TEXT,
        isPartialRefund BOOLEAN DEFAULT 0,
        discountAmount REAL DEFAULT 0,
        appliedDiscounts TEXT,
        FOREIGN KEY (shiftId) REFERENCES shifts (id),
        FOREIGN KEY (businessId) REFERENCES businesses (id),
        FOREIGN KEY (originalTransactionId) REFERENCES transactions (id),
        FOREIGN KEY (managerApprovalId) REFERENCES users (id)
      )
    `);

    // Transaction items table for individual line items (includes refund support and weight fields)
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS transaction_items (
        id TEXT PRIMARY KEY,
        transactionId TEXT NOT NULL,
        productId TEXT NOT NULL,
        productName TEXT NOT NULL,
        quantity INTEGER NOT NULL,
        unitPrice REAL NOT NULL,
        totalPrice REAL NOT NULL,
        refundedQuantity INTEGER DEFAULT 0,
        weight REAL,
        discountAmount REAL DEFAULT 0,
        appliedDiscounts TEXT,
        createdAt TEXT NOT NULL,
        FOREIGN KEY (transactionId) REFERENCES transactions (id),
        FOREIGN KEY (productId) REFERENCES products (id)
      )
    `);

    // Applied modifiers table for transaction item modifiers
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS applied_modifiers (
        id TEXT PRIMARY KEY,
        transactionItemId TEXT NOT NULL,
        modifierId TEXT NOT NULL,
        modifierName TEXT NOT NULL,
        optionId TEXT NOT NULL,
        optionName TEXT NOT NULL,
        price REAL NOT NULL,
        createdAt TEXT NOT NULL,
        FOREIGN KEY (transactionItemId) REFERENCES transaction_items (id),
        FOREIGN KEY (modifierId) REFERENCES modifiers (id)
      )
    `);

    // Cash drawer counts table for reconciliation
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS cash_drawer_counts (
        id TEXT PRIMARY KEY,
        shiftId TEXT NOT NULL,
        businessId TEXT NOT NULL,
        countType TEXT NOT NULL CHECK (countType IN ('mid-shift', 'end-shift')),
        expectedAmount REAL NOT NULL,
        countedAmount REAL NOT NULL,
        variance REAL NOT NULL,
        notes TEXT,
        countedBy TEXT NOT NULL,
        timestamp TEXT NOT NULL,
        createdAt TEXT NOT NULL,
        FOREIGN KEY (shiftId) REFERENCES shifts (id),
        FOREIGN KEY (businessId) REFERENCES businesses (id),
        FOREIGN KEY (countedBy) REFERENCES users (id)
      )
    `);

    // Discounts table for managing promotional discounts
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS discounts (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        description TEXT,
        type TEXT NOT NULL CHECK (type IN ('percentage', 'fixed_amount', 'buy_x_get_y')),
        value REAL NOT NULL,
        businessId TEXT NOT NULL,
        applicableTo TEXT NOT NULL CHECK (applicableTo IN ('all', 'category', 'product', 'transaction')),
        categoryIds TEXT,
        productIds TEXT,
        buyQuantity INTEGER,
        getQuantity INTEGER,
        getDiscountType TEXT CHECK (getDiscountType IN ('free', 'percentage', 'fixed')),
        getDiscountValue REAL,
        minPurchaseAmount REAL,
        minQuantity INTEGER,
        maxDiscountAmount REAL,
        startDate TEXT,
        endDate TEXT,
        isActive BOOLEAN DEFAULT 1,
        usageLimit INTEGER,
        usageCount INTEGER DEFAULT 0,
        perCustomerLimit INTEGER,
        priority INTEGER DEFAULT 0,
        daysOfWeek TEXT,
        timeStart TEXT,
        timeEnd TEXT,
        requiresCouponCode BOOLEAN DEFAULT 0,
        couponCode TEXT,
        combinableWithOthers BOOLEAN DEFAULT 1,
        createdAt TEXT NOT NULL,
        updatedAt TEXT NOT NULL,
        createdBy TEXT NOT NULL,
        FOREIGN KEY (businessId) REFERENCES businesses (id),
        FOREIGN KEY (createdBy) REFERENCES users (id)
      )
    `);

    // Audit logs table for tracking sensitive operations and time tracking
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS audit_logs (
        id TEXT PRIMARY KEY,
        userId TEXT NOT NULL,
        action TEXT NOT NULL,
        resource TEXT,
        resourceId TEXT,
        entityType TEXT,
        entityId TEXT,
        details TEXT,
        ipAddress TEXT,
        terminalId TEXT,
        timestamp TEXT NOT NULL,
        createdAt TEXT NOT NULL,
        FOREIGN KEY (userId) REFERENCES users (id)
      )
    `);

    // Office printer print jobs table
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS print_jobs (
        job_id TEXT PRIMARY KEY,
        printer_name TEXT NOT NULL,
        document_path TEXT,
        document_type TEXT NOT NULL CHECK (document_type IN ('pdf', 'image', 'text', 'raw')),
        status TEXT NOT NULL CHECK (status IN ('pending', 'queued', 'printing', 'completed', 'failed', 'cancelled', 'retrying')),
        options TEXT,
        metadata TEXT,
        created_by TEXT,
        business_id TEXT,
        created_at TEXT NOT NULL,
        started_at TEXT,
        completed_at TEXT,
        last_retry_at TEXT,
        retry_count INTEGER DEFAULT 0,
        progress INTEGER DEFAULT 0,
        pages_total INTEGER,
        pages_printed INTEGER,
        error TEXT,
        FOREIGN KEY (created_by) REFERENCES users (id),
        FOREIGN KEY (business_id) REFERENCES businesses (id)
      )
    `);

    // Print job retry attempts table
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS print_job_retries (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        job_id TEXT NOT NULL,
        attempt INTEGER NOT NULL,
        error TEXT NOT NULL,
        timestamp TEXT NOT NULL,
        next_retry_at TEXT NOT NULL,
        FOREIGN KEY (job_id) REFERENCES print_jobs (job_id) ON DELETE CASCADE
      )
    `);

    // Clock-in/Clock-out System Tables
    // Clock events table - tracks all clock in/out events
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS clock_events (
        id TEXT PRIMARY KEY,
        userId TEXT NOT NULL,
        terminalId TEXT NOT NULL,
        locationId TEXT,
        type TEXT NOT NULL CHECK (type IN ('in', 'out')),
        timestamp TEXT NOT NULL,
        method TEXT NOT NULL CHECK (method IN ('login', 'manual', 'auto', 'manager')),
        status TEXT NOT NULL CHECK (status IN ('pending', 'confirmed', 'disputed')) DEFAULT 'confirmed',
        geolocation TEXT,
        ipAddress TEXT,
        notes TEXT,
        createdAt TEXT NOT NULL,
        updatedAt TEXT NOT NULL,
        FOREIGN KEY (userId) REFERENCES users (id)
      )
    `);

    // Time shifts table - represents work shifts with clock in/out
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS time_shifts (
        id TEXT PRIMARY KEY,
        userId TEXT NOT NULL,
        businessId TEXT NOT NULL,
        clockInId TEXT NOT NULL,
        clockOutId TEXT,
        scheduleId TEXT,
        status TEXT NOT NULL CHECK (status IN ('active', 'completed', 'pending_review')) DEFAULT 'active',
        totalHours REAL,
        regularHours REAL,
        overtimeHours REAL,
        breakDuration INTEGER,
        notes TEXT,
        createdAt TEXT NOT NULL,
        updatedAt TEXT NOT NULL,
        FOREIGN KEY (userId) REFERENCES users (id),
        FOREIGN KEY (businessId) REFERENCES businesses (id),
        FOREIGN KEY (clockInId) REFERENCES clock_events (id),
        FOREIGN KEY (clockOutId) REFERENCES clock_events (id),
        FOREIGN KEY (scheduleId) REFERENCES schedules (id)
      )
    `);

    // Breaks table - tracks breaks during shifts
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS breaks (
        id TEXT PRIMARY KEY,
        shiftId TEXT NOT NULL,
        userId TEXT NOT NULL,
        type TEXT NOT NULL CHECK (type IN ('meal', 'rest', 'other')) DEFAULT 'rest',
        startTime TEXT NOT NULL,
        endTime TEXT,
        duration INTEGER,
        isPaid BOOLEAN DEFAULT 0,
        status TEXT NOT NULL CHECK (status IN ('active', 'completed')) DEFAULT 'active',
        notes TEXT,
        createdAt TEXT NOT NULL,
        updatedAt TEXT NOT NULL,
        FOREIGN KEY (shiftId) REFERENCES time_shifts (id),
        FOREIGN KEY (userId) REFERENCES users (id)
      )
    `);

    // Time corrections table - tracks manual corrections to clock times
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS time_corrections (
        id TEXT PRIMARY KEY,
        clockEventId TEXT,
        shiftId TEXT,
        userId TEXT NOT NULL,
        correctionType TEXT NOT NULL CHECK (correctionType IN ('clock_time', 'break_time', 'manual_entry')),
        originalTime TEXT,
        correctedTime TEXT NOT NULL,
        timeDifference INTEGER NOT NULL,
        reason TEXT NOT NULL,
        requestedBy TEXT NOT NULL,
        approvedBy TEXT,
        status TEXT NOT NULL CHECK (status IN ('pending', 'approved', 'rejected')) DEFAULT 'pending',
        createdAt TEXT NOT NULL,
        updatedAt TEXT NOT NULL,
        FOREIGN KEY (clockEventId) REFERENCES clock_events (id),
        FOREIGN KEY (shiftId) REFERENCES time_shifts (id),
        FOREIGN KEY (userId) REFERENCES users (id),
        FOREIGN KEY (requestedBy) REFERENCES users (id),
        FOREIGN KEY (approvedBy) REFERENCES users (id)
      )
    `);

    // Create indexes for better performance
    this.db.exec(`
      CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
      CREATE INDEX IF NOT EXISTS idx_sessions_token ON sessions(token);
      CREATE INDEX IF NOT EXISTS idx_sessions_userId ON sessions(userId);

      CREATE INDEX IF NOT EXISTS idx_categories_businessId ON categories(businessId);
      CREATE INDEX IF NOT EXISTS idx_categories_name ON categories(name);
      CREATE INDEX IF NOT EXISTS idx_categories_sortOrder ON categories(sortOrder);
      
      CREATE INDEX IF NOT EXISTS idx_products_businessId ON products(businessId);
      CREATE INDEX IF NOT EXISTS idx_products_sku ON products(sku);
      CREATE INDEX IF NOT EXISTS idx_products_plu ON products(plu);
      CREATE INDEX IF NOT EXISTS idx_products_category ON products(category);
      CREATE INDEX IF NOT EXISTS idx_modifiers_businessId ON modifiers(businessId);
      CREATE INDEX IF NOT EXISTS idx_stock_adjustments_productId ON stock_adjustments(productId);
      CREATE INDEX IF NOT EXISTS idx_stock_adjustments_businessId ON stock_adjustments(businessId);

      -- Indexes for shift management tables
      CREATE INDEX IF NOT EXISTS idx_schedules_staffId ON schedules(staffId);
      CREATE INDEX IF NOT EXISTS idx_schedules_businessId ON schedules(businessId);
      CREATE INDEX IF NOT EXISTS idx_schedules_startTime ON schedules(startTime);
      CREATE INDEX IF NOT EXISTS idx_schedules_status ON schedules(status);

      CREATE INDEX IF NOT EXISTS idx_shifts_cashierId ON shifts(cashierId);
      CREATE INDEX IF NOT EXISTS idx_shifts_businessId ON shifts(businessId);
      CREATE INDEX IF NOT EXISTS idx_shifts_scheduleId ON shifts(scheduleId);
      CREATE INDEX IF NOT EXISTS idx_shifts_status ON shifts(status);
      CREATE INDEX IF NOT EXISTS idx_shifts_startTime ON shifts(startTime);

      CREATE INDEX IF NOT EXISTS idx_transactions_shiftId ON transactions(shiftId);
      CREATE INDEX IF NOT EXISTS idx_transactions_businessId ON transactions(businessId);
      CREATE INDEX IF NOT EXISTS idx_transactions_type ON transactions(type);
      CREATE INDEX IF NOT EXISTS idx_transactions_status ON transactions(status);
      CREATE INDEX IF NOT EXISTS idx_transactions_timestamp ON transactions(timestamp);

      CREATE INDEX IF NOT EXISTS idx_transaction_items_transactionId ON transaction_items(transactionId);
      CREATE INDEX IF NOT EXISTS idx_transaction_items_productId ON transaction_items(productId);

      CREATE INDEX IF NOT EXISTS idx_applied_modifiers_transactionItemId ON applied_modifiers(transactionItemId);
      CREATE INDEX IF NOT EXISTS idx_applied_modifiers_modifierId ON applied_modifiers(modifierId);

      CREATE INDEX IF NOT EXISTS idx_cash_drawer_counts_shiftId ON cash_drawer_counts(shiftId);
      CREATE INDEX IF NOT EXISTS idx_cash_drawer_counts_businessId ON cash_drawer_counts(businessId);
      CREATE INDEX IF NOT EXISTS idx_cash_drawer_counts_countType ON cash_drawer_counts(countType);

      CREATE INDEX IF NOT EXISTS idx_discounts_businessId ON discounts(businessId);
      CREATE INDEX IF NOT EXISTS idx_discounts_isActive ON discounts(isActive);
      CREATE INDEX IF NOT EXISTS idx_discounts_type ON discounts(type);
      CREATE INDEX IF NOT EXISTS idx_discounts_applicableTo ON discounts(applicableTo);
      CREATE INDEX IF NOT EXISTS idx_discounts_couponCode ON discounts(couponCode);
      CREATE INDEX IF NOT EXISTS idx_discounts_priority ON discounts(priority);

      CREATE INDEX IF NOT EXISTS idx_audit_logs_userId ON audit_logs(userId);
      CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON audit_logs(action);
      CREATE INDEX IF NOT EXISTS idx_audit_logs_resource ON audit_logs(resource);
      CREATE INDEX IF NOT EXISTS idx_audit_logs_timestamp ON audit_logs(timestamp);
      
      -- Additional indexes for refund functionality
      CREATE INDEX IF NOT EXISTS idx_transactions_originalTransactionId ON transactions(originalTransactionId);
      
      -- Indexes for print jobs
      CREATE INDEX IF NOT EXISTS idx_print_jobs_status ON print_jobs(status);
      CREATE INDEX IF NOT EXISTS idx_print_jobs_printer_name ON print_jobs(printer_name);
      CREATE INDEX IF NOT EXISTS idx_print_jobs_created_at ON print_jobs(created_at);
      CREATE INDEX IF NOT EXISTS idx_print_jobs_business_id ON print_jobs(business_id);
      CREATE INDEX IF NOT EXISTS idx_print_jobs_created_by ON print_jobs(created_by);
      
      CREATE INDEX IF NOT EXISTS idx_print_job_retries_job_id ON print_job_retries(job_id);
      CREATE INDEX IF NOT EXISTS idx_print_job_retries_timestamp ON print_job_retries(timestamp);

      -- Indexes for clock-in/clock-out system
      CREATE INDEX IF NOT EXISTS idx_clock_events_userId ON clock_events(userId);
      CREATE INDEX IF NOT EXISTS idx_clock_events_timestamp ON clock_events(timestamp);
      CREATE INDEX IF NOT EXISTS idx_clock_events_type ON clock_events(type);
      CREATE INDEX IF NOT EXISTS idx_clock_events_status ON clock_events(status);

      CREATE INDEX IF NOT EXISTS idx_time_shifts_userId ON time_shifts(userId);
      CREATE INDEX IF NOT EXISTS idx_time_shifts_businessId ON time_shifts(businessId);
      CREATE INDEX IF NOT EXISTS idx_time_shifts_status ON time_shifts(status);
      CREATE INDEX IF NOT EXISTS idx_time_shifts_clockInId ON time_shifts(clockInId);
      CREATE INDEX IF NOT EXISTS idx_time_shifts_clockOutId ON time_shifts(clockOutId);

      CREATE INDEX IF NOT EXISTS idx_breaks_shiftId ON breaks(shiftId);
      CREATE INDEX IF NOT EXISTS idx_breaks_userId ON breaks(userId);
      CREATE INDEX IF NOT EXISTS idx_breaks_status ON breaks(status);

      CREATE INDEX IF NOT EXISTS idx_time_corrections_userId ON time_corrections(userId);
      CREATE INDEX IF NOT EXISTS idx_time_corrections_status ON time_corrections(status);
      CREATE INDEX IF NOT EXISTS idx_time_corrections_requestedBy ON time_corrections(requestedBy);

      CREATE INDEX IF NOT EXISTS idx_audit_logs_entityType ON audit_logs(entityType);
      CREATE INDEX IF NOT EXISTS idx_audit_logs_entityId ON audit_logs(entityId);
    `);

    // Insert default admin user if no users exist
    this.createDefaultAdmin();
    // Note: Demo users (john, sarah, emma) are created by migration v3
  }
  */ // END OF DEPRECATED initializeTables()
// private async createDefaultAdmin() {
//     const userCount = this.db
//       .prepare("SELECT COUNT(*) as count FROM users")
//       .get() as { count: number };

//     if (userCount.count === 0) {
//       const adminId = this.uuid.v4();
//       const businessId = this.uuid.v4();
//       const hashedPassword = await this.bcrypt.hash("admin123", 10);
//       const now = new Date().toISOString();

//       const adminPermissions = JSON.stringify([{ action: "*", resource: "*" }]);

//       // Temporarily disable foreign key constraints
//       this.db.exec("PRAGMA foreign_keys = OFF");

//       try {
//         // Create default business first
//         this.db
//           .prepare(
//             `
//           INSERT INTO businesses (id, name, ownerId, createdAt, updatedAt)
//           VALUES (?, ?, ?, ?, ?)
//         `
//           )
//           .run(businessId, "Default Store", adminId, now, now);

//         // Create admin user
//         this.db
//           .prepare(
//             `
//           INSERT INTO users (id, username, pin, email, password, firstName, lastName, businessName, role, businessId, permissions, createdAt, updatedAt, isActive)
//           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
//         `
//           )
//           .run(
//             adminId,
//             "admin",
//             "1234",
//             "admin@store.com",
//             hashedPassword,
//             "Admin",
//             "User",
//             "Default Store",
//             "admin",
//             businessId,
//             adminPermissions,
//             now,
//             now,
//             1
//           );

//         // Create default manager user
//         const managerId = this.uuid.v4();
//         const managerPermissions = JSON.stringify([
//           { action: "read", resource: "sales" },
//           { action: "create", resource: "transactions" },
//           { action: "void", resource: "transactions" },
//           { action: "apply", resource: "discounts" },
//           { action: "read", resource: "products" },
//           { action: "update", resource: "inventory" },
//           { action: "read", resource: "all_reports" },
//           { action: "manage", resource: "staff_schedules" },
//         ]);

//         this.db
//           .prepare(
//             `
//           INSERT INTO users (id, username, pin, email, password, firstName, lastName, businessName, role, businessId, permissions, createdAt, updatedAt, isActive)
//           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
//         `
//           )
//           .run(
//             managerId,
//             "john",
//             "1234",
//             "john@store.com",
//             hashedPassword,
//             "John",
//             "Smith",
//             "Default Store",
//             "manager",
//             businessId,
//             managerPermissions,
//             now,
//             now,
//             1
//           );

//         // Create default cashier user 1
//         const cashierId1 = this.uuid.v4();
//         const cashierPermissions = JSON.stringify([
//           { action: "read", resource: "sales" },
//           { action: "create", resource: "transactions" },
//           { action: "read", resource: "products" },
//           { action: "read", resource: "basic_reports" },
//         ]);

//         this.db
//           .prepare(
//             `
//           INSERT INTO users (id, username, pin, email, password, firstName, lastName, businessName, role, businessId, permissions, createdAt, updatedAt, isActive)
//           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
//         `
//           )
//           .run(
//             cashierId1,
//             "sarah",
//             "1234",
//             "sarah@store.com",
//             hashedPassword,
//             "Sarah",
//             "Johnson",
//             "Default Store",
//             "cashier",
//             businessId,
//             cashierPermissions,
//             now,
//             now,
//             1
//           );

//         // Create default cashier user 2
//         const cashierId2 = this.uuid.v4();

//         this.db
//           .prepare(
//             `
//           INSERT INTO users (id, username, pin, email, password, firstName, lastName, businessName, role, businessId, permissions, createdAt, updatedAt, isActive)
//           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
//         `
//           )
//           .run(
//             cashierId2,
//             "emma",
//             "1234",
//             "emma@store.com",
//             hashedPassword,
//             "Emma",
//             "Davis",
//             "Default Store",
//             "cashier",
//             businessId,
//             cashierPermissions,
//             now,
//             now,
//             1
//           );

//         console.log("✅ Default users created:");
//         console.log("   Admin: username: admin / PIN: 1234");
//         console.log("   Manager: username: john / PIN: 1234");
//         console.log("   Cashier: username: sarah / PIN: 1234");
//         console.log("   Cashier: username: emma / PIN: 1234");
//       } finally {
//         // Re-enable foreign key constraints
//         this.db.exec("PRAGMA foreign_keys = ON");
//       }
//     }
//   }

/**
 * ❌ DEPRECATED - Replaced by Drizzle migrations!
 *
 * This method is no longer used. All table creation is now handled by Drizzle's migration system.
 * The baseline schema is in packages/main/src/database/migrations/0000_initial_schema.sql
 *
 * Keeping this commented out temporarily for reference during transition period.
 */
/* private initializeTables() {
    // First create businesses table (no foreign keys)
    // Includes historical fields: address, phone, vatNumber
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS businesses (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        ownerId TEXT NOT NULL,
        address TEXT DEFAULT '',
        phone TEXT DEFAULT '',
        vatNumber TEXT DEFAULT '',
        createdAt TEXT NOT NULL,
        updatedAt TEXT NOT NULL
      )
    `);

    // Then create users table with foreign key to businesses
    // Includes migrated field: address
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        email TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL,
        firstName TEXT NOT NULL,
        lastName TEXT NOT NULL,
        businessName TEXT NOT NULL,
        role TEXT NOT NULL CHECK (role IN ('cashier', 'manager', 'admin')),
        businessId TEXT NOT NULL,
        permissions TEXT NOT NULL,
        createdAt TEXT NOT NULL,
        updatedAt TEXT NOT NULL,
        isActive BOOLEAN DEFAULT 1,
        address TEXT DEFAULT '',
        FOREIGN KEY (businessId) REFERENCES businesses (id)
      )
    `);

    // Sessions table
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS sessions (
        id TEXT PRIMARY KEY,
        userId TEXT NOT NULL,
        token TEXT UNIQUE NOT NULL,
        expiresAt TEXT NOT NULL,
        createdAt TEXT NOT NULL,
        FOREIGN KEY (userId) REFERENCES users (id)
      )
    `);

    // Categories table with migrated fields: parentId and UNIQUE constraint on (name, businessId)
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS categories (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        parentId TEXT,
        description TEXT,
        businessId TEXT NOT NULL,
        isActive BOOLEAN DEFAULT 1,
        sortOrder INTEGER DEFAULT 0,
        createdAt TEXT NOT NULL,
        updatedAt TEXT NOT NULL,
        FOREIGN KEY (businessId) REFERENCES businesses (id),
        FOREIGN KEY (parentId) REFERENCES categories (id) ON DELETE SET NULL,
        UNIQUE(name, businessId)
      )
    `);

    // Products table (includes weight-based product fields)
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS products (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        description TEXT,
        price REAL NOT NULL,
        costPrice REAL DEFAULT 0,
        taxRate REAL DEFAULT 0,
        sku TEXT UNIQUE NOT NULL,
        plu TEXT UNIQUE,
        image TEXT,
        category TEXT NOT NULL,
        stockLevel INTEGER DEFAULT 0,
        minStockLevel INTEGER DEFAULT 0,
        businessId TEXT NOT NULL,
        isActive BOOLEAN DEFAULT 1,
        requiresWeight BOOLEAN DEFAULT 0,
        unit TEXT DEFAULT 'each',
        pricePerUnit REAL,
        createdAt TEXT NOT NULL,
        updatedAt TEXT NOT NULL,
        FOREIGN KEY (businessId) REFERENCES businesses (id),
        FOREIGN KEY (category) REFERENCES categories (id)
      )
    `);

    // Modifiers table
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS modifiers (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        type TEXT NOT NULL CHECK (type IN ('single', 'multiple')),
        required BOOLEAN DEFAULT 0,
        businessId TEXT NOT NULL,
        createdAt TEXT NOT NULL,
        updatedAt TEXT NOT NULL,
        FOREIGN KEY (businessId) REFERENCES businesses (id)
      )
    `);

    // Modifier options table
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS modifier_options (
        id TEXT PRIMARY KEY,
        modifierId TEXT NOT NULL,
        name TEXT NOT NULL,
        price REAL DEFAULT 0,
        createdAt TEXT NOT NULL,
        FOREIGN KEY (modifierId) REFERENCES modifiers (id) ON DELETE CASCADE
      )
    `);

    // Product modifiers relationship table
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS product_modifiers (
        productId TEXT NOT NULL,
        modifierId TEXT NOT NULL,
        PRIMARY KEY (productId, modifierId),
        FOREIGN KEY (productId) REFERENCES products (id) ON DELETE CASCADE,
        FOREIGN KEY (modifierId) REFERENCES modifiers (id) ON DELETE CASCADE
      )
    `);

    // Stock adjustments table for tracking inventory changes
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS stock_adjustments (
        id TEXT PRIMARY KEY,
        productId TEXT NOT NULL,
        type TEXT NOT NULL CHECK (type IN ('add', 'remove', 'sale', 'waste', 'adjustment')),
        quantity INTEGER NOT NULL,
        reason TEXT,
        userId TEXT NOT NULL,
        businessId TEXT NOT NULL,
        timestamp TEXT NOT NULL,
        FOREIGN KEY (productId) REFERENCES products (id),
        FOREIGN KEY (userId) REFERENCES users (id),
        FOREIGN KEY (businessId) REFERENCES businesses (id)
      )
    `);

    // App settings table for key-value storage (like user preferences, tokens, etc.)
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS app_settings (
        key TEXT PRIMARY KEY,
        value TEXT NOT NULL,
        createdAt TEXT NOT NULL,
        updatedAt TEXT NOT NULL
      )
    `);

    // Schedules table for planned staff work schedules
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS schedules (
        id TEXT PRIMARY KEY,
        staffId TEXT NOT NULL,
        businessId TEXT NOT NULL,
        startTime TEXT NOT NULL,
        endTime TEXT NOT NULL,
        status TEXT NOT NULL CHECK (status IN ('upcoming', 'active', 'completed', 'missed')),
        assignedRegister TEXT,
        notes TEXT,
        createdAt TEXT NOT NULL,
        updatedAt TEXT NOT NULL,
        FOREIGN KEY (staffId) REFERENCES users (id),
        FOREIGN KEY (businessId) REFERENCES businesses (id)
      )
    `);

    // Shifts table for actual work sessions
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS shifts (
        id TEXT PRIMARY KEY,
        scheduleId TEXT,
        cashierId TEXT NOT NULL,
        businessId TEXT NOT NULL,
        startTime TEXT NOT NULL,
        endTime TEXT,
        status TEXT NOT NULL CHECK (status IN ('active', 'ended')),
        startingCash REAL NOT NULL,
        finalCashDrawer REAL,
        expectedCashDrawer REAL,
        cashVariance REAL,
        totalSales REAL DEFAULT 0,
        totalTransactions INTEGER DEFAULT 0,
        totalRefunds REAL DEFAULT 0,
        totalVoids REAL DEFAULT 0,
        notes TEXT,
        createdAt TEXT NOT NULL,
        updatedAt TEXT NOT NULL,
        FOREIGN KEY (scheduleId) REFERENCES schedules (id),
        FOREIGN KEY (cashierId) REFERENCES users (id),
        FOREIGN KEY (businessId) REFERENCES businesses (id)
      )
    `);

    // Transactions table for sales, refunds, voids (includes refund-specific fields)
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS transactions (
        id TEXT PRIMARY KEY,
        shiftId TEXT NOT NULL,
        businessId TEXT NOT NULL,
        type TEXT NOT NULL CHECK (type IN ('sale', 'refund', 'void')),
        subtotal REAL NOT NULL,
        tax REAL NOT NULL,
        total REAL NOT NULL,
        paymentMethod TEXT NOT NULL CHECK (paymentMethod IN ('cash', 'card', 'mixed')),
        cashAmount REAL,
        cardAmount REAL,
        status TEXT NOT NULL CHECK (status IN ('completed', 'voided', 'pending')),
        voidReason TEXT,
        customerId TEXT,
        receiptNumber TEXT NOT NULL,
        timestamp TEXT NOT NULL,
        createdAt TEXT NOT NULL,
        originalTransactionId TEXT,
        refundReason TEXT,
        refundMethod TEXT CHECK (refundMethod IN ('original', 'store_credit', 'cash', 'card')),
        managerApprovalId TEXT,
        isPartialRefund BOOLEAN DEFAULT 0,
        FOREIGN KEY (shiftId) REFERENCES shifts (id),
        FOREIGN KEY (businessId) REFERENCES businesses (id),
        FOREIGN KEY (originalTransactionId) REFERENCES transactions (id),
        FOREIGN KEY (managerApprovalId) REFERENCES users (id)
      )
    `);

    // Transaction items table for individual line items (includes refund support and weight fields)
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS transaction_items (
        id TEXT PRIMARY KEY,
        transactionId TEXT NOT NULL,
        productId TEXT NOT NULL,
        productName TEXT NOT NULL,
        quantity INTEGER NOT NULL,
        unitPrice REAL NOT NULL,
        totalPrice REAL NOT NULL,
        refundedQuantity INTEGER DEFAULT 0,
        weight REAL,
        createdAt TEXT NOT NULL,
        FOREIGN KEY (transactionId) REFERENCES transactions (id),
        FOREIGN KEY (productId) REFERENCES products (id)
      )
    `);

    // Applied modifiers table for transaction item modifiers
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS applied_modifiers (
        id TEXT PRIMARY KEY,
        transactionItemId TEXT NOT NULL,
        modifierId TEXT NOT NULL,
        modifierName TEXT NOT NULL,
        optionId TEXT NOT NULL,
        optionName TEXT NOT NULL,
        price REAL NOT NULL,
        createdAt TEXT NOT NULL,
        FOREIGN KEY (transactionItemId) REFERENCES transaction_items (id),
        FOREIGN KEY (modifierId) REFERENCES modifiers (id)
      )
    `);

    // Cash drawer counts table for reconciliation
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS cash_drawer_counts (
        id TEXT PRIMARY KEY,
        shiftId TEXT NOT NULL,
        businessId TEXT NOT NULL,
        countType TEXT NOT NULL CHECK (countType IN ('mid-shift', 'end-shift')),
        expectedAmount REAL NOT NULL,
        countedAmount REAL NOT NULL,
        variance REAL NOT NULL,
        notes TEXT,
        countedBy TEXT NOT NULL,
        timestamp TEXT NOT NULL,
        createdAt TEXT NOT NULL,
        FOREIGN KEY (shiftId) REFERENCES shifts (id),
        FOREIGN KEY (businessId) REFERENCES businesses (id),
        FOREIGN KEY (countedBy) REFERENCES users (id)
      )
    `);

    // Audit logs table for tracking sensitive operations
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS audit_logs (
        id TEXT PRIMARY KEY,
        userId TEXT NOT NULL,
        action TEXT NOT NULL,
        resource TEXT NOT NULL,
        resourceId TEXT NOT NULL,
        details TEXT,
        timestamp TEXT NOT NULL,
        createdAt TEXT NOT NULL,
        FOREIGN KEY (userId) REFERENCES users (id)
      )
    `);

    // Office printer print jobs table
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS print_jobs (
        job_id TEXT PRIMARY KEY,
        printer_name TEXT NOT NULL,
        document_path TEXT,
        document_type TEXT NOT NULL CHECK (document_type IN ('pdf', 'image', 'text', 'raw')),
        status TEXT NOT NULL CHECK (status IN ('pending', 'queued', 'printing', 'completed', 'failed', 'cancelled', 'retrying')),
        options TEXT,
        metadata TEXT,
        created_by TEXT,
        business_id TEXT,
        created_at TEXT NOT NULL,
        started_at TEXT,
        completed_at TEXT,
        last_retry_at TEXT,
        retry_count INTEGER DEFAULT 0,
        progress INTEGER DEFAULT 0,
        pages_total INTEGER,
        pages_printed INTEGER,
        error TEXT,
        FOREIGN KEY (created_by) REFERENCES users (id),
        FOREIGN KEY (business_id) REFERENCES businesses (id)
      )
    `);

    // Print job retry attempts table
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS print_job_retries (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        job_id TEXT NOT NULL,
        attempt INTEGER NOT NULL,
        error TEXT NOT NULL,
        timestamp TEXT NOT NULL,
        next_retry_at TEXT NOT NULL,
        FOREIGN KEY (job_id) REFERENCES print_jobs (job_id) ON DELETE CASCADE
      )
    `);

    // Create indexes for better performance
    this.db.exec(`
      CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
      CREATE INDEX IF NOT EXISTS idx_sessions_token ON sessions(token);
      CREATE INDEX IF NOT EXISTS idx_sessions_userId ON sessions(userId);

      CREATE INDEX IF NOT EXISTS idx_categories_businessId ON categories(businessId);
      CREATE INDEX IF NOT EXISTS idx_categories_name ON categories(name);
      CREATE INDEX IF NOT EXISTS idx_categories_sortOrder ON categories(sortOrder);
      
      CREATE INDEX IF NOT EXISTS idx_products_businessId ON products(businessId);
      CREATE INDEX IF NOT EXISTS idx_products_sku ON products(sku);
      CREATE INDEX IF NOT EXISTS idx_products_plu ON products(plu);
      CREATE INDEX IF NOT EXISTS idx_products_category ON products(category);
      CREATE INDEX IF NOT EXISTS idx_modifiers_businessId ON modifiers(businessId);
      CREATE INDEX IF NOT EXISTS idx_stock_adjustments_productId ON stock_adjustments(productId);
      CREATE INDEX IF NOT EXISTS idx_stock_adjustments_businessId ON stock_adjustments(businessId);

      CREATE INDEX IF NOT EXISTS idx_schedules_staffId ON schedules(staffId);
      CREATE INDEX IF NOT EXISTS idx_schedules_businessId ON schedules(businessId);
      CREATE INDEX IF NOT EXISTS idx_schedules_startTime ON schedules(startTime);
      CREATE INDEX IF NOT EXISTS idx_schedules_status ON schedules(status);

      CREATE INDEX IF NOT EXISTS idx_shifts_cashierId ON shifts(cashierId);
      CREATE INDEX IF NOT EXISTS idx_shifts_businessId ON shifts(businessId);
      CREATE INDEX IF NOT EXISTS idx_shifts_scheduleId ON shifts(scheduleId);
      CREATE INDEX IF NOT EXISTS idx_shifts_status ON shifts(status);
      CREATE INDEX IF NOT EXISTS idx_shifts_startTime ON shifts(startTime);

      CREATE INDEX IF NOT EXISTS idx_transactions_shiftId ON transactions(shiftId);
      CREATE INDEX IF NOT EXISTS idx_transactions_businessId ON transactions(businessId);
      CREATE INDEX IF NOT EXISTS idx_transactions_type ON transactions(type);
      CREATE INDEX IF NOT EXISTS idx_transactions_status ON transactions(status);
      CREATE INDEX IF NOT EXISTS idx_transactions_timestamp ON transactions(timestamp);

      CREATE INDEX IF NOT EXISTS idx_transaction_items_transactionId ON transaction_items(transactionId);
      CREATE INDEX IF NOT EXISTS idx_transaction_items_productId ON transaction_items(productId);

      CREATE INDEX IF NOT EXISTS idx_applied_modifiers_transactionItemId ON applied_modifiers(transactionItemId);
      CREATE INDEX IF NOT EXISTS idx_applied_modifiers_modifierId ON applied_modifiers(modifierId);

      CREATE INDEX IF NOT EXISTS idx_cash_drawer_counts_shiftId ON cash_drawer_counts(shiftId);
      CREATE INDEX IF NOT EXISTS idx_cash_drawer_counts_businessId ON cash_drawer_counts(businessId);
      CREATE INDEX IF NOT EXISTS idx_cash_drawer_counts_countType ON cash_drawer_counts(countType);

      CREATE INDEX IF NOT EXISTS idx_audit_logs_userId ON audit_logs(userId);
      CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON audit_logs(action);
      CREATE INDEX IF NOT EXISTS idx_audit_logs_resource ON audit_logs(resource);
      CREATE INDEX IF NOT EXISTS idx_audit_logs_timestamp ON audit_logs(timestamp);
      
      CREATE INDEX IF NOT EXISTS idx_transactions_originalTransactionId ON transactions(originalTransactionId);
      
      CREATE INDEX IF NOT EXISTS idx_print_jobs_status ON print_jobs(status);
      CREATE INDEX IF NOT EXISTS idx_print_jobs_printer_name ON print_jobs(printer_name);
      CREATE INDEX IF NOT EXISTS idx_print_jobs_created_at ON print_jobs(created_at);
      CREATE INDEX IF NOT EXISTS idx_print_jobs_business_id ON print_jobs(business_id);
      CREATE INDEX IF NOT EXISTS idx_print_jobs_created_by ON print_jobs(created_by);
      
      CREATE INDEX IF NOT EXISTS idx_print_job_retries_job_id ON print_job_retries(job_id);
      CREATE INDEX IF NOT EXISTS idx_print_job_retries_timestamp ON print_job_retries(timestamp);
    `);
  } */
