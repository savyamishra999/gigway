# Profile field classification

Source-known and user-reported fields only; the full current live column catalog was not supplied. Every additional live field is UNKNOWN and denied by default. Categories separate public/owner read visibility from mutation authority. Public means only visible rows under RLS, never all rows.

| Field | Read classification | Write classification |
|---|---|---|
| `aadhaar_back_url` | ADMIN-ONLY | ADMIN-ONLY |
| `aadhaar_front_url` | ADMIN-ONLY | ADMIN-ONLY |
| `account_type` | PRIVATE OWNER | SERVER-ONLY |
| `availability` | PUBLIC | OWNER-EDITABLE |
| `avatar_url` | PUBLIC | OWNER-EDITABLE |
| `avg_rating` | PUBLIC | SERVER-ONLY |
| `ban_reason` | ADMIN-ONLY | ADMIN-ONLY |
| `bio` | PUBLIC | OWNER-EDITABLE |
| `boost_expires_at` | PUBLIC | SERVER-ONLY |
| `boost_plan` | PRIVATE OWNER | SERVER-ONLY |
| `company` | PUBLIC | SERVER-ONLY |
| `company_name` | PUBLIC | OWNER-EDITABLE |
| `company_size` | PUBLIC | OWNER-EDITABLE |
| `company_website` | PUBLIC | OWNER-EDITABLE |
| `connects_balance` | PRIVATE OWNER | SERVER-ONLY |
| `created_at` | PUBLIC | SERVER-ONLY |
| `cv_url` | PRIVATE OWNER | OWNER-EDITABLE |
| `education` | PRIVATE OWNER | SERVER-ONLY |
| `email` | PRIVATE OWNER | SERVER-ONLY |
| `expected_salary` | PRIVATE OWNER | OWNER-EDITABLE |
| `experience_description` | PUBLIC | OWNER-EDITABLE |
| `experience_years` | PUBLIC | OWNER-EDITABLE |
| `find_work_type` | PRIVATE OWNER | SERVER-ONLY |
| `full_name` | PUBLIC | OWNER-EDITABLE |
| `gst_number` | PRIVATE OWNER | OWNER-EDITABLE |
| `hire_talent_type` | PRIVATE OWNER | SERVER-ONLY |
| `hourly_rate` | PUBLIC | OWNER-EDITABLE |
| `id` | PUBLIC | SERVER-ONLY |
| `industry` | PUBLIC | OWNER-EDITABLE |
| `is_banned` | PRIVATE OWNER | ADMIN-ONLY |
| `is_boosted` | PUBLIC | SERVER-ONLY |
| `is_employer_verified` | PUBLIC | ADMIN-ONLY |
| `is_private` | PUBLIC | OWNER-EDITABLE |
| `is_verified` | PUBLIC | ADMIN-ONLY |
| `job_alerts_active` | PRIVATE OWNER | SERVER-ONLY |
| `job_function` | PUBLIC | OWNER-EDITABLE |
| `linkedin_url` | PUBLIC | OWNER-EDITABLE |
| `location` | PUBLIC | OWNER-EDITABLE |
| `phone` | PRIVATE OWNER | OWNER-EDITABLE |
| `phone_is_public` | PRIVATE OWNER | OWNER-EDITABLE |
| `plan` | PRIVATE OWNER | SERVER-ONLY |
| `plan_expires_at` | PRIVATE OWNER | SERVER-ONLY |
| `portfolio_links` | PUBLIC | OWNER-EDITABLE |
| `preferred_job_type` | PRIVATE OWNER | OWNER-EDITABLE |
| `priority_credits` | PRIVATE OWNER | SERVER-ONLY |
| `profile_completed` | PUBLIC | SERVER-ONLY |
| `purchased_features` | PRIVATE OWNER | SERVER-ONLY |
| `quick_apply_credits` | PRIVATE OWNER | SERVER-ONLY |
| `resume_url` | PRIVATE OWNER | SERVER-ONLY |
| `roles` | UNKNOWN | UNKNOWN / denied |
| `skills` | PUBLIC | OWNER-EDITABLE |
| `subscription_tier` | PRIVATE OWNER | SERVER-ONLY |
| `tagline` | PUBLIC | OWNER-EDITABLE |
| `total_reviews` | PUBLIC | SERVER-ONLY |
| `updated_at` | PUBLIC | SERVER-ONLY |
| `user_ref_code` | PRIVATE OWNER | SERVER-ONLY |
| `user_roles` | PRIVATE OWNER | SERVER-ONLY |
| `username` | PUBLIC | OWNER-EDITABLE |
| `verification_doc` | ADMIN-ONLY | ADMIN-ONLY |
| `verification_paid_at` | PRIVATE OWNER | SERVER-ONLY |
| `verification_status` | PRIVATE OWNER | ADMIN-ONLY |

Owner-editable preferences via the generic profile endpoint are the explicit list in lib/profile/fields.ts. Legacy user_roles/find_work_type/hire_talent_type/account_type and profile_completed are server-managed through validated onboarding, not direct owner updates. roles has no proven application meaning. education/resume_url remain owner-readable legacy fields, not generically writable. Promotional is_boosted/boost_expires_at and verification badges are public display facts but server/admin-written. Phone is never public through the base relation, even when phone_is_public is true; any future contact-sharing surface must explicitly implement that consent. Document paths and ban_reason are excluded from the owner view too. Future automation of admin-only verification fields remains paused.
