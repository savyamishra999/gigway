# Session restore redirect fix

The shared browser auth observer treated SIGNED_IN while its initial verified
identity was still undefined as an account change. The provider then replaced
the document with /auth/post-login. Supabase session recovery can emit this event
on startup, allowing the same redirect to recur on the next document load.

INITIAL_SESSION now establishes the event-comparison baseline without publishing
unverified display data. SIGNED_IN before that baseline is initialization, not an
account switch. Subsequent guest-to-user and account-to-account transitions still
invalidate document state. getUser remains the source of displayed identity;
server authorization is unchanged.

Validation: the new recovery regression fails against HEAD's original observer
and passes against the changed observer. All 23 auth/navigation groups, 12 P0 auth
groups and 6 loading/mobile groups pass. These are isolated synthetic tests, not
signed-in browser/device verification. git diff --check passes.

Public production GET on 2026-10-04 returned HTTP 200 in 1.486 seconds, with no
redirects or session cookies supplied. This does not establish signed-in health.
The initial restricted-network attempt failed; the permitted network check worked.

Changes are local; no deployment or database changes were made. Existing workspace
loading/media changes were preserved. The reported live hang is not yet reproduced
in an authenticated browser, so this is a confirmed code defect rather than a
claim that every reported production symptom has been resolved.
