-- 018: Banner advertisements system
-- Admin adds ads from /admin/advertisements; shown to users by role + page position

CREATE TABLE IF NOT EXISTS advertisements (
  id           uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  title        text        NOT NULL,
  subtitle     text,
  cta_text     text        DEFAULT 'Learn More',
  link_url     text        NOT NULL,
  image_url    text,
  accent_color text        DEFAULT '#4F46E5',
  target_roles text[]      DEFAULT '{}',  -- empty = all roles; else ['freelancer','job_seeker',...]
  position     text        DEFAULT 'all', -- all | dashboard | jobs | gigs | freelancers
  is_active    boolean     DEFAULT true,
  priority     integer     DEFAULT 0,     -- higher = shown first
  created_at   timestamptz DEFAULT now(),
  expires_at   timestamptz,
  created_by   uuid        REFERENCES profiles(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_ads_active    ON advertisements (is_active, priority DESC);
CREATE INDEX IF NOT EXISTS idx_ads_position  ON advertisements (position);
CREATE INDEX IF NOT EXISTS idx_ads_roles     ON advertisements USING GIN (target_roles);

ALTER TABLE advertisements ENABLE ROW LEVEL SECURITY;

-- Anyone can read active non-expired ads
CREATE POLICY "Public read active ads" ON advertisements
  FOR SELECT USING (
    is_active = true
    AND (expires_at IS NULL OR expires_at > now())
  );
