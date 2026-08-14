import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { createClient as createServiceClient } from "@supabase/supabase-js"
import { getUsageLimit, limitResponse } from "@/lib/billing/limits"

const adminDb = createServiceClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(req: NextRequest) {
  // Verify the user is authenticated
  const supabase = await createClient()
  const { data: { user }, error: authErr } = await supabase.auth.getUser()

  if (authErr || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const body = await req.json()

  // Build the update payload with only safe fields
  const {
    user_roles, find_work_type, hire_talent_type, account_type,
    full_name, phone, avatar_url, bio, location,
    job_function, skills, portfolio_links, hourly_rate,
    experience_years, experience_description, linkedin_url, cv_url,
    expected_salary, preferred_job_type,
    company_name, company_size, company_website, industry, gst_number,
  } = body

  const requestedPortfolio = Array.isArray(portfolio_links) ? portfolio_links : []
  if (requestedPortfolio.length) {
    // Onboarding can create the profile row, so use the service client while
    // still resolving entitlement from server-side records only.
    const usage = await getUsageLimit(adminDb, user.id, "portfolio")
    if (requestedPortfolio.length > usage.limit) {
      return NextResponse.json({ ...limitResponse(usage), feature: "portfolio", currentUsage: usage.used, requiredPlan: "pro" }, { status: 403 })
    }
  }

  if (!full_name?.trim()) {
    return NextResponse.json({ error: "Full name is required" }, { status: 400 })
  }
  if (!user_roles || user_roles.length === 0) {
    return NextResponse.json({ error: "Role is required" }, { status: 400 })
  }

  // Use upsert so the row is created if it doesn't exist yet
  // (happens when the initial INSERT in login/callback was blocked by RLS)
  const { error: updateErr } = await adminDb
    .from("profiles")
    .upsert({
      id:    user.id,
      email: user.email,
      user_roles,
      find_work_type:   find_work_type   ?? null,
      hire_talent_type: hire_talent_type ?? null,
      account_type:     account_type     ?? "individual",
      full_name:        full_name.trim(),
      phone:            phone?.trim() ?? null,
      avatar_url:       avatar_url     ?? null,
      bio:              bio            ?? null,
      location:         location       ?? null,
      job_function:     job_function   ?? null,
      skills:           skills         ?? [],
      portfolio_links:  portfolio_links ?? [],
      hourly_rate:      hourly_rate    ?? null,
      experience_years:       experience_years       ?? null,
      experience_description: experience_description ?? null,
      linkedin_url:           linkedin_url           ?? null,
      cv_url:                 cv_url                 ?? null,
      expected_salary:        expected_salary        ?? null,
      preferred_job_type:     preferred_job_type     ?? null,
      company_name:    company_name    ?? null,
      company_size:    company_size    ?? null,
      company_website: company_website ?? null,
      industry:        industry        ?? null,
      gst_number:      gst_number      ?? null,
      profile_completed: true,
    }, { onConflict: "id" })

  if (updateErr) {
    console.error("[onboarding/complete] upsert error:", updateErr.message)
    return NextResponse.json({ error: updateErr.message }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
