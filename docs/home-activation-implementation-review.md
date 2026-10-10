# Home activation and profile progress — local candidate

2026-10-10. Base HEAD: `2c56c938eab4e60ea6a5adba56b465fc386c87d1`.

After successful profile creation, the default destination is Home. Explicit safe
return destinations remain honored. The existing How GigWay Works guide remains
available; there is no extra mandatory post-signup step.

Home now displays an owner-only profile milestone ring and a colourful action
guide before the existing feed. The ring uses the existing five real profile
milestones, identifies the next missing field, and disappears when all are met.
It does not restrict posting or make the optional photo mandatory. It is not
displayed on public profile pages.

Actions: introduction, Work discovery, service creation, hiring via existing
Create choices, and Network. Workplace education is an optional expandable
section. Existing destination authorization/eligibility checks are unchanged;
team lifecycle and financial flows remain paused.

The introduction link opens the existing personal composer with an editable
template. Nothing is automatically published. Only after the existing successful
publish path does the browser remember that this account posted an introduction.
The Home guide then omits that action. Link clicks alone do not mark completion.
Other actions are not falsely labelled complete; no retention improvement is claimed.

Hide/replay preferences and introduction completion are browser-local and scoped
by account ID. They do not synchronize across devices, and previous posts are not
backfilled. Storage failures do not block navigation or posting. New Home server
queries were not added; the existing profile/intents loaders supply the ring.

## Profile-edit compatibility dependency

The existing owner-view query remains the primary editor read. Only missing-view
PGRST205 falls back to a fixed editor-field projection on profiles, with the same
cookie-bound client and verified owner's ID. No new service-role access or broad
wildcard fallback is introduced. Permission failures still fail closed. Existing
profile update allowlists and write guards remain unchanged. This fixes the
source-level missing-view dependency for the new progress CTA; live authenticated
editor load/save still requires verification. Dashboard remains out of scope.

## Validation

- TypeScript PASS.
- Full run: 36/37 suites passed; the final pagination suite exited without output
  during a local runner stall. Immediate isolated rerun passed all 19 checks.
  All 37 suites therefore have passing results; no assertion was relaxed.
- New actual-component tests: action destinations, hide/replay, per-account
  storage state, introduction completion signal, and editor fallback/permission
  boundaries PASS.
- Existing auth, create, profile, P0 and workplace regression suites PASS.
- No production mutation, migration, commit, push or deployment in this pass.
- Real browser visual layout and authenticated production save are not claimed.

Before release: isolate the files below from protected/dormant work, obtain
deployment approval, and verify mobile layout, introduction editing/publishing,
hide/replay, and profile edit/save with the approved account. Keep the P0 database
gate separate: LOCAL READY / PRODUCTION UNAPPLIED.

## Exact candidate files

- app/home/page.tsx
- app/profile/edit/page.tsx
- components/home/HomeActionGuide.tsx
- components/home/IdentityCompletionPrompt.tsx
- components/identity/IdentityOnboarding.tsx
- components/social/CreatePostComposer.tsx
- scripts/test-home-action-guide.cjs
- scripts/test-makkhan-pass2.cjs
- scripts/test-network-home-architecture.cjs
- scripts/test-part7-activation.cjs
- docs/home-activation-implementation-review.md

SocialHomeFeed and all pre-existing dormant JOX/GLIMPS files were left unchanged.

## Approved release validation

User approved commit/push/live deployment on 2026-10-10. A fresh archive of the
base HEAD with only the 11 candidate files overlaid passed TypeScript and all
37/37 suites in one run. The 40 original excluded files remain byte-identical.
The two uncommitted security/QA preparation documents are outside this release.
Database migration remains unapplied; authenticated mobile visual/save QA remains
required after deployment.
