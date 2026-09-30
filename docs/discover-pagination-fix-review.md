# Discover pagination correctness review

Verdict: READY FOR PAGINATION FIX REVIEW. Local implementation only; no commit, push, build, deployment, database, schema, RLS, or remote mutation.

Baseline: Pass 1 `3683fda`; Pass 2 `18ebf3da35fd4b8a0b73b5d2ec90ab7968ae82c0`.

## Root cause and previous contract

This bug predates Pass 2. Both the Discover API and initial Home loader fetched one window of 16 published standard posts, applied `visiblePosts`, returned its first 15 entries, and emitted a cursor only if more than 15 entries remained visible. Hidden candidates therefore caused false exhaustion. Neither path used offsets or a separate `hasMore` field: `nextCursor !== null` is the continuation signal.

Canonical ordering is `created_at DESC, id DESC`. The cursor is the existing `created_at|id` string; consumption uses `created_at < time OR (created_at = time AND id < id)`. Timestamp ties retain the existing deterministic ID tie-breaker. The original first-window cursor was the last returned visible post.

Before editing application code, the unmodified final verification reproduced all three known diagnostics: one hidden candidate stranded 16 of 31 accessible posts; an entirely hidden first window stranded all 16 accessible posts; a hidden candidate on API continuation stranded 17 accessible posts after 30 returned posts. The diagnostics were not relabeled until the implementation passed them.

## Before evidence

Local actual SSR/API functions, mocked database; not a live database or browser. All six cases scanned one raw window. A: 16 public rows. B: 32 rows, first hidden. C: 32 rows, first 16 hidden. D: 40 rows cycling public/followers/private/draft, with drafts excluded by the base query. E: exactly 15 public rows. F: 80 rows, first 48 hidden. Viewer follows none of these authors.

| Case | Raw candidates | Visibility DB ops | Visible returned | Next cursor | Accessible remain |
|---|---:|---:|---:|---|---|
| A | 16 | 0 | 15 | `2026-09-20T12:00:00Z\|09986` | True |
| B | 16 | 1 | 15 | `None` | True |
| C | 16 | 1 | 0 | `None` | True |
| D | 16 | 1 | 6 | `None` | True |
| E | 15 | 0 | 15 | `None` | False |
| F | 16 | 1 | 0 | `None` | True |

## Corrected contract and invariants

`accessibleDiscoverPage` is shared by `initialHomePosts` and the Discover GET branch. It calls the unchanged batched `visiblePosts` before serialization. Up to 15 visible results are returned. Each query asks for remaining visible slots plus one candidate (at most 16). Hidden candidates consume no visible slots. When a window is exhausted but full, the next raw window is fetched until the visible page fills, the source returns a short window, or eight windows have been fetched.

The cursor retains its public format and accepts existing cursors. It marks the last **consumed raw row**, including hidden trailing rows. A fetched extra visible lookahead is not consumed and is left for the next page. Thus no accessible row is skipped when a batch contains more visible rows than fit. A null cursor is emitted only after a short raw window is fully consumed. A full window at the scan bound retains its raw cursor, including for an empty page. Continuation means more scanning may remain, not a guarantee that another visible post exists. At an exact full raw boundary a subsequent empty request may be needed to establish exhaustion.

For a stable ordered source and visibility snapshot: hidden rows never reach serialization; hidden rows take no visible slots; later visible posts survive hidden-heavy windows; order is preserved; IDs occur once; accessible rows are not skipped; null continuation requires exhaustion; work is finite; errors fail closed; SSR and continuation use the same traversal.

## SSR, hydration and Load More

SSR still serializes the first page directly, without an internal HTTP request. `safePosts`, reply previews, timed reactions, and viewer likes/saves/reposts remain unchanged. SocialHomeFeed takes initial items and cursor into state and skips the initial fetch, including empty pages and StrictMode effect replay. Load More appends items and adopts the returned cursor even for empty pages. No client change was necessary.

Actual hook lifecycle tests cover 0, 1, 15, 16, 31, and 45 public posts, plus 1, 16, 32, and 130 hidden-prefix cases. The last case starts with an empty SSR page and a non-null cursor. All traverse the expected visible sequence without duplicates or omissions and make zero initial hydration requests. These are synthetic lifecycle tests, not browser hydration.

## Bounds and security

At most 8 raw queries, 128 fetched candidates, and 16 visibility DB operations per request. Each window uses at most two parallel, deduplicated follow lookups; there are no per-post visibility queries. All-public windows require zero visibility lookups. Eight windows is a fixed correctness/latency compromise: at most eight sequential raw/visibility rounds; callers can resume after sparse or empty bounded pages.

Serialization runs only on the at-most-15 authorized results, once per response. Existing Pass 1 enrichment still has parallel per-post count requests (three per returned post), bulk identity/engagement queries, and per-object protected-media signing. Those existing costs are unchanged; this fix does not claim all enrichment is constant-query or change signing rules.

Published/standard base filters and existing owner, profile follow, organization follow, and author precedence rules are unchanged. Drafts are excluded; anonymous viewers receive only public posts. Private-labelled fixtures from unfollowed authors remain hidden. The existing visibility function treats non-public labels using its owner/follow rules; this change introduces no new visibility model. Profile follow, organization follow, and raw-query failures reject SSR and return API 503 before serialization. P0 and Pass 1 tests additionally cover organization management, protected media, viewer isolation, and fail-closed enrichment.

JOX/GLIMPS were inspected: their helpers retain continuation when the raw window is full, using a visible marker when the page fills and a raw marker otherwise. Discover adopts that principle and adds bounded repeated scanning. JOX, GLIMPS, Following, and post creation are unchanged.

## After evidence and per-request performance

Each table row is one request, starting with SSR then API continuation. Raw counts include the one lookahead candidate when fetched, so a lookahead may appear in consecutive requests; it is returned only once. Visibility counts exclude serialization's separate follow-state enrichment. All listed cases assert exact canonical sequence, no duplicates/skips/unauthorized output, at most 15 results, finite traversal, continuation on bound, and SSR/API first-page parity. Fixtures also assert both query ordering columns and descending directions.

| Case / page | Raw candidates | Windows | Visibility DB ops | Visible | Next cursor |
|---|---:|---:|---:|---:|---|
| public 0 / 1 | 0 | 1 | 0 | 0 | `None` |
| public 1 / 1 | 1 | 1 | 0 | 1 | `None` |
| public 15 / 1 | 15 | 1 | 0 | 15 | `None` |
| public 16 / 1 | 16 | 1 | 0 | 15 | `2026-09-20T12:00:00Z\|09986` |
| public 16 / 2 | 1 | 1 | 0 | 1 | `None` |
| public 31 / 1 | 16 | 1 | 0 | 15 | `2026-09-20T12:00:00Z\|09986` |
| public 31 / 2 | 16 | 1 | 0 | 15 | `2026-09-20T12:00:00Z\|09971` |
| public 31 / 3 | 1 | 1 | 0 | 1 | `None` |
| public 45 / 1 | 16 | 1 | 0 | 15 | `2026-09-20T12:00:00Z\|09986` |
| public 45 / 2 | 16 | 1 | 0 | 15 | `2026-09-20T12:00:00Z\|09971` |
| public 45 / 3 | 15 | 1 | 0 | 15 | `None` |
| A all 16 visible / 1 | 16 | 1 | 0 | 15 | `2026-09-20T12:00:00Z\|09986` |
| A all 16 visible / 2 | 1 | 1 | 0 | 1 | `None` |
| B first candidate hidden / 1 | 16 | 1 | 1 | 15 | `2026-09-20T12:00:00Z\|09985` |
| B first candidate hidden / 2 | 16 | 1 | 0 | 15 | `2026-09-20T12:00:00Z\|09970` |
| B first candidate hidden / 3 | 1 | 1 | 0 | 1 | `None` |
| last candidate hidden / 1 | 16 | 1 | 1 | 15 | `2026-09-20T12:00:00Z\|09985` |
| last candidate hidden / 2 | 16 | 1 | 0 | 15 | `2026-09-20T12:00:00Z\|09970` |
| last candidate hidden / 3 | 16 | 1 | 0 | 15 | `2026-09-20T12:00:00Z\|09955` |
| last candidate hidden / 4 | 2 | 1 | 0 | 2 | `None` |
| every second hidden / 1 | 30 | 4 | 4 | 15 | `2026-09-20T12:00:00Z\|09971` |
| every second hidden / 2 | 30 | 4 | 4 | 15 | `2026-09-20T12:00:00Z\|09941` |
| every second hidden / 3 | 20 | 2 | 2 | 10 | `None` |
| C first window hidden / 1 | 32 | 2 | 1 | 15 | `2026-09-20T12:00:00Z\|09970` |
| C first window hidden / 2 | 1 | 1 | 0 | 1 | `None` |
| two windows hidden / 1 | 48 | 3 | 2 | 15 | `2026-09-20T12:00:00Z\|09954` |
| two windows hidden / 2 | 16 | 1 | 0 | 15 | `2026-09-20T12:00:00Z\|09939` |
| two windows hidden / 3 | 2 | 1 | 0 | 2 | `None` |
| F three windows hidden / 1 | 64 | 4 | 3 | 15 | `2026-09-20T12:00:00Z\|09938` |
| F three windows hidden / 2 | 16 | 1 | 0 | 15 | `2026-09-20T12:00:00Z\|09923` |
| F three windows hidden / 3 | 2 | 1 | 0 | 2 | `None` |
| E exact end / 1 | 15 | 1 | 0 | 15 | `None` |
| D baseline mixed public followers private drafts / 1 | 30 | 3 | 3 | 10 | `None` |
| all hidden exact raw boundary / 1 | 16 | 2 | 1 | 0 | `None` |
| hidden tail after full visible page / 1 | 16 | 1 | 1 | 15 | `2026-09-20T12:00:00Z\|09985` |
| hidden tail after full visible page / 2 | 32 | 3 | 2 | 0 | `None` |
| D mixed visibility owner drafts profile organization / 1 | 24 | 3 | 5 | 15 | `2026-09-20T12:00:00Z\|09974` |
| D mixed visibility owner drafts profile organization / 2 | 24 | 3 | 5 | 15 | `2026-09-20T12:00:00Z\|09947` |
| D mixed visibility owner drafts profile organization / 3 | 16 | 2 | 2 | 10 | `None` |
| anonymous visibility / 1 | 64 | 6 | 0 | 8 | `None` |
| different and tied timestamps / 1 | 24 | 3 | 2 | 15 | `2026-09-17T00:00:00.000Z\|09978` |
| different and tied timestamps / 2 | 23 | 3 | 3 | 15 | `2026-09-14T00:00:00.000Z\|09955` |
| different and tied timestamps / 3 | 19 | 2 | 2 | 13 | `None` |
| safety bound then accessible posts / 1 | 128 | 8 | 8 | 0 | `2026-09-20T12:00:00Z\|09873` |
| safety bound then accessible posts / 2 | 18 | 2 | 1 | 15 | `2026-09-20T12:00:00Z\|09856` |
| safety bound then accessible posts / 3 | 15 | 1 | 0 | 15 | `None` |
| partial page at safety bound / 1 | 121 | 8 | 8 | 1 | `2026-09-20T12:00:00Z\|09880` |
| partial page at safety bound / 2 | 105 | 7 | 6 | 15 | `2026-09-20T12:00:00Z\|09776` |
| partial page at safety bound / 3 | 15 | 1 | 0 | 15 | `None` |

Failure cases each stop during the first raw/visibility window with zero serialized results (SSR rejection and API 503). Profile/organization failure fixtures each fetch 16 raw candidates and attempt one visibility lookup per invocation; raw-query failure attempts one raw query and zero visibility lookups. No partial response is returned.

## Verification

- `node node_modules/typescript/bin/tsc --noEmit --incremental false`: PASS.
- `node scripts/test-p0-social.cjs`: PASS.
- `node scripts/test-makkhan-pass1.cjs`: PASS.
- `node scripts/test-makkhan-pass2.cjs`: PASS.
- `node scripts/test-makkhan-pass2-final.cjs`: 19 PASS / 0 FAIL, including all three original bug assertions now in the regression gate.
- `node scripts/test-discover-pagination.cjs`: PASS, including hidden first/last/every-second, one/two/three hidden windows, hidden organization/profile content, owner/followed content, drafts/private-labelled data, ties, anonymous access, exact boundaries, hidden tails, empty and partial safety-bound pages, and query failures.
- `git diff --check`: PASS.

The new test writes full per-request metrics to the OS temporary directory as `discover-pagination-after.json`; before evidence is preserved above. The original three regression assertions remain in the final verification script. Its shared fixture now records rows/queries, injects failures, and is importable by the focused suite. The Pass 2 loader unit fixture was adapted to the shared helper; actual helper behavior is exercised by the final and pagination suites.

## Exact task files

- `app/api/social/posts/route.ts`
- `lib/home/primary.ts`
- `lib/social/server.ts`
- `scripts/test-makkhan-pass2.cjs`
- `scripts/test-makkhan-pass2-final.cjs`
- `scripts/test-discover-pagination.cjs` (new)
- `docs/discover-pagination-fix-review.md` (new)

Protected/unrelated `.claude/settings.local.json`, `docs/workplace-phase4-audit.md`, and `supabase/audits/` remain untouched and unstaged, verified against pre-task hashes. Nothing was staged.

`public/sw.js` SHA-256 remains `162B5E156486951569C71F24CA9B8FCAB512A792AB9E799DC988747A67C71DA3`. Current custom worker: `public/worker-RIgomFyrnZBIlFiS9JYxC.js`; also unchanged. No worker build/regeneration or policy changes.

## Remaining limitations / production QA

Tests use local mock I/O; real PostgREST query plans, production latency, browser hydration, slow networks and real protected-media delivery require production QA after a separately authorized release. Verify two viewer accounts with different follows, dense hidden windows, owner content, org content, empty bounded pages and repeated Load More, with network observation confirming no duplicate initial fetch.

Pagination is a keyset traversal, not a database snapshot. Concurrent deletes, changed timestamps/visibility, or follow changes between requests can change the accessible sequence. Previously consumed hidden rows becoming accessible are not revisited; refresh starts a new traversal. Existing cursor parsing/validation is preserved; no new cursor encoding or migration was introduced. Sparse tails can yield an extra empty continuation request. Existing Home rail candidate-starvation findings remain outside this fix.

Supabase query conventions were checked against the official [filter reference](https://supabase.com/docs/reference/javascript/using-filters) and [ordering reference](https://supabase.com/docs/reference/javascript/using-modifiers-order). The changelog endpoint could not be fetched in this environment; no Supabase SDK, configuration or feature migration was made.
