-- 026: reversible prepaid entitlement foundation. Do not run automatically in production.
CREATE TABLE IF NOT EXISTS payment_orders (
  razorpay_order_id text PRIMARY KEY,
  -- Authenticated user UUID. No profiles FK: legacy data may not guarantee
  -- profiles.id equals auth.users.id.
  user_id uuid NOT NULL,
  product_key text NOT NULL,
  amount_paise integer NOT NULL,
  currency text NOT NULL DEFAULT 'INR',
  status text NOT NULL DEFAULT 'created' CHECK (status IN ('created','verified','failed')),
  razorpay_payment_id text UNIQUE,
  created_at timestamptz NOT NULL DEFAULT now(),
  verified_at timestamptz
);
CREATE INDEX IF NOT EXISTS payment_orders_user_created_idx ON payment_orders(user_id, created_at DESC);
ALTER TABLE payment_orders ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users read own payment orders" ON payment_orders FOR SELECT USING (auth.uid() = user_id);

CREATE TABLE IF NOT EXISTS entitlements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  -- See payment_orders.user_id rationale above.
  user_id uuid NOT NULL,
  product_key text NOT NULL,
  tier text NOT NULL CHECK (tier IN ('pro','business','verified')),
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active','expired','revoked')),
  starts_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz,
  razorpay_payment_id text UNIQUE REFERENCES payments(razorpay_payment_id),
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS entitlements_active_user_idx ON entitlements(user_id, tier, expires_at DESC) WHERE status = 'active';
ALTER TABLE entitlements ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users read own entitlements" ON entitlements FOR SELECT USING (auth.uid() = user_id);
