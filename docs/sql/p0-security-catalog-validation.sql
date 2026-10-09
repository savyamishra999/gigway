-- Exact READ-ONLY preflight/post-migration evidence. Not a migration.
-- Run in confirmed GigWay project only. Save all result grids, no user records.
BEGIN TRANSACTION READ ONLY;
SELECT current_database(), current_user, version();
SELECT ordinal_position,column_name,data_type,udt_name,is_nullable,column_default
FROM information_schema.columns WHERE table_schema='public' AND table_name='profiles' ORDER BY ordinal_position;
SELECT n.nspname,c.relname,c.relrowsecurity,c.relforcerowsecurity,c.relacl,c.reloptions,pg_get_userbyid(c.relowner) AS owner
FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace
WHERE (n.nspname='public' AND c.relname IN ('profiles','own_profiles','organizations','organization_members'))
OR (n.nspname='storage' AND c.relname IN ('objects','buckets'));
-- Complete effective matrix includes table, column and inherited privileges.
-- Expected after migration: sensitive base SELECT/INSERT/UPDATE all false for both.
SELECT r.role_name,a.attname AS column_name,
 has_column_privilege(r.role_name,'public.profiles',a.attname,'SELECT') AS can_select,
 has_column_privilege(r.role_name,'public.profiles',a.attname,'INSERT') AS can_insert,
 has_column_privilege(r.role_name,'public.profiles',a.attname,'UPDATE') AS can_update
FROM pg_attribute a CROSS JOIN (VALUES ('anon'),('authenticated')) r(role_name)
WHERE a.attrelid='public.profiles'::regclass AND a.attnum>0 AND NOT a.attisdropped ORDER BY 1,2;
SELECT r.role_name,c.relname,
 has_table_privilege(r.role_name,c.oid,'SELECT') AS table_select,
 has_table_privilege(r.role_name,c.oid,'INSERT') AS table_insert,
 has_table_privilege(r.role_name,c.oid,'UPDATE') AS table_update,
 has_table_privilege(r.role_name,c.oid,'DELETE') AS table_delete,
 has_table_privilege(r.role_name,c.oid,'TRUNCATE') AS table_truncate
FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace
CROSS JOIN (VALUES ('anon'),('authenticated'),('service_role')) r(role_name)
WHERE n.nspname='public' AND c.relname IN ('profiles','own_profiles','organization_members');
SELECT r.role_name,a.attname,
 has_column_privilege(r.role_name,'public.organization_members',a.attname,'INSERT') AS member_insert,
 has_column_privilege(r.role_name,'public.organization_members',a.attname,'UPDATE') AS member_update
FROM pg_attribute a CROSS JOIN (VALUES ('anon'),('authenticated')) r(role_name)
WHERE a.attrelid='public.organization_members'::regclass AND a.attnum>0 AND NOT a.attisdropped;
SELECT schemaname,tablename,policyname,permissive,roles,cmd,qual,with_check FROM pg_policies
WHERE (schemaname='public' AND tablename IN ('profiles','organizations','organization_members'))
OR (schemaname='storage' AND tablename IN ('objects','buckets')) ORDER BY 1,2,3;
SELECT table_schema,table_name,grantee,privilege_type,is_grantable FROM information_schema.table_privileges
WHERE (table_schema='public' AND table_name IN ('profiles','own_profiles','organizations','organization_members'))
OR (table_schema='storage' AND table_name IN ('objects','buckets')) ORDER BY 1,2,3,4;
SELECT table_schema,table_name,column_name,grantee,privilege_type FROM information_schema.column_privileges
WHERE table_schema='public' AND table_name IN ('profiles','own_profiles','organization_members') ORDER BY 2,3,4,5;
SELECT n.nspname,c.relname,pg_get_viewdef(c.oid,true) AS definition,c.relacl,c.reloptions
FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace
WHERE c.relkind IN ('v','m') AND n.nspname NOT IN ('pg_catalog','information_schema')
AND (c.relname='own_profiles' OR pg_get_viewdef(c.oid,true) ILIKE '%profiles%');
-- Includes every non-system definer, plus candidate invoker signup/membership/money functions.
-- Full bodies may contain operational details: review locally before sharing.
SELECT p.oid::regprocedure AS function_name,p.prosecdef,p.proconfig,p.proacl,pg_get_userbyid(p.proowner) AS owner,
 has_function_privilege('anon',p.oid,'EXECUTE') AS anon_execute,
 has_function_privilege('authenticated',p.oid,'EXECUTE') AS authenticated_execute,
 has_function_privilege('service_role',p.oid,'EXECUTE') AS service_execute,
 pg_get_functiondef(p.oid) AS definition
FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace
WHERE p.prokind='f' AND n.nspname NOT IN ('pg_catalog','information_schema')
AND n.nspname NOT LIKE 'pg_toast%' AND
 (p.prosecdef OR p.proname ~* 'signup|new_user|member|organization|workplace|connect|ban|block|refund|escrow|payment')
ORDER BY 1;
SELECT t.tgrelid::regclass AS table_name,t.tgname,t.tgenabled,t.tgisinternal,
 pg_get_triggerdef(t.oid,true) AS trigger_definition,p.oid::regprocedure AS function_name,
 CASE WHEN NOT t.tgisinternal THEN pg_get_functiondef(p.oid) END AS function_definition
FROM pg_trigger t JOIN pg_proc p ON p.oid=t.tgfoid
WHERE t.tgrelid IN (to_regclass('auth.users'),to_regclass('public.profiles'),to_regclass('public.organizations'),to_regclass('public.organization_members'))
OR p.proname IN ('handle_new_user','give_signup_connects');
SELECT id,public,file_size_limit,allowed_mime_types FROM storage.buckets WHERE id='verification-docs';
SELECT schemaname,tablename FROM pg_tables WHERE schemaname='public' AND tablename ~* 'ban|block|refund|escrow';
SELECT table_name,column_name,data_type FROM information_schema.columns WHERE table_schema='public' AND
 (column_name ~* 'ban|block|refund|escrow' OR table_name ~* 'ban|block|refund|escrow') ORDER BY 1,2;
SELECT conrelid::regclass,conname,contype,pg_get_constraintdef(oid,true)
FROM pg_constraint WHERE conrelid IN (to_regclass('public.profiles'),to_regclass('public.organization_members'));
SELECT rolname,rolsuper,rolbypassrls,rolinherit FROM pg_roles WHERE rolname IN ('anon','authenticated','service_role','postgres');
SELECT pg_get_userbyid(roleid) AS parent_role,pg_get_userbyid(member) AS member_role FROM pg_auth_members;
SELECT r.role_name,has_schema_privilege(r.role_name,'public','CREATE') AS public_create
FROM (VALUES ('anon'),('authenticated')) r(role_name);
WITH owner_counts AS (
 SELECT o.id,count(m.id) FILTER (WHERE m.member_role='owner' AND m.status='active') AS owners
 FROM public.organizations o LEFT JOIN public.organization_members m ON m.organization_id=o.id GROUP BY o.id
) SELECT count(*) FILTER (WHERE owners=0) AS zero_active_owners,
 count(*) FILTER (WHERE owners>1) AS multiple_active_owners FROM owner_counts;
ROLLBACK;
