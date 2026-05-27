---
name: project-gigway
description: GigWay India freelance platform — revenue features, bug fixes, build order
metadata:
  type: project
---

GigWay (gigway.in) is India's zero-commission freelance platform built on Next.js 15, Supabase, Razorpay, Tailwind CSS.

**Why:** User wants to monetize as fast as possible while fixing critical bugs.

**Completed (as of session 2):**
- Boost/Featured Listing: ₹99/₹199/₹299/month — DB fields `is_boosted`, `boost_expires_at`, `boost_plan` on profiles. Razorpay payment. FreelancerCard shows ⭐ Featured badge + orange glow border. FreelancersPage shows max 3 boosted at top. Dashboard shows BoostProfileCard.
- Verified Badge: ₹299 one-time — DB field `verification_doc` on profiles. Payment → /verify-me form (LinkedIn URL or Aadhaar last 4 digits) → admin approval at /admin/verifications. Blue ✅ badge on profile cards. WhatsApp link for admin to notify user on approval.
- SSR Fix: /freelancers, /gigs, /jobs converted to server-renders-first (server component fetches initial data, passes to Client component for interactive filtering). No more "Loading..." on first paint.

**DB migrations to run:**
- `supabase/migrations/001_add_boost_fields.sql`
- `supabase/migrations/002_add_verification_doc.sql`

**Admin email:** tellitorg1@gmail.com (set via ADMIN_EMAILS env var)

**Next items (Priority order):**
1. Onboarding flow (/onboarding) — 6 steps
2. AI Tools page (/ai-tools) — 4 tools using claude-sonnet-4-20250514
3. Hindi language toggle
4. UPI escrow flow

**How to apply:** When user asks to build next feature, check this list and continue from the next uncompleted item.
