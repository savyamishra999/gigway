-- Migration 014: CV upload, job seeker fields, hourly rate
-- Run this in Supabase SQL Editor or via supabase db push

-- New profile columns
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS cv_url            text,
  ADD COLUMN IF NOT EXISTS expected_salary   text,
  ADD COLUMN IF NOT EXISTS preferred_job_type text[];

-- hourly_rate may already exist; ADD COLUMN IF NOT EXISTS is safe
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS hourly_rate       numeric;

-- ── Storage bucket for CVs ──────────────────────────────────────────────────
-- Creates a private bucket; files are accessed only via signed URLs or service role
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'cvs',
  'cvs',
  false,
  10485760,  -- 10 MB
  ARRAY[
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  ]
)
ON CONFLICT (id) DO NOTHING;

-- ── RLS policies for CV bucket ──────────────────────────────────────────────
-- Users can upload to their own folder (userId/filename)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'storage' AND tablename = 'objects' AND policyname = 'cv_upload_own'
  ) THEN
    CREATE POLICY cv_upload_own ON storage.objects
      FOR INSERT TO authenticated
      WITH CHECK (
        bucket_id = 'cvs'
        AND (storage.foldername(name))[1] = auth.uid()::text
      );
  END IF;
END $$;

-- Users can view/download their own CV
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'storage' AND tablename = 'objects' AND policyname = 'cv_select_own'
  ) THEN
    CREATE POLICY cv_select_own ON storage.objects
      FOR SELECT TO authenticated
      USING (
        bucket_id = 'cvs'
        AND (storage.foldername(name))[1] = auth.uid()::text
      );
  END IF;
END $$;

-- Users can replace (update) their own CV
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'storage' AND tablename = 'objects' AND policyname = 'cv_update_own'
  ) THEN
    CREATE POLICY cv_update_own ON storage.objects
      FOR UPDATE TO authenticated
      USING (
        bucket_id = 'cvs'
        AND (storage.foldername(name))[1] = auth.uid()::text
      );
  END IF;
END $$;
