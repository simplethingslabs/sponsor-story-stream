
# Phase 5: Minimal Payment System (No Payment Gateway Required)

## Overview

Since you don't have Razorpay or any payment gateway integration, the **minimal implementation** focuses on:

1. **Manual Payment Recording** - Admins log payments received via UPI, bank transfer, or cheque
2. **Payment Tracking Dashboard** - View collection status and overdue payments
3. **Sponsor Payment History** - Sponsors can see their payment records and download receipts
4. **80G Tax Receipt Generation** - PDF receipts for tax deduction purposes

This approach is common for NGOs in India where sponsors pay via direct bank transfer/UPI and admins manually reconcile.

---

## What This Implementation Includes

| Feature | Admin | Sponsor |
|---------|-------|---------|
| Record payments manually | Yes | No |
| View all payment history | Yes | Own only |
| Financial dashboard with charts | Yes | No |
| Send payment reminders | Yes | No |
| View/download 80G receipts | Yes | Yes |
| Mark payments as received | Yes | No |
| See overdue payments | Yes | Own only |

---

## Implementation Details

### 1. Types & Mock Data

**File: `src/types/index.ts`**

Add new payment-related types:

```text
+-------------------------+
| Payment                 |
+-------------------------+
| id: string             |
| sponsor_id: string     |
| child_id: string       |
| amount: number         |
| currency: 'INR'        |
| status: PaymentStatus  |
| payment_method         |
| payment_date           |
| due_date              |
| receipt_number        |
| notes                 |
+-------------------------+
```

Payment statuses: `pending` | `paid` | `overdue` | `cancelled`

**File: `src/data/mockData.ts`**

Add mock payment data for testing with various statuses.

---

### 2. Admin Financial Dashboard

**New File: `src/pages/admin/FinancialDashboard.tsx`**

A comprehensive overview page showing:

- **Stats Cards**: Total collected (month/quarter/year), pending amount, overdue count
- **Collection Trend Chart**: Line chart showing monthly collections (uses Recharts)
- **Payment Status Breakdown**: Pie chart of paid vs pending vs overdue
- **Quick Actions**: Links to record payment, view overdue, send reminders

---

### 3. Admin Payment Management

**New File: `src/pages/admin/PaymentManagement.tsx`**

Full payment management interface:

- **Payment List**: Filterable table of all payments
- **Filters**: By status (all/pending/paid/overdue), by sponsor, by date range
- **Record Payment Dialog**: Form to manually record a new payment
  - Select sponsor
  - Select child (if applicable)
  - Amount (with INR default)
  - Payment method: UPI / Bank Transfer / Cheque / Cash
  - Payment date
  - Reference number (UPI transaction ID, cheque number, etc.)
  - Notes
- **Mark as Paid**: Quick action to mark pending payments as received
- **Send Reminder**: Send email reminder to sponsor for overdue payments

---

### 4. Admin 80G Receipt Generator

**Integrated into Payment Management**

- Generate 80G tax receipt for any paid payment
- PDF format using `react-to-print` (already installed)
- Includes:
  - Organization name and 80G registration details
  - Receipt number (auto-generated)
  - Sponsor name and address
  - Donation amount in words and figures
  - Date of receipt
  - Purpose (child sponsorship)

---

### 5. Sponsor Payment Portal

**New File: `src/pages/sponsor/Payments.tsx`**

Sponsor-facing payment page showing:

- **Next Payment Due**: Highlighted card with due date and amount
- **Payment History**: List of all past payments with status
- **Download Receipts**: Link to download 80G receipt for each paid transaction
- **Payment Instructions**: Static section showing how to pay
  - Bank account details (configurable)
  - UPI ID
  - Cheque instructions

---

### 6. Navigation Updates

**Files: `AdminLayout.tsx`, `SponsorLayout.tsx`, `App.tsx`**

- Add "Financials" section in admin navigation with:
  - Financial Dashboard
  - Payment Management
- Add "Payments" link in sponsor navigation
- Register new routes

---

## Files to Create/Modify

| File | Action | Purpose |
|------|--------|---------|
| `src/types/index.ts` | Modify | Add Payment types |
| `src/data/mockData.ts` | Modify | Add mock payment data |
| `src/pages/admin/FinancialDashboard.tsx` | Create | Admin overview |
| `src/pages/admin/PaymentManagement.tsx` | Create | Payment CRUD |
| `src/components/payments/PaymentReceipt.tsx` | Create | 80G receipt template |
| `src/pages/sponsor/Payments.tsx` | Create | Sponsor payment history |
| `src/components/layouts/AdminLayout.tsx` | Modify | Add nav links |
| `src/components/layouts/SponsorLayout.tsx` | Modify | Add nav link |
| `src/App.tsx` | Modify | Register routes |

---

## Technical Notes

### No Backend Changes Initially

Since this is frontend-only with mock data, no backend migration is needed for testing. When ready to connect to the real backend, you would add:

```sql
-- Future backend migration
CREATE TABLE payments (
    id UUID PRIMARY KEY,
    sponsor_id UUID REFERENCES users(id),
    child_id UUID REFERENCES children(id),
    amount DECIMAL(10,2) NOT NULL,
    currency VARCHAR(3) DEFAULT 'INR',
    status VARCHAR(20) DEFAULT 'pending',
    payment_method VARCHAR(50),
    payment_date TIMESTAMP,
    due_date DATE,
    receipt_number VARCHAR(50),
    notes TEXT,
    created_at TIMESTAMP,
    updated_at TIMESTAMP
);
```

### Libraries Used (Already Installed)

- **Recharts**: Financial charts (already used in Phase 2)
- **react-to-print**: 80G receipt PDF generation (already used in Phase 2)
- **date-fns**: Date formatting (already installed)

---

## Future Enhancements (Not in Minimal)

These can be added later when you integrate a payment gateway:

1. **Razorpay/PayU Integration** - Online payment collection
2. **Auto-recurring Payments** - Scheduled monthly sponsorship payments
3. **Payment Link Generation** - Send payment links to sponsors
4. **SMS Reminders** - Requires SMS provider (MSG91, Twilio)
5. **Automated Receipt Emailing** - Send receipts via Resend

---

## Summary

This minimal implementation gives you:

- Complete visibility into payment collections
- Manual payment tracking (perfect for bank transfer/UPI payments)
- Legal 80G tax receipts for sponsors
- Overdue payment alerts and reminders
- No external payment gateway required

Ready to implement when you approve.
