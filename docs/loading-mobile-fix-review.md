# Loading recovery and mobile fixes

Baseline: `71960b000515231b125a49b69aee3b70b43a099a`. Local changes only; no commit, push, deployment or production build.

## Findings and limits of diagnosis

"Opening your page..." comes from the shared App Router loading boundary. It previously waited 120 seconds before showing recovery. Server viewer checks and middleware session checks also used that general operation ceiling; the underlying JSON transport allowed 60 seconds per request. This permits a slow or stalled auth request to occupy the navigation/loading state for a long time. Navbar links also used default prefetch behavior, allowing background route work while users navigate.

Read-only public production measurements from this environment: `/work` returned complete HTML in about 1.315 seconds, `/login` in 0.334 seconds, and unauthenticated `/network` redirected to login and completed in 0.587 seconds. These are single samples, not production latency benchmarks. They did not reproduce the user's signed-in hang. The exact affected page/device/session remains unknown; no claim is made that a specific live backend defect was reproduced or eliminated.

## Changes

- Loading recovery now appears after 15 seconds rather than two minutes. Retry performs the existing hard reload. Pending successful navigation can still replace the loading boundary.
- Server identity verification and middleware session checking have a separate 15-second deadline. Failure stays fail-closed: server errors or middleware 503 recovery, not a false guest/logout decision. Verified-user HTTP transport aborts at 15 seconds, including stalled JSON response bodies.
- General JSON requests retain 60 seconds, multi-step operations retain 120 seconds, and media-upload exemption remains intact. Token-refresh transport is unchanged; middleware stops waiting at the auth ceiling.
- Navbar links disable automatic prefetch to reduce speculative route/auth work. This is a tradeoff: uncached routes begin loading on click rather than being preloaded. No measured production speedup is claimed.
- Mobile bottom navigation remains visible while scrolling, includes safe-area padding and minimum 44px link targets. Viewport metadata enables safe-area layout.
- Network/Work headings use smaller mobile sizes. Network search text has explicit dark text on white and 16px input text to avoid small-text focus zoom.
- Discovery and work rails keep manual scrolling with hidden scrollbar tracks, removing the dark strip without disabling scrolling.

## Validation

PASS: TypeScript on standalone rerun; P0 auth/social; Professional Identity; Pass 1; Pass 2 and final; pagination; auth/navigation; Part 3 simplification; UX correction; Network/Home architecture; existing media regression suite; six new loading/mobile groups; `git diff --check`.

The first TypeScript runner timed out, but the standalone command completed successfully. New tests exercise transport aborts, distinct recovery ceilings, fail-closed auth, loading recovery/cleanup, prefetch policy and mobile layout classes.

The full Next dev browser harness connected after switching its temporary CDP transport to the installed WebSocket package, but local `/login` compilation did not complete within the harness window. Full Next routing/hydration and signed-in end-to-end behavior are therefore NOT MEASURED.

A separate local browser fixture rendered the actual Network, Work and Home preview React components with the project's Tailwind CSS and long fixture text. All 21 cases passed at 320, 360, 375, 390, 412, 430 and 1280 pixels: no document overflow, manually scrollable rails where needed, visible mobile bottom nav and at least 44px bottom-nav targets. Screenshots were inspected. This fixture uses Arial fallback, mocked identity/data and no Next routing/hydration; it does not verify real device safe-area hardware, touch gestures, production fonts/assets or live auth. The fixture logo asset was not loaded.

Evidence: `C:/Users/Admin/AppData/Local/Temp/gigway-loading-mobile-1KjcWJ/` (`mobile-report.json`, screenshots, test logs and starting hashes).

## Scope and preservation

Modified: `app/layout.tsx`, `app/network/page.tsx`, `app/work/page.tsx`, `components/connections/DiscoveryCards.tsx`, `components/home/DiscoveryPreviews.tsx`, `components/layout/ModernNavbar.tsx`, `components/layout/RouteLoading.tsx`, `components/work/WorkPreviewRail.tsx`, `lib/async.ts`, `lib/auth/server.ts`, `middleware.ts`.

New: `scripts/test-loading-mobile.cjs` and this review.

Pre-existing media/performance files, protected files, database files and public service workers remain byte-identical to the starting snapshot. No database/schema/RLS changes or remote mutations. The fixes remain local pending review and release; production is not changed by this pass.
