# Manual activation assistance — 18 October 2026

## Confirmed
- The linked Vercel GigWay production deployment is Ready and aliased to https://www.gigway.in.
- Production has Supabase, OpenAI and Razorpay key variable names configured. Secret contents were not printed.
- UTILITY_PAYMENTS_MODE and UTILITY_RAZORPAY_WEBHOOK_SECRET were absent from the production variable list.
- The connected Supabase account lists studyforest and ghardhudho.com, but not GigWay project sdrpqlahqkhimlpcobwf. A direct read-only query to that project returned permission denied.
- The further external table/webhook check was not executed: automatic approval review failed due to usage limits. This was not a finding that the operation was unsafe.
- Consequently no migration, webhook registration or live payment activation has been performed.

## Supabase — user can complete this manually
1. Open https://supabase.com/dashboard/project/sdrpqlahqkhimlpcobwf/sql/new using the account that owns GigWay.
2. In a new query, paste the entire contents of supabase/migrations/20261018090000_utility_products.sql and run it once.
3. Run docs/sql/utility-postflight.sql separately. Expect four tables with RLS on and no browser access, plus four service-only invoker functions.
4. Send the success/error text and postflight booleans, not passwords, API keys or user data.
5. If any utility object already exists, stop and report the error; do not drop tables or rerun unrelated migrations.

The prepared migration only creates the isolated utility feature objects. Do not run all repository migrations or change the earlier profile-security migration as part of this step. Manual SQL Editor execution does not automatically reconcile Supabase CLI migration history; record/reconcile the matching migration only after its schema has been verified.

## Razorpay + Vercel — after database readiness
1. Razorpay Dashboard → Live Mode → Accounts & Settings → Webhooks → Add New Webhook.
2. URL: https://www.gigway.in/api/utility/webhook
3. Events: payment.captured and refund.processed.
4. Choose a strong, unique webhook secret. Paste the SAME value privately into the Vercel GigWay project environment variable UTILITY_RAZORPAY_WEBHOOK_SECRET (Production). Do not send it in chat. This is a webhook secret, not the Razorpay API key secret.
5. Keep checkout paused until the actual payment/unlock/refund tests are completed. Test-mode validation needs matching Razorpay test credentials in an isolated preview environment; do not replace the shared production gateway keys.
6. After successful validation, set UTILITY_PAYMENTS_MODE=live for Production and redeploy the matching Git revision. Existing deployment instances do not automatically pick up changed environment variables.

Docs: https://razorpay.com/docs/webhooks/setup-edit-payments/
Supabase migration tracking: https://supabase.com/docs/guides/deployment/database-migrations

## Scope clarifications
Resume Score & Review and Pitch Generator are implemented. Resume reports assess pasted text and recommend improvements; they do not simulate an employer's ATS or parse an uploaded original PDF layout. GigWay Pro is ₹149 prepaid for 30 days, not automatic recurring billing. One report is ₹49, and professional badge activation is ₹299 for 365 days after review.
