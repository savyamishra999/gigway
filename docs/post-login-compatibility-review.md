# Post-login compatibility hotfix

2026-10-09. Base HEAD: `5c3f4833601f2121150d8be6937bb376bdce835f`.

## Incident and evidence

The reported signed-in `/auth/post-login` page displayed the application error
boundary. Read-only production logs contained `Your session could not be checked`.
A public zero-row REST request for `own_profiles` returned HTTP 404 / PGRST205.
The owner view is part of the locally prepared, unapplied P0 migration.

## Bounded fix

The server mutation guard still verifies identity with Supabase `auth.getUser()`.
Only PGRST205 from its `own_profiles` account-status query enables a separate
server-only service-role read of `profiles.is_banned`, filtered to that verified
user ID. No request-supplied ID, profile payload, balance or document is accepted
or returned by this helper. Cookie-bound client credentials are unchanged.
Missing configuration, permissions failures, malformed status and other errors
remain denied. Each mutation rechecks stored ban status. When the view exists,
the normal owner-view path runs without the compatibility helper.

This addresses the reported existing-account login/session failure. It does not
replace other owner-view queries: profile completion/edit and other owner pages
remain dependent on the P0 schema. The synthetic login check reaches `/home`
for a completed profile; it is not a live signed-in browser verification.

## Validation and limits

- TypeScript: PASS.
- Current suites: 35/35 PASS (34 existing plus account-status compatibility).
- `git diff --check`: PASS.
- Tests cover verified IDs, banned accounts, fresh bans before writes, failed
  authentication, missing credentials, malformed status, non-missing-view errors,
  existing-view operation, request isolation, fixed privileged projection and
  the actual post-login page redirect with synthetic local dependencies.
- Production needs the existing server-only service-role configuration. No
  credentials were printed, changed or sent to a browser.
- No production signed-in verification, deployment, remote migration or database
  mutation was performed for this patch. No security-sensitive flow was enabled.

P0 status: **LOCAL READY / PRODUCTION UNAPPLIED**.
Disposable database verification deferred due environment/tooling setup; no production safety claim.

User authorized committing, pushing and deploying this bounded patch on 2026-10-09 after the explicit deployment approval question. Before deployment:
isolate these six files from the 40 previously excluded paths. A push to main
may trigger automatic production deployment, so it requires the same approval.
After any approved deployment: verify an existing signed-in account reaches
post-login/home and verify ban enforcement without enabling paused flows.
The separate disposable-database proof, reviewed P0 migration authorization and
post-migration security/real-device QA gates remain open.

Patch files: `lib/supabase/account-status.ts`, `lib/supabase/mutation-guard.ts`,
`lib/supabase/server.ts`, `scripts/test-account-status-compat.cjs`,
`scripts/test-auth-navigation.cjs`, and this review.
