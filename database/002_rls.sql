-- ============================================================================
-- StateBank Row-Level Security (RLS) Policies
-- File: 002_rls.sql
-- Description: Enables RLS on all tables and creates security policies.
--              Users can only access their own data. Admins (via admin_profiles)
--              can access all rows for administration purposes.
-- Compatible with: Supabase SQL Editor (PostgreSQL 14+)
-- ============================================================================

-- ----------------------------------------------------------------------------
-- Helper: is_admin() function
-- Returns true if the current user has an admin profile.
-- This is used by many policies below and is intentionally defined here
-- so RLS policies can reference it before any data access.
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1
        FROM admin_profiles ap
        WHERE ap.user_id = auth.uid()
    );
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

-- ----------------------------------------------------------------------------
-- Helper: get_profile_id_for_current_user()
-- Returns the profiles.id for the currently authenticated user.
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.current_profile_id()
RETURNS UUID AS $$
DECLARE
    profile_id UUID;
BEGIN
    SELECT p.id INTO profile_id
    FROM profiles p
    WHERE p.user_id = auth.uid();
    RETURN profile_id;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

-- ============================================================================
-- PROFILES
-- ============================================================================
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own profile"
    ON profiles FOR SELECT
    USING (user_id = auth.uid());

CREATE POLICY "Users can update own profile"
    ON profiles FOR UPDATE
    USING (user_id = auth.uid())
    WITH CHECK (user_id = auth.uid());

CREATE POLICY "Admins can view all profiles"
    ON profiles FOR SELECT
    USING (public.is_admin());

CREATE POLICY "Admins can update all profiles"
    ON profiles FOR UPDATE
    USING (public.is_admin());

CREATE POLICY "Admins can insert profiles"
    ON profiles FOR INSERT
    WITH CHECK (public.is_admin());

CREATE POLICY "Admins can delete profiles"
    ON profiles FOR DELETE
    USING (public.is_admin());

-- ============================================================================
-- BANK ACCOUNTS
-- ============================================================================
ALTER TABLE bank_accounts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own accounts"
    ON bank_accounts FOR SELECT
    USING (user_id = public.current_profile_id());

CREATE POLICY "Users can update own accounts"
    ON bank_accounts FOR UPDATE
    USING (user_id = public.current_profile_id())
    WITH CHECK (user_id = public.current_profile_id());

CREATE POLICY "Admins can view all accounts"
    ON bank_accounts FOR SELECT
    USING (public.is_admin());

CREATE POLICY "Admins can insert accounts"
    ON bank_accounts FOR INSERT
    WITH CHECK (public.is_admin());

CREATE POLICY "Admins can update all accounts"
    ON bank_accounts FOR UPDATE
    USING (public.is_admin());

CREATE POLICY "Admins can delete accounts"
    ON bank_accounts FOR DELETE
    USING (public.is_admin());

-- ============================================================================
-- TRANSACTIONS
-- Users can see transactions where they are the sender or receiver.
-- Admins see all.
-- ============================================================================
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own transactions"
    ON transactions FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM bank_accounts ba
            WHERE (ba.id = transactions.from_account_id OR ba.id = transactions.to_account_id)
            AND ba.user_id = public.current_profile_id()
        )
    );

CREATE POLICY "Users can insert own transactions"
    ON transactions FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM bank_accounts ba
            WHERE (ba.id = transactions.from_account_id OR ba.id = transactions.to_account_id)
            AND ba.user_id = public.current_profile_id()
        )
    );

CREATE POLICY "Admins can view all transactions"
    ON transactions FOR SELECT
    USING (public.is_admin());

CREATE POLICY "Admins can insert transactions"
    ON transactions FOR INSERT
    WITH CHECK (public.is_admin());

CREATE POLICY "Admins can update transactions"
    ON transactions FOR UPDATE
    USING (public.is_admin());

-- ============================================================================
-- PoV CODES
-- Users can view PoV codes tied to their transactions; admins see all.
-- ============================================================================
ALTER TABLE pov_codes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own PoV codes"
    ON pov_codes FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM transactions t
            JOIN bank_accounts ba ON (ba.id = t.from_account_id OR ba.id = t.to_account_id)
            WHERE t.id = pov_codes.transaction_id
            AND ba.user_id = public.current_profile_id()
        )
    );

CREATE POLICY "Admins can view all PoV codes"
    ON pov_codes FOR SELECT
    USING (public.is_admin());

CREATE POLICY "Admins can manage PoV codes"
    ON pov_codes FOR ALL
    USING (public.is_admin());

-- ============================================================================
-- TRANSACTION LOG
-- Users see logs for their own transactions; admins see all.
-- ============================================================================
ALTER TABLE transaction_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own transaction logs"
    ON transaction_log FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM transactions t
            JOIN bank_accounts ba ON (ba.id = t.from_account_id OR ba.id = t.to_account_id)
            WHERE t.id = transaction_log.transaction_id
            AND ba.user_id = public.current_profile_id()
        )
    );

CREATE POLICY "Admins can view all transaction logs"
    ON transaction_log FOR SELECT
    USING (public.is_admin());

CREATE POLICY "Admins can insert transaction logs"
    ON transaction_log FOR INSERT
    WITH CHECK (public.is_admin());

-- ============================================================================
-- BENEFICIARIES
-- ============================================================================
ALTER TABLE beneficiaries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own beneficiaries"
    ON beneficiaries FOR ALL
    USING (user_id = public.current_profile_id())
    WITH CHECK (user_id = public.current_profile_id());

CREATE POLICY "Admins can view all beneficiaries"
    ON beneficiaries FOR SELECT
    USING (public.is_admin());

CREATE POLICY "Admins can manage beneficiaries"
    ON beneficiaries FOR ALL
    USING (public.is_admin());

-- ============================================================================
-- BILL PAYEES
-- ============================================================================
ALTER TABLE bill_payees ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own bill payees"
    ON bill_payees FOR ALL
    USING (user_id = public.current_profile_id())
    WITH CHECK (user_id = public.current_profile_id());

CREATE POLICY "Admins can view all bill payees"
    ON bill_payees FOR SELECT
    USING (public.is_admin());

CREATE POLICY "Admins can manage bill payees"
    ON bill_payees FOR ALL
    USING (public.is_admin());

-- ============================================================================
-- SCHEDULED TRANSACTIONS
-- ============================================================================
ALTER TABLE scheduled_transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own scheduled transactions"
    ON scheduled_transactions FOR ALL
    USING (user_id = public.current_profile_id())
    WITH CHECK (user_id = public.current_profile_id());

CREATE POLICY "Admins can view all scheduled transactions"
    ON scheduled_transactions FOR SELECT
    USING (public.is_admin());

CREATE POLICY "Admins can manage scheduled transactions"
    ON scheduled_transactions FOR ALL
    USING (public.is_admin());

-- ============================================================================
-- LOANS
-- ============================================================================
ALTER TABLE loans ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own loans"
    ON loans FOR SELECT
    USING (user_id = public.current_profile_id());

CREATE POLICY "Admins can view all loans"
    ON loans FOR SELECT
    USING (public.is_admin());

CREATE POLICY "Admins can insert loans"
    ON loans FOR INSERT
    WITH CHECK (public.is_admin());

CREATE POLICY "Admins can update loans"
    ON loans FOR UPDATE
    USING (public.is_admin());

-- ============================================================================
-- LOAN PAYMENTS
-- ============================================================================
ALTER TABLE loan_payments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own loan payments"
    ON loan_payments FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM loans l
            WHERE l.id = loan_payments.loan_id
            AND l.user_id = public.current_profile_id()
        )
    );

CREATE POLICY "Admins can view all loan payments"
    ON loan_payments FOR SELECT
    USING (public.is_admin());

CREATE POLICY "Admins can manage loan payments"
    ON loan_payments FOR ALL
    USING (public.is_admin());

-- ============================================================================
-- SUPPORT TICKETS
-- ============================================================================
ALTER TABLE support_tickets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own support tickets"
    ON support_tickets FOR ALL
    USING (user_id = public.current_profile_id())
    WITH CHECK (user_id = public.current_profile_id());

CREATE POLICY "Admins can view all support tickets"
    ON support_tickets FOR SELECT
    USING (public.is_admin());

CREATE POLICY "Admins can manage all support tickets"
    ON support_tickets FOR ALL
    USING (public.is_admin());

-- ============================================================================
-- SUPPORT TICKET MESSAGES
-- ============================================================================
ALTER TABLE support_ticket_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view messages on own tickets"
    ON support_ticket_messages FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM support_tickets st
            WHERE st.id = support_ticket_messages.ticket_id
            AND st.user_id = public.current_profile_id()
        )
    );

CREATE POLICY "Admins can view all ticket messages"
    ON support_ticket_messages FOR SELECT
    USING (public.is_admin());

CREATE POLICY "Admins can manage ticket messages"
    ON support_ticket_messages FOR ALL
    USING (public.is_admin());

-- ============================================================================
-- ADMIN PROFILES
-- Only super_admins can manage admin profiles; all admins can view.
-- ============================================================================
ALTER TABLE admin_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view admin profiles"
    ON admin_profiles FOR SELECT
    USING (public.is_admin());

CREATE POLICY "Super admins can insert admin profiles"
    ON admin_profiles FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM admin_profiles ap
            JOIN profiles p ON p.id = ap.user_id
            WHERE p.user_id = auth.uid()
            AND ap.role = 'super_admin'
        )
    );

CREATE POLICY "Super admins can update admin profiles"
    ON admin_profiles FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM admin_profiles ap
            JOIN profiles p ON p.id = ap.user_id
            WHERE p.user_id = auth.uid()
            AND ap.role = 'super_admin'
        )
    );

CREATE POLICY "Super admins can delete admin profiles"
    ON admin_profiles FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM admin_profiles ap
            JOIN profiles p ON p.id = ap.user_id
            WHERE p.user_id = auth.uid()
            AND ap.role = 'super_admin'
        )
    );

-- ============================================================================
-- APP SETTINGS
-- Only admins can manage settings; all authenticated users can view.
-- ============================================================================
ALTER TABLE app_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "All authenticated users can view settings"
    ON app_settings FOR SELECT
    USING (auth.role() = 'authenticated');

CREATE POLICY "Admins can manage settings"
    ON app_settings FOR ALL
    USING (public.is_admin());

-- ============================================================================
-- Done
-- All RLS policies created successfully.
-- ============================================================================