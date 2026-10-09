# Part 6 — Professional Profile V2

Baseline HEAD/origin main: 1071a551435511cf103f7c8446777c8225b9f02b. The existing person header, stored experience and portfolio, About, skills, location, intents, relationship controls, owner edit and RLS lookup are preserved. Previously the visible social tabs were GigThoughts/Reposts; offers appeared in a separate four-item preview. Legacy tab definitions and a dynamic media import remained in the current profile component.

Implemented GigThoughts / Work / Reposts with keyboard tab navigation and deterministic server-provided initial tab. Work has Services Offered, Jobs Posted and Projects Posted, three public-RLS queries, maximum six rows each, canonical freelancer_id/client_id relationships and active/open filters. These listings are never presented as completed work. Owner actions create a service/job/gig project; visitors see only populated sections, or one overall empty state. A failed section offers a manual retry and preserves other results. Work is a streamed server slot; opening it performs no client work refetch. Server rendering still loads the three bounded work queries even when another tab is selected.

The social component now aborts obsolete requests on identity/tab changes, ignores stale responses, caches content tabs and retains explicit retry after failure. Dormant current-profile tabs/imports were removed; independent legacy routes, APIs, storage and pre-existing media files were not changed. Owner state is derived from getViewer on the server.

## Validation

- TypeScript --noEmit --incremental: PASS.
- Actual module tests: bounded rows and public filters, owner actions, visitor optional sections, partial failures, finite timeout, Work SSR without API fetch, identity-switch cancellation and cache reuse PASS.
- Updated identity and product-simplification regressions reflect the new visible tab requirement and continue checking independent legacy routes.
- Browser component/CSS: 14 owner/visitor Work samples at 320,360,375,390,412,430,1280 PASS; no horizontal overflow. Report: C:/Users/Admin/AppData/Local/Temp/gigway-part6-component-Xiynap/report.json. Existing compiled application CSS, actual components and fixture records; no Next hydration/router/live backend or physical device claim. Header geometry is not exercised in this fixture.
- Full isolated regression result recorded in C:/Users/Admin/AppData/Local/Temp/gigway-part53-aivTHn/part6-tests.json.
- git diff --check PASS.

Application files: app/u/[username]/page.tsx; components/profile/ProfileWorkPreview.tsx; components/social/ProfileSocialFeed.tsx; lib/profile/tabs.ts.
Tests: scripts/test-part6-profile.cjs; scripts/part6-component-browser-qa.cjs; updates to scripts/test-professional-identity.cjs and scripts/test-part3-simplification.cjs.

No schema migration, remote mutation, commit, push or deployment. Full authenticated Next/physical-device integration remains unmeasured.
