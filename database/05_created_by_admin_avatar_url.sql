-- ============================================================================
-- Wintrust Bank Schema Migration 05
-- File: 05_created_by_admin_avatar_url.sql
-- Description: Adds columns for admin-created accounts and profile avatars
--              - created_by_admin (boolean on profiles)
--              - avatar_url (text on profiles)
-- Compatible with: Supabase SQL Editor (PostgreSQL 14+)
-- ============================================================================

-- Add created_by_admin column to track admin-created accounts
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS created_by_admin BOOLEAN DEFAULT false;

-- Add avatar_url column for profile pictures
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS avatar_url TEXT;

-- ============================================================================
-- Done
-- ============================================================================