## ⚖️ Case Handling of Cashier entry

### **1. Cashier does NOT log in / does NOT click Start Shift**

- **Schedule status:**

  - If scheduled start time passes and no shift is linked → mark schedule as **Missed**.

- **System behavior:**

  - Manager report shows: _“Scheduled 08:00–16:00, not started.”_
  - No shift record created.

- **Option:**

  - Some systems allow manager override: create a backdated shift if needed.

---

### **2. Cashier clicks Start Shift EARLY (before schedule start time)**

- Example: scheduled 08:00, cashier clicks at 07:45.
- **System behavior:**

  - Allow starting, but:

    - Link the shift to the schedule.
    - Mark the **actual start** as 07:45.

- **Reporting:**

  - “Scheduled: 08:00” vs “Actual: 07:45” → flagged as **early login**.

- **Option:**

  - You can enforce rules:

    - If too early (say >30 min before), block and show warning:
      _“You can only start your shift within 30 minutes of your scheduled time.”_

---

### **3. Cashier clicks Start Shift LATE (after schedule start time)**

- Example: scheduled 08:00, cashier clicks at 08:20.
- **System behavior:**

  - Allow starting, link to schedule.
  - Actual start recorded as 08:20.

- **Reporting:**

  - Show variance: _Late start by 20 min._
  - Useful for attendance/punctuality tracking.

---

## 🔄 Summary of Rules

| Case           | What Happens                                | Schedule Status | Report Outcome         |
| -------------- | ------------------------------------------- | --------------- | ---------------------- |
| Not logging in | No shift record                             | **Missed**      | Marked absent          |
| Starts early   | Shift record created (earlier than planned) | **Active**      | “Started 15 min early” |
| Starts late    | Shift record created (later than planned)   | **Active**      | “Started 20 min late”  |

---

## 📊 Why This Matters

- **Managers** get clear insight into attendance.
- **Cashier side** stays simple (they just click _Start Shift_).
- **System side** enforces consistency: planned vs actual time always tracked.

---

---

## 🔄 General Rule in Retail POS

👉 **Transactions must always be tied to an active shift**.

- If no shift is started → cashier can’t ring sales, void, or refunds.
- This ensures:

  - Proper drawer accountability.
  - Audit trails (every sale belongs to a shift).
  - Manager can track performance per shift.

---

## 🖥️ What the Cashier Sees

### 1. **Before Starting Shift**

- Dashboard shows:

  - _“No active shift”_ warning.
  - _Upcoming shift info_ (if scheduled).
  - **Sales, refunds, void buttons are disabled.**

- Cashier **cannot** perform transactions until they click **Start Shift**.

---

### 2. **During Active Shift**

Once cashier clicks **Start Shift**:

- **Sales Data Panel (Dashboard)** updates live:

  - Total Sales (e.g. $1,250 today).
  - Total Transactions (e.g. 45).
  - Refunds (count + amount).
  - Voids (count).
  - Cash Drawer Balance.

- **Action Buttons (enabled):**

  - **New Sale / New Transaction** → starts scanning items.
  - **Refund Transaction** → pick a past receipt, issue refund.
  - **Void Transaction** → cancel an open/just-completed transaction.

---

### 3. **End of Shift**

- Cashier **cannot** start new sales after ending the shift.
- Dashboard switches back to _Start Shift_ state.
- Sales data from that shift is frozen for reporting.

---

## 🔑 Flow of Transaction Handling

### 🛒 New Transaction (Sale)

1. Cashier scans items.
2. POS totals amount, applies tax.
3. Customer pays → POS records payment type (cash, card).
4. Transaction is saved with:

   - `shift_id`
   - `cashier_id`
   - `timestamp`
   - `items, totals, payment info`

---

### 🔄 Void Transaction

- Used for mistakes (wrong item, wrong customer).
- Can only void **current/open transaction** or recently completed ones.
- Record is stored with a **void flag** (not deleted).
- Still tied to shift, for accountability.

---

### 💸 Refund Transaction

- Select past receipt.
- POS creates a **negative transaction**:

  - Same items, negative totals.
  - Linked to original transaction.

- Drawer balance adjusted automatically.
- Logged in **refunds counter** for that shift.

---

## 🔍 Example Cashier Day (real world)

- 09:00 → Cashier logs in, but **cannot sell** (no shift yet).
- 09:05 → Starts shift, drawer initialized with $200.
- 09:15 → Rings first sale ($50 cash). Drawer now $250.
- 11:00 → Refunds $10 item from earlier sale. Drawer now $240.
- 12:30 → Accidentally starts a wrong transaction, voids it. Void count = 1.
- 04:00 PM → Ends shift. Final drawer expected = $1,050.

Manager sees in reports:

- Sales $850, 42 transactions.
- Refunds $10, 1 transaction.
- Voids 1 transaction.
- Cash drawer variance = +$5 (if cashier counted $1,055).

---

✅ **In short:**

- **No shift = no sales/refunds/voids.**
- **Shift active = full transaction features unlocked.**
- **Reports tie everything back to the shift.**

---

## 💵 Cash Drawer count flow

- The **cash drawer** is the physical till where money is stored.
- In the software, it’s tracked as a **starting balance + transactions – payouts/refunds**.
- At the **start of a shift**, the drawer must be **initialized** (set to a known starting amount), so the system can calculate cash variances later.

---

### 🔑 Initialization Process

When cashier clicks **Start Shift**:

1. **System asks for starting cash** (e.g. \$200).

   - Sometimes set by **manager** before shift.
   - Sometimes cashier **counts cash** and enters it.

2. That amount is stored in the shift record:

   - Example: `starting_cash = 200.00`

3. From that point:

   - Every **cash sale** increases drawer balance.
   - Every **refund/void in cash** decreases drawer balance.
   - **Payouts/expenses** (e.g. giving change to customer, or cash taken out for supplier) also reduce it.

👉 The drawer’s **baseline (starting amount)** is set at shift start, and all calculations for variance (expected vs actual counted cash) will be based on that number.

---

### 🧮 Example

- Start shift → enter `$200` in drawer.
- Sales in cash during shift → `$500`.
- Refunds in cash → `-$50`.
- Expected drawer at end = `200 + 500 - 50 = $650`.
- If cashier actually counts `$645`, variance = `-5`.

---

---

## 🔄 Full Flow: Schedules ↔ Shifts ↔ Cashier Actions

### 1. **Schedules Created (by Manager/Admin)**

- Manager goes to your new **Schedules Page**.
- Adds staff schedule:

  - Staff name, role
  - Planned start/end time
  - Assigned store/register

- These are stored in a **`schedules` table** in the DB.

  - Example:

    ```json
    {
      "id": 1,
      "staff_id": "cashier-123",
      "start_time": "2025-09-24T08:00:00",
      "end_time": "2025-09-24T16:00:00",
      "status": "upcoming"
    }
    ```

---

### 2. **Cashier Logs Into POS (Electron App)**

- Cashier enters their credentials.
- System queries DB: _Does this cashier have a schedule today?_

  - If yes → show upcoming schedule info (start/end time, remaining hours).
  - If no → warn: _“No schedule assigned today. Do you want to start an unscheduled shift?”_ (optional).

---

### 3. **Cashier Starts Shift**

- Cashier clicks **Start Shift**.
- System checks:

  - If this login matches a **scheduled shift**, it links the `shift` record to the `schedule_id`.
  - If unscheduled, it still creates a shift record, but without linking to a schedule.

**DB Example – shift record created:**

```json
{
  "id": 55,
  "schedule_id": 1,
  "cashier_id": "cashier-123",
  "start_time": "2025-09-24T08:05:00",
  "status": "active",
  "starting_cash": 200
}
```

---

### 4. **During the Shift**

- All transactions (sales, refunds, voids) are stored with `shift_id`.
- Drawer tracking is tied to that `shift_id`.
- The schedule itself can update status automatically:

  - _Active_ → when cashier starts shift.
  - _Completed_ → when shift ends.
  - _Missed_ → if cashier never logged in and start time passes.

---

### 5. **Cashier Ends Shift**

- Cashier clicks **End Shift**.
- System finalizes:

  - Updates `shifts` table: `end_time`, totals, variance.
  - Updates linked schedule status to **Completed**.

- Cash drawer reconciliation happens here.

---

### 6. **Reports**

- Manager can view:

  - Planned vs actual shifts (did cashier start on time? end on time?)
  - Sales/transactions per scheduled shift.
  - Variances in drawer count.

---

## 🔑 Flow Example (Timeline)

1. Manager assigns Alice → 08:00–16:00.
2. At 08:05, Alice logs into POS → software detects her schedule, links shift.
3. She starts shift → drawer initialized, transactions tracked.
4. At 16:01, Alice clicks **End Shift** → shift closes, schedule marked **Completed**.
5. Reports show: _Scheduled 8:00–16:00, Actual 08:05–16:01._

---

✅ This way, **Schedules** = planned work time,
**Shifts** = actual logged-in work session.
Both link together through **cashier login and shift start**.

---

---

## ⚖️ Case Handling

### **1. Cashier does NOT log in / does NOT click Start Shift**

- **Schedule status:**

  - If scheduled start time passes and no shift is linked → mark schedule as **Missed**.

- **System behavior:**

  - Manager report shows: _“Scheduled 08:00–16:00, not started.”_
  - No shift record created.

- **Option:**

  - Some systems allow manager override: create a backdated shift if needed.

---

### **2. Cashier clicks Start Shift EARLY (before schedule start time)**

- Example: scheduled 08:00, cashier clicks at 07:45.
- **System behavior:**

  - Allow starting, but:

    - Link the shift to the schedule.
    - Mark the **actual start** as 07:45.

- **Reporting:**

  - “Scheduled: 08:00” vs “Actual: 07:45” → flagged as **early login**.

- **Option:**

  - You can enforce rules:

    - If too early (say >30 min before), block and show warning:
      _“You can only start your shift within 30 minutes of your scheduled time.”_

---

### **3. Cashier clicks Start Shift LATE (after schedule start time)**

- Example: scheduled 08:00, cashier clicks at 08:20.
- **System behavior:**

  - Allow starting, link to schedule.
  - Actual start recorded as 08:20.

- **Reporting:**

  - Show variance: _Late start by 20 min._
  - Useful for attendance/punctuality tracking.

---

## 🔄 Summary of Rules

| Case           | What Happens                                | Schedule Status | Report Outcome         |
| -------------- | ------------------------------------------- | --------------- | ---------------------- |
| Not logging in | No shift record                             | **Missed**      | Marked absent          |
| Starts early   | Shift record created (earlier than planned) | **Active**      | “Started 15 min early” |
| Starts late    | Shift record created (later than planned)   | **Active**      | “Started 20 min late”  |

---

## 📊 Why This Matters

- **Managers** get clear insight into attendance.
- **Cashier side** stays simple (they just click _Start Shift_).
- **System side** enforces consistency: planned vs actual time always tracked.

---
