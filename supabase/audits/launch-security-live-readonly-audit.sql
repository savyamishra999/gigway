-- Read-only catalogs and aggregates ONLY. Never return document paths/fragments,
-- tokens, payment identifiers, user IDs or actual sensitive record contents.
BEGIN TRANSACTION READ ONLY;
SELECT table_name,column_name,data_type,is_nullable,column_default
FROM information_schema.columns WHERE table_schema='public'
AND table_name IN ('profiles','jobs','job_applications','proposals','connects_transactions','payments','payment_orders','entitlements','escrow_transactions')
ORDER BY table_name,ordinal_position;
SELECT n.nspname,c.relname,c.relrowsecurity,c.relforcerowsecurity,pg_get_userbyid(c.relowner) AS owner
FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace
WHERE (n.nspname='public' AND c.relname IN ('profiles','jobs','job_applications','proposals','connects_transactions','payments','payment_orders','entitlements'))
OR (n.nspname='storage' AND c.relname IN ('objects','buckets'));
SELECT schemaname,tablename,policyname,roles,cmd,qual,with_check FROM pg_policies
WHERE (schemaname='public' AND tablename IN ('profiles','jobs','job_applications','proposals','connects_transactions','payments','payment_orders','entitlements'))
OR (schemaname='storage' AND tablename IN ('objects','buckets'));
SELECT table_schema,table_name,grantee,privilege_type FROM information_schema.table_privileges
WHERE (table_schema='public' AND table_name IN ('profiles','jobs','job_applications','proposals','connects_transactions','payments','payment_orders','entitlements'))
OR (table_schema='storage' AND table_name IN ('objects','buckets'));
SELECT table_schema,table_name,column_name,grantee,privilege_type
FROM information_schema.column_privileges WHERE table_schema='public' AND table_name='profiles';
-- Table SELECT grants override narrower column-grant intent; inspect both.
SELECT conrelid::regclass AS table_name,conname,contype,convalidated,pg_get_constraintdef(oid,true)
FROM pg_constraint WHERE conrelid IN (to_regclass('public.job_applications'),to_regclass('public.proposals'),to_regclass('public.payments'),to_regclass('public.payment_orders'),to_regclass('public.entitlements'));
SELECT t.tgrelid::regclass,t.tgname,t.tgisinternal,pg_get_triggerdef(t.oid,true),p.prosecdef,p.proconfig,p.proacl,
 CASE WHEN NOT t.tgisinternal THEN pg_get_functiondef(p.oid) END AS function_definition
FROM pg_trigger t JOIN pg_proc p ON p.oid=t.tgfoid
WHERE t.tgrelid IN (to_regclass('public.profiles'),to_regclass('public.jobs'),to_regclass('public.job_applications'),to_regclass('public.proposals'),to_regclass('public.payments'));
SELECT id,public,file_size_limit,allowed_mime_types FROM storage.buckets WHERE id='verification-docs';
SELECT count(*) AS verification_object_count FROM storage.objects WHERE bucket_id='verification-docs';
SELECT schemaname,tablename FROM pg_tables
WHERE schemaname='public' AND (tablename ILIKE '%block%' OR tablename ILIKE '%escrow%' OR tablename ILIKE '%refund%');
SELECT p.oid::regprocedure,p.prosecdef,p.proconfig,p.proacl,pg_get_functiondef(p.oid)
FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace WHERE n.nspname='public' AND p.prokind='f'
AND (p.proname ILIKE '%connect%' OR p.proname ILIKE '%payment%' OR p.proname ILIKE '%propos%' OR p.proname ILIKE '%ban%' OR p.proname ILIKE '%block%');
ROLLBACK;
