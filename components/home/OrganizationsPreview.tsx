import { createClient } from "@/lib/supabase/server"
import Link from "next/link"
import { Building2 } from "lucide-react"

export default async function OrganizationsPreview() {
  const supabase = await createClient()
  const { data: organizations } = await supabase
    .from("organizations")
    .select("id, name, username, logo_url, tagline, industry")
    .order("created_at", { ascending: false })
    .limit(6)

  return (
    <section className="bg-brand-ivory py-20 sm:py-28">
      <div className="container mx-auto max-w-7xl px-4">
        <div className="flex items-end justify-between mb-12">
          <div>
            <p className="text-brand-indigo font-bold text-body-sm uppercase tracking-widest mb-2">Organizations</p>
            <h2 className="text-h2 font-extrabold text-brand-midnight">Build your company on GigWay</h2>
          </div>
          <Link href="/organizations/new" className="hidden md:inline-flex text-brand-indigo hover:text-brand-indigoDark text-body-sm font-semibold transition-colors">
            Create an Organization →
          </Link>
        </div>

        {organizations && organizations.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
            {organizations.map(org => (
              <Link key={org.id} href={`/u/${org.username}`}
                className="bg-white border border-brand-borderLight hover:border-brand-indigo/30 rounded-card p-5 text-center transition-all hover:-translate-y-1 shadow-soft hover:shadow-elevated">
                <div className="w-12 h-12 mx-auto rounded-xl bg-gradient-to-br from-brand-indigo to-brand-coral flex items-center justify-center overflow-hidden mb-3">
                  {org.logo_url
                    ? <img src={org.logo_url} alt="" className="w-full h-full object-cover" />
                    : <span className="text-white font-bold">{org.name?.[0] || "G"}</span>}
                </div>
                <p className="text-brand-midnight font-semibold text-body-sm truncate">{org.name}</p>
                <p className="text-brand-slate text-caption truncate mt-0.5">{org.industry || org.tagline || `@${org.username}`}</p>
              </Link>
            ))}
          </div>
        ) : (
          <div className="bg-white border border-dashed border-brand-borderLight rounded-card p-10 text-center">
            <Building2 className="h-8 w-8 text-brand-slate mx-auto mb-3" />
            <p className="text-brand-midnight font-semibold mb-1">New organizations are coming.</p>
            <p className="text-brand-slate text-body-sm mb-5">Be among the first to build your company&apos;s presence on GigWay.</p>
            <Link href="/organizations/new" className="inline-flex items-center gap-2 bg-brand-indigo hover:bg-brand-indigoDark text-white font-bold px-6 py-2.5 rounded-xl text-body-sm transition-colors">
              Create an Organization
            </Link>
          </div>
        )}

        <div className="text-center mt-10 md:hidden">
          <Link href="/organizations/new" className="text-brand-indigo font-semibold text-body-sm hover:underline">Create an Organization →</Link>
        </div>
      </div>
    </section>
  )
}
