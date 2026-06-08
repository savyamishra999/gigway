-- Referral code on every profile
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS user_ref_code text UNIQUE,
  ADD COLUMN IF NOT EXISTS connects_balance integer DEFAULT 0;

-- Connects transaction log
CREATE TABLE IF NOT EXISTS connects_transactions (
  id          uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id     uuid REFERENCES profiles(id) ON DELETE CASCADE,
  amount      integer NOT NULL,
  type        text NOT NULL, -- 'purchase' | 'referral_bonus' | 'spend' | 'grant'
  ref_code    text,
  note        text,
  created_at  timestamptz DEFAULT now()
);

ALTER TABLE connects_transactions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users read own connects" ON connects_transactions FOR SELECT USING (auth.uid() = user_id);

-- Function to atomically increment connects balance
CREATE OR REPLACE FUNCTION increment_connects(uid uuid, amount integer)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  UPDATE profiles SET connects_balance = COALESCE(connects_balance, 0) + amount WHERE id = uid;
END;
$$;
