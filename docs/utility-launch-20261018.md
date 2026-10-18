# GigWay utility launch — 18 October 2026

## Implemented locally
- Home leads with Check Resume Score, Post a Service / Gig and Add Portfolio / Project. Community has its own /community route; Home no longer loads posts, suggestions, profile strength or activity-count queries.
- Resume text → actual AI readiness score/free preview → saved report → ₹49 per-report unlock → full report and server-authorized PDF. Reports are in English; this is text review, not an ATS parsing certification.
- Job description + user-supplied experience → editable pitch + cover letter. One successful pitch is free per account; failed generation does not consume it. ₹149 unlocks 30 days of unlimited pitches, paced at 10 generation attempts/hour. This version is prepaid access, **not an automatically renewing subscription**.
- /u/[username]/pitch shows only an explicitly published pitch. Publishing replaces the previous public pitch; private save unpublishes the selected draft. Inputs are not published.
- Professional work-evidence review at /tools/verification, reviewed at /admin/utility-verifications. Approved applicants can activate a 365-day badge for ₹299. Badge rendering checks approval, live payment and expiry. This does not grant the legacy identity-verification flag or collect identity documents.
- /ai-tools, /pricing → /subscribe and landing-page pricing point to the new utility products. Legacy billing/escrow/document collection remain unchanged.
- Separate utility orders: persisted reservation before gateway call, receipt-based interrupted-order recovery, captured payment validation, transactionally idempotent settlement, refunds revoke access. A test payment cannot grant live access.
- Private utility tables have RLS enabled, no browser privileges, and service-only invoker functions. Full results never enter a client-readable table. No existing database table is modified by this migration.
- Resume previews: three successful/in-progress analyses/day, with retries and identical-input cache reuse. Inputs are hashed with the target role; raw input is not persisted. Successful results are retained for reopening.

## Deployment configuration (values must be set privately)
- Existing NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.
- Existing OPENAI_API_KEY. Model remains gpt-4o-mini; output is schema-constrained and validated.
- UTILITY_PAYMENTS_MODE=paused | test | live. Defaults to paused.
- RAZORPAY_KEY_ID (or existing NEXT_PUBLIC_RAZORPAY_KEY_ID), RAZORPAY_KEY_SECRET. Key prefix must match test/live.
- UTILITY_RAZORPAY_WEBHOOK_SECRET, independently configured for /api/utility/webhook.
- ADMIN_EMAILS: explicit list required for the new reviewer page/API.

Existing secrets were not copied or printed. No production database mutation, gateway charge, deployment or activation was performed.

## Migration and release sequence
1. Apply supabase/migrations/20261018090000_utility_products.sql to a disposable/staging Supabase project and run the staging application with matching secrets.
2. Register /api/utility/webhook for payment.captured and refund.processed with a dedicated webhook secret.
3. Use test mode to verify actual hosted checkout, captured payment, refresh/recovery, duplicate delivery, refund revocation, report download and Pro expiry. Test report and pitch rendering on mobile.
4. Verify real AI output quality and consent/retention wording with representative English resumes. No AI/provider calls were made during local synthetic tests.
5. Verify reviewer access and the approved → paid → active → expired/revoked badge journey. Test-mode badges intentionally do not appear on public profiles.
6. Apply the reviewed migration to production, deploy the matching application, configure live keys/webhook and change UTILITY_PAYMENTS_MODE to live only after those checks. The earlier P0 production security gates in docs/production-security-release-gates.md remain separate.
7. Check the public policy/help pages against the final commercial offering, including refund handling and prepaid renewal terms, before opening live checkout.

The migration creates new objects and is intended to run once through migration tracking. Rollback during staging should use a disposable reset; do not drop paid reports/orders in production. Switching UTILITY_PAYMENTS_MODE to paused stops checkout, while saved reports and existing live paid access remain readable.

## Local validation
- node scripts/test-utility-database.cjs: in-memory PostgreSQL tests for direct-client denial, service RPC permissions, ownership, free-pitch reservation, duplicate/retried generation, payment amount/ownership, replay, refunds, expiry, test/live isolation and publish/unpublish.
- node scripts/test-utility-payments.cjs: HMAC malformed signatures, product whitelist, AI result validation, PDF generation, provider captured-state/amount/currency/ownership/mode validation and interrupted order recovery.
- node scripts/test-utility-routes.cjs: actual GET/PDF handler execution with mocked storage/auth for preview redaction, unpaid export denial and cross-user access denial.
- node scripts/test-utility-home.cjs: real Home/action server render with mocked auth; verifies three primary actions, secondary community link, guest entry and absence of eager social/profile queries.
- TypeScript: PASS. All four utility test scripts: PASS.
- Production Next.js build: PASS (160 static pages generated; utility routes included). First attempt failed because restricted network access prevented Manrope Google Font download; retry with network access completed successfully. Existing Browserslist/cache/edge-runtime warnings were non-blocking. Generated service-worker source artifacts were restored after the build to avoid unrelated source changes.
- No claim of a live payment, browser end-to-end test or production migration is made.

Migration SHA256: 770f39224eb2ef6581f7844d0b965e6979e6d4743ac45346c27199b7e186d79b.

## Reference contracts
- Supabase database functions: https://supabase.com/docs/guides/database/functions
- Razorpay Standard Checkout: https://razorpay.com/docs/payments/payment-gateway/web-integration/standard/integration-steps/
- OpenAI structured outputs: https://developers.openai.com/api/docs/guides/structured-outputs
