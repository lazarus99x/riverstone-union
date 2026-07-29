-- ============================================================================
-- StateBank Database Schema
-- File: 001_schema.sql
-- Description: Full banking schema for StateBank application.
--              Creates all core tables: profiles, bank_accounts, transactions,
--              pov_codes, transaction_log, beneficiaries, bill_payees,
--              scheduled_transactions, loans, loan_payments, support_tickets,
--              and admin_profiles.
-- Compatible with: Supabase SQL Editor (PostgreSQL 14+)
-- ============================================================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ----------------------------------------------------------------------------
-- Profiles
-- Core user profile data linked to Supabase auth.users.
-- ----------------------------------------------------------------------------
CREATE TABLE profiles (
    id              UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id         UUID        UNIQUE NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    email           TEXT,
    full_name       TEXT,
    phone           TEXT,
    date_of_birth   DATE,
    ssn_last_four   TEXT,
    address         JSONB,
    kyc_status      TEXT        DEFAULT 'pending' CHECK (kyc_status IN ('pending', 'verified', 'rejected', 'suspended')),
    two_factor_enabled  BOOLEAN DEFAULT false,
    created_at      TIMESTAMPTZ DEFAULT now(),
    updated_at      TIMESTAMPTZ DEFAULT now()
);

-- Trigger to auto-update updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_profiles_updated_at
    BEFORE UPDATE ON profiles
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE INDEX idx_profiles_user_id ON profiles(user_id);
CREATE INDEX idx_profiles_kyc_status ON profiles(kyc_status);

-- ----------------------------------------------------------------------------
-- Bank Accounts
-- Each user can have multiple accounts (checking, savings, etc.).
-- ----------------------------------------------------------------------------
CREATE TABLE bank_accounts (
    id                          UUID            PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id                     UUID            NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    account_number              TEXT            UNIQUE NOT NULL,
    account_type                TEXT            NOT NULL CHECK (account_type IN ('checking', 'savings', 'money_market', 'certificate_of_deposit', 'business')),
    account_name                TEXT,
    currency                    TEXT            DEFAULT 'USD' CHECK (currency IN ('USD', 'EUR', 'GBP', 'CAD', 'AUD', 'JPY')),
    balance                     NUMERIC(18,2)   DEFAULT 0.00 CHECK (balance >= -999999999999.99),
    ledger_balance              NUMERIC(18,2)   DEFAULT 0.00 CHECK (ledger_balance >= -999999999999.99),
    status                      TEXT            DEFAULT 'active' CHECK (status IN ('active', 'frozen', 'closed', 'dormant')),
    daily_withdrawal_limit      NUMERIC(18,2)   DEFAULT 10000.00 CHECK (daily_withdrawal_limit >= 0),
    monthly_withdrawal_limit    NUMERIC(18,2)   DEFAULT 50000.00 CHECK (monthly_withdrawal_limit >= 0),
    opened_at                   TIMESTAMPTZ     DEFAULT now(),
    closed_at                   TIMESTAMPTZ,
    created_at                  TIMESTAMPTZ     DEFAULT now(),
    updated_at                  TIMESTAMPTZ     DEFAULT now()
);

CREATE TRIGGER set_bank_accounts_updated_at
    BEFORE UPDATE ON bank_accounts
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE INDEX idx_bank_accounts_user_id ON bank_accounts(user_id);
CREATE INDEX idx_bank_accounts_account_number ON bank_accounts(account_number);
CREATE INDEX idx_bank_accounts_status ON bank_accounts(status);
CREATE INDEX idx_bank_accounts_account_type ON bank_accounts(account_type);

-- ----------------------------------------------------------------------------
-- Transactions (Double-Entry)
-- Every transaction records both the sender and receiver side with balance
-- snapshots before and after, ensuring a full audit trail.
-- ----------------------------------------------------------------------------
CREATE TABLE transactions (
    id                  UUID            PRIMARY KEY DEFAULT uuid_generate_v4(),
    transaction_ref     TEXT            UNIQUE NOT NULL,
    type                TEXT            NOT NULL CHECK (type IN ('transfer', 'deposit', 'withdrawal', 'payment', 'refund', 'reversal', 'fee', 'interest', 'loan_disbursement', 'loan_payment')),
    status              TEXT            DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'failed', 'reversed', 'cancelled')),
    amount              NUMERIC(18,2)   NOT NULL CHECK (amount > 0),
    from_account_id     UUID            REFERENCES bank_accounts(id) ON DELETE SET NULL,
    to_account_id       UUID            REFERENCES bank_accounts(id) ON DELETE SET NULL,
    from_balance_before NUMERIC(18,2),
    from_balance_after  NUMERIC(18,2),
    to_balance_before   NUMERIC(18,2),
    to_balance_after    NUMERIC(18,2),
    description         TEXT,
    category            TEXT,
    pov_required        BOOLEAN         DEFAULT false,
    pov_verified        BOOLEAN         DEFAULT false,
    initiated_by        TEXT            DEFAULT 'user' CHECK (initiated_by IN ('user', 'system', 'admin', 'scheduled')),
    approved_by         UUID            REFERENCES profiles(id) ON DELETE SET NULL,
    reversal_of         UUID            REFERENCES transactions(id) ON DELETE SET NULL,
    backdated_at        TIMESTAMPTZ,
    metadata            JSONB,
    created_at          TIMESTAMPTZ     DEFAULT now(),
    completed_at        TIMESTAMPTZ,

    CONSTRAINT chk_transaction_accounts CHECK (from_account_id IS NOT NULL OR to_account_id IS NOT NULL),
    CONSTRAINT chk_reversal_reference CHECK (reversal_of IS DISTINCT FROM id)
);

CREATE INDEX idx_transactions_ref ON transactions(transaction_ref);
CREATE INDEX idx_transactions_from_account ON transactions(from_account_id);
CREATE INDEX idx_transactions_to_account ON transactions(to_account_id);
CREATE INDEX idx_transactions_status ON transactions(status);
CREATE INDEX idx_transactions_type ON transactions(type);
CREATE INDEX idx_transactions_created_at ON transactions(created_at DESC);
CREATE INDEX idx_transactions_user_lookup ON transactions(from_account_id, to_account_id);

-- ----------------------------------------------------------------------------
-- PoV (Proof of Verification) Codes
-- Time-limited verification codes for high-value or suspicious transactions.
-- ----------------------------------------------------------------------------
CREATE TABLE pov_codes (
    id              UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
    transaction_id  UUID        NOT NULL REFERENCES transactions(id) ON DELETE CASCADE,
    code_hash       TEXT        NOT NULL,
    expires_at      TIMESTAMPTZ NOT NULL,
    attempts        INT         DEFAULT 0,
    max_attempts    INT         DEFAULT 3 CHECK (max_attempts > 0 AND max_attempts <= 10),
    created_at      TIMESTAMPTZ DEFAULT now(),
    used_at         TIMESTAMPTZ
);

CREATE INDEX idx_pov_codes_transaction ON pov_codes(transaction_id);
CREATE INDEX idx_pov_codes_expires ON pov_codes(expires_at);

-- ----------------------------------------------------------------------------
-- Transaction Log (Audit Trail)
-- Immutable log tracking all actions performed on transactions.
-- ----------------------------------------------------------------------------
CREATE TABLE transaction_log (
    id              BIGSERIAL   PRIMARY KEY,
    transaction_id  UUID        NOT NULL REFERENCES transactions(id) ON DELETE CASCADE,
    action          TEXT        NOT NULL,
    performed_by    UUID,
    ip_address      TEXT,
    old_values      JSONB,
    new_values      JSONB,
    created_at      TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_transaction_log_txn ON transaction_log(transaction_id);
CREATE INDEX idx_transaction_log_action ON transaction_log(action);
CREATE INDEX idx_transaction_log_created ON transaction_log(created_at);

-- ----------------------------------------------------------------------------
-- Beneficiaries
-- Saved beneficiaries for quick transfers.
-- ----------------------------------------------------------------------------
CREATE TABLE beneficiaries (
    id              UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id         UUID        NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    nickname        TEXT        NOT NULL,
    account_number  TEXT        NOT NULL,
    bank_name       TEXT,
    routing_number  TEXT,
    account_type    TEXT,
    email           TEXT,
    phone           TEXT,
    is_internal     BOOLEAN     DEFAULT true,
    status          TEXT        DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
    max_transfer_limit   NUMERIC(18,2),
    created_at      TIMESTAMPTZ DEFAULT now(),
    updated_at      TIMESTAMPTZ DEFAULT now()
);

CREATE TRIGGER set_beneficiaries_updated_at
    BEFORE UPDATE ON beneficiaries
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE INDEX idx_beneficiaries_user ON beneficiaries(user_id);

-- ----------------------------------------------------------------------------
-- Bill Payees
-- Saved bill payment recipients.
-- ----------------------------------------------------------------------------
CREATE TABLE bill_payees (
    id              UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id         UUID        NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    payee_name      TEXT        NOT NULL,
    payee_type      TEXT        CHECK (payee_type IN ('utility', 'credit_card', 'loan', 'insurance', 'subscription', 'other')),
    account_number  TEXT,
    routing_number  TEXT,
    address         JSONB,
    phone           TEXT,
    email           TEXT,
    status          TEXT        DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
    created_at      TIMESTAMPTZ DEFAULT now(),
    updated_at      TIMESTAMPTZ DEFAULT now()
);

CREATE TRIGGER set_bill_payees_updated_at
    BEFORE UPDATE ON bill_payees
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE INDEX idx_bill_payees_user ON bill_payees(user_id);

-- ----------------------------------------------------------------------------
-- Scheduled Transactions
-- Recurring or future-dated transactions.
-- ----------------------------------------------------------------------------
CREATE TABLE scheduled_transactions (
    id              UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id         UUID        NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    from_account_id UUID        NOT NULL REFERENCES bank_accounts(id) ON DELETE CASCADE,
    to_account_id   UUID        REFERENCES bank_accounts(id) ON DELETE SET NULL,
    to_external     TEXT,
    amount          NUMERIC(18,2) NOT NULL CHECK (amount > 0),
    frequency       TEXT        CHECK (frequency IN ('once', 'daily', 'weekly', 'biweekly', 'monthly', 'quarterly', 'yearly')),
    scheduled_date  DATE,
    end_date        DATE,
    description     TEXT,
    category        TEXT,
    status          TEXT        DEFAULT 'active' CHECK (status IN ('active', 'paused', 'completed', 'cancelled')),
    last_run_at     TIMESTAMPTZ,
    next_run_at     TIMESTAMPTZ,
    created_at      TIMESTAMPTZ DEFAULT now(),
    updated_at      TIMESTAMPTZ DEFAULT now()
);

CREATE TRIGGER set_scheduled_transactions_updated_at
    BEFORE UPDATE ON scheduled_transactions
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE INDEX idx_scheduled_txns_user ON scheduled_transactions(user_id);
CREATE INDEX idx_scheduled_txns_next_run ON scheduled_transactions(next_run_at)
    WHERE status = 'active';

-- ----------------------------------------------------------------------------
-- Loans
-- Loan products associated with user accounts.
-- ----------------------------------------------------------------------------
CREATE TABLE loans (
    id                  UUID            PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id             UUID            NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    account_id          UUID            NOT NULL REFERENCES bank_accounts(id) ON DELETE CASCADE,
    loan_type           TEXT            NOT NULL CHECK (loan_type IN ('personal', 'mortgage', 'auto', 'student', 'business', 'payday')),
    principal           NUMERIC(18,2)   NOT NULL CHECK (principal > 0),
    interest_rate       NUMERIC(5,4)    NOT NULL CHECK (interest_rate >= 0),
    tenure_months       INT             NOT NULL CHECK (tenure_months > 0),
    monthly_payment     NUMERIC(18,2)   NOT NULL CHECK (monthly_payment > 0),
    remaining_balance   NUMERIC(18,2)   NOT NULL CHECK (remaining_balance >= 0),
    total_paid          NUMERIC(18,2)   DEFAULT 0.00 CHECK (total_paid >= 0),
    status              TEXT            DEFAULT 'pending' CHECK (status IN ('pending', 'active', 'paid', 'defaulted', 'written_off', 'cancelled')),
    purpose             TEXT,
    collateral          TEXT,
    approved_by         UUID            REFERENCES profiles(id) ON DELETE SET NULL,
    approved_at         TIMESTAMPTZ,
    first_payment_date  DATE,
    next_payment_date   DATE,
    created_at          TIMESTAMPTZ     DEFAULT now(),
    updated_at          TIMESTAMPTZ     DEFAULT now()
);

CREATE TRIGGER set_loans_updated_at
    BEFORE UPDATE ON loans
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE INDEX idx_loans_user ON loans(user_id);
CREATE INDEX idx_loans_account ON loans(account_id);
CREATE INDEX idx_loans_status ON loans(status);
CREATE INDEX idx_loans_next_payment ON loans(next_payment_date)
    WHERE status = 'active';

-- ----------------------------------------------------------------------------
-- Loan Payments
-- Individual payments made toward a loan.
-- ----------------------------------------------------------------------------
CREATE TABLE loan_payments (
    id              UUID            PRIMARY KEY DEFAULT uuid_generate_v4(),
    loan_id         UUID            NOT NULL REFERENCES loans(id) ON DELETE CASCADE,
    transaction_id  UUID            REFERENCES transactions(id) ON DELETE SET NULL,
    amount          NUMERIC(18,2)   NOT NULL CHECK (amount > 0),
    principal_part  NUMERIC(18,2)   DEFAULT 0.00,
    interest_part   NUMERIC(18,2)   DEFAULT 0.00,
    fee_part        NUMERIC(18,2)   DEFAULT 0.00,
    payment_date    DATE            NOT NULL DEFAULT CURRENT_DATE,
    due_date        DATE,
    status          TEXT            DEFAULT 'completed' CHECK (status IN ('pending', 'completed', 'failed', 'refunded')),
    late_fee        NUMERIC(18,2)   DEFAULT 0.00,
    created_at      TIMESTAMPTZ     DEFAULT now()
);

CREATE INDEX idx_loan_payments_loan ON loan_payments(loan_id);
CREATE INDEX idx_loan_payments_transaction ON loan_payments(transaction_id);
CREATE INDEX idx_loan_payments_payment_date ON loan_payments(payment_date);

-- ----------------------------------------------------------------------------
-- Support Tickets
-- Customer support requests and inquiries.
-- ----------------------------------------------------------------------------
CREATE TABLE support_tickets (
    id              UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id         UUID        NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    subject         TEXT        NOT NULL,
    description     TEXT,
    category        TEXT        CHECK (category IN ('general', 'account', 'transaction', 'loan', 'technical', 'fraud', 'other')),
    priority        TEXT        DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
    status          TEXT        DEFAULT 'open' CHECK (status IN ('open', 'in_progress', 'waiting_on_customer', 'resolved', 'closed')),
    assigned_to     UUID        REFERENCES profiles(id) ON DELETE SET NULL,
    metadata        JSONB,
    created_at      TIMESTAMPTZ DEFAULT now(),
    updated_at      TIMESTAMPTZ DEFAULT now()
);

CREATE TRIGGER set_support_tickets_updated_at
    BEFORE UPDATE ON support_tickets
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE INDEX idx_support_tickets_user ON support_tickets(user_id);
CREATE INDEX idx_support_tickets_status ON support_tickets(status);
CREATE INDEX idx_support_tickets_assigned ON support_tickets(assigned_to);

-- ----------------------------------------------------------------------------
-- Support Ticket Messages
-- Threaded messages within a support ticket.
-- ----------------------------------------------------------------------------
CREATE TABLE support_ticket_messages (
    id              UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
    ticket_id       UUID        NOT NULL REFERENCES support_tickets(id) ON DELETE CASCADE,
    sender_id       UUID        REFERENCES profiles(id) ON DELETE SET NULL,
    message         TEXT        NOT NULL,
    is_internal     BOOLEAN     DEFAULT false,
    attachments     JSONB,
    created_at      TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_ticket_messages_ticket ON support_ticket_messages(ticket_id);

-- ----------------------------------------------------------------------------
-- Admin Profiles
-- Extended profile for administrative users with role-based permissions.
-- ----------------------------------------------------------------------------
CREATE TABLE admin_profiles (
    id              UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id         UUID        UNIQUE NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    role            TEXT        DEFAULT 'admin' CHECK (role IN ('admin', 'super_admin', 'compliance', 'support', 'auditor')),
    permissions     JSONB,
    created_at      TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_admin_profiles_user ON admin_profiles(user_id);
CREATE INDEX idx_admin_profiles_role ON admin_profiles(role);

-- ----------------------------------------------------------------------------
-- Application Settings
-- Global key-value configuration store for the banking application.
-- ----------------------------------------------------------------------------
CREATE TABLE app_settings (
    id              UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
    key             TEXT        UNIQUE NOT NULL,
    value           JSONB       NOT NULL,
    description     TEXT,
    updated_by      UUID        REFERENCES profiles(id) ON DELETE SET NULL,
    created_at      TIMESTAMPTZ DEFAULT now(),
    updated_at      TIMESTAMPTZ DEFAULT now()
);

CREATE TRIGGER set_app_settings_updated_at
    BEFORE UPDATE ON app_settings
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE INDEX idx_app_settings_key ON app_settings(key);

-- ----------------------------------------------------------------------------
-- Done
-- All schema objects created successfully.
-- ----------------------------------------------------------------------------