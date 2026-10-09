# P0 live security remediation — local review candidate

## Current status ? 2026-10-09

**LOCAL READY / PRODUCTION UNAPPLIED.** The P0 remediation is frozen as a local candidate. Live security audit, subscriptions lockdown, signup functions/triggers and profile view/RPC review are recorded complete from the supplied audit findings; no existing profile views or own_profiles collision were reported. Earlier requests below for more catalog output are historical and superseded.

Disposable database verification deferred due environment/tooling setup; no production safety claim.

Disposable migration/denial/signup/rating and matching application verification remain pre-production gates, not blockers for local product development. Do not troubleshoot Docker or WSL. Production migration remains UNAPPLIED. Payments, proposals, escrow, document collection and team lifecycle remain paused. No commit, push, deployment or remote migration is authorized. See [product resumption review](master-product-resumption-review.md) for the current roadmap split.


## Final Section 2 reconciliation (latest; supersedes earlier pending catalog requests)

**Local migration verdict: READY FOR DISPOSABLE TESTING, not production approval.** User reports Section 2 complete: no profile views, no existing own_profiles; relevant functions are invoker update_avg_rating(), definer handle_new_user() with unset search_path, and invoker give_signup_connects(), all with client EXECUTE. Sections 1 and 3 are reported complete. No further live SQL is requested.

No bypass is identified in that reported profile view/RPC scope. This is not a universal proof about dynamic SQL, unreported schemas, or all database objects. The migration revokes PUBLIC/anon/authenticated execution from all three named functions and checks effective client execution (including inherited access). update_avg_rating() revocation is the final addition. Bodies, trigger attachments and invoker/definer modes remain unchanged. handle_new_user keeps the existing candidate hardening `search_path = pg_catalog, public, pg_temp` alongside client CREATE revocation on public; no signup credit or metadata behavior is rewritten. Absence of own_profiles removes the reported view-name collision concern.

Synthetic tests now include an auth.users -> handle_new_user -> profiles -> give_signup_connects chain and an invoker rating trigger after EXECUTE revocation. They do not reproduce the actual live function bodies. In particular an invoker rating function still needs the initiating role's underlying permissions; revocation does not elevate it or repair the previously noted normal-client rating aggregate limitation. Disposable testing must exercise the existing captured trigger definitions and actual intended callers before production approval. PostgreSQL requires function EXECUTE to create a trigger; this patch does not recreate production triggers ([CREATE TRIGGER documentation](https://www.postgresql.org/docs/current/sql-createtrigger.html)).

Remaining process: run the isolated synthetic harness, then validate the already captured schema/functions and real signup/rating behavior in a disposable Supabase environment, and browser-QA the matching app against that environment. Prepare a restorable baseline and coordinated app/migration release only after those pass. No further catalog marathon. Docker proof and browser QA are NOT RUN for this final review; source review cannot substitute for either.

The disposable harness remains archived at `scripts/p0-security-disposable.cjs` for a separately authorized pre-production verification pass. It was not run during product resumption; no tooling setup is requested.

## Latest addendum: subscriptions P0 lockdown (supersedes earlier audit scope/verdict)

**Revised verdict: NO-GO for production.** User reports `public.subscriptions` has RLS disabled and direct anon/authenticated CRUD grants. Local migration now closes this base-table access; nothing has been applied remotely. Section 1 and Section 3 are reported complete by the user. Only the previously requested **Section 2 profile view/RPC output** remains requested; no new broad catalog dump is requested. Base-table revocations do not close privileged view/RPC bypasses.

### Complete current application subscriptions inventory

Repository-wide source search found five query sites, all server-side:

| File | Queries | Legitimate access / current state |
| --- | --- | --- |
| `app/api/webhooks/razorpay/route.ts` | SELECT id by payment_id; INSERT captured payment; INSERT failed payment | Service-role client. Billing flag returns 503 before client creation; still paused. |
| `app/api/admin/revenue/export/route.ts` | SELECT active records with profile name/email | Verified admin followed by service-role client; export retained. Amounts are inferred from a legacy price map, not authoritative settlement evidence. |
| `app/api/admin/delete-user/route.ts` | DELETE by user_id | Verified admin followed by service-role client; existing cleanup retained. Existing multi-table deletion is nontransactional and ignores some errors; this patch does not redesign it. |

No client component or owner dashboard reads this table, and no application UPDATE query targets it. Normal clients need **no SELECT/INSERT/UPDATE/DELETE**. There is no owner-read policy. Current admin and paused webhook queries already use service clients, so no application query change is needed for this extension. Existing service-role SELECT/INSERT/UPDATE/DELETE grants remain intact; migration asserts them and schema USAGE/BYPASSRLS rather than adding privileges or enabling workflows.

### Local migration and test changes

- Require subscriptions to exist, enable RLS, revoke ALL table privileges and all SELECT/INSERT/UPDATE/REFERENCES column privileges from PUBLIC/anon/authenticated.
- Add a restrictive FOR ALL policy with false USING/WITH CHECK, intersecting any dormant broad permissive policies. Effective inherited table/column privilege checks abort the whole transaction if unexpected client access survives.
- Keep existing profile plan/subscription_tier writes denied. No application data, function body, billing flag, sequence, or stored plan value is changed.
- Extend synthetic SQL fixtures with RLS initially disabled, broad grants, residual column grants, a dormant allow-all policy, and an existing subscription. Denial tests exercise anon and authenticated SELECT/INSERT/UPDATE/DELETE/upsert, own-ID plan forgery, profile plan/tier forgery, server CRUD, and RLS after simulated accidental DML re-grants. All fixture mutations remain in the disposable database/rolled-back test transaction.
- Local P0 source/route tests pass. Real SQL denial tests are **NOT RUN: Docker unavailable**; authored tests are not evidence of database enforcement. Regression results are reported in the final response. No new browser/production proof is claimed.

### Plan disagreement: possible, no reconciliation performed

`subscriptions.plan` records legacy product/payment labels, including boosts/connects, so it is not necessarily equivalent to a profile subscription tier. The paused legacy webhook changes selected profile fields and then inserts a subscription in separate calls; failures are not atomic. New prepaid fulfillment writes `payments` and `entitlements`, not subscriptions or profiles.plan/subscription_tier. `getUserEntitlements` uses active entitlements; admin lists also display profile plan/tier values. No app-level synchronization invariant was found. Previously open writes also allowed independent tampering. Actual live mismatches and any unseen trigger synchronization are unknown. This migration neither trusts old records as proof of payment nor reconciles/backfills/deletes them.

Payments, payment fulfillment/webhooks, proposals, escrow, document collection, team lifecycle, referral rewards and admin connects grants remain paused. Signup connects semantics are unchanged. Before production GO: assess the remaining Section 2 result and obtain disposable migration/denial proof plus the previously required app QA. PostgreSQL restrictive-policy and BYPASSRLS behavior follows the [official row-security documentation](https://www.postgresql.org/docs/current/ddl-rowsecurity.html).

Date: 2026-10-08 (Asia/Calcutta). **No commit, push, deployment, remote migration or production mutation performed.** The existing audit SQL files were not edited. This package changes local application source and supplies one unapplied migration.

## Baseline and evidence boundaries

- HEAD and local `origin/main`: `1071a551435511cf103f7c8446777c8225b9f02b`. No fetch performed; origin/main is the local remote-tracking ref.
- Initial worktree was extensively dirty: prior launch/blocker work, media changes, tests, docs and untracked security guards. Those changes are not attributed to this task. The companion worktree manifest records initial status, task-touched paths and overlapping files.
- User-supplied live findings are treated as reported evidence, not a new live inspection by this agent. The complete live profile catalog, function bodies, trigger definitions and ACL snapshot were not attached. Exact catalog reconciliation is still required.
- Source audit: [144 query sites](p0-profile-query-inventory.md), including owner reads, public reads, writes, admin access and embedded relations; dynamic username lookup is also documented. [61 source-known/reported profile fields](p0-profile-field-classification.md) classified. Additional live fields remain UNKNOWN and receive no new client grants.

## Live confirmed findings (supplied by user)

Profiles has RLS enabled but a public `SELECT USING (true)` policy and table-level SELECT grants. Anon can read Aadhaar paths, ban_reason and is_banned. Authenticated users have UPDATE privileges for those fields; existing policies only check `auth.uid() = id`. Other authority fields include connects_balance, subscription_tier, user_roles and the unexplained roles column.

`organization_members_insert_self` only checks profile_id = auth.uid(); it does not restrict the organization or role/status. No membership UPDATE/DELETE policies or final-owner RPC/trigger were reported. `handle_new_user()` is a definer function without a pinned search_path. `give_signup_connects()` is reported to be an invoker trigger assigning balance 10 and inserting a ledger row. `verification-docs.public = false`; no document-specific storage policies were observed. Paid/proposal/escrow/document flows are already paused.

## Root cause

Row identity is not column authorization. Table grants override attempts to narrow individual column privileges. A self-ID membership check does not establish organizational authority. Privileged RPCs and views can provide alternative paths around base-table protection, so catalog inspection must include their bodies and effective execution grants.

## Profile field classification and public read design

Selected **Option 2: explicit column SELECT grants on public.profiles**. Existing professional discovery, embedded FK relations and Workplace count-only queries continue to use the same relation. Moving every public relation to a new view would add join/relationship discovery risk without improving column isolation here.

The migration revokes table grants and every existing column SELECT/INSERT/UPDATE/REFERENCES grant from PUBLIC, anon and authenticated, then re-grants only explicitly named columns that exist. INSERT/upsert/DELETE/TRUNCATE are closed to clients; otherwise users could recreate protected state. Effective-privilege assertions fail the whole migration if inherited roles preserve unintended access. No data is backfilled.

Public professional columns: id, full_name, username, avatar_url, tagline, bio, location, job_function, skills, portfolio_links, hourly_rate, availability, experience_years, experience_description, linkedin_url, company, company_name, company_size, company_website, industry, is_verified, is_employer_verified, avg_rating, total_reviews, is_boosted, boost_expires_at, profile_completed, is_private, created_at, updated_at. Promotional badge/expiry fields are deliberate public presentation data, never owner-writable authority. The field inventory lists the exact categories individually.

A restrictive SELECT policy intersects existing permissive policies: owner, or completed/non-private/non-banned public profile. This also avoids publicly exposing unfinished identities. Missing required foundation columns abort, rather than weakening the condition. Public readers must use explicit selects, including count queries now selecting id instead of `*`.

Sensitive base fields, including email, phone, CV/resume URLs, salary preferences, tax identifiers, document data, bans, plans, balances and role configuration, are not publicly granted. `roles` has no source consumer or local definition establishing its meaning: **UNKNOWN, denied**. Do not assume it is professional intent or authorization. `user_roles` is used by lib/roles.ts and legacy product gating; values accepted by server onboarding are only find_work / hire_talent. It is not the admin access mechanism, but remains server-written as requested.

### Private owner reads

New `public.own_profiles` is an explicit owner-only read facade for dashboard/edit/onboarding/guard fields. It is a security-barrier view with a fixed `p.id = (SELECT auth.uid())` predicate, owned by postgres, SELECT granted only to authenticated, and `OFFSET 0` preventing automatic updates. It excludes Aadhaar paths, verification_doc, ban_reason and roles. A name collision with an unrelated existing view aborts.

This is a **deliberate owner-privilege view**, not an invoker view: granting underlying private columns to authenticated for an invoker view would also expose them through the existing publicly selectable base rows. Its predicate is therefore an explicit security boundary and requires two-user REST tests. Users can read their own is_banned/balance/plan state, not other users' state. Service-role clients without a user JWT do not have an owner row through this view. Billing badge lookup consequently uses the public is_verified field only; legacy verification_status-only badge inconsistencies need preflight review.

The owner view is not a global public projection. Public profile pages, Home, Network, GigCard, freelancer detail and Workplace still read explicitly whitelisted base fields. Owner dashboard/edit, legacy navbar, role/configuration reads and the server ban guard use own_profiles. Freelancer paid ranking uses a server-only client, with explicit privacy/ban/completion filters and a safe selected field list; plan/expiry are filter inputs only and are never sent to the browser. Admin/document review remains in existing verified server paths.

## Owner edit design

Normal owner editable columns (API and SQL lists agree):

`full_name, username, avatar_url, tagline, bio, location, phone, phone_is_public, is_private, job_function, skills, portfolio_links, hourly_rate, availability, experience_years, experience_description, linkedin_url, cv_url, expected_salary, preferred_job_type, company_name, company_size, company_website, industry, gst_number`.

The generic PATCH endpoint uses `ownerProfileUpdates()` and a verified user ID, rejects empty/malformed field sets, and never writes Aadhaar or authority keys. A restrictive UPDATE policy also requires the same stored owner and a non-banned row. Database grants enforce the column boundary even for direct REST PATCH, independent of the API.

Server-only writes include IDs/timestamps, profile completion, legacy work-role configuration, balances, subscriptions/plans/promotions, credit counters, referral codes, ratings and purchased features. Admin-only operational fields include bans/reasons, verification review state/badges and document pointers. These classifications do not grant new server/admin APIs. Existing server automation for verification/payment remains paused.

Identity completion now uses its already-existing service client only for its constructed, validated profile payload. Legacy onboarding rejects unknown roles and invalid preference categories before upsert; it never accepts IDs/email/authority flags from the request. The dormant ProfileCompleteForm now calls that endpoint instead of directly updating user_roles. Its old resume input maps to the supported cv_url field. Existing profile-intent writes remain owner-scoped.

## Workplace insert fix and final owner design

The existing creation route already verifies the user through the stored-ban-aware server client, inserts an organization with created_by = user.id, obtains the new ID, and inserts exactly `{organization_id: created.id, profile_id: user.id, member_role: 'owner', status: 'active', is_primary: true}` through a server-only service client. Body-supplied role, IDs and status are ignored. is_primary preserves existing product behavior; no new global primary-membership semantics are invented.

The migration drops `organization_members_insert_self`, revokes direct client membership INSERT/UPDATE/DELETE/TRUNCATE and column writes, and adds restrictive false INSERT/UPDATE/DELETE policies. It preserves service-role grants rather than expanding them. No generic membership RPC is introduced. Team lifecycle writes remain disabled.

**Final-owner invariant is design only:** future mutation transactions must lock the organization row, recheck the actor's active role after acquiring that lock, lock/read the affected memberships in consistent order, enforce at least one active owner, then perform the transition and notification atomically. Every ownership-changing path, including service routes and cascades, must participate. Test simultaneous demote/remove/leave, stale manager authority, repeated acceptance and rollback on notification failure with two database sessions. A client-side owner count is insufficient. Current creation uses two service requests plus cleanup; it is not atomic and cleanup failure can leave an ownerless organization. No change here claims to repair that independent race.

## SECURITY DEFINER hardening

| Function | Evidence | Local candidate action / limitation |
|---|---|---|
| handle_new_user() | User reports definer, proconfig null, INSERT public.profiles; full body missing | Pin pg_catalog, public, pg_temp; revoke client/PUBLIC EXECUTE; revoke client CREATE on public. Preserve body and trigger. Full body, owner and called helpers still require review. |
| increment_connects(uuid,integer) | Local migration 009: arbitrary uid/amount, unqualified profiles UPDATE, definer, no authorization | Revoke client/PUBLIC EXECUTE and pin trusted path; do not expand service grants or rewrite unknown deployed body. |
| increment_social_post_view(uuid) | Local migration 047: qualified public.posts, published/standard filter, service-only explicit grant | Normalize safe path and revoke any anon/authenticated direct execution. Existing service behavior retained. |
| Other deployed definers | Complete live inventory not supplied | Read-only collector lists all non-system definers, owners, effective EXECUTE and bodies. No blanket destructive rewrite. |

No full handle_new_user replacement body is invented. In particular, its metadata-to-authority behavior, extension references and indirectly called helpers cannot be certified from the supplied ellipsis. Public schema CREATE revocation prevents new client object shadowing; review already-existing public objects/owners too. Full schema qualification of unknown function bodies is **not completed** and remains a pre-application gate.

## Connects trigger and referral review

The actual give_signup_connects trigger attachment/name/timing/body is not present in local migrations. The supplied summary says it assigns balance 10 and inserts a ledger entry, while live default balance is also 10. A DEFAULT 10 followed by assignment to 10 is not, by itself, a double increment. That does not establish exactly-once ledger crediting: inspect all auth.users/profiles triggers, retry behavior, additional balance writers and actual function bodies.

Only unnecessary direct PUBLIC/anon/authenticated EXECUTE is revoked; the trigger and credit behavior remain untouched. PostgreSQL trigger execution is separately exercised by the provided synthetic fixture, but that fixture is not the live function. **Live signup/double-credit status: unresolved.**

The old referral callback invokes increment_connects with arbitrary user IDs in separate requests plus a separate ledger insert. It cannot remain a normal-client balance writer. The callback no longer invokes that path, and the referral page explicitly says rewards are paused rather than promising credits that now fail. No privileged replacement or silent credit loss is introduced. Future rewards need an atomic, idempotent, validated signup/referrer operation and a unique event key. Existing balances are not modified.

## Verification document plan

User-reported bucket state is private (`public=false`); the local migration does not alter storage. Collection remains paused. Future policies, **not created here**, must match bucket_id and the verified user's first path segment, permit only required INSERT/owner SELECT, deny other-user reads/listing, define upsert/delete deliberately, and keep reviewer access behind verified server admin authorization. Never make this bucket public. Use short-lived signed URLs only in the authorized review path; exclude paths/fragments from public profile APIs, props, logs and caches. Test anonymous, A, B and admin with synthetic documents and prove no cross-user listing or URL access. Absence of a named bucket-specific policy alone is not proof: broad storage policies and grants also need review.

## Ban status and paused flows

The request-scoped server guard now reads stored is_banned from own_profiles. It denies lookup failures and banned users; user_metadata cannot override it. The migration prevents normal direct base updates/inserts/upserts to ban fields. Other server routes using the existing createClient/getUser guard inherit that check; independent privileged paths and auth callbacks still require catalog/integration review. A ban immediately after verification can race a later service write. **Global REST/storage ban enforcement is not claimed.**

Billing, proposal, escrow and verification flags/early-return gates remain disabled. Tests execute those existing routes and verify refusal before effects. No team controls, payment fulfillment, document upload or owner transfer is enabled.

Existing risks beyond this patch: review route attempts rating aggregates using a user client for another user's profile (already incompatible with owner RLS); no new privileged aggregate writer is added. Legacy admin fallback clients cannot access private fields without a service key and must fail closed. Existing service-role public identity queries are bounded/explicit-column queries but require a separate comprehensive row-privacy review. No claim that every definer/view/storage or billing path is now audited live.

## Local migration and exact manual order

One candidate only: `supabase/migrations/20261008053956_p0_profile_privileges_and_membership_lockdown.sql`, created through `supabase migration new`. **Not applied.**

1. Before scheduling application, run and save every result grid from `docs/sql/p0-security-catalog-validation.sql` in the confirmed GigWay project. Reconcile every live field with the classification; inspect existing own_profiles name, PostgreSQL version (view options require 15+), role inheritance, view dependencies, all function/trigger bodies and original ACLs. Export the original schema/ACL/policy/function definitions for rollback. Resolve missing body/schema evidence before approving the candidate.
2. On an isolated disposable PostgreSQL/Supabase clone, apply this single migration and run denial tests, repeat-application, signup, owner editing, public discovery/embedded joins, admin and PostgREST schema-cache tests. The local synthetic harness command is `node scripts/p0-security-disposable.cjs`; it cannot accept a project URL and never publishes a container port. Its image must already be cached. A real Supabase disposable clone remains necessary for REST/Auth/Storage tests.
3. Only after separate human operational approval, coordinate a maintenance window: apply the complete candidate file once in SQL Editor (BEGIN through COMMIT), then ship the matching application build. Do not deploy the new guard before own_profiles exists: it intentionally fails closed. Do not apply historical migrations en masse or use db push to include unrelated changes.
4. Run the exact read-only validation file again and compare expectations below. Restore traffic only after disposable negative tests and live catalog verification. This document supplies the order; it is not authorization to execute it now.

### Exact post-migration read-only checks

Use [p0-security-catalog-validation.sql](sql/p0-security-catalog-validation.sql), unchanged as a whole transaction ending ROLLBACK. It returns all current columns, effective per-column and table privileges including inherited privileges, complete policies, storage grants, views, function definitions/EXECUTE, actual trigger attachments, bucket flag, role inheritance and aggregate owner counts. It reads catalogs and aggregate counts, not document paths/user records.

Expected: anon/authenticated have no base SELECT on any private column; no table-level profile SELECT; authenticated UPDATE only on the owner allowlist; no client profile INSERT/DELETE/TRUNCATE; no client membership writes at either column or table level; restrictive policies present; own_profiles has its owner-only predicate/barrier/non-updatability and only authenticated SELECT; hardened function paths and no anon/authenticated EXECUTE for the four named functions; no client CREATE on public; bucket remains private. Service-role existing grants are preserved. UNKNOWN fields must remain false across all client operations. Inspect all other views/functions for bypasses rather than treating base-table success as complete proof.

Actual negative writes and auth/signup tests belong on the disposable clone, not in live read-only validation. Use anonymous/A/B sessions for `select=*`, every sensitive field, owner view filters/OR/embedded joins, PATCH mixed safe+authority payloads, POST/upsert/delete, arbitrary owner/admin/hr/recruiter memberships, revoked balance RPC, forged JWT metadata, stale banned tokens and legitimate professional edits. Positive controls must prove the test identities/keys work. Run signup twice/retry and inspect both final balance and event count with synthetic users.

## Rollback plan

Before COMMIT, any failure aborts this transaction; issue ROLLBACK in that SQL Editor session. No backfill requires data restoration.

After COMMIT, the safe operational rollback is maintenance mode plus the saved application snapshot, **keeping the tightened grants and membership denial intact** until a corrected compatible build is ready. Old private base queries will fail; do not reopen private table SELECT or authority UPDATE to restore availability. Keep own_profiles for the current guard; if the view itself is suspect, revoke its SELECT and keep traffic disabled. Roll back the app/DB pair in an isolated clone before production recovery.

A full inverse migration cannot be honestly specified without the original complete grants/policies/search_path values and any pre-existing view definition. The preflight export is mandatory for that reason. A reviewed inverse would restore those exact captured objects, never guessed ALL grants, and must not reintroduce the reported P0 exposure. This package intentionally does not ship a one-click insecure grant restoration script. Document-only rollback limitation is a release gate, not an assertion of reversibility already proven.

## Tests and proof limits

- TypeScript: `node node_modules/typescript/bin/tsc --noEmit --incremental false` PASS.
- Existing 32 blocker/master suites were run on the actual current worktree. Initial two failures were source-test coupling to the moved allowlist/import; those test contracts were updated without weakening access checks and rerun successfully. Final run results are recorded in the companion manifest.
- `node scripts/test-p0-live-security.cjs`: source contracts plus actual route/guard synthetic tests PASS: public exclusions, authority/doc spoof denial, fixed organization creation values, team gates, function path/ACL design and stored-ban checks.
- `node scripts/test-p0-security-components.cjs`: actual component SSR PASS: owner view/read ID, guest redirect and referral pause. No database/browser security assertion from this test.
- `node scripts/p0-security-disposable.cjs`: NOT RUN, Docker engine unavailable. It contains role switching, effective grants, owner/other/banned writes, revoked RPC, public discovery and synthetic signup-trigger assertions, and applies the migration twice. This is not proof of production functions.
- Existing browser/component Chrome matrix attempted but did not produce a completed report; interrupted and isolated browser cleanup attempted. **Browser QA NOT VERIFIED.** No full Next hydration, mobile-device or real Supabase end-to-end claim.
- `git diff --check`: PASS; final manifest records changed-file whitespace and audit-file preservation checks.

## Safe staging plan / do-not-stage

Nothing staged. Review the task file manifest first. New migration, tests and review documents are independent candidates for explicit-path staging. For already-dirty files, stage only this task's reviewed hunks; do not `git add .`, `git add -A` or stage entire directories. Several existing launch guards/helpers are untracked dependencies; their earlier work must be separately reviewed and accepted before a deployable commit can be assembled. Do not stage an incomplete dependency set merely to isolate this task.

Do not stage `.claude/settings.local.json`, unrelated media components, previous roadmap/QA artifacts, existing protected audit SQL, generated worker/build output, temporary screenshots/reports, env files or credentials. The manifest gives the exact initial dirty list and untouched subset; overlapping files require hunk review. No commit/push/deploy requested or performed.

## Final verdict

**BLOCKED — production application approval requires full live catalog/function/trigger reconciliation, a captured reversible baseline, disposable PostgreSQL/Supabase denial/signup proof and browser QA.** Local remediation and review artifacts are prepared; the reported P0s are not claimed closed in production. The local design addresses public sensitive reads, direct authority writes, arbitrary membership insertion and known RPC exposure, subject to the documented proof gates. Team lifecycle/final-owner concurrency, signup exactly-once behavior, document access, global bans and paid flows remain unenabled/unproven.

## Files changed in this task

The exact initial status and content fingerprints are in [p0-live-security-worktree.json](p0-live-security-worktree.json). Files marked as baseline overlaps require hunk review; a listed file can also contain earlier user work.

- `app/api/identity/complete/route.ts`
- `app/api/onboarding/complete/route.ts`
- `app/api/profile/route.ts`
- `app/api/tools/career-gap-map/route.ts`
- `app/api/tools/profile-intelligence/route.ts`
- `app/api/verify-me/route.ts`
- `app/api/verify-me/upload/route.ts`
- `app/auth/callback/route.ts`
- `app/buy-connects/page.tsx`
- `app/dashboard/jobs/boost/page.tsx`
- `app/dashboard/page.tsx`
- `app/freelancers/[id]/page.tsx`
- `app/freelancers/page.tsx`
- `app/gigs/page.tsx`
- `app/jobs/page.tsx`
- `app/page.tsx`
- `app/profile/complete/page.tsx`
- `app/profile/edit/page.tsx`
- `app/refer/page.tsx`
- `app/verify-me/page.tsx`
- `app/verify/page.tsx`
- `components/home/TrustVerification.tsx`
- `components/layout/Navbar.tsx`
- `components/onboarding/ProfileCompleteForm.tsx`
- `docs/p0-live-security-remediation-review.md`
- `docs/p0-live-security-worktree.json`
- `docs/p0-profile-field-classification.md`
- `docs/p0-profile-query-inventory.md`
- `docs/sql/p0-security-catalog-validation.sql`
- `lib/billing/entitlements.ts`
- `lib/profile/fields.ts`
- `lib/supabase/mutation-guard.ts`
- `scripts/p0-profile-query-inventory.cjs`
- `scripts/p0-security-disposable.cjs`
- `scripts/test-p0-live-security.cjs`
- `scripts/test-p0-security-components.cjs`
- `scripts/test-professional-identity.cjs`
- `scripts/test-workplace-foundation.cjs`
- `supabase/migrations/20261008053956_p0_profile_privileges_and_membership_lockdown.sql`
- `supabase/tests/p0-security-denials.sql`
- `supabase/tests/p0-security-fixture.sql`

## Requested final report checklist

| # | Item | Result |
|---|---|---|
| 1 | Baseline HEAD | 1071a551435511cf103f7c8446777c8225b9f02b |
| 2 | origin/main | 1071a551435511cf103f7c8446777c8225b9f02b (local ref) |
| 3 | Initial worktree | Dirty; exact original status in manifest; preserved |
| 4 | Sensitive fields | 61 classified fields; live additions UNKNOWN; see field inventory |
| 5 | Public strategy | Option 2: explicit base column grants, preserve FK joins |
| 6 | Owner-editable fields | 25 columns, exact list in Owner edit design and lib/profile/fields.ts |
| 7 | Server-only fields | Exact per-field write categories in classification |
| 8 | Admin-only fields | Bans/reasons, verification review/badges, document pointers |
| 9 | Anon sensitive reads | Denied by local SQL allowlist; not applied/proven live |
| 10 | Authenticated authority updates | Revoked at table + column level; owner allowlist only |
| 11 | Membership self-insert | Policy dropped, grants revoked, restrictive deny; service creation retained |
| 12 | Team lifecycle | Disabled |
| 13 | Final owner | Future locking/transaction design only |
| 14 | handle_new_user | Path + EXECUTE hardening candidate; full body audit incomplete |
| 15 | Other definers | Two local functions reviewed; complete live inventory required |
| 16 | give_signup_connects | No behavior removed; execution grant restriction only |
| 17 | Double credit | Not established; trigger/body/retry evidence missing |
| 18 | Verification docs | Reported private; collection paused; future policy design only |
| 19 | Ban enforcement | Stored owner-view guard and protected columns; global proof pending |
| 20 | Local migration | One unapplied CLI-created SQL file |
| 21 | Application files | Exact task file list above and manifest |
| 22 | Test files | Two new focused suites, disposable fixture/harness, two adapted legacy suites |
| 23 | Documentation | Main review, field/query inventories, read-only SQL, manifest |
| 24 | TypeScript | PASS |
| 25 | Full regressions | 32 existing + 2 new suites PASS |
| 26 | Browser/component QA | Targeted SSR PASS; Chrome matrix incomplete, browser NOT VERIFIED |
| 27 | git diff --check | PASS; new-file whitespace checked too |
| 28 | Manual migration order | Preflight/export, disposable proof, one candidate in approved window, matched app, validation |
| 29 | Post-migration validation | Exact read-only docs/sql/p0-security-catalog-validation.sql |
| 30 | Rollback | Transaction rollback; post-commit maintenance + tightened grants; exact inverse requires exported baseline |
| 31 | P0 closed locally | Code/design/source tests for read/write/membership/RPC boundaries |
| 32 | Live proof required | All effective privileges, indirect paths, signup, REST/storage denial and app compatibility |
| 33 | Safe staging | No staging done; explicit new paths and only reviewed overlapping hunks |
| 34 | Do-not-stage | Initial unrelated dirty work, audit files, secrets, generated artifacts; manifest |
| 35 | Verdict | BLOCKED for application approval: complete live definitions/baseline, disposable proof and browser QA |

## References checked

- [Supabase column-level security](https://supabase.com/docs/guides/database/postgres/column-level-security): table/column privileges are additive; explicit selections are required.
- [PostgreSQL CREATE VIEW](https://www.postgresql.org/docs/current/sql-createview.html): owner versus invoker privileges, security barriers and non-updatable view conditions.
- [Supabase database functions](https://supabase.com/docs/guides/database/functions): function execution privileges and definer search-path hardening.

The changelog markdown endpoint could not be retrieved by the documentation tool; no CLI upgrade or unverified new Supabase feature was introduced.
