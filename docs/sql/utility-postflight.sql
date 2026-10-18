-- Read-only verification after running 20261018090000_utility_products.sql.
-- Expected: 4 tables with RLS true; browser_read/browser_write false.
select c.relname as table_name, c.relrowsecurity as rls_enabled,
 has_table_privilege('anon',c.oid,'SELECT') or has_table_privilege('authenticated',c.oid,'SELECT') as browser_read,
 has_table_privilege('anon',c.oid,'INSERT') or has_table_privilege('authenticated',c.oid,'INSERT') or has_table_privilege('authenticated',c.oid,'UPDATE') as browser_write,
 has_table_privilege('service_role',c.oid,'SELECT') as server_read
from pg_class c join pg_namespace n on n.oid=c.relnamespace
where n.nspname='public' and c.relname in ('utility_documents','utility_orders','utility_verifications','utility_generation_attempts')
order by c.relname;

-- Expected: 4 functions, security_definer false, browser_execute false, server_execute true.
select p.proname as function_name,p.prosecdef as security_definer,
 has_function_privilege('anon',p.oid,'EXECUTE') or has_function_privilege('authenticated',p.oid,'EXECUTE') as browser_execute,
 has_function_privilege('service_role',p.oid,'EXECUTE') as server_execute
from pg_proc p join pg_namespace n on n.oid=p.pronamespace
where n.nspname='public' and p.proname in ('utility_reserve_document','utility_reserve_order','utility_settle_order','utility_publish_pitch')
order by p.proname;
