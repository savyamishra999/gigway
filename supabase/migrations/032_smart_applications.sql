CREATE TABLE IF NOT EXISTS smart_applications (id uuid PRIMARY KEY DEFAULT gen_random_uuid(),user_id uuid NOT NULL,source_type text NOT NULL CHECK(source_type IN('gigway_job','custom_job')),job_id uuid REFERENCES jobs(id) ON DELETE SET NULL,role_title_snapshot text,result jsonb NOT NULL,created_at timestamptz NOT NULL DEFAULT now());
CREATE INDEX IF NOT EXISTS smart_applications_user_created_idx ON smart_applications(user_id,created_at DESC);
ALTER TABLE smart_applications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users read own smart applications" ON smart_applications FOR SELECT USING(auth.uid()=user_id);
