-- Grant admin role to support@rsuuv.xyz
-- Run this in Supabase SQL Editor

DO $$
DECLARE
  v_auth_id UUID;
  v_profile_id UUID;
BEGIN
  -- 1. Get the auth.users ID
  SELECT id INTO v_auth_id
  FROM auth.users
  WHERE email = 'support@rsuuv.xyz';

  IF v_auth_id IS NULL THEN
    RAISE EXCEPTION 'User with email support@rsuuv.xyz not found in auth.users';
  END IF;

  RAISE NOTICE 'Auth user ID: %', v_auth_id;

  -- 2. Ensure profile exists (create if not)
  INSERT INTO profiles (user_id, email)
  VALUES (v_auth_id, 'support@rsuuv.xyz')
  ON CONFLICT (user_id) DO NOTHING;

  SELECT id INTO v_profile_id
  FROM profiles
  WHERE user_id = v_auth_id;

  RAISE NOTICE 'Profile ID: %', v_profile_id;

  -- 3. Insert admin role (skip if already exists)
  INSERT INTO admin_profiles (user_id, role, permissions)
  VALUES (v_profile_id, 'admin', '{}'::jsonb)
  ON CONFLICT (user_id) DO UPDATE SET role = 'admin', permissions = '{}'::jsonb;

  RAISE NOTICE 'Admin role granted to support@rsuuv.xyz';
END $$;