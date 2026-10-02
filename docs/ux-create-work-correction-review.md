# Create and Work UX correction review

Implemented locally on Part 3 commit `3d55d343495a89b5650ae48ad70f8e08a0e4267e`. Ready for code review; browser geometry and live-data QA remain unverified. No staging, commit, push, deploy, production build, or Part 4 work.

## Create copy

The same four personal actions and destinations remain. Examples use smaller caption text and secondary color.

| Action | Previous description | New description | New example |
| --- | --- | --- | --- |
| Share a GigThought | Text, photos, videos and attachments. | Share an idea, update, question, photo or video with your professional network. | I'm a graphic designer available for new freelance projects. |
| Post a Job | Hire for a role. | Hiring for a role? Post a job opening and find people who may be a good fit. | Hiring a Sales Executive in Lucknow. |
| Post a Project | Post work for professionals. | Need a specific piece of work done? Post the project and let professionals respond. | Need someone to build a business website. |
| Offer a Service | Offer your expertise as a service. | Show people what you can do and offer your skill as a professional service. | Logo Design, Tuition, Legal Help, Photography. |

The actor panel now says "You are posting as", followed by the name and `@username · Professional Profile`. The existing Workplace chooser, membership authorization, Workplace actions, and `/create?personal=1` remain intact.

## Work structure and data

Previously, Work contained four large static category cards and Explore links. It now has the heading "Find work. Hire people. Offer your skills.", compact Jobs / Projects / Services / Hire People navigation, three independent server-rendered preview rails, and Post a Job / Post a Project hiring links.

Each rail requests at most **6 records**: 6 active jobs, 6 open projects, and 6 active services, ordered by creation timestamp and then ID descending. Three bounded queries return at most 18 records. Separate Suspense boundaries allow independent loading; one failure does not hide the other rails. No first-render client data fetching, rotation timers, recommendation system, or auth requirement was added to Work.

The new preview loader reuses the existing Supabase server client, RLS, published-status conventions and relationships. Existing listing loaders were not called wholesale because their larger datasets are unnecessary for six-card previews. Jobs and projects select explicit preview columns. Services select the existing whole-row shape to receive optional `updated_at` without requiring a column absent from the checked-in schema. Only normalized preview fields leave that loader. Service listing queries also retain their existing row limits while accepting optional timestamps.

Cards show available titles, author/company/Workplace/provider names, location and job type, category, budget or service price, and stored timestamps. Missing metadata is omitted. No invented salaries, ratings, reviews, or dates. Rails use manual horizontal scrolling, keyboard-focusable regions and mobile-width cards. Links disable automatic prefetching of full listings/details.

| Purpose | Existing route reused |
| --- | --- |
| Jobs / job detail | `/jobs`, `/jobs/[id]` |
| Projects / project detail | `/projects`, `/projects/[id]` |
| Services / service detail | `/gigs`, `/gigs/[id]` |
| Hire People | `/freelancers` |
| Creation | `/jobs/new`, `/projects/new`, `/gigs/new`, `/social/create` |

Services is the visible Work label. Internal gigs routes, table names and concepts remain unchanged. `GigCard.tsx` only receives timestamp fields and rendering; no separate GigCard product feature or redesign was started.

Empty rails show "No jobs/projects/services available yet." Creation links use existing auth UI state and remain hidden for guests. Signed-in links enter existing protected creation flows; completion, ownership and quota rules remain enforced at the destination. Failed queries show an unavailable message and a full-listing link, distinct from a confirmed empty result. View-all links always remain available.

## Shared date/time behavior

`lib/content-time.ts` and `ContentTimestamp` replace scattered post/job/project/service presentation at the touched card/list and detail surfaces. Posts, jobs and projects use Posted. Services use Updated when a valid update is at least one minute after creation (or creation is unavailable); otherwise they use Posted. The one-minute threshold avoids insertion clock noise.

Only valid timezone-bearing stored timestamps are formatted. Missing or invalid timestamps produce no fabricated date. Exact English dates use explicit `Asia/Kolkata` and an IST suffix, for example `1 Oct 2026, 3:42 PM IST`. Server rendering and the first client render both show the exact date. After mounting, cards switch to relative age for recent content; details remain exact. Older and future dates remain exact. Every rendered time has a semantic `dateTime` and exact title. No polling timer was added; relative text refreshes on mounting or timestamp changes.

GigThought detail opts into exact timestamps through the shared PostCard. Legacy content keeps its prior date behavior. Jobs/projects show exact timestamps on details. Services use optional update timestamps in cards, related cards and details, with creation fallback. Deadline presentation was not changed.

## Validation

| Check | Result |
| --- | --- |
| TypeScript (`tsc --noEmit --incremental false`) | PASS |
| P0 auth | PASS |
| P0 social | PASS |
| Professional Identity | PASS |
| Pass 1 | PASS |
| Pass 2 | PASS |
| Pass 2 final | PASS |
| Discover pagination | PASS |
| Part 2 auth/navigation | PASS, 21 groups |
| Part 3 simplification | PASS |
| New UX correction tests | PASS, 10 groups |
| Existing Part 3 media tests | PASS |
| `git diff --check` | PASS |

New tests cover stored timestamp semantics and hydration, bounded publication filters, failure isolation, missing metadata, empty-state actions, public Work routing, exact Create copy/examples and identity selection, and timestamp integration. They use local fixtures, not live Supabase. The auth/navigation test now expects the intentionally changed Work preview structure while retaining its public-access and creation-guard assertions.

Browser QA attempted headless Chrome with local fixture data. CDP timed out at `Page.enable` before either page could be measured. **320, 360, 375, 390, 412, 430 and 1280: NOT MEASURED.** Create wrapping, secondary example sizing, rail swipe/scroll, page overflow, card/date readability and navbar geometry need browser verification. Static classes and fixture rendering are not a substitute for those measurements.

## Exact files changed by this correction

13 existing files modified:

- `app/create/page.tsx`
- `app/work/page.tsx`
- `app/jobs/[id]/page.tsx`
- `app/projects/[id]/page.tsx`
- `app/gigs/page.tsx`
- `app/gigs/[id]/page.tsx`
- `components/jobs/JobsClient.tsx`
- `components/projects/ProjectsClient.tsx`
- `components/gigs/GigCard.tsx`
- `components/gigs/GigsClient.tsx`
- `components/social/SocialHomeFeed.tsx`
- `components/social/PostDetailContent.tsx`
- `scripts/test-auth-navigation.cjs`

7 new files:

- `lib/content-time.ts`
- `lib/work/previews.ts`
- `components/ui/ContentTimestamp.tsx`
- `components/work/WorkPreviewRail.tsx`
- `components/work/WorkCreationLink.tsx`
- `scripts/test-ux-correction.cjs`
- `docs/ux-create-work-correction-review.md`

## Preservation and remaining risks

All pre-existing media/performance changes remain. `SocialHomeFeed.tsx` is the only overlapping file: its saved starting content was preserved, including original line endings, with only the shared timestamp import/prop, normal-post timestamp rendering and metadata wrapping added. Other pre-existing media files, their new helpers/test/review, `.claude/settings.local.json`, `docs/workplace-phase4-audit.md`, and `supabase/audits/` were not edited by this pass.

Part 3 tests confirm JOX/GLIMPS remain hidden from current navigation, Home, Create and profile tabs. Dormant legacy routes remain untouched. Navbar, auth guards, database migrations/schema/RLS and service workers remain unchanged. No remote Supabase mutations occurred.

`public/sw.js` SHA-256 remains `162b5e156486951569c71f24ca9b8fcab512a792ab9e799dc988747a67c71da3`; the existing generated worker is also unchanged.

Remaining review items: real browser measurements at all requested widths; live RLS visibility and relationship validation; service `updated_at` availability/maintenance in deployed data; and actual network latency/payload. Whole-row service reads are bounded but include more server-side fields than an explicit projection. No live-data, production performance or deployment success is claimed.

**READY FOR UX CORRECTION REVIEW**
