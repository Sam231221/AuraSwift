# AuraSwift POS

Modern window based POS software for supermarket built using electron-vite-builder boilderplate.

## 🏗️ Application Architecture Overview

### Technology Stack

**Electron Multi-Process Architecture:**

- **Main Process:** Node.js with TypeScript
- **Renderer Process:** React 18 + Redux Toolkit + TanStack Query
- **Preload:** Secure IPC bridge with contextBridge

**Key Technologies:**

- **Framework:** Electron 38.1.2, React 18, TypeScript 5.9.2
- **Build Tools:** Vite 7.1.6, electron-builder 26.0.12
- **UI:** Radix UI, Tailwind CSS 4.1.13, Framer Motion
- **Database:** better-sqlite3 (SQLite)
- **Hardware:** node-hid, serialport, usb, node-thermal-printer
- **Payments:** Stripe Terminal (@stripe/stripe-js, @stripe/terminal-js)

---

## 📦 Package Structure

```
packages/
├── main/                    # Electron main process
│   ├── src/
│   │   ├── index.ts        # App entry point
│   │   ├── database.ts     # SQLite database layer (3200+ lines)
│   │   ├── services/
│   │   │   ├── paymentService.ts      # BBPOS WisePad 3 + Stripe
│   │   │   └── thermalPrinterService.ts # ESC/POS printer
│   │   └── modules/
│   │       ├── WindowManager.ts
│   │       ├── AutoUpdater.ts
│   │       └── ...
│   └── package.json        # Dependencies: better-sqlite3, node-thermal-printer
│
├── renderer/                # React UI
│   ├── src/
│   │   ├── main.tsx        # React app entry
│   │   ├── app/            # App providers
│   │   ├── components/     # UI components
│   │   │   ├── payment/    # Stripe Terminal UI
│   │   │   ├── printer/    # Printer status UI
│   │   │   └── scanner/    # Barcode scanner UI
│   │   ├── features/       # Business logic
│   │   │   ├── auth/
│   │   │   ├── inventory/
│   │   │   ├── sales/
│   │   │   └── user-management/
│   │   ├── hooks/
│   │   │   ├── useStripeTerminal.ts   # Card reader integration
│   │   │   ├── useThermalPrinter.ts   # Printer integration
│   │   │   └── useProductionScanner.ts # Barcode scanner
│   │   └── pages/
│   │       └── dashboard/
│   │           └── cashier/
│   │               └── features/
│   │                   └── new-transaction-view.tsx # Main POS UI
│   └── package.json        # 94 lines, 50+ dependencies
│
└── preload/                 # IPC bridge
    ├── src/
    │   ├── index.ts        # Exposes APIs to renderer
    │   └── exposed.ts      # Type definitions
    └── package.json
```

---

## 🔌 Hardware Integration Architecture

### 1. **Thermal Receipt Printer** (ESC/POS Protocol)

**Service:** `packages/main/src/services/thermalPrinterService.ts`

**Supported Hardware:**

- USB: Epson TM Series, Star TSP Series, Citizen CT, Bixolon SRP
- Bluetooth: DIERI BT, Epson TM-P Series, Star SM-L Series

**Key Features:**

- Print queue management
- USB/Bluetooth auto-detection
- Receipt formatting with ESC/POS commands
- Timeout handling (10 seconds)
- Connection monitoring

**IPC Handlers:**

```typescript
printer: initialize; // Connect to printer
printer: print; // Queue and print receipt
printer: status; // Get connection status
printer: test; // Print test receipt
printer: disconnect; // Disconnect printer
printer: interfaces; // Scan for available printers
```

**Implementation Details:**

- Uses `node-thermal-printer` v4.5.0
- Supports character sets (CP437, etc.)
- Handles paper width (58mm, 80mm)
- Native module requiring electron-rebuild

---

### 2. **BBPOS WisePad 3 Card Reader** (Stripe Terminal)

**Service:** `packages/main/src/services/paymentService.ts` (752 lines)

**Hardware:** BBPOS WisePad 3 (USB/Bluetooth)

**Stripe Integration:**

- Stripe API v2025-10-29.clover
- Payment Intent creation
- Card swipe/tap/chip processing
- Terminal reader management

**IPC Handlers:**

```typescript
payment: initialize - reader; // Connect BBPOS device
payment: discover - readers; // Scan for readers
payment: reader - status; // Get connection status
payment: test - reader; // Test reader connection
payment: create - intent; // Create payment intent
payment: process - card; // Process card payment
payment: cancel; // Cancel payment
payment: connection - token; // Get Stripe Terminal token
```

**Implementation Details:**

- Uses `node-hid` for USB communication
- Stripe SDK for payment processing
- Simulated mode for development/testing
- Event-driven architecture
- Battery level monitoring
- Firmware version tracking

**React Hook:** `useStripeTerminal` (500+ lines)

- Auto-initialization
- Payment flow state management
- Error handling
- Progress tracking

---

### 3. **Barcode Scanner Integration**

**Hook:** `packages/renderer/src/hooks/useProductionScanner.ts`

**Features:**

- Hardware scanner event listening
- Audio feedback on successful scan
- Automatic product lookup
- Weight-based product handling

**Implementation:**

- Listens for keyboard input from USB scanner
- Validates barcode format
- Integrates with inventory system

---

## 💾 Database Architecture

**File:** `packages/main/src/database.ts` (3204 lines)

**Database:** SQLite (better-sqlite3)

**Tables:**

- Users (authentication, roles, permissions)
- Businesses (multi-tenant)
- Products (inventory with modifiers)
- Categories
- Transactions (sales records)
- TransactionItems (line items)
- Shifts (cashier shift management)
- CashDrawerCounts (cash reconciliation)
- AuditLogs (comprehensive audit trail)
- StockAdjustments (inventory changes)
- PaymentMethods
- Modifiers/ModifierOptions

**Key Features:**

- RBAC (Role-Based Access Control)
- Multi-tenant support
- Comprehensive audit logging
- Automatic shift closure (30-minute intervals)
- Transaction history
- Inventory tracking
- Cash drawer reconciliation

**Special Product Types:**

- Regular products (fixed price)
- Weight-based products (price per unit: lb, kg, oz, g)
- Products with modifiers

---

## 🔐 Security & Authentication

**Auth Implementation:**

- bcryptjs password hashing
- Session-based authentication
- Token expiration
- Role-based permissions
- IPC handler protection

**Files:**

- `packages/main/src/authApi.ts` - Authentication logic
- `packages/main/src/authStore.ts` - Session management
- `packages/main/src/passwordUtils.ts` - Password hashing

---

## 🔄 Auto-Update System

**Module:** `packages/main/src/modules/AutoUpdater.ts`

**Features:**

- electron-updater integration
- Automatic update checking
- Update download and installation
- User notification
- Version checking

**Disabled in:**

- Test environment (`NODE_ENV=test`)
- When `ELECTRON_UPDATER_DISABLED=1`

---

## 🎨 UI Architecture

### **Component Library:** Shadcn UI + Tailwind CSS

**Key Pages:**

1. **Authentication**

   - Login/Register
   - Password management

2. **Dashboard**

   - Cashier view (main POS interface)
   - Inventory management
   - Sales reporting
   - User management
   - Shift management

3. **POS Transaction Flow**
   - Product search/barcode scan
   - Cart management
   - Weight-based product handling
   - Payment processing (cash/card)
   - Receipt printing
   - Shift management

### **State Management:**

- Redux Toolkit for global state
- TanStack Query for server state
- Local state with React hooks

---

## 🧪 Testing Architecture

**Framework:** Playwright 1.55.0

**Test Files:**

1. `tests/e2e.spec.ts` - End-to-end tests
2. `tests/hardware-integration.spec.ts` - Hardware API tests

**Test Environment:**

- Headless Electron
- Mock hardware devices
- Simulated payment processing
- Test database

**Environment Variables:**

```env
CI=true
NODE_ENV=test
ELECTRON_DISABLE_GPU=1
ELECTRON_NO_SANDBOX=1
PLAYWRIGHT_HEADLESS=1
HARDWARE_SIMULATION_MODE=true
MOCK_PRINTER_ENABLED=true
MOCK_CARD_READER_ENABLED=true
MOCK_SCANNER_ENABLED=true
ELECTRON_UPDATER_DISABLED=1
```

---

## 📝 Build & Distribution

### **Build Process:**

1. Build renderer (Vite)
2. Build main process (Vite + TypeScript)
3. Build preload (Vite)
4. Run electron-rebuild for native modules
5. Package with electron-builder

### **Native Modules Requiring Rebuild:**

- `better-sqlite3` - Database
- `node-hid` - USB device communication
- `serialport` - Serial port communication
- `usb` - USB device access

### **Platforms:**

- Primary: Windows (windows-latest runner)
- Configuration: `electron-builder.mjs`

### **Artifacts:**

- Windows installers (.exe)
- Portable apps
- Auto-update manifests (latest.yml)

---

## 📊 Dependency Analysis

### **Heavy Dependencies (Build Time Impact):**

1. **Electron** (38.1.2)

   - Large download (~150 MB)
   - Version-locked with native modules
   - Skipped in semantic-release job

2. **Playwright** (~300 MB with browsers)

   - Only needed for testing
   - Now conditionally installed

3. **Native Modules** (compilation required)

   - better-sqlite3
   - node-hid
   - serialport
   - usb

4. **UI Framework** (Radix UI)
   - 20+ Radix UI packages
   - Now grouped in dependabot

### **Optimization Strategy:**

- Skip Electron download when not needed
- Skip Playwright download when not needed
- Cache compiled native modules
- Group related dependency updates

---

## 🔍 Code Quality Observations

### **Strengths:**

✅ Well-organized monorepo structure  
✅ Clear separation of concerns  
✅ Comprehensive error handling  
✅ Extensive documentation  
✅ Type safety with TypeScript  
✅ Hardware abstraction layers

### **Areas for Future Improvement:**

- Consider removing mock printer service to avoid confusion
- Consolidate documentation across multiple files
- Add unit tests for business logic
- Consider splitting large database file (3200 lines)

---

## 🎯 Future Workflow Optimization Alignment

1. **Native Module Caching:**

   - The app has 4 native modules requiring compilation
   - Each rebuild: 3-5 minutes
   - Cached: <30 seconds
   - **Impact:** Critical for development velocity

2. **Dependency Grouping:**

   - 20+ Radix UI packages update frequently
   - Grouping reduces 20 PRs → 1 PR
   - **Impact:** Less workflow noise and cost

3. **Job Consolidation:**

   - Typecheck + compile shared identical setup
   - Separate jobs wasted 5+ minutes on duplicate setup
   - **Impact:** 40% faster builds

4. **Smart Test Execution:**
   - Playwright (300MB) not always needed
   - Conditional installation saves time and bandwidth
   - **Impact:** Faster builds when tests unchanged

---

## 📈 Performance Characteristics

### **App Startup:**

- Database initialization
- Hardware service initialization (printer, card reader)
- Auto-update check
- Shift cleanup (auto-close old shifts)

### **Runtime:**

- Real-time barcode scanning
- Card payment processing
- Receipt printing
- Database queries
- Audit logging

### **Build Characteristics:**

- TypeScript compilation: ~30 seconds
- Vite bundling: ~1-2 minutes
- Native module rebuild: 3-5 minutes (or cached: ~30 seconds)
- Electron packaging: ~2 minutes

---

## 🎓 Lessons for Workflow Design

### **Key Insights:**

1. **Native modules are expensive**

   - Cache aggressively
   - Rebuild only when necessary
   - Verify builds before running tests

2. **Hardware integration is complex**

   - Mock/simulate for CI
   - Test real hardware separately
   - Document hardware requirements

3. **Electron apps are large**

   - Skip downloads when possible
   - Use artifacts for distribution
   - Cache everything feasible

4. **POS systems need reliability**
   - Comprehensive error handling
   - Audit logging
   - Transaction integrity
   - Hardware failure recovery

---

## 🗄️ Database Configuration

This POS system uses **environment-aware database storage**:

- **Development**: Database stored in `./dev-data/pos_system.db` (project directory)
- **Production**: Database stored in OS-specific user data directory
  - **Windows**: `%APPDATA%/AuraSwift/pos_system.db`
  - **macOS**: `~/Library/Application Support/AuraSwift/pos_system.db`
  - **Linux**: `~/.config/AuraSwift/pos_system.db`

### Database Management Scripts

- `npm run db:dev:clean` - Remove development database
- `npm run db:dev:backup` - Create timestamped backup of development database
- `npm run db:dev:restore` - List available backup files
- `npm run db:info` - Show how to get database information in the app

### Using an Existing Database

If you have an existing database file, you have several options:

**Option 1: Use Custom Path (Recommended)**

```bash
export POS_DB_PATH="/path/to/your/existing/database.db"
npm start
```

**Option 2: Migration Helper Scripts**

```bash
# Check your existing database
npm run db:migrate check /path/to/your/database.db

# Copy to development location
npm run db:migrate copy-to-dev /path/to/your/database.db

# Copy to production location
npm run db:migrate copy-to-prod /path/to/your/database.db

# Show all database path locations
npm run db:paths
```

**Option 3: Manual Copy**

```bash
# For development
cp "/path/to/your/database.db" "./dev-data/pos_system.db"

# For production (macOS)
cp "/path/to/your/database.db" "$HOME/Library/Application Support/AuraSwift/pos_system.db"
```

See [use-existing-db.md](./use-existing-db.md) for detailed migration instructions.

## Contribution

See [Contributing Guide](CONTRIBUTING.md).

[vite]: https://github.com/vitejs/vite/
[electron]: https://github.com/electron/electron
[electron-builder]: https://github.com/electron-userland/electron-builder
[playwright]: https://playwright.dev
