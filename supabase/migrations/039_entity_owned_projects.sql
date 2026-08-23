-- SOURCE ONLY: apply through the reviewed Supabase migration workflow.
ALTER TABLE projects
  ADD COLUMN IF NOT EXISTS organization_id uuid
  REFERENCES organizations(id) ON DELETE RESTRICT;

CREATE INDEX IF NOT EXISTS projects_organization_id_idx
  ON projects (organization_id, created_at DESC)
  WHERE organization_id IS NOT NULL;
