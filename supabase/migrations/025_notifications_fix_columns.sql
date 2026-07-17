-- Migration 025: Fix notifications table columns
-- Adds title/body columns if missing, fixes RLS, handles any existing schema

-- Add columns if they don't exist yet
ALTER TABLE notifications ADD COLUMN IF NOT EXISTS title   text;
ALTER TABLE notifications ADD COLUMN IF NOT EXISTS body    text;
ALTER TABLE notifications ADD COLUMN IF NOT EXISTS type    text NOT NULL DEFAULT 'default';
ALTER TABLE notifications ADD COLUMN IF NOT EXISTS link    text;
ALTER TABLE notifications ADD COLUMN IF NOT EXISTS is_read boolean NOT NULL DEFAULT false;

-- If old rows have 'message' column but no title, copy message -> title
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'notifications' AND column_name = 'message'
  ) THEN
    UPDATE notifications SET title = message WHERE title IS NULL OR title = '';
  END IF;
END $$;

-- Make sure title is not null (set empty string for any still-null rows)
UPDATE notifications SET title = '(no title)' WHERE title IS NULL;

-- Enable RLS
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- DROP old policies if they exist, then recreate cleanly
DROP POLICY IF EXISTS "Users read own notifications"       ON notifications;
DROP POLICY IF EXISTS "Users update own notifications"     ON notifications;
DROP POLICY IF EXISTS "Service role insert notifications"  ON notifications;

CREATE POLICY "Users read own notifications"
  ON notifications FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users update own notifications"
  ON notifications FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Service role insert notifications"
  ON notifications FOR INSERT
  WITH CHECK (auth.role() = 'service_role');

-- Indexes
CREATE INDEX IF NOT EXISTS notifications_user_idx    ON notifications(user_id);
CREATE INDEX IF NOT EXISTS notifications_created_idx ON notifications(created_at DESC);
