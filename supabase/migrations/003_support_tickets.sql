-- Run in Supabase SQL Editor

CREATE TABLE IF NOT EXISTS support_tickets (
  id          uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  name        text NOT NULL,
  email       text NOT NULL,
  subject     text NOT NULL,
  message     text NOT NULL,
  status      text DEFAULT 'open' CHECK (status IN ('open', 'in_progress', 'resolved')),
  created_at  timestamptz DEFAULT now()
);

-- Admin reads all; anyone can insert
ALTER TABLE support_tickets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can submit ticket"
  ON support_tickets FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Service role reads all"
  ON support_tickets FOR SELECT
  USING (auth.role() = 'service_role');
