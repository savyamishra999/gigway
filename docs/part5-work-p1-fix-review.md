# Part 5.1 Work P1 fix review

Baseline: `19b4816b1d611cae337a56a06fd07609b950e36b`. Local-only implementation; no commit, push, deploy, schema/RLS changes or Part 6.

## Root causes recorded before implementation

MEASURED: anonymous read of the existing Services preview projection returned HTTP 400, `PGRST200`: no foreign-key relationship between `gigs` and `owner_id` in the public schema cache. Repeating the same active/order/limit=6 query with only `professional:freelancer_id(full_name)` returned HTTP 200 and six rows. The returned rows do not expose `updated_at`. Evidence: `C:/Users/Admin/AppData/Local/Temp/gigway-part51-GuSxMU/query-proof.json`. No credentials or raw user rows stored in that evidence.

Trace: `/work` Services Suspense -> `WorkPreviewRail` -> `workPreviews('services')` -> failing PostgREST relation lookup -> catch returns `unavailable:true` -> finite Services error. Failure occurs before projection/timestamps/rendering. `/gigs` and `/gigs/[id]` use the valid `freelancer_id` relation. Proposed correction removes only the unsupported join, retaining `*` for optional-field compatibility, active status, deterministic ordering and server limit. Provider remains optional under existing RLS.

SOURCE-DERIVED layout cause: one-line Suspense fallback reserves no card geometry; final rail includes heading, card row, padding and View all. Part 5 production width samples recorded layout-shift entry sums up to 0.256066 (not formal CLS, and not local as the follow-up brief describes). Proposed correction shares heading/action/rail geometry between fallback and loaded state, retains independent streaming and lets long text grow without clipping. Same-environment local before/after measurements will be appended; production remains undeployed.

## Worktree preservation

Snapshot: `C:/Users/Admin/AppData/Local/Temp/gigway-part51-GuSxMU/baseline.json`, `status.txt`, `index-before`. Pre-existing shared media work, dormant JOX/GLIMPS work, Part 3 evidence, and all four Part 5 QA files are excluded/preserved. Protected `.claude/settings.local.json`, `docs/workplace-phase4-audit.md`, and `supabase/audits/` remain untouched.

Supabase skill applied. Current join semantics checked against [official documentation](https://supabase.com/docs/guides/database/joins-and-nesting); changelog fetched and no relevant join/select breaking-change entry identified. No SDK/dependency changes.

## AFTER-FIX evidence: Services correctness

MEASURED against real anonymous Supabase data: the actual fixed workPreviews loader returns unavailable=false and six titled rows for Jobs, Projects and Services. All returned Services rows in this sample lack updated_at; no compatibility error occurs. Anonymous provider names were unavailable in the sampled rows, so none were fabricated. Existing freelancer_id listing/detail relation, status filter, newest/id order and limit remain unchanged. Evidence: C:/Users/Admin/AppData/Local/Temp/gigway-part51-GuSxMU/actual-loader-anon.json. This is verification of local loader code against public reads, not a deployed UI fix.

## AFTER-FIX same-environment layout measurements

MEASURED Windows headless Chrome, local Next dev server, compiler warmed, fresh browser-cache navigation, height 800, same fixture for before and after: six populated rows for each category, reads delayed Jobs 1600 ms, Projects 2800 ms, Services 4000 ms. Fixture deliberately resolves Services even for the old query to isolate geometry from the separate relation failure. Throttling: CPU 4x, CDP 150 ms latency, 200000 bytes/sec up/down. The change retains SSR and three independent Suspense boundaries.

Metric: sum of observed layout-shift entries without recent input, through settled rails plus 700 ms. NOT formal CLS, LCP, TTI or a navigation speedup. Before and after measurements are local; do not compare directly with Part 5 production value 0.256066.

| Width | Before normal | After normal | Before throttled | After throttled | Overflow / rail bounds |
|---:|---:|---:|---:|---:|---|
| 320 | 0.120691 | 0.000000 | 0.120808 | 0.000118 | none / 6+6+6 |
| 360 | 0.122181 | 0.000000 | 0.122285 | 0.000104 | none / 6+6+6 |
| 375 | 0.122658 | 0.000000 | 0.122758 | 0.000100 | none / 6+6+6 |
| 390 | 0.123098 | 0.000000 | 0.123194 | 0.000096 | none / 6+6+6 |
| 412 | 0.123685 | 0.000000 | 0.123777 | 0.000091 | none / 6+6+6 |
| 430 | 0.124121 | 0.000000 | 0.124209 | 0.000087 | none / 6+6+6 |
| 1280 | 0.094784 | 0.001540 | 0.093323 | 0.000096 | none / 6+6+6 |

390 px has three samples per condition and variant; other width/condition cells are SINGLE SAMPLE. Three-sample min/median/max shift sums:

- before, normal: 0.123097775 / 0.123097775 / 0.123097775.
- before, throttled: 0.123194213 / 0.123194213 / 0.123194213.
- after, normal: 0.000000000 / 0.000000000 / 0.000000000.
- after, throttled: 0.000096438 / 0.000096438 / 0.000096438.

All after runs settled without runtime exceptions; browser rail scrolling remains possible. Empty and genuine Services-error samples at 390 px each record zero shift sum. Error sample retains six Jobs and six Projects with finite Services error and /gigs link. No retry storm. Full source rectangles are recorded in the new observer, unlike the original Part 5 collector. Independent intermediate rail states and heading deltas are in layout-analysis.json.

Layout implementation: shared RailFrame header/action positions; 288 px minimum card height and 300 px row reservation (including scrollbar spacing), used by loading/populated/empty/error states. Empty/error messages remain compact within that reserved space; no permanent outlined giant empty card is introduced. Cards may grow for exceptionally long text; no clipping or forced maximum height. Arbitrary long-text/zoom/device-font combinations are NOT exhaustively measured. Residual tiny sums include shared-page nodes; no claim of universal zero CLS.

Evidence:

- Before normal: C:/Users/Admin/AppData/Local/Temp/gigway-part51-browser-ISYfcp/report.json. Seven valid samples saved before desktop scroll assertion failed because test requested less than one snap interval; corrected test scrolls one card width. No app change involved.
- Before throttle/repeats: C:/Users/Admin/AppData/Local/Temp/gigway-part51-browser-bh35H8/report.json; completed exit 0.
- After full matrix/repeats/empty/error: C:/Users/Admin/AppData/Local/Temp/gigway-part51-browser-ePKT27/report.json; completed exit 0. PNGs named state-width-throttled-sample.png.
- Aggregate geometry/read audit: C:/Users/Admin/AppData/Local/Temp/gigway-part51-GuSxMU/layout-analysis.json.

Reproduce: PART51_WORK_ONLY=1 and PART51_VARIANT=before or after, then node scripts/part51-browser-qa.cjs. The runner archives HEAD and overlays only the three application files for after; protected dirty files and historical Part 5 scripts remain untouched.

Post-run assertions: all 18 loaded after samples observed one then two then three rails, every measured heading retained its fallback document Y coordinate (delta 0 px), exactly one query per category, and zero client /api requests in the Work window. These assertions passed.

## Focused and full regression tests

MEASURED PASS: TypeScript (--noEmit --incremental false); P0 auth; P0 social; Professional Identity; Pass 1; Pass 2; Pass 2 final; Pagination; Part 2 auth/navigation; Part 3 simplification; UX correction; Network/Home architecture; Mobile Create P0; Part 4 visible performance; new Part 5.1 Work tests. All 14 CJS suites and TypeScript exited 0. Logs: C:/Users/Admin/AppData/Local/Temp/gigway-part51-GuSxMU/tests.json and test-*.log / typescript.log.

Focused tests execute the actual loader/rendering with zero/one/six/nine input rows, enforce server limit six and defensive output cap, nullable price/category/provider, provider object/array/null, missing updated_at, zero price, valid Updated and fallback Posted behavior, genuine backend failure, valid /gigs routes, SSR/no client refetch, matching fallback geometry, three independent boundaries and public middleware exclusion. Existing test expectations now match the freelancer relation; page mocks include the new named fallback export and rail tests render the shared frame.

All Part 5 and Part 5.1 browser script syntax checks pass. Full Part 5 local scenario rerun uses the new isolated runner with the three Work application files overlaid; historical Part 5 scripts remain unchanged. Browser rerun completion details follow below.

## Exact Part 5.1 files

Application changes:

- app/work/page.tsx
- components/work/WorkPreviewRail.tsx
- lib/work/previews.ts

Existing regression fixture updates:

- scripts/test-auth-navigation.cjs
- scripts/test-network-home-architecture.cjs
- scripts/test-ux-correction.cjs

New files:

- scripts/test-part51-work.cjs
- scripts/part51-browser-qa.cjs
- scripts/part51-work-scenarios.cjs
- docs/part5-work-p1-fix-review.md

## Limits and deployment

PHYSICAL DEVICE NOT MEASURED. Real Android/iPhone touch, keyboard, browser backgrounding, arbitrary long titles/font zoom and live authenticated interactions remain outside the authorized automated/public scope. No claim that Work is faster; this pass establishes Services query correctness and materially reduced fixture streaming shift. Existing production remains unchanged until a separately authorized deployment. No dependency, worker, database migration, schema or RLS changes. No Part 6.

## Part 5 public browser rerun

MEASURED: unchanged scripts/part5-public-browser-qa.cjs completed exit 0 with 27 samples and no horizontal overflow, but recorded ONE production React #418 hydration exception. The existing public collector logs exceptions without failing its process, so exit 0 is not a clean runtime-exception PASS. Public listing/detail/back and guest redirects still work. Work Services preview still shows the old failure on production, as expected because this pass does not deploy. Do not treat this public run as validation of deployed fixed code or compare its timings with the controlled local pair. Evidence: C:/Users/Admin/AppData/Local/Temp/gigway-part5-public-HWyoo4/report.json.

The first broader local regression attempt hit the dev-server /login cold compilation startup deadline before browser scenarios began (report: gigway-part51-browser-R9Fk9b). This is recorded as a harness startup timeout, not an app P0 or a passed run. The retry reuses the verified temporary after-fix source/compiler cache with matching baseline SHA; repository files and historical evidence remain untouched.

Additional public observation: React #418 indicates a server/client hydration mismatch ([official decoder](https://react.dev/errors/418)). The collector did not tag exceptions by route, so the affected route and root cause are NOT established. No fixes from this pass are deployed; this exception cannot be attributed to the local Work change. It remains an explicitly unresolved production observation outside the two-P1 scope, not silently discarded. The dedicated before/after local Work matrix had zero Runtime exceptions.

## Preservation verification

MEASURED: 544 files in the start-of-pass hash snapshot. Exactly six pre-existing tracked files changed, all listed above and authorized for this fix/test adaptation. No unexpected changes; historical Part 5 docs/scripts, dormant/shared media work and protected files match their baseline hashes. Four new Part 5.1 files only. .git/index is byte-identical. HEAD and origin/main both remain 19b4816b1d611cae337a56a06fd07609b950e36b. Worker/config files match baseline hashes. Evidence: C:/Users/Admin/AppData/Local/Temp/gigway-part51-GuSxMU/safety.json. git diff --check passed.

## Final Part 5 local regression evidence and verdict

The broader local run (C:/Users/Admin/AppData/Local/Temp/gigway-part51-browser-oZnz1r/report.json) completed all 80 timing/width/warm-navigation samples with no page overflow. It then timed out at the first Follow action and recorded one unlocated JavaScript SyntaxError. This run is NOT a clean full-browser PASS. That exception did not reproduce in the fresh interaction retry (lsg6AB), which still timed out waiting for a Follow response; the server log showed no Follow request. Read-only CDP inspection later confirmed the button was enabled and React handler props were present.

The original Part 5 scenario uses a fixed one-second delay after SSR content appears. INFERRED cause of the missed action: that delay can expire before hydration on this cold dev environment. The Part 5.1 runner now optionally waits for React handler attachment before issuing one click; it does not retry mutations or change application behavior. Historical Part 5 scenario files remain byte-identical. An intermediate runner-edit syntax mistake was caught by node --check/startup before browser execution and corrected; it is distinct from the earlier browser exception.

MEASURED final fresh interaction run: C:/Users/Admin/AppData/Local/Temp/gigway-part51-browser-JcLXlE/report.json, completed exit 0 with zero Runtime exceptions and all explicit checks true. It covered slow/failing optional Workplaces, primary/secondary independence, failed Follow busy-state recovery, Follow/Unfollow, Workplace Follow, 210 relationship fixture, failed connection action/manual retry, Text/Photo/Video/PDF pre-publish previews/removal, reachable Post without a keyboard, Create/composer/back and offline Follow. Run with PART51_VARIANT=after, PART5_INTERACTIONS_ONLY=1, PART51_HYDRATED_CLICKS=1. The readiness guard uses React's internal DOM prop marker solely in the test harness and may need adapting for future React versions. Early pre-hydration user taps are NOT claimed to pass by this guarded test.

The unlocated exception from the earlier cached dev run remains an observation, not a diagnosed app fix. The production React #418 observation also remains unresolved. Neither was reproduced in the dedicated local Work before/after matrix or final fresh interaction run. All browser limitations and failed attempts are retained above.

VERDICT: READY FOR PART 5.1 REVIEW for the two scoped local Work fixes, with the above broader-browser observations disclosed. This is not production/deployment clearance or a claim that Part 6 has started. No commit, push, deployment or DB/schema/RLS changes.
