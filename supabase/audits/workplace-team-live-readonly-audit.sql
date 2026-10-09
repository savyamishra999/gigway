-- NEW READ-ONLY AUDIT, not a migration. Run ONLY in GigWay project
-- sdrpqlahqkhimlpcobwf after checking the dashboard URL. No individual PII.
BEGIN TRANSACTION READ ONLY;
SELECT current_database(), version();
SELECT table_name, ordinal_position, column_name, data_type, udt_name,
       is_nullable, column_default
FROM information_schema.columns WHERE table_schema='public'
AND table_name IN ('organizations','organization_members') ORDER BY table_name,ordinal_position;
SELECT c.relname, c.relrowsecurity, c.relforcerowsecurity, pg_get_userbyid(c.relowner) AS owner
FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace
WHERE n.nspname='public' AND c.relname IN ('organizations','organization_members');
SELECT conrelid::regclass AS source_table, confrelid::regclass AS referenced_table,
       conname, contype, convalidated, pg_get_constraintdef(oid,true) AS definition
FROM pg_constraint WHERE conrelid IN (to_regclass('public.organizations'),to_regclass('public.organization_members'))
OR confrelid IN (to_regclass('public.organizations'),to_regclass('public.organization_members')) ORDER BY source_table,conname;
SELECT tablename,indexname,indexdef FROM pg_indexes WHERE schemaname='public'
AND tablename IN ('organizations','organization_members') ORDER BY tablename,indexname;
SELECT schemaname,tablename,policyname,permissive,roles,cmd,qual,with_check
FROM pg_policies WHERE schemaname='public' AND tablename IN ('organizations','organization_members');
SELECT t.tgrelid::regclass AS table_name,t.tgname,t.tgenabled,t.tgisinternal,
       pg_get_triggerdef(t.oid,true) AS trigger_definition,
       p.oid::regprocedure AS function_name,p.prosecdef AS security_definer,
       p.proconfig,p.proacl,CASE WHEN NOT t.tgisinternal THEN pg_get_functiondef(p.oid) END AS function_definition
FROM pg_trigger t JOIN pg_proc p ON p.oid=t.tgfoid
WHERE t.tgrelid IN (to_regclass('public.organizations'),to_regclass('public.organization_members'));
SELECT table_name,grantor,grantee,privilege_type,is_grantable
FROM information_schema.table_privileges WHERE table_schema='public'
AND table_name IN ('organizations','organization_members') ORDER BY table_name,grantee,privilege_type;
SELECT table_name,column_name,grantee,privilege_type
FROM information_schema.column_privileges WHERE table_schema='public'
AND table_name IN ('organizations','organization_members');
-- JSON access tolerates missing role/status columns. Inspect columns above first.
SELECT to_jsonb(m)->>'member_role' AS role,to_jsonb(m)->>'status' AS status,count(*)
FROM public.organization_members m GROUP BY 1,2 ORDER BY 1,2;
WITH owner_counts AS (
 SELECT to_jsonb(o)->>'id' AS organization_id,
   count(*) FILTER (WHERE to_jsonb(m)->>'member_role'='owner' AND to_jsonb(m)->>'status'='active') AS owners
 FROM public.organizations o LEFT JOIN public.organization_members m
 ON to_jsonb(m)->>'organization_id'=to_jsonb(o)->>'id' GROUP BY 1
)
SELECT count(*) FILTER (WHERE owners=0) AS workplaces_zero_active_owners,
       count(*) FILTER (WHERE owners>1) AS workplaces_multiple_active_owners FROM owner_counts;
SELECT count(*) AS duplicate_membership_pairs FROM (
 SELECT to_jsonb(m)->>'organization_id',to_jsonb(m)->>'profile_id'
 FROM public.organization_members m GROUP BY 1,2 HAVING count(*)>1
) duplicates;
-- RPCs and table owners can bypass RLS; inspect their auth and final-owner locks.
SELECT p.oid::regprocedure AS function_name,p.prosecdef,p.proconfig,p.proacl,
       pg_get_functiondef(p.oid) AS definition
FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace
WHERE n.nspname='public' AND p.prokind='f'
AND (p.proname ILIKE '%organization%' OR p.proname ILIKE '%workplace%' OR p.proname ILIKE '%member%');
ROLLBACK;
