-- 013: user roles, job applications, job packages

-- ── 1. profiles: role system + job-seeker + employer fields ─────────────────
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS user_roles             text[]   DEFAULT '{"freelancer"}',
  ADD COLUMN IF NOT EXISTS education              jsonb    DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS experience_description text,
  ADD COLUMN IF NOT EXISTS experience_years       integer  DEFAULT 0,
  ADD COLUMN IF NOT EXISTS resume_url             text,
  ADD COLUMN IF NOT EXISTS linkedin_url           text,
  ADD COLUMN IF NOT EXISTS company_name           text,
  ADD COLUMN IF NOT EXISTS company_size           text,
  ADD COLUMN IF NOT EXISTS company_website        text,
  ADD COLUMN IF NOT EXISTS industry               text,
  ADD COLUMN IF NOT EXISTS is_employer_verified   boolean  DEFAULT false;

CREATE INDEX IF NOT EXISTS idx_profiles_user_roles ON profiles USING GIN(user_roles);

-- ── 2. jobs: application count ───────────────────────────────────────────────
ALTER TABLE jobs
  ADD COLUMN IF NOT EXISTS application_count integer DEFAULT 0;

-- ── 3. job_applications ──────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS job_applications (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id          uuid NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
  applicant_id    uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  cover_letter    text NOT NULL,
  resume_url      text,
  expected_salary integer,
  status          text NOT NULL DEFAULT 'applied',
  -- applied | reviewing | shortlisted | interview | selected | rejected
  created_at      timestamptz DEFAULT now(),
  updated_at      timestamptz DEFAULT now(),
  UNIQUE(job_id, applicant_id)
);

CREATE INDEX IF NOT EXISTS idx_job_applications_job_id       ON job_applications(job_id);
CREATE INDEX IF NOT EXISTS idx_job_applications_applicant_id ON job_applications(applicant_id);
CREATE INDEX IF NOT EXISTS idx_job_applications_status       ON job_applications(status);
CREATE INDEX IF NOT EXISTS idx_job_applications_created_at   ON job_applications(created_at DESC);

ALTER TABLE job_applications ENABLE ROW LEVEL SECURITY;

-- Applicant can see own applications
CREATE POLICY "Applicants see own applications" ON job_applications
  FOR SELECT USING (auth.uid() = applicant_id);

-- Applicant can insert own application
CREATE POLICY "Applicants can apply" ON job_applications
  FOR INSERT WITH CHECK (auth.uid() = applicant_id);

-- Applicant can withdraw (delete)
CREATE POLICY "Applicants can withdraw" ON job_applications
  FOR DELETE USING (auth.uid() = applicant_id);

-- Job poster can see applications for their jobs
CREATE POLICY "Job posters see applicants" ON job_applications
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM jobs
      WHERE jobs.id = job_applications.job_id
        AND jobs.client_id = auth.uid()
    )
  );

-- Job poster can update status on their jobs
CREATE POLICY "Job posters update application status" ON job_applications
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM jobs
      WHERE jobs.id = job_applications.job_id
        AND jobs.client_id = auth.uid()
    )
  );

-- ── 4. job_packages ──────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS job_packages (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id        uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  package_type   text NOT NULL,   -- job_starter | job_pro | job_enterprise
  posts_allowed  integer NOT NULL,
  posts_used     integer NOT NULL DEFAULT 0,
  amount         integer NOT NULL, -- rupees
  expires_at     timestamptz,
  created_at     timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_job_packages_user_id ON job_packages(user_id);

ALTER TABLE job_packages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users see own job packages" ON job_packages
  FOR SELECT USING (auth.uid() = user_id);

-- ── 5. Payment plans for job packages ────────────────────────────────────────
-- (handled in /api/payment/create-order + /api/payment/verify — amounts in paise)
-- job_starter: 19900 paise (₹199, 5 posts)
-- job_pro:     49900 paise (₹499, 15 posts)
-- job_enterprise: 99900 paise (₹999/mo, unlimited)
