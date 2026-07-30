import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { createClient as createServiceClient } from "@supabase/supabase-js"
import { Share2 } from "lucide-react"
import SocialPostClient from "@/components/admin/SocialPostClient"

const ADMIN_EMAILS = (process.env.ADMIN_EMAILS || "tellitorg1@gmail.com")
  .split(",").map(e => e.trim().toLowerCase())

const adminDb = createServiceClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export default async function AdminSocialPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user || !ADMIN_EMAILS.includes((user.email ?? "").toLowerCase())) redirect("/")

  const [
    { data: gigs },
    { data: jobs },
    { data: freelancers },
  ] = await Promise.all([
    adminDb
      .from("gigs")
      .select("id, title, price, category, profiles:freelancer_id(full_name, verification_status)")
      .eq("status", "active")
      .order("created_at", { ascending: false })
      .limit(30),

    adminDb
      .from("jobs")
      .select("id, title, company_name, location, job_type, required_skills, salary_min, salary_max")
      .eq("status", "active")
      .order("created_at", { ascending: false })
      .limit(30),

    adminDb
      .from("profiles")
      .select("id, full_name, skills, hourly_rate, location, verification_status")
      .eq("profile_completed", true)
      .contains("user_roles", ["find_work"])
      .order("created_at", { ascending: false })
      .limit(30),
  ])

  return (
    <div className="min-h-screen bg-[#0A0A0F] py-10 px-4">
      <div className="max-w-6xl mx-auto space-y-8">

        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#818CF8]/10 flex items-center justify-center">
            <Share2 className="h-5 w-5 text-[#818CF8]" />
          </div>
          <div>
            <h1 className="text-2xl font-black text-white">Social Posts</h1>
            <p className="text-[#6B7280] text-xs mt-0.5">
              Select a gig / job / freelancer → copy text → download card → paste on Twitter &amp; LinkedIn
            </p>
          </div>
        </div>

        <SocialPostClient
          gigs={(gigs ?? []) as unknown as Parameters<typeof SocialPostClient>[0]["gigs"]}
          jobs={(jobs ?? []) as unknown as Parameters<typeof SocialPostClient>[0]["jobs"]}
          freelancers={(freelancers ?? []) as unknown as Parameters<typeof SocialPostClient>[0]["freelancers"]}
        />
      </div>
    </div>
  )
}
