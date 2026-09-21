# GigWay Professional Identity / Profile Product Audit

**Status:** Audit only. No application, schema, RLS, migration, deployment, or service-worker changes were made.

## 1. Current profile summary

GigWay currently has three distinct surfaces:

- **Public Professional Identity:** `/u/{username}`. A dark, public-facing profile containing identity, professional fields, Workplace memberships, relationship actions, and four social-content tabs.
- **My Account:** `/profile`. A light account hub with a small identity summary, Workplace summary, and links to Pro, Saved, and Support.
- **Edit Professional Identity:** `/profile/edit`. A dark seven-tab form plus a separately saved Work Modes editor.

`/profile/complete` is the required-identity gate. Its ordinary path asks for Name, Username, and an optional Photo, then sends the user to Home or a safe preserved destination. Work Modes appear only when a legacy destination requires a role.

The public identity partially answers “who are you?” and “what do you do?”, and strongly supports “what are you saying/creating?” through GigThoughts, JOX, GLIMPS, and Reposts. It weakly answers “what have you done?” and “how can I work with you?” because work proof is only free-text experience and portfolio links, active Gigs/Projects/Jobs are not assembled into a public Work section, and the header has no contextual work CTA.

The implementation still contains two generations of profile UI. The active `/u/{username}` page is a custom dark identity page. Older `app/profile/ProfileHeader.tsx`, `components/profile/ProfileHeader.tsx`, two ProfileSkills implementations, and the unused `ProfileCompletion` component express older freelancer/account models.

## 2. Current field inventory

The repository does not contain the original base `profiles` table creation, so base-field storage is evidenced by active reads/writes rather than inferred SQL. Later additions are evidenced by migrations 010, 013, 014, and 015.

| Field | Class | Storage | Edited today | Public display today | Required today | Recommendation | Onboarding | Completion |
|---|---|---|---|---|---|---|---|---|
| `id` | F private/system | `profiles.id` | Never | Never shown; used for relationships/content | System | Keep | No | No |
| `email` | F private | `profiles.email` | Auth/provider | Not on `/u` | Auth identity | Keep private | No | No |
| `full_name` | A core | `profiles.full_name` | Onboarding, Profile tab | Header, lists, content authors | Required for minimum identity | Keep | Yes; Google prefill for new users | Required gate |
| `username` | A core | `profiles.username` | Onboarding/API; edit UI says it is managed elsewhere but provides no editor | Header, URL, lists | Required for minimum identity | Keep; provide one clear management policy | Yes | Required gate |
| `avatar_url` | A core | `profiles.avatar_url`; images in existing `avatars` bucket | Onboarding and Profile tab | Header, navbar, Home/social/network cards | Optional/skippable | Keep and strongly recommend | Yes, skippable | Recommended milestone |
| `tagline` | B professional | `profiles.tagline` | Profile tab | Header only when Bio is empty; social author data | Optional | Keep as canonical professional headline; never substitute Bio for it | No | Recommended |
| `bio` | B professional | `profiles.bio` | About tab | Header in place of tagline and repeated in About | Optional | Keep as About; remove header duplication | No | Recommended |
| `location` | B professional | `profiles.location` | About tab | Header | Optional | Keep, coarse location only | No | Optional/recommended |
| `job_function` | B professional | `profiles.job_function` | Skills tab | “What I Do” chips | Optional | Keep; rename in UI to professional focus/roles | No | Recommended signal |
| `skills` | B professional | `profiles.skills` | Skills tab | Skills section, discovery/ranking inputs | Optional | Keep | No | Recommended milestone |
| `experience_years` | B professional | `profiles.experience_years` | Work tab for job-seeking intent | Experience section | Optional | Keep as supporting metadata, not standalone proof | No | Do not score alone |
| `experience_description` | B professional | `profiles.experience_description` | Work tab for job-seeking intent | Experience section | Optional | Keep until structured work proof exists | No | Can satisfy Work Proof milestone |
| `education` | B/G professional legacy | `profiles.education` from migration 013 | Not edited by active form | Not displayed on `/u` | Optional | Defer; define structure and purpose before exposing | No | No today |
| `portfolio_links` | B/D professional/work proof | `profiles.portfolio_links` | Portfolio tab | Portfolio section | Optional; free/Pro limit applies to additions | Keep as current work proof | No | Can satisfy Work Proof milestone |
| `linkedin_url` | B professional | `profiles.linkedin_url` | Work tab for job-seeking intent | Not displayed on `/u` | Optional | Keep as external proof/link; surface under Links, not header | No | Optional |
| `cv_url` | F/D private work data | `profiles.cv_url` | Work tab through ResumeCard | Not displayed publicly | Optional | Keep private/application-facing | No | No |
| `resume_url` | G duplicate/legacy | `profiles.resume_url` from migration 013 | Not used by active editor | Not public | Optional | Merge/deprecate after data audit in favor of one canonical resume field | No | No |
| `expected_salary` | F/D private opportunity preference | `profiles.expected_salary` | Work tab for job-seeking intent | Not public | Optional | Keep private; normalize later if matching needs it | No | No |
| `preferred_job_type` | D work preference | `profiles.preferred_job_type` | Work tab for job-seeking intent | Not public | Optional | Keep for matching; optionally summarize publicly only by user choice | No | No |
| `hourly_rate` | D work | `profiles.hourly_rate` | Work tab for service intent | Header only when `offering_services` is active | Optional | Keep; place in contextual Work/Services area | No | No |
| `availability` | D work | `profiles.availability` | Work tab for service intent | Not displayed by active `/u`; only old header component supports it | Optional | Keep but merge conceptually with additive intents | No | Optional |
| `profile_intents.intent_type` | D work/opportunity | `profile_intents`, active rows | Separate Work Modes editor | Header badges | Optional except legacy role-gated destinations | Keep as primary additive public intent vocabulary | Usually no | Recommended professional signal |
| `user_roles` | G legacy | `profiles.user_roles` | Bridged during special completion; not directly edited | Not public | Required by some legacy routes | Retain for compatibility, hide from product language | No | No |
| `find_work_type` | G legacy | `profiles.find_work_type` | Derived bridge | Not directly public | Legacy route configuration | Merge behind intents; do not present as identity type | No | No |
| `hire_talent_type` | G legacy | `profiles.hire_talent_type` | Derived bridge | Not directly public | Legacy route configuration | Merge behind intents/Workplace model | No | No |
| `account_type` | G legacy | `profiles.account_type` | Derived bridge | Not public | Legacy | Deprecation candidate after dependency audit | No | No |
| `company_name` | G/H legacy person/company overlap | `profiles.company_name` | Work tab only for hiring intent without Workplace | Not public | Optional | Move company identity to Workplaces; retain only until compatibility plan exists | No | No |
| `company_size` | G/H | `profiles.company_size` | Same branch | Not public | Optional | Move to Workplaces | No | No |
| `company_website` | G/H | `profiles.company_website` | Same branch | Not public | Optional | Move to Workplaces | No | No |
| `industry` | G/H | `profiles.industry` | Same branch | Not public | Optional | Move to Workplaces | No | No |
| `gst_number` | C/F trust/private | `profiles.gst_number` | Same branch | Not public | Optional | Private verification/business data; remove from personal identity editor when Workplace flow owns it | No | No |
| `phone` | F private/contact | `profiles.phone` | Preferences tab; currently required to save any edit | Not selected or shown by `/u` | Accidentally mandatory for all profile saves | Keep private/contact; remove global save blocker in future implementation | No | No |
| `phone_is_public` | F privacy | `profiles.phone_is_public` | Preferences tab | UI claims public, but `/u` does not read/show phone | Optional | Keep only if public contact display is intentionally implemented; otherwise wording is misleading | No | No |
| `is_private` | F privacy | `profiles.is_private` | Preferences tab | Not rendered; visibility depends on existing RLS behavior | Optional | Keep, but explain exact audience; current “companies and admin” text is not demonstrated in page code | No | No |
| `profile_completed` | F system | `profiles.profile_completed` | Identity completion API | Not public; gates routes/discovery | Name/Username completion flag | Keep as minimum-identity gate; rename conceptually to `identity_ready` in product language | System | Gate, not quality percentage |
| `is_verified` | C trust | `profiles.is_verified` | Not edited by profile form | Check icon in public header/lists/social author | No | Keep public with accessible label/tooltip | No | Trust milestone only when earned |
| `verification_status` | C/F trust workflow | `profiles.verification_status` | External verification flow/admin | Not shown directly on public identity | No | Keep workflow private; map approved state to public badge | No | No percentage |
| `is_employer_verified` | C/G | `profiles.is_employer_verified` | Not edited here | Not shown on public identity | No | Move trust semantics to Workplace where possible | No | No |
| `avg_rating` / review data | C trust | Existing profile/review paths outside `/u` | Review system | Legacy `/freelancers/[id]`, not current public identity | No | Reuse on canonical identity only after rating scope is clear | No | No |
| Workplace memberships | B/C professional/trust | `organization_members` + `organizations` | Workplace flows | Founder/role line and Workplaces section | No | Keep | No | Can satisfy affiliation/work-proof milestone |
| Follow state/counts | E social | `profile_follows` | Follow actions | Header counts/actions | No | Keep; treat as reach, not trust | No | No |
| Connection state/count | E social/network | `professional_connections` | Connect actions | Header count/action | No | Keep; separate mutual connection from one-way follow | No | No |
| Posts/content | E social/content | `posts`, `post_reposts`, media tables | Social composers | Four tabs | No | Keep, with reduced empty-tab noise | No | No |
| Gigs/Projects/Jobs ownership | D work | `gigs.freelancer_id/owner_id`, `projects.client_id`, `jobs.client_id`; organization ownership also exists | Marketplace flows | No dedicated canonical profile section; only shared/reposted items may appear | No | Assemble an explicit Work section from supported associations | No | Work Proof milestone where applicable |

### Product recommendations: missing concepts

These are not current fields:

- A canonical **work-proof item** abstraction that can represent a completed project, case study, credential, or GigWay outcome without relying only on free text.
- A clear **preferred contact/work CTA policy** derived from existing intents and owned marketplace items.
- A structured **credential/education presentation contract** if `education` is retained.
- A canonical **resume field** because `resume_url` and `cv_url` overlap.
- A trustworthy **completed-work metric** only if backed by real GigWay transaction/project lifecycle data.

Do not add these merely to fill sections; each needs an owned data source and privacy rules.

## 3. What is good today

- One canonical public URL and shared username namespace across people and Workplaces.
- New-user gate is short: Name, Username, optional Photo.
- Google photo is an explicit import into existing storage and does not overwrite an existing avatar.
- Public profile already supports simultaneous work, hiring, networking, and content intents; it is not locked to one account type.
- Connect, Follow, and Message are distinct and available contextually.
- Public sections with no data are mostly omitted: About, Skills, Experience, What I Do, Portfolio, and Workplaces.
- Social tabs load on demand and paginate.
- Public viewer controls and counts are deferred with Suspense and bounded failure states.
- Long names and usernames use wrapping; social tabs horizontally scroll on narrow screens.
- The profile exposes real affiliations and separates person and Workplace identities.

## 4. What is confusing or redundant

- Header displays `bio || tagline`, so a Bio hides the professional headline. Bio then repeats in About.
- Seven edit tabs plus a separate Work Modes save create fragmented persistence.
- Phone is required before **any** edit can save, despite not being part of minimum identity and not appearing publicly.
- Username copy says it is managed in “Work Intents setup,” but the current Work Modes editor does not edit username.
- “Profile,” “Professional Identity,” and “My Account” coexist without a single navigation vocabulary.
- Legacy role fields and modern additive intents both control edit sections.
- Company fields on the personal profile duplicate the Workplace model.
- `cv_url` and `resume_url` overlap.
- Multiple unused ProfileHeader/ProfileSkills/ProfileCompletion components preserve inconsistent older designs.
- The Home prompt’s “67%” is exactly 2 of 3 basic fields, not professional completeness; it looks more precise than the model warrants.
- The public profile does not display LinkedIn, availability, preferred job type, phone, or active marketplace work even though the editor collects them.
- “Phone Public” claims a behavior the canonical public profile does not implement.
- The active public identity has no GigWay Pro marker; Pro currently appears as an account navigation/feature entitlement, which is preferable to treating payment as trust.

## 5. Final recommended public profile structure

1. **Identity header**
   - Avatar
   - Name + verified badge
   - `@username`
   - Canonical professional headline (`tagline`)
   - Location and one compact affiliation line
   - Additive intent badges, limited to two plus overflow
   - Primary relationship actions

2. **About**
   - `bio` only; omit when empty for visitors.

3. **Professional signals**
   - Professional focus (`job_function`)
   - Skills
   - Compact experience summary
   - Affiliations/Workplaces

4. **Work**
   - Owned active services/Gigs
   - Relevant owned Projects/Jobs where the person is the actor
   - Portfolio links
   - Future completed work proof when backed by real data

5. **Content**
   - GigThoughts, JOX, GLIMPS, Reposts

6. **Trust**
   - Verification
   - Ratings/reviews only when scope and source are explicit
   - Real completed-work evidence

Keep private preferences, salary, CV, phone visibility settings, GST, and completion prompts out of the public hierarchy.

## 6. Final recommended profile header

### Mobile first-viewport order

1. 80–96 px circular avatar.
2. Name with adjacent accessible verification badge.
3. Username.
4. Headline, always `tagline`; never Bio.
5. Location + primary Workplace affiliation on a compact metadata line.
6. At most two intent badges.
7. Actions:
   - Visitor: **Connect** primary, **Follow** secondary, **Message** compact.
   - Owner: **Edit Identity** primary and **View as visitor** secondary.
   - Contextual work action only when supported: “View services,” “Hire,” or “Open to work.”
8. Counts as a quiet secondary row after actions.

Current 96 px square-rounded avatar is visually strong but inconsistent with circular person avatars elsewhere. The public profile should use the shared circular person-avatar convention. Workplace logos remain rounded squares.

The existing header is close on identity and relationship actions, but it fails “what they do” whenever Tagline is displaced by Bio, and it does not surface a direct work path.

## 7. Keep / move / merge / remove / defer

| Decision | Items |
|---|---|
| **Keep** | Name, username, avatar, tagline, bio, location, job functions, skills, experience summary, portfolio, intents, affiliations, verification, Connect/Follow/Message, social content |
| **Move** | Hourly rate/availability from generic header into Work/Services; LinkedIn into Links/Proof; phone/CV/salary/privacy into My Account or private opportunity preferences; company/GST fields into Workplace |
| **Merge** | `cv_url` and `resume_url`; legacy role concepts behind additive intents; duplicated header/skills components; repeated Bio/header copy |
| **Remove from active UX** | Mandatory phone validation for unrelated edits; public-completion percentage; misleading username management copy; empty visitor sections; company form fallback once Workplace compatibility is resolved |
| **Defer** | Structured education/credentials, completed-work score, public review integration, preferred contact method, profile ranking changes |

## 8. Profile completion model

### Required

- Name
- Username

These determine **Identity ready**, not “100% professionally complete.”

### Recommended milestones

Use five meaningful milestones rather than equal weighting of every column:

1. **Recognizable identity:** avatar.
2. **Professional introduction:** tagline and Bio.
3. **Professional focus:** at least one job function or meaningful skill set.
4. **Work proof:** portfolio link, experience description, owned service/project, or Workplace affiliation.
5. **Opportunity intent:** at least one active profile intent.

Verification is earned trust and must not be required for 100%. Phone, CV, salary, company details, follower count, posts, and paid plan must not count.

### Presentation

- Use a checklist with “3 of 5 professional milestones” and one next-best action.
- If a percentage is retained, calculate equal **milestones**, not raw fields, and label it “Identity strength,” not “Profile complete.”
- Prefer no percentage on Day 0. “Your identity is live” plus the next useful action is clearer.
- “Strong profile” should appear when all five owner-controlled milestones are satisfied.
- 100% must be realistically achievable without payment, popularity, verification, or content production.
- After completion, remove the progress card and optionally show a small “Identity ready” state in My Account.
- Do not show completion publicly.
- Discovery may eventually use individual meaningful signals, with transparent/fair rules; never rank directly by a cosmetic completion percentage.

The current hard-coded **67%** is misleading because it only means Name and Username exist while Photo does not. Replace it with “Add a profile photo” until the milestone system exists.

## 9. Completion UX

- **First-time onboarding:** Name, Username, Photo/Google Photo/Skip. No percentage.
- **Home:** one compact next-best-action card. Reappear after a sensible interval if dismissed or after the user visits their profile; do not render on every page.
- **My Account:** persistent but quiet checklist, expandable to all remaining milestones.
- **Public profile:** no completion UI. Hide empty optional visitor sections.
- **Profile edit:** section-level status and a sticky/visible save state. Show the next missing milestone without blocking unrelated saves.
- **Mobile:** one action per card, short copy, no modal, no large radial meter.

## 10. Profile photo/avatar recommendation

Current sizes and shapes:

- Onboarding: prominent 128 px circle.
- Public person profile: 96 px rounded square.
- Navbar: 32/36 px circle.
- My Account: 48 px circle.
- Social/network/list rows: mostly 28–44 px circles.
- Shared `ProfileAvatar`: circular initials or User icon.

Standardize people as circles:

- 96 px public header
- 128 px onboarding
- 48 px account/cards
- 32–44 px navigation/social

Use the shared initials algorithm (up to two initials) everywhere. The public page currently uses one initial or “?”, while other surfaces use one/two initials or a User icon. A neutral indigo-tinted fallback is professional; avoid bright gradients as the default identity.

Google import is architecturally sound: explicit user action, server-side metadata source, HTTPS Google host restriction, file validation, copy into the existing bucket, and existing-avatar protection. Real OAuth/device import remains a production verification item.

## 11. Color and visual hierarchy

Actual tokens use indigo as primary, coral as accent, emerald as success, midnight/slate/ivory for light surfaces, and `#0A0A0F` / `#15151d` dark identity surfaces.

Current profile strengths:

- Dark public identity feels distinctive and premium.
- Indigo supports identity/actions.
- Muted gray hierarchy is generally coherent.

Problems:

- Active profile/edit pages use many direct hex values rather than shared brand tokens.
- Legacy headers introduce gold, blue, green, yellow, and red semantics inconsistent with the canonical identity.
- Intent badges can multiply colors and compete with the person’s core identity.
- `/profile` is light while public/edit are dark, making the system feel assembled from different products.

Recommended restrained system:

- One neutral background system per surface, with consistent card/border tokens.
- Indigo: primary action, selected tab, professional identity.
- Coral: rare creation/emphasis, not generic metadata.
- Emerald: confirmed success only.
- Violet tint: verification/intent accents, limited.
- Neutral slate: counts and supporting metadata.
- Social format colors may appear inside content cards, not across the identity header.

## 12. Empty-state strategy

### Owner

Show one next-best action based on milestone order:

1. Add photo.
2. Add headline.
3. Add 3–5 skills/professional focus.
4. Add work proof.
5. Choose opportunity intents.
6. Then suggest first GigThought or JOX.

Owner-only empty content may offer “Post your first GigThought,” “Record your first JOX,” or “Share a GLIMPS,” but should not render four large empty panels.

### Visitor

- Hide empty About, Skills, Experience, Work, Portfolio, and Workplace sections.
- Social navigation should show only populated tabs when counts are cheaply available; otherwise keep the four-tab control but use one compact empty message.
- Preserve a polished header with fallback avatar, headline fallback only if truthful, actions, and existing identity data.
- Never show “67%,” missing-field lists, or account setup status.

## 13. Profile edit workflow

Current behavior is one final “Save Changes” request for seven client-side tabs, while Work Modes have their own separate Save. This is long, fragmented, and risky: users can edit several tabs, then phone validation blocks the entire save.

Recommended supported sections:

1. **Identity:** photo, name, username policy, headline, location.
2. **About:** Bio.
3. **Professional:** job functions, skills, experience.
4. **Work & proof:** portfolio, service rate/availability when relevant, LinkedIn, private CV/job preferences.
5. **Opportunities:** additive Work Modes/intents.
6. **Links & contact:** external links and private contact/privacy.
7. **Workplaces:** navigation/summary, with editing owned by Workplace routes.

Use section-level saves because sections already have different validation, privacy, and entitlement rules. Keep explicit Save rather than autosaving complex arrays/uploads. Photo upload can remain immediate with a clear saved/pending state. A sticky mobile save bar is appropriate only within the active section.

The profile API currently accepts an arbitrary JSON object and passes it to `profiles.update`; the implementation task should introduce a server allowlist and validation without changing RLS semantics.

## 14. `/profile` vs `/u/{username}` vs `/profile/edit`

Use these labels consistently:

- **Professional Identity** → public `/u/{username}`
- **Edit Identity** → `/profile/edit`
- **My Account** → `/profile`

Navbar should keep “View Professional Identity,” “Edit Professional Identity,” and “My Account.” Mobile bottom navigation may remain “Account” because it lands on the private hub.

`/profile` should contain private identity-progress, Workplace management, plan, Saved, support, privacy/contact, and account actions. It should not duplicate the public profile.

## 15. Social tab strategy

Current order:

1. GigThoughts
2. JOX
3. GLIMPS
4. Reposts

The order is correct for a professional-first identity. Do not add a generic “Posts” umbrella unless research shows users cannot understand GigThoughts. “Activity” can be a section heading above the existing named formats.

Recommendations:

- Keep format-specific tabs and horizontal scrolling on mobile.
- Add counts only if one inexpensive aggregated query can provide them; do not issue four count queries above the fold.
- For visitors, hide persistently empty formats once counts are available.
- For owners, show empty tabs with concise creation actions.
- Keep social content after professional/work signals so media does not redefine the profile as social-only.
- Reposts remain last because they are less direct evidence of the person’s own work/voice.

## 16. Work/opportunity signal strategy

### Currently supported

- Active intents: Find Jobs, Find Freelance Projects, Offer Services, Hire Talent, Grow Network.
- Hourly rate and availability fields for service-oriented profiles.
- Preferred job types and salary preference, currently private/not public.
- Owned Gigs/services, Jobs, and Projects exist through user IDs.
- Workplace affiliations and roles.
- Marketplace shares/reposts can appear in Reposts.

### Recommendation

- Display at most two compact intent labels in the header.
- Map intent to contextual CTA:
  - Offering services + owned Gigs → “View services.”
  - Looking for projects/jobs → “Connect” remains primary; optionally show “Open to work.”
  - Hiring → “View opportunities” only when owned Jobs/Projects exist.
- Build a Work section from actual owned active records and portfolio links.
- Do not expose expected salary or CV publicly.
- Do not recreate rigid freelancer/client profile types.

## 17. Trust signal strategy

Public:

- Identity verification with label/tooltip.
- Ratings/reviews only with clear transaction/service scope.
- Real Workplace affiliation.
- Completed GigWay work only when backed by lifecycle data.
- Portfolio links as work proof, not verified claims.

Do not treat these as trust:

- Follower/following counts: popularity.
- Connection count: network size.
- Profile completion: owner setup state.
- GigWay Pro: payment/entitlement.
- Self-entered experience years: context, not proof.

## 18. Mobile findings

Source review and the existing public-profile browser fixture cover 320, 360, 375, 390, 412, 430, and 1280 px.

- Header uses `flex-col` until `sm`, so identity and actions stack safely at 320–430 px.
- Name uses `break-words`; username uses `break-all`.
- Action groups use `flex-wrap`.
- Social tabs use horizontal overflow and `min-w-max`, appropriate for four labels.
- Portfolio titles truncate and use a responsive one/two-column grid.
- Skills wrap; the overflow set expands through `details`.
- Fixed mobile bottom navigation requires the existing `pb-24`, which the public page has.
- No public-profile sticky element competes with the header.

Product/mobile concerns:

- 160 px decorative cover plus negative-offset card consumes substantial first-viewport height.
- 96 px square avatar plus five action states can push the professional headline and CTA below the first viewport.
- Counts, intents, and actions can create three wrapping rows.
- Long Bio in the header increases duplication and vertical height.
- Seven edit tabs require horizontal discovery; users may not notice off-screen tabs.
- Phone row combines a flexible input with a non-wrapping visibility control and is the highest-risk edit-layout row at 320 px.
- Social post components need the same width constraints recently applied to Home when embedded inside the narrower dark profile card.

Implementation acceptance should explicitly test long 60+ character names, 30-character usernames, all three visitor actions, five intent badges, no avatar, long portfolio URLs, and all-empty content at every target width.

## 19. New-user progressive identity journey

### Day 0

Google → Name → Username → Photo or Skip → Home.

### Next best actions

1. **Add a professional headline.** Highest value for immediately explaining what the person does.
2. **Add professional focus.** Choose job functions and 3–5 skills.
3. **Show proof.** Add a portfolio link, experience summary, owned service, or Workplace affiliation.
4. **Choose opportunities.** Additive intents tune discovery and public availability.
5. **Add About.** Useful after headline/focus exist.
6. **Create professional content.** First GigThought or JOX after the identity has context.
7. **Verification.** Offer when useful; never block normal participation.

Prompt one action at a time when it becomes relevant. Do not recreate the full edit form in onboarding.

## 20. Performance risk map

### Public profile initial server path

1. Anonymous profile lookup by username.
2. If absent, sequential Workplace lookup.
3. If both absent, viewer auth check and authenticated profile retry for private/RLS-visible identity.
4. Once a person resolves, intents and memberships load in parallel.

### Deferred viewer-specific header work

- `PersonActions`: memoized `getViewer`, then connection row and follow row in parallel.
- `PersonCounts`: three exact HEAD counts in parallel.
- These are Suspense-wrapped and do not block the core identity card, which is good.

### Social content

- First tab fetch starts after client hydration.
- Standard tabs fetch up to 41 posts, then call `canViewPost` sequentially per row.
- `safePost` expands each displayed post with author/media/count/viewer-state work; a page-level `Promise.all` helps, but each post can still issue several queries.
- Reposts fetch repost/share rows in parallel, then four object collections in parallel, followed by per-post access and serialization.
- Switching tabs creates separate on-demand requests, which is appropriate, but client state resets when profile ID changes.

### Work data

- Canonical public profile currently does not query owned Gigs, Jobs, Projects, reviews, or completed work.
- Adding a Work section must use bounded, batched queries and remain below/deferred from the header.

### Images

- Avatar uses raw `img` on public/profile/social surfaces, with no intrinsic dimensions, responsive image optimization, or explicit error fallback.
- External Google images are copied into GigWay storage during onboarding, avoiding an ongoing Google dependency.
- Portfolio has no preview-image loading today.

### Edit/account

- `/profile/edit` uses `select("*")`, overfetching private and unrelated columns.
- Profile, then intents/memberships are sequential phases.
- My Account correctly loads profile and active Workplaces in parallel.
- Navbar separately fetches the viewer and profile client-side on every mount.

### Above the fold

Must block:

- Public profile identity row only: name, username, avatar, headline, verification, location/affiliation if included.

May defer:

- Relationship state/actions for logged-in viewers.
- Counts.
- Intents if necessary, though one compact set is valuable near the header.
- About, skills, experience, Work, portfolio, Workplaces.
- All content tabs.
- Reviews and reputation detail.

The next performance pass should first batch social visibility/serialization, remove `select("*")`, and avoid introducing four independent work/count queries above the fold.

## 21. Exact files inspected

### Routes and APIs

- `app/u/[username]/page.tsx`
- `app/u/[username]/[list]/page.tsx`
- `app/profile/page.tsx`
- `app/profile/edit/page.tsx`
- `app/profile/complete/page.tsx`
- `app/auth/post-login/page.tsx`
- `app/auth/callback/route.ts`
- `app/home/page.tsx`
- `app/api/profile/route.ts`
- `app/api/identity/complete/route.ts`
- `app/api/identity/username/route.ts`
- `app/api/identity/google-avatar/route.ts`
- `app/api/social/profiles/[id]/posts/route.ts`
- `app/api/social/posts/route.ts`

### Components and libraries

- `components/identity/IdentityOnboarding.tsx`
- `components/identity/WorkModesEditor.tsx`
- `components/profile/EditProfileForm.tsx`
- `components/profile/ProfileCompletion.tsx`
- `components/profile/ProfileHeader.tsx`
- `components/profile/ProfileSkills.tsx`
- `components/profile/SkillsList.tsx`
- `components/profile/editor/PortfolioEditor.tsx`
- `components/profile/editor/ResumeCard.tsx`
- `app/profile/ProfileHeader.tsx`
- `app/profile/ProfileSkills.tsx`
- `components/social/ProfileSocialFeed.tsx`
- `components/social/SocialHomeFeed.tsx`
- `components/social/GlimpsExperience.tsx`
- `components/connections/ProfileConnectionActions.tsx`
- `components/home/IdentityCompletionPrompt.tsx`
- `components/layout/ModernNavbar.tsx`
- `components/ui/image-uploader.tsx`
- `components/ui/profile-avatar.tsx`
- `lib/identity.ts`
- `lib/identity/username-server.ts`
- `lib/roles.ts`
- `lib/workIntents.ts`
- `lib/connections/server.ts`
- `lib/social/server.ts`
- `lib/organizations/server.ts`
- `lib/organizations/public.ts`
- `lib/billing/limits.ts`

### Schema/style evidence

- `supabase/migrations/010_phone_privacy_fields.sql`
- `supabase/migrations/013_user_roles_jobs_applications.sql`
- `supabase/migrations/014_cv_job_fields.sql`
- `supabase/migrations/015_ensure_all_profile_fields.sql`
- `supabase/migrations/016_fix_user_roles_default.sql`
- `supabase/migrations/034_social_feed_foundation.sql`
- `supabase/migrations/036_post_reposts.sql`
- `supabase/migrations/037_professional_connections.sql`
- `supabase/migrations/038_entity_owned_jobs.sql`
- `supabase/migrations/039_entity_owned_projects.sql`
- `supabase/migrations/040_marketplace_shares.sql`
- `tailwind.config.js`
- `app/globals.css`

## 22. Decision

**READY FOR PROFILE IMPLEMENTATION**, with these implementation guardrails:

1. Establish Tagline as the canonical header headline and Bio as About.
2. Replace hard-coded 67% with next-best-action/checklist behavior.
3. Remove phone as a global save prerequisite.
4. Consolidate the edit workflow and server-side update allowlist.
5. Build Work from existing owned records/portfolio without adding a schema first.
6. Keep private preferences and completion state off the public profile.
7. Preserve additive intents; do not revive rigid account types.
8. Treat social content as evidence/voice after identity and work signals.
9. Batch/defer non-header queries in the performance implementation.
