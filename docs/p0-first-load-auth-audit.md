# P0 first-load, auth boot, and return-destination audit

Audit date: 2026-09-18. Scope: current local source and installed dependencies. **Audit only; no remediation implemented.** No commit, push, deployment, remote migration, authentication attempt against a real account, or production data modification was performed. Workplace Phase 4 work was not changed.

## 1. Executive summary

The code contains concrete reasons for a long loading experience, but this audit does **not** establish which one occurred on the friend's phone. No device trace, production timings, cookies, or service-worker version from that phone were available.

The main verified architectural problem is **route-wide server data blocking**, rather than a global client auth provider:

1. `/` awaits user resolution and seven database queries before returning even the static hero. Two further asynchronous preview components then query the database. The only root loading boundary is a viewport-height spinner.
2. Public `/u/{username}` waits for viewer auth, identity lookup, and multiple dependent query stages. Public Workplace identity shares this route; its header waits for counts, section data, and optional membership/follow state.
3. Authenticated `/home` awaits twelve queries, candidate intents, two media feeds, and per-post enrichment before rendering. Its primary social feed then starts another request after hydration. `safePost` produces substantial per-post query fan-out.
4. Auth is repeated across middleware, page/layout, browser navbar, and API requests. A truly anonymous cookie-free SDK check is fast and makes **zero auth HTTP calls** in the isolated local check. Expired-session refresh and authenticated `getUser` are different paths and can wait for the network.
5. `next` already exists and works on the normal `/workplaces` flow. Other entry points use unsupported `redirect`, omit destinations, or drop `next` after an auth error. Successful normal login defaults to `/home`, **not `/`**. The reported landing-page result remains unconfirmed; stale navigation caching, missing session state, and particular redirect branches are plausible explanations, not established incident facts.
6. Network rejection or a request that never settles can leave login/onboarding/edit/message loading states active. There is no application deadline for the critical boot queries.
7. The current service worker caches `/`, same-origin pages, and GET APIs. Cached navigation can be stale or inconsistent with current auth. This is a returning-client risk, not proof that a brand-new visitor was served an old build.
8. `safeReturnTo` rejects obvious external URLs but accepts embedded control characters that URL parsing normalizes into a protocol-relative external URL. The browser normalization gap was reproduced locally; a browser end-to-end exploit was not tested.

**No database migration or RLS change is required for the first remediation pass.** Preserve current authorization while isolating optional data, bounding failure states, and consolidating destination handling.

## 2. Evidence and limitations

Repository searches covered `loading.tsx`, `Suspense`, loading state variables, `getSession`, `getUser`, `onAuthStateChange`, auth/provider/guard names, `supabase.auth`, navigation calls, middleware, and location assignment across `app`, `components`, and `lib`. Imported active components were distinguished from legacy files under `components/onboarding` and the unused old navbar.

Installed versions read from local package metadata: Next 15.5.12, Supabase SSR 0.5.2, Supabase JS/auth-js 2.98.0, next-pwa 5.6.0. These differ from some minimum versions in `package.json`.

Isolated checks transpiled actual source in memory with TypeScript and substituted database/navigation dependencies. They did not start Next, perform browser rendering, or contact Supabase. Auth SDK testing used a dummy `.invalid` URL, empty cookies, and a fetch implementation that would count and reject all network calls. Results establish source behavior, not production latency.

No browser connector was available; `playwright`, `@playwright/test`, and `puppeteer` were not installed in this repository. Existing `.next` artifacts have no `BUILD_ID`; the app manifest is dated 2026-09-15 and is incomplete. They are not a valid production measurement. A production build was deliberately not run: `next-pwa` writes generated output to `public`, including the protected `public/sw.js`. No app-code change was necessary to verify the findings.

## 3. Exact cold-start architecture

Common path:

```text
document / RSC navigation / matching API request
  -> middleware: createServerClient -> await getSession
     -> protected-path login redirect, optional admin redirect
     -> optional referral tracking when ref is present
  -> server RootLayout
     -> Google font CSS + async ad script
     -> ThemeProvider (next-themes; passes children through)
     -> ModernNavbar (client component, initial user=null)
     -> route content under app/loading.tsx
     -> Footer
  -> server page's own auth and database work
  -> route HTML/RSC completes
  -> client hydration
     -> navbar getUser -> profile if authenticated
     -> route-specific client effects/API requests
```

`middleware.ts:27` calls `getSession` for all matched requests, including public pages, callback, most APIs, manifest and service-worker JS. Its matcher excludes Next static/image paths and selected image suffixes, not all static assets. The comment saying this can never make a network call is inaccurate: installed auth-js `__loadSession` invokes `_callRefreshToken` for an expiring session. Middleware has no application timeout or catch.

`app/layout.tsx` is a server component. Its only active provider is `components/layout/ThemeProvider.tsx`, which immediately returns children. There is no active AuthProvider, SessionProvider, ProtectedRoute, application `onAuthStateChange`, or explicit component `Suspense` boundary found. Wrapping server-rendered children in this theme provider does not make the entire app client-only. The route loading convention supplies the main suspense fallback.

| Requested route | Work before meaningful route content | After hydration / final outcome |
| --- | --- | --- |
| `/`, guest | `HomePage`: `getUser`; seven parallel queries; async freelancer and organization previews | Landing UI; navbar resolves viewer separately |
| `/`, authenticated | `getUser`; redirect `/home` | `/home` performs its own boot; navbar resolves again on a document mount |
| `/u/{person}` | `PublicIdentity`: `getUser` -> public profile -> intents + memberships -> optional viewer relationship state -> three counts -> optional connection row | Identity; `ProfileSocialFeed` fetches posts after hydration |
| `/u/{workplace}` | Same auth -> profile miss -> organization lookup -> `PublicWorkplace` parallel panels/counts/viewer state; People has membership -> profile lookup | Workplace identity; organization posts requested after hydration for home/content tabs |
| `/social/vijox` | `getUser` -> accessible JOX page -> `safePost` for each post | Hydrates continuous feed, preserves route in its auth CTA |
| `/social/glimps` | `getUser` -> accessible GLIMPS page -> optional selected post -> `safePost` | Hydrates player/feed; CTA preserves base route but not selected-post query |
| `/social/explore` | `getUser` -> discovery queries -> access checks/enrichment | Public discovery UI, still waits for optional viewer resolution |
| `/social/posts/{id}` | Page: `getUser` -> access lookup -> serialization; metadata separately does access lookup + serialization | Post UI then comments request; metadata repeats overlapping work |
| `/login` | Middleware session handling, then client login component; no page-level auth wait | Login form hydrates; navbar still independently resolves user |
| `/workplaces` | Middleware session check but no middleware protection for this path; page `getUser`; guest -> `/login?next=/workplaces`; authenticated -> joined memberships query | Workplace list or empty state; query error throws |
| `/dashboard` and middleware-protected routes | Missing session -> middleware login with pathname+query in `next`; present session -> route's own auth/profile gates | Dashboard may additionally send user to profile completion |
| `/messages` | Middleware session gate; route itself is client-rendered | Browser `getUser` -> all message rows -> one profile lookup per conversation |

Public Workplace identity is `/u/{username}`, including the `/@username` rewrite in `next.config.js`. `/workplaces` is the authenticated membership list, not public identity. No public `/organizations/{username}` page exists; that namespace has creation and editing routes.

## 4. Ranked root causes and risks

| Priority | Evidence | Finding and exact owner | Consequence |
| --- | --- | --- | --- |
| P0 | Source + isolated held-query check | `app/page.tsx:15`, `HomePage`, returns only after seven query results | A slow optional count/list holds the entire landing body behind the spinner |
| P0 | Source | `app/home/page.tsx:23`, `HomeHub`; `lib/social/server.ts:63`, `safePost` | Large server waterfall followed by client feed loading makes successful login feel unfinished |
| P0 | Source | Login handlers, `IdentityOnboarding.finish`, message/edit initializers lack comprehensive catch/finally/deadline | Rejected or indefinitely pending work can strand controls or route loading |
| P1 | Source + redirect branch checks | Mixed `next`, unsupported `redirect`, and bare `/login` calls | User loses intended destination; normal `/workplaces` success is correct |
| P1 | Source + URL normalization check | `lib/auth/return-to.ts:1`, `safeReturnTo` | Accepted input is not necessarily an internal path after normalization |
| P1 | Source | `PublicIdentity`, `PublicWorkplace` wait for optional viewer/count/section state | Public identity cannot render independently of those requests |
| P1 | Source, incident attribution unverified | `next.config.js`, current `public/sw.js`, installed next-pwa registration | Stale navigation/API response or obsolete worker can produce misleading auth/UI state |
| P1 | Source, expired-cookie runtime untested | Middleware refresh cookies copied only to `res`; redirects create fresh responses; request cookies are not updated | Refresh state can be lost on redirects or re-read stale by downstream server code, causing repeated refresh/auth work |
| P2 | Source | Navbar starts anonymous, then `getUser` -> profile; no auth event subscription | Signed-in user temporarily sees guest CTA; persistent layout can retain stale viewer state |

The middleware cookie issue is a demonstrated implementation gap, not proof of refresh failure on the friend's phone. No universal redirect loop was established.

## 5. Auth call map

Counts below are logical invocations per ordinary request/mount, excluding prefetch, refresh, development Strict Mode, retries, and redirects. **An invocation is not necessarily an HTTP request.** Empty-cookie `getUser` returns missing-session state without `/auth/v1/user`; a valid authenticated session normally causes user validation. Server helpers are not request-memoized.

| Surface | Middleware | Server page/layout | Browser | Profile-related work |
| --- | --- | --- | --- | --- |
| Landing guest | 1 `getSession` | 1 `getUser` | navbar 1 `getUser` | completed-profile count + featured-profile list; no viewer profile |
| Public person | 1 `getSession` | 1 `getUser` | navbar 1 `getUser`; posts API later authenticates viewer separately | public identity; navbar viewer profile only if signed in; post-author profiles later |
| Public Workplace | 1 `getSession` | 1 `getUser` | same navbar; organization posts API separately | failed person lookup, optional People batch, viewer navbar profile |
| `/login` idle | 1 `getSession` | none | navbar 1 `getUser` | navbar profile only if signed in |
| OTP success | session check on `/auth/post-login` and destination | post-login 1 `getUser`, then destination's auth | `verifyOtp`, full navigation; navbar mount(s) | post-login completion query; destination/navbar may fetch same viewer again |
| OAuth/code callback | 1 `getSession` | 1 `exchangeCodeForSession`, uses exchange user directly | provider redirect, destination navbar | completion profile; conditional ensure/referral operations |
| `/profile/complete` | 1 `getSession` | 1 `getUser`, profile, then active intents if incomplete | navbar auth/profile; username availability after input | page profile overlaps navbar profile |
| `/home` authenticated | 1 `getSession` | 1 `getUser` | navbar 1 `getUser`; main posts API later | own profile + candidate profiles + per-post authors; own navbar duplicate |
| `/workplaces` authenticated | 1 `getSession` | 1 `getUser` | navbar 1 `getUser` | navbar profile; membership joined organizations |
| Admin pages | 1 `getSession` | layout 1 `getUser` plus many pages' independent `getUser` | navbar 1 `getUser` | page-dependent |
| Messages | 1 `getSession` | none in client page | page 1 `getUser` + navbar 1 `getUser` | navbar + one per conversation |

Each social API call also traverses middleware and `requireSocialUser` where used (`lib/social/server.ts:21`). `app/api/social/posts/route.ts:103` GET authenticates separately. No global notification-count, message-count, social-feed, or Workplace fetch runs in RootLayout/ModernNavbar. The three activity counts block `/home` specifically.

`createBrowserClient` is a browser singleton by default in installed SSR 0.5.2 (`src/createBrowserClient.ts:109-115`). Calling the wrapper during render does not prove a new client per render. Independent effects still invoke `getUser`. Server `createClient` creates a fresh client each time. The old `Navbar.tsx` and `StickyBanner.tsx` calls are not part of the active root mount.

Profile fetching does not block the SDK from resolving user state. It does block post-login/profile-completion routing and many page renders. Navbar calls `setUser` before fetching profile, and never gates children. There is no auth callback causing application-wide rerender/redirect storms; no app `onAuthStateChange` subscription exists. Initial navbar `null` conflates unknown with anonymous, causing a guest-UI flash rather than a global auth spinner.

## 6. Redirect map and destination loss

```text
/workplaces (guest)
 -> /login?next=/workplaces
 -> email OTP verify -> /auth/post-login?next=/workplaces
    OR OAuth/code link -> /auth/callback?code=...&next=/workplaces
 -> completed profile: /workplaces
 -> incomplete profile: /profile/complete?next=/workplaces
    -> IdentityOnboarding.finish -> /workplaces

/login (no next), completed regular user
 -> post-login or callback -> /home

/ (authenticated) -> /home
/onboarding -> /profile/complete (drops query)
```

There is no password login implementation here: supported UI is email OTP and Google OAuth. OTP navigates using `window.location.href`; OAuth `redirectTo` includes encoded `next`. Code callback exchange uses its returned user, avoiding another callback `getUser` call. Both completion checks require `profile_completed` and `username`. Both callback and post-login give admins `/admin` precedence over `next`.

Confirmed gaps:

- `app/refer/page.tsx:20`, affiliate dashboard, and admin layout emit `?redirect=...`, but login reads only `next`.
- `/profile`, `/organizations/new`, organization editing, `/subscribe`, `/verify-me`, `/buy-connects`, and payment-success login fallbacks omit `next`. They are not all in middleware's protected list, so the page fallback matters on a clean guest request.
- Post-login's no-user branch (`app/auth/post-login/page.tsx:13`) and profile-completion's no-user branch discard `next`. Isolated check confirmed `/auth/post-login?next=/workplaces` with no resolved user becomes bare `/login`.
- Middleware preserves pathname and query for its own protected routes, but later page-level onboarding redirects often discard them. `/onboarding` discards any `next`; social creation missing-profile redirects do too. Opportunity Match preserves its base path but loses `?job=`.
- Navbar login/join links omit current location. Signing in from a public identity through that navbar therefore defaults to `/home`. Workplace Follow and media feed auth CTAs do preserve a destination, though not all query/hash state.
- Callback errors preserve `next`, but `/login` never reads its `error` query parameter. Failed exchange or profile setup therefore appears as an unexplained login screen.
- Callback profile lookup discards the query error and treats missing data as new-user setup; it may attempt an upsert and referral work during an outage. Post-login similarly treats missing/error profile data as incomplete.
- Dashboard boost uses `/auth/login` in its page fallback, although the real login route is `/login`.
- Some admin page guards redirect to `/` and use email comparison rules differing from the normalized layout guard. This is an explicit route to `/`, but not evidence for an ordinary user's incident.

Loop/ownership findings:

- Middleware, individual pages, callback, and profile completion each own different routing decisions. No central provider redirects.
- Middleware checks cookie session presence; page guards validate the user. These can disagree on revoked/expired sessions and cause extra login trips.
- Dashboard/verify still use role configuration while completion uses only completed+username. A legacy completed-but-unconfigured profile can bounce through completion to `/home`, without fixing the role gate. This is an unwanted detour, not a proved infinite cycle.
- Internal auth/onboarding endpoints are accepted as `next`, yielding avoidable same-route/extra hops. A tested completed profile with `next=/profile/complete` redirects once to the bare completion route, whose next request defaults to `/home`; this is **not** an infinite loop.
- `IdentityOnboarding` calls replace then refresh on success; this is a finite action, not a render-triggered loop. Navbar has no repeated refresh effect. Login itself does not redirect an already-authenticated visitor.

Security: existing `safeReturnTo` correctly rejects `https://...`, `//...`, and backslashes. It accepts `"/\t/example.org"`; local WHATWG URL parsing resolves that value against GigWay to `https://example.org/`. Callback concatenates origin and path, whereas client routing consumes a path directly, so exploitability must be verified per consumer. Harden the existing helper by rejecting control characters and checking normalized same-origin URLs, plus avoiding auth trampoline destinations. Do not create a second return-URL mechanism or substitute unverified session data for authorization.

## 7. Public rendering and network/query waterfall

| Request/query | Where triggered | Public/auth required | Blocking | Duplicate? | Likely user impact | Recommended action |
| --- | --- | --- | --- | --- | --- | --- |
| Session load/possible refresh | middleware | all matched requests | before route response | repeated on navigations/APIs | expired-session delay can affect public routes | Correct cookie propagation; assess narrowly scoped public behavior without weakening protected guards |
| User validation | pages + navbar | optional on public pages | server yes; navbar no | server/browser overlap | auth network wait before public data; guest CTA flash | Share verified server viewer state where appropriate; isolate optional viewer controls |
| Four exact counts + three lists | landing `HomePage` | public | all seven before hero | two queries per jobs/projects/gigs table, distinct purposes | slowest response delays static landing | Return static hero first; sectional boundaries, bounded fallback; assess count caching separately |
| Featured professionals, organizations | async home preview components | public | within root boundary; no own boundary | profiles/organizations read again for separate purpose | additional dependent render work | Independent section loading/empty/error states |
| Profile -> intents/memberships -> counts | `PublicIdentity` | public | identity header | not equivalent queries | multi-stage identity delay | Parallelize independent stages; render identity before optional counts |
| Connection/follow -> connection again | `PublicIdentity`, `resolveConnectionState`, `connectionRow` | viewer required | public page | **same connection lookup twice** | needless request and sequential stage | Derive state and ID from one fetched row |
| Profile miss -> organization | shared identity namespace | public | Workplace lookup | no | unavoidable current sequential namespace search | Measure before changing lookup strategy |
| Followers, membership, following, People, jobs, projects, People count | `PublicWorkplace` | public panels; optional viewer state | entire Workplace including header | People membership/count overlap, different outputs | slow optional section delays identity | Stream sections and viewer controls; keep anonymous public client and RLS |
| Membership -> profile batch | `workplacePeople` | public | People and currently whole Workplace | batched, not per-person N+1 | one extra stage when members exist | Isolate People section; preserve public eligibility |
| Twelve queries -> candidate intents | `HomeHub` | authenticated | entire `/home` | own profile repeated by navbar | counts/recommendations delay welcome/feed | Split critical shell from optional rails/activity counts |
| GLIMPS/JOX selection -> access checks -> enrichment | `HomeHub`, public media pages | mixed visibility | entire page | repeated authors/follows/counts per post | high query count and sequential access checks | Batch enrichment/access state while retaining `canViewPost`/manage rules |
| Per-post author, three exact counts, media, optional liked/saved/reposted/manage/follow/mentions | `safePost` | public and viewer-specific | awaited by server/API caller | **N+1 fan-out**, same author/follow repeated | database/request amplification; signing URLs adds stage | Batch per page; avoid loading unused engagement data for metadata |
| Post lookup + `safePost` in metadata and page | post detail | metadata public; page optional auth | metadata/page work | overlapping logical reads, no explicit memoization | duplicate enrichment even for SEO | Narrow metadata fetch; request-scope reuse of safe public reads |
| `/api/social/posts` | `SocialHomeFeed` effect | viewer-dependent | feed region after server page | separate main feed, not exact duplicate of JOX/GLIMPS rails | server wait followed by another feed spinner | Consider initial server feed or earlier shell; measure before choosing |
| Profile/Workplace posts API | child feed effect | public + viewer access rules | section only | not equivalent initial server fetch | hydration/network waterfall below identity | Keep section isolated; add bounded error/retry behavior |
| Messages + per-conversation profiles | client MessagesPage | authenticated | conversation list | N+1 profiles; unbounded message select | large inbox slow first render | Pagination + profile batch; terminal failure state |

`safePost` for a public person-authored guest post performs five base DB reads (author, likes count, comments count, media, repost count), before optional mentions and storage signing. Ten such posts therefore imply roughly fifty base reads, **not a measured request count**. Authenticated posts add interaction/manage/follow work; organization manage checks can include profile+membership reads. `accessibleGlimpsPage` and `accessibleJoxPage` sequentially await visibility checks for candidates; public posts pass locally, follower-only posts can add one query per candidate. `/home` requests up to 8 GLIMPS and 10 JOX before rendering.

Returned Supabase errors are frequently treated as empty data/zero counts on landing and identity. That may terminate loading but gives inaccurate empty UI. Social helpers often throw on query errors instead. Neither behavior supplies a bounded deadline for a pending request.

## 8. Loading and failure-state inventory

| Boundary/state | Success | Error/empty behavior | Timeout/terminal gap |
| --- | --- | --- | --- |
| `app/loading.tsx` | replaced when route completes | no own error/empty UI | viewport-height `Loading gigWAY...`; no deadline; navbar/footer remain outside it |
| `app/auth/callback/loading.tsx` | intended logging-in placeholder | no recovery | sibling route is a Route Handler, so this is not a reliable UI for a direct OAuth callback request |
| Server landing/identity/home | return content | often ignore returned errors; social may throw; no custom `app/error.tsx`/`global-error.tsx` found | unresolved awaits keep route fallback pending until infrastructure intervenes |
| Login send/verify OTP | clears loading, transitions/navigates | handles returned SDK errors | no catch/finally for unexpected rejection; no deadline |
| Login Google | provider navigation | returned error clears loading | successful call without completed navigation leaves loading; no deadline/retry recovery |
| `IdentityOnboarding.finish` | clears saving then routes/success UI | HTTP error shown after parsed response | fetch rejection leaves saving=true; username-check rejection also uncaught |
| Navbar | user then optional profile; always renders | no catch; keeps guest/partial state | no full-screen loading; logout can wait on unresolved signOut despite catch |
| `/messages` | clears list loading; no-user clears | returned data errors look empty; unexpected rejection uncaught | no finally/deadline; full page shell still visible |
| `/messages/[userId]` | clears loading after profile/messages | no-user clears; unexpected rejection uncaught | page-wide `if (loading)` placeholder (`:131`) can persist |
| Jobs/gigs/projects `[id]/edit` | clear loading at end of init | redirect branches leave loading true until navigation succeeds | viewport-height placeholders at jobs `:94`, gigs/projects `:88`; no init catch/finally/deadline |
| Main social feed | finally clears loading | error/retry state and empty content | no request deadline; finally cannot run on unsettled fetch |
| Profile social feed | finally clears loading | catch turns failure into loaded empty list | misleading empty; no timeout or explicit error/retry |
| Organization social feed | finally clears loading | distinct error, retry, and empty states | AbortController cancels on cleanup, **not a timeout** |
| Media player/feed loading | media/event-dependent region | player error controls in components | local player overlays, not an auth/global shell gate; no real-device playback test |

The viewport-scale application loading displays identified are the root boundary, callback placeholder, chat initializer, and three marketplace edit initializers. Other `loading` matches are primarily sections, media, or action buttons; they do not gate RootLayout. Auth/network failure must be represented separately from valid anonymous state and legitimate empty data in remediation.

## 9. Service worker/cache audit — read only

`next.config.js:1` enables next-pwa registration and `skipWaiting`, disables it in development, and writes generated output into `public`. Current `public/sw.js` is a generated 26,367-byte worker with 225 precache entries. It calls `skipWaiting`, `clientsClaim`, and `cleanupOutdatedCaches`.

Observed runtime rules:

- `/`: `NetworkFirst`, cache `start-url`, no configured network timeout on that rule.
- Same-origin non-API routes: `NetworkFirst`, cache `others`, 10-second network timeout, 32 entries, one-day age. This broad rule includes auth/onboarding/protected navigation paths; there is no auth-cookie-aware cache partition in the application configuration.
- GET `/api/*` except `/api/auth/*`: `NetworkFirst`, cache `apis`, 10-second timeout, 16 entries, one-day age. Actual callback is `/auth/callback`, not `/api/auth/*`.
- JS: `StaleWhileRevalidate`, cache `static-js-assets`, 32 entries, one-day age; precached hashed chunks are handled by precaching first.
- Cross-origin requests: `NetworkFirst`, 10-second timeout, one-hour age. Broader than necessary for auth-aware resources; actual caching depends on response eligibility.
- Images/styles/fonts/media have additional static runtime rules. Precache includes many route chunks, not just the landing page, adding install traffic.

Installed `node_modules/next-pwa/register.js` initializes an empty 200 `start-url` entry if absent and fetches/caches the start URL on initial install. If its start-URL response redirects, it wraps the redirected body in a 200 response before caching. It also hooks history navigation for start-URL refresh. This means an extra `/` request can happen during registration; authenticated `/` can resolve to `/home`. Under failure, cached start content can be empty, guest content, or a prior redirected app response depending on history. These are code-supported scenarios, not a observed cache dump.

The 10-second timeout is **not** a universal ten-second ceiling: without a usable cache entry, work still relies on the network. `/` has a separate rule without that timeout. A successful fresh install generally needs its own current fetch; old-worker behavior applies to returning/installed clients. `skipWaiting` reduces waiting-worker delay but does not prove all existing pages and chunks are on one build. No custom chunk-load recovery or cache invalidation on sign-in/sign-out was found.

Potential follow-up, report only: explicitly exclude auth/protected HTML and viewer-specific APIs from runtime caching, review public HTML/RSC cache separation, start-URL behavior, update notification/reload coordination, and obsolete-chunk recovery. Verify actual installed-worker version/cache contents on the affected phone before attributing the incident. Do not edit this generated worker during this audit.

Preserved worker SHA-256: `B1E2C71C59683D97B5FB0B649EF2327F279727F980821DC89E0AF3179C4816F6`.

## 10. Mobile, rendering, and bundle findings

The root server shell can render before client auth; page data dependencies still hold back meaningful content. Public identities and landing are not accidentally wholly client-only. Login and message/edit pages do require hydration for their interactions/initial data. Public feeds also depend on hydration for secondary API fetches.

Navbar initially renders guest controls, then adds signed-in controls and mobile bottom tabs after auth. On a slow phone, that transition can last longer. The root async ad script and broad PWA precaching can contend for mobile bandwidth/CPU, but neither was timed or established as the incident cause. Public profile feed statically imports the large social feed module and GLIMPS experience; actual production chunk attribution requires a valid build report. Large source size alone is not measured bundle cost.

Existing stale `.next` manifest points to approximately 10.47 MB of uncompressed files for `/layout` and 10.42 MB for `/login/page`, with overlapping files and absent entries for core audited routes. **These are incomplete development artifacts, not production transferred sizes**, and must not be used as a performance baseline. No production bundle claim is made.

| Width | Browser layout check | Throttled network/CPU |
| --- | --- | --- |
| 320 | Not run | Not run |
| 360 | Not run | Not run |
| 375 | Not run | Not run |
| 390 | Not run | Not run |
| 412 | Not run | Not run |
| 430 | Not run | Not run |

Responsive classes were inspected, but this does not establish overflow-free layout, tap behavior, or visual timing. **No real-device verification or browser/synthetic viewport verification is claimed.**

## 11. Measurements and scenario verification

| Check | Local result | Meaning/limit |
| --- | --- | --- |
| Installed SDK empty cookies: getSession then getUser | 1.07 ms total, zero intercepted network calls in one run | anonymous-state SDK behavior only; not document TTFB or browser auth time |
| Actual landing function with all query promises held | seven queries started; no return after 100 ms observation; returned after release | directly demonstrates static hero coupled to query settlement; artificial hold, not measured real latency |
| Guest `/workplaces` page function | `/login?next=/workplaces` | real source with mocked auth/navigation |
| Completed regular post-login with next | `/workplaces` | intended success path works in isolated branch check |
| Completed regular post-login without next | `/home` | canonical existing destination confirmed |
| Post-login missing user with next | bare `/login` | destination loss reproduced |
| Completed profile with self-target next | bare `/profile/complete` | unnecessary hop; not proof of infinite loop |
| Return helper normal external URLs/backslash | rejected to `/home` | expected baseline behavior |
| Return helper embedded tab path | accepted; URL parser resolves externally | validation gap reproduced; browser router exploit untested |
| Current worker inventory | 26,367 bytes, 225 precache entries | local worker only; not remote deployed worker |

Scenario coverage requested:

- **A, brand-new guest `/`:** source trace + SDK and held-query isolated checks. No browser timing.
- **B, guest public identity:** complete source trace; no live identity fixture/browser rendering.
- **C, guest protected route:** `/workplaces` redirect branch checked; middleware protected-path construction inspected.
- **D, login to intended route:** post-login branches checked; OTP/OAuth issuance, exchange, session persistence, and onboarding submission not executed against real services.
- **E, logged-in `/`:** source confirms redirect `/home`; no authenticated browser.
- **F, logged-in protected route:** source trace; completed post-login routing checked, protected data rendering not live-tested.
- **G, auth/network failure:** missing-user destination-loss branch checked; indefinite landing promises held; client rejection handling inspected. No browser fault injection.

Initial document response, meaningful-paint time, actual global-spinner duration, authenticated auth duration, total initial network requests, real profile/auth HTTP counts, and end-to-end redirect counts are **unmeasured**. Logical query counts and branch checks above must not be represented as those metrics. No production account or database was touched to obtain fixtures.

## 12. Minimal remediation plan — not implemented

1. Keep the existing `next`/`safeReturnTo` mechanism. Harden its normalization/security checks; preserve destination on every login/onboarding/error path; replace legacy `redirect` producers; preserve query/hash where applicable. Define admin destination precedence explicitly. Add focused redirect/security tests.
2. Make the landing hero independent of optional count/list queries. Give public identity/Workplace headers and their sections separate loading/error boundaries. Resolve optional Follow/Manage state without holding public content; retain server/API authorization and anonymous public RLS constraints.
3. Correct middleware cookie propagation, including redirect responses, and distinguish no session from auth-service failure. Reuse verified request viewer state where practical; do not trust cookie `getSession` alone for protected data. Avoid adding a global blocking AuthProvider.
4. Bound critical network operations and provide recoverable terminal states. Add try/catch/finally for login/onboarding/message/edit initializers; distinguish error from empty. Add route error recovery. Choose deadlines from measurements rather than arbitrarily timing users out.
5. Split `/home` shell/main feed from optional recommendations/counts/media rails. Batch `safePost` author/count/interaction reads and access checks with unchanged visibility enforcement. Remove duplicate connection lookup and unnecessary full post serialization in metadata.
6. Address service-worker configuration/lifecycle in a **separate approved implementation**, preserving the unrelated current `public/sw.js` change. Test a returning client across deployments, cached guest/auth transitions, offline state, slow network and missing chunks.
7. Verify in an isolated local/staging environment with fixture users, mocked or nonproduction services, browser tooling and all six requested widths. Capture document TTFB, meaningful UI, spinner time, auth/profile counts, redirect chain and request waterfall. Then obtain a real affected-phone trace/cache version; do not label desktop throttling real-device validation.

Steps 1–5 can be done without DB changes. Batching may later justify indexes or a read-only aggregate RPC, but there is no query-plan evidence here requiring either. **No migration/RLS relaxation is required or proposed for this first pass.** Authorization for private posts, organization management, protected APIs, and profile privacy must remain intact.

## 13. Exact source owners for implementation review

- Boot: `middleware.ts` (`middleware`, `config`); `app/layout.tsx` (`RootLayout`); `app/loading.tsx` (`RootLoading`); `components/layout/ThemeProvider.tsx`; `components/layout/ModernNavbar.tsx` (mount effect, logout).
- Auth/routing: `lib/supabase/server.ts`, `lib/supabase/client.ts`, `lib/auth/return-to.ts`; `app/login/page.tsx` (`handleSendOtp`, `handleVerifyOtp`, `handleGoogle`); `app/auth/callback/route.ts` (`GET`); `app/auth/post-login/page.tsx` (`PostLoginPage`); `app/profile/complete/page.tsx`; `app/onboarding/page.tsx`; `components/identity/IdentityOnboarding.tsx` (`finish`, username effect).
- Public content: `app/page.tsx`; `components/home/FeaturedFreelancers.tsx`, `OrganizationsPreview.tsx`; `app/u/[username]/page.tsx`; `components/organizations/PublicWorkplace.tsx`; `lib/organizations/public.ts`; `lib/connections/server.ts`.
- Authenticated home/social: `app/home/page.tsx`; `lib/social/server.ts` (`safePost`, `canViewPost`, `canManagePost`, `accessibleGlimpsPage`, `accessibleJoxPage`); `app/social/{explore,glimps,vijox}/page.tsx`; `app/social/posts/[id]/page.tsx`; `app/api/social/posts/route.ts`; `components/social/{SocialHomeFeed,ProfileSocialFeed,OrganizationSocialFeed}.tsx`.
- Protected/error paths: `app/workplaces/page.tsx`, `lib/organizations/server.ts`; `app/messages/page.tsx`, `app/messages/[userId]/page.tsx`; `app/{jobs,gigs,projects}/[id]/edit/page.tsx`; `app/dashboard/page.tsx`, `app/verify/page.tsx`, `app/admin/layout.tsx` and individual admin guards.
- Cache: `next.config.js`; `public/sw.js` read only; installed `node_modules/next-pwa/register.js` and Supabase auth/SSR source read only.

## 14. Review handoff and working tree

Only this audit document was added by this task. No implementation, build, staging, reset, cleanup, stash, commit, push, deployment, or migration was performed. Existing work remains:

```text
 M public/sw.js
?? docs/p0-first-load-auth-audit.md
?? docs/workplace-phase4-audit.md
?? supabase/audits/
```

Stop here for review before remediation.
