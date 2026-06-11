-- Run in Supabase SQL Editor
-- Migration 011: Notices table + support_tickets reply columns

-- ── Notices table ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS notices (
  id         uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  title      text NOT NULL,
  content    text NOT NULL,
  type       text DEFAULT 'info' CHECK (type IN ('info', 'warning', 'announcement', 'new_feature')),
  is_active  boolean DEFAULT true,
  show_until timestamptz,
  created_by text NOT NULL,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_notices_active
  ON notices(is_active, created_at DESC);

ALTER TABLE notices ENABLE ROW LEVEL SECURITY;

-- Anyone can read active notices
CREATE POLICY "Anyone can read active notices"
  ON notices FOR SELECT
  USING (is_active = true);

-- Service role manages notices
CREATE POLICY "Service role manages notices"
  ON notices FOR ALL
  USING (auth.role() = 'service_role');

-- ── Support tickets: add reply + user_id columns ─────────────────────────────
ALTER TABLE support_tickets
  ADD COLUMN IF NOT EXISTS user_id     uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS admin_reply text,
  ADD COLUMN IF NOT EXISTS replied_at  timestamptz;

-- Index for user's own tickets
CREATE INDEX IF NOT EXISTS idx_support_tickets_user_id
  ON support_tickets(user_id);

-- Allow users to read their own tickets
CREATE POLICY "Users can read own tickets"
  ON support_tickets FOR SELECT
  USING (auth.uid() = user_id);
