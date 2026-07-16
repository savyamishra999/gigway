-- Add poster_name override column to projects
-- When set, this is shown instead of the linked profile's full_name
ALTER TABLE projects
  ADD COLUMN IF NOT EXISTS poster_name text;
