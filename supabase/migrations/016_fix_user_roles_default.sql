-- Migration 016: Fix user_roles default — was '{"freelancer"}', should be '{}'
-- New users were getting "Freelancer" role before completing onboarding.

-- 1. Change the column default
ALTER TABLE profiles
  ALTER COLUMN user_roles SET DEFAULT '{}';

-- 2. Reset roles for users who never completed onboarding
--    (profile_completed = false means they haven't filled the form)
UPDATE profiles
  SET user_roles = '{}'
  WHERE profile_completed = false
    AND user_roles = '{"freelancer"}';
