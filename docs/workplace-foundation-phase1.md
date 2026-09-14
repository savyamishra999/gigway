# Workplace Foundation V1 - Phase 1 review

Implemented locally for review. No commit, push, deployment, remote SQL, or infrastructure changes.

1. **Existing routes reused.** `/profile`, `/profile/edit`, `/profile/complete`, `/u/{username}`, `/organizations/new`, `/organizations/{username}/edit`, `/api/identity/username`, `/api/identity/complete`, `/api/profile`, `/api/organizations/username`, `/api/organizations/create`, and `/api/organizations/{username}`. Public routing still resolves Professionals before organizations. Existing organization social and work routes remain intact.

2. **Internal model reused.** `organizations`, `organization_members`, active membership status, owner/admin roles, existing `company`/`organization` entity values, `organization_follows`, `posts.author_organization_id`, `jobs.organization_id`, `projects.organization_id`, and `canPostAsOrganization`. No second Workplace backend or membership model.

3. **Files changed.** Exact task file list follows below. `public/sw.js` was already modified before this task and is excluded from the task list.

4. **Account behavior.** `/profile` now presents My Account and the requested subtitle, a compact Professional Identity card with public/edit actions, a Workplace summary (up to three names with real count and additional-count indicator), and account links. The previous duplicated biography, skills, portfolio, career, reviews, and company presentation is removed from the account page; profile data is not deleted or rewritten. Public identity and existing editing routes remain available.

5. **Avatar dropdown.** Display name and @username; View Professional Identity; Edit Professional Identity; My Workplaces; GigWay Pro; Professional Tools; Saved; My Account; Help & Support; Sign out. View targets `/u/{currentUsername}`. Without a username it explicitly offers Complete Professional Identity at `/profile/complete`. VIJOX/GLIMPS are removed from account items and retained in primary navigation. Mobile bottom Profile is relabeled Account, retaining `/profile`.

6. **My Workplaces.** New `/workplaces` server page authenticates the current Professional, queries active memberships through the existing session client, displays logo/name/handle/role, and provides View for each result. Only owners/admins receive the per-Workplace Manage action. Empty state explains creation and the header Create Workplace CTA remains available. Query errors are not represented as empty membership lists. No fake counts or inactive membership display.

7. **Create Workplace.** Existing three-step OrganizationForm, route, upload fields, creation API, and owner membership insertion are reused. Heading and supporting copy use Workplace. Existing entity subtype values remain unchanged. Success still opens `/u/{username}`. Availability feedback handles network failures/stale requests; final submission always uses server validation. Edit uses the same form and existing authorized PATCH route.

8. **Public Workplace.** Subtle Workplace type label replaces ORGANIZATION. Name/handle wrapping improves narrow layouts. Existing branding, about, verification flag, follower count, and social feed remain. Feed heading color now suits its existing white parent card. No new jobs/projects/services/inbox sections.

9. **Professional self-view.** Existing self check is retained; self has no Connect, Follow, or Message actions. Added Edit Professional Identity action to the same canonical `/u/{username}` page.

10. **Other-user behavior.** Existing authenticated non-self connection/follow/message controls and their routes remain unchanged. Logged-out behavior is unchanged.

11. **Intent labels.** Presentation metadata now uses Open to Jobs, Open to Freelance, Offers Services, Hiring Talent, and Open to Connect. Stored values and role bridging are untouched. Existing compactIntentLabels maximum-two-plus-N behavior is untouched; full public identity badges retain their existing full-list behavior.

12. **Cross-table username validation.** Shared server-only `checkUsernameClaim` trims/lowercases with the existing helper, validates existing syntax/reserved words, and checks both profiles and organizations case-insensitively. Literal underscores are escaped in ILIKE. Queries return only availability/errors to callers. Service-role reads prevent session RLS from concealing a collision. Database/query failures fail closed with a friendly 503.

13. **Professional protection.** Authenticated availability checks, identity completion writes, and profile PATCH username writes use the shared guard. Exclusion is limited to the authenticated Professional's own row in profiles; an organization with the same handle still blocks the claim.

14. **Workplace protection.** Availability and create check both tables. Authorized PATCH excludes only that Workplace's own organization row; a Professional or another Workplace blocks it. Blank handles cannot clear a Workplace username. Existing server owner/admin authorization still runs before editing.

15. **Final-write revalidation.** All four write endpoints recheck immediately before the username-bearing insert/update. Final database 23505 conflicts return a friendly username-unavailable response. Endpoint tests verify conflicts and availability-check failures stop the write, and duplicate write errors are handled cleanly.

16. **Concurrency limitation.** Application-level cross-entity collision prevention added; database-level atomic namespace uniqueness remains a known concurrency limitation unless production schema is later audited and a safe DB strategy is designed. Concurrent writes to different tables can still pass both checks. No global registry or speculative migration was added. Existing collisions are not automatically repaired; direct database writes are outside this application guard.

17. **Jobs regression review.** Static diff review: jobs API, management helper, ownership columns, authorization, and storage behavior unchanged. Job form/detail visible entity labels changed only. No runtime database regression claim.

18. **Projects regression review.** Static diff review: project API, management helper, ownership columns, and authorization unchanged. Project form visible entity label changed only.

19. **Organization content regression review.** Posting APIs, canPostAsOrganization, author_organization_id, media handling, and feed API unchanged. Existing author-selector values and requests are unchanged; visible labels use Workplace.

20. **Followers regression review.** Follow APIs, relationship values, event identifiers, and counts unchanged. Organization follow accessibility label and Following-list entity label use Workplace.

21. **Services/Gigs limitation.** Workplace-owned services are not yet implemented; existing gigs remain Professional-owned.

22. **Team management limitation.** Existing state is displayed only. Invite Professional, accept/decline, role assignment, remove member, and transfer ownership remain future work.

23. **Contact/inbox limitation.** DMs remain Professional-to-Professional. Misleading inbox empty-state copy mentioning organization conversations was corrected. No Workplace recipient or shared inbox architecture was added.

24. **Verification limitation.** Existing Workplace is_verified rendering is preserved. Professional/company-account verification and Workplace verification remain different mechanisms; existing job badge fallback ambiguity remains a future cleanup item. No verification flow added.

25. **DB/schema changes.** None. No migration created or run. Production base organization/membership schema and deployed policies were not queried or inferred.

26. **Security/RLS.** No RLS changes. Membership listing uses the current session and active filters. Per-Workplace management controls align with existing owner/admin server authorization. Namespace service client remains server-only and never serializes IDs, rows, or credentials to callers. Existing broader API/profile-field policies were not redesigned in this phase.

27. **Performance.** Each username check adds two parallel, limited ID-only reads. No per-member hub queries: one membership join supplies the list. `/profile` now uses a small profile projection and one membership join, omitting its previous review/intents/full-profile reads. Production ILIKE index/query performance is unmeasured and should be checked with the real schema if scale requires it.

28. **Mobile review.** Static layout review covered 320, 360, 375, 390, 412, and 430px: fluid single-column cards, min-width constraints, wrapping names/handles/actions, bottom-navigation clearance, scrollable dropdown, and wrapping form footer. Header controls/logo were compacted below sm to fit the narrowest width, including the existing moment icon. No browser, screenshots, device emulation, or measured overflow QA was performed. Test these six widths during final browser QA, with long names/handles and empty/owner/admin/member fixtures.

29. **Validation.** `npx.cmd next typegen` passed. `npx.cmd tsc --noEmit` passed after changes and route generation. `git diff --check` passed. `node scripts/test-workplace-foundation.cjs` passed 28 checks without live database calls. These cover normalization, both entity tables, unchanged-owner handles, other-owner collisions, underscore escaping, invalid handles, failed checks, active memberships/role controls, empty/error states, and all four final-write conflict paths. Static review covered navigation destinations, self/other-user conditions, copy, and untouched work/social APIs. No production smoke test or browser QA claimed.

30. **git diff --stat.** Exact output below. Git's tracked-file stat includes the pre-existing public/sw.js change and excludes new untracked files; the task file list includes new files separately.

31. **git status --short.** Exact output below. All work remains unstaged. Git emits an environment warning about unreadable global ignore configuration and an existing sw.js line-ending warning; neither caused a diff-check failure.

32. **public/sw.js.** Not intentionally modified, staged, or committed. SHA-256 before and after implementation is identical: `B1E2C71C59683D97B5FB0B649EF2327F279727F980821DC89E0AF3179C4816F6`. Its existing generated/local diff is preserved.

33. **Known limitations.** Browser/live Supabase QA remains; cross-table namespace checks are not atomic; existing collisions and incomplete base schema are unresolved; current two-step organization/owner creation still uses compensating cleanup rather than a transaction. Services ownership, full team management, Workplace inbox, dedicated verification, and analytics remain outside Phase 1. Existing legacy company/profile abstractions remain.

34. **SAFE FOR FINAL QA: YES.** Ready for final review and browser QA, with the documented concurrency limitation. This is not a deployment approval. No commit/push/deploy/remote SQL was performed.

## Task files

- `app/api/identity/complete/route.ts`
- `app/api/identity/username/route.ts`
- `app/api/organizations/[username]/route.ts`
- `app/api/organizations/create/route.ts`
- `app/api/organizations/username/route.ts`
- `app/api/profile/route.ts`
- `app/create/page.tsx`
- `app/home/page.tsx`
- `app/jobs/[id]/page.tsx`
- `app/messages/page.tsx`
- `app/organizations/[username]/edit/page.tsx`
- `app/organizations/new/page.tsx`
- `app/profile/edit/page.tsx`
- `app/profile/page.tsx`
- `app/u/[username]/[list]/page.tsx`
- `app/u/[username]/page.tsx`
- `components/discover/DiscoverClient.tsx`
- `components/jobs/JobForm.tsx`
- `components/layout/Footer.tsx`
- `components/layout/ModernNavbar.tsx`
- `components/organizations/OrganizationFollowButton.tsx`
- `components/organizations/OrganizationForm.tsx`
- `components/profile/EditProfileForm.tsx`
- `components/projects/ProjectForm.tsx`
- `components/social/CreatePostComposer.tsx`
- `components/social/GlimpsCreateComposer.tsx`
- `components/social/OrganizationSocialFeed.tsx`
- `components/social/SocialHomeFeed.tsx`
- `lib/workIntents.ts`
- `app/workplaces/page.tsx`
- `docs/workplace-foundation-phase1.md`
- `lib/identity/username-server.ts`
- `lib/organizations/server.ts`
- `scripts/test-workplace-foundation.cjs`

## Tracked diff stat

```text
 app/api/identity/complete/route.ts                 |   8 +-
 app/api/identity/username/route.ts                 |  14 +-
 app/api/organizations/[username]/route.ts          |  15 +-
 app/api/organizations/create/route.ts              |   9 +-
 app/api/organizations/username/route.ts            |   9 +-
 app/api/profile/route.ts                           |  25 +-
 app/create/page.tsx                                |   4 +-
 app/home/page.tsx                                  |   2 +-
 app/jobs/[id]/page.tsx                             |   2 +-
 app/messages/page.tsx                              |   2 +-
 app/organizations/[username]/edit/page.tsx         |   2 +-
 app/organizations/new/page.tsx                     |   2 +-
 app/profile/edit/page.tsx                          |   2 +-
 app/profile/page.tsx                               | 383 ++-------------------
 app/u/[username]/[list]/page.tsx                   |   2 +-
 app/u/[username]/page.tsx                          |  11 +-
 components/discover/DiscoverClient.tsx             |   8 +-
 components/jobs/JobForm.tsx                        |   2 +-
 components/layout/Footer.tsx                       |   2 +-
 components/layout/ModernNavbar.tsx                 |  32 +-
 .../organizations/OrganizationFollowButton.tsx     |   2 +-
 components/organizations/OrganizationForm.tsx      |  38 +-
 components/profile/EditProfileForm.tsx             |  17 +-
 components/projects/ProjectForm.tsx                |   2 +-
 components/social/CreatePostComposer.tsx           |   2 +-
 components/social/GlimpsCreateComposer.tsx         |   2 +-
 components/social/OrganizationSocialFeed.tsx       |   2 +-
 components/social/SocialHomeFeed.tsx               |   2 +-
 lib/workIntents.ts                                 |  10 +-
 public/sw.js                                       |   2 +-
 30 files changed, 181 insertions(+), 434 deletions(-)
```

## Worktree status

```text
 M app/api/identity/complete/route.ts
 M app/api/identity/username/route.ts
 M app/api/organizations/[username]/route.ts
 M app/api/organizations/create/route.ts
 M app/api/organizations/username/route.ts
 M app/api/profile/route.ts
 M app/create/page.tsx
 M app/home/page.tsx
 M app/jobs/[id]/page.tsx
 M app/messages/page.tsx
 M app/organizations/[username]/edit/page.tsx
 M app/organizations/new/page.tsx
 M app/profile/edit/page.tsx
 M app/profile/page.tsx
 M app/u/[username]/[list]/page.tsx
 M app/u/[username]/page.tsx
 M components/discover/DiscoverClient.tsx
 M components/jobs/JobForm.tsx
 M components/layout/Footer.tsx
 M components/layout/ModernNavbar.tsx
 M components/organizations/OrganizationFollowButton.tsx
 M components/organizations/OrganizationForm.tsx
 M components/profile/EditProfileForm.tsx
 M components/projects/ProjectForm.tsx
 M components/social/CreatePostComposer.tsx
 M components/social/GlimpsCreateComposer.tsx
 M components/social/OrganizationSocialFeed.tsx
 M components/social/SocialHomeFeed.tsx
 M lib/workIntents.ts
 M public/sw.js
?? app/workplaces/
?? docs/workplace-foundation-phase1.md
?? lib/identity/
?? lib/organizations/
?? scripts/test-workplace-foundation.cjs
```
