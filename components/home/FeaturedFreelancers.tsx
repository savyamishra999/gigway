import { createClient } from "@/lib/supabase/server"
import Link from "next/link"
import { CheckCircle2, IndianRupee, Star } from "lucide-react"

export default async function FeaturedFreelancers() {
  const supabase = await createClient()
  const { data: freelancers } = await supabase
    .from("profiles")
    .select("id, username, full_name, avatar_url, tagline, skills, is_verified, avg_rating, hourly_rate")
    .eq("is_verified", true)
    .eq("profile_completed", true)
    .order("avg_rating", { ascending: false })
    .limit(6)

  return (
    <section className="bg-white py-20 sm:py-28">
      <div className="container mx-auto max-w-7xl px-4">
        <div className="flex items-end justify-between mb-12">
          <div>
            <p className="text-brand-indigo font-bold text-body-sm uppercase tracking-widest mb-2">Find Talent</p>
            <h2 className="text-h2 font-extrabold text-brand-midnight">Verified professionals, ready to work</h2>
          </div>
          <Link href="/freelancers" className="hidden md:inline-flex text-brand-indigo hover:text-brand-indigoDark text-body-sm font-semibold transition-colors">
            Discover Professionals →
          </Link>
        </div>

        {freelancers && freelancers.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {freelancers.map(f => (
              <Link key={f.id} href={f.username ? `/u/${f.username}` : `/freelancers/${f.id}`}
                className="bg-brand-ivory border border-brand-borderLight hover:border-brand-indigo/30 hover:-translate-y-1 rounded-card p-5 transition-all duration-200 shadow-soft hover:shadow-elevated">
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-brand-indigo to-brand-coral flex items-center justify-center text-white font-bold flex-shrink-0 overflow-hidden">
                    {f.avatar_url ? <img src={f.avatar_url} alt="" className="w-full h-full object-cover" /> : (f.full_name?.[0]?.toUpperCase() || "?")}
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5">
                      <p className="font-semibold text-brand-midnight text-body-sm truncate">{f.full_name || "GigWay member"}</p>
                      {f.is_verified && <CheckCircle2 className="h-3.5 w-3.5 text-brand-indigo flex-shrink-0" />}
                    </div>
                    {f.username && <p className="text-brand-slate text-caption">@{f.username}</p>}
                  </div>
                </div>
                {f.tagline && <p className="text-brand-slate text-body-sm mt-3 line-clamp-2">{f.tagline}</p>}
                {f.skills && f.skills.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mt-3">
                    {(f.skills as string[]).slice(0, 3).map(skill => (
                      <span key={skill} className="text-caption bg-white text-brand-slate px-2 py-0.5 rounded-pill border border-brand-borderLight">{skill}</span>
                    ))}
                  </div>
                )}
                <div className="flex items-center justify-between mt-4 pt-3 border-t border-brand-borderLight">
                  {f.hourly_rate ? (
                    <p className="flex items-center text-brand-midnight font-bold text-body-sm"><IndianRupee className="h-3.5 w-3.5" />{f.hourly_rate}/hr</p>
                  ) : <span />}
                  {!!f.avg_rating && (
                    <span className="flex items-center gap-1 text-caption text-brand-slate">
                      <Star className="h-3 w-3 fill-amber-400 text-amber-400" />{Number(f.avg_rating).toFixed(1)}
                    </span>
                  )}
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="rounded-card bg-brand-ivory border border-dashed border-brand-borderLight p-10 text-center">
            <p className="text-brand-midnight font-semibold text-body">Verified professionals are joining GigWay every day.</p>
            <Link href="/freelancers" className="mt-3 inline-block text-brand-indigo text-body-sm font-semibold">Browse all professionals →</Link>
          </div>
        )}
      </div>
    </section>
  )
}
