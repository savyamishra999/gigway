-- 017: Featured/boosted job listings
-- Employers can pay to feature their job at the top of /jobs listings.

ALTER TABLE jobs
  ADD COLUMN IF NOT EXISTS is_featured    boolean     DEFAULT false,
  ADD COLUMN IF NOT EXISTS featured_until timestamptz;

-- Fast ordering: featured jobs first, then by date
CREATE INDEX IF NOT EXISTS idx_jobs_featured
  ON jobs (is_featured DESC, featured_until DESC)
  WHERE is_featured = true;
