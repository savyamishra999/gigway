# Network / Work / Home architecture review

Baseline: `27a711080a1afefc6b1f1c22d9eb8e963a6eaddd`. Implemented locally only. No staging, commit, push, deployment, production build, migration, schema/RLS change or remote Supabase mutation. Part 4 remains paused.

## Routing and product roles

Previously desktop/mobile Network linked to `/explore`, a mixed People/Workplaces/Jobs/Projects/Services search. Actual connection management lived separately at `/network`.

Both primary Network links now go directly to `/network`. Its heading is "Find people, build connections and follow Workplaces." It has exactly three sections:

- People: completed professional profiles, name/avatar, available headline, up to two skills, existing active-intent labels, profile link and Follow/Following.
- Workplaces: name/logo, available tagline or industry, profile link and Follow/Following. Copy: "Discover companies, startups and organizations on GigWay."
- My Network: the existing connection UI, embedded without changing its backend. Requests retain Accept/Decline; connections retain View profile/Disconnect.

Network remains authenticated, using the existing viewer/login guard. Only the selected discovery section loads. The connection API is requested only when My Network mounts. Profile Connections links now target `/network?tab=connections` so they continue to open connection management.

Jobs, Projects and Services are absent from primary Network. `/explore` and its APIs remain intact as secondary global search. Its heading is now "Search GigWay", with accurate people/Workplaces/work copy. The existing desktop search form and mobile search icon now open `/explore`; no extra primary or bottom-nav item was added. The older `/social/explore` route was not deleted or modified.

Work retains its heading, three live rails, six-record limits per category, manual scrolling, timestamps and hiring links. The fourth category is now Find Professionals, still pointing at `/freelancers`. That label matches the existing query: completed profiles without a freelancer-only role filter. The destination header uses the same label. No availability guarantee is made.

## Network data and search

The new `networkDiscovery` server loader reuses existing profiles, organizations, follow tables, active profile intents, normal Supabase server client and RLS. It uses explicit columns, recent-first ordering with an ID tie-breaker, and hard limits. It excludes the viewer from people discovery and requires usernames for usable profile links. Existing `compactIntentLabels` handles intent wording.

People search supports name, username and headline/tagline. Workplace search supports name, username, tagline and industry. Placeholders describe exactly those fields; they do not promise skill/role search. Search is a normal GET form and preserves the selected tab. Terms are length-bounded and sanitized before the existing PostgREST ilike/or pattern is used.

Network shows at most 18 matches per selected section. No Load More was added: existing discovery is capped and the social-post cursor utilities have a different visibility/traversal contract. The UI explicitly states the limit and suggests narrowing with search. This is the allowed bounded-list fallback, not a claim of complete results.

Follow state and active intents are fetched only for returned profile/Workplace IDs. Following a person is separate from sending or accepting a connection request. Workplaces only use Follow. The existing follow endpoints are reused; failures show an error instead of falsely toggling the state. There is no initial client discovery fetch or polling timer.

## Home structure and bounds

Main content order:

1. Share a GigThought composer link and existing For You/Following posts.
2. People for you.
3. Workplaces to follow.
4. Find Work entry with Jobs/Projects/Services quick links.
5. Latest Opportunities.

The existing identity-completion prompt and activity/tools sidebar are preserved. Existing post pagination/hydration behavior is preserved. The disabled legacy module definitions remain dormant; neither JOX nor GLIMPS boundaries/loaders execute under current product flags.

| Preview | Candidate query limit | Maximum visible |
| --- | --- | --- |
| People | 6 profiles | 6 |
| Workplaces | 6 organizations | 6 |
| Latest jobs | 2 jobs | 2 |
| Latest projects | 2 projects | 2 |
| Latest services | 2 gigs | 2 |
| Latest Opportunities total | 6 across three queries | 6 |

This replaces the old 24-person/24-Workplace candidate windows and 24-job/24-project/12-service windows. The previews are recent records, not a new personalized recommendation engine. People already followed remain visible with accurate Following state. Latest work can include the viewer's own published items. No large candidate expansion, duplicate viewer lookup, first-render client discovery request, media-heavy opportunity cards or automatic rotation was added.

Home reuses the Network loader at six records and the existing Work preview loader at two per category; Work keeps its default six per category. Avatars/logos are the only preview images. New preview/detail/view-all links disable prefetch to avoid loading every destination automatically. Existing `HomeModule` deadlines and primary/secondary streaming boundaries remain. People and Workplaces share the Network module boundary; if either loader fails, that boundary displays its existing retry state. Opportunity categories retain independent query error results and can show partial content.

People View all opens `/network`; Workplaces View all opens `/network?tab=workplaces`; opportunity View all opens `/work`. Find Work is an honest entry CTA to `/work` with direct listing links, not an input that pretends to search an unsupported Work query.

## Timestamps and visual alignment

Home opportunity cards reuse `ContentTimestamp` and real stored creation/update values. Posted semantics for jobs/projects and meaningful Updated semantics for services remain unchanged. English/IST exact details, initial SSR/hydration consistency and relative recent cards remain covered by UX tests. People and Workplace cards do not show timestamps.

The `/freelancers` shell, cards, filters, headings, buttons and upgrade-overlay colors now use the light GigWay visual system: ivory background, white cards, midnight/slate text, indigo actions and existing brand borders. Availability text uses darker colors for the light background. Existing queries, ranking, filtering, plan restrictions and monetization logic are unchanged. This is styling/copy alignment only; the existing legacy filter-query behavior is not a Part 4 optimization.

## Verification and browser QA

PASS: TypeScript (`tsc --noEmit --incremental false`), P0 auth, P0 social, Professional Identity, Pass 1, Pass 2, Pass 2 final, discover pagination, Part 2 auth/navigation, Part 3 simplification, UX correction, existing Part 3 media tests, new Network/Home architecture tests (11 groups), and `git diff --check`.

Pass 2 fixtures now exercise the real replacement loaders/components and assert the new 6/6/2+2+2 contract. Old 12-card ranking-capacity assertions were replaced because this task intentionally changes that contract. Existing first-page hydration, pagination, failure deadlines, auth counts and zero-legacy-work checks remain. One UX test callback now calls the Work loader explicitly so JavaScript's map index is not passed as the new optional limit.

New architecture tests execute discovery loaders, Network tab/search rendering, follow actions, connection Accept/Decline/Disconnect actions, Home loaders, opportunity cards and route behavior with local fixtures. They also verify both primary nav definitions, no work-category tabs in Network, no duplicate discovery mount fetch, valid existing destinations and shared timestamps. No live database success is claimed.

The first full TypeScript run hit the runner timeout without diagnostics. A separate rerun completed successfully.

Browser harness was retried with local fixtures for Home, all three Network sections and Work. Chrome CDP timed out at `Page.enable` before viewport measurement. **320, 360, 375, 390, 412, 430 and 1280: NOT MEASURED.** Layout, wrapping, swipe behavior, overflow, readable controls and visual styling still need browser QA. No screenshots or live deployment verification are claimed.

## Exact files changed in this pass

15 existing files:

- `app/freelancers/page.tsx`
- `app/home/page.tsx`
- `app/network/page.tsx`
- `app/u/[username]/page.tsx`
- `app/work/page.tsx`
- `components/connections/NetworkClient.tsx`
- `components/discover/DiscoverClient.tsx`
- `components/freelancers/FreelancerCard.tsx`
- `components/freelancers/FreelancersClient.tsx`
- `components/layout/ModernNavbar.tsx`
- `components/social/SocialHomeFeed.tsx`
- `lib/work/previews.ts`
- `scripts/test-makkhan-pass2.cjs`
- `scripts/test-makkhan-pass2-final.cjs`
- `scripts/test-ux-correction.cjs`

5 new files:

- `lib/network/discovery.ts`
- `components/connections/DiscoveryCards.tsx`
- `components/home/DiscoveryPreviews.tsx`
- `scripts/test-network-home-architecture.cjs`
- `docs/network-work-home-architecture-review.md`

## Preservation and limitations

All unrelated/pre-existing media files and protected `.claude/settings.local.json`, `docs/workplace-phase4-audit.md`, `supabase/audits/` remain byte-identical to the starting snapshot. The only overlapping media file is `SocialHomeFeed.tsx`: the saved starting bytes plus the single composer-copy replacement reproduce the current file exactly. Its dynamic imports, image loading and dimensions remain untouched and must not be included wholesale in any future architecture commit.

All database files, `public/sw.js` and the generated worker match starting hashes. No legacy routes/data or product-visibility flags changed. No staging, commit, push, deployment or Part 4 work occurred.

Remaining limitations: Network has no Load More beyond 18 matches; Home previews are recent rather than personalized and do not backfill an empty work category from another; People/Workplaces share a Home failure boundary; live RLS/data relationships and all requested browser widths remain unverified; service updates still depend on available maintained `updated_at` data; existing `/explore` and freelancer search limits/behavior outside this scope remain.

**READY FOR NETWORK/WORK/HOME REVIEW**
