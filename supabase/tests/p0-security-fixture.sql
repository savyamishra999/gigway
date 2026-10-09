-- SYNTHETIC FOUNDATION ONLY. Loaded by the isolated Docker harness, never production.
DO $$ BEGIN
  IF current_database() <> 'gigway_p0_disposable' THEN RAISE EXCEPTION 'Disposable database required'; END IF;
END $$;
CREATE ROLE anon NOLOGIN;
CREATE ROLE authenticated NOLOGIN;
CREATE ROLE service_role NOLOGIN BYPASSRLS;
CREATE SCHEMA auth;
GRANT USAGE ON SCHEMA auth, public TO anon, authenticated, service_role;
CREATE FUNCTION auth.uid() RETURNS uuid LANGUAGE sql STABLE AS
  $$ SELECT nullif(current_setting('request.jwt.claim.sub', true), '')::uuid $$;
CREATE TABLE public.profiles (
 id uuid PRIMARY KEY, full_name text, username text, avatar_url text, bio text,
 phone text, is_private boolean DEFAULT false, profile_completed boolean DEFAULT true,
 is_banned boolean DEFAULT false, ban_reason text, aadhaar_front_url text, aadhaar_back_url text,
 connects_balance integer DEFAULT 10, subscription_tier text, plan text, user_roles text[], roles text,
 is_verified boolean DEFAULT false, avg_rating numeric, created_at timestamptz DEFAULT now()
);
CREATE TABLE public.organizations (id uuid PRIMARY KEY, created_by uuid REFERENCES public.profiles);
CREATE TABLE public.organization_members (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), organization_id uuid REFERENCES public.organizations,
 profile_id uuid REFERENCES public.profiles, member_role text, status text, is_primary boolean,
 UNIQUE (organization_id,profile_id)
);
CREATE TABLE public.connects_transactions (user_id uuid, amount integer);
CREATE TABLE public.subscriptions (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), user_id uuid REFERENCES public.profiles,
 plan text, status text, payment_id text
);
-- Live finding: RLS disabled, broad ACLs. Include a dormant permissive policy.
CREATE POLICY legacy_subscription_all ON public.subscriptions FOR ALL USING (true) WITH CHECK (true);
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY original_public_read ON public.profiles FOR SELECT USING (true);
CREATE POLICY original_owner_update ON public.profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY original_owner_insert ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);
ALTER TABLE public.organization_members ENABLE ROW LEVEL SECURITY;
CREATE POLICY organization_members_insert_self ON public.organization_members FOR INSERT WITH CHECK (profile_id = auth.uid());
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated, service_role;
-- Regression: table revocation alone must not leave these column grants behind.
GRANT SELECT (aadhaar_front_url), UPDATE (is_banned), INSERT (is_banned) ON public.profiles TO authenticated;
GRANT INSERT (member_role) ON public.organization_members TO authenticated;
GRANT SELECT (plan), INSERT (plan), UPDATE (plan) ON public.subscriptions TO PUBLIC, anon, authenticated;
CREATE FUNCTION public.handle_new_user() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER AS
$$ BEGIN INSERT INTO public.profiles(id) VALUES (NEW.id); RETURN NEW; END $$;
CREATE FUNCTION public.give_signup_connects() RETURNS trigger LANGUAGE plpgsql AS
$$ BEGIN NEW.connects_balance := 10; INSERT INTO public.connects_transactions VALUES (NEW.id,10); RETURN NEW; END $$;
CREATE TRIGGER fixture_signup BEFORE INSERT ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.give_signup_connects();
CREATE TABLE auth.users (id uuid PRIMARY KEY);
GRANT INSERT ON auth.users TO service_role;
CREATE TRIGGER fixture_auth_signup AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
-- Synthetic rating trigger exercises invoker semantics, not the unknown live body.
CREATE TABLE public.fixture_ratings (profile_id uuid, rating numeric);
GRANT INSERT ON public.fixture_ratings TO service_role;
CREATE FUNCTION public.update_avg_rating() RETURNS trigger LANGUAGE plpgsql AS
$$ BEGIN UPDATE public.profiles SET avg_rating=NEW.rating WHERE id=NEW.profile_id; RETURN NEW; END $$;
CREATE TRIGGER fixture_rating AFTER INSERT ON public.fixture_ratings FOR EACH ROW EXECUTE FUNCTION public.update_avg_rating();
CREATE FUNCTION public.increment_connects(uid uuid, amount integer) RETURNS void LANGUAGE plpgsql SECURITY DEFINER AS
$$ BEGIN UPDATE profiles SET connects_balance=connects_balance+amount WHERE id=uid; END $$;
CREATE FUNCTION public.increment_social_post_view(target_post_id uuid) RETURNS bigint LANGUAGE sql SECURITY DEFINER AS $$ SELECT 0::bigint $$;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO anon, authenticated, service_role;
INSERT INTO public.profiles(id,full_name,username) VALUES
 ('11111111-1111-4111-8111-111111111111','Owner A','owner-a'),
 ('22222222-2222-4222-8222-222222222222','Owner B','owner-b');
INSERT INTO public.organizations VALUES ('33333333-3333-4333-8333-333333333333','22222222-2222-4222-8222-222222222222');
INSERT INTO public.subscriptions(id,user_id,plan,status) VALUES
 ('55555555-5555-4555-8555-555555555555','11111111-1111-4111-8111-111111111111','free','inactive');
