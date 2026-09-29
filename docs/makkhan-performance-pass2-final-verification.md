# Makkhan Pass 2 final verification

**FINAL VERDICT: NOT READY.** This supersedes the earlier READY FOR PASS 2 REVIEW verdict. Verification found three failing pagination assertions and reproducible candidate starvation. Browser infrastructure is not the reason for this verdict.

Application source is unchanged during this verification: SHA-256 comparisons against the start-of-turn snapshot pass for all Home source, social server/API, PWA config and custom-worker source. Only tests/documentation and build-generated PWA artifacts changed. No staging, commit, push, deploy, database/schema/RLS change or remote mutation.

## 1. Primary hydration and pagination

SYNTHETIC: executes actual initialHomePosts, discover API GET, visiblePosts, safePosts, SocialHomeFeed, PostCard and usePostLike with fixture database I/O and a hook lifecycle driver. This is not a browser hydration claim.

PASS: 0, 1, 15, 16, 31 and 45 public posts. Initial page is retained without fetching, clearing, reordering or duplicating it, including StrictMode effect replay. Load More uses the server cursor, retains existing posts, starts strictly after the initial last post, covers timestamp ties by descending ID, and ends with no continuation button. No infinite-scroll implementation exists here. Actual serializer and card/hook initialization preserve liked/saved/reposted/follow state separately for viewer A and viewer B; no state leaks between their fixture renders.

**BLOCKER: visibility-filtered pagination can stop early.** Both the existing frozen API and the new Home adapter set nextCursor only when accessible.length > 15, although the query scans just16 raw candidates. Visibility is correctly enforced; availability/pagination is wrong.

| Fixture | Actual | Expected |
|---|---|---|
| 32 candidates; newest1 inaccessible |15 visible, null cursor|31 accessible posts reachable|
| 32 candidates; newest16 inaccessible |0 visible, null cursor|16 older accessible posts reachable|
| 48 candidates; inaccessible post in second candidate window |30 visible across two pages, null cursor|47 accessible posts reachable|

The first two cases also assert SSR/API parity: the API has the same defect. The third executes the real continuation API after the server-provided cursor. This is inherited pagination behavior exposed by stronger verification, not a new authorization weakness. No fix was made because this task is verification-only and Pass 1 is frozen. A follow-up must distinguish exhaustion of a raw candidate window from exhaustion of visible posts while keeping visibility filtering fail-closed. Three no-skip assertions intentionally remain red.

## 2. Actual HTTP response ordering

SYNTHETIC MEASURED: real Next development server, mocked loopback Supabase, populated primary/JOX/GLIMPS fixtures. Milliseconds from request start to response marker bytes, not paint, hydration, media readiness or interaction. Primary need not beat every fast module. Every delayed secondary is proven not to be a prerequisite.

| Scenario | Shell | Primary | Opportunities | Network | JOX | GLIMPS | Completion | Activity |
|---|---:|---:|---:|---:|---:|---:|---:|---:|
|Normal|551|607|605|607|607|607|606|606|
|opportunities delayed 5000ms|529|579|5229|578|579|579|577|579|
|network delayed 5000ms|611|654|653|5390|654|655|653|653|
|jox delayed 5000ms|471|509|508|509|5378|509|508|509|
|glimps delayed 5000ms|568|678|678|678|678|5410|677|678|
|completion delayed 5000ms|526|558|5264|5267|560|558|5265|558|
|activity delayed 5000ms|512|555|554|556|556|556|555|5315|
|jox fails|563|602|602|603|602|603|602|602|
|opportunities fails|508|557|555|557|557|557|556|556|
|activity fails|527|572|571|571|572|572|571|572|
|completion fails|530|570|566|567|570|570|567|569|
|primary fails|502|538|539|541|541|541|539|540|

All six independent5000ms delay cases PASS. Delaying completion's shared profile read also delays opportunities/network, as expected from request memoization, but primary still streams. All markers are recorded even when a module is omitted or unavailable. Empty/failed outcomes do not count as useful content.

Primary failure PASS: shell survives, the only boundary error is primary, a finite retry link appears, and the response contains actual Opportunities, Network, JOX, GLIMPS, Professional Identity and Activity headings. Populated media rails were used, not merely empty settlement markers.

Report: C:\Users\Admin\AppData\Local\Temp/gigway-home-qa-OAuspW/report.json.

## 3. Never-settling modules

All six PASS: opportunities, network, JOX, GLIMPS, completion and activity. Each actual module loader is given a dependency that never resolves. The actual boundary/deadline code is exercised with30ms inner /40ms outer test deadlines to avoid waiting two minutes per case. All seven boundaries settle, primary remains available, and a finite unavailable outcome or existing quiet completion omission is produced. Production ceilings remain120 seconds per operation and60 seconds per transport; they were not changed. A shared-profile failure can affect the three secondary consumers, never primary. No authorization or failure-closed logic was changed.

## 4. Candidate headroom

INFERRED FROM CODE plus SYNTHETIC fixtures using actual ranking functions and Home loaders. Both combined rails still cap at12 cards. Each individual candidate family can fill all12 when sufficient eligible rows exist. Horizontal viewport visibility is smaller; all12 remain available by scrolling.

| Family | Candidates | Possible displayed maximum | Nominal spare candidates for12 slots | Guaranteed survivors after exclusion |
|---|---:|---:|---:|---:|
| Jobs |24|12 within combined opportunity rail|12|0|
| Projects |24|12 within combined opportunity rail|12|0|
| Services |12|12 within combined opportunity rail|0|up to12; depends on available rows|
| People |24|12 within combined network rail|12|0|
| Workplaces |24|12 within combined network rail|12|0|

Opportunity pool is60 for12 combined slots (48 nominal spare); network pool is48 for12 slots (36 nominal spare). These are headroom caps, not guarantees.

Ranking/filter steps: SQL status filtering for opportunities; username NOT NULL and viewer-ID exclusion for people; username NOT NULL for workplaces; recency candidate caps; post-fetch self-client exclusion for jobs/projects; post-fetch followed-ID exclusion for network; existing skill/location/function/freshness and bounded intent bonuses; score/date/ID sort; slice12. Intents adjust score rather than filtering candidates. Candidate intents are labels fetched only after selection. There is no new profile_completed filter or comprehensive post-fetch invalid-record validator. Null usernames are excluded before the cap; incomplete records with a username remain eligible as before. Services retain their existing lack of self-owner exclusion.

**Reproduced starvation:** newest24 people and24 workplaces all followed -> network0, despite72 older unfollowed candidates in the60-per-family fixture. Newest24 jobs self-owned with no other categories -> opportunities0, despite36 older eligible jobs. The old60-row pools would reach these older rows. This is deterministic valid-data fixture evidence, not a claim about production frequency. Limits remain unchanged. Consider bounded refill or safe exclusion-before-limit in a separately authorized fix; no arbitrary limit increase was made.

## 5. Duplicate query audit

Real HTTP integration asserts one authoritative getUser request, one request-scoped viewer profile read and one viewer-intent read. All seven boundaries are exercised. With populated primary/media fixtures, 44 DB requests were observed; the previous26-query sample used empty media lists, so this increase is fixture work, not duplicate boot fetching.

| Remaining repeated work | Classification |
|---|---|
| Middleware session, server authoritative viewer, browser navbar auth/profile |Necessary for current architecture; auth consolidation is future Pass 3 work|
| Profile/organization author reads across three social pages |Future optimization for overlapping authors; currently page-scoped safety/enrichment|
| Network follow lists versus social visibility/enrichment follow reads |Necessary differing scopes and semantics; future safe request-scoped reuse possible|
| Three exact counts per post |Necessary under frozen Pass 1 semantics; distinct post/count operations|
| createClient wrapper creation in consumers |Cheap setup, not duplicate DB reads|
| Completion viewer profile/intents |No additional reads; shared promises reused|
| Initial discover browser GET |Zero in synthetic hydration tests; browser network capture unverified|

## 6. Generated worker proof

Before rebuilding, the supplied Pass 2 artifact was confirmed:
- SHA256 188B394C62F3D37CC121B5EAC1A8C7418C6671FE399094ABFF99746FF92101CD
- Import exactly public/worker-hphX1Z3ZPXv7VH6GvXcCQ.js
- Deleted Pass 1 custom chunk absent from generated worker references.

The change from Pass 1 SHA256 A7A5A43CA4B8E50E50CB646A91FA74E53B4CF3447525F008C415EE825CFBE2C0 is exactly: precache array changes, custom-worker import filename, and consistent bijective minifier variable renaming. Removing the manifest/import and normalizing only one-letter variable names yields identical complete worker code. This is stronger than a keyword search. Custom-worker file bytes are exactly equal to Pass 1. Runtime policy also passes executable matcher tests: navigation/API NetworkOnly, same-origin /_next/static/ CacheFirst, no user-specific response cache or root precache.

The required fresh build completed successfully and generated worker-Yk1raVFDwp01AqSJA0H17.js. A subsequent workspace regeneration replaced it with the current RIgom artifact; its provenance is not in this build log. The latest artifact was independently re-inspected and passed both policy and byte/code comparison tests. Final observed worker SHA256:
162B5E156486951569C71F24CA9B8FCAB512A792AB9E799DC988747A67C71DA3

Final dependency: public/worker-RIgomFyrnZBIlFiS9JYxC.js. Both older custom chunks (worker-hphX1Z3ZPXv7VH6GvXcCQ.js and worker-FOKD7JC6QSjUH8vH8NvJ5.js) are no longer referenced. Do not stage the superseded hph file; the build replaced it. Final manifest has236 entries versus235 in Pass 1, with107 removed URLs,108 added URLs and1 changed revision at an existing URL. Full URL diffs are in C:\Users\Admin\AppData\Local\Temp/gigway-pass2-final-00m2CG/worker-before-build.json and worker-final.json. The unchanged Workbox runtime has no Git content diff.

The generated sw.js, its final referenced custom chunk, and deletion of the tracked old custom chunk must travel together. No generated file was hand-edited or reverted.

## 7. Browser, mobile, throttling

One final browser attempt failed before navigation: Chrome DevTools WebSocket did not open. Report: C:\Users\Admin\AppData\Local\Temp/gigway-home-qa-hpZ8zN/report.json. No unrelated tooling repair was attempted.

**BROWSER QA NOT VERIFIED.** Widths320/360/375/390/412/430/1280, 4x CPU/150ms/~1.6Mbps, shell paint, visible useful content, layout shifts, overflow and interactive errors remain NOT VERIFIED. This does not by itself block code correctness; the pagination defect does.

## 8. Build and test results

| Check | Result |
|---|---|
| Production build |PASS;138 static pages, compilation/types/optimization/traces completed|
| TypeScript --noEmit |PASS|
| P0 auth |PASS;12 groups|
| P0 social |PASS|
| Professional Identity |PASS;9 groups|
| Pass 1 |PASS|
| Generated-worker policy |PASS|
| Worker manifest/code/custom-byte comparison |PASS|
| Existing Pass 2 tests |PASS|
| Final expanded verification |14 PASS / 3 FAIL (pagination assertions)|
| HTTP streaming integration |PASS; all six delays and populated secondary rendering after primary failure|
| git diff --check |PASS|

Build log: C:\Users\Admin\AppData\Local\Temp/gigway-pass2-final-00m2CG/build.log. Test report: C:\Users\Admin\AppData\Local\Temp/gigway-pass2-final-00m2CG/verification.json. Recovery tests shorten only test deadlines. Candidate tests prove capacity and reproduce starvation; their successful detection is not a claim that starvation is fixed.

## 9. Exact eventual Pass 2 commit set (unstaged; NOT READY)

SOURCE:
- app/home/page.tsx
- app/home/loading.tsx
- components/home/HomeModule.tsx
- components/home/IdentityCompletionPrompt.tsx
- components/social/SocialHomeFeed.tsx
- lib/home/primary.ts

TESTS:
- scripts/home-browser-qa.cjs
- scripts/test-makkhan-pass2.cjs
- scripts/test-makkhan-pass2-final.cjs
- scripts/test-makkhan-pass2-worker.cjs

DOCUMENTATION:
- docs/makkhan-performance-pass2-review.md
- docs/makkhan-performance-pass2-final-verification.md

GENERATED PWA FILES (atomic set):
- public/sw.js (modified)
- public/worker-RIgomFyrnZBIlFiS9JYxC.js (added)
- public/worker-FOKD7JC6QSjUH8vH8NvJ5.js (deleted by build)

PROTECTED/UNRELATED, exclude:
- .claude/settings.local.json
- docs/workplace-phase4-audit.md
- supabase/audits/

Protected files were SHA256-snapshotted before verification and rechecked unchanged, including every audit file. Source and protected hashes are in C:\Users\Admin\AppData\Local\Temp/gigway-pass2-final-00m2CG/snapshot.json. Nothing staged.

## 10. Production QA and final verdict

Database, schema, RLS, auth/security policy and remote state are unchanged. No commit/push/deploy/Pass3/activation work. Production browser/mobile/throttled interaction, worker lifecycle/account switching, real ranking quality and populated media behavior remain required after correctness fixes.

**NOT READY.** Resolve visibility-filtered cursor exhaustion before commit; review the reproduced candidate-starvation cases. Application changes were intentionally not made in this verification-only task.

## Working-tree snapshot

### git status --short

```text
 M .claude/settings.local.json
 M app/home/page.tsx
 M components/home/IdentityCompletionPrompt.tsx
 M components/social/SocialHomeFeed.tsx
 M public/sw.js
 D public/worker-FOKD7JC6QSjUH8vH8NvJ5.js
?? app/home/loading.tsx
?? components/home/HomeModule.tsx
?? docs/makkhan-performance-pass2-final-verification.md
?? docs/makkhan-performance-pass2-review.md
?? docs/workplace-phase4-audit.md
?? lib/home/
?? public/worker-RIgomFyrnZBIlFiS9JYxC.js
?? scripts/home-browser-qa.cjs
?? scripts/test-makkhan-pass2-final.cjs
?? scripts/test-makkhan-pass2-worker.cjs
?? scripts/test-makkhan-pass2.cjs
?? supabase/audits/
```

### git diff --stat

```text
 .claude/settings.local.json                  |   7 +-
 app/home/page.tsx                            | 119 ++++++++++++++++++---------
 components/home/IdentityCompletionPrompt.tsx |  17 +++-
 components/social/SocialHomeFeed.tsx         |  20 +++--
 public/sw.js                                 |   2 +-
 public/worker-FOKD7JC6QSjUH8vH8NvJ5.js       |   1 -
 6 files changed, 113 insertions(+), 53 deletions(-)
```

Stat includes the protected pre-existing settings diff and excludes untracked additions.
