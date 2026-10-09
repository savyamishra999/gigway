-- LOCAL REVIEW CANDIDATE ONLY. Do not apply before the preflight/disposable tests
-- in docs/p0-live-security-remediation-review.md. No data backfill or lifecycle writes.
BEGIN;
SET LOCAL lock_timeout = '5s';
SET LOCAL statement_timeout = '30s';

-- Fail transactionally if the expected live foundation is missing.
DO $$
BEGIN
  IF to_regclass('public.profiles') IS NULL
     OR to_regclass('public.subscriptions') IS NULL
     OR to_regclass('public.organization_members') IS NULL
     OR to_regprocedure('public.handle_new_user()') IS NULL THEN
    RAISE EXCEPTION 'Missing live foundation; inspect catalogs before proceeding';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_proc WHERE oid = 'public.handle_new_user()'::regprocedure
      AND prorettype = 'trigger'::regtype AND prosecdef) THEN
    RAISE EXCEPTION 'Unexpected handle_new_user signature/security; review its exact body';
  END IF;
  IF to_regclass('public.own_profiles') IS NOT NULL AND
     obj_description(to_regclass('public.own_profiles'), 'pg_class') IS DISTINCT FROM 'GigWay P0 owner-only read facade v1' THEN
    RAISE EXCEPTION 'own_profiles already exists; review name collision before replacement';
  END IF;
END $$;

-- Trusted public schema is necessary while the legacy signup body uses public objects.
-- No client may shadow objects on the SECURITY DEFINER search path.
REVOKE CREATE ON SCHEMA public FROM PUBLIC, anon, authenticated;
ALTER FUNCTION public.handle_new_user() SET search_path = pg_catalog, public, pg_temp;
REVOKE ALL ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
-- Trigger firing does not require caller EXECUTE. Keep the original body/trigger intact.

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
-- Revoke TABLE privileges AND pre-existing COLUMN privileges (they are additive).
-- Also close INSERT/upsert/delete paths that could recreate authority fields.
REVOKE ALL ON TABLE public.profiles FROM PUBLIC, anon, authenticated;
DO $$
DECLARE col record;
BEGIN
  FOR col IN SELECT attname FROM pg_attribute
    WHERE attrelid = 'public.profiles'::regclass AND attnum > 0 AND NOT attisdropped
  LOOP
    EXECUTE format('REVOKE SELECT (%1$I), INSERT (%1$I), UPDATE (%1$I), REFERENCES (%1$I) ON public.profiles FROM PUBLIC, anon, authenticated', col.attname);
  END LOOP;
END $$;

-- Option 2: retain the base relation/FK joins, grant only public professional columns.
-- Unknown/new columns default to denied. Missing optional legacy columns are skipped;
-- the preflight inventory must establish every column required by the application.
DO $$
DECLARE cols text;
BEGIN
  SELECT string_agg(format('%I', attname), ', ' ORDER BY attnum) INTO cols
  FROM pg_attribute WHERE attrelid = 'public.profiles'::regclass AND attnum > 0 AND NOT attisdropped
  AND attname = ANY (ARRAY[
    'id','full_name','username','avatar_url','tagline','bio','location','job_function','skills',
    'portfolio_links','hourly_rate','availability','experience_years','experience_description',
    'linkedin_url','company','company_name','company_size','company_website','industry',
    'is_verified','is_employer_verified','avg_rating','total_reviews','is_boosted','boost_expires_at',
    'profile_completed','is_private','created_at','updated_at'
  ]);
  EXECUTE format('GRANT SELECT (%s) ON public.profiles TO anon, authenticated', cols);

  SELECT string_agg(format('%I', attname), ', ' ORDER BY attnum) INTO cols
  FROM pg_attribute WHERE attrelid = 'public.profiles'::regclass AND attnum > 0 AND NOT attisdropped
  AND attname = ANY (ARRAY[
    'full_name','username','avatar_url','tagline','bio','location','phone','phone_is_public','is_private',
    'job_function','skills','portfolio_links','hourly_rate','availability','experience_years','experience_description',
    'linkedin_url','cv_url','expected_salary','preferred_job_type','company_name','company_size','company_website','industry','gst_number'
  ]);
  EXECUTE format('GRANT UPDATE (%s) ON public.profiles TO authenticated', cols);
END $$;

-- Restrictive policies intersect ALL existing permissive policies (including FOR ALL).
DROP POLICY IF EXISTS p0_profile_read_boundary ON public.profiles;
CREATE POLICY p0_profile_read_boundary ON public.profiles AS RESTRICTIVE FOR SELECT TO anon, authenticated
  USING (id = (SELECT auth.uid()) OR
    (profile_completed IS TRUE AND is_private IS NOT TRUE AND is_banned IS NOT TRUE));
DROP POLICY IF EXISTS p0_profile_edit_boundary ON public.profiles;
CREATE POLICY p0_profile_edit_boundary ON public.profiles AS RESTRICTIVE FOR UPDATE TO authenticated
  USING (id = (SELECT auth.uid()) AND is_banned IS NOT TRUE)
  WITH CHECK (id = (SELECT auth.uid()) AND is_banned IS NOT TRUE);

-- Owner-only read facade for fields needed by dashboard/edit/onboarding/ban guard.
-- Deliberate owner-privilege view: invoker=true would require granting private base
-- columns to every authenticated user. Security barrier + explicit UID predicate
-- restrict this exception; NO write grants, document paths, ban_reason or unknown roles.
DO $$
DECLARE cols text;
BEGIN
  SELECT string_agg(format('p.%I', attname), ', ' ORDER BY attnum) INTO cols
  FROM pg_attribute WHERE attrelid = 'public.profiles'::regclass AND attnum > 0 AND NOT attisdropped
  AND attname = ANY (ARRAY[
    'id','full_name','username','avatar_url','tagline','bio','location','job_function','skills',
    'portfolio_links','hourly_rate','availability','experience_years','experience_description',
    'linkedin_url','company','company_name','company_size','company_website','industry',
    'is_verified','is_employer_verified','avg_rating','total_reviews','is_boosted','boost_expires_at',
    'profile_completed','is_private','created_at','updated_at',
    'email','phone','phone_is_public','cv_url','resume_url','education','expected_salary','preferred_job_type','gst_number',
    'is_banned','connects_balance','subscription_tier','user_roles','find_work_type','hire_talent_type','account_type',
    'verification_status','verification_paid_at','plan','plan_expires_at','boost_plan','user_ref_code',
    'priority_credits','quick_apply_credits','job_alerts_active','purchased_features'
  ]);
  -- OFFSET 0 also makes the view non-automatically-updatable, independent of grants.
  EXECUTE format('CREATE OR REPLACE VIEW public.own_profiles WITH (security_barrier = true, security_invoker = false) AS SELECT %s FROM public.profiles p WHERE p.id = (SELECT auth.uid()) OFFSET 0', cols);
END $$;
ALTER VIEW public.own_profiles OWNER TO postgres;
COMMENT ON VIEW public.own_profiles IS 'GigWay P0 owner-only read facade v1';
REVOKE ALL ON public.own_profiles FROM PUBLIC, anon, authenticated;
GRANT SELECT ON public.own_profiles TO authenticated;

-- Creation already uses a verified server-only service-role route with fixed
-- created.id/user.id/owner/active/is_primary=true. No client insert is needed.
ALTER TABLE public.organization_members ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS organization_members_insert_self ON public.organization_members;
REVOKE INSERT, UPDATE, DELETE, TRUNCATE, REFERENCES, TRIGGER
  ON public.organization_members FROM PUBLIC, anon, authenticated;
DO $$
DECLARE col record;
BEGIN
  FOR col IN SELECT attname FROM pg_attribute
    WHERE attrelid = 'public.organization_members'::regclass AND attnum > 0 AND NOT attisdropped
  LOOP
    EXECUTE format('REVOKE INSERT (%1$I), UPDATE (%1$I), REFERENCES (%1$I) ON public.organization_members FROM PUBLIC, anon, authenticated', col.attname);
  END LOOP;
END $$;
-- Defense if a future broad table grant/policy is added accidentally.
DROP POLICY IF EXISTS p0_membership_insert_closed ON public.organization_members;
CREATE POLICY p0_membership_insert_closed ON public.organization_members AS RESTRICTIVE FOR INSERT TO anon, authenticated WITH CHECK (false);
DROP POLICY IF EXISTS p0_membership_update_closed ON public.organization_members;
CREATE POLICY p0_membership_update_closed ON public.organization_members AS RESTRICTIVE FOR UPDATE TO anon, authenticated USING (false) WITH CHECK (false);
DROP POLICY IF EXISTS p0_membership_delete_closed ON public.organization_members;
CREATE POLICY p0_membership_delete_closed ON public.organization_members AS RESTRICTIVE FOR DELETE TO anon, authenticated USING (false);

-- Subscription/payment records are server-only. No current product reads these
-- via a normal client; even owner SELECT is intentionally not granted.
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public.subscriptions FROM PUBLIC, anon, authenticated;
DO $$
DECLARE col record;
BEGIN
  FOR col IN SELECT attname FROM pg_attribute
    WHERE attrelid = 'public.subscriptions'::regclass AND attnum > 0 AND NOT attisdropped
  LOOP
    EXECUTE format('REVOKE SELECT (%1$I), INSERT (%1$I), UPDATE (%1$I), REFERENCES (%1$I) ON public.subscriptions FROM PUBLIC, anon, authenticated', col.attname);
  END LOOP;
END $$;
-- Intersect any legacy permissive policies, including broad FOR ALL policies.
DROP POLICY IF EXISTS p0_subscriptions_client_closed ON public.subscriptions;
CREATE POLICY p0_subscriptions_client_closed ON public.subscriptions
  AS RESTRICTIVE FOR ALL TO anon, authenticated USING (false) WITH CHECK (false);
DO $$
DECLARE role_name text; privilege_name text;
BEGIN
  FOREACH role_name IN ARRAY ARRAY['anon','authenticated'] LOOP
    FOREACH privilege_name IN ARRAY ARRAY['SELECT','INSERT','UPDATE','DELETE','TRUNCATE','REFERENCES','TRIGGER'] LOOP
      IF has_table_privilege(role_name,'public.subscriptions',privilege_name) THEN
        RAISE EXCEPTION 'Unexpected inherited subscriptions privilege: % %',role_name,privilege_name;
      END IF;
    END LOOP;
    FOREACH privilege_name IN ARRAY ARRAY['SELECT','INSERT','UPDATE','REFERENCES'] LOOP
      IF has_any_column_privilege(role_name,'public.subscriptions',privilege_name) THEN
        RAISE EXCEPTION 'Unexpected subscriptions column privilege: % %',role_name,privilege_name;
      END IF;
    END LOOP;
    IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname=role_name AND (rolsuper OR rolbypassrls)) THEN
      RAISE EXCEPTION 'Client role bypasses RLS: %',role_name;
    END IF;
  END LOOP;
  -- Preserve existing direct server grants; never silently depend on PUBLIC.
  FOREACH privilege_name IN ARRAY ARRAY['SELECT','INSERT','UPDATE','DELETE'] LOOP
    IF NOT has_table_privilege('service_role','public.subscriptions',privilege_name) THEN
      RAISE EXCEPTION 'Required service_role subscriptions privilege missing: %',privilege_name;
    END IF;
  END LOOP;
  IF NOT has_schema_privilege('service_role','public','USAGE') OR NOT EXISTS (
    SELECT 1 FROM pg_roles WHERE rolname='service_role' AND rolbypassrls
  ) THEN
    RAISE EXCEPTION 'Required service_role schema access/RLS bypass missing';
  END IF;
END $$;

-- Locally discovered balance RPC lacks caller/amount authorization. Preserve the
-- body/behavior for trusted server callers, remove direct public execution.
DO $$
BEGIN
  IF to_regprocedure('public.increment_connects(uuid,integer)') IS NOT NULL THEN
    ALTER FUNCTION public.increment_connects(uuid,integer) SET search_path = pg_catalog, public, pg_temp;
    REVOKE ALL ON FUNCTION public.increment_connects(uuid,integer) FROM PUBLIC, anon, authenticated;
  END IF;
  IF to_regprocedure('public.increment_social_post_view(uuid)') IS NOT NULL THEN
    ALTER FUNCTION public.increment_social_post_view(uuid) SET search_path = pg_catalog, public, pg_temp;
    REVOKE ALL ON FUNCTION public.increment_social_post_view(uuid) FROM PUBLIC, anon, authenticated;
  END IF;
  IF to_regprocedure('public.give_signup_connects()') IS NOT NULL THEN
    -- Do not remove trigger or change credit semantics without its full live body.
    REVOKE ALL ON FUNCTION public.give_signup_connects() FROM PUBLIC, anon, authenticated;
  END IF;
  IF to_regprocedure('public.update_avg_rating()') IS NOT NULL THEN
    -- Internal trigger entry point, not a client RPC. Preserve invoker behavior.
    REVOKE ALL ON FUNCTION public.update_avg_rating() FROM PUBLIC, anon, authenticated;
  END IF;
END $$;

-- Effective privilege assertions catch unexpected inherited grants. Abort the
-- entire transaction rather than silently leaving an alternate privilege path.
DO $$
DECLARE col record; role_name text; fn regprocedure;
BEGIN
  FOREACH role_name IN ARRAY ARRAY['anon','authenticated'] LOOP
    IF has_table_privilege(role_name,'public.profiles','DELETE') OR has_table_privilege(role_name,'public.profiles','TRUNCATE') OR
       has_table_privilege(role_name,'public.organization_members','DELETE') OR has_table_privilege(role_name,'public.organization_members','TRUNCATE') OR
       has_table_privilege(role_name,'public.own_profiles','DELETE') OR
       has_any_column_privilege(role_name,'public.own_profiles','INSERT') OR has_any_column_privilege(role_name,'public.own_profiles','UPDATE') OR
       has_schema_privilege(role_name,'public','CREATE') THEN
      RAISE EXCEPTION 'Unexpected inherited destructive/view/schema privilege: %',role_name;
    END IF;
    IF role_name='anon' AND has_any_column_privilege(role_name,'public.own_profiles','SELECT') THEN
      RAISE EXCEPTION 'Anonymous access to owner view';
    END IF;
    FOR col IN SELECT attname FROM pg_attribute WHERE attrelid='public.profiles'::regclass AND attnum>0 AND NOT attisdropped LOOP
      IF has_column_privilege(role_name,'public.profiles',col.attname,'INSERT') THEN
        RAISE EXCEPTION 'Unexpected inherited profile INSERT: %.%',role_name,col.attname;
      END IF;
      IF col.attname <> ALL (ARRAY[
        'id','full_name','username','avatar_url','tagline','bio','location','job_function','skills',
        'portfolio_links','hourly_rate','availability','experience_years','experience_description',
        'linkedin_url','company','company_name','company_size','company_website','industry',
        'is_verified','is_employer_verified','avg_rating','total_reviews','is_boosted','boost_expires_at',
        'profile_completed','is_private','created_at','updated_at'
      ]) AND has_column_privilege(role_name,'public.profiles',col.attname,'SELECT') THEN
        RAISE EXCEPTION 'Unexpected private profile SELECT: %.%',role_name,col.attname;
      END IF;
      IF (role_name='anon' OR col.attname <> ALL (ARRAY[
        'full_name','username','avatar_url','tagline','bio','location','phone','phone_is_public','is_private',
        'job_function','skills','portfolio_links','hourly_rate','availability','experience_years','experience_description',
        'linkedin_url','cv_url','expected_salary','preferred_job_type','company_name','company_size','company_website','industry','gst_number'
      ])) AND has_column_privilege(role_name,'public.profiles',col.attname,'UPDATE') THEN
        RAISE EXCEPTION 'Unexpected authority profile UPDATE: %.%',role_name,col.attname;
      END IF;
    END LOOP;
    FOR col IN SELECT attname FROM pg_attribute WHERE attrelid='public.organization_members'::regclass AND attnum>0 AND NOT attisdropped LOOP
      IF has_column_privilege(role_name,'public.organization_members',col.attname,'INSERT') OR
         has_column_privilege(role_name,'public.organization_members',col.attname,'UPDATE') THEN
        RAISE EXCEPTION 'Unexpected inherited membership write: %.%',role_name,col.attname;
      END IF;
    END LOOP;
    FOREACH fn IN ARRAY ARRAY[to_regprocedure('public.handle_new_user()'),to_regprocedure('public.give_signup_connects()'),to_regprocedure('public.update_avg_rating()'),
      to_regprocedure('public.increment_connects(uuid,integer)'),to_regprocedure('public.increment_social_post_view(uuid)')] LOOP
      IF fn IS NOT NULL AND has_function_privilege(role_name,fn,'EXECUTE') THEN
        RAISE EXCEPTION 'Unexpected inherited function execution: % %',role_name,fn;
      END IF;
    END LOOP;
  END LOOP;
END $$;

-- No new service-role privileges, no bucket changes, no billing/escrow/team enablement.
NOTIFY pgrst, 'reload schema';
COMMIT;
