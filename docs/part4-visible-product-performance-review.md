# Part 4 — visible product performance review

Local review, 2026-10-05. Baseline HEAD: `ea7f46802965d6ef13395877b436ab68027e4b56` (`main`). No commit, push, deploy, migration, schema/RLS change or remote Supabase mutation.

## Evidence rules and baseline

`SOURCE-DERIVED` means inspected source or import boundaries; `MEASURED` means executed local fixtures or browser observations, with the environment specified. `INFERRED` benefits are not timing guarantees. `BUILD-DERIVED` production bundle evidence is **not available**: no production build was run. Browser development bundle transfer sizes must not be treated as production sizes. Prior Mobile Create measurements predate the user's single-column layout request and are not reused as Part 4 results.

Before editing, ran `git status --short`, `git diff --name-status`, `git diff --stat`. Recorded SHA-256 of tracked and untracked files in `C:/Users/Admin/AppData/Local/Temp/gigway-part4-TBuVrw/baseline.json`. No stash/reset/restore/checkout/clean/revert. The Git index and HEAD are not changed.

## Every pre-existing changed/untracked file

| File | Class | Disposition |
| --- | --- | --- |
| `.claude/settings.local.json` | C protected | Byte-preserved; contents not used |
| `components/social/GigVideoPlayer.tsx` | A shared V1 candidate | Existing viewport/deadline video change is relevant to normal post videos. Left byte-preserved and outside Part 4 adoption |
| `components/social/useMediaLoading.ts` | A shared V1 candidate | Self-contained browser hooks used by standard video and dormant players; no imports of dormant components. Left byte-preserved |
| `components/social/SocialHomeFeed.tsx` | D mixed | Existing lazy avatars/post images and dynamic standard video are useful; same diff also includes dormant player/old-rail code. Entire pre-existing diff preserved, not silently adopted as a new Part 4 change |
| `components/ui/profile-avatar.tsx` | A adopted | Existing lazy/async image policy reused. Added square intrinsic dimensions; fixed CSS wrapper still controls rendered size. No dormant dependency |
| `components/social/GlimpsExperience.tsx` | B dormant | Existing viewport/recovery changes untouched |
| `components/social/GlimpsRail.tsx` | B dormant | Existing preview wrapper change untouched |
| `components/social/GlimpsPreview.tsx` | B dormant | Untracked preview component untouched |
| `components/social/JoxCompanionImages.tsx` | B dormant | Existing image loading changes untouched |
| `components/social/JoxOrbitRail.tsx` | B dormant | Existing image loading changes untouched |
| `components/social/VijoxExperience.tsx` | B dormant | Existing audio/image loading changes untouched |
| `docs/makkhan-performance-part3-media-js-review.md` | D historical/mixed | Untracked prior review untouched; not Part 4 timing evidence |
| `scripts/test-part3-media.cjs` | D shared+dormant tests | Executed as extra regression coverage; file untouched |
| `docs/workplace-phase4-audit.md` | C protected | Byte-preserved |
| `supabase/audits/workplace-phase4-catalog.sql` | C protected | Entire pre-existing audits directory preserved |

All pre-existing work remains uncommitted. Only `profile-avatar.tsx` receives a new Part 4 edit among those files. The new visible-route boundary changes do not require adopting any dormant media edits.

## Changes and boundaries

1. `DiscoveryCards` is now a server component. Card layout, name, headline, skills, intents, logo and profile link stay on the server. New `DiscoveryFollowButton` is the client island, receiving only `id`, `name`, `kind`, `initialFollowing`. Existing Follow/Unfollow endpoint, pending state and finite error message are preserved. No mount fetch was added.
2. Discovery avatars/logos have 44×44 intrinsic dimensions, lazy loading and async decode inside their existing 44×44 box. Public professional identity uses 96×96 eager/async avatar; its below-fold Workplace logos use 36×36 lazy/async. Account avatar uses 48×48 eager/async; navbar uses square eager/async, retaining its CSS box. Shared `ProfileAvatar` uses 40×40 lazy/async, retaining caller-supplied CSS sizing.
3. Public Workplace member avatars use 44×44 lazy/async; its header logo uses 96×96 eager/async. Cover decode is async; its existing responsive fixed-height container already reserves layout space. No guessed source image dimensions or new crop policy.
4. `ProfileSocialFeed` dynamically imports the dormant Glimps experience instead of statically importing it into the visible profile entry. Hidden categories remain hidden. Normal GigThoughts/Reposts and owner/visitor controls are unchanged. Full post-feed extraction is deliberately not attempted.
5. My Network initial read coalesces development effect replay with a zero-delay timer and aborts on unmount. Rejected mutations now clear `busyId` in `finally` and surface an error. All three mutation paths use the existing bounded fetch helper. A manual read Retry is available; no timer retry or polling was introduced.
6. My Network repeated profile links and Profile Reposts marketplace links opt out of automatic route prefetch. Evidence is **SOURCE-DERIVED**: two profile links per connection row and one detail link per repost can fan out across a list. Home discovery/opportunity and Work rails already opt out. No global prefetch policy changed; production request savings are **NOT MEASURED**.

Signed and external image URLs pass through unchanged. No Next/Image conversion, auth fallback, role change, new ranking rule or new persistent cache.

| Classification | Components |
| --- | --- |
| MUST HYDRATE | AuthUiProvider/navbar interactions, Follow button, connection actions, feed engagement/tabs, Create choices/composer, relative timestamp upgrade |
| CAN STAY SERVER | Home modules, discovery card bodies (changed), Work previews, identity header/bio/skills, account shell, Workplace header/member card markup |
| CAN DYNAMIC IMPORT | Profile Glimps experience (changed); existing standard/Vijox players and composer Vijox preview already have dynamic boundaries |
| CAN LAZY LOAD | Below-fold discovery/member avatars and Workplace logos; existing shared feed images/media are separate pre-existing work |
| DUPLICATE / UNNECESSARY | Client hydration of static discovery card fields removed; StrictMode My Network initial duplicate coalesced; bulk connection/repost prefetch disabled selectively |

Reduced client component responsibility is **SOURCE-DERIVED**. Runtime CPU, hydration duration, and total RSC byte reduction are not established by a server/client split alone. Server markup still travels in HTML/RSC, and `next/link` retains its own client behavior.

## Route audit

### Home

**SOURCE-DERIVED baseline and preserved result:** one request-scoped viewer lookup; primary posts, Network, opportunities, completion and activity have separate bounded `HomeModule` Suspense boundaries. Primary does not await secondary rails. People/Workplaces currently share one secondary boundary; a slow Workplace lookup can delay People but cannot hold the primary feed. No Home redesign.

People query limit 6; Workplace query limit 6; opportunities fetch 2 jobs + 2 projects + 2 services = 6 total. Follows/intents are batched for returned IDs. No 50–100-row recommendation pool to display six. Normal Discover reads standard posts only, 15 visible per page, up to eight raw windows for sparse visibility. Existing continuation/cursor semantics retained. Jox and Glimps loader invocation = 0 with current product flags. The timed-reactions helper returns immediately for standard posts with no Jox IDs.

SSR `initialPage`, including an empty page, suppresses the initial client Discover request and effect replay. Actual function tests verify this. Discovery markup now stays server-side and its images defer offscreen loading. Existing post image/media dirty changes are not claimed as new Part 4 work.

Remaining costs: `safePosts` batches author/media/follow reads but still performs three exact count queries per post; signing remains per authorized media item. Replacing these safely would require a separate data contract/aggregation review. No unsafe all-row count replacement or signed-URL caching is introduced.

### Network

**SOURCE-DERIVED baseline/result:** People and Workplaces use server loaders, selected tab only, maximum 18 results. Search is a GET form, term bounded to 80 characters and sanitized; no per-keystroke fetch. No load-more control: current copy explicitly says up to 18 matches and asks the user to refine search. Batch relationship lookups avoid a per-card query. Jobs/projects/services remain outside Network.

My Network mounts only on its tab and reads `/api/connections`. It is not duplicate hydration of SSR connection data: no such SSR data exists. Pending/accepted relationship rows and profile hydration are batched, but the existing API has **no explicit pagination/limit**. This is a remaining scalability risk, not presented as an 18-row guarantee. Silently truncating requests/connections was avoided. Abort cleanup, finite mutation failure, manual read retry and selective link prefetch are improved.

### Work and related routes

**SOURCE-DERIVED baseline/result:** `/work` is a public server shell; middleware skips session lookup for it. Jobs/projects/services have independent Suspense rails and each reads ≤6, without a client refetch. Joined poster/provider fields avoid per-card lookups. Stored timestamps render deterministically on SSR; the existing small client timestamp component adds relative age after hydration without an interval. No preview images are currently rendered by Work cards, so there is no Work rail image request to remove.

Jobs/projects selects are narrow; the service preview still selects a whole gig row before projecting a small `WorkPreview`. Existing code supports deployments where `updated_at` is optional. This audit does not assume a new column or change ranking/schema to narrow that selection. Query/row reductions in this pass: **none**. The safe improvement is reduced client card data responsibility, not a claimed SQL win.

Audited `/jobs`, `/projects`, `/gigs`, each corresponding `[id]` detail, and `/freelancers`: SSR initial listing limits 50, 30, 50, and professional tiers 6+10+44. These are full lists rather than six-item rails. Their initial client effects retain SSR data with no unfiltered mount refetch. Filtered queries have no explicit limit and several filter locally; adding a cap would change result completeness/ranking. This remains a documented scalability concern. Some filtered list failures also have older error handling; those components were not rewritten.

Details retain targeted row lookup, application/proposal/owner controls, small related-service/review limits (3/5), and external images in reserved containers. Some metadata/detail fetches repeat fields; no authenticated cross-request cache was added. `/freelancers` uses the existing global shell, but its sequential ranking tiers, viewer/ad work and up to 60 profiles are heavier than `/work`. Ranking and monetization code are preserved, with no new shell or feature.

### Profile/account/Workplaces

`/u/[username]` uses a public RLS client for identity and only falls back to the existing session client when appropriate; no service-role fallback was added. Intents/memberships still precede the identity response. Counts, owner/visitor actions, work previews and social feed are separate Suspense work. Header, headline, About, skills and membership markup remain server-rendered. Personal cover is a fixed-height CSS gradient, not a network image. Work previews read at most 2 of each type. Profile GigThoughts/Reposts are client-fetched paginated content, not an SSR data refetch; existing profile feed lifecycle remains a residual area for deeper race/cancellation review.

`/profile` retains one request-scoped viewer, narrow own-profile query and active Workplace memberships in parallel. Optional Workplaces still hold this account route; unlike Create this is existing account semantics. Only avatar delivery metadata changes here. No Profile V2.

Public Workplace member and opportunity loaders already use ranged queries with lookahead, paired with server pagination. Its visible image fixes preserve header eager loading and defer below-fold member images. Repeated Workplace links retain their existing routing behavior.

### Navbar/Create

Shared browser identity still owns one subscription. Same-account event suppression, bounded profile refresh, account-switch invalidation and request-scoped viewer/client caching are untouched and tested. Scroll listener retains cleanup and passive behavior. Responsive desktop/mobile markup shares identity; no second auth provider is added.

Create remains `/create`, mobile single-column (latest explicit user request), desktop two-column, with **Post a Gig Project**. Four personal actions render before optional Workplace data; unavailable requested Workplace never grants personal/org authorization silently. Composer retains Text/Photo/Video/PDF toolbar, normal submit flow and dynamic Vijox preview. The large composer still contains legacy recording/upload code: splitting it safely is not included in this small pass. Dedicated dormant creator actions remain hidden. No live upload/post creation was performed.

## Failure behavior and tests

New Network requests use existing `boundedFetch` (including response-body completion). Initial cleanup prevents stale aborted reads publishing state. Action catches release busy state; errors require user action to retry. Follow errors remain finite and manual. Home/Work section error boundaries, auth fail-closed behavior and Create's optional-data timeout remain intact.

TypeScript and all requested suites pass after adding `AbortController` to the existing auth-navigation test's simulated environment. Architecture tests now exercise the extracted Follow button and bounded mutation transport rather than the former component location/native-fetch mock.

New `test-part4-visible-performance.cjs`: seven executed groups cover actual bounded Home/Work loaders, zero dormant Home calls, initial Home effect replay with empty/nonempty SSR pages, tiny discovery client props and images, coalesced/cancelled Network mount, failed actions and lack of automatic retry, public Work source guard, optional Create failures and shared avatar behavior. Existing architecture suite also executes discovery queries at both limits 6 and 18 with batched IDs. Tests are local/synthetic, not database query planner benchmarks.

Extra old media suite passes but does not authorize adoption of its dormant edits. No production build was run; generated worker files are not regenerated.

## Browser and preservation evidence

Browser results and exact worker/preservation hashes are recorded below after verification. Harness copies source into OS temp, supplies local mock auth/database, blocks non-loopback browser requests, and starts its own headless Chrome/Next dev processes. No real production credentials or database records are loaded. Baseline mode restores only Part 4 clean-at-start source files from HEAD **inside the temporary copy**, retaining pre-existing media changes. It does not check out or restore the workspace.

## Remaining QA

Production cold/warm route timing, compiled chunk sizes and route-prefetch behavior need a production build/deployment QA pass. Real signed images, storage/CDN latency, multiple accounts and follower/private visibility need staging/production verification. Native lazy-loading thresholds vary by browser/network. Physical Android/iOS, software keyboard, low-memory devices, real post attachments, Follow/Accept/Decline/Disconnect behavior and upload success need manual QA. Local fixtures are not proof of these environments.

## Exact Part 4 file list

These 15 files differ from the start-of-Part-4 snapshot (separate from the pre-existing dirty list above):

- `app/profile/page.tsx`
- `app/u/[username]/page.tsx`
- `components/connections/DiscoveryCards.tsx`
- `components/connections/DiscoveryFollowButton.tsx`
- `components/connections/NetworkClient.tsx`
- `components/layout/ModernNavbar.tsx`
- `components/organizations/PublicWorkplace.tsx`
- `components/social/ProfileSocialFeed.tsx`
- `components/ui/profile-avatar.tsx`
- `docs/part4-visible-product-performance-review.md`
- `scripts/part4-browser-qa.cjs`
- `scripts/part4-browser-scenarios.cjs`
- `scripts/test-auth-navigation.cjs`
- `scripts/test-network-home-architecture.cjs`
- `scripts/test-part4-visible-performance.cjs`

## Worker preservation

Raw SHA-256 before and after are identical:

| File | SHA-256 |
| --- | --- |
| `public/sw.js` | `162b5e156486951569c71f24ca9b8fcab512a792ab9e799dc988747a67c71da3` |
| `public/worker-RIgomFyrnZBIlFiS9JYxC.js` | `83fefb5f49e3eb8c6557ae4f0297db15e3ad9df61953a3064f226bd4de1990cd` |
| `public/workbox-a7e9ed40.js` | `ad3bf626c35248087dd7c47a42e66402b5fc70b40f32f2748f95a7789e1d8ebd` |
| `worker/index.js` | `3ddfbfd9c72bada3b052a587ce5f27560bdfc615ee46a6674063fdd7be809f5e` |
| `next.config.js` | `0534e41ec79df5e3cb37ee95e6d1e59d698f7422106a5092b8cc4087945085dd` |

Policy source remains navigation/API **NetworkOnly**, same-origin `/_next/static/*` **CacheFirst**, start URL precaching disabled. No generated file or policy edit; no viewer-specific response caching introduced. Development QA disables the service worker and does not validate production worker activation.

## MEASURED browser matrix

Artifact: `C:/Users/Admin/AppData/Local/Temp/gigway-part4-browser-VAkMSF/report.json` plus route/width PNGs and `next.log`. Chrome headless, Next development, local mock Supabase, warmed routes, 4x CPU, 800px viewport height, unthrottled loopback for this matrix. Readiness is DOM polling (200ms interval), not LCP or a production timing. Capture window ends 1.8 seconds after first useful marker; counts below are observations during that window, not a promise of full network quiescence or complete hydration. Auth UI can still be settling (visible in the 320 Create screenshot), while ordinary action links already exist.

All 35 route/width checks: no horizontal overflow. All Create pages contain four actions, with last card bottom 483px mobile / 492.4px desktop, above bottom navigation. No runtime exceptions. Visual review included 320 Home/Create screenshots.

First useful content, milliseconds:

| Width | Home post | Network person | Work job | Public profile About | Create actions |
| --- | ---: | ---: | ---: | ---: | ---: |
| 320 | 4233 | 2797 | 3006 | 3151 | 458 |
| 360 | 2592 | 3653 | 3894 | 3433 | 3372 |
| 375 | 4225 | 3179 | 3382 | 3205 | 3661 |
| 390 | 4662 | 3778 | 3505 | 3603 | 3280 |
| 412 | 3838 | 3527 | 3509 | 4003 | 2955 |
| 430 | 3745 | 2650 | 3196 | 3153 | 2846 |
| 1280 | 3281 | 3037 | 2686 | 2413 | 2647 |

390px observation detail (browser request count includes document, dev assets, OPTIONS and blocked external attempts; mock DB request count excludes auth):

| Route | Shell ms | Useful ms | Browser requests | Images requested | Mock DB reads | Auth user reads | Requests after useful marker |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| /home | 4627 | 4662 | 22 | 6 | 25 | 2 | 5 |
| /network | 3758 | 3778 | 25 | 9 | 4 | 2 | 6 |
| /work | 666 | 3505 | 18 | 2 | 4 | 1 | 6 |
| /u/qa-person | 3524 | 3603 | 20 | 3 | 20 | 3 | 6 |
| /create | 3164 | 3280 | 19 | 2 | 2 | 3 | 7 |

At 390px there are no repeated identical `(method, table, query)` mock DB requests in those windows. Home initial `/api/social/posts?feed=discover` requests = **0** across all widths. Profile performs one expected client posts request; Create performs one expected optional Workplace request when captured. Home/Network commonly have one server viewer check plus one global browser identity check, rather than duplicate component auth subscriptions. Hard-loaded public Work has one **browser** identity check for navbar and no server/middleware viewer check. Development StrictMode, warm sessionStorage and prior qualified-view recording affect totals; no claim of zero requests after hydration.

Observed layout-shift entry sums (not full-session Web Vitals CLS): Home/Network/profile/Create mobile 0, desktop approximately 0.00146. Work ranges 0?0.0796 as streamed rails replace small loading fallbacks; this existing non-image shift remains. No claim of zero CLS or improvement to those placeholders.

With a five-second secondary Workplace delay, Home primary was ready before the Network boundary in the browser. Two earlier harness attempts failed with CDP navigation timeouts (reports `yTmVFv`, `GvU8Fy`); replacing global Fetch interception with direct HTTPS blocking allowed the complete matrix. These were harness failures, not evidence of a production route outage.

The first throttled Network sample (34ms) matched content still visible on Home and is **INVALID / EXCLUDED**. The harness was corrected to require the destination pathname as well as content. A destination-aware 390px rerun supplies throttled evidence below; the initial matrix remains valid because each measurement uses full document navigation.

## Before/after 390px evidence and final browser outcome

Baseline: `C:/Users/Admin/AppData/Local/Temp/gigway-part4-browser-lxq9S5/report.json`. After: `C:/Users/Admin/AppData/Local/Temp/gigway-part4-browser-GKHBwr/report.json`. Same harness/fixtures at 4x CPU, separate warmed Next dev runs; single samples, no statistical or production benchmark claim. Baseline retains all start-of-Part-4 dirty media work.

| Route | Image requests before ? after | Total browser requests before ? after | Useful ms before ? after |
| --- | ---: | ---: | ---: |
| /home | 14 ? 6 | 30 ? 24 | 2420 ? 4715 |
| /network | 20 ? 9 | 36 ? 25 | 1972 ? 2682 |
| /work | 2 ? 2 | 18 ? 18 | 1768 ? 2988 |
| /u/qa-person | 3 ? 3 | 20 ? 20 | 2137 ? 2913 |
| /create | 2 ? 2 | 19 ? 19 | 1615 ? 2220 |

**MEASURED:** fewer initial image requests on Home (14?6) and Network (20?9) in these windows. **No overall navigation latency improvement is demonstrated**: full-document after samples are slower across all five routes, including unchanged routes. The measurements do not isolate CPU impact of the client boundary from dev-server/system variance. Do not advertise a speed percentage or dismiss these values as proven production behavior.

Destination-aware client navigation, visible navbar Links, 390?800, 4x CPU, 150ms latency and 200,000 bytes/sec (~1.6Mbps):

| Destination | Useful ms before | Useful ms after |
| --- | ---: | ---: |
| Create | 3266 | 3287 |
| Home | 1786 | 1829 |
| Network | 1113 | 1108 |
| Work | 465 | 467 |

These throttled samples are essentially similar and do not establish a navigation speedup. After-run server auth reads for Create/Home/Network/Work were 2/1/1/0 respectively (Create includes its optional-data API verification). Browser Follow changed to Following successfully in 1,543ms against the **local mock only**; no real user was followed/notified. Primary Home content remained ready before a deliberately delayed secondary Network boundary. No runtime exceptions or overflow in the final 390 run. No physical-device/keyboard test or live storage/CDN measurement.

## Isolated validation and final verdict

A temporary HEAD archive plus only the 15 Part 4 files (including the adopted shared-avatar lazy/async attributes) was tested at `C:/Users/Admin/AppData/Local/Temp/gigway-part4-isolated-lBztEu`. No old GigVideo/Glimps/Jox/SocialHomeFeed edits or untracked media helper were included. TypeScript, new Part 4, architecture, auth/navigation and Mobile Create suites all pass. The auth suite initially lacked Git history in the archive; it was rerun with a read-only `GIT_DIR` reference for its historical `git show` fixture and passed. No Git mutation was run. This proves the new changes do not require the old dormant media work.

Whole-worktree required validation: TypeScript PASS; P0 auth PASS (12); P0 social PASS; Professional Identity PASS (9); Pass 1 PASS; Pass 2 PASS; Pass 2 final PASS (19); discover pagination PASS; auth/navigation PASS (23); simplification PASS (13); UX correction PASS (10); Network/Home architecture PASS (11); Mobile Create PASS (9); new Part 4 PASS (7). Extra pre-existing media suite PASS (16). Logs and result JSON: `C:/Users/Admin/AppData/Local/Temp/gigway-part4-TBuVrw/`.

**READY FOR PART 4 REVIEW**, local code review only. Production bundle/hydration profiling, device QA, remaining full-list pagination/count-query costs and streamed Work layout shift remain explicit limitations. No claim that all performance risks or the original live-site hang are solved by this pass. No commit/push/deploy, database/schema/RLS mutation, or Part 5 work.

Final preservation check: all 14 protected/untouched pre-existing file hashes match baseline; all five worker/config hashes match. The adopted profile-avatar is the sole pre-existing file intentionally edited. HEAD remains ea7f46802965d6ef13395877b436ab68027e4b56; index clean. git diff --check and all three new browser/test script syntax checks PASS. Preservation evidence: C:/Users/Admin/AppData/Local/Temp/gigway-part4-TBuVrw/final-preservation.json.
