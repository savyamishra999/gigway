-- Migration 023: messages table for on-platform chat
-- Safe to run even if table already exists (uses IF NOT EXISTS)

CREATE TABLE IF NOT EXISTS messages (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_id   uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  receiver_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  content     text NOT NULL,
  is_read     boolean NOT NULL DEFAULT false,
  created_at  timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT no_self_message CHECK (sender_id <> receiver_id)
);

CREATE INDEX IF NOT EXISTS messages_sender_idx   ON messages(sender_id);
CREATE INDEX IF NOT EXISTS messages_receiver_idx ON messages(receiver_id);
CREATE INDEX IF NOT EXISTS messages_created_idx  ON messages(created_at DESC);

ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

-- Users can see messages they sent or received
CREATE POLICY IF NOT EXISTS "Users see own messages"
  ON messages FOR SELECT
  USING (auth.uid() = sender_id OR auth.uid() = receiver_id);

-- Users can only insert messages where they are the sender
CREATE POLICY IF NOT EXISTS "Users send messages"
  ON messages FOR INSERT
  WITH CHECK (auth.uid() = sender_id);

-- Receivers can mark messages as read
CREATE POLICY IF NOT EXISTS "Receivers mark read"
  ON messages FOR UPDATE
  USING (auth.uid() = receiver_id)
  WITH CHECK (auth.uid() = receiver_id);
