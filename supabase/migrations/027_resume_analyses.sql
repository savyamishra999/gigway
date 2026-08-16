-- 027: Resume Analyzer usage and result storage. Apply manually after reviewing.
CREATE TABLE IF NOT EXISTS resume_analyses (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), user_id uuid NOT NULL, source_hash text NOT NULL, target_role text, overall_score smallint NOT NULL CHECK (overall_score BETWEEN 0 AND 100), result jsonb NOT NULL, created_at timestamptz NOT NULL DEFAULT now());
CREATE INDEX IF NOT EXISTS resume_analyses_user_created_idx ON resume_analyses(user_id, created_at DESC);
ALTER TABLE resume_analyses ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users read own resume analyses" ON resume_analyses FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users insert own resume analyses" ON resume_analyses FOR INSERT WITH CHECK (auth.uid() = user_id);
