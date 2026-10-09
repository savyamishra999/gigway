# Part 15 — Admin and launch review

Baseline: legacy dashboard inferred revenue from profile/plan flags and used inconsistent payment columns. Revenue lacked bounded complete navigation. Admin authorization already used verified email allowlists; lifecycle, bulk export and global enforcement remain legacy audit concerns.

Implemented locally: verified server viewer allowlist before privileged client construction; 11 exact HEAD-only counts for profiles, new/completed profiles, Workplaces, active Jobs/Services, open Projects, published standard GigThoughts, open reports, pending verification and banned profiles. Failed counts show Unavailable. Active users are explicitly not measured; signup counts are not activity.

Successful payment records use canonical `plan`, `amount`, `created_at` and status success/captured/paid, 50+1 rows, created_at/id ordering and period filters. Page subtotal excludes invalid amounts and is explicitly neither net/all-time revenue nor payout balance. No email/user-ID columns. Failed payments/refunds are not falsely inferred. Global mobile navigation is hidden on admin routes to avoid collision with admin navigation.

Meaningful actual-module tests: unauthorized access redirects before SDK construction, forged metadata grants no admin rights, exact query bounds/filters, explicit count failures, payment statuses/range/page subtotal/invalid records/PII exclusion. `scripts/test-part15-admin.cjs` passes. Current CSS/component browser QA covers dashboard and revenue at 320/360/375/390/412/430/1280; mocked identity/database, not real admin login or Next hydration. TypeScript passes.

Launch remains blocked: unknown membership lifecycle constraints/RLS, global Block/ban enforcement, private document storage/access review, non-atomic paid proposal/connects and billing fulfillment, real-device/authenticated integration. Existing admin deletion/broadcast/payment operations were source-audited only and never executed. No production mutation or money operation.

Files: `app/admin/page.tsx`, `app/admin/revenue/page.tsx`, `components/layout/ModernNavbar.tsx`; shared access from Part 13 `lib/admin/access.ts`; test and master QA scripts listed in the consolidated inventory.
