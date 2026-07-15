-- Migration 015: Ensure all profile fields used in onboarding form exist
-- ALL statements use ADD COLUMN IF NOT EXISTS — safe to run even if columns exist.
-- Run in Supabase Dashboard → SQL Editor → New Query

-- ── Fields used in role/type selection ────────────────────────────────────────
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS find_work_type   text,           -- 'freelancer' | 'job_seeker' | 'both'
  ADD COLUMN IF NOT EXISTS hire_talent_type text,           -- 'individual' | 'company'
  ADD COLUMN IF NOT EXISTS account_type     text DEFAULT 'individual'; -- 'individual' | 'company'

-- ── Freelancer profile fields ──────────────────────────────────────────────────
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS job_function    text[],          -- up to 5 job function tags
  ADD COLUMN IF NOT EXISTS skills          text[],          -- up to 20 skills
  ADD COLUMN IF NOT EXISTS portfolio_links text[],          -- portfolio URLs
  ADD COLUMN IF NOT EXISTS hourly_rate     numeric;         -- ₹ per hour (added in 014 too — safe)

-- ── Job seeker profile fields ──────────────────────────────────────────────────
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS experience_years        integer, -- already in 013 — safe
  ADD COLUMN IF NOT EXISTS experience_description  text,    -- already in 013 — safe
  ADD COLUMN IF NOT EXISTS linkedin_url            text,    -- already in 013 — safe
  ADD COLUMN IF NOT EXISTS cv_url                  text,    -- added in 014 — safe
  ADD COLUMN IF NOT EXISTS expected_salary         text,    -- added in 014 — safe
  ADD COLUMN IF NOT EXISTS preferred_job_type      text[];  -- added in 014 — safe

-- ── Company/employer profile fields ───────────────────────────────────────────
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS company_name    text,            -- already in 013 — safe
  ADD COLUMN IF NOT EXISTS company_size    text,            -- already in 013 — safe
  ADD COLUMN IF NOT EXISTS company_website text,            -- already in 013 — safe
  ADD COLUMN IF NOT EXISTS industry        text,            -- already in 013 — safe
  ADD COLUMN IF NOT EXISTS gst_number      text;            -- GST registration number

-- ── Common profile fields ──────────────────────────────────────────────────────
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS bio      text,
  ADD COLUMN IF NOT EXISTS location text;

-- ── Useful indexes ─────────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_profiles_find_work_type   ON profiles(find_work_type);
CREATE INDEX IF NOT EXISTS idx_profiles_hire_talent_type ON profiles(hire_talent_type);
CREATE INDEX IF NOT EXISTS idx_profiles_account_type     ON profiles(account_type);
