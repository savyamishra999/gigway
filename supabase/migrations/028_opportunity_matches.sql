-- 028: Opportunity Match audit and monthly usage. Review and run manually.
CREATE TABLE IF NOT EXISTS opportunity_matches (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), user_id uuid NOT NULL,
  source_type text NOT NULL CHECK (source_type IN ('gigway_job','custom_description')),
  job_id uuid NULL REFERENCES jobs(id) ON DELETE SET NULL,
  opportunity_title_snapshot text, overall_score smallint NOT NULL CHECK (overall_score BETWEEN 0 AND 100),
  result jsonb NOT NULL, created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS opportunity_matches_user_created_idx ON opportunity_matches(user_id,created_at DESC);
ALTER TABLE opportunity_matches ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users read own opportunity matches" ON opportunity_matches FOR SELECT USING (auth.uid()=user_id);
