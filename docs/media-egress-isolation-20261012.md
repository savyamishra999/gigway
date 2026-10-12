# Media egress commit isolation - 12 October 2026

Base: `d3f27d47666e3f966a420c96df225c79b50d23d9`. Staging initially empty. Active branch: `main`.

## Accepted files

- `app/api/identity/google-avatar/route.ts`
- `app/api/social/posts/[id]/media/finalize/route.ts`
- `app/freelancers/[id]/page.tsx`
- `app/gig-card/[username]/page.tsx`
- `app/gigs/[id]/page.tsx`
- `app/jobs/[id]/page.tsx`
- `app/messages/[userId]/page.tsx`
- `app/messages/page.tsx`
- `app/social/explore/page.tsx`
- `app/social/glimps/page.tsx`
- `app/social/posts/[id]/media/[mediaId]/public/route.ts`
- `app/social/posts/[id]/opengraph-image/route.tsx`
- `app/social/vijox/page.tsx`
- `app/u/[username]/[list]/page.tsx`
- `app/u/[username]/page.tsx`
- `app/workplaces/page.tsx`
- `components/admin/AdminFreelancersClient.tsx`
- `components/admin/PendingVerificationList.tsx`
- `components/connections/DiscoveryCards.tsx`
- `components/discover/DiscoverClient.tsx`
- `components/freelancers/FreelancerCard.tsx`
- `components/gigs/GigCard.tsx`
- `components/gigs/GigImageUpload.tsx`
- `components/home/FeaturedFreelancers.tsx`
- `components/home/IdentityCompletionPrompt.tsx`
- `components/home/OrganizationsPreview.tsx`
- `components/layout/ModernNavbar.tsx`
- `components/layout/Navbar.tsx`
- `components/onboarding/OnboardingForm.tsx`
- `components/onboarding/ProfileCompleteForm.tsx`
- `components/organizations/PublicWorkplace.tsx`
- `components/profile/EditProfileForm.tsx`
- `components/profile/GigCardProfilePrompt.tsx`
- `components/social/CreatePostComposer.tsx`
- `components/social/GlimpsCreateComposer.tsx`
- `components/social/GlimpsExperience.tsx` - media-only hunks
- `components/social/JoxCompanionImages.tsx` - media-only hunks
- `components/social/JoxOrbitRail.tsx` - media-only hunks
- `components/social/SocialHomeFeed.tsx` - media-only hunks
- `components/social/VijoxExperience.tsx` - media-only hunks
- `components/ui/image-uploader.tsx`
- `components/ui/profile-avatar.tsx`
- `lib/social/server.ts`
- `middleware.ts`
- `scripts/test-makkhan-pass1.cjs`
- `app/api/media/image/route.ts`
- `app/api/media/prepare/route.ts`
- `app/api/social/posts/[id]/media/[mediaId]/file/route.ts`
- `components/ui/media-image.tsx`
- `docs/media-egress-audit-20261012.md`
- `lib/media/deliver-post-media.ts`
- `lib/media/image-policy.ts`
- `lib/media/image-server.ts`
- `lib/media/prepare-upload.ts`
- `scripts/media-egress-browser-qa.cjs`
- `scripts/test-media-egress.cjs`

- `docs/media-egress-isolation-20261012.md`

## Excluded files

- `.claude/settings.local.json`
- `app/home/page.tsx`
- `components/home/ProfessionalIdentity.tsx`
- `components/social/GigVideoPlayer.tsx`
- `components/social/GlimpsRail.tsx`
- `supabase/.temp/cli-latest`
- `components/social/GlimpsPreview.tsx`
- `components/social/useMediaLoading.ts`
- `docs/auth-signup-incident-20261011.md`
- `docs/makkhan-performance-part3-media-js-review.md`
- `docs/part5-real-device-production-qa.md`
- `docs/part52-hydration-418-triage.md`
- `docs/production-security-release-gates.md`
- `docs/professional-tools-monetization-audit.md`
- `docs/sql/p0-subscriptions-postflight.sql`
- `docs/workplace-phase4-audit.md`
- `scripts/blocker-browser-fixtures.cjs`
- `scripts/blocker-component-browser-qa-prepare.cjs`
- `scripts/blocker-component-browser-qa.cjs`
- `scripts/blocker-review-report.cjs`
- `scripts/master-browser-qa-generator.cjs`
- `scripts/master-component-browser-qa.cjs`
- `scripts/master-extra-fixtures.cjs`
- `scripts/master-final-qa-prepare.cjs`
- `scripts/master-regression.cjs`
- `scripts/master-review-report.cjs`
- `scripts/part10-component-browser-qa.cjs`
- `scripts/part11-component-browser-qa.cjs`
- `scripts/part12-component-browser-qa.cjs`
- `scripts/part5-local-browser-qa.cjs`
- `scripts/part5-local-scenarios.cjs`
- `scripts/part5-public-browser-qa.cjs`
- `scripts/part52-hydration-browser-qa.cjs`
- `scripts/part53-browser-qa.cjs`
- `scripts/part53-component-browser-qa.cjs`
- `scripts/part53-mobile-nav-scenarios.cjs`
- `scripts/part6-component-browser-qa.cjs`
- `scripts/part7-component-browser-qa.cjs`
- `scripts/part8-component-browser-qa.cjs`
- `scripts/test-part3-media.cjs`
- `supabase/audits/workplace-phase4-catalog.sql`

## Mixed-file isolation

Only MediaImage substitutions and the new feed request/original-image controls are selected from the five mixed files. Earlier lazy-image attributes, dynamic player imports, viewport loading, playback deadlines and unrelated playback changes remain in the working tree. The existing one-line reload when a refreshed video URL is unchanged is also retained because stable URLs require it for retry to work. No working-tree files were reverted or replaced for hunk staging.

The pre-existing untracked `scripts/test-part3-media.cjs` stays uncommitted, including its local MediaImage test adapter. Its playback tests verify the full working tree, not an isolated playback patch. The committed media-specific suite and browser fixture separately verify the isolated media changes.

## Push constraint

Read-only Vercel inspection found GitHub repo `gigway`, production branch `main`, `gitProviderOptions.createDeployments = enabled`, and no ignored-build command. Pushing main would trigger a deployment. The requested push is withheld under this configuration to obey the explicit no-deployment rule. Vercel settings were not changed.

## Final verification before commit

- Workspace: `test-media-egress.cjs` 9 groups PASS; `test-part3-media.cjs` 16 groups PASS; `test-makkhan-pass1.cjs` PASS; `test-p0-auth.cjs` 12 groups PASS; `test-auth-navigation.cjs` 23 groups PASS.
- Workspace: `media-egress-browser-qa.cjs` seven browser checks PASS. Artifacts: `C:/Users/Admin/AppData/Local/Temp/gigway-media-egress-mO6cJh`.
- Workspace: `npx.cmd tsc --noEmit --incremental false` PASS; `git diff --check` PASS. `npx.cmd` is the Windows executable equivalent of `npx`; the PowerShell shim is blocked by execution policy.
- Isolated candidate: the nine-group media suite, batching/cache suite, TypeScript and all seven browser checks PASS. Browser artifacts: `C:/Users/Admin/AppData/Local/Temp/gigway-media-egress-eFkoxk`.
- Existing Part 3 playback changes and their untracked test harness are excluded, so those sixteen tests were run against the full workspace only. The isolated media suite/browser checks passed without the uncommitted playback implementation.
- All 41 excluded files and five mixed working-tree files retain their exact pre-isolation SHA-256 hashes. A trailing blank line was removed from this pass's new `lib/media/deliver-post-media.ts` after the staged whitespace check caught it; no unrelated worktree file was changed.
- Accepted: 57 files, including five mixed files with only selected changes. Excluded: 41 whole files, plus the unselected changes in five mixed files. No unresolved file-selection ambiguity remains.
- No deploy, migration, production mutation, storage rewrite, credential exposure, or generated service-worker edit was performed.

This commit is intended to reduce future media egress after deployment; it does not lift the current Supabase quota restriction and makes no production bandwidth-savings claim until measured after release.
