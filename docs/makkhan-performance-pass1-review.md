# Makkhan Performance Pass 1 Review

**Revision:** local working tree based on `8fb628a`
**Status:** implementation complete locally; generated service worker regeneration and production verification remain pending. No commit, push, deploy, migration, schema, RLS, or remote Supabase change.

## Pass 1 verdict

**READY FOR PASS 1 REVIEW.** Source-level correctness fixes and social batching are implemented and isolated tests pass. `public/sw.js` was deliberately not regenerated because it contains protected pre-existing local modifications. The corrected PWA policy therefore cannot affect a deployed browser until a separately reviewed regeneration/build is performed.

## Service worker and cache policy

The canonical source is `next.config.js`, using `next-pwa@5.6.0` with `dest: "public"`. Production builds generate `public/sw.js`; `worker/index.js` is the supported next-pwa custom-worker source and is imported into the generated worker.

Before, next-pwa defaults generated NetworkFirst caches for `/`, same-origin navigations/other requests, `/_next/data`, same-origin GET `/api/*`, cross-origin responses, and broad media types. Cache keys were URL-only and API/other network fallback waited up to ten seconds.

After, the source config registers NetworkOnly first for all document navigations and `/api/*`. Only immutable `/_next/static/*` runtime assets retain CacheFirst behavior under `gigway-static-v2`; normal precaching remains available. No viewer-specific API, navigation HTML, Next data, signed media, or broad cross-origin response has a runtime cache strategy.

The custom worker deletes the precise unsafe legacy cache names during activation: `start-url`, `apis`, `others`, `next-data`, `static-data-assets`, `cross-origin`, `static-image-assets`, `next-image`, `static-audio-assets`, and `static-video-assets`. Workbox `cleanupOutdatedCaches` also remains enabled for outdated precaches. Static precaches and the new immutable static cache are not deleted.

Account A â†’ B and authenticated â†’ guest are covered synthetically by asserting the same API URL always executes NetworkOnly and yields the current caller's network result. A real generated worker/browser lifecycle is **NOT VERIFIED** because regeneration was explicitly prohibited.

## Middleware

Before, the matcher included `/api/*`, so middleware performed `auth.getSession()` before handlers performed their own authoritative authentication.

After, the matcher excludes the complete `/api` namespace. API handlers remain responsible for authentication and authorization; public handlers remain intentionally public. The audit found one legacy admin verification handler without an authoritative admin check; it now performs `getUser()`, returns 401 for guests and 403 for non-admins before mutation. The other five routes without session auth are intentionally public: signed Razorpay webhook, contact submission, public notices, username availability, and an unavailable 410 AI placeholder. Existing P0 tests prove representative protected endpoints reject missing users and the new Pass 1 test proves the matcher exclusion and admin guard. No RLS or handler authorization was removed. Middleware auth timing is logged only in development or when `GIGWAY_PERF_DIAGNOSTICS=1`.

## Social visibility and serialization

Discover, following, profile-tab, profile-repost, organization, GLIMPS, and VIJOX list workloads now use batched visibility and/or `safePosts()`. The single-post `safePost()` API remains compatible and delegates to a one-item batch.

Visibility preserves published/public, owner, followed-profile, followed-organization, and profile-author precedence. It uses at most two follow queries for a candidate page and fails closed when either query fails. Existing parity fixtures cover anonymous public, authenticated public, owner, follower/non-follower, organization follower/non-follower, drafts, and rows with both author fields.

The old serializer performed roughly ten enrichment queries per post, followed by per-post follow and mention queries. A 15-post page could therefore reach roughly 180 DB operations before reply/reaction enrichment.

The new serializer batches ten page stages independent of page size: profile authors, organization authors, viewer likes, viewer saves, viewer reposts, media, organization management, profile follows, organization follows, and mentions. Likes, comments, and repost counts retain parallel per-post exact head-count queries because bounded row fetching could truncate under Supabase's response limit and no grouped-count RPC/schema change was permitted. Every query remains scoped to current page IDs. The mock test observes exactly 16 DB operations for two posts and verifies exact counts, liked/saved/reposted state, follows, mentions, organization management, and authors.

Public audio/video still uses the stable same-origin public delivery route. Every other media object still receives its own five-minute signed URL; database fan-out is batched, while storage signing remains per protected object. A signing failure or required enrichment query failure terminates with the existing finite 503 response and does not serialize partial unauthorized content.

Development or explicit diagnostic logs report candidate count, visible count, computed DB stage count, signed URL operation count, visibility duration, serialization duration, and total social API duration. Logs contain no cookies, tokens, headers, signed URLs, message bodies, or viewer identity.

## Measurements

| Measure | Before | After | Delta | Evidence |
|---|---:|---:|---:|---|
| Visibility follow queries per page | up to candidate count serially | 0â€“2 concurrently | O(n) â†’ O(1) | code + isolated parity test |
| Core serialization DB operations, 15 posts | about 150 plus follow/mentions | 55 | at least 95 fewer core operations | code-derived; no live DB |
| Test page serialization DB operations | legacy estimate 20â€“24 for 2 posts | 16 observed | 4â€“8 fewer | isolated mock |
| Protected media URL operations | per protected object | per protected object | unchanged | isolated mock |
| Middleware auth calls per API request | 1 before handler auth | 0 | âˆ’1 | matcher source/test |
| User-specific runtime cache reads | possible NetworkFirst fallback | NetworkOnly | eliminated after worker activation | source/test; generated worker pending |

The pre-pass warm local mocked baseline remains: root 438â€“587 ms, public person 221â€“294 ms, Workplace 204â€“244 ms, login 210â€“276 ms, and throttled landing 499 ms TTFB. The post-pass browser harness was launched, but its Chrome DevTools connection stalled before navigation and emitted no comparable sample; it was terminated rather than reporting invented measurements. Dev mode disables PWA, so it cannot validate the corrected worker policy. Production is **NOT VERIFIED**.

## Security and failure verification

- Batched visibility matches prior results and ordering and fails closed on query failure.
- Enrichment failure rejects the whole batch; routes return terminal 503 responses.
- Viewer state always uses the authoritative handler user ID.
- Organization manage state requires owner/admin membership for the current viewer.
- Queries are bounded to current page IDs.
- Protected media remains signed.
- API middleware removal does not bypass handler auth.
- Account-switch/cache assertions cover A â†’ B and authenticated â†’ guest.
- No infinite loading behavior was introduced.

## Files changed

- `next.config.js`
- `worker/index.js`
- `middleware.ts`
- `lib/social/server.ts`
- `app/api/social/posts/route.ts`
- `app/api/social/profiles/[id]/posts/route.ts`
- `app/api/social/organizations/[id]/posts/route.ts`
- `app/api/social/glimps/route.ts`
- `app/api/social/vijox/route.ts`
- `app/api/admin/verify/route.ts`
- `scripts/test-makkhan-pass1.cjs`
- `docs/makkhan-performance-audit.md`
- `docs/makkhan-performance-pass1-review.md`

## Remaining P0 risks

1. The corrected worker has not been generated or deployed, so the current protected `public/sw.js` still contains the old policy locally.
2. A controlled production build must first preserve/review the existing local `public/sw.js` changes, generate the worker and custom-worker chunk, inspect both, then test activate/update/cache deletion.
3. Real-device Account A â†’ B, B â†’ A, logout, offline navigation, old-worker upgrade, and new deployment behavior remain unverified.
4. Count batching transfers bounded matching rows; high-engagement pages may benefit from grouped-count RPCs later, but that requires a separately reviewed database change.
5. Post-pass browser timing is unavailable because the local CDP harness stalled before navigation.
+

## SERVICE WORKER REGENERATION REVIEW

**Review date:** 2026-09-22
**Generation command:** `npm.cmd run build` (`npm run build` is the repository command; PowerShell script policy required the Windows command shim).
**Old SHA-256:** `B1E2C71C59683D97B5FB0B649EF2327F279727F980821DC89E0AF3179C4816F6`
**New SHA-256:** `A7A5A43CA4B8E50E50CB646A91FA74E53B4CF3447525F008C415EE825CFBE2C0`

The original worker and its full HEAD diff were preserved at `C:\Users\Admin\AppData\Local\Temp\gigway-sw-backup-20260922-131025` before regeneration. Its local modification is classified **A/C: generated output from an older build plus manifest/chunk/minifier noise**. It contained no deliberate hand-written worker behavior.

The first generated review exposed an additional next-pwa default: despite the explicit navigation rule, `dynamicStartUrl: true` prepended a `NetworkFirst` route for `/`. That intermediate worker was rejected. The source now sets both `cacheStartUrl: false` and `dynamicStartUrl: false`, and a second controlled build generated the final worker.

The final generated `public/sw.js` contains exactly two runtime routes:

1. Navigations or paths beginning `/api/` use `NetworkOnly`.
2. same-origin `/_next/static/*` uses `CacheFirst` with cache `gigway-static-v2`, 128 entries, and a 30-day maximum age.

It contains no `NetworkFirst`, `start-url`, broad other/cross-origin/media/data runtime rule, or root precache entry. Therefore authenticated HTML, guest HTML, Next viewer data, messages, notifications, completion state, relationship state, private feeds, signed URLs, and API payloads have no runtime response fallback cache.

Generated artifacts are:

- Modified tracked: `public/sw.js`
- Deleted tracked/replaced Workbox runtime: `public/workbox-4754cb34.js`
- New generated Workbox runtime: `public/workbox-a7e9ed40.js`
- New generated custom worker chunk: `public/worker-FOKD7JC6QSjUH8vH8NvJ5.js`
- Ignored build output: `.next/`

The generated custom worker contains exact, unprefixed legacy cache names emitted by the previous worker: `start-url`, `apis`, `others`, `next-data`, `static-data-assets`, `cross-origin`, `static-image-assets`, `next-image`, `static-audio-assets`, and `static-video-assets`. The activation test executes the actual minified custom chunk and proves those caches are deleted while `workbox-precache-v2-safe` and `gigway-static-v2` remain.

The generated worker itself was executed in an isolated VM with a Workbox strategy harness. It proves:

- cached guest root â†’ authenticated navigation uses the network response;
- cached Account A `/api/me` â†’ Account B receives B's network response;
- authenticated â†’ logout â†’ guest receives the guest network response;
- navigation and API matchers instantiate `NetworkOnly`;
- cross-origin/private media does not match the static cache rule;
- root is not precached.

This is strong generated-code coverage but not a full Chromium service-worker install/waiting/controllerchange lifecycle. The existing browser QA harness stalled twice during Chrome DevTools startup before any application navigation; Next reached ready state and recorded no route/build exception. Physical-device and deployed old-worker upgrade behavior remain production-only QA.

The completed production build passed after network access allowed the configured Google Manrope font fetch. The initial sandboxed attempt failed only at that external font fetch after PWA generation; the subsequent normal build completed all compilation, type checking, 138 static-page generation tasks, optimization, and trace collection.

All `/api/*` routes were re-audited after build. Handler cookies remain directly available through `createServerClient`; middleware did not provide an authorization decision to APIs. Eighty-five routes have explicit session/user markers. The remaining routes are the signed Razorpay webhook and intentional public endpoints. The previously unguarded admin verify handler now performs authoritative user and admin checks. The social list regression and batching suites cover discover, following, profile, organization, GLIMPS, VIJOX, visibility, viewer state, mentions, and public/protected media.

The generated `public/sw.js`, replacement Workbox runtime, and custom-worker chunk should all be included together in the eventual Pass 1 commit because the tracked worker imports both generated dependencies. No original intentional behavior was lost; unsafe default runtime caching was deliberately removed.
