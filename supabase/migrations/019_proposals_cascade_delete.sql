-- Drop existing FK and re-add with ON DELETE CASCADE
-- so deleting a project automatically deletes its proposals
ALTER TABLE proposals
  DROP CONSTRAINT IF EXISTS proposals_project_id_fkey;

ALTER TABLE proposals
  ADD CONSTRAINT proposals_project_id_fkey
  FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE;
