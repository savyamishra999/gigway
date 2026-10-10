# GigCard paid-card implementation review

Date: 2026-10-10. Base HEAD: `5367b1232426f531da1fcbdd1c81914559d300b6`.

## Current status

Actual saved-card, Razorpay checkout verification, payment fulfillment and server export code is implemented locally. It replaces the earlier placeholder checkout endpoint. This is not a live-payment or production-safety claim. No commit, push, deployment, remote migration or real provider transaction was performed for this implementation.

Approved price: INR 99 (9900 paise), one time per saved card. Editing that card and repeat downloads/shares are included. A new card requires its own purchase. A card is an editable saved design, not an immutable image or a subscription. Saved cards are limited to 20 per owner.

Checkout remains paused by default. `GIGCARD_PAYMENTS_MODE=test` permits test integration outside the Vercel production environment, using matching `rzp_test_` credentials. Live mode additionally requires the deliberately false `GIGCARD_LIVE_RELEASE_APPROVED` code gate. General billing, escrow, verification collection and other paused financial flows remain unchanged.

## Implemented behavior

- Studio offers larger card typography, company name, custom HTTPS website/QR, a local photo/logo and optional GigWay branding. Free previews retain a preview label.
- Download PNG/JPG/PDF or Share opens the INR 99 purchase dialog. Continuing saves an owner-bound card revision before starting checkout. The native dialog closes while Razorpay is open.
- The server reserves a single order per card, checks the fixed server price and preflights rendering before creating a provider order. It validates provider order metadata, amount, currency, payment capture and callback HMAC before granting access.
- Uncertain order creation recovers by its unique receipt instead of blindly creating another order. An unresolved reservation returns a pending message; operational recovery is needed if no provider order exists.
- Payment fulfillment and entitlement are one locked database row. Repeated callbacks are idempotent. A provider payment cannot unlock multiple cards. A refund permanently revokes that purchase; late capture callbacks cannot restore it.
- Every export verifies the authenticated owner and payment state, including provider refund checks. PNG/JPG/PDF are generated server-side from the saved design. The browser does not grant a paid flag or supply a trusted export design.
- Restore purchase recovers a captured payment when the browser callback was lost. Repeated downloads and shares reuse the purchase. Sharing uses a second explicit tap for native browser user activation, with a download fallback.
- Private saved cards can be reopened from the Studio library. Revision checks reject conflicting edits. Contact details are only those explicitly entered for the card.
- Photos are bounded embedded PNGs, normalized before storage/rendering. No supplied remote image is fetched by the server. Website URLs require HTTPS; SVG text is escaped.
- Home includes three clearly labelled fictional example cards linking to Studio. Real user cards are not published automatically. A real member showcase still needs explicit consent and removal controls.

Browser previews can be screenshotted. This implementation controls official paid exports; it does not claim screenshot-proof protection.

## Database and configuration

Local migration: `supabase/migrations/20261010150000_gigcard_paid_cards.sql`.

It creates owner-bound designs and a server-only payment ledger. Authenticated users have own-design SELECT only; writes and payment RPCs are service-role only. Save, reservation, provider binding and settlement use database locks and constraints. The new migration remains UNAPPLIED remotely.

Server configuration uses existing Supabase URL/service credentials and `RAZORPAY_KEY_ID` (or the existing public-key fallback), `RAZORPAY_KEY_SECRET`, plus the separate `GIGCARD_RAZORPAY_WEBHOOK_SECRET`. Never expose either secret to the browser. The separate endpoint `/api/gigcard/webhook` handles `payment.captured` and `refund.processed`; the existing general billing webhook is unchanged. Capture must be configured and proved in the Razorpay test account before charging users.

`sharp` is now an explicit production dependency for server rendering. PGlite is a development dependency for disposable, local-only PostgreSQL tests; no Docker is involved.

## Validation evidence

- TypeScript passes.
- All 41 current regression suites pass; the dormant Part 3 media suite and worker helper are excluded. `git diff --check` passes. All 40 previously excluded/protected file hashes match the reviewed baseline, and the Git index is empty.
- GigCard checkout tests cover paused checkout, invalid order, cancellation, failed/pending verification and verified callbacks with a mocked SDK.
- Backend tests cover fixed pricing, order reuse, uncertain-order recovery, mismatched payment evidence, capture/refund behavior, unauthorized/unpaid export denial, HMAC validation, malformed JSON and image bounds. Actual server PNG/JPG/PDF generation and QR decoding pass.
- New migration passes isolated PGlite PostgreSQL tests: owner isolation, direct-write and RPC denial, version conflicts, single order per card, immutable provider binding, idempotent fulfillment, unique-payment rollback, monotonic refunds and card quota.
- Browser fixture passes simulated save -> payment -> verification -> export -> repeat share, without a second checkout. It also checks paused denial, three templates, custom website QR, photo/branding and widths 360/390/768/1280.
- Browser evidence: `C:/Users/Admin/AppData/Local/Temp/gigway-card-qa-Q9UbZ3`. Server export evidence: `C:/Users/Admin/AppData/Local/Temp/gigway-paid-export-mfgsJl`.

Browser payment APIs and provider SDK are mocked. The database test is an isolated engine test, not a Supabase direct-REST or multi-session concurrency proof. These checks do not establish production readiness.

## Remaining release gates

1. Complete the existing P0 security release gates. P0 remains LOCAL READY / PRODUCTION UNAPPLIED. Disposable database verification deferred due environment/tooling setup; no production safety claim. The new GigCard PGlite test does not verify the P0 migration.
2. Review and apply the GigCard migration in an authorized non-production Supabase environment; prove real auth/RLS/direct REST behavior and concurrent order/callback handling. Prepare controlled production migration and rollback sequencing separately.
3. Run real Razorpay test-mode checkout: capture, cancellation, failure, delayed callback, webhook retry, lost callback restoration, repeat access and refund revocation. Check capture configuration and the separate webhook secret.
4. Verify authenticated staging behavior, deployment bundling, saved-card persistence, rendering and Android native share/download with the real integration. Confirm price/refund/support terms before live charging.
5. Only after those results, explicitly authorize production migration/deployment and open the independent live GigCard gate. Do not enable general billing, proposals, escrow, document collection or team lifecycle as part of this release.

No real charges, automatic refunds, payouts or production mutations were performed. Existing protected audit files and unrelated dirty work must remain excluded from any later commit.
