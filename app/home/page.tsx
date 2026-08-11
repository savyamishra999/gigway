import Link from "next/link"
import { BriefcaseBusiness, Building2, Layers3, Package, Sparkles, Star } from "lucide-react"
import { createClient } from "@/lib/supabase/server"

type Job = { id: string; title: string; company_name: string | null; location: string | null; salary_min: number | null; salary_max: number | null; skills_required: string[] | null; created_at: string }
type Project = { id: string; title: string; budget: number | null; category: string | null; skills_required: string[] | null; created_at: string }
type Gig = { id: string; title: string; price: number; delivery_days: number | null; image_url: string | null; category: string | null; profiles: { full_name: string | null; avg_rating: number | null } | { full_name: string | null; avg_rating: number | null }[] | null }

function Empty({ title, sub, href, label }: { title: string; sub?: string; href: string; label: string }) {
  return (
    <div className="rounded-2xl bg-white/[.035] p-6 text-center col-span-full">
      <p className="text-sm font-semibold text-white">{title}</p>
      {sub && <p className="mt-1 text-xs text-[#8D96A7]">{sub}</p>}
      <Link href={href} className="mt-3 inline-block text-sm font-semibold text-[#B9B3FF]">{label}</Link>
    </div>
  )
}

// Deterministic relevance score: counts how many of the profile's skills appear in the listing's required skills.
function skillScore(required: string[] | null | undefined, mySkills: string[]) {
  if (!required?.length || !mySkills.length) return 0
  const req = required.map(s => s.toLowerCase())
  return mySkills.reduce((score, skill) => score + (req.includes(skill.toLowerCase()) ? 1 : 0), 0)
}

function rankBySkills<T extends { created_at: string }>(items: T[], scoreOf: (item: T) => number, limit: number) {
  return [...items]
    .sort((a, b) => scoreOf(b) - scoreOf(a) || new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    .slice(0, limit)
}

function gigCreator(gig: Gig) {
  const p = Array.isArray(gig.profiles) ? gig.profiles[0] : gig.profiles
  return { name: p?.full_name || "Freelancer", rating: p?.avg_rating ?? null }
}

export default async function HomeHub() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return (
      <main className="min-h-screen bg-[#0A0A0F] px-4 py-16">
        <div className="mx-auto max-w-3xl text-center">
          <p className="text-sm font-bold tracking-[.16em] text-[#A99FFF]">GIGWAY</p>
          <h1 className="mt-3 text-4xl font-bold text-white">Your work. Your network. Your next opportunity.</h1>
          <p className="mt-4 text-[#9AA3B5]">Build your professional identity and discover opportunities in one place.</p>
          <Link href="/login" className="mt-7 inline-block rounded-xl bg-[#6D5DFB] px-5 py-3 font-semibold text-white">Join GigWay</Link>
        </div>
      </main>
    )
  }

  const [
    { data: profile },
    { data: jobs },
    { data: projects },
    { data: gigs },
    { data: people },
    { data: applications },
    { data: proposals },
    { data: recentJobsForCompanies },
  ] = await Promise.all([
    supabase.from("profiles").select("full_name, skills, avatar_url, bio, location").eq("id", user.id).maybeSingle(),
    supabase.from("jobs").select("id, title, company_name, location, salary_min, salary_max, skills_required, created_at").eq("status", "active").order("created_at", { ascending: false }).limit(12),
    supabase.from("projects").select("id, title, budget, category, skills_required, created_at").eq("status", "open").order("created_at", { ascending: false }).limit(12),
    supabase.from("gigs").select("id, title, price, delivery_days, image_url, category, profiles:freelancer_id(full_name, avg_rating)").eq("status", "active").order("created_at", { ascending: false }).limit(4),
    supabase.from("profiles").select("id, full_name, username, avatar_url, tagline, skills").eq("profile_completed", true).neq("id", user.id).limit(5),
    supabase.from("job_applications").select("id, created_at, status, jobs(title)").eq("applicant_id", user.id).order("created_at", { ascending: false }).limit(3),
    supabase.from("proposals").select("id, created_at, status, projects(title)").eq("freelancer_id", user.id).order("created_at", { ascending: false }).limit(3),
    supabase.from("jobs").select("company_name").eq("status", "active").not("company_name", "is", null).order("created_at", { ascending: false }).limit(30),
  ])

  const name = profile?.full_name?.split(" ")[0] || "there"
  const mySkills = (profile?.skills as string[] | null) ?? []
  const strength = [profile?.avatar_url, profile?.bio, mySkills.length > 0, profile?.location].filter(Boolean).length * 25

  const rankedJobs = rankBySkills(jobs ?? [], (j: Job) => skillScore(j.skills_required, mySkills), 4)
  const rankedProjects = rankBySkills(projects ?? [], (p: Project) => skillScore(p.skills_required, mySkills), 4)

  const companies = Array.from(new Set((recentJobsForCompanies ?? []).map(j => j.company_name).filter(Boolean) as string[])).slice(0, 6)

  return (
    <main className="min-h-screen bg-[#0A0A0F] px-4 py-8 pb-24">
      <div className="mx-auto max-w-6xl">
        <header className="mb-8">
          <p className="text-sm font-semibold text-[#A99FFF]">OPPORTUNITY HUB</p>
          <h1 className="mt-2 text-3xl font-bold tracking-tight text-white">Good morning, {name} <span aria-hidden>👋</span></h1>
          <p className="mt-2 text-[#98A1B3]">What are you looking for today?</p>
          <div className="mt-5 grid grid-cols-2 gap-3 sm:flex">
            <Link href="/jobs" className="rounded-xl bg-[#6D5DFB] px-4 py-3 text-center text-sm font-semibold text-white">Find work</Link>
            <Link href="/freelancers" className="rounded-xl bg-white/[.06] px-4 py-3 text-center text-sm font-semibold text-white">Find talent</Link>
            <Link href="/projects" className="rounded-xl bg-white/[.06] px-4 py-3 text-center text-sm font-semibold text-white">Find projects</Link>
            <Link href="/gigs" className="rounded-xl bg-white/[.06] px-4 py-3 text-center text-sm font-semibold text-white">Find services</Link>
          </div>
        </header>

        <div className="grid gap-6 lg:grid-cols-[1fr_300px]">
          <div className="space-y-9">
            <section>
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-bold text-white">Opportunities for you</h2>
                  <p className="mt-1 text-sm text-[#8F98AA]">
                    {mySkills.length > 0 ? "Matched to your skills, freshest first." : "Fresh work from across GigWay."}
                  </p>
                </div>
                <Sparkles className="text-[#FB923C]" />
              </div>
              <div className="mt-4 grid gap-3 md:grid-cols-2">
                {rankedJobs.map(job => (
                  <Link key={job.id} href={`/jobs/${job.id}`} className="rounded-2xl bg-[#15151d] p-5 ring-1 ring-white/8 transition hover:-translate-y-0.5 hover:ring-[#8177f7]/50">
                    <BriefcaseBusiness className="h-5 w-5 text-[#B9B3FF]" />
                    <p className="mt-5 font-semibold text-white">{job.title}</p>
                    <p className="mt-1 text-sm text-[#9EA7B9]">{job.company_name || "Company"} {job.location && `· ${job.location}`}</p>
                    {(job.salary_min || job.salary_max) && (
                      <p className="mt-3 text-sm font-semibold text-emerald-300">
                        ₹{job.salary_min?.toLocaleString() || ""}{job.salary_max && ` – ₹${job.salary_max.toLocaleString()}`}
                      </p>
                    )}
                  </Link>
                ))}
                {rankedProjects.map(project => (
                  <Link key={project.id} href={`/projects/${project.id}`} className="rounded-2xl bg-[#15151d] p-5 ring-1 ring-white/8 transition hover:-translate-y-0.5 hover:ring-orange-400/40">
                    <Layers3 className="h-5 w-5 text-[#FB923C]" />
                    <p className="mt-5 font-semibold text-white">{project.title}</p>
                    <p className="mt-2 text-sm text-[#9EA7B9]">{project.category || "Project"}</p>
                    <p className="mt-3 text-sm font-semibold text-orange-300">₹{project.budget?.toLocaleString() || "Negotiable"}</p>
                  </Link>
                ))}
                {rankedJobs.length === 0 && rankedProjects.length === 0 && (
                  <Empty title="New opportunities are coming." sub="Be among the first to discover them." href="/jobs" label="Explore jobs" />
                )}
              </div>
            </section>

            <section>
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-white">Services to explore</h2>
                <Link href="/gigs" className="text-sm font-semibold text-[#B9B3FF]">View all</Link>
              </div>
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                {gigs?.map(gig => {
                  const creator = gigCreator(gig as unknown as Gig)
                  return (
                    <Link key={gig.id} href={`/gigs/${gig.id}`} className="flex gap-4 rounded-2xl bg-white/[.035] p-4 hover:bg-white/[.06]">
                      <div className="grid h-14 w-14 shrink-0 place-items-center overflow-hidden rounded-xl bg-[#242431]">
                        {gig.image_url ? <img src={gig.image_url} alt="" className="h-full w-full object-cover" /> : <Package className="h-5 w-5 text-[#B9B3FF]" />}
                      </div>
                      <div className="min-w-0">
                        <p className="truncate font-semibold text-white">{gig.title}</p>
                        <p className="mt-1 flex items-center gap-1 text-xs text-[#A1A9B9]">
                          <span className="truncate">{creator.name}</span>
                          {creator.rating != null && creator.rating > 0 && (
                            <span className="flex shrink-0 items-center gap-0.5 text-[#FB923C]">
                              <Star className="h-3 w-3 fill-current" />{creator.rating.toFixed(1)}
                            </span>
                          )}
                        </p>
                        <p className="mt-1 text-sm text-[#A1A9B9]">From ₹{gig.price?.toLocaleString()} · {gig.delivery_days} days</p>
                      </div>
                    </Link>
                  )
                })}
                {!gigs?.length && <Empty title="Services will appear here." href="/gigs" label="Browse services" />}
              </div>
            </section>

            <section>
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-white">Companies hiring</h2>
              </div>
              {companies.length > 0 ? (
                <div className="mt-4 flex flex-wrap gap-2">
                  {companies.map(company => (
                    <Link key={company} href="/jobs" className="flex items-center gap-2 rounded-xl bg-white/[.035] px-4 py-2.5 text-sm text-[#CBD5E1] hover:bg-white/[.06]">
                      <Building2 className="h-4 w-4 text-[#8D96A7]" /> {company}
                    </Link>
                  ))}
                </div>
              ) : (
                <div className="mt-4"><Empty title="New opportunities are coming." sub="Companies will appear here as they post jobs." href="/jobs" label="Browse jobs" /></div>
              )}
            </section>
          </div>

          <aside className="space-y-5">
            <section className="rounded-2xl bg-gradient-to-br from-[#6D5DFB]/20 to-[#15151d] p-5 ring-1 ring-[#8177f7]/20">
              <p className="text-sm font-semibold text-white">Profile strength <span className="float-right text-[#C1BBFF]">{strength}%</span></p>
              <div className="mt-3 h-2 overflow-hidden rounded-full bg-white/10">
                <div className="h-full rounded-full bg-[#8177f7]" style={{ width: `${strength}%` }} />
              </div>
              <p className="mt-3 text-xs leading-relaxed text-[#AAB2C3]">
                {strength >= 100 ? "Your profile looks great." : `Add your ${[!profile?.avatar_url && "photo", !profile?.bio && "bio", mySkills.length === 0 && "skills", !profile?.location && "location"].filter(Boolean).join(", ")} to improve discovery.`}
              </p>
              <Link href="/profile/edit" className="mt-4 inline-block text-sm font-semibold text-white">Complete profile →</Link>
            </section>

            <section>
              <h2 className="text-base font-bold text-white">People to discover</h2>
              <div className="mt-3 space-y-2">
                {people?.map(person => (
                  <Link key={person.id} href={`/u/${person.username}`} className="flex items-center gap-3 rounded-xl p-2 hover:bg-white/[.05]">
                    <div className="grid h-9 w-9 place-items-center overflow-hidden rounded-xl bg-[#242431] text-sm font-bold text-white">
                      {person.avatar_url ? <img src={person.avatar_url} alt="" className="h-full w-full object-cover" /> : person.full_name?.[0] || "?"}
                    </div>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-white">{person.full_name || "GigWay member"}</p>
                      <p className="truncate text-xs text-[#8D96A7]">@{person.username}</p>
                    </div>
                  </Link>
                ))}
                {!people?.length && <p className="text-sm text-[#8D96A7]">More professionals are joining soon.</p>}
              </div>
            </section>

            <section>
              <h2 className="text-base font-bold text-white">Recent activity</h2>
              <div className="mt-3 space-y-2 text-sm text-[#A8B0C0]">
                {[...(applications ?? []), ...(proposals ?? [])]
                  .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
                  .slice(0, 4)
                  .map((item: { id: string; status: string; jobs?: { title: string } | { title: string }[] | null; projects?: { title: string } | { title: string }[] | null }) => {
                    const jobTitle = Array.isArray(item.jobs) ? item.jobs[0]?.title : item.jobs?.title
                    const projectTitle = Array.isArray(item.projects) ? item.projects[0]?.title : item.projects?.title
                    return (
                      <div key={item.id} className="rounded-xl bg-white/[.035] p-3">
                        <p className="capitalize">{item.status || "Submitted"}</p>
                        <p className="mt-1 text-xs text-[#7F899C]">{jobTitle || projectTitle || "Opportunity"}</p>
                      </div>
                    )
                  })}
                {!(applications?.length || proposals?.length) && <p className="text-sm text-[#8D96A7]">Your applications and proposals will appear here.</p>}
              </div>
            </section>
          </aside>
        </div>
      </div>
    </main>
  )
}
