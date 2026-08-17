CREATE TABLE IF NOT EXISTS profile_intelligence_analyses (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), user_id uuid NOT NULL, overall_score smallint NOT NULL CHECK(overall_score BETWEEN 0 AND 100), result jsonb NOT NULL, created_at timestamptz NOT NULL DEFAULT now());
CREATE INDEX IF NOT EXISTS profile_intelligence_analyses_user_created_idx ON profile_intelligence_analyses(user_id,created_at DESC);
ALTER TABLE profile_intelligence_analyses ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users read own profile intelligence analyses" ON profile_intelligence_analyses FOR SELECT USING (auth.uid()=user_id);
