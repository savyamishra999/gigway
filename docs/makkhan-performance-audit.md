# GigWay “Makkhan” Performance and Loading Audit

**Status:** Audit and measurement only. No application code, service worker, schema, RLS, migration, remote data, commit, push, or deployment change was made.

**Baseline revision:** `8fb628a` on `main`.

## 1. Executive summary

GigWay already has a useful streaming foundation: the guest landing hero has no database dependency, Home renders its heading before the feed, and the public Professional Identity defers counts, viewer controls, offers/opportunities, and social content. All inspected remote operations use finite recovery ceilings. The synthetic browser completed every tested route and auth journey without an infinite loader or horizontal overflow.

The largest remaining user-perceived delay is data fan-out rather than one large asset. Home’s principal feed boundary waits for nine discovery queries, a subsequent people-intents query, two media-page queries, and per-post serialization. Social serialization is the most severe database pattern: each post can generate roughly ten enrichment queries, additional media URL work, a follow lookup, and a mention query. Pages serialize posts concurrently, but this still produces a high query count and connection pressure.

Auth is resolved repeatedly. Middleware calls `getSession()` for every route that is not in its narrow public allowlist, including `/home` and apparently `/api/*`; server pages or API handlers then call authoritative `getUser()`; the global client navbar calls browser `getUser()` and then reads the profile. This preserves security, but adds repeated auth network work and makes every authenticated route/API sensitive to Supabase latency.

The protected pre-existing service worker is the highest production-specific risk. Its current generated rules use NetworkFirst for `/`, all same-origin navigations, and most GET `/api/*` requests, with URL-only cache keys. If the network exceeds its ten-second timeout or fails, a cached guest root response could coexist with a client-recovered authenticated navbar. Cached user-specific GET API data may also survive an account switch in the same browser. This is an inference from the inspected worker; the deployed worker and real production behavior were not verified.

**Verdict: READY FOR PERFORMANCE IMPLEMENTATION**, beginning with service-worker/cache isolation, middleware scope, and social serialization. Production measurement must accompany the implementation because local mocked Supabase cannot establish real network/database latency.

## 2. Evidence labels and limits

- **LOCAL MEASURED:** Headless Chromium against Next development server and a local mocked Supabase server.
- **SYNTHETIC MEASURED:** The same browser with 4× CPU, 150 ms latency, approximately 1.6 Mbps down and 0.8 Mbps up.
- **INFERRED FROM CODE:** Query counts, dependencies, cache behavior, waterfalls, and bundle structure.
- **NOT VERIFIED IN PRODUCTION:** Real Vercel/Supabase latency, deployed service-worker version, cache contents, real dataset query plans, Core Web Vitals, physical-device behavior.

Development compilation heavily distorts the first sample. Cold compilation numbers are recorded separately and are not treated as production performance.

FCP, LCP, DOMContentLoaded, load-event time, hydration time, request count, transfer bytes, and production bundle sizes were **NOT MEASURED reliably**. The existing harness exposes navigation TTFB and functional completion. No unsupported metrics are invented.

## 3. Baseline measurements

Fresh run: `C:\Users\Admin\AppData\Local\Temp\gigway-p0-qa-tav0hr\report.json`.

### Warm local development TTFB

| Route | Warm samples (ms) | Observed range | Evidence |
|---|---:|---:|---|
| Guest `/` | 438, 540, 543, 562, 573, 587 | 438–587 | Local measured, mocked DB |
| `/u/qa-person` | 221, 232, 254, 273, 289, 294 | 221–294 | Local measured, mocked DB |
| `/u/qa-workplace` | 204, 214, 232, 234, 240, 244 | 204–244 | Local measured, mocked DB |
| `/login` | 210, 223, 235, 242, 263, 276 | 210–276 | Local measured |

### Cold development compilation samples

| Route | TTFB |
|---|---:|
| `/` | 2,894 ms |
| `/u/qa-person` | 2,657 ms |
| `/u/qa-workplace` | 1,364 ms |
| `/login` | 493 ms |

These reflect just-in-time development compilation and must not be compared with a production build.

### Throttled synthetic landing

With 4× CPU, 150 ms latency and approximately 1.6 Mbps down, the warmed mocked guest landing reported **499 ms TTFB**. This is not equivalent to Indian 4G/5G and does not include a remote Supabase hop.

### Functional baseline

- 320, 360, 375, 390, 412, 430, and 1280 px passed with no horizontal overflow.
- Guest landing, person profile, Workplace, login, authenticated root, protected deep link, refresh, account-switch choices, direct login, new-user onboarding, photo skip, query failure, and retry passed.
- Browser exception count: zero.

## 4. Current journey map

### A. First-time guest and Google signup

1. `/` middleware calls `getSession()` because root deliberately owns guest/auth selection.
2. Guest request continues to the server landing page.
3. Hero can stream without a database query. Stats, opportunities, people, and Workplaces sit in independent Suspense boundaries.
4. Navbar hydrates, calls browser `getUser()`, and remains optional chrome.
5. `/login` is middleware-public and client-rendered; it resolves any current browser user before showing account choices.
6. Google callback exchanges the code for a session, reads `profiles`, and creates a missing profile with service role when necessary.
7. Callback redirects to `/auth/post-login`.
8. Middleware resolves session again; post-login calls `getUser()` and reads `profiles` again.
9. Incomplete identity redirects to `/profile/complete`.
10. Middleware resolves session; page calls `getUser()`, reads profile, then reads intents.
11. Username input uses a 350 ms debounce. Availability endpoint performs auth plus canonical person/Workplace collision checks.
12. Submit endpoint authenticates, reads/possibly creates profile, validates username again, updates profile, reads intents, deactivates current modes, then updates/inserts modes serially.
13. Client replaces destination with `/home`; Home auth and data journey begins.

### B. Returning authenticated root

1. `/` middleware refreshes/reads cookie session.
2. Authenticated session redirects directly to `/auth/post-login`.
3. Post-login middleware resolves session again.
4. Post-login server page calls authoritative `getUser()` and reads minimum profile state.
5. Completed identity redirects to preserved destination or `/home`.
6. `/home` middleware resolves session again; page calls cached-per-render `getViewer()` (`getUser()`).
7. Navbar hydrates and independently calls browser `getUser()` plus profile lookup.

There are at least three document navigations (`/`, `/auth/post-login`, `/home`) and repeated session/profile work. The gate is correct but visibly sensitive to auth latency.

### C. Returning guest

Root middleware performs one session check. Landing Hero is immediately renderable after that check. Below-fold public data streams independently. Navbar performs a later browser auth reconciliation.

### D. Protected deep link

Middleware checks session, redirects guest to `/login?next=...`, callback preserves `next`, post-login performs identity gate, then redirects to the exact path/query. Synthetic QA verified `/workplaces?tab=active` survives OTP and refresh.

### E. Public Professional Identity

1. `/u/*` skips middleware session refresh.
2. Anonymous public profile lookup blocks identity existence.
3. If no person is found, Workplace lookup follows sequentially; authenticated-only fallback adds `getUser()` then session profile lookup.
4. For a person, intents and memberships run concurrently but block the header because the header displays them.
5. Counts, viewer actions, offers/opportunities, and social owner resolution are separate Suspense work.
6. Social tab data starts client-side after hydration through `/api/social/profiles/{id}/posts`.

### F. Home

Middleware session → server `getUser()` → shell heading. Completion, feed, and activity are separate Suspense children. The main useful feed boundary is still large and query-heavy.

### G. Social

Public social routes skip middleware auth refresh, but API calls generally do not. Client feed requests hit an API route; middleware may call `getSession()`, route calls `requireSocialUser()`/`getUser()`, then post access and serialization fan out.

### H. Account switch

Login offers explicit chooser. Callback exchanges the selected account, then canonical post-login/profile gate routes to that account. Navbar subsequently performs browser auth/profile reconciliation. Synthetic QA verifies choices and destination, but real Google A→B→A timing remains production-only.

## 5. Landing `/` findings

### Blocking

- Root middleware `getSession()` is intentionally blocking and bounded.
- Server Hero and static sections have no profile/feed dependency.
- Root layout has no database call. `getActiveMoment()` is local synchronous data.
- Manrope is built by `next/font`; font files are local build assets.

### Deferred below fold

- Stats: four concurrent head-count queries.
- Opportunities: Jobs, Projects, and Gigs concurrently, six rows each.
- Featured professionals: one bounded query.
- Workplaces: one bounded query.

Total landing database operations: **nine** across four independent boundaries. They do not need to block Hero, though the generated response remains open while streams finish.

### Client/network

- Global navbar hydrates and calls browser auth even on guest marketing pages.
- Third-party AdSense script is `async`, but adds network/CPU work globally even where no immediate ad is needed.
- Logo uses `next/image`; many below-fold cards use raw `<img>` without intrinsic dimensions.

## 6. Auth and session findings

| Layer | Current operation | Finding |
|---|---|---|
| Middleware | `auth.getSession()` for every non-public path | Required for routing, but scope includes `/api/*` and many routes whose handler authenticates again |
| Server pages | cached `getViewer()` → `auth.getUser()` | Authoritative and correct; React cache deduplicates only within one render/request tree |
| API handlers | direct `getUser()`/`requireSocialUser()` | Correct but may follow middleware session call on the same request |
| Navbar | browser `getUser()`, then profile | Duplicates server knowledge after hydration on nearly every page |
| Root | middleware session decision | Prevents stable guest landing for authenticated cookies under normal network behavior |

The security model must remain authoritative. The opportunity is request-scope propagation and narrower middleware matching, not trusting localStorage or an unsigned header.

Recovery ceilings are 60 seconds per bounded fetch and 120 seconds per operation. They prevent infinity but are long enough to feel frozen. Future UI must expose meaningful shell/retry well before the technical ceiling.

## 7. Callback and post-login findings

Existing user normal path:

1. OAuth code exchange (security-critical).
2. Callback profile read.
3. Redirect to post-login.
4. Middleware session read.
5. Post-login `getUser()`.
6. Post-login profile read.
7. Redirect destination.

The callback profile read is used mainly to ensure/create a new profile; existing users are routed through post-login regardless, so existing-user profile completion data is read again in post-login. New users may also incur referral lookup and three concurrent referral writes before redirect.

Potential future fix: callback should perform only exchange plus minimum ensure operation, while one canonical gate owns the completion read. Any consolidation must preserve cookie propagation and error semantics.

## 8. Onboarding findings

- Initial page blocks on `getUser()`, one profile read, then one intents read. The intents read is sequential even when ordinary first-time flow does not require a work role.
- Username availability is correctly debounced by 350 ms and revalidated on submission. The duplicate collision check is required for correctness, not waste.
- Collision checks cover people and Workplaces through the canonical helper.
- Image upload is user-triggered and does not block Name/Username editing. The final button disables only while upload/import/save is active.
- Completion endpoint performs serial intent updates/inserts per selected mode. Maximum mode count is small, but it lengthens submit latency.
- Client `router.replace()` plus `router.refresh()` can cause closely spaced navigation work; exact duplication was not measured.

## 9. Home exact dependency map

### P0 — first useful screen

| UI | Dependency | Boundary | Current behavior |
|---|---|---|---|
| Navbar shell/logo/navigation | Client JS; auth optional | Root layout | Renders without navbar auth; profile/avatar arrive later |
| Welcome heading | Server `getViewer()` | Page root | Page waits for authoritative user before shell heading |
| Primary feed shell | `HomeFeed` fallback | Suspense | Shows “Loading your feed...” |

### P1 — should appear soon

`HomeContent` starts media immediately, then concurrently reads:

1. Current profile.
2. Up to 60 Jobs.
3. Up to 60 Projects.
4. Up to 12 Services.
5. Up to 60 people.
6. Up to 60 organizations.
7. All followed profiles for viewer.
8. All followed organizations for viewer.
9. Active viewer intents.

After all nine resolve, it performs a **sequential** `profile_intents IN (up to 60 people)` query. It then waits for media:

- GLIMPS candidate query (up to 33 rows), visibility batching, then `safePost` per selected post.
- JOX candidate query (up to 41 rows), visibility batching, then `safePost` per selected post.

Only after recommendation ranking and media serialization does `SocialHomeFeed` render. One slow discovery family delays opportunities, network suggestions, JOX, GLIMPS, and the feed shell together.

### P2 — may load later

- Completion prompt: profile plus active-intent query concurrently.
- Activity: unread messages, applications, proposals counts concurrently.
- Client social discover feed fetch begins after `SocialHomeFeed` hydration.

### P3 — optional/below fold

- Additional feed pages, full explore lists, media playback, and rich interactions.

### Earliest useful point

Home becomes visually identifiable when the authenticated page heading streams. It becomes functionally useful only when the large HomeFeed boundary resolves or the client discover feed later returns. The current skeleton is a generic section status, not a stable feed/opportunity layout.

## 10. Public profile findings

Blocking path for a person is profile lookup → concurrent intents/memberships → header. This is three queries, with the latter two intentionally supplying header data. Person/Workplace resolution is sequential when the username belongs to a Workplace.

Deferred work:

- Counts: three concurrent count queries.
- Viewer actions: cached `getUser()`, then connection and follow concurrently.
- Offers/opportunities: three concurrent, two-row queries.
- Social ownership: `getUser()`.
- Social tab: client API after hydration.

The newly finalized header does not wait for counts, relationship state, listings, or social feed. Avatar uses raw `<img>` inside a fixed 96×96 container, so layout is stable but remote image optimization/caching is browser/origin dependent.

## 11. Social findings

### P0 query fan-out

`safePost()` performs, per post, up to ten concurrent operations:

1. Profile author or organization author.
2. Like count.
3. Comment count.
4. Viewer liked state.
5. Viewer saved state.
6. Media rows.
7. Manage authorization; organization posts may add membership lookup.
8. Repost count.
9. Viewer repost state.
10. The alternate author branch resolves locally, but one author query always runs.

It then may perform:

- One signed URL request per non-public/media item.
- One author-follow lookup.
- One mention-profile query.

Ten posts can therefore create roughly 100 enrichment queries plus media/follow/mentions. They run concurrently across posts, which reduces wall-clock waterfalls but risks database connection pressure and tail latency.

### Access waterfall

- Discover API fetches 16 candidates, then calls `canViewPost()` **serially** for every candidate. Restricted posts may each cause a follow query.
- Profile tab fetches up to 41 candidates and also checks `canViewPost()` serially until 11 visible records.
- `visiblePosts()` already demonstrates a safer batched visibility approach for JOX/GLIMPS.

### Existing batching

- Reply previews use one comments query and one author query for the page.
- VIJOX timed reactions use one page-level query.
- Following feed batches followed IDs and initial activity queries.

### Payload/media

- Candidate fetches use `SOCIAL_POST_FIELDS`, not `*`, which is good.
- Public audio/video uses a stable public-delivery route; private media needs signed URLs.
- Home GLIMPS rails set `preload="metadata"` on multiple videos, causing early range requests before interaction.
- Audio/video players also preload metadata, reasonable on detail playback but expensive when many cards mount.

## 12. Navbar findings

The navbar synchronously needs only structure, links, logo, and current route. User/profile data is enhancement. It currently:

- Creates a browser Supabase client during component render.
- After hydration calls `getUser()`.
- If authenticated, performs a profile read for Name, username, and avatar.
- Subscribes to auth changes.
- Can document-replace root based on client auth reconciliation.

It does not fetch notifications/messages counts, which is good. Its duplicate auth/profile work is a meaningful global cost and a cause of visible guest→authenticated chrome changes.

## 13. Database query map summary

| Route | Table/operation | Scope | Blocking | Index evidence |
|---|---|---:|---|---|
| `/` middleware | Auth session | 1 session | Yes | Auth service, not repository index |
| `/` stats | profiles/gigs/jobs/projects counts | full filtered counts | No | Status/profile-completed composite coverage UNKNOWN |
| `/` opportunities | jobs/projects/gigs | 6 each | No | Featured job index known; status+created indexes UNKNOWN |
| `/` people/orgs | profiles/organizations | 6 each | No | ordering/filter indexes UNKNOWN |
| `/auth/post-login` | profiles by PK | 1 | Yes | profiles PK assumed from active schema usage |
| `/profile/complete` | profiles, profile_intents | 1 + user intents | Yes | profile_intents profile index not found in inspected migrations: UNKNOWN |
| `/home` | discovery tables listed above | up to 60/60/12/60/60 + follow sets | Feed boundary | Followed-side indexes known; follower-user-side indexes not established |
| `/home` media | posts + visibility + per-post enrichment | up to 33/41 candidates, 8/10 output | Feed boundary | posts partial/author/content-format indexes partly known |
| `/u/{username}` | profiles username | 1 | Yes | username unique/index status UNKNOWN from repository migrations |
| `/u/{username}` | intents + memberships | profile scope | Yes for header | index status UNKNOWN |
| profile secondary | connections/follows/work | bounded counts/2 rows each | No | connection indexes partial; ownership/status composite indexes UNKNOWN |
| social discover | posts candidates | 16/page | API response | `posts_created_idx`; content-format composite coverage only GLIMPS known |
| social serialization | likes/comments/saves/media/reposts/authors/follows | per post | API response | many single-table indexes known, but fan-out dominates |

Known repository indexes include published post creation, post authors, post media, post likes, post comments, post saves by user/post, followed-profile and followed-organization directions, reposts, selected connections, organization ownership, marketplace shares, GLIMPS discovery, and VIJOX reactions. Real deployed index state and `EXPLAIN ANALYZE` were not checked.

## 14. Network/API waterfall ranking

1. **Social:** API auth → candidate posts → serial visibility → per-post parallel enrichment → signed URLs/follow/mentions → reply previews/reactions → JSON.
2. **Home:** page auth → nine discovery queries → people intents → wait for media serialization → hydrate SocialHomeFeed → client discover-feed API → another social serialization chain.
3. **OAuth:** exchange → callback profile read/ensure → post-login navigation/auth/profile → destination navigation/auth/page queries.
4. **Root authenticated:** root session → redirect → post-login session/getUser/profile → redirect → Home session/getUser.
5. **Navbar:** server page work → hydration → browser getUser → client profile.
6. **Workplace username:** person lookup miss → organization lookup.

## 15. JavaScript and bundle findings

- Root layout always includes client `ThemeProvider` and a large client `ModernNavbar`, so every page hydrates navbar auth and navigation behavior.
- Home imports `SocialHomeFeed`, a large client module containing feed interactions, cards, media experiences, opportunities, and network UI. Structural evidence suggests a broad hydration boundary.
- Profile social tabs similarly load the shared SocialHomeFeed card implementation.
- Creator/recording code is route-local; no evidence shows OpenAI/admin server modules leaking into user client bundles.
- Login page is entirely a client component and includes both presentation and auth state.
- Exact route chunk bytes and parsed/executed JS are **NOT MEASURED**. The protected service worker’s precache manifest lists many route chunks, but that is not proof they are downloaded on first navigation.

## 16. Images, media, fonts, CSS

- Manrope has five requested weights, generating several local font files. Exact transferred bytes not measured.
- Navbar/onboarding logos use `next/image` with dimensions; many avatar/feed/landing cards use raw `<img>`.
- Fixed avatar/card containers reduce layout shifts, but remote image dimensions and responsive source selection are absent for raw images.
- GLIMPS rail preloads metadata for every mounted preview. This can create multiple range requests on Home before play.
- JOX/audio and full video players preload metadata; detail usage is reasonable.
- YouTube iframe uses lazy loading.
- Global CSS includes decorative gradients and animations; reduced-motion handling exists. These effects are unlikely to block data but can consume low-end GPU/CPU.
- Global async AdSense is non-render-blocking by attribute, but still adds third-party network and script execution.

## 17. Suspense, loading, and error architecture

| Area | Classification | Reason |
|---|---|---|
| Landing Hero vs data | GOOD BOUNDARY | Hero independent; four below-fold streams |
| Home completion/activity | GOOD BOUNDARY | Secondary modules fail independently |
| HomeFeed | TOO BROAD | Opportunities, network, JOX, GLIMPS, and feed preparation share one boundary |
| Public profile secondary sections | GOOD BOUNDARY | Counts/actions/work/social deferred |
| Public profile identity + intents/membership | ACCEPTABLE BUT BLOCKING | Header requires affiliation/intents; could stream base identity sooner |
| Social `safePost` | TOO GRANULAR AT DB LEVEL | Component boundary fine; data layer fans out per post |
| Route-level loading/error | MISSING/THIN | No current source `app/**/loading.tsx` or `error.tsx` was found; precache manifest references an older `app/loading` artifact, so deployed/current source mismatch must be checked |

`SectionUnavailable` and retry links prevent many secondary failures from taking down the page. Home catches the whole HomeFeed and replaces it with retry UI. Middleware returns finite 503 on session failure. Some server page primary-query failures throw into the nearest Next error boundary, whose current source coverage is unclear.

## 18. Caching and service-worker findings

### Next/React/Supabase

- `getViewer()` uses React `cache()` for request-tree deduplication, not cross-user persistence.
- No application `unstable_cache` or explicit data revalidation was found on critical user-specific routes.
- Supabase calls are dynamic under cookie/header use. User-specific results must not enter shared cross-user caches.
- Safe cache candidates: local Moment config, public static marketing copy, public listing snapshots with explicit short revalidation and RLS-safe fields.
- Never shared-cache: viewer, navbar identity, completion, activity, relationship state, notifications, messages, private/follower feeds, signed URLs.

### Protected `public/sw.js` — inspect only

The worker:

- Precaches a very large set of route chunks/static assets.
- Registers `/` as NetworkFirst.
- Registers all non-API same-origin GET navigations as NetworkFirst with a ten-second network timeout.
- Registers most GET `/api/*` as NetworkFirst with URL-only cache keys; it excludes `/api/auth/*`, but GigWay auth routes are primarily `/auth/*` and Supabase is cross-origin.
- Uses stale-while-revalidate for JS/CSS/Next data and media caches.

Plausible effects:

1. On timeout/offline, cached guest `/` HTML can be returned while browser Supabase later recovers an authenticated session, producing authenticated navbar plus landing body.
2. Cached navigation HTML can outlive a deployment until network succeeds and cache updates.
3. Cached GET API responses keyed only by URL can cross account switches on the same browser during fallback, exposing stale account-specific data.
4. NetworkFirst can add up to ten seconds before fallback on poor networks.

This is **P0 code evidence and risk**, not confirmation of the deployed worker. Future work must inspect registration/update lifecycle and production Cache Storage. The protected file was not modified.

## 19. Failure and timeout findings

- Slow/failed middleware auth returns a 503 with retry guidance instead of guest HTML. Primary UI does not survive this case because routing cannot safely proceed.
- Landing secondary query failures render bounded unavailable sections; Hero survives.
- Home secondary completion/activity failures disappear or show retry; heading survives.
- Home main feed failure shows `SectionUnavailable`; opportunity/network/media content is lost together.
- Public profile count/action/work failures do not remove identity header.
- Social client tabs expose retry after API failure.
- Existing synthetic database failure and recovery passed.
- No true slow-auth injection was measured; bounded behavior is source-verified.
- 60/120-second technical deadlines remain an excessive perceived wait if no earlier state change occurs.

## 20. Target rendering sequences

### Guest landing

T0 navigation feedback → T1 logo/nav + Hero → T2 static value proposition → T3 below-fold stats/opportunities → T4 people/Workplaces. Guest navbar should not require auth JS for Hero readiness.

### Authenticated root

T0 navigation feedback → T1 single authoritative session decision → T2 single canonical identity gate → T3 Home shell. Avoid an extra full document hop where cookie propagation does not require it.

### Home

T0 route feedback → T1 navbar/shell + Welcome heading → T2 stable feed/opportunity skeleton → T3 first standard feed page or opportunity cards → T4 network suggestions → T5 JOX/GLIMPS/completion/activity.

### Public profile

T0 route feedback → T1 avatar/name/username/headline → T2 affiliation/intents/actions → T3 professional sections → T4 offers/social/counts.

### Social

T0 route shell → T1 first authorized post batch with batched author/count/state/media data → T2 reply/reaction previews → T3 media metadata only near viewport/interaction.

## 21. Ranked bottlenecks

| Priority | Route | Root cause/evidence | User symptom | Proposed fix | Impact | Risk | Schema needed |
|---|---|---|---|---|---|---|---|
| P0 | Global/production | Service worker caches root, navigations, and user-specific GET APIs | Stale page, hybrid auth/body, cross-account stale data, 10s fallback | Versioned cache policy; never cache auth/user-specific APIs or authenticated navigations; explicit cache cleanup/update QA | Very high | High; preserve offline/public behavior | No |
| P0 | Social/Home | `safePost` per-post query fan-out | Feed waits, DB tail latency, connection pressure | Page-level batch serializer for authors, counts, viewer states, media, permissions, follows, mentions | Very high | High; visibility/RLS must remain exact | No initially |
| P0 | Middleware/API | Middleware `getSession()` appears to run for `/api/*`, then handler `getUser()` | Every API pays duplicate auth network work | Exclude safe API paths from page-routing middleware; keep handler auth authoritative | High | Medium; route audit required | No |
| P0 | Home | Nine discovery queries + sequential intents + media serialization in one boundary | Generic feed loader; no partial usefulness | Split standard feed, opportunities, network, JOX, GLIMPS into independent boundaries; start independent work concurrently | High | Medium | No |
| P1 | Root/auth | `/` → post-login → Home repeats session/profile work | Login feels like multiple searches/redirects | One canonical post-login decision; remove redundant existing-user callback profile read; preserve cookie refresh | High | Medium-high | No |
| P1 | Social | Serial `canViewPost` loops | Candidate-dependent API latency | Reuse batched `visiblePosts` semantics for standard/profile feeds | High | High security sensitivity | No |
| P1 | Navbar | Browser `getUser()` + profile on every page | Auth chrome pops in; duplicated requests | Seed minimal signed/server viewer state or isolate authenticated navbar layout; retain client subscription | Medium-high | Medium | No |
| P1 | Home | Up to 60 Jobs + 60 Projects + 60 people + 60 orgs per visit | Payload/query/ranking CPU before first content | Smaller candidate windows, separate modules, fetch/rank incrementally | Medium-high | Low-medium | No |
| P1 | Loading UX | No current route-level loading/error files found | Navigation can appear frozen before page stream | Add meaningful route shells and route error recovery | Medium-high | Low | No |
| P1 | Onboarding submit | Serial intent update/insert loop | Slow final “enter” action | Batch safe operations or concurrent bounded writes after profile update | Medium | Medium consistency | No |
| P2 | Public profile | Person miss then Workplace lookup; profile then intents/memberships | Extra RTT on Workplace/header | Parallel namespace lookup where collision invariant permits; stream base header | Medium | Medium | No |
| P2 | Media | Multiple GLIMPS metadata preloads | Extra early requests/data | Intersection-based metadata loading/poster strategy | Medium on mobile | Low-medium | No |
| P2 | Images | Raw remote `<img>` and no responsive variants | Oversized images, decode work | Normalize dimensions/loading and use optimized/public delivery where compatible | Medium | Medium remote-host config | No |
| P2 | Landing | Nine below-fold queries on every visit | Server/database work after Hero | Cache public bounded snapshots with explicit freshness or delay deeper sections | Low first viewport, medium backend | Medium cache correctness | No |
| P3 | Fonts/CSS | Five font weights, global animation/backdrop blur | Extra bytes/GPU on low-end devices | Measure production coverage, subset weights/effects only with evidence | Low/unknown | Low | No |

## 22. Recommended implementation passes

### Pass 1 — correctness and critical latency

1. Audit and correct PWA runtime caching so authenticated HTML and user-specific APIs cannot be served across sessions.
2. Narrow middleware execution for API/static/public routes while retaining authoritative handler auth.
3. Replace serial visibility and per-post `safePost` fan-out with batched page serialization.
4. Add instrumentation around middleware auth, post-login, Home modules, and social stages without logging secrets.

Likely files:

- `next.config.js` and the PWA runtime-caching source/config; `public/sw.js` only through reviewed regeneration, never hand-edit.
- `middleware.ts`.
- `lib/social/server.ts`.
- `app/api/social/posts/route.ts`.
- `app/api/social/profiles/[id]/posts/route.ts`.
- Social regression tests and browser QA scripts.

### Pass 2 — Home concurrency and perceived readiness

1. Split Home opportunities, network, standard feed, JOX, and GLIMPS into independent server/client boundaries.
2. Reduce candidate windows and remove the sequential people-intents dependency from the first feed result.
3. Render stable module skeletons immediately.
4. Keep completion and activity secondary.

Likely files: `app/home/page.tsx`, `components/social/SocialHomeFeed.tsx`, new small Home server components, `components/layout/SectionStatus.tsx`, route loading/error files.

### Pass 3 — auth/navigation consolidation

1. Remove duplicated existing-user profile read between callback and post-login.
2. Evaluate direct callback-to-canonical-gate behavior and root redirect count with cookie propagation tests.
3. Give navbar minimal server-resolved identity without blocking public Hero; preserve browser auth reconciliation for safety.
4. Optimize ordinary `/profile/complete` to avoid intent read unless legacy destination requires it.

Likely files: `middleware.ts`, `app/auth/callback/route.ts`, `app/auth/post-login/page.tsx`, `app/profile/complete/page.tsx`, `app/layout.tsx`, `components/layout/ModernNavbar.tsx`, auth tests.

### Pass 4 — media, images, caching, polish

1. Lazy metadata loading for GLIMPS rails.
2. Image dimension/loading audit and responsive delivery.
3. Measure production route chunks and reduce broad client boundaries based on evidence.
4. Add only safe public-data caching with explicit freshness.

Likely files: `components/social/GlimpsRail.tsx`, media/player components, shared avatar/image components, landing public-data components, Next/PWA config.

### Optional database work — separate review only

No migration is required for Passes 1–4. After production query telemetry and `EXPLAIN ANALYZE`, optional composite indexes may help status+created listing queries, profile-intent lookups, follower-user lookups, and standard post discovery. Index need and deployed presence are currently UNKNOWN; do not create them from source inspection alone.

## 23. Expected files for Pass 1

- `middleware.ts`
- `next.config.js`
- PWA runtime-cache configuration/source identified during implementation
- `lib/social/server.ts`
- `app/api/social/posts/route.ts`
- `app/api/social/profiles/[id]/posts/route.ts`
- `scripts/test-p0-social.cjs`
- `scripts/test-p0-auth.cjs`
- `scripts/p0-browser-qa.cjs`
- A dedicated performance measurement script/report if adopted

Any generated `public/sw.js` change requires an explicit reviewed workflow because it is currently protected and locally modified.

## 24. Future acceptance criteria

### Guest landing

- Hero renders without database sections.
- No authenticated navbar + landing body stable state.
- Public secondary failures do not remove Hero.
- Warm and throttled navigation metrics recorded in production-like build.

### Authenticated root and returning user

- `/` never serves guest body for valid cookie session during normal network operation.
- Redirect count and auth/profile calls are instrumented and reduced without weakening validation.
- Refresh and new browser launch reach Home deterministically.

### Google login/new signup/account switch

- A→B and B→A show the correct profile, navbar, Home data, and cache contents.
- Callback cookie exchange, username collision protection, short onboarding, Google-photo protection, and safe destination remain intact.
- Clear/cache fallback tests prove no previous-account API response appears.

### Protected deep link

- Full path and query survive login/callback/post-login.
- No intermediate blank page or infinite loader.

### Home

- Shell and module skeletons appear before recommendations/media.
- Standard feed/opportunities can become useful without waiting for JOX/GLIMPS/network.
- Failure of any secondary module leaves other modules usable.
- Query/stage counts demonstrate removal of per-post fan-out.

### Public profile

- Header renders independently of counts, viewer state, offers, and social content.
- Guest, owner, unrelated, pending, connected, and following states remain correct.
- Slow/failing secondary sections preserve header.

### Social

- Visibility results match current RLS/access fixtures exactly.
- No unauthorized post/media leaks.
- One page uses bounded batch queries rather than per-post queries.
- Feed errors terminate with retry; media metadata waits until near viewport or interaction.

### Slow network and query failure

- Test fast local, production build, 4× CPU/150 ms/1.6 Mbps synthetic, offline cache, and network timeout.
- No infinite loader, permanent blank screen, or ten-second silent freeze.
- Retry recovers without full account-state corruption.

### Security

- No shared cache contains viewer/profile/messages/notifications/private feed/signed URL responses.
- Middleware exclusions do not make protected APIs public; handler auth remains authoritative.
- RLS, account isolation, username namespace, safeReturnTo, and OAuth protections pass regression suites.

## 25. Exact files inspected

Critical files included `middleware.ts`, `next.config.js`, `public/sw.js` (read only), `app/layout.tsx`, `app/page.tsx`, `app/home/page.tsx`, `app/login/page.tsx`, `app/auth/callback/route.ts`, `app/auth/post-login/page.tsx`, `app/profile/complete/page.tsx`, `app/u/[username]/page.tsx`, social feed API routes, `lib/auth/server.ts`, Supabase client factories, `lib/async.ts`, `lib/social/server.ts`, navbar, onboarding, Home landing/data components, profile work/social components, social media players/rails, global CSS, relevant migrations, tests, and QA harnesses.

## 26. Final decision

**READY FOR PERFORMANCE IMPLEMENTATION** with Pass 1 ordered as: service-worker/cache isolation, middleware API scope, batched social access/serialization, and measurement instrumentation. No database migration is required to begin.

## PASS 1 IMPLEMENTATION RESULTS

Pass 1 was implemented locally on 2026-09-22. Navigations and API requests are NetworkOnly in the canonical next-pwa config; a custom worker activation hook removes the former unsafe runtime cache names. API routes are excluded from middleware session work while retaining handler authentication. Social list routes use page-level visibility and a bounded page serializer rather than serial access checks and broad per-post enrichment; exact like/comment/repost head counts remain parallel per post to avoid response-limit truncation without a schema change. Development/diagnostic timing records middleware auth, social visibility, batch serialization, stage counts, signed URL operations, and total API time without secrets or PII.

The complete evidence, limitations, changed files, tests, and controlled regeneration requirement are recorded in [Makkhan Performance Pass 1 Review](./makkhan-performance-pass1-review.md). The generated protected `public/sw.js` was not changed. A real generated-worker lifecycle and production performance remain unverified.
