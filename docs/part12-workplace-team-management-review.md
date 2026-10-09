# Part 12 — Workplace team management

Existing membership columns confirmed by zero-row read-only REST200. Protected Phase4 audit identifies unknown CHECK/unique/RLS/grant/trigger/RPC atomicity and no checked-in membership DDL. Connected Supabase projects do not include this workspace project; full live SQL catalog unavailable. Protected audit/catalog SQL preserved.

Added a read-only team roster, authorized by verified viewer plus active owner/admin membership BEFORE the roster read. Authenticated RLS client,25 rows plus lookahead, stored roles/status, previous/next and finite query errors. Manage Workplace links to View team. No new role values or writable membership controls.

Invite/add/change/remove/status transitions remain stopped at the catalog/atomic ownership gate. Inspect exact deployed constraints, pair uniqueness, policies and triggers before designing an atomic authorization/owner-preservation transaction. No guessed migration/backfill/rollback or is_primary repurposing. No remote migration.

Actual server fixture tests PASS: guest/member/absent role rejected before roster, owner/admin scoped viewer/organization/active membership,25-row rendering, page2 and finite lookup failures. Existing setup permission tests and TypeScript PASS. Browser14 roster samples across all requested widths PASS without overflow: C:/Users/Admin/AppData/Local/Temp/gigway-part12-component-6xxLOV/report.json. No live memberships/Next hydration/physical-device claim.

Application: app/organizations/[username]/team/page.tsx; app/organizations/[username]/edit/page.tsx. Tests: scripts/test-part12-workplace-team.cjs; scripts/part12-component-browser-qa.cjs; existing test-workplace-setup mock update.
Verdict: roster complete locally; lifecycle writes BLOCKED pending catalog and atomic ownership evidence. Continue later phases per master. No commit/push/deploy/production mutation.
