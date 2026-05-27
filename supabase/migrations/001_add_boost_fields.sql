-- Run this in your Supabase SQL editor (Dashboard → SQL Editor → New Query)

ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS is_boosted boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS boost_expires_at timestamptz,
  ADD COLUMN IF NOT EXISTS boost_plan text;

-- Index for fast ordering on freelancers page
CREATE INDEX IF NOT EXISTS idx_profiles_boost
  ON profiles (is_boosted, boost_expires_at DESC)
  WHERE is_boosted = true;
