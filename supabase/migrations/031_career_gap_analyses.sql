CREATE TABLE IF NOT EXISTS career_gap_analyses (id uuid PRIMARY KEY DEFAULT gen_random_uuid(),user_id uuid NOT NULL,target_role text NOT NULL,readiness_score smallint NOT NULL CHECK(readiness_score BETWEEN 0 AND 100),result jsonb NOT NULL,created_at timestamptz NOT NULL DEFAULT now());
CREATE INDEX IF NOT EXISTS career_gap_analyses_user_created_idx ON career_gap_analyses(user_id,created_at DESC);
ALTER TABLE career_gap_analyses ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users read own career gap analyses" ON career_gap_analyses FOR SELECT USING(auth.uid()=user_id);
