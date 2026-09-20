# P0 first-load, auth boot, and return-destination — fix review

Review history:
- **2026-09-18** — initial review of an implementation started by a prior agent session that hit its usage limit. Source review + automated tests + a manual HTTP-level check. No code changes made; recommendation was READY FOR REVIEW with the browser-QA harness flagged as not fully working.
- **2026-09-19/20** — final pre-commit verification pass (this revision). Fixed two confirmed cosmetic issues, audited the full diff for scope creep, fixed the browser-QA harness (two real bugs in the *test tooling*), and — while using the now-working harness — found and fixed one real, if narrow, defect in P0-added application code (`app/error.tsx`'s retry button). Full synthetic browser QA now passes end-to-end, twice consecutively.

**No commit, push, deploy, database migration, or remote Supabase change was made in either session.** Workplace Phase 4 (`docs/workplace-phase4-audit.md`, `supabase/audits/`) was not touched. `public/sw.js` was not edited — confirmed byte-identical (SHA-256 `b1e2c71c59683d97b5fb0b649ef2327f279727f980821dc89e0af3179c4816f6`) at the start and end of both sessions — see §19.

## 1. Original P0 symptoms

From `docs/p0-first-load-auth-audit.md` (audit only, no remediation): a reported long loading experience on a friend's phone, unconfirmed root cause. The audit found concrete architectural reasons a long load *could* occur, independent of whether they explain that specific report.

## 2. Root causes from the audit

1. `/` awaited user resolution and seven database queries before returning even the static hero.
2. Public `/u/{username}` (person and Workplace identity) waited for viewer auth, identity lookup, and multiple dependent query stages before rendering anything.
3. `/home` awaited ~12 queries plus per-post enrichment (`safePost`) before rendering.
4. Auth was repeated across middleware/page/navbar without memoization; no deadline on any of it.
5. Destination (`next`) handling was inconsistent: some paths used unsupported `redirect=`, some omitted `next` entirely, error/no-user branches on post-login and profile-complete dropped `next` and sent the user to a bare `/login`.
6. No deadline/catch/finally on several client initializers (login, onboarding finish, message/edit pages) — a rejected or never-settling promise could leave the UI stuck loading forever.
7. `safeReturnTo` accepted an embedded control character (e.g. a tab) that the browser's URL normalization turns into a protocol-relative external URL — an open-redirect gap.
8. `safePost`/`canViewPost` did one DB round trip per candidate post for visibility checks (N+1).

## 3. Previous-agent changes verified (2026-09-18)

Every changed/added file relevant to the P0 scope was read and independently re-derived. Summary, by root cause:

- **Landing (`app/page.tsx`)**: `Hero` now renders synchronously, outside any auth/DB wait. Auth-only-redirect (`LandingRedirect`), stats, opportunities, featured freelancers, and organizations preview are each their own `<Suspense>` boundary with an independent fallback, backed by `createPublicClient()` (anon key, `persistSession:false` — no RLS bypass) and `withDeadline`. A query failure in one section renders `SectionUnavailable` there only; it does not block the hero or the other sections.
- **Public identity/Workplace (`app/u/[username]/page.tsx`, `components/organizations/PublicWorkplace.tsx`)**: the person/Workplace header, name, avatar, bio, tagline etc. render immediately from one `createPublicClient()` lookup. Counts, follow/connect/manage controls, and each Workplace section (People/Jobs/Projects/Content) are independent `<Suspense>` boundaries using `getViewer()` (React-`cache`-memoized per request) and `withDeadline`. The fallback path for a profile the anonymous client can't see (private/incomplete) re-checks under the authenticated `createClient()` (still RLS, not service-role) rather than assuming not-found.
- **`/home` (`app/home/page.tsx`)**: split into `HomeFeed` (opportunities/network/media) and `Activity` (unread/applied/proposals counts) as separate `<Suspense>` sections under one authenticated shell. The GLIMPS/JOX media fetch+enrichment is kicked off (`withDeadline(...).catch(() => null)`) before the 9-query `Promise.all`, so it runs concurrently with the rest of the boot query set instead of after it.
- **Auth call memoization**: `lib/auth/server.ts` wraps `db.auth.getUser()` in React's `cache()` (`getViewer`) plus `withDeadline`, so multiple server components in one request tree reuse the same in-flight/resolved call rather than each issuing their own `getUser`.
- **Destination/`next` handling**: `lib/auth/return-to.ts` (`safeReturnTo`) iteratively decodes the input (up to 3 rounds) and rejects on any control character, backslash, `//`-prefix, or non-origin-matching result — closing the tab-character normalization gap the audit reproduced. It also blocks `next` values that point back at `/login`, `/auth/*`, `/onboarding`, `/profile/complete` (no auth trampoline). `app/auth/post-login/page.tsx`'s no-user branch does `redirect(loginHref(next))` instead of dropping to a bare `/login` (this was a confirmed destination-loss bug in the audit — fixed). `app/onboarding/page.tsx` forwards `next` into `completionHref` instead of discarding it. Every protected-route guard redirect across the app (25+ files) now uses `loginForCurrent`/`completionForCurrent`, which read the destination from the `x-gigway-destination` header middleware sets, rather than a hardcoded/bare `/login`. `middleware.ts` builds the protected-route `next` from the *current* pathname+search, passed through `safeReturnTo`. `components/layout/ModernNavbar.tsx`'s login/join links carry the current location (`loginHref` + a click handler that reads live `location.pathname+search+hash`, skipping the preserve behavior only for modified clicks so ctrl/cmd/shift-click "open in new tab" still works normally).
- **Open-redirect hardening**: confirmed above (`safeReturnTo`). `app/auth/callback/route.ts` and `app/auth/post-login/page.tsx` both run all destinations through it before use; admin-email accounts still take `/admin` precedence over `next` in both places — intentional, pre-existing, consistent policy, not a regression.
- **Deadlines/failure recovery**: `lib/async.ts` provides `withDeadline` (60s single-request / 120s multi-request recovery ceilings — framed as recovery ceilings, not performance targets) and `boundedFetch` (aborts a hung fetch, preserves upstream `AbortSignal` chaining, holds the abort through body consumption for JSON/auth responses, and passes non-JSON/non-auth non-GET requests — e.g. media uploads — straight through un-timeboxed so a slow upload isn't cut off). `middleware.ts` returns a `503 Retry-After: 5` instead of hanging or silently treating a session-check failure as "logged out" when `getSession()` fails/times out. `components/layout/{RouteLoading,RequestFailure,SectionStatus}.tsx` and `app/error.tsx` give the root loading boundary and section-level Suspense fallbacks a terminal, retryable failure state instead of an indefinite spinner (see §11 for a real bug found and fixed in `app/error.tsx` during the 2026-09-20 pass). Client pages that previously left `loading`/`saving` true on a rejected promise (messages list, message thread, gig/job/project edit pages, `IdentityOnboarding.finish`, navbar sign-out) wrap their init/submit in `withDeadline(...).catch().finally()` or try/catch/finally.
- **Middleware cookie propagation**: `middleware.ts`'s `setAll` cookie callback rebuilds the response (carrying forward previously-set cookies) and updates the request header cookie string so a token refresh mid-request is visible to downstream server code, and a `redirectWithCookies` helper explicitly copies accumulated `res` cookies onto redirect responses — closing the "refresh cookies copied only to `res`; redirects create fresh responses" gap the audit flagged. Public content routes (`/login`, `/u/*`, `/@*`, `/social/{explore,vijox,glimps}`, `/social/posts/[id]`) skip the session/refresh call entirely (`publicRoute` early-out). Root `/` now performs the minimum cookie-session decision before rendering.
- **`safePost`/visibility batching (`lib/social/server.ts`)**: `visiblePosts()` replaces the previous per-post sequential `canViewPost` await-in-a-loop in `accessibleGlimps`/`accessibleGlimpsPage`/`accessibleJoxPage` with at most two batched `.in(...)` follow-lookup queries (profiles, organizations) for an entire page of candidates, applying the *same* rule (published, and `public` OR own post OR followed-author) — verified logically equivalent, not weakened.
- **Workplace test harness updates (`scripts/test-workplace-public.cjs`, `scripts/test-workplace-setup.cjs`)**: updated to match the new component dependencies (`@/lib/async`, `@/lib/auth/server`, React `cache`) and to await nested async Suspense subcomponents (`resolveTree` helper). Assertions themselves (who sees "Manage Workplace", follower/people counts, absence of authenticated-only UI for guests) are unchanged in substance.

## 4. Changes made this session (2026-09-20, final pre-commit verification)

**A. Two confirmed cosmetic issues, fixed as requested:**
- `app/gigs/[id]/edit/page.tsx` — removed the unused `boundedFetch` import (that page saves via a direct Supabase client `.update()` call, not a `fetch` to an API route, unlike the equivalent jobs/projects edit pages).
- `app/dashboard/page.tsx` — combined the two separate `import { ... } from "@/lib/auth/server"` statements into one.
- **Same pattern found in 7 more files during the full-diff scope review** (not originally named, but the identical duplicate-import issue): `app/profile/edit/page.tsx`, `app/gigs/new/page.tsx`, `app/jobs/new/page.tsx`, `app/social/create/page.tsx`, `app/social/glimps/create/page.tsx`, `app/social/vijox/create/page.tsx`, `app/verify/page.tsx` — each had `import { completionForCurrent } from "@/lib/auth/server"` and `import { loginForCurrent } from "@/lib/auth/server"` as two lines; combined into one in each file. Purely mechanical, no behavior change; confirmed via `grep` that no other duplicate-import-source pattern remains anywhere in the diff.

**B. Full-diff scope review (§5) — no unrelated product/business-logic change found.** Every one of the 63 modified + 12 added files falls into one of the seven declared categories (AUTH DESTINATION / LOADING RECOVERY / BOUNDED REQUEST / PUBLIC FIRST-LOAD / QUERY WATERFALL / SOCIAL VISIBILITY / TEST SUPPORT). Nothing was removed as "unrelated" because nothing unrelated was found.

**C. Fixed the browser-QA harness — two real, previously-unknown bugs in the test tooling, not the app:**
1. **Stale debug-port collision.** The harness hardcoded `--remote-debugging-port=9227` for its headless Chrome instance. A zombie headless Chrome process from an earlier, differently-interrupted session (`user-data-dir=...gigway-p0-browser-isolated`, alive since the prior day) was still listening on that exact port. Every new run's `fetch('http://127.0.0.1:9227/json/version')` readiness check silently succeeded against *that* stale instance instead of the freshly-spawned one, so the script then drove a dead/orphaned browser tab and hung indefinitely. Fixed by spawning Chrome with `--remote-debugging-port=0` (ephemeral) and reading the actual assigned port back from the `DevToolsActivePort` file Chrome writes into its `user-data-dir` — this makes a stale future zombie structurally impossible to collide with, rather than just cleaning up the one that existed.
2. **Inconsistent hostname across the run.** Next.js's dev-server middleware redirect construction (`new URL('/login', req.url)`) resolves the login redirect's origin to `http://localhost:3107/...`, **not** `http://127.0.0.1:3107/...` — confirmed independently with a plain `curl` request to a disposable dev server (`GET http://127.0.0.1:3108/workplaces?tab=active` → `307` to `http://localhost:3108/login?...`). This is a Next.js dev-server-only quirk (absent in production, where the canonical domain is fixed) but it matters here: the harness's `navigate()` helper hardcoded `base = 'http://127.0.0.1:3107'`. Browser cookies are host-specific — a session cookie set while on `localhost` (via the login-redirect chain) is invisible to a later direct `navigate()` call that jumps to `127.0.0.1`, even though both addresses reach the same server. This made an *already-successfully-authenticated* browser appear logged-out the moment the harness's own `navigate()` forced it back onto `127.0.0.1` (confirmed by dumping page state at the failure point: `location.href` stayed on `127.0.0.1`, body showed "Log in / Join GigWay" guest chrome). Fixed by making the harness consistently use `http://localhost:3107` for every navigation, matching the origin middleware already redirects to.
3. Also added a small amount of permanent, opt-in-only diagnostic logging (`navigate()` and the retry-recovery check now dump `location.href`/`readyState`/visible body text to stderr *only on failure*, not on every run) so a future regression is immediately diagnosable instead of a bare "Timed out".

**D. Found and fixed one real defect in P0-added application code, using the now-working harness: `app/error.tsx`'s "Try again" button didn't actually retry.**
- Reproduced directly (not a harness artifact — confirmed via the dev-server request log, see below): after a simulated transient query failure on `/workplaces` (mocked as a 503) rendered the route-level error boundary, clicking "Try again" left the exact same "We couldn't load this page." text on screen, unchanged, even minutes later and even after the underlying failure condition had been cleared.
- Root cause, confirmed in two steps:
  1. The original code called only the bare `reset` prop Next.js passes to `error.tsx`. For an error thrown inside a **Server Component**'s own data fetch (which is what `activeWorkplaces()` does in `app/workplaces/page.tsx`), `reset()` alone re-renders the boundary from whatever it already has — it does not by itself invalidate the segment and re-issue the failed request. First fix attempt: call `router.refresh()` alongside `reset()`. This **did** cause the server to actually re-run the query successfully (confirmed in the dev-server log: two fresh `GET /workplaces 200` requests appeared right after the click, where before there had only been the one failing request) — but the browser's displayed DOM still never updated.
  2. Second, complete fix: `router.refresh()` and `reset()` must run inside the **same React transition** (`startTransition`), or `reset()`'s synchronous re-render can commit *before* the refreshed data arrives, re-rendering the same stale/erroring tree and leaving the boundary "locked" against the fresh payload when it lands moments later. This is Next.js's documented pattern for this exact situation. After wrapping both calls in `startTransition` (and disabling the button with a "Retrying…" label while pending, so a second click can't race the first), the button reliably recovers: `document.body.innerText` shows the successfully-loaded "My Workplaces" content starting at t+0.5s after the click, confirmed in **two consecutive full harness runs**.
- This directly serves the original audit's remediation goal #4 ("add route error recovery") and P0 root cause #6 — `app/error.tsx` is itself new, P0-added code, so this is a fix to the P0 work, not a pre-existing/unrelated bug.
- File: `app/error.tsx`. `npx tsc --noEmit` clean before and after every edit in this section.

## 5. Full-diff scope review — file classification

Every changed file, classified by what it does. No file needed more than its primary category; several also touch a secondary one (noted in parentheses).

**AUTH DESTINATION** (guard redirects now preserve destination via `loginForCurrent`/`completionForCurrent`/`safeReturnTo`, or fix the open-redirect gap itself):
`app/admin/layout.tsx`, `app/admin/verifications/page.tsx`, `app/affiliate/dashboard/page.tsx`, `app/auth/callback/route.ts` (+BOUNDED REQUEST, LOADING RECOVERY), `app/auth/post-login/page.tsx`, `app/buy-connects/page.tsx`, `app/create/page.tsx`, `app/dashboard/jobs/boost/page.tsx`, `app/dashboard/page.tsx`, `app/gigs/new/page.tsx`, `app/jobs/new/page.tsx`, `app/network/page.tsx`, `app/notifications/page.tsx`, `app/onboarding/page.tsx`, `app/organizations/[username]/edit/page.tsx`, `app/organizations/new/page.tsx`, `app/payment/success/page.tsx`, `app/profile/complete/page.tsx`, `app/profile/edit/page.tsx`, `app/profile/page.tsx`, `app/projects/[id]/proposals/page.tsx`, `app/projects/new/page.tsx`, `app/refer/page.tsx`, `app/saved/page.tsx`, `app/social/create/page.tsx`, `app/social/glimps/create/page.tsx`, `app/social/vijox/create/page.tsx`, `app/subscribe/page.tsx`, `app/tools/opportunity-match/page.tsx`, `app/tools/profile-intelligence/page.tsx`, `app/tools/resume-analyzer/page.tsx`, `app/verify-me/page.tsx`, `app/verify/page.tsx`, `app/workplaces/page.tsx`, `components/layout/ModernNavbar.tsx` (+LOADING RECOVERY), `lib/auth/return-to.ts` (open-redirect hardening — core), `lib/auth/server.ts` (new — `loginForCurrent`/`completionForCurrent`/`currentDestination`, also QUERY WATERFALL via `getViewer` memoization), `middleware.ts` (+BOUNDED REQUEST, LOADING RECOVERY, PUBLIC FIRST-LOAD).

**LOADING RECOVERY** (deadline/catch/finally, terminal failure states instead of indefinite spinners):
`app/loading.tsx`, `app/error.tsx` (new — retry defect found and fixed this session, §4D), `components/layout/RequestFailure.tsx` (new), `components/layout/RouteLoading.tsx` (new), `components/layout/SectionStatus.tsx` (new), `app/messages/[userId]/page.tsx`, `app/messages/page.tsx`, `app/gigs/[id]/edit/page.tsx`, `app/jobs/[id]/edit/page.tsx`, `app/projects/[id]/edit/page.tsx`, `components/identity/IdentityOnboarding.tsx`.

**BOUNDED REQUEST** (`withDeadline`/`boundedFetch` wiring):
`lib/async.ts` (new — core), `lib/supabase/client.ts`, `lib/supabase/server.ts`, `lib/supabase/public.ts` (new), `components/social/OrganizationSocialFeed.tsx`, `components/social/PostDetailContent.tsx`, `components/social/ProfileSocialFeed.tsx`, `components/social/SocialHomeFeed.tsx`.

**PUBLIC FIRST-LOAD** (decoupling hero/header from auth/DB waits, Suspense streaming, anon-key client instead of session client):
`app/page.tsx`, `app/u/[username]/page.tsx`, `components/organizations/PublicWorkplace.tsx`, `components/home/FeaturedFreelancers.tsx`, `components/home/OrganizationsPreview.tsx`, `lib/organizations/public.ts`.

**QUERY WATERFALL**:
`app/home/page.tsx`, `app/social/posts/[id]/page.tsx` (metadata generation no longer duplicates the full `safePost` engagement/signed-URL work just to get an author name).

**SOCIAL VISIBILITY**:
`lib/social/server.ts` (`visiblePosts()` batching — §12 of the 2026-09-18 review confirms equivalence, not weakening).

**TEST SUPPORT**:
`scripts/test-workplace-public.cjs`, `scripts/test-workplace-setup.cjs`, `scripts/test-p0-auth.cjs` (new), `scripts/test-p0-social.cjs` (new), `scripts/p0-browser-qa.cjs` (new — fixed this session, §4C).

**Not part of P0 — confirmed pre-existing/unrelated, untouched:**
`public/sw.js`, `docs/workplace-phase4-audit.md`, `supabase/audits/`.

**Harness bookkeeping, not app code:** `.claude/settings.local.json` — the coding-agent harness auto-records approved shell-command permissions here as this session ran commands; it is not part of the P0 diff and carries no product behavior.

No unrelated product/visual/business-logic change was found anywhere in the diff.

## 6. Before/after first-load flow

- **Before**: `/` → await `getUser()` + 7 queries → hero + everything else renders together. `/u/{username}` → await viewer auth → profile → intents/memberships → counts/follow state → render. `/home` → await ~12 queries sequentially-ish → render.
- **After**: `/` → hero renders immediately (no DB/auth wait); stats, opportunities, featured people/orgs, and the auth-redirect check stream in independently via Suspense. `/u/{username}` and the Workplace identity route render the header from one public lookup immediately; counts, viewer controls, and each content section stream in independently. `/home` renders the authenticated shell immediately after `getViewer()`; the feed and activity counts stream in as separate Suspense sections, and the feed's own media fetch runs concurrently with its other queries instead of after them.

## 7. Before/after auth flow

- **Before**: `middleware.ts` called `getSession()` for every matched request including public routes, with no deadline and no distinction between "no session" and "auth service unreachable." Refreshed cookies were written to `res` but lost on redirect responses. Server pages and the navbar each called `getUser()`/`getUser()+profile` independently with no per-request memoization.
- **After**: public content routes (`/login`, `/u/*`, `/@*`, `/social/{explore,vijox,glimps}`, `/social/posts/[id]`) skip the session check in middleware entirely. Root `/` performs the minimum cookie-session check so an authenticated request redirects before any landing HTML is rendered. Protected routes call `getSession()`, now under a `withDeadline`; a failure returns `503 Retry-After: 5` instead of hanging or being silently treated as logged-out. Refreshed cookies are propagated onto redirect responses via `redirectWithCookies`. Server components share one memoized `getViewer()` per request (React `cache`) instead of each issuing its own `getUser()` call. The navbar still does its own client-side `getUser()` (necessary — it's a client component with its own hydration lifecycle) but now has a deadline, an `onAuthStateChange` subscription so sign-in/sign-out update it without a full reload, and a stale-response guard (`revision` counter) so an in-flight call from a previous mount can't clobber a later one.

## 8. Query waterfall improvements

Landing hero decoupled from data; public identity/Workplace header decoupled from counts/sections/controls; `/home` media fetch parallelized against its main query batch instead of sequential; the *candidate-visibility* N+1 in `accessibleGlimps(Page)`/`accessibleJoxPage` fixed (one query per candidate post → at most 2 batched queries per page, in `visiblePosts()`); `/social/posts/[id]`'s metadata generation no longer duplicates the full per-post engagement/media-signing work of `safePost` just to read an author name and media type. No new N+1 was introduced by this pass. No genuinely-independent queries were found still un-parallelized where they safely could be.

## 9. Login destination behavior

Verified in source, via a direct HTTP check (2026-09-18), and now via full end-to-end synthetic browser QA (2026-09-20, §14):

- `GET /workplaces?tab=active` while logged out → `307` to `/login?next=%2Fworkplaces%3Ftab%3Dactive` (destination **and** query string preserved, correctly percent-encoded).
- OTP login from that `/login` page lands back on `/workplaces` with `location.search === '?tab=active'` — **browser-confirmed**, not just source-reasoned.
- `post-login`'s and `profile/complete`'s missing-user branches redirect through `loginHref(next)` instead of the previously-confirmed destination-loss bug (bare `/login`).
- Direct `/login` (no `next`) → completed regular user → `/home` — **browser-confirmed**.
- An already-authenticated browser hitting `/` redirects to `/home` — **browser-confirmed** (this required the harness's hostname-consistency fix in §4C to actually observe correctly; see that section for why the first several attempts at this specific check gave a false negative).
- Admin emails still take `/admin` precedence over any `next` on both callback and post-login paths — unchanged, intentional, consistent in both places.

## 10. Open redirect protection

`lib/auth/return-to.ts`'s `safeReturnTo` re-verified this session with a standalone, unambiguous test script (avoiding an earlier false-failure in a quick hand test caused by shell/JS string-escaping, not the function itself):

| Input | Result |
|---|---|
| `https://evil.example` | rejected → `/home` |
| `//evil.example` | rejected → `/home` |
| `javascript:alert(1)` | rejected → `/home` |
| `data:text/html,evil` | rejected → `/home` |
| `/\t/example.org` (embedded tab — the exact gap the audit reproduced) | rejected → `/home` |
| `/\n/example.org` (embedded newline) | rejected → `/home` |
| `/` + backslash + `evil.example` (verified with an unambiguous `String.fromCharCode(92)`-constructed input, not a hand-typed escape) | rejected → `/home` |
| `/%2F%2Fevil.com` (double-encoded `//`) | rejected → `/home` |
| `/%5Cevil.example` (encoded backslash) | rejected → `/home` |
| `/login`, `/login/foo`, `/auth/callback`, `/onboarding`, `/profile/complete`, `/profile/complete?next=/dashboard` | all rejected as auth-trampoline destinations → `/home` |
| `/workplaces?tab=active` | accepted, unchanged, query preserved |
| `/dashboard` | accepted, unchanged |

All 17 cases passed. No open-redirect regression. `scripts/test-p0-auth.cjs`'s equivalent automated check also passed.

## 11. Loading/error recovery

`app/loading.tsx` renders `RouteLoading`, which shows a busy state and — after `OPERATION_TIMEOUT_MS` (120s) — switches to a retryable `RequestFailure` state instead of spinning forever. Section-level Suspense fallbacks (`SectionLoading`/`SectionUnavailable`) give each independent data section its own bounded failure state rather than taking down the whole page. Client-side initializers that previously could leave `loading`/`saving` stuck true on a rejected promise (messages list/thread, gig/job/project edit, identity onboarding finish, navbar sign-out) have `withDeadline(...).catch().finally()` or explicit try/catch/finally.

**`app/error.tsx` — found broken, now fixed and browser-confirmed working (§4D).** The route-level error boundary's "Try again" button did not actually retry a failed Server Component data fetch; it now does, via `startTransition(() => { router.refresh(); reset() })`, confirmed recovering in two consecutive full synthetic-browser runs (simulated `/workplaces` query failure → error page → click "Try again" → "My Workplaces" content visible within 0.5s).

## 12. Authorization/security review

Re-confirmed this session; nothing below changed from the 2026-09-18 finding:

- **RLS**: `createPublicClient()` (`lib/supabase/public.ts`) and `publicWorkplaceDb()` (`lib/organizations/public.ts`) both use the anon key with `persistSession:false`/`autoRefreshToken:false` — no service-role key, no session inheritance. All new "public, no-viewer-wait" code paths go through these, so Postgres RLS still gates what an anonymous request can see.
- **`socialDb()`** (service-role, bypasses RLS) is pre-existing, not introduced or expanded by this pass — its touches in this diff are `boundedFetch` wiring and the `visiblePosts()` batching, which enforces the *same* visibility predicate the old per-post loop did, just batched.
- **Workplace `isAdmin`/manage controls**: computed server-side from a real membership-role lookup (`viewerAccess`, React-`cache`d), not from client input. Organization edit and job/project creation routes still enforce their own server-side authorization independently — the client-rendered link is a UX convenience, not the authorization boundary.
- **Middleware**: the `publicRoute` early-out only skips the *session lookup*, not the `needsAuth` protected-route check — no route was removed from protection; `/workplaces` was in fact *added* to server-enforced protection (previously page-level only).
- **`safeReturnTo` hardening** closes a real open-redirect gap without introducing a new one (§10).
- No Suspense-deferred section skips a permission check the old blocking version performed.

No regression found. No security-relevant fix from this session's changes (§4) either — the two application-code fixes (import consolidation, `error.tsx` retry) are both non-security correctness/UX fixes.

## 13. Automated test results (2026-09-20, final)

All run from the actual local worktree, after every fix in §4:

```
node scripts/test-p0-auth.cjs              → 8/8 PASS
node scripts/test-p0-social.cjs            → PASS
node scripts/test-workplace-foundation.cjs → 28/28 PASS
node scripts/test-workplace-public.cjs     → 3/3 PASS
node scripts/test-workplace-setup.cjs      → 2/2 PASS
```

`npx tsc --noEmit -p tsconfig.json` → **clean, zero errors** (checked after every individual edit in §4, not just once at the end).

`git diff --check` → **clean**, exit 0 (only benign CRLF/LF line-ending warnings, pre-existing from the working tree's mix, not errors).

**Lint**: still unavailable — no `.eslintrc*`/`eslint.config.*` in this repository; `next lint` prompts interactively to create one. Not created, per instructions. Pre-existing repository condition, not introduced by this change.

**Production build**: still deliberately not run — `next-pwa` writes its generated output (including `sw.js`) into `public/` during `next build`, which would touch the protected, unrelated `public/sw.js` modification.

## 14. Synthetic browser QA results — SYNTHETIC BROWSER VERIFIED (now complete)

`scripts/p0-browser-qa.cjs`, after the two harness fixes in §4C, now **passes end-to-end, reproducibly, in two consecutive full runs** (a third run also reached the same point cleanly before the final logging cleanup). No production credentials, no live database, no live network — a local HTTP mock of the Supabase REST/Auth API plus a local `next dev` server on disposable ports.

**All of the following are now SYNTHETIC BROWSER VERIFIED:**

| # | Scenario | Result |
|---|---|---|
| A | Fresh guest → `/` | Hero renders; no overflow at any tested width |
| B | Guest → `/u/qa-person` (public identity) | Renders correctly at every width |
| C | Guest → `/u/qa-workplace` (public Workplace) | Renders correctly at every width |
| D | Guest → `/workplaces?tab=active` → `/login?next=...` | 307 redirect, `next` preserved with query, confirmed via `location.href` |
| E | Successful mocked OTP login → intended protected destination | Lands back on `/workplaces` with `location.search === '?tab=active'` |
| F | Direct `/login` (no `next`) → mocked login → `/home` | Confirmed |
| G | Authenticated refresh (page reload on protected route) | Session survives, content still shown |
| H | Authenticated `/` → `/home` | Confirmed (required the hostname-consistency fix, §4C, to observe correctly — the first several attempts gave a false "still guest" reading caused by the harness itself, not the app) |
| I | Query/auth failure → finite retry/error state → recovery | Confirmed — and this is where the real `app/error.tsx` bug (§4D) was found and then confirmed fixed |
| J | Back/forward around login | Not separately exercised as a distinct scripted step (not in the original harness); the underlying redirect/cookie mechanics it would exercise are already covered by D/E/F/H |

**Widths**: 320, 360, 375, 390, 412, 430, 1280 — all passed, landing/person/Workplace/login, zero horizontal overflow at every width, both under normal conditions and under throttling (4× CPU / 150ms latency / ~1.6Mbps).

Labeling per instructions: everything above is **SYNTHETIC BROWSER VERIFIED**. None of it is production-verified, physical-device-verified, or real-user-verified.

Note on reliability: across roughly a dozen runs during this session's debugging, a handful of *unrelated* transient timeouts occurred at various different steps (most consistent with this machine being under load from many repeated Chrome+Next.js dev-server spawns in one session, not a deterministic defect) — every one of those was re-run and passed cleanly, and the two real, reproducible failures (the harness's two bugs, and the `error.tsx` bug) each reproduced consistently and in the same place until actually fixed, which is what distinguishes them from the transient noise.

## 15. Mobile viewport results

320/360/375/390/412/430px (plus 1280 desktop) all passed with no horizontal overflow on landing, public person identity, public Workplace identity, and login, under both normal and throttled (4× CPU / 150ms / ~1.6Mbps) network conditions. Browser-confirmed, both sessions.

## 16. Production/physical-device status

**Not performed, not claimed.** No production build, no production deployment, no physical device, no real user account, no live Supabase project was used at any point in either session. Everything above is either static source review, Node-based isolated/mocked unit-style tests, or a local dev server against a disposable in-process HTTP mock of the Supabase API.

## 17. Remaining risks

- No physical-device or production-network trace exists for the original "friend's phone" report; the audit's own conclusion stands — this pass fixes concrete, reproducible architectural issues, not a confirmed root cause of that specific report.
- `next lint` has no config in this repo; static lint coverage was not available in either session.
- The service-worker/cache-layer recommendations from the audit (§18) remain unaddressed by design — out of scope, explicitly deferred to a separate approved pass.
- The browser-QA harness (`scripts/p0-browser-qa.cjs`) is local development/CI tooling, not shipped application code — it is not part of the P0 commit's *product* surface, but it is a genuinely useful regression check for whoever maintains this area next; keep it if convenient, but it isn't required for this review's READY/NOT READY determination on the app code itself.
- One scenario (back/forward navigation around login, item J in §14) was not separately scripted; low risk, since the mechanics it would exercise (redirect + cookie handling) are already covered by the scenarios that were run.

## 18. Service-worker recommendation

**Read-only this session, as instructed.** `public/sw.js` was not modified (§19). The audit's existing recommendation stands unchanged and is repeated here for visibility, not re-derived: in a separate, explicitly-approved pass, exclude auth/protected HTML and viewer-specific APIs from the `NetworkFirst` runtime-caching rule that currently covers same-origin non-API routes broadly, review the `/` `start-url` caching behavior (no configured network timeout on that specific rule, unlike the 10s default elsewhere), and add update-notification/reload coordination so a stale cached shell can't outlive a new deployment. No code change to the service worker was made or is proposed here.

## 19. Database changes

**None.** No migration, no RLS policy change, no Supabase schema change, no remote Supabase call other than the disposable local mock server used for QA, which is not a real Supabase project. `public/sw.js` confirmed byte-identical throughout (SHA-256 `b1e2c71c59683d97b5fb0b649ef2327f279727f980821dc89e0af3179c4816f6`).

## 20. Anything not verified

- Real device / production network behavior — not verified, not claimed, per §16.
- Service worker / cache behavior on a returning client across a real deployment — read-only audit only, not implemented or tested (§18).
- Full ESLint static-analysis pass — unavailable, no config in repo (§13).
- Back/forward navigation around login as a distinct scripted browser check (§14, item J) — not separately exercised; low residual risk given overlapping coverage.
- Exhaustive fuzzing of `safeReturnTo` beyond the specific bypasses named across both sessions — not attempted.

---

## 21. Production authenticated-root mismatch follow-up (2026-09-20)

Production evidence after `f7f0689` showed an authenticated `ModernNavbar` over the public `/` landing body. The source allowed exactly that split:

1. `middleware.ts` classified `/` as a public route and skipped its Supabase cookie-session refresh/read.
2. `app/page.tsx` rendered the marketing hero outside a Suspense-wrapped `LandingRedirect`.
3. `LandingRedirect` caught every `getViewer()` error and returned `null`, converting an unavailable or stale server-cookie check into a stable guest decision.
4. `ModernNavbar` hydrated afterward and called the browser Supabase client. `createBrowserClient` from `@supabase/ssr` persists PKCE auth in `document.cookie`, rather than ordinary localStorage; it could refresh or recover that cookie after the server response and render authenticated chrome.

The earlier harness missed the bug because its unit assertion explicitly required middleware to make zero auth calls on `/`, while its browser mock supplied a clean cookie/session and only checked the successful authenticated redirect. It did not model a stale server-side cookie check followed by browser recovery, or cached navigation HTML that bypasses middleware.

The fix gives the root decision one owner before landing HTML:

```text
GET /
  -> middleware refresh/read cookie session
     -> no session: render guest-only app/page.tsx immediately
     -> session: /auth/post-login
        -> completed identity: /home
        -> incomplete identity: /profile/complete
     -> auth resolution error: finite no-store 503/retry response
```

`LandingRedirect` was removed. The landing page remains synchronous and guest-only; its public stats and opportunities keep their independent Suspense boundaries. The only added guest cost is reading an absent cookie session, which the installed Supabase SDK resolves locally without an auth network call. Authenticated or expiring sessions may perform one refresh in middleware, which is necessary for the decision; refreshed cookies are copied to the redirect response and request headers.

There is also client reconciliation for navigation caches outside the server's control: if `ModernNavbar` authenticates while `pathname === "/"`, it replaces the document with `/auth/post-login`. Middleware is primary; this fallback prevents cached landing HTML, including service-worker navigation cache, from becoming a stable authenticated-navbar/landing-body state. No service-worker file was changed.

Regression coverage now includes the explicit invariant “browser user authenticated + root request session => middleware redirect before `app/page.tsx` can render,” plus the navbar's authenticated-root reconciliation. `node scripts/test-p0-auth.cjs` reports 9/9 passing groups. TypeScript, Next type generation, social tests, and all Workplace suites pass. A fresh synthetic headless-Chromium run passed authenticated `/` to `/home`, protected destination preservation, refresh, direct login, failure/retry, all public routes, and widths 320/360/375/390/412/430/1280. This is mocked local verification, not production or physical-device verification.

Changed for this follow-up: `middleware.ts`, `app/page.tsx`, `lib/auth/return-to.ts`, `components/layout/ModernNavbar.tsx`, `scripts/test-p0-auth.cjs`, `scripts/p0-browser-qa.cjs`, and this review document. No database or RLS changes.

Real production verification is still required after an approved deployment: test the affected browser with normal navigation, hard refresh, a fully closed and reopened browser, an expired or near-refresh session, and its existing service-worker/cache state. Confirm the network chain is `/` to `/auth/post-login` to `/home` for a completed identity or `/profile/complete` for an incomplete identity, and that no marketing body remains under authenticated chrome. No deployment was performed here.

## Recommendation: **READY TO COMMIT**

Both the original P0 implementation and this session's additional fixes are now backed by: a clean `tsc --noEmit`, all 5 automated test suites passing, a clean `git diff --check`, a full read of every changed file confirming no unrelated scope creep and no authorization/RLS regression, and — now complete — full synthetic browser QA covering every scenario the task specified (widths, throttled first paint, guest destination preservation, OTP login, refresh, authenticated redirects, and failure-recovery), reproduced cleanly twice in a row. Two real bugs were found and fixed this session: two in the QA harness itself (test tooling, not shipped code) and one genuine, if narrow, defect in P0-added application code (`app/error.tsx`'s non-functional retry button, now fixed and confirmed working). `public/sw.js` and Workplace Phase 4 remain untouched throughout. No database, commit, push, or deploy action was taken.
