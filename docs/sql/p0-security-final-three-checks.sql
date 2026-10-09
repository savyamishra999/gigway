-- FINAL GO/NO-GO: run each numbered SELECT separately and copy its result.
-- Read-only catalog inspection. Does not invoke application functions.

-- 1. Signup bodies and actual signup/profile trigger attachments.
WITH attachments AS (
  SELECT t.tgfoid, t.tgrelid::regclass::text AS target,
         t.tgname, t.tgenabled, pg_get_triggerdef(t.oid, true) AS definition
  FROM pg_trigger t
  WHERE NOT t.tgisinternal
    AND t.tgrelid IN ('auth.users'::regclass, 'public.profiles'::regclass)
), functions AS (
  SELECT p.oid::regprocedure::text AS signature, p.prosecdef,
         p.proconfig, pg_get_userbyid(p.proowner) AS owner,
         pg_get_functiondef(p.oid) AS definition,
         has_function_privilege('anon', p.oid, 'EXECUTE') AS anon_execute,
         has_function_privilege('authenticated', p.oid, 'EXECUTE') AS authenticated_execute
  FROM pg_proc p JOIN pg_namespace n ON n.oid = p.pronamespace
  WHERE p.prokind = 'f' AND (
    (n.nspname = 'public' AND p.proname IN ('handle_new_user', 'give_signup_connects'))
    OR p.oid IN (SELECT tgfoid FROM attachments)
  )
)
SELECT jsonb_build_object(
  'functions', COALESCE((SELECT jsonb_agg(to_jsonb(f)) FROM functions f), '[]'::jsonb),
  'triggers', COALESCE((SELECT jsonb_agg(to_jsonb(t) - 'tgfoid') FROM attachments t), '[]'::jsonb)
) AS signup_review;

-- 2. Profile-dependent views (including nested views) and directly relevant RPCs.
-- Text matching flags RPC candidates; it cannot prove absence of dynamic SQL bypasses.
WITH RECURSIVE profile_relations(oid) AS (
  SELECT 'public.profiles'::regclass::oid
  UNION
  SELECT r.ev_class
  FROM profile_relations base
  JOIN pg_depend d ON d.refclassid = 'pg_class'::regclass AND d.refobjid = base.oid
  JOIN pg_rewrite r ON d.classid = 'pg_rewrite'::regclass AND d.objid = r.oid
  JOIN pg_class c ON c.oid = r.ev_class AND c.relkind IN ('v', 'm')
), objects AS (
  SELECT 'view'::text AS kind, c.oid::regclass::text AS signature,
         pg_get_userbyid(c.relowner) AS owner, c.reloptions::text AS options,
         has_any_column_privilege('anon', c.oid, 'SELECT') AS anon_access,
         has_any_column_privilege('authenticated', c.oid, 'SELECT') AS authenticated_access,
         pg_get_viewdef(c.oid, true) AS definition
  FROM profile_relations r JOIN pg_class c ON c.oid = r.oid
  WHERE c.relkind IN ('v', 'm')
  UNION ALL
  SELECT 'function', p.oid::regprocedure::text, pg_get_userbyid(p.proowner),
         concat('security_definer=', p.prosecdef, '; config=', p.proconfig::text),
         has_function_privilege('anon', p.oid, 'EXECUTE'),
         has_function_privilege('authenticated', p.oid, 'EXECUTE'),
         pg_get_functiondef(p.oid)
  FROM pg_proc p JOIN pg_namespace n ON n.oid = p.pronamespace
  WHERE n.nspname = 'public' AND p.prokind = 'f'
    AND (p.prosrc ~* '(profiles|aadhaar|ban_reason|connects_balance|subscription_tier|user_roles)'
         OR EXISTS (SELECT 1 FROM profile_relations r JOIN pg_class c ON c.oid = r.oid
                    WHERE strpos(lower(p.prosrc), lower(c.relname)) > 0))
    AND (has_function_privilege('anon', p.oid, 'EXECUTE')
         OR has_function_privilege('authenticated', p.oid, 'EXECUTE'))
)
SELECT * FROM objects ORDER BY kind, signature;

-- 3. Effective trusted-server privileges needed by profile/admin/org creation.
-- BYPASSRLS alone does not grant table access.
SELECT n.nspname AS schema_name, c.relname AS table_name,
       has_schema_privilege('service_role', n.oid, 'USAGE') AS schema_usage,
       has_table_privilege('service_role', c.oid, 'SELECT') AS table_select,
       has_table_privilege('service_role', c.oid, 'INSERT') AS table_insert,
       has_table_privilege('service_role', c.oid, 'UPDATE') AS table_update,
       has_table_privilege('service_role', c.oid, 'DELETE') AS table_delete,
       (SELECT rolbypassrls FROM pg_roles WHERE rolname = 'service_role') AS bypass_rls,
       c.relrowsecurity AS rls_enabled, c.relforcerowsecurity AS rls_forced,
       c.relacl::text AS direct_acl,
       (SELECT jsonb_object_agg(a.attname, jsonb_build_object(
          'select', has_column_privilege('service_role', c.oid, a.attnum, 'SELECT'),
          'insert', has_column_privilege('service_role', c.oid, a.attnum, 'INSERT'),
          'update', has_column_privilege('service_role', c.oid, a.attnum, 'UPDATE')))
        FROM pg_attribute a WHERE a.attrelid = c.oid AND a.attnum > 0 AND NOT a.attisdropped
       ) AS effective_columns
FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace
WHERE n.nspname = 'public'
  AND c.relname IN ('profiles', 'organizations', 'organization_members', 'admin_grants', 'subscriptions')
ORDER BY c.relname;
