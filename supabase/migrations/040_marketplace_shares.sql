-- 040: Marketplace social distribution. Review/run manually only.
-- This deliberately does not reuse post_reposts: a share references one canonical
-- marketplace object and is rendered by the existing social feed API.
CREATE TABLE IF NOT EXISTS marketplace_shares (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_user_id uuid,
  actor_organization_id uuid REFERENCES organizations(id) ON DELETE RESTRICT,
  job_id uuid REFERENCES jobs(id) ON DELETE CASCADE,
  project_id uuid REFERENCES projects(id) ON DELETE CASCADE,
  service_id uuid REFERENCES gigs(id) ON DELETE CASCADE,
  commentary text,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT marketplace_shares_one_actor CHECK (
    (actor_user_id IS NOT NULL)::int + (actor_organization_id IS NOT NULL)::int = 1
  ),
  CONSTRAINT marketplace_shares_one_object CHECK (
    (job_id IS NOT NULL)::int + (project_id IS NOT NULL)::int + (service_id IS NOT NULL)::int = 1
  ),
  CONSTRAINT marketplace_shares_commentary_length CHECK (commentary IS NULL OR char_length(commentary) <= 5000)
);

-- Plain reposts are unique, while future commentary/quote shares remain possible.
CREATE UNIQUE INDEX IF NOT EXISTS marketplace_shares_plain_user_job_unique ON marketplace_shares(actor_user_id, job_id) WHERE job_id IS NOT NULL AND commentary IS NULL;
CREATE UNIQUE INDEX IF NOT EXISTS marketplace_shares_plain_user_project_unique ON marketplace_shares(actor_user_id, project_id) WHERE project_id IS NOT NULL AND commentary IS NULL;
CREATE UNIQUE INDEX IF NOT EXISTS marketplace_shares_plain_user_service_unique ON marketplace_shares(actor_user_id, service_id) WHERE service_id IS NOT NULL AND commentary IS NULL;
CREATE UNIQUE INDEX IF NOT EXISTS marketplace_shares_plain_org_job_unique ON marketplace_shares(actor_organization_id, job_id) WHERE job_id IS NOT NULL AND commentary IS NULL;
CREATE UNIQUE INDEX IF NOT EXISTS marketplace_shares_plain_org_project_unique ON marketplace_shares(actor_organization_id, project_id) WHERE project_id IS NOT NULL AND commentary IS NULL;
CREATE UNIQUE INDEX IF NOT EXISTS marketplace_shares_plain_org_service_unique ON marketplace_shares(actor_organization_id, service_id) WHERE service_id IS NOT NULL AND commentary IS NULL;
CREATE INDEX IF NOT EXISTS marketplace_shares_created_idx ON marketplace_shares(created_at DESC, id DESC);
CREATE INDEX IF NOT EXISTS marketplace_shares_actor_user_created_idx ON marketplace_shares(actor_user_id, created_at DESC, id DESC) WHERE actor_user_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS marketplace_shares_actor_organization_created_idx ON marketplace_shares(actor_organization_id, created_at DESC, id DESC) WHERE actor_organization_id IS NOT NULL;

ALTER TABLE marketplace_shares ENABLE ROW LEVEL SECURITY;
-- Read/write flows are deliberately server-managed after object visibility and
-- organization membership have been verified. Do not add broad browser policies.
