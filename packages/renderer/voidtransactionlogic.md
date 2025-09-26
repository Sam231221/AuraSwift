Refunds and voids seem similar, but they serve **different purposes**:

- **Refund** = customer has already been charged, money goes back.
- **Void** = the transaction is **canceled before final settlement** (like canceling a mistake before it “counts”).

---

## 🔹 Optimal Business Logic for **Void Transaction**

### 1. **Eligibility Check**

- Only transactions that meet certain conditions can be voided:

  - **Same shift / same business day** (commonly enforced).
  - **No refunds already processed** against it.
  - **Not yet settled with payment provider** (for cards).

✅ Prevents void abuse and accounting errors.

---

### 2. **Identify the Transaction**

- Cashier selects a transaction from **Recent Transactions** or enters transaction ID.
- System fetches full transaction details (items, payment method, totals).

✅ Ensures cashier is voiding the correct sale.

---

### 3. **Manager / Role Validation**

- For accountability, require:

  - **Manager PIN/approval** for voiding.
  - Or set a threshold (e.g., voids over $100 need approval).

✅ Prevents unauthorized voids (common fraud vector).

---

### 4. **Void Processing**

When void confirmed:

- Mark the original transaction as **Voided** (status flag).
- Do **NOT delete** — keep full audit trail.
- Create a corresponding **void record** with:

  - `void_id`, `original_transaction_id`, reason, cashier, timestamp, approving manager (if applicable).

✅ Maintains transparency and traceability.

---

### 5. **Adjustments to System Data**

- **Sales totals** → decrease by voided amount.
- **Cash drawer**:

  - If cash → subtract from drawer.
  - If card → no drawer adjustment, but ensure not to send to settlement batch.

- **Shift performance** → transactions count and sales updated.
- **Adjustments summary** → increment void count.

✅ Keeps shift/session data correct.

---

### 6. **Inventory Updates**

- Reverse stock deduction (add items back).
- Exception: if items are perishable/consumed, flag as **non-returnable**.

✅ Prevents negative stock issues.

---

### 7. **Void Receipt / Audit Log**

- Print or save a **Void Receipt**: shows original transaction number, reason, and who authorized it.
- Add entry to **audit log** for compliance.

✅ Paper trail for disputes and fraud prevention.

---

## 🔹 Edge Case Rules

- **Time Window**: Only allow voids within X minutes/hours of sale (e.g., 30 min). After that → must do a refund.
- **Card Transactions**: If already sent for settlement → cannot void, must process refund.
- **Cash Transactions**: Adjust drawer immediately.
- **Reporting**: Always keep voids visible in end-of-day and shift reports.

---

## ✅ Example Quick Action Flow

1. Cashier clicks **Void Transaction**.
2. Enter/select transaction ID.
3. System checks eligibility → prompts manager approval if needed.
4. Confirm void → transaction marked as voided, sales/drawer adjusted.
5. Print void receipt + log in adjustments.

---

👉 This logic makes voiding:

- **Clear** (customer not charged or reversed immediately).
- **Safe** (fraud controlled with rules + manager approvals).
- **Accurate** (all reports stay consistent).
- **Traceable** (every void logged with reason + responsible person).

---
