-- ============================================================================
-- StateBank Seed Data
-- File: 004_seed.sql
-- Description: Populates the database with initial seed data for development
--              and testing. Creates a test admin user (requires an existing
--              auth.users entry) and default application settings.
-- IMPORTANT: Run ONLY after 001_schema.sql, 002_rls.sql, and 003_functions.sql
--            have been executed. The test user must already exist in auth.users
--            or you must adjust the UUID below.
-- Compatible with: Supabase SQL Editor (PostgreSQL 14+)
-- ============================================================================

-- ============================================================================
-- WARNING: This seed script references auth.users entries.
--          In Supabase, the auth.users table is managed by the Auth system.
--          You must create a test user via the Supabase Auth UI/API first,
--          then replace the UUID below with the actual user ID.
--          Alternatively, run this in a migration where you can also insert
--          into auth.users (requires service_role).
-- ============================================================================

-- ----------------------------------------------------------------------------
-- Default Application Settings
-- These configure core banking parameters used by the application layer.
-- ----------------------------------------------------------------------------
INSERT INTO app_settings (key, value, description) VALUES
(
    'bank.name',
    '"StateBank"',
    'Official bank name displayed on statements and UI'
),
(
    'bank.support_email',
    '"support@statebank.com"',
    'Customer support email address'
),
(
    'bank.support_phone',
    '"+1-800-STATEBANK"',
    'Customer support phone number'
),
(
    'bank.routing_number',
    '"021000021"',
    'ABA routing number for ACH transfers'
),
(
    'bank.swift_code',
    '"STBKUS33"',
    'SWIFT/BIC code for international transfers'
),
(
    'bank.currency_default',
    '"USD"',
    'Default currency for new accounts'
),
(
    'bank.kyc.required',
    'true',
    'Whether KYC verification is mandatory for all users'
),
(
    'bank.transaction.default_limit',
    '10000.00',
    'Default daily transaction limit per account'
),
(
    'bank.transaction.monthly_limit',
    '50000.00',
    'Default monthly transaction limit per account'
),
(
    'bank.transaction.pov_threshold',
    '5000.00',
    'Amount above which PoV (Proof of Verification) is required'
),
(
    'bank.transaction.max_attempts',
    '3',
    'Maximum PoV code entry attempts before lockout'
),
(
    'bank.loan.default_interest_rate',
    '0.0699',
    'Default annual interest rate for personal loans (6.99%)'
),
(
    'bank.loan.max_tenure_months',
    '72',
    'Maximum loan repayment term in months'
),
(
    'bank.loan.min_principal',
    '500.00',
    'Minimum loan principal amount'
),
(
    'bank.maintenance_mode',
    'false',
    'If true, the bank is in read-only maintenance mode'
),
(
    'bank.business_hours',
    '{"timezone": "America/New_York", "weekdays": {"open": "09:00", "close": "17:00"}, "weekends": {"open": null, "close": null}}',
    'Bank business hours configuration'
),
(
    'bank.fee.overdraft',
    '35.00',
    'Overdraft fee amount'
),
(
    'bank.fee.returned_check',
    '25.00',
    'Returned check / NSF fee amount'
),
(
    'bank.fee.domestic_transfer',
    '0.00',
    'Fee for domestic wire transfers'
),
(
    'bank.fee.international_transfer',
    '25.00',
    'Fee for international wire transfers'
)
ON CONFLICT (key) DO UPDATE
    SET value = EXCLUDED.value,
        description = EXCLUDED.description,
        updated_at = now();

-- ----------------------------------------------------------------------------
-- Seed: Test Admin User
-- Before running this section, create a test user in Supabase Auth:
--   Email: admin@statebank.com
--   Password: (set via Auth UI)
-- Then replace the user_id below with the actual auth.users UID.
-- ----------------------------------------------------------------------------

-- Create test profile for admin user
-- NOTE: Replace '00000000-0000-0000-0000-000000000000' with the actual
-- auth.users UID after creating the user in Supabase Auth dashboard.
/*
INSERT INTO profiles (user_id, email, full_name, phone, kyc_status)
VALUES (
    '00000000-0000-0000-0000-000000000000',  -- <-- REPLACE THIS with actual auth.users UID
    'admin@statebank.com',
    'StateBank Admin',
    '+1-555-0100',
    'verified'
) ON CONFLICT (user_id) DO NOTHING;

-- Grant admin role
INSERT INTO admin_profiles (user_id, role, permissions)
SELECT
    id,
    'super_admin',
    '{
        "can_manage_users": true,
        "can_manage_accounts": true,
        "can_approve_loans": true,
        "can_process_transactions": true,
        "can_manage_settings": true,
        "can_view_audit_logs": true,
        "can_manage_admins": true
    }'::JSONB
FROM profiles
WHERE email = 'admin@statebank.com'
ON CONFLICT (user_id) DO NOTHING;
*/

-- ----------------------------------------------------------------------------
-- Seed: Test Regular User
-- Create a second profile for testing non-admin flows.
-- NOTE: Uncomment and replace UUID after creating the user in Auth.
/*
INSERT INTO profiles (user_id, email, full_name, phone, kyc_status)
VALUES (
    '00000000-0000-0000-0000-000000000001',  -- <-- REPLACE THIS
    'user@statebank.com',
    'John Doe',
    '+1-555-0101',
    'verified'
) ON CONFLICT (user_id) DO NOTHING;
*/

-- ============================================================================
-- Verification Queries
-- Uncomment these to verify seed data was inserted correctly.
-- ============================================================================
-- SELECT 'App Settings Count' AS check_name, COUNT(*) AS value FROM app_settings
-- UNION ALL
-- SELECT 'Profiles Count', COUNT(*) FROM profiles
-- UNION ALL
-- SELECT 'Admin Profiles Count', COUNT(*) FROM admin_profiles;

-- ============================================================================
-- Done
-- All seed data has been inserted successfully.
-- ============================================================================