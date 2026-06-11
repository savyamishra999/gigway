-- 012: payments table + profile/gig/ticket feature columns

-- Authoritative payment record for every Razorpay transaction
CREATE TABLE IF NOT EXISTS payments (
  id                   uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id              uuid REFERENCES profiles(id) ON DELETE CASCADE,
  razorpay_order_id    text NOT NULL,
  razorpay_payment_id  text UNIQUE NOT NULL,
  plan                 text NOT NULL,
  amount               integer NOT NULL,    -- rupees
  status               text NOT NULL DEFAULT 'success',
  metadata             jsonb DEFAULT '{}',
  created_at           timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS payments_user_id_idx    ON payments(user_id);
CREATE INDEX IF NOT EXISTS payments_created_at_idx ON payments(created_at DESC);

ALTER TABLE payments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users see own payments" ON payments
  FOR SELECT USING (auth.uid() = user_id);

-- Power-up credits on profiles
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS priority_credits     integer DEFAULT 0,
  ADD COLUMN IF NOT EXISTS quick_apply_credits  integer DEFAULT 0,
  ADD COLUMN IF NOT EXISTS job_alerts_active    boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS purchased_features   text[]  DEFAULT '{}';

-- Featured gig support
ALTER TABLE gigs
  ADD COLUMN IF NOT EXISTS is_featured    boolean     DEFAULT false,
  ADD COLUMN IF NOT EXISTS featured_until timestamptz;

-- Ticket type for profile-review tickets
ALTER TABLE support_tickets
  ADD COLUMN IF NOT EXISTS ticket_type text DEFAULT 'general';
