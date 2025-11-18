# Product Expiry Tracking - Backend Implementation Plan

## 📋 Overview

This document outlines the comprehensive backend implementation plan for product expiry tracking with batch management, following best practices and the requirements from the documentation.

## 🎯 Objectives

1. Implement batch management (CRUD operations)
2. Implement expiry notification system
3. Implement FIFO/FEFO stock rotation logic
4. Integrate batch tracking with transactions
5. Implement stock movement tracking with batch awareness
6. Create supplier management
7. Implement expiry settings management
8. Add IPC handlers and preload APIs

## 📊 Current State Analysis

### ✅ Already Implemented (Schema)
- `productBatches` table - Complete with all fields
- `expirySettings` table - Complete
- `expiryNotifications` table - Complete
- `suppliers` table - Complete
- `stockMovements` table - Complete with batch tracking
- Product fields: `hasExpiry`, `requiresBatchTracking`, `stockRotationMethod`, `shelfLifeDays`

### ❌ Missing Implementation
- BatchManager - No manager exists
- ExpiryNotificationManager - No manager exists
- SupplierManager - Need to check
- StockMovementManager - May be in InventoryManager, need to verify
- FIFO/FEFO logic in TransactionManager
- Batch selection during sales
- Expiry notification scheduler/service
- IPC handlers for all expiry-related operations
- Preload APIs

## 🏗️ Implementation Plan

### Phase 1: Core Managers (Foundation)

#### 1.1 BatchManager
**File**: `packages/main/src/database/managers/batchManager.ts`

**Responsibilities**:
- Create batch (with auto-generation of batch number)
- Get batch by ID
- Get batches by product
- Get batches by business
- Get active batches (for FEFO queries)
- Update batch (quantity, status)
- Delete/remove batch
- Get batches expiring soon (for notifications)
- Calculate product stock from batches
- Auto-update batch status (EXPIRED, SOLD_OUT)

**Key Methods**:
```typescript
- createBatch(batchData)
- getBatchById(id)
- getBatchesByProduct(productId, options?)
- getBatchesByBusiness(businessId, options?)
- getActiveBatchesByProduct(productId) // For FEFO
- getBatchesExpiringSoon(businessId, days)
- updateBatchQuantity(batchId, quantity, movementType)
- updateBatchStatus(batchId, status)
- calculateProductStock(productId) // SUM of active batches
- autoUpdateExpiredBatches()
```

#### 1.2 SupplierManager
**File**: `packages/main/src/database/managers/supplierManager.ts`

**Responsibilities**:
- CRUD operations for suppliers
- Get suppliers by business

**Key Methods**:
```typescript
- createSupplier(supplierData)
- getSupplierById(id)
- getSuppliersByBusiness(businessId)
- updateSupplier(id, updates)
- deleteSupplier(id)
```

#### 1.3 ExpirySettingsManager
**File**: `packages/main/src/database/managers/expirySettingsManager.ts`

**Responsibilities**:
- Get/create/update expiry settings per business
- Default settings initialization

**Key Methods**:
```typescript
- getSettingsByBusiness(businessId)
- createOrUpdateSettings(businessId, settings)
- getDefaultSettings()
```

#### 1.4 ExpiryNotificationManager
**File**: `packages/main/src/database/managers/expiryNotificationManager.ts`

**Responsibilities**:
- Create notification records
- Get notifications by batch, business, status
- Update notification status
- Acknowledge notifications
- Get pending notifications

**Key Methods**:
```typescript
- createNotification(notificationData)
- getNotificationsByBatch(batchId)
- getNotificationsByBusiness(businessId, filters?)
- getPendingNotifications(businessId)
- updateNotificationStatus(id, status)
- acknowledgeNotification(id, userId)
```

### Phase 2: Stock Movement Integration

#### 2.1 Update InventoryManager or Create StockMovementManager
**File**: `packages/main/src/database/managers/stockMovementManager.ts` (or update InventoryManager)

**Responsibilities**:
- Create stock movements with batch tracking
- Update batch quantities on movement
- Follow FEFO for outbound movements
- Track batch transfers

**Key Methods**:
```typescript
- createStockMovement(movementData)
- getMovementsByProduct(productId)
- getMovementsByBatch(batchId)
- getMovementsByBusiness(businessId, filters?)
```

### Phase 3: Transaction Integration

#### 3.1 Update TransactionManager
**File**: `packages/main/src/database/managers/transactionManager.ts`

**New Methods**:
```typescript
- selectBatchForSale(productId, quantity, rotationMethod) // FIFO/FEFO logic
- deductFromBatch(batchId, quantity)
- createTransactionWithBatchTracking(transactionData, items)
```

**Logic**:
- When creating transaction items, if product requires batch tracking:
  1. Find appropriate batch using FIFO/FEFO
  2. Deduct quantity from batch
  3. Update batch status if needed
  4. Record batch ID in transaction item

### Phase 4: Expiry Notification Service

#### 4.1 ExpiryNotificationService
**File**: `packages/main/src/services/expiryNotificationService.ts`

**Responsibilities**:
- Scan batches for expiring items
- Create notifications based on thresholds
- Send notifications via configured channels
- Schedule daily checks

**Key Methods**:
```typescript
- scanAndCreateNotifications(businessId)
- checkBatchExpiry(batch, settings)
- createNotificationForBatch(batch, notificationType, daysUntil)
- sendNotification(notification, channels)
```

### Phase 5: IPC Handlers

#### 5.1 Batch IPC Handlers
**File**: `packages/main/src/appStore.ts`

**Handlers**:
```typescript
- batches:create
- batches:getById
- batches:getByProduct
- batches:getByBusiness
- batches:update
- batches:updateQuantity
- batches:remove
- batches:getExpiringSoon
- batches:calculateProductStock
```

#### 5.2 Supplier IPC Handlers
```typescript
- suppliers:create
- suppliers:getById
- suppliers:getByBusiness
- suppliers:update
- suppliers:delete
```

#### 5.3 Expiry Settings IPC Handlers
```typescript
- expirySettings:get
- expirySettings:createOrUpdate
```

#### 5.4 Expiry Notification IPC Handlers
```typescript
- expiryNotifications:getByBatch
- expiryNotifications:getByBusiness
- expiryNotifications:getPending
- expiryNotifications:acknowledge
- expiryNotifications:scanAndCreate
```

#### 5.5 Stock Movement IPC Handlers
```typescript
- stockMovements:create
- stockMovements:getByProduct
- stockMovements:getByBatch
- stockMovements:getByBusiness
```

### Phase 6: Preload APIs

#### 6.1 Batch API
**File**: `packages/preload/src/api/batches.ts`

#### 6.2 Supplier API
**File**: `packages/preload/src/api/suppliers.ts`

#### 6.3 Expiry Settings API
**File**: `packages/preload/src/api/expirySettings.ts`

#### 6.4 Expiry Notification API
**File**: `packages/preload/src/api/expiryNotifications.ts`

#### 6.5 Stock Movement API
**File**: `packages/preload/src/api/stockMovements.ts`

### Phase 7: Background Services

#### 7.1 Expiry Check Scheduler
**File**: `packages/main/src/index.ts` (add to initApp)

- Daily cron job to:
  - Auto-update expired batch statuses
  - Scan and create expiry notifications
  - Send pending notifications

## 🔑 Key Business Logic

### FIFO/FEFO Implementation

```typescript
// FEFO (First-Expiry-First-Out) - Default
function selectBatchForSale(productId, quantity, method = "FEFO") {
  const batches = getActiveBatchesByProduct(productId);
  
  if (method === "FEFO") {
    // Sort by expiry date ASC (earliest first)
    batches.sort((a, b) => a.expiryDate - b.expiryDate);
  } else if (method === "FIFO") {
    // Sort by creation date ASC (oldest first)
    batches.sort((a, b) => a.createdAt - b.createdAt);
  }
  
  // Deduct from batches in order until quantity is satisfied
  let remaining = quantity;
  const selectedBatches = [];
  
  for (const batch of batches) {
    if (remaining <= 0) break;
    
    const deductAmount = Math.min(remaining, batch.currentQuantity);
    selectedBatches.push({ batchId: batch.id, quantity: deductAmount });
    remaining -= deductAmount;
  }
  
  return selectedBatches;
}
```

### Stock Calculation

```typescript
function calculateProductStock(productId) {
  const activeBatches = getActiveBatchesByProduct(productId);
  return activeBatches.reduce((sum, batch) => sum + batch.currentQuantity, 0);
}
```

### Expiry Notification Logic

```typescript
function checkBatchExpiry(batch, settings) {
  const now = new Date();
  const expiryDate = new Date(batch.expiryDate);
  const daysUntil = Math.floor((expiryDate - now) / (1000 * 60 * 60 * 24));
  
  if (daysUntil < 0) {
    return { type: "EXPIRED", daysUntil };
  } else if (daysUntil <= settings.criticalAlertDays) {
    return { type: "CRITICAL", daysUntil };
  } else if (daysUntil <= settings.warningAlertDays) {
    return { type: "WARNING", daysUntil };
  } else if (daysUntil <= settings.infoAlertDays) {
    return { type: "INFO", daysUntil };
  }
  
  return null; // No notification needed
}
```

## 📝 Implementation Order

1. **BatchManager** - Core foundation
2. **SupplierManager** - Simple CRUD
3. **ExpirySettingsManager** - Simple CRUD
4. **ExpiryNotificationManager** - Notification records
5. **StockMovementManager** - Stock tracking
6. **Update TransactionManager** - FIFO/FEFO integration
7. **ExpiryNotificationService** - Background service
8. **IPC Handlers** - All managers
9. **Preload APIs** - All APIs
10. **Background Scheduler** - Daily checks

## ✅ Testing Checklist

- [ ] Batch creation with auto-generated batch numbers
- [ ] Batch quantity updates on stock movements
- [ ] FIFO/FEFO batch selection during sales
- [ ] Product stock calculation from batches
- [ ] Expiry notification creation
- [ ] Auto-update of expired batch statuses
- [ ] Stock movement tracking with batch references
- [ ] Transaction items linked to batches
- [ ] Expiry settings per business
- [ ] Notification acknowledgment

## 🚀 Execution

Ready to proceed with implementation following this plan.

