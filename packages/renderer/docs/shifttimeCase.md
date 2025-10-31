Scenario: suppose, a manager creates a shcedule/shift for 2pm to 9pm on sept 26. the cashier for that shift logins on 3:33pm and on the dashboard, it displays the started time 3:33pm and ends on 9pm. and the manager later on extends the end time to 10pm while sets the start time of that shift to 1pm,
— this is where **scheduled shift vs. actual worked shift** must be treated separately.

Let’s break it down:

---

## 1. Two Different Timelines

- **Scheduled Shift** → What the manager sets in advance (planned working hours).
  Example: Sept 26, **2:00 PM → 9:00 PM**.
- **Actual Shift** → When the cashier really logged in and started working.
  Example: Sept 26, **3:33 PM → (auto end when cashier ends shift)**.

👉 They are related but not identical. Most POS / workforce systems (like Square, Toast, Deputy) store **both**.

---

## 2. Case Walkthrough

### Initial Schedule

- Manager creates: `start_time = 2:00 PM, end_time = 9:00 PM`.
- Cashier is expected to work those hours.

---

### Cashier Logs In Late

- Cashier logs in at **3:33 PM**.
- Dashboard shows:

  - **Scheduled shift**: 2:00 PM–9:00 PM.
  - **Actual clock-in**: 3:33 PM.
  - Remaining time calculated from scheduled **end time (9:00 PM)**.

---

### Manager Extends End Time

- Manager updates schedule to `end_time = 10:00 PM`.
- Cashier’s dashboard updates live:

  - Shift now shows ending at **10:00 PM**.
  - Countdown updates accordingly.

---

### Manager Changes Start Time (Backwards to 1 PM)

- Schedule now: `start_time = 1:00 PM, end_time = 10:00 PM`.
- Cashier **still clocked in at 3:33 PM**.
- System should not “backfill” work from 1:00–3:33 PM, because cashier wasn’t there.

So:

- **Scheduled shift**: 1:00 PM–10:00 PM.
- **Actual worked shift**: 3:33 PM–?? (until they end).

Reports will then show:

- Scheduled hours = 9 hours.
- Actual worked hours = e.g. 6h 27m.
- Variance = late start.

---

## 3. Best Practice (Real-World POS/HR)

- Always **keep scheduled times separate from actual clock-in/out**.
- Dashboard should show:

  - **Scheduled shift (what manager planned)**.
  - **Actual clock-in (when cashier started working)**.

- Adjustments by managers (extending shift, moving start earlier) **do not overwrite actual times** — they only affect planned hours.

---

## 4. Example UI on Dashboard

Cashier dashboard after logging in at 3:33 PM:

```
Scheduled Shift:   1:00 PM – 10:00 PM
Clocked In:        3:33 PM
Ends:              10:00 PM
Time Remaining:    6h 27m
```

---

👉 This way, **cashier sees when they’re expected to finish**, while reports keep the truth of when they actually worked.
