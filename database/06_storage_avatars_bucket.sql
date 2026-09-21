-- ============================================================================
-- Wintrust Bank Storage Migration 06
-- File: 06_storage_avatars_bucket.sql
-- Description: Creates the avatars storage bucket with RLS policies
--              - Bucket is public for reading (avatars displayed on pages)
--              - Users can only upload/update their own avatar
--              - Admins can manage any user's avatar
-- Compatible with: Supabase SQL Editor (PostgreSQL 14+)
-- ============================================================================

-- Create the avatars storage bucket (public for reading)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'avatars',
  'avatars',
  true,
  2097152, -- 2MB max file size
  ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp']::text[]
)
ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- RLS Policies for avatars bucket
-- ============================================================================

-- Policy: Users can view any avatar (public bucket)
CREATE POLICY "Anyone can view avatars"
ON storage.objects FOR SELECT
USING (bucket_id = 'avatars');

-- Policy: Authenticated users can upload their own avatar
-- File path format: {user_id}/avatar.{ext}
CREATE POLICY "Users can upload own avatar"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'avatars'
  AND auth.role() = 'authenticated'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Policy: Users can update their own avatar
CREATE POLICY "Users can update own avatar"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'avatars'
  AND auth.role() = 'authenticated'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Policy: Users can delete their own avatar
CREATE POLICY "Users can delete own avatar"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'avatars'
  AND auth.role() = 'authenticated'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Policy: Admins can manage any avatar (via is_admin() helper from 002_rls.sql)
CREATE POLICY "Admins can manage all avatars"
ON storage.objects FOR ALL
USING (
  bucket_id = 'avatars'
  AND public.is_admin()
);

-- ============================================================================
-- Done
-- ============================================================================