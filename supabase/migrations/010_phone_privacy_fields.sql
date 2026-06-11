-- Migration: Add phone, phone_is_public, is_private to profiles
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS phone text,
  ADD COLUMN IF NOT EXISTS phone_is_public boolean DEFAULT true,
  ADD COLUMN IF NOT EXISTS is_private boolean DEFAULT false;
