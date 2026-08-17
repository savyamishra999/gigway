CREATE TABLE IF NOT EXISTS job_description_analyses (id uuid PRIMARY KEY DEFAULT gen_random_uuid(),user_id uuid NOT NULL,source_type text NOT NULL CHECK(source_type IN('gigway_job','custom_description')),job_id uuid REFERENCES jobs(id) ON DELETE SET NULL,title_snapshot text,result jsonb NOT NULL,created_at timestamptz NOT NULL DEFAULT now());
CREATE INDEX IF NOT EXISTS job_description_analyses_user_created_idx ON job_description_analyses(user_id,created_at DESC);
ALTER TABLE job_description_analyses ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users read own job description analyses" ON job_description_analyses FOR SELECT USING(auth.uid()=user_id);
