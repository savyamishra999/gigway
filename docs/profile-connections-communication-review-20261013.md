# Profile, connections and communication

Implemented in the local checkout on 2026-10-13. Existing unrelated edits preserved. No deployment, production database writes, purchases or messages to real people performed.

## User experience

- Home opens with a personalised profile preview and share actions. The server checks both completed identity and anonymous profile visibility before describing it as ready to share. Private/inaccessible profiles do not get this claim.
- A People to meet rail ranks a bounded recent cohort by actual shared skills, complementary declared work intentions, location and shared intentions. Each suggestion states its reason. No gender inference or gender matching. A declared hiring intention is described as an interest, not as an active job vacancy.
- Self is excluded; pending, accepted and rejected relationships are excluded from this rail. Existing follow/connect APIs are reused. Suggestions without a strong match receive an honest exploration label.
- The generic getting-started guide is collapsed under More ways to use GigWay. The later duplicate people rail was removed; Workplace discovery remains.
- Accepted connections have a Say hello action in connection controls and My Network. New accepted-connection notifications lead directly to the chat; request notifications open My Network.
- Logged-out visitors to a public profile receive an explicit sign-in-to-connect/message action preserving the destination.
- Profile sharing includes an editable WhatsApp introduction about skills, experience and work, without a job guarantee. Sharing remains user-initiated.

## Messages

- Active inbox and conversation routes share a new client. They authenticate on the server and key client state by viewer and destination.
- Read-only, participant-scoped message GET supports bounded 50-row pages with timestamp/ID cursors. Older history is available on demand. Inbox groups loaded message history and labels older-history loading explicitly; search operates on loaded history.
- Conversation refresh runs every 8 seconds while visible; inbox refresh every 20 seconds. Focus refresh is included. No Realtime publication/migration dependency was introduced.
- Send goes through the API. Text stays in the composer until confirmed. An uncertain response locks that attempt for check/retry with the same UUID, preventing a sequential retry from duplicating an already persisted message. A simultaneous duplicate-key request can receive a recoverable error; retry resolves the existing row.
- Empty/self/invalid-recipient and over-4,000-character messages are rejected. Recipient lookup uses the session client; sender identity is derived from authentication.
- Read updates use specific message IDs, recipient scoping and actual visible message elements in a focused conversation. Merely fetching messages does not mark them read. Failed read updates keep unread state and can retry on subsequent refresh.
- Introduction text is inserted into the composer for review. It is never sent automatically.
- Basic messaging remains free. Existing recipient access is preserved; no new cold-outreach quota, connection-only restriction, blocking system or paywall was introduced.

## Notifications

- New notification screen has All/Unread filters, bounded older-page loading, explicit mark-read controls and error recovery. Failed mutations never display success.
- Recent unread messages are derived from the authenticated recipient's message rows and shown as Reply to name links. They do not require a separate best-effort notification insert to arrive. Marking notifications read does not mark DMs read.
- A single authenticated activity provider refreshes counts every 30 seconds while visible, plus focus and local action refreshes. Navbar message badges show unread messages; bell badges include unread notifications and messages. These are update counts, not counts of unique people.
- Notification destinations are restricted to safe internal paths. Historical connection-request notifications also route to My Network.
- Accepted-connection updates now check the result of a conditional recipient-scoped update before emitting a notification, reducing duplicate acceptance notifications under races.

## Verification

- `node node_modules/typescript/bin/tsc --noEmit --incremental false` passed.
- `node scripts/test-communication.cjs` passed: 113 tied-timestamp messages across all pages, viewer scoping, side-effect-free GET, invalid payloads, sequential idempotent retry, recipient-only read updates, failure responses and professional ranking.
- `node scripts/test-activation-notifications.cjs` passed: 67 notifications across pages, owner-scoped mutation, unauthorized denial, mutation failure, unsafe destination rejection, and profile-ready visibility/completion gates.
- Existing `test-part10-network-pagination.cjs` and `test-home-action-guide.cjs` passed.
- `node scripts/communication-browser-qa.cjs` passed in local headless Chromium at 375px: manual introduction/send, failed delivery draft retention, same-ID retry, notification failure/recovery, inbox empty-state navigation, no horizontal overflow and no runtime exceptions. This harness renders the actual React clients with API fixtures, local Tailwind CSS, a fallback font and placeholder icons. It is not an authenticated production or complete Next.js layout test.

## Limits and release checks

- No schema or authorization policy changed. Existing Supabase RLS and account mutation guards remain authoritative. New code does not use user-editable metadata for authorization or expose a service key to clients. Route tests verify application scoping; they do not certify deployed RLS.
- Live database permissions, production deployment parity, authenticated two-account delivery and actual public profile visibility were not tested. Test those with controlled accounts before announcing a live launch.
- Existing connection mutation and notification insertion are separate operations. A notification insert failure does not undo an accepted connection; My Network remains the authoritative request/connection list. No atomic outbox was added.
- Suggested people are ranked within up to 60 recent discoverable profiles, not the entire member base. At larger scale this should become a paginated/server-ranked recommendation query.
- Conversation history is loaded in pages; when a refresh detects more than a page of unseen history, the earlier-history cursor is reset to make that gap retrievable. This is periodic refresh, not instant push delivery.
- No offline queue or cross-device draft recovery is claimed. Keep an uncertain message on screen and use Check & retry before navigating away.
- The unused legacy ChatWindow and MarkAllReadButton components remain; active routes no longer use them.
