import { createClient } from "@/lib/supabase/server"
import Link from "next/link"
import { Briefcase, MapPin } from "lucide-react"

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime()
  const hrs = Math.floor(diff / 3600000)
  if (hrs < 1) return "Just now"
  if (hrs < 24) return `${hrs}h ago`
  return `${Math.floor(hrs / 24)}d ago`
}

export default async function JobsPreview() {
  const supabase = await createClient()
  const { data: jobs } = await supabase
    .from("jobs")
    .select("id, title, company_name, location, job_type, salary_min, salary_max, skills_required, created_at")
    .eq("status", "active")
    .order("created_at", { ascending: false })
    .limit(6)

  if (!jobs || jobs.length === 0) return null

  return (
    <section className="py-24 px-4 bg-[#0A0A0F]">
      <div className="container mx-auto max-w-6xl">
        <div className="flex items-end justify-between mb-12">
          <div>
            <p className="text-[#818CF8] text-sm font-bold uppercase tracking-widest mb-2">Opportunity Preview</p>
            <h2 className="text-4xl md:text-5xl font-black text-white">
              Jobs open{" "}
              <span className="bg-gradient-to-r from-[#4F46E5] to-[#F97316] bg-clip-text text-transparent">right now</span>
            </h2>
          </div>
          <Link href="/jobs" className="hidden md:inline-flex text-[#818CF8] hover:text-[#4F46E5] text-sm font-semibold transition-colors">
            View All →
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {jobs.map(job => (
            <Link key={job.id} href={`/jobs/${job.id}`}
              className="bg-[#12121A] border border-[#1E1E2E] hover:border-[#4F46E5]/40 hover:-translate-y-1 rounded-2xl p-5 transition-all duration-300 group">
              <div className="flex items-center justify-between mb-4">
                <div className="w-10 h-10 rounded-xl bg-[#4F46E5]/10 flex items-center justify-center">
                  <Briefcase className="h-5 w-5 text-[#818CF8]" />
                </div>
                <span className="text-[#475569] text-xs">{timeAgo(job.created_at)}</span>
              </div>
              <h3 className="text-white font-semibold text-sm line-clamp-2 mb-2 group-hover:text-[#818CF8] transition-colors">
                {job.title}
              </h3>
              <p className="text-[#6B7280] text-xs flex items-center gap-1 mb-3">
                {job.company_name || "GigWay employer"}
                {job.location && <><span className="text-[#334155]">·</span><MapPin className="h-3 w-3" />{job.location}</>}
              </p>
              {(job.salary_min || job.salary_max) && (
                <p className="text-emerald-300 font-bold text-sm mb-3">
                  ₹{job.salary_min?.toLocaleString() ?? ""}{job.salary_max && ` – ₹${job.salary_max.toLocaleString()}`}
                </p>
              )}
              {job.skills_required && job.skills_required.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {(job.skills_required as string[]).slice(0, 3).map(skill => (
                    <span key={skill} className="text-[10px] bg-white/5 text-[#9CA3AF] px-2 py-0.5 rounded-full border border-white/5">{skill}</span>
                  ))}
                </div>
              )}
            </Link>
          ))}
        </div>

        <div className="text-center mt-10 md:hidden">
          <Link href="/jobs" className="text-[#818CF8] font-semibold text-sm hover:underline">View All Jobs →</Link>
        </div>
      </div>
    </section>
  )
}
