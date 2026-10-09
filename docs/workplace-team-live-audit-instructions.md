# Read-only live audits required

The workspace references GigWay Supabase project **sdrpqlahqkhimlpcobwf**. Available inspection tools list only other projects; no query was run against them. Do not run these scripts against a similarly named or unrelated project.

1. Open the Supabase dashboard for `sdrpqlahqkhimlpcobwf`, confirm the project URL/ref, then SQL Editor.
2. Paste the complete `supabase/audits/workplace-team-live-readonly-audit.sql`. It begins `BEGIN TRANSACTION READ ONLY` and ends `ROLLBACK`. Run the whole script. It performs no data/schema writes.
3. Save every result grid as a local audit artifact. Output contains catalogs and aggregate counts, not individual member/user IDs. Review trigger/RPC definitions locally for embedded secrets before sharing them. Do not send database URLs, passwords or service keys.
4. In a separate editor session run the complete `supabase/audits/launch-security-live-readonly-audit.sql`. This inspects profile/storage grants, RLS, constraints, triggers and billing/block-related function definitions without reading document paths, fragments or payment/user records.
5. If a relation does not exist or permissions are denied, the read-only transaction aborts. Issue `ROLLBACK` to end it; report the error rather than editing policies or creating tables. A partial/empty result is not evidence of safety.

Before team writes, review actual allowed role/status values, pair uniqueness, foreign keys, all permissive/restrictive RLS policies, grants, trigger functions and any security-definer RPC. Prove that authorized operations atomically lock/check the organization and preserve at least one active owner under concurrent removes/demotions. No invite/remove/promote/ownership feature can be enabled from catalogs alone without denial/concurrency tests on a disposable database.

Privacy review: `verification-docs` must be private; authenticated users must not list/read another person's objects; public profile table-level SELECT grants must not expose verification fields. Table grants can override a proposed column-only restriction. Check security-definer views/RPCs too. Use synthetic documents and two dedicated test identities in a disposable environment to test actual anonymous/other-user denial; do not probe real people's document URLs.

Ban review: verify authenticated users cannot change `is_banned` or authorization/payment flags; database/storage policies and RPCs enforce stored ban status, including direct REST access with existing tokens. Browser-side mutations bypass application server gates. User Block has no positively identified local schema; do not invent a table or enable a cosmetic control.

Application guards do not eliminate job-close/apply races: verify deployed unique application pair and a database-side active-job/non-owner invariant in an atomic write. Keep billing/proposals/escrow/document collection paused until their separate prerequisites pass. These scripts are audits, not migrations; never apply remote migrations during this pass.
