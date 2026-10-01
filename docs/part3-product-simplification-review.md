# Part 3 — current-product simplification

Verdict: **READY FOR PART 3 REVIEW**. Implemented locally only. No commit, push, deployment, production build, remote mutation, or Part 4 work.

## Product structure and surface audit

Before: desktop/drawer navigation promoted Home, Network, VIJOX, GLIMPS, Work. Home mounted seven independent modules, including JOX and GLIMPS. Profiles exposed GigThoughts, JOX, GLIMPS, Reposts. Personal Create advertised Post, Jox, GLIMPS, Job, Project, Service. Search fetched all formats plus separate legacy rails. Seasonal guidance and the landing page promoted legacy formats.

After: primary navigation is **Home / Network / Work**. Identity remains accessible through the existing account/avatar controls. Authenticated mobile bottom navigation remains **Home / Network / Create / Work / Account**, with its existing five equal columns. The mobile drawer uses the same filtered primary links as desktop; no empty link placeholders are emitted.

Home retains posts, opportunities, network/people/workplaces, identity completion, and activity. Profile owner and visitor tabs are **GigThoughts / Reposts**. No Work tab or onboarding redesign was added.

`lib/product-visibility.ts` is the central local policy: `joxCurrentProduct = false`, `glimpsCurrentProduct = false`. Navigation, Create, profile tabs, Home server/client rails, search, seasonal prompts, and current feed format filters derive from it. This is visibility policy, not an authorization mechanism.

| Current surface | Change |
| --- | --- |
| Desktop navigation / mobile drawer | Filter legacy destinations from the shared links array. |
| Mobile bottom navigation | Already contained no legacy destinations; preserved all five existing controls. |
| Home server | Gate each legacy HomeModule before React constructs the boundary or calls its loader. No fallback/error/placeholder region is created. |
| Home client | Gate both legacy rails even if older callers pass nonempty legacy arrays. No rail mounts or media preparation effects run. |
| Public professional profile, owner and visitor | Filter tabs and their associated empty states/creation links; retain definitions for relaunch. |
| Profile Reposts | UI opts into `currentProduct=1`; filter source posts before authorization/serialization. Marketplace reposts remain. |
| Workplace feed / preview | UI opts into the same policy before query results are serialized. Organization ownership and permissions are unchanged. |
| Global Create | Personal choices: Share a GigThought, Post a Job, Post a Project, Offer a Service. Existing workplace choices: Share a GigThought, Post a Job. |
| Create identity chooser | Personal option now links to `/create?personal=1`, so members of workplaces can actually leave the chooser and reach personal actions. The existing workplace choices and authorization remain. |
| Social search / discovery | Hide legacy tabs and rails; skip both legacy loaders; filter the general posts query to current formats before visibility checks and serialization. A stale `tab=jox` or `tab=glimps` falls back to All. |
| Seasonal header popup and Home card | Hide the legacy secondary CTA. Preserve its archived definition and primary GigThought CTA. |
| Landing Hero | Describe sharing through GigThoughts. |
| Normal post composer | Replace the prompt advertising dedicated JOX/GLIMPS creators with attachment guidance. Dedicated legacy creator copy remains. |

The audit also inspected primary Discover/Following queries, profile activity, saved items, recommendation code, navigation variants, metadata, sitemap, and current onboarding/introductory copy. Discover and Following already restrict source posts and reposts to `standard`; no pagination or ranking changes were needed. Saved currently lists marketplace/freelancer items, not legacy social categories. Activity counts do not fetch legacy content. User-authored words, historical notifications, and external content URLs are not rewritten.

## Home fetch consequences

These are source/control-flow and local fixture observations, **not production timing measurements**. The old loader bodies remain available behind the policy.

| Home operation | Before | After, normal V1 Home |
| --- | --- | --- |
| JOX candidate query | One `accessibleJoxPage(viewer, undefined, 10)`; candidate cap 41 | **0** |
| JOX visibility | `visiblePosts` over JOX candidates; relationship queries depend on data | **0** |
| JOX serialization | One `safePosts` invocation; up to 10 posts | **0** |
| JOX media work | Media lookup/delivery URL construction; signing per protected object when present | **0** |
| GLIMPS candidate query | One `accessibleGlimpsPage(viewer, undefined, 8)`; candidate cap 33 | **0** |
| GLIMPS visibility | `visiblePosts` over GLIMPS candidates; relationship queries depend on data | **0** |
| GLIMPS serialization | One `safePosts` invocation; up to 8 posts | **0** |
| GLIMPS media work | Media lookup/delivery URL construction; signing per protected object when present | **0** |
| Legacy client rails / effects / media preloads | Rails could mount for returned content | **0 mounted rails** |

The regression test executes the real Home page with five current boundaries, runs all retained loaders, and asserts zero JOX loader, GLIMPS loader, or legacy serialization calls. With the old policy enabled in the fixture, both loaders and both serialization stages execute. Separately, the actual `initialHomePosts` + social query/serialization functions run against mixed standard/JOX/GLIMPS fixtures: only the standard post is queried for delivery, no legacy media is returned or signed, and no timed-reaction query runs. Empty legacy client props are not the basis of this proof: the rail test deliberately supplies nonempty legacy props and verifies neither rail mounts.

No browser speed, bytes, CLS, bundle, or production latency improvement is claimed.

## Creation routes

Existing routes and implementations were inspected: `/social/create`, `/jobs/new` with JobForm -> `/api/jobs`, `/projects/new` with ProjectForm -> `/api/projects`, and `/gigs/new` with GigForm -> `/api/gigs`. Existing login/profile-completion and workplace membership checks remain. These are existing implemented flows, not invented placeholders. No live job/project/service submission was performed. Workplace Service creation was not invented, and the existing workplace action set was not expanded.

## Legacy content and data preservation

Directly reachable, intentionally unadvertised:

- `/social/vijox` and `/social/glimps`, including the latter's `?post=` selection.
- `/social/vijox/create` and `/social/glimps/create`, with existing authentication and author controls.
- `/social/posts/[id]`, its Open Graph route, public media route, and JOX clip route.
- `/api/social/vijox`, `/api/social/glimps`, individual post/media APIs, upload/publish/cover/reaction/clip APIs.
- Explicit profile `tab=jox` / `tab=glimps` API requests and unscoped legacy profile/workplace API requests.

Only current UI feed requests opt into `currentProduct=1`. Omitting it preserves the old API behavior. It cannot grant access: existing `visiblePosts`, `resolvePostAccess`, media checks, and serialization still apply. No old URL redirects to an unrelated destination.

Focused tests execute real legacy feed pages and individual detail pages for anonymous, stranger, follower, and author viewers. Fixtures include organization-authored JOX/GLIMPS, follower-only content, and drafts. Unauthorized content remains absent/404 and no private media is signed for anonymous or stranger viewers. Public audio/video range delivery succeeds in local fixtures; private/draft content and mismatched media IDs fail closed. Authorized private delivery still uses signing. Live existing production content was **not tested**.

No JOX or GLIMPS rows deleted; no storage objects deleted; no tables or columns removed; no migration created; no schema/RLS/ownership changes; no remote Supabase mutation. `posts.author_organization_id`, organization permissions, legacy media authorization, and stored content are untouched. Fixtures use an in-memory database and mocked media upstream only.

## SEO, search, and preserved references

The current sitemap does not list either legacy hub, so no sitemap change was needed. Individual content metadata/Open Graph/media URLs remain intact for existing external links and indexed content. No noindex directive, URL deletion, or redirect was added. Search tabs and results now follow V1 policy; historical content remains accessible through authorized direct routes.

Preserved references include dedicated legacy pages and creators, JOX/GLIMPS players/rails, shared PostCard compatibility rendering, persisted content format definitions, server visibility/serialization, APIs, storage and worker code, HomeModule labels for dormant boundaries, historical tests/docs/migrations, and the archived seasonal secondary CTA. Hiding these references indiscriminately would break legacy compatibility.

For relaunch, independently enable the central flags, revalidate navigation/layout and media delivery, and update current product copy deliberately. Primary GigThought Discover/Following intentionally remain standard-post feeds; relaunch does not automatically blend them with legacy formats. Retained Pass 2 tests explicitly enable the legacy fixture policy to keep testing those dormant boundaries. The new suite tests the default V1 policy.

## Verification

| Check | Result |
| --- | --- |
| TypeScript: `node node_modules/typescript/bin/tsc --noEmit --incremental false` | PASS |
| `node scripts/test-p0-auth.cjs` | PASS, 12 groups |
| `node scripts/test-p0-social.cjs` | PASS |
| `node scripts/test-professional-identity.cjs` | PASS, 9 groups; expectation updated for current tabs |
| `node scripts/test-makkhan-pass1.cjs` | PASS |
| `node scripts/test-makkhan-pass2.cjs` | PASS; legacy-enabled boundary tests retained |
| `node scripts/test-makkhan-pass2-final.cjs` | PASS, 19 checks |
| `node scripts/test-discover-pagination.cjs` | PASS |
| `node scripts/test-auth-navigation.cjs` | PASS, 21 groups |
| `node scripts/test-part3-simplification.cjs` | PASS, 13 groups |
| Existing `node scripts/test-part3-media.cjs` | PASS; pre-existing media work preserved |
| `git diff --check` | PASS |
| Mobile/browser: 320, 360, 375, 390, 412, 430, 1280 | **NOT MEASURED** |

Chrome was launched headlessly using the repository harness's DevTools startup method, with an isolated temporary profile. The DevTools connection failed (`fetch failed`), and the owned browser process was stopped. No visual spacing/overflow/Create/profile/Home placeholder result is asserted. The tests verify rendered React structures, not browser geometry. Production QA must check those widths, real account transitions, existing public and protected legacy URLs, workplace legacy content, and actual Home network requests. No production build was run.

Regression logs: `C:\Users\Admin\AppData\Local\Temp\gigway-part3-regression-bHhzUp`.

## Exact Part 3 files changed

1. `lib/product-visibility.ts` (new)
2. `app/home/page.tsx`
3. `app/create/page.tsx`
4. `app/social/explore/page.tsx`
5. `app/api/social/profiles/[id]/posts/route.ts`
6. `app/api/social/organizations/[id]/posts/route.ts`
7. `components/layout/ModernNavbar.tsx`
8. `components/home/Hero.tsx`
9. `components/moments/MomentExperience.tsx`
10. `components/social/SocialHomeFeed.tsx` (only policy import and two visibility gates layered over existing edits)
11. `components/social/ProfileSocialFeed.tsx`
12. `components/social/OrganizationSocialFeed.tsx`
13. `components/social/CreatePostComposer.tsx`
14. `scripts/test-professional-identity.cjs`
15. `scripts/test-makkhan-pass2.cjs`
16. `scripts/test-makkhan-pass2-final.cjs`
17. `scripts/test-part3-simplification.cjs` (new)
18. `docs/part3-product-simplification-review.md` (new)

## Workspace preservation

The workspace already contained media-performance edits and unrelated protected files. All other pre-existing modified/untracked media files, `.claude/settings.local.json`, `docs/workplace-phase4-audit.md`, and `supabase/audits/` were preserved. The shared SocialHomeFeed retains the exact pre-existing text and mixed line endings outside the three deliberate edits. No staging, stashing, reverting, committing, pushing, or deployment occurred.

`public/sw.js` SHA-256: **162B5E156486951569C71F24CA9B8FCAB512A792AB9E799DC988747A67C71DA3** — matches the required value and starting snapshot.

`public/worker-RIgomFyrnZBIlFiS9JYxC.js` SHA-256: **83FEFB5F49E3EB8C6557AE4F0297DB15E3AD9DF61953A3064F226BD4DE1990CD** — unchanged from the starting snapshot.

All database/schema/RLS/storage definitions are unchanged. The visibility config is a product decision, not a migration or permission change.

## Occurrence inventory captured before product edits

Search: case-insensitive `jox|glimps` (also matches VIJOX) across app, components, lib, docs, scripts, supabase and worker. README/public current copy and sitemap/robots/layout were checked separately; no additional current feature promotion was found. The config created for this task is excluded from the before inventory. Line numbers refer to the pre-edit snapshot. Each row classifies all matching lines listed; structural imports/types/loaders remain internal even when their consuming surface is hidden.

A = current user-facing product; B = direct legacy route; C = internal implementation/compatibility renderer; D = database/API/storage; E = tests/documentation; F = future/archived. A entries were hidden/gated or their copy simplified; other entries are preserved. The seasonal CTA definition moves from A to F after its render gates. No other dedicated future-only match required a change. APIs with indirect current-product exposure are discussed above even when they contain no JOX/GLIMPS string.

| File | Class | Matching lines before edits |
| --- | --- | --- |
| `app/api/social/glimps/route.ts` | D | 2, 7, 9 |
| `app/api/social/jox-uploads/[id]/complete/route.ts` | D | 9, 10, 13, 14, 15 |
| `app/api/social/jox-uploads/[id]/route.ts` | D | 8, 10, 16, 17, 18, 19 |
| `app/api/social/jox-uploads/init/route.ts` | D | 10, 12 |
| `app/api/social/posts/[id]/jox-clip/route.ts` | D | 3, 4, 9, 15, 17, 18, 27, 28, 29, 36, 37, 39, 40, 41, 43, 45, 47, 49, 50, 51, 52 |
| `app/api/social/posts/[id]/jox-cover/route.ts` | D | 3, 10, 17, 18, 19, 21 |
| `app/api/social/posts/[id]/jox-upload/route.ts` | D | 2, 3, 9, 11, 12, 13, 15, 17, 18, 19, 20, 21, 24, 25, 26 |
| `app/api/social/posts/[id]/media/finalize/route.ts` | D | 2, 3, 20 |
| `app/api/social/posts/[id]/media/upload/route.ts` | D | 2, 3, 11, 12, 14, 15, 18 |
| `app/api/social/posts/[id]/publish/route.ts` | D | 2, 3, 4, 8, 10, 12, 13, 14, 15 |
| `app/api/social/posts/[id]/vijox-reactions/route.ts` | D | 2, 3, 4, 6, 7, 10, 11, 14, 16, 19, 22, 23, 24, 31, 32, 34, 36, 38, 45, 46, 47, 48, 52, 53, 54, 55 |
| `app/api/social/posts/route.ts` | D | 2, 4, 59, 63, 65, 66, 68, 72, 91, 122, 223 |
| `app/api/social/profiles/[id]/posts/route.ts` | D | 12, 15 |
| `app/api/social/vijox/route.ts` | D | 2, 5, 6 |
| `app/create/page.tsx` | A | 16, 17 |
| `app/home/page.tsx` | A | 142, 143 |
| `app/home/page.tsx` | C | 12, 17, 18, 108, 110, 111, 112, 114, 115, 116 |
| `app/social/explore/page.tsx` | A | 11, 30, 39, 41, 42, 45, 57, 58 |
| `app/social/explore/page.tsx` | C | 4, 7, 8 |
| `app/social/glimps/create/page.tsx` | B | 5, 7, 9, 14 |
| `app/social/glimps/page.tsx` | B | 2, 3, 5, 7, 9, 11 |
| `app/social/posts/[id]/jox-clip/route.ts` | B | 2, 10, 16 |
| `app/social/posts/[id]/opengraph-image/route.tsx` | B | 13, 16 |
| `app/social/posts/[id]/page.tsx` | B | 13, 32, 33, 40, 43, 44 |
| `app/social/vijox/create/page.tsx` | B | 5, 7, 9, 14 |
| `app/social/vijox/page.tsx` | B | 2, 3, 6, 7, 8 |
| `components/home/Hero.tsx` | A | 54 |
| `components/home/HomeModule.tsx` | C | 8 |
| `components/layout/ModernNavbar.tsx` | A | 18, 19 |
| `components/layout/ModernNavbar.tsx` | C | 44, 98, 201 |
| `components/moments/MomentExperience.tsx` | A | 10 |
| `components/social/CreatePostComposer.tsx` | A | 676 |
| `components/social/CreatePostComposer.tsx` | C | 22, 23, 24, 27, 132, 138, 139, 141, 144, 147, 184, 187, 190, 191, 194, 195, 198, 199, 202, 206, 207, 226, 228, 230, 232, 236, 241, 249, 250, 255, 260, 301, 313, 316, 320, 338, 341, 347, 348, 349, 350, 355, 368, 370, 371, 372, 374, 416, 417, 418, 422, 423, 435, 445, 462, 471, 473, 505, 506, 532, 533, 536, 547, 550, 551, 552, 555, 558, 570, 574, 579, 580, 583, 586, 591, 593, 595, 597, 598, 601, 602, 606, 631, 648, 649, 655, 656, 712, 714, 715 |
| `components/social/GlimpsCreateComposer.tsx` | C | 7, 8, 36, 45, 53, 67, 68, 73, 75, 78, 85, 86, 88, 90, 91 |
| `components/social/GlimpsExperience.tsx` | C | 11, 16, 36, 39, 42, 44, 45, 46, 47, 48, 50, 51 |
| `components/social/GlimpsFeed.tsx` | C | 7, 12, 16, 21, 22, 23, 24 |
| `components/social/GlimpsPreview.tsx` | C | 6 |
| `components/social/GlimpsRail.tsx` | C | 3, 7, 9 |
| `components/social/GlimpsShareMenu.tsx` | C | 6, 8, 10, 14, 15 |
| `components/social/JoxCompanionImages.tsx` | C | 6, 7, 8, 12 |
| `components/social/JoxCreateComposer.tsx` | C | 4, 5 |
| `components/social/JoxFeed.tsx` | C | 8, 10, 11 |
| `components/social/JoxOrbitRail.tsx` | C | 6, 8 |
| `components/social/PostDetailContent.tsx` | C | 10, 40 |
| `components/social/ProfileSocialFeed.tsx` | A | 12, 20 |
| `components/social/ProfileSocialFeed.tsx` | C | 7, 10, 14, 17, 21 |
| `components/social/SocialHomeFeed.tsx` | A | 758, 759 |
| `components/social/SocialHomeFeed.tsx` | C | 6, 7, 8, 17, 51, 52, 57, 58, 59, 60, 118, 119, 152, 316, 323, 326, 334, 545, 547, 560, 561, 562, 572, 598, 668, 669 |
| `components/social/VijoxCircularProgress.tsx` | C | 5, 9, 35, 42 |
| `components/social/VijoxContinuousFeed.tsx` | C | 9, 12, 13, 14, 16 |
| `components/social/VijoxExperience.tsx` | C | 7, 8, 9, 10, 11, 12, 15, 17, 18, 19, 22, 33, 34, 35, 48, 50, 51, 52, 53, 54, 56 |
| `components/social/VijoxPlayer.tsx` | C | 3, 5, 6 |
| `components/social/VijoxReactionMoments.tsx` | C | 3, 4, 5, 6, 11 |
| `components/social/VijoxTimedReactions.tsx` | C | 4, 6, 9, 13, 15, 19, 25 |
| `components/social/VijoxTranscript.tsx` | C | 5, 6, 8 |
| `docs/discover-pagination-fix-review.md` | E | 50 |
| `docs/jox-clip-worker.md` | E | 1, 3, 7, 9, 17, 18, 19, 20, 23, 27, 29 |
| `docs/makkhan-performance-audit.md` | E | 212, 213, 215, 274, 279, 286, 316, 319, 344, 345, 356, 417, 434, 442, 467, 485, 490, 540 |
| `docs/makkhan-performance-part3-media-js-review.md` | E | 9, 11, 12, 17, 19, 23 |
| `docs/makkhan-performance-pass1-review.md` | E | 30, 76, 77, 133 |
| `docs/makkhan-performance-pass2-final-verification.md` | E | 25, 27, 32, 33, 36, 44, 50 |
| `docs/makkhan-performance-pass2-review.md` | E | 12, 13, 22, 24, 28, 46, 47, 54, 68, 69, 93, 95, 103, 104, 123, 136, 156, 157, 164, 167, 175, 186, 302 |
| `docs/media-inspection-worker.md` | E | 5, 19 |
| `docs/p0-first-load-auth-audit.md` | E | 64, 65, 171, 174, 178, 228, 287 |
| `docs/p0-first-load-auth-fix-review.md` | E | 30, 35, 36, 44, 66, 101, 105 |
| `docs/professional-identity-profile-audit.md` | E | 15, 138, 280, 282, 326, 327, 419, 516 |
| `docs/professional-identity-profile-implementation-review.md` | E | 19, 64 |
| `docs/workplace-foundation-phase1.md` | E | 13, 100, 138, 174 |
| `docs/workplace-phase2-review.md` | E | 27 |
| `docs/workplace-phase4-audit.md` | E | 41 |
| `lib/home/primary.ts` | C | 3, 10 |
| `lib/moments.ts` | A | 17 |
| `lib/social/content-domain.ts` | C | 1, 2, 4, 5, 6, 7, 9, 10, 12, 13, 16, 17, 19, 20, 21 |
| `lib/social/jox-clip-queue.ts` | C | 3, 7, 9, 13, 15, 16, 19, 21, 22 |
| `lib/social/jox-clip.ts` | C | 2, 4, 5, 6, 7, 8, 13, 15, 18, 19, 22, 23, 28 |
| `lib/social/server.ts` | C | 4, 5, 9, 10, 111, 115, 123, 124, 125, 149, 150, 151, 153, 154, 155, 156, 167, 168, 170, 235, 236, 237, 238, 250, 251, 259 |
| `lib/social/vijox-timed-reactions.ts` | C | 1, 2, 4, 6, 9, 12, 16, 19, 23, 25, 29, 30, 31, 33, 34 |
| `scripts/home-browser-qa.cjs` | E | 40, 45, 46, 97, 114, 119, 211, 216 |
| `scripts/render-jox-clip.mjs` | E | 3, 6, 19, 48, 52, 75, 77, 96, 125 |
| `scripts/test-makkhan-pass1.cjs` | E | 23 |
| `scripts/test-makkhan-pass2-final.cjs` | E | 25, 43, 103 |
| `scripts/test-makkhan-pass2.cjs` | E | 79, 80, 84, 105, 122, 125, 140, 149, 150 |
| `scripts/test-p0-auth.cjs` | E | 77 |
| `scripts/test-p0-social.cjs` | E | 17 |
| `scripts/test-part3-media.cjs` | E | 74, 88, 89, 95, 96, 112, 113, 120, 121, 123, 125, 126, 129, 133, 137, 141, 143, 145, 146, 147, 153, 154, 158, 159, 167, 168, 171 |
| `scripts/test-professional-identity.cjs` | E | 78, 80, 81 |
| `supabase/migrations/043_vijox_timed_reactions.sql` | D | 1, 11, 12, 14, 15, 17, 18, 20, 23, 26, 32, 37, 44 |
| `supabase/migrations/044_jox_renditions_foundation.sql` | D | 1, 2, 17, 18, 19, 20, 23, 25, 29 |
| `supabase/migrations/045_glimps_content_format.sql` | D | 1, 10, 12, 14 |
| `supabase/migrations/045_jox_cover_media.sql` | D | 1, 3, 6, 9, 10, 12, 17, 18, 20, 22, 28, 29, 30, 31 |
| `supabase/migrations/046_jox_cover_presentation.sql` | D | 1, 3, 4, 5, 8, 9, 10, 11, 14, 17, 19, 21, 22, 23, 24 |
| `worker/Dockerfile` | C | 6, 7, 9 |
| `worker/jox-clip-worker.mjs` | C | 12, 15, 20, 21, 22, 24, 34, 35, 37, 38 |
| `worker/media-inspection.mjs` | C | 10, 38, 41, 63, 79, 81 |

## Full working-tree status after Part 3

Includes pre-existing unrelated work; only the 18 files listed above belong to this task.

```text
 M .claude/settings.local.json
 M app/api/social/organizations/[id]/posts/route.ts
 M app/api/social/profiles/[id]/posts/route.ts
 M app/create/page.tsx
 M app/home/page.tsx
 M app/social/explore/page.tsx
 M components/home/Hero.tsx
 M components/layout/ModernNavbar.tsx
 M components/moments/MomentExperience.tsx
 M components/social/CreatePostComposer.tsx
 M components/social/GigVideoPlayer.tsx
 M components/social/GlimpsExperience.tsx
 M components/social/GlimpsRail.tsx
 M components/social/JoxCompanionImages.tsx
 M components/social/JoxOrbitRail.tsx
 M components/social/OrganizationSocialFeed.tsx
 M components/social/ProfileSocialFeed.tsx
 M components/social/SocialHomeFeed.tsx
 M components/social/VijoxExperience.tsx
 M components/ui/profile-avatar.tsx
 M scripts/test-makkhan-pass2-final.cjs
 M scripts/test-makkhan-pass2.cjs
 M scripts/test-professional-identity.cjs
?? components/social/GlimpsPreview.tsx
?? components/social/useMediaLoading.ts
?? docs/makkhan-performance-part3-media-js-review.md
?? docs/part3-product-simplification-review.md
?? docs/workplace-phase4-audit.md
?? lib/product-visibility.ts
?? scripts/test-part3-media.cjs
?? scripts/test-part3-simplification.cjs
?? supabase/audits/
```
