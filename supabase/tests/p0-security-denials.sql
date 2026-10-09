-- SYNTHETIC assertions after candidate migration, in the dedicated local harness.
BEGIN;
DO $$ BEGIN IF current_database() <> 'gigway_p0_disposable' THEN RAISE EXCEPTION 'Disposable database required'; END IF; END $$;
SET LOCAL ROLE anon;
DO $$ BEGIN
  IF (SELECT count(id) FROM public.profiles) <> 2 THEN RAISE EXCEPTION 'Public discovery broken'; END IF;
  BEGIN PERFORM aadhaar_front_url FROM public.profiles; RAISE EXCEPTION 'Document leak'; EXCEPTION WHEN insufficient_privilege THEN NULL; END;
  BEGIN PERFORM is_banned FROM public.profiles; RAISE EXCEPTION 'Ban leak'; EXCEPTION WHEN insufficient_privilege THEN NULL; END;
  BEGIN PERFORM * FROM public.own_profiles; RAISE EXCEPTION 'Anonymous owner view'; EXCEPTION WHEN insufficient_privilege THEN NULL; END;
END $$;
RESET ROLE;
SELECT set_config('request.jwt.claim.sub','11111111-1111-4111-8111-111111111111',true);
SET LOCAL ROLE authenticated;
DO $$ DECLARE col text; BEGIN
  IF (SELECT count(*) FROM public.own_profiles) <> 1 THEN RAISE EXCEPTION 'Owner view row isolation failed'; END IF;
  IF EXISTS (SELECT 1 FROM public.own_profiles WHERE id <> auth.uid()) THEN RAISE EXCEPTION 'Other owner leaked'; END IF;
  FOREACH col IN ARRAY ARRAY['is_banned','ban_reason','aadhaar_front_url','aadhaar_back_url','connects_balance','subscription_tier','plan','user_roles','roles'] LOOP
    IF has_column_privilege(current_user,'public.profiles',col,'SELECT') OR
       has_column_privilege(current_user,'public.profiles',col,'UPDATE') OR
       has_column_privilege(current_user,'public.profiles',col,'INSERT') THEN
      RAISE EXCEPTION 'Unexpected base privilege on %', col;
    END IF;
  END LOOP;
  UPDATE public.profiles SET full_name='Edited',phone='1234567890' WHERE id=auth.uid();
  IF NOT FOUND THEN RAISE EXCEPTION 'Legitimate edit denied'; END IF;
  UPDATE public.profiles SET full_name='Forged' WHERE id='22222222-2222-4222-8222-222222222222';
  IF FOUND THEN RAISE EXCEPTION 'Other profile edited'; END IF;
  BEGIN UPDATE public.profiles SET is_banned=false WHERE id=auth.uid(); RAISE EXCEPTION 'Authority edit'; EXCEPTION WHEN insufficient_privilege THEN NULL; END;
  BEGIN INSERT INTO public.profiles(id,is_banned) VALUES(auth.uid(),false) ON CONFLICT(id) DO UPDATE SET is_banned=false; RAISE EXCEPTION 'Authority upsert'; EXCEPTION WHEN insufficient_privilege THEN NULL; END;
  BEGIN INSERT INTO public.organization_members(organization_id,profile_id,member_role,status,is_primary)
    VALUES('33333333-3333-4333-8333-333333333333',auth.uid(),'owner','active',true);
    RAISE EXCEPTION 'Arbitrary owner insert'; EXCEPTION WHEN insufficient_privilege THEN NULL; END;
  BEGIN PERFORM public.increment_connects(auth.uid(),999); RAISE EXCEPTION 'Balance RPC bypass'; EXCEPTION WHEN insufficient_privilege THEN NULL; END;
END $$;
RESET ROLE;
UPDATE public.profiles SET is_banned=true WHERE id='11111111-1111-4111-8111-111111111111';
SET LOCAL ROLE authenticated;
DO $$ BEGIN
  IF NOT (SELECT is_banned FROM public.own_profiles) THEN RAISE EXCEPTION 'Stored ban unavailable'; END IF;
  UPDATE public.profiles SET full_name='Banned edit' WHERE id=auth.uid();
  IF FOUND THEN RAISE EXCEPTION 'Banned direct edit allowed'; END IF;
END $$;
RESET ROLE;
-- Remove even fixture server EXECUTE to prove trigger firing does not need it.
REVOKE EXECUTE ON FUNCTION public.handle_new_user(), public.give_signup_connects(), public.update_avg_rating() FROM service_role;
SET LOCAL ROLE service_role;
-- Actual synthetic auth -> profile -> connects trigger chain after revocation.
INSERT INTO auth.users(id) VALUES ('44444444-4444-4444-8444-444444444444');
INSERT INTO public.fixture_ratings VALUES ('44444444-4444-4444-8444-444444444444',4.5);
INSERT INTO public.organization_members(organization_id,profile_id,member_role,status,is_primary)
 VALUES('33333333-3333-4333-8333-333333333333','22222222-2222-4222-8222-222222222222','owner','active',true);
DO $$ BEGIN
  IF (SELECT avg_rating FROM public.profiles WHERE id='44444444-4444-4444-8444-444444444444') IS DISTINCT FROM 4.5 THEN RAISE EXCEPTION 'Invoker rating trigger failed'; END IF;
  IF (SELECT connects_balance FROM public.profiles WHERE id='44444444-4444-4444-8444-444444444444') <> 10 THEN RAISE EXCEPTION 'Signup changed'; END IF;
  IF (SELECT count(*) FROM public.connects_transactions WHERE user_id='44444444-4444-4444-8444-444444444444') <> 1 THEN RAISE EXCEPTION 'Fixture signup doubled'; END IF;
END $$;
RESET ROLE;
-- Real SQL permission tests, not mocked client behavior. Test own-ID forgery too.
DO $$ DECLARE client_role text; BEGIN
  FOREACH client_role IN ARRAY ARRAY['anon','authenticated'] LOOP
    EXECUTE format('SET LOCAL ROLE %I',client_role);
    BEGIN PERFORM * FROM public.subscriptions; RAISE EXCEPTION 'Subscription leak'; EXCEPTION WHEN insufficient_privilege THEN NULL; END;
    BEGIN INSERT INTO public.subscriptions(user_id,plan,status) VALUES(auth.uid(),'business','active'); RAISE EXCEPTION 'Forged subscription insert'; EXCEPTION WHEN insufficient_privilege THEN NULL; END;
    BEGIN UPDATE public.subscriptions SET plan='business',status='active' WHERE user_id=auth.uid(); RAISE EXCEPTION 'Forged subscription update'; EXCEPTION WHEN insufficient_privilege THEN NULL; END;
    BEGIN DELETE FROM public.subscriptions WHERE user_id=auth.uid(); RAISE EXCEPTION 'Subscription delete'; EXCEPTION WHEN insufficient_privilege THEN NULL; END;
    BEGIN INSERT INTO public.subscriptions(id,user_id,plan,status) VALUES('55555555-5555-4555-8555-555555555555',auth.uid(),'business','active') ON CONFLICT(id) DO UPDATE SET plan='business'; RAISE EXCEPTION 'Subscription upsert'; EXCEPTION WHEN insufficient_privilege THEN NULL; END;
    BEGIN UPDATE public.profiles SET plan='business',subscription_tier='business' WHERE id=auth.uid(); RAISE EXCEPTION 'Profile plan forgery'; EXCEPTION WHEN insufficient_privilege THEN NULL; END;
    RESET ROLE;
  END LOOP;
END $$;
SET LOCAL ROLE service_role;
DO $$ BEGIN
  IF (SELECT plan FROM public.subscriptions WHERE id='55555555-5555-4555-8555-555555555555') <> 'free' THEN RAISE EXCEPTION 'Existing subscription changed'; END IF;
  INSERT INTO public.subscriptions(id,user_id,plan,status) VALUES('66666666-6666-4666-8666-666666666666','11111111-1111-4111-8111-111111111111','pro','active');
  UPDATE public.subscriptions SET status='cancelled' WHERE id='66666666-6666-4666-8666-666666666666';
  IF NOT FOUND THEN RAISE EXCEPTION 'Server subscription update blocked'; END IF;
  DELETE FROM public.subscriptions WHERE id='66666666-6666-4666-8666-666666666666';
  IF NOT FOUND THEN RAISE EXCEPTION 'Admin subscription delete blocked'; END IF;
END $$;
RESET ROLE;
-- Defense in depth: even re-granted DML + existing permissive policy cannot write.
GRANT SELECT, INSERT, UPDATE, DELETE ON public.subscriptions TO anon, authenticated;
DO $$ DECLARE client_role text; BEGIN
  FOREACH client_role IN ARRAY ARRAY['anon','authenticated'] LOOP
    EXECUTE format('SET LOCAL ROLE %I',client_role);
    IF EXISTS(SELECT 1 FROM public.subscriptions) THEN RAISE EXCEPTION 'RLS subscription leak'; END IF;
    BEGIN INSERT INTO public.subscriptions(user_id,plan,status) VALUES(auth.uid(),'business','active'); RAISE EXCEPTION 'RLS subscription insert'; EXCEPTION WHEN insufficient_privilege THEN NULL; END;
    UPDATE public.subscriptions SET plan='business';
    IF FOUND THEN RAISE EXCEPTION 'RLS subscription update'; END IF;
    DELETE FROM public.subscriptions;
    IF FOUND THEN RAISE EXCEPTION 'RLS subscription delete'; END IF;
    RESET ROLE;
  END LOOP;
END $$;
ROLLBACK;
-- Fixture semantics cannot prove the real signup function or real Supabase REST behavior.
