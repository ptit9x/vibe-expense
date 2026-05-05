-- ============================================================
-- Migration: Create avatars storage bucket + RLS policies
-- Description: Allows users to upload/update/delete their own
--              avatar image in Supabase Storage.
-- ============================================================

-- 1. Create the storage bucket (private — access via policies)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'avatars',
  'avatars',
  true,  -- public so we can use the public URL directly in <img>
  2097152,  -- 2 MB
  ARRAY['image/jpeg', 'image/png', 'image/webp']
) ON CONFLICT (id) DO NOTHING;

-- 2. Users can upload an avatar to their own folder
CREATE POLICY "Users can upload own avatar"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'avatars'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

-- 3. Users can update their own avatar
CREATE POLICY "Users can update own avatar"
  ON storage.objects FOR UPDATE
  USING (
    bucket_id = 'avatars'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

-- 4. Users can delete their own avatar
CREATE POLICY "Users can delete own avatar"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'avatars'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

-- 5. Anyone can view avatars (public bucket, but explicit policy for clarity)
CREATE POLICY "Anyone can view avatars"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'avatars');
