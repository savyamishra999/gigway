CREATE TABLE IF NOT EXISTS smart_proposals (id uuid PRIMARY KEY DEFAULT gen_random_uuid(),user_id uuid NOT NULL,source_type text NOT NULL CHECK(source_type IN('gigway_project','custom_project')),project_id uuid REFERENCES projects(id) ON DELETE SET NULL,project_title_snapshot text,result jsonb NOT NULL,created_at timestamptz NOT NULL DEFAULT now());
CREATE INDEX IF NOT EXISTS smart_proposals_user_created_idx ON smart_proposals(user_id,created_at DESC);
ALTER TABLE smart_proposals ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users read own smart proposals" ON smart_proposals FOR SELECT USING(auth.uid()=user_id);
