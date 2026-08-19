-- 036: Social Feed Phase 2C repost relations. Review and run manually only.
CREATE TABLE IF NOT EXISTS post_reposts (
  post_id uuid NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (post_id, user_id)
);
CREATE INDEX IF NOT EXISTS post_reposts_user_created_idx ON post_reposts(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS post_reposts_post_idx ON post_reposts(post_id);
ALTER TABLE post_reposts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users read own reposts" ON post_reposts FOR SELECT USING (auth.uid() = user_id);
-- Writes are intentionally server-managed after post access authorization.
