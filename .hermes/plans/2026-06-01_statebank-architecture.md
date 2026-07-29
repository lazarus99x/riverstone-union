# StateBank Online Banking System — Architecture Plan

> **Status:** Pre-build architecture & design document  
> **Version:** 2.0  
> **Date:** 2026-06-01

**Goal:** Build a production-grade online banking platform with full admin management, POV-code security transfer system, loans, multi-currency, and frictionless email notifications via Supabase.

**Architecture:** Next.js 16 App Router + Supabase (PostgreSQL, Auth, pgmq for email queue). No payment gateway — all transactions are simulated with a social-engineering security layer (POV codes). Admin manages everything from a single panel.

**Tech Stack:** Next.js 16, Supabase (PostgreSQL, Auth, pgmq, Storage), Tailwind CSS v4, Recharts, sonner, Resend (via Supabase Edge Functions). Email handled entirely within Supabase — no external email vendor lock-in on redeploy.

---

## 1. Core System Logic — POV Code Security Layer

This is the unique differentiator of StateBank. Every transaction goes through a **Proof of Verification (POV)** flow:

```
User initiates transaction (transfer/withdrawal/payment)
        │
        ▼
System validates balance + limits
        │
        ▼
80% chance → FLAGGED for POV verification
20% chance → Processes immediately
        │
        ▼
If FLAGGED:
  - Transaction status = 'pending_pov'
  - System generates a 6-digit POV code (stored hashed)
  - User sees: "This transaction requires a POV security code.
                Contact support or live chat to receive your code."
  - User opens live chat / submits support ticket
  - Support agent verifies user identity
  - Agent retrieves POV code from admin panel
  - Agent gives code to user
  - User enters POV code → transaction completes
        │
        ▼
If NOT flagged → processes immediately (status = 'completed')
```

**POV Code Properties:**
- 6-digit numeric, randomly generated
- Hashed in DB (bcrypt) — even admins can't see plaintext
- Admin can **generate a new code** which replaces the old one
- Expires after 15 minutes
- Single-use only
- Failed attempts > 3 → transaction cancelled, user notified

---

## 2. Database Schema Additions

### New Tables (beyond core banking schema)

#### `pov_codes`
| Column | Type | Notes |
|--------|------|-------|
| id | UUID PK | |
| transaction_id | UUID FK → transactions | |
| code_hash | TEXT | bcrypt hash of the 6-digit code |
| expires_at | TIMESTAMPTZ | 15 min from creation |
| attempts | INT | failed attempts counter |
| max_attempts | INT | default 3 |
| created_at | TIMESTAMPTZ | |
| used_at | TIMESTAMPTZ | nullable |

#### `support_tickets`
| Column | Type | Notes |
|--------|------|-------|
| id | UUID PK | |
| user_id | UUID FK → profiles | |
| transaction_id | UUID FK → transactions | nullable |
| subject | TEXT | |
| message | TEXT | |
| status | TEXT | 'open' / 'in_progress' / 'resolved' / 'closed' |
| priority | TEXT | 'low' / 'medium' / 'high' / 'urgent' |
| assigned_to | UUID FK → admin_profiles | nullable |
| pov_code_requested | BOOLEAN | |
| resolved_at | TIMESTAMPTZ | |
| created_at | TIMESTAMPTZ | |
| updated_at | TIMESTAMPTZ | |

#### `loans`
| Column | Type | Notes |
|--------|------|-------|
| id | UUID PK | |
| user_id | UUID FK → profiles | |
| account_id | UUID FK → bank_accounts | disbursement account |
| loan_type | TEXT | 'personal' / 'business' / 'mortgage' / 'education' |
| principal | NUMERIC(18,2) | original loan amount |
| interest_rate | NUMERIC(5,4) | annual rate |
| tenure_months | INT | |
| monthly_payment | NUMERIC(18,2) | calculated |
| remaining_balance | NUMERIC(18,2) | |
| total_paid | NUMERIC(18,2) | |
| status | TEXT | 'pending' / 'approved' / 'active' / 'closed' / 'defaulted' |
| purpose | TEXT | |
| collateral | TEXT | nullable |
| approved_by | UUID FK → admin_profiles | |
| approved_at | TIMESTAMPTZ | |
| first_payment_date | DATE | |
| next_payment_date | DATE | |
| created_at | TIMESTAMPTZ | |
| updated_at | TIMESTAMPTZ | |

#### `loan_payments`
| Column | Type | Notes |
|--------|------|-------|
| id | UUID PK | |
| loan_id | UUID FK → loans | |
| transaction_id | UUID FK → transactions | |
| amount | NUMERIC(18,2) | |
| principal_part | NUMERIC(18,2) | |
| interest_part | NUMERIC(18,2) | |
| payment_date | DATE | |
| status | TEXT | 'scheduled' / 'paid' / 'missed' / 'late' |
| created_at | TIMESTAMPTZ | |

#### `email_queue` (via Supabase pgmq)
| Column | Type | Notes |
|--------|------|-------|
| id | BIGSERIAL PK | |
| to_email | TEXT | |
| subject | TEXT | |
| html_body | TEXT | |
| type | TEXT | 'deposit_confirmation' / 'withdrawal_confirmation' / 'transfer' / 'pov_code' / 'welcome' |
| metadata | JSONB | |
| status | TEXT | 'pending' / 'sent' / 'failed' |
| created_at | TIMESTAMPTZ | |
| sent_at | TIMESTAMPTZ | |

---

## 3. Sign-Up Flow (Bank-Grade)

```
User clicks "Open Account"
        │
        ▼
Sign-up form (bank-grade, not basic):
  ┌─────────────────────────────────────┐
  │ Personal Information                │
  │  ○ Full Legal Name                  │
  │  ○ Email Address                    │
  │  ○ Phone Number                     │
  │  ○ Date of Birth                    │
  │  ○ Social Security Number (last 4)  │
  │                                     │
  │ Address                             │
  │  ○ Street Address                   │
  │  ○ City                             │
  │  ○ State                            │
  │  ○ Zip Code                         │
  │  ○ Country                          │
  │                                     │
  │ Account Preferences                 │
  │  ○ Account Type: [Checking ▼]       │
  │  ○ Currency: [USD ▼]               │
  │  ○ Initial Deposit: $0.00           │
  │                                     │
  │ Security                            │
  │  ○ Password (with strength meter)   │
  │  ○ Confirm Password                 │
  │  ○ [x] Agree to Terms & Conditions  │
  │  ○ [x] Privacy Policy Acknowledged  │
  │                                     │
  │ ┌─────────────────────────────────┐ │
  │ │        Open Account →           │ │
  │ └─────────────────────────────────┘ │
  └─────────────────────────────────────┘
        │
        ▼
Supabase Auth triggers email verification
        │
        ▼
User verifies email (clicks link)
        │
        ▼
User is redirected to app → auto-logged in
        │
        ▼
🎉 **Welcome Dialog** (modal):
  ┌──────────────────────────────────────┐
  │  🎉 Welcome to StateBank!            │
  │                                      │
  │  Your account is ready:              │
  │                                      │
  │  Account Number: STBK-4829-1736-04   │
  │  Account Name: John Doe - Checking    │
  │  Account Type: Checking               │
  │  Currency: USD                        │
  │  Email: john@email.com                │
  │  Balance: $0.00                       │
  │                                      │
  │  ┌──────────────────────────────┐    │
  │  │      Go to Dashboard →       │    │
  │  └──────────────────────────────┘    │
  └──────────────────────────────────────┘
        │
        ▼
Dashboard — user can now use banking features
```

---

## 4. Admin Panel (Everything in One Place)

### 4.1 Admin Dashboard Tabs

| Tab | Features |
|-----|----------|
| **Overview** | Total users, accounts, pending txns, pending loans stats |
| **Users** | List users, search, view details, verify account, ban/delete, assign account numbers |
| **Transactions** | All transactions, filter by status/type, approve/reject, **back-date transactions**, view POV status |
| **Deposits** | Admin deposit into user account (credit), set back-date |
| **Withdrawals** | Process withdrawals, approve/reject |
| **Loans** | Approve/reject loan applications, view repayment schedule, mark as defaulted |
| **Limits** | Set per-user transaction limits (daily/monthly) |
| **POV Codes** | View transactions pending POV, generate codes for support agents |
| **Support Tickets** | View/manage support tickets, respond to users |
| **Settings** | System configuration (interest rates, default limits, etc.) |

### 4.2 Admin Actions

| Action | Description |
|--------|-------------|
| Deposit to user | Credit user's account with optional back-date |
| Withdraw from user | Debit user's account with optional back-date |
| Back-date transaction | Set custom `created_at` on any admin-initiated txn |
| Set transaction limit | Update per-user daily/monthly limits |
| Ban user | Freeze all accounts, prevent login |
| Delete user | Soft-delete (flag as deleted) |
| Verify account | Mark KYC as verified |
| Assign account number | Manually override account number |
| Generate POV code | Create new POV code for a pending transaction |
| Approve loan | Disburse loan amount to user's account |
| Reject loan | Reject with reason |

---

## 5. Email Notifications (via Supabase — Frictionless)

**No external email vendor lock-in.** Emails are sent via Supabase's built-in email system (or a lightweight edge function that uses Resend API key stored in Supabase secrets — swap the key on redeploy, no code changes).

### Email Templates

| Type | Trigger | Content |
|------|---------|---------|
| Welcome | Account created | Account details, getting started guide |
| Deposit Confirmation | Deposit completed | Amount, new balance, transaction ref, timestamp |
| Withdrawal Confirmation | Withdrawal completed | Amount, destination, new balance, ref |
| Transfer Sent | Outgoing transfer | Amount, recipient, new balance, ref |
| Transfer Received | Incoming transfer | Amount, sender, new balance, ref |
| POV Code Needed | Transaction flagged | Alert that code is needed, contact support |
| Transaction Failed | Failed txn | Reason, amount |
| Loan Approved | Loan application approved | Amount, interest rate, repayment schedule |
| Loan Payment Due | Monthly payment reminder | Amount due, due date |

### Architecture

```
Server Action completes transaction
        │
        ▼
Insert into email_queue table (pgmq queue)
        │
        ▼
Supabase Edge Function (triggered by pgmq or cron):
  1. Read from email_queue WHERE status='pending'
  2. Send via Resend API (key stored in Supabase secrets)
  3. Update status to 'sent' or 'failed'
        │
        ▼
On redeploy: just update the Resend API key in Supabase secrets
No code changes. No vendor lock-in.
```

---

## 6. Updated Implementation Phases

### Phase 1: Foundation (Now — No API Keys Needed)
- [ ] Create Next.js project + folder structure
- [ ] Build all UI components (shadcn/ui)
- [ ] Design sign-up page (bank-grade form)
- [ ] Build welcome dialog component
- [ ] Build admin layout (sidebar + topnav) — mobile responsive
- [ ] Write all SQL schema files (ready to run in Supabase)
- [ ] Build all page shells (empty data, loading states ready)

### Phase 2: Auth & Onboarding (When keys arrive)
- [ ] Wire up Supabase Auth
- [ ] Sign-up flow with email verification
- [ ] Welcome dialog on first login
- [ ] Profile page with account details

### Phase 3: Core Banking
- [ ] Account creation
- [ ] Transaction engine (double-entry, balance snapshots)
- [ ] POV code system
- [ ] Transfer flow
- [ ] Deposit/withdrawal request flow

### Phase 4: Admin Panel
- [ ] Admin dashboard with all tabs
- [ ] User management (ban, delete, verify, limits)
- [ ] Transaction management (approve, reject, back-date)
- [ ] POV code management
- [ ] Support ticket system with live chat

### Phase 5: Loans
- [ ] Loan application form (user-side)
- [ ] Loan approval/rejection (admin-side)
- [ ] Repayment schedule generation
- [ ] Auto-debit on due dates
- [ ] Late payment handling

### Phase 6: Email & Polish
- [ ] Email queue + edge function
- [ ] All email templates
- [ ] Multi-currency support
- [ ] Transaction history + statements
- [ ] Testing & security hardening
