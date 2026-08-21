-- 037: Mutual professional connections. Review and run manually in Supabase.
CREATE TABLE IF NOT EXISTS professional_connections (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  requester_user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  recipient_user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','accepted','rejected','cancelled')),
  created_at timestamptz NOT NULL DEFAULT now(),
  responded_at timestamptz,
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT professional_connections_not_self CHECK (requester_user_id <> recipient_user_id)
);
CREATE UNIQUE INDEX IF NOT EXISTS professional_connections_pair_unique ON professional_connections (LEAST(requester_user_id, recipient_user_id), GREATEST(requester_user_id, recipient_user_id));
CREATE INDEX IF NOT EXISTS professional_connections_recipient_pending_idx ON professional_connections (recipient_user_id, created_at DESC) WHERE status = 'pending';
CREATE INDEX IF NOT EXISTS professional_connections_accepted_idx ON professional_connections (requester_user_id, recipient_user_id) WHERE status = 'accepted';
ALTER TABLE professional_connections ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users read their professional connections" ON professional_connections FOR SELECT USING (auth.uid() = requester_user_id OR auth.uid() = recipient_user_id);
CREATE POLICY "Users create outgoing professional connections" ON professional_connections FOR INSERT WITH CHECK (auth.uid() = requester_user_id);
CREATE POLICY "Users update their professional connections" ON professional_connections FOR UPDATE USING (auth.uid() = requester_user_id OR auth.uid() = recipient_user_id) WITH CHECK (auth.uid() = requester_user_id OR auth.uid() = recipient_user_id);
