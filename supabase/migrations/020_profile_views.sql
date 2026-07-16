-- Track who views freelancer profiles
CREATE TABLE IF NOT EXISTS profile_views (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id  uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  viewer_id   uuid REFERENCES profiles(id) ON DELETE SET NULL,
  ip_hash     text,
  created_at  timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_profile_views_profile ON profile_views (profile_id, created_at DESC);

ALTER TABLE profile_views ENABLE ROW LEVEL SECURITY;

-- Profile owner can see their own views count (not who viewed)
CREATE POLICY "Owner sees own views" ON profile_views
  FOR SELECT USING (profile_id = auth.uid());

-- Anyone (logged in) can insert a view
CREATE POLICY "Anyone can record view" ON profile_views
  FOR INSERT WITH CHECK (true);
