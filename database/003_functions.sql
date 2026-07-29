-- ============================================================================
-- StateBank Database Functions
-- File: 003_functions.sql
-- Description: Core business logic functions for the banking system.
-- Includes:
--   1. generate_account_number()    — STBK-XXXX-XXXX-XX format with Luhn checksum
--   2. calculate_loan_payment()      — Monthly payment using amortization formula
--   3. process_scheduled_transactions() — Cron hook for due scheduled transactions
-- Compatible with: Supabase SQL Editor (PostgreSQL 14+)
-- ============================================================================

-- ============================================================================
-- FUNCTION: generate_account_number()
-- PURPOSE:  Generates a unique bank account number in STBK-XXXX-XXXX-XX format
--           where the last two digits are a Luhn checksum over the preceding digits.
-- RETURNS:  TEXT (e.g., 'STBK-4829-1037-54')
-- ============================================================================
CREATE OR REPLACE FUNCTION generate_account_number()
RETURNS TEXT
LANGUAGE plpgsql
AS $$
DECLARE
    part1       TEXT;
    part2       TEXT;
    combined    TEXT;
    checksum    INT;
    account_num TEXT;
    counter     INT := 0;
BEGIN
    LOOP
        -- Generate two random 4-digit blocks
        part1 := LPAD(floor(random() * 10000)::INT::TEXT, 4, '0');
        part2 := LPAD(floor(random() * 10000)::INT::TEXT, 4, '0');

        -- Combine digits for checksum calculation (8 digits)
        combined := part1 || part2;

        -- Calculate Luhn checksum digit
        checksum := luhn_checksum(combined);

        -- Build final account number
        account_num := 'STBK-' || part1 || '-' || part2 || '-' || LPAD(checksum::TEXT, 2, '0');

        -- Ensure uniqueness (retry on collision)
        IF NOT EXISTS (SELECT 1 FROM bank_accounts WHERE account_number = account_num) THEN
            RETURN account_num;
        END IF;

        counter := counter + 1;
        IF counter >= 10 THEN
            RAISE EXCEPTION 'Unable to generate unique account number after % attempts', counter;
        END IF;
    END LOOP;
END;
$$;

-- ----------------------------------------------------------------------------
-- Helper: luhn_checksum()
-- Computes the Luhn algorithm checksum digit for a numeric string.
-- Returns a single digit (0-9).
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION luhn_checksum(digits TEXT)
RETURNS INT
LANGUAGE plpgsql
IMMUTABLE
AS $$
DECLARE
    i           INT;
    digit       INT;
    sum         INT := 0;
    should_double BOOLEAN := false;
BEGIN
    -- Process from right to left
    FOR i IN REVERSE LENGTH(digits)..1 LOOP
        digit := substring(digits FROM i FOR 1)::INT;

        IF should_double THEN
            digit := digit * 2;
            IF digit > 9 THEN
                digit := digit - 9;
            END IF;
        END IF;

        sum := sum + digit;
        should_double := NOT should_double;
    END LOOP;

    -- Return checksum digit that makes total a multiple of 10
    RETURN (10 - (sum % 10)) % 10;
END;
$$;

-- ============================================================================
-- FUNCTION: calculate_loan_payment(principal, annual_rate, months)
-- PURPOSE:  Computes the fixed monthly payment for an amortizing loan using
--           the standard loan amortization formula:
--             M = P * [r(1+r)^n] / [(1+r)^n - 1]
--           where r is the monthly interest rate, n is the number of months.
-- PARAMS:
--   p_principal    NUMERIC(18,2) — Loan principal amount
--   p_annual_rate  NUMERIC(5,4)  — Annual interest rate (e.g., 0.0525 for 5.25%)
--   p_months       INT           — Loan term in months
-- RETURNS:  NUMERIC(18,2) — Fixed monthly payment amount
-- ============================================================================
CREATE OR REPLACE FUNCTION calculate_loan_payment(
    p_principal     NUMERIC(18,2),
    p_annual_rate   NUMERIC(5,4),
    p_months        INT
)
RETURNS NUMERIC(18,2)
LANGUAGE plpgsql
IMMUTABLE
AS $$
DECLARE
    monthly_rate    NUMERIC(18,10);
    payment         NUMERIC(18,10);
BEGIN
    -- Validate inputs
    IF p_principal <= 0 THEN
        RAISE EXCEPTION 'Principal must be greater than 0';
    END IF;
    IF p_annual_rate < 0 THEN
        RAISE EXCEPTION 'Annual rate cannot be negative';
    END IF;
    IF p_months <= 0 THEN
        RAISE EXCEPTION 'Loan term must be at least 1 month';
    END IF;

    -- Handle zero-rate loans (simple division)
    IF p_annual_rate = 0 THEN
        RETURN ROUND(p_principal / p_months, 2);
    END IF;

    -- Convert annual rate to monthly rate
    monthly_rate := p_annual_rate / 12.0;

    -- Standard amortization formula
    -- M = P * (r * (1 + r)^n) / ((1 + r)^n - 1)
    IF monthly_rate = 0 THEN
        -- Edge case: extremely tiny rate rounds to zero
        RETURN ROUND(p_principal / p_months, 2);
    END IF;

    payment := p_principal *
        (monthly_rate * power(1 + monthly_rate, p_months)) /
        (power(1 + monthly_rate, p_months) - 1);

    -- Round to 2 decimal places
    RETURN ROUND(payment, 2);
END;
$$;

-- ============================================================================
-- FUNCTION: process_scheduled_transactions()
-- PURPOSE:  Processes all scheduled transactions that are due for execution.
--           This function is designed to be called by a cron job (pg_cron or
--           Supabase Edge Function scheduler).
--           For each due transaction, it creates an actual transaction record.
-- RETURNS:  TABLE with summary of processed items
-- ============================================================================
CREATE OR REPLACE FUNCTION process_scheduled_transactions()
RETURNS TABLE(
    processed_count     INT,
    succeeded_count     INT,
    failed_count        INT,
    details             TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    rec                 RECORD;
    v_transaction_id    UUID;
    v_new_next_run      TIMESTAMPTZ;
    v_processed         INT := 0;
    v_succeeded         INT := 0;
    v_failed            INT := 0;
    v_details           TEXT := '';
    v_from_balance      NUMERIC(18,2);
BEGIN
    -- Process all active scheduled transactions that are due
    FOR rec IN
        SELECT st.*, ba.balance AS from_balance, ba.ledger_balance AS from_ledger
        FROM scheduled_transactions st
        JOIN bank_accounts ba ON ba.id = st.from_account_id
        WHERE st.status = 'active'
          AND st.next_run_at <= now()
        ORDER BY st.next_run_at ASC
        FOR UPDATE OF st SKIP LOCKED
    LOOP
        v_processed := v_processed + 1;

        BEGIN
            -- Verify sufficient balance
            IF rec.from_balance < rec.amount THEN
                RAISE EXCEPTION 'Insufficient balance in account % (balance: %, required: %)',
                    rec.from_account_id, rec.from_balance, rec.amount;
            END IF;

            -- Get the from_account balance before
            SELECT balance INTO v_from_balance
            FROM bank_accounts
            WHERE id = rec.from_account_id;

            -- Create the actual transaction record
            INSERT INTO transactions (
                transaction_ref,
                type,
                status,
                amount,
                from_account_id,
                to_account_id,
                from_balance_before,
                from_balance_after,
                description,
                category,
                initiated_by,
                created_at,
                completed_at
            ) VALUES (
                'SCH-' || to_char(now(), 'YYYYMMDD') || '-' || LPAD(nextval('seq_transaction_ref')::TEXT, 8, '0'),
                'transfer',
                'completed',
                rec.amount,
                rec.from_account_id,
                rec.to_account_id,
                v_from_balance,
                v_from_balance - rec.amount,
                rec.description,
                rec.category,
                'scheduled',
                now(),
                now()
            )
            RETURNING id INTO v_transaction_id;

            -- Debit the source account
            UPDATE bank_accounts
            SET balance = balance - rec.amount,
                ledger_balance = ledger_balance - rec.amount
            WHERE id = rec.from_account_id;

            -- Credit the destination if it's an internal account
            IF rec.to_account_id IS NOT NULL THEN
                UPDATE bank_accounts
                SET balance = balance + rec.amount,
                    ledger_balance = ledger_balance + rec.amount
                WHERE id = rec.to_account_id;
            END IF;

            -- Calculate next run date based on frequency
            IF rec.frequency = 'once' THEN
                -- Mark as completed; no next run
                UPDATE scheduled_transactions
                SET status = 'completed',
                    last_run_at = now(),
                    next_run_at = NULL
                WHERE id = rec.id;
            ELSE
                -- Calculate next run
                v_new_next_run := CASE rec.frequency
                    WHEN 'daily'    THEN rec.next_run_at + INTERVAL '1 day'
                    WHEN 'weekly'   THEN rec.next_run_at + INTERVAL '1 week'
                    WHEN 'biweekly' THEN rec.next_run_at + INTERVAL '2 weeks'
                    WHEN 'monthly'  THEN rec.next_run_at + INTERVAL '1 month'
                    WHEN 'quarterly' THEN rec.next_run_at + INTERVAL '3 months'
                    WHEN 'yearly'   THEN rec.next_run_at + INTERVAL '1 year'
                    ELSE rec.next_run_at + INTERVAL '1 month'
                END;

                -- Check if end_date has been reached
                IF rec.end_date IS NOT NULL AND v_new_next_run > rec.end_date + INTERVAL '1 day' THEN
                    UPDATE scheduled_transactions
                    SET status = 'completed',
                        last_run_at = now(),
                        next_run_at = NULL
                    WHERE id = rec.id;
                ELSE
                    UPDATE scheduled_transactions
                    SET last_run_at = now(),
                        next_run_at = v_new_next_run
                    WHERE id = rec.id;
                END IF;
            END IF;

            v_succeeded := v_succeeded + 1;
            v_details := v_details || 'OK:' || rec.id || '; ';

        EXCEPTION WHEN OTHERS THEN
            -- Log failure and continue
            v_failed := v_failed + 1;
            v_details := v_details || 'FAIL:' || rec.id || ' (' || SQLERRM || '); ';

            -- Update scheduled transaction status on failure
            UPDATE scheduled_transactions
            SET last_run_at = now(),
                updated_at = now()
            WHERE id = rec.id;
        END;
    END LOOP;

    RETURN QUERY SELECT
        v_processed,
        v_succeeded,
        v_failed,
        v_details;
END;
$$;

-- ----------------------------------------------------------------------------
-- Sequence for transaction reference numbers
-- ----------------------------------------------------------------------------
CREATE SEQUENCE IF NOT EXISTS seq_transaction_ref
    START WITH 1
    INCREMENT BY 1
    NO MAXVALUE
    CACHE 100;

-- ============================================================================
-- Done
-- All database functions created successfully.
-- ============================================================================