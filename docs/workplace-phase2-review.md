# Workplace V1 / Phase 2 review

Local implementation only. No commit, push, deployment, migration, remote SQL, or infrastructure changes.

1. **Architecture reused.** `/u/{username}` still resolves Professionals first. Its Workplace branch now delegates to the server-rendered PublicWorkplace component. Existing organizations, organization_members, organization_follows, jobs.organization_id, projects.organization_id, social feed endpoint, safePost serializer, PostCard, and server-backed owner/admin permissions remain the foundation.

2. **Files changed.** Exact task file list below. The pre-existing public/sw.js modification is excluded from task files.

3. **Header.** Optional cover, rounded-square Workplace logo, name/handle, Workplace label, existing company subtype/industry, location/country, tagline, actual follower count, verification flag, Follow, View Jobs, Visit Website, and authorized Manage Workplace. Follower-count failures omit the count rather than fabricating zero. Websites must be absolute HTTP(S) URLs without embedded credentials. No fictional contact action.

4. **Visual difference.** Dedicated Workplace hierarchy focuses on the organization, People, opportunities, and publication. No personal Open To chips, skills/experience blocks, Message action, or Connections count. Professional page body is unchanged. Team cards use circular personal avatars.

5. **Navigation.** Home, About, People, Jobs, Projects, Content via `/u/{username}?section=...`; bounded page numbers for People/Jobs/Projects. Mobile section navigation scrolls horizontally within its container. Section and pagination links disable automatic prefetch so inactive datasets are not eagerly requested. No Services tab or new /w route.

6. **Home.** Description preview, up to four people, three open jobs, three open projects, three recent visible posts, each with a View All destination. No entire datasets duplicated in the DOM. Content preview reuses the existing bounded 10-post API page and displays its first three results.

7. **About.** Existing description, industry, entity subtype, size, founding year, location, country, and safe website. Missing fields produce no empty metadata rows. Home description is clamped; About shows the full description.

8. **People.** Anonymous-key RLS reads query only active organization_members for this Workplace, select only profile_id/member_role, then batch-fetch public profile fields for the bounded IDs. Private profiles and rows without usernames are omitted. Generic roles are displayed honestly; no Founder titles inferred. No service-role public member directory. Pagination operates over RLS-visible active memberships; a page can have fewer cards after private/missing profile filtering. No invented total People count is shown in the hero.

9. **Jobs.** Existing jobs table filtered by organization_id and status=active using an anonymous client, so no elevated viewer access enters the public list. Bounded compact cards link to `/jobs/{id}` and display title/location/type/posted date/skills. Existing global JobsClient was not embedded because its browsing queries can escape the Workplace scope. Post a Job uses the existing organization-aware creation route.

10. **Projects.** Existing projects table filtered by organization_id and status=open, anonymous RLS client, bounded cards linking to `/projects/{id}`. The old standalone ProjectCard assumes a personal publisher and was not supplied fake personal/verification data. Existing creation page/form now accepts a Workplace preselection only after matching the server-fetched active owner/admin memberships. Project creation API and ownership authorization are unchanged.

11. **Content.** Existing organization feed endpoint, status/visibility authorization, safePost, and PostCard reused. Only organization-authored posts enter this feed. Shared author rendering now adds Workplace under an organization author name, preserving the actual logo/name. Feed fetches cancel stale requests, preserve loaded items on pagination failure, deduplicate appended items, offer Retry, and distinguish failure from empty state.

12. **JOX/GLIMPS.** Existing content renderer, format handling, media controls, and autoplay behavior untouched. Chronological All content is retained; no new filtering backend or repost stream. Composer now honors the existing organization query parameter only if it matches its server-authorized organization options, also benefiting the shared JOX composer. Posting APIs still independently enforce authorization.

13. **Follow.** Existing organization_follows and OrganizationFollowButton reused. Signed-in viewers see Follow/Following; anonymous viewers see a login link returning to the Workplace. Count is real existing relationship data. No follower-directory link is introduced.

14. **Owners/admins.** Existing service-side membership lookup requires the current Professional, this Workplace, active status, and owner/admin role. Manage Workplace goes to the existing edit route, which retains its own authorization. Post Job, Post Project, and Create Post link to existing authorized flows. No invites, ownership transfer, or client-only write permission.

15. **Public viewers.** Organization-safe fields, public team/work listings, existing authorized social content, Follow/login, Jobs, and safe website actions. Normal members get no management controls. Existing post visibility checks still govern follower-only posts for eligible signed-in viewers.

16. **Empty states.** People: No team members are listed yet. Jobs: No open jobs right now. Projects: No active projects right now. Content: No Workplace posts yet. Query failures show retry/error guidance rather than false empty results. Existing creation links are available only to authorized owners/admins.

17. **SEO.** The existing route has no per-identity generateMetadata implementation; inherited site metadata is unchanged for both identities. No SEO system added. A future /w route could make entity type more explicit, but would need a deliberate compatibility/canonical plan; no routing migration in Phase 2.

18. **Performance.** Home members request five membership rows (four plus lookahead) and one batched profile query; jobs/projects each request four rows (three plus lookahead). Full sections request 13 rows (12 plus lookahead). Inactive datasets are not queried. Query groups run concurrently. Existing follower count and current-viewer authority/follow queries retained. Content loads only on Home/Content, using the existing bounded feed and serializer, including its existing per-post query cost. No new per-person queries.

19. **Security/RLS.** No policies changed. Public team/jobs/projects use the public anon key without user cookies, so owner/admin session privileges cannot widen public lists. Profile lookups explicitly omit is_private=true. Management checks use the existing service-side permission pattern. Organization projection replaces select(*) with only displayed public identity fields. No private membership metadata or credentials are serialized. Base organization/member policies are not fully checked into the repository; actual public visibility must be verified against production policy behavior in final QA, not bypassed.

20. **Mobile.** Static/code review covered 320, 360, 375, 390, 412, and 430px: fluid single-column layout below sm, wrapping hero actions and names, break-all handles/URLs, bounded horizontally scrollable section navigation, two-column cards only at sm+, min-width constraints, and bottom-navigation clearance. Desktop content is capped at max-w-5xl. No browser/device emulation, screenshots, or measured overflow verification claimed.

21. **DB/schema.** None. No new tables, ownership model, migrations, remote SQL, or infrastructure changes.

22. **Services.** Workplace-owned services remain Phase 3+; gigs remain Professional-owned. No Services tab or fake ownership.

23. **Team invites.** Invite/accept/decline/remove/transfer/custom role permissions remain out of scope; current active memberships only.

24. **Contact/inbox.** Website only when valid. DMs remain Professional-to-Professional; no organization recipient or shared inbox.

25. **Verification.** Existing organization.is_verified badge preserved. No inheritance from the current Professional and no new verification workflow.

26. **Analytics.** No analytics dashboard, billing, promotion, ads, or reviews system added.

27. **Validation.** `npx.cmd next typegen`, `npx.cmd tsc --noEmit`, and `git diff --check` passed. `node scripts/test-workplace-public.cjs` passes bounded/scoped query, status/privacy filtering, batch profile lookup, honest role, pagination, safe URL, and error-state checks plus 24 server-rendered section/role combinations. The rendering checks use mocked service responses and child components; they are not browser or live Supabase tests. Static diffs confirm the Professional body, organization follow API, work creation APIs, social serializer, media renderer, and autoplay logic are preserved.

28. **git diff --stat.** Exact tracked-file output below. It includes the pre-existing public/sw.js diff and omits untracked files; the task file list includes new files separately.

29. **git status --short.** Exact output below. Nothing staged. Existing Git global-ignore/line-ending warnings do not constitute validation failures.

30. **public/sw.js.** Untouched and local-only, not staged or committed. Before/after SHA-256: B1E2C71C59683D97B5FB0B649EF2327F279727F980821DC89E0AF3179C4816F6.

31. **Known limitations.** Browser/live-data QA remains. Public team visibility depends on existing RLS; no public policy was invented. People pagination may show sparse pages after privacy filtering, and no full public People total is claimed. Existing social endpoint pagination is inherited: timestamp-only cursors and visibility filtering after its bounded query can skip tied timestamps or stop early when many rows are invisible to a viewer. No speculative feed rewrite was included. Global metadata and Phase-1 cross-table username concurrency limitation remain unchanged. Existing deferred Services, Inbox, team lifecycle, verification, analytics, and billing gaps remain.

32. **SAFE FOR FINAL QA: YES.** Local implementation is ready for review and the requested browser/live-data checks. No commit/push/deploy performed; wait for review.

## Task files

- `app/projects/new/page.tsx`
- `app/u/[username]/page.tsx`
- `components/projects/ProjectForm.tsx`
- `components/social/CreatePostComposer.tsx`
- `components/social/OrganizationSocialFeed.tsx`
- `components/social/SocialHomeFeed.tsx`
- `components/organizations/PublicWorkplace.tsx`
- `docs/workplace-phase2-review.md`
- `lib/organizations/public.ts`
- `scripts/test-workplace-public.cjs`

## Tracked diff stat

```text
 app/projects/new/page.tsx                    |  6 +++--
 app/u/[username]/page.tsx                    | 13 +++++-----
 components/projects/ProjectForm.tsx          |  4 +--
 components/social/CreatePostComposer.tsx     |  2 +-
 components/social/OrganizationSocialFeed.tsx | 37 +++++++++++++++++++++++++++-
 components/social/SocialHomeFeed.tsx         |  1 +
 public/sw.js                                 |  2 +-
 7 files changed, 51 insertions(+), 14 deletions(-)
```

## Worktree status

```text
 M app/projects/new/page.tsx
 M app/u/[username]/page.tsx
 M components/projects/ProjectForm.tsx
 M components/social/CreatePostComposer.tsx
 M components/social/OrganizationSocialFeed.tsx
 M components/social/SocialHomeFeed.tsx
 M public/sw.js
?? components/organizations/PublicWorkplace.tsx
?? docs/workplace-phase2-review.md
?? lib/organizations/public.ts
?? scripts/test-workplace-public.cjs
```
