import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import Link from "next/link"
import { Star, Zap, TrendingUp } from "lucide-react"

export default async function BoostJobPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/auth/login")

  // Only company users can boost
  const { data: profile } = await supabase
    .from("profiles")
    .select("user_roles, hire_talent_type, profile_completed")
    .eq("id", user.id)
    .single()

  const roles = (profile?.user_roles as string[] | null) ?? []
  const isCompany = roles.includes("hire_talent") && profile?.hire_talent_type === "company"
  if (!isCompany || !profile?.profile_completed) redirect("/dashboard")

  // Fetch this company's active jobs
  const { data: myJobs } = await supabase
    .from("jobs")
    .select("id, title, is_featured, featured_until, created_at")
    .eq("client_id", user.id)
    .eq("status", "active")
    .order("created_at", { ascending: false })

  return (
    <div className="min-h-screen bg-[#0A0A0F]">
      <div className="bg-gradient-to-b from-[#12121A] to-[#0A0A0F] border-b border-[#1E1E2E] py-10">
        <div className="container mx-auto px-4 max-w-4xl">
          <Link href="/jobs" className="text-[#6B7280] text-sm hover:text-white mb-4 inline-block">
            ← Back to Jobs
          </Link>
          <h1 className="text-3xl font-black text-white">Boost Your Job Listing</h1>
          <p className="text-[#6B7280] text-sm mt-1">
            Featured listings appear at the top of all job searches — more visibility, more applicants.
          </p>
        </div>
      </div>

      <div className="container mx-auto px-4 py-10 max-w-4xl">
        {/* Plans */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 mb-12">
          <BoostPlan
            icon={<Star className="h-6 w-6" />}
            name="Starter Boost"
            price="₹299"
            days={7}
            perks={["Top of search for 7 days", "Featured badge on listing", "Priority in email alerts"]}
            color="blue"
          />
          <BoostPlan
            icon={<Zap className="h-6 w-6" />}
            name="Pro Boost"
            price="₹599"
            days={30}
            perks={["Top of search for 30 days", "Featured badge on listing", "Priority in email alerts", "Highlighted card"]}
            color="amber"
            popular
          />
          <BoostPlan
            icon={<TrendingUp className="h-6 w-6" />}
            name="Max Boost"
            price="₹999"
            days={60}
            perks={["Top of search for 60 days", "Featured badge on listing", "Priority in email alerts", "Highlighted card", "Homepage featured slot"]}
            color="purple"
          />
        </div>

        {/* Job selector */}
        <div className="bg-[#12121A] border border-[#1E1E2E] rounded-2xl p-6">
          <h2 className="text-white font-bold text-lg mb-4">Your Active Jobs</h2>

          {!myJobs || myJobs.length === 0 ? (
            <div className="text-center py-10">
              <p className="text-[#6B7280] text-sm mb-4">No active job listings found.</p>
              <Link href="/jobs/new" className="bg-gradient-to-r from-[#4F46E5] to-[#6366F1] text-white font-bold px-5 py-2.5 rounded-xl text-sm hover:opacity-90">
                Post a Job First →
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              {myJobs.map(job => {
                const active = job.is_featured && job.featured_until && new Date(job.featured_until) > new Date()
                return (
                  <div key={job.id} className="flex items-center justify-between bg-[#0A0A0F] border border-[#1E1E2E] rounded-xl px-5 py-4">
                    <div>
                      <p className="text-white font-medium">{job.title}</p>
                      {active ? (
                        <p className="text-[#F59E0B] text-xs mt-0.5">
                          ⚡ Featured until {new Date(job.featured_until!).toLocaleDateString("en-IN")}
                        </p>
                      ) : (
                        <p className="text-[#6B7280] text-xs mt-0.5">Not boosted</p>
                      )}
                    </div>
                    <Link
                      href={`/api/payment/boost-job?jobId=${job.id}`}
                      className="bg-gradient-to-r from-[#F59E0B] to-[#F97316] text-white font-semibold px-4 py-2 rounded-lg text-sm hover:opacity-90 transition-opacity"
                    >
                      {active ? "Extend Boost" : "Boost Now"}
                    </Link>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function BoostPlan({
  icon, name, price, days, perks, color, popular,
}: {
  icon: React.ReactNode
  name: string
  price: string
  days: number
  perks: string[]
  color: "blue" | "amber" | "purple"
  popular?: boolean
}) {
  const colors = {
    blue:   { ring: "border-[#4F46E5]/40", icon: "bg-[#4F46E5]/20 text-[#818CF8]", badge: "bg-[#4F46E5]/10 text-[#818CF8]" },
    amber:  { ring: "border-[#F59E0B]/40", icon: "bg-[#F59E0B]/20 text-[#F59E0B]", badge: "bg-[#F59E0B]/10 text-[#F59E0B]" },
    purple: { ring: "border-[#8B5CF6]/40", icon: "bg-[#8B5CF6]/20 text-[#A78BFA]", badge: "bg-[#8B5CF6]/10 text-[#A78BFA]" },
  }[color]

  return (
    <div className={`relative bg-[#12121A] border rounded-2xl p-6 flex flex-col ${colors.ring} ${popular ? "shadow-[0_0_32px_rgba(245,158,11,0.12)]" : ""}`}>
      {popular && (
        <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-gradient-to-r from-[#F59E0B] to-[#F97316] text-white text-xs font-bold px-3 py-1 rounded-full">
          Most Popular
        </span>
      )}
      <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-4 ${colors.icon}`}>
        {icon}
      </div>
      <p className="text-white font-bold text-lg">{name}</p>
      <p className="text-3xl font-black text-white mt-1">{price}</p>
      <p className="text-[#6B7280] text-xs mt-0.5">{days} days featured</p>
      <ul className="mt-4 space-y-2 flex-1">
        {perks.map(p => (
          <li key={p} className="flex items-center gap-2 text-sm text-[#6B7280]">
            <span className="text-[#10B981]">✓</span> {p}
          </li>
        ))}
      </ul>
    </div>
  )
}
