-- Run in Supabase SQL Editor (Dashboard → SQL Editor → New Query)

ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS verification_doc text;

-- verification_status values: null (never requested) | 'pending' | 'verified' | 'rejected'
-- is_verified is set to true only when admin approves

-- Index for admin panel query
CREATE INDEX IF NOT EXISTS idx_profiles_verification_status
  ON profiles (verification_status)
  WHERE verification_status = 'pending';
