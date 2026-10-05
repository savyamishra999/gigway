# Mobile Create P0 review

Local changes on top of `099b72e`. No deployment in this pass. Existing unrelated
media, database-audit and local-settings changes were preserved.

## 43. Mobile + root cause

The old `/create` server page awaited a direct `getUser`, then both profile and
Workplace queries before returning any actions. A secondary membership query
therefore delayed the entire screen. Its query errors were ignored. Mobile used
one column with full explanations and permanent examples, pushing Service below
the initial viewport. `/social/create` additionally awaited a second organizations
query after its membership query. The normal composer exposed JOX/GLIMPS links.

These blocking dependencies and layout issues are confirmed in code. No live
production trace proving the exact user's mobile hang was captured. The previously
fixed session-restore redirect race is unchanged. No new redirect or modal was
added; the mobile + remains one Next Link to `/create`.

## 44. Duplicate auth/fetch result

Create uses the existing request-cached `getViewer`. It performs no page-owned
profile query and uses the existing shared browser identity for display. That
provider and its account-switch/logout safeguards are unchanged. The composer
retains its required profile-existence check; query failure now raises a retryable
error instead of incorrectly sending the user to onboarding.

Optional Workplaces load through one background request per mounted screen. The
endpoint verifies its own caller and runs one join scoped to the verified user,
active status, and owner/admin role. It accepts no caller-supplied user ID. There
is no sequential organizations query, automatic polling, global identity cache,
or cross-account result reuse. The hook cancels late responses and coalesces
StrictMode setup/cleanup before starting a request.

MEASURED in the successful local browser run: each Work-to-Create transition
recorded two `/auth/v1/user` requests in total (route plus separately authenticated
Workplace endpoint), one membership join, and zero or one optional shared-profile
read. No duplicate membership request occurred within a mounted screen. This is
not a claim that all auth requests disappeared: the background endpoint adds its
own required verification. Navigating to the composer makes a new scoped lookup.
No additional domain data is fetched to unblock personal Create actions.

## 45. Create first-useful-UI result

After the existing server authorization check, all four personal actions render
without awaiting profile display or Workplace data. Existing destination/API
auth/profile checks remain in place. Explicit Workplace selection exposes no
actions until that membership is verified; invalid selections never silently
become personal posts. Composer submission is disabled and handler-guarded for
unverified Workplace authors.

MEASURED: headless Chromium, real Next development routing/hydration, local mocked
Supabase, 640 CSS px viewport height, normal network/CPU. A programmatic click on
the actual mobile Create link yielded four visible action nodes in the samples
below. These are polling-based observation times (up to 200 ms polling overhead),
not production timings or before/after speed improvements. Shell-only visibility
was NOT MEASURED separately. Physical touchscreen tap latency was NOT MEASURED.

## 46–52. Four actions and mobile widths

All four cards appeared above the fold, above fixed bottom navigation, with no
horizontal document overflow. Compact descriptions stay visible; examples are
desktop-only. Long fixture identity names truncate without widening the page.

| Report item | Width × height | Four actions / overflow | Observed click-to-actions | Fourth card bottom |
| --- | --- | --- | --- | --- |
| 47 | 320 × 640 | PASS / none | 634 ms | 387 px |
| 48 | 360 × 640 | PASS / none | 629 ms | 367 px |
| 49 | 375 × 640 | PASS / none | 654 ms | 367 px |
| 50 | 390 × 640 | PASS / none | 631 ms | 367 px |
| 51 | 412 × 640 | PASS / none | 660 ms | 367 px |
| 52 | 430 × 640 | PASS / none | 633 ms | 367 px |

## 53. GigThought composer mobile result

MEASURED at all six widths: no horizontal overflow; four core controls visible
together; each control at least 44 × 44 CSS px; Post reachable by normal document
scrolling above the bottom navigation. The composer has no fixed-height internal
scroll container. Text input uses 16 px text and a resizable four-row textarea.
The heavy legacy audio preview loads dynamically only when needed.

Real iOS/Android software keyboard, hardware safe-area/browser-chrome interaction,
physical touch, upload/publish to a live backend, and production timing are
NOT MEASURED. Keyboard acceptance remains a physical-device QA item; this report
does not certify it. Screenshot avatar images were deliberately blocked external
fixtures; the actual layout and app styles were rendered.

## 54. Standard attachment options result

PASS: Text, Photo, Video, PDF file are visible together above the text field.
These use the existing supported input paths (JPEG/PNG/WebP, MP4/WebM, PDF).
The normal composer no longer links to dedicated JOX/GLIMPS creators. Existing
legacy routes remain intact. This pass adds no attachment type.

## 55. Create failure/retry result

MEASURED: injected 12-second membership delay produced a finite endpoint 503 at
about five seconds; injected immediate failure also exposed Retry. Four personal
actions stayed available in both scenarios. Retrying after recovery restored the
Workplace selector. No repeated redirect, blank screen or infinite spinner was
observed. Client transport is aborted at eight seconds; server membership query
is aborted/deadlined at five seconds. Auth retains the existing 15-second ceiling.

## Validation and evidence

- 9 new Create groups: shell, auth/profile requirements, personal/Workplace paths,
  unknown author publish prevention, product visibility, actual standard controls,
  scoped API errors/deadline, hook timeout/retry and StrictMode coalescing.
- 23 Part 2 auth/navigation, 12 P0 auth, 13 product simplification and 10 UX groups
  pass (67 groups total); TypeScript and whitespace checks pass.
- Browser harness: `node scripts/create-browser-qa.cjs`. Uses an isolated temporary
  source copy, fresh Chromium profile and local mock backend; no production writes.
- Successful evidence: `C:/Users/Admin/AppData/Local/Temp/gigway-create-qa-B0Kz9y/`
  contains `report.json`, `next.log`, six Create and six composer screenshots.
  320 px Create/composer screenshots were visually inspected.
- Earlier harness runs failed due sandbox CDP timeout, a stale test process,
  scroll observation timing, and a hardcoded mock URL left in harness configuration.
  They are not used as passing evidence. The successful run has no runtime errors.

No observed mobile Create P0 remains in the measured local scenarios. Physical
keyboard/device QA is still outstanding before full mobile acceptance.
