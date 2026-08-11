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
    <section className="py-24 px-4 bg-[#12121A]">
      <div className="container mx-auto max-w-6xl">
        <div className="flex items-end justify-between mb-12">
          <div>
            <p className="text-[#F97316] text-sm font-bold uppercase tracking-widest mb-2">Organizations</p>
            <h2 className="text-4xl md:text-5xl font-black text-white">
              Companies building{" "}
              <span className="bg-gradient-to-r from-[#4F46E5] to-[#F97316] bg-clip-text text-transparent">on GigWay</span>
            </h2>
          </div>
          <Link href="/organizations/new" className="hidden md:inline-flex text-[#FB923C] hover:text-white text-sm font-semibold transition-colors">
            Create an Organization →
          </Link>
        </div>

        {organizations && organizations.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
            {organizations.map(org => (
              <Link key={org.id} href={`/@${org.username}`}
                className="bg-[#0A0A0F] border border-[#1E1E2E] hover:border-[#F97316]/40 rounded-2xl p-5 text-center transition-all hover:-translate-y-1">
                <div className="w-12 h-12 mx-auto rounded-xl bg-gradient-to-br from-[#4F46E5] to-[#F97316] flex items-center justify-center overflow-hidden mb-3">
                  {org.logo_url
                    ? <img src={org.logo_url} alt="" className="w-full h-full object-cover" />
                    : <span className="text-white font-black">{org.name?.[0] || "G"}</span>}
                </div>
                <p className="text-white font-semibold text-sm truncate">{org.name}</p>
                <p className="text-[#6B7280] text-xs truncate mt-0.5">{org.industry || org.tagline || `@${org.username}`}</p>
              </Link>
            ))}
          </div>
        ) : (
          <div className="bg-[#0A0A0F] border border-[#1E1E2E] rounded-2xl p-10 text-center">
            <Building2 className="h-8 w-8 text-[#4B5563] mx-auto mb-3" />
            <p className="text-white font-semibold mb-1">New organizations are coming.</p>
            <p className="text-[#6B7280] text-sm mb-5">Be among the first to build your company&apos;s presence on GigWay.</p>
            <Link href="/organizations/new" className="inline-flex items-center gap-2 bg-[#F97316] hover:bg-[#EA580C] text-white font-bold px-6 py-2.5 rounded-xl text-sm transition-colors">
              Create an Organization
            </Link>
          </div>
        )}

        <div className="text-center mt-10 md:hidden">
          <Link href="/organizations/new" className="text-[#FB923C] font-semibold text-sm hover:underline">Create an Organization →</Link>
        </div>
      </div>
    </section>
  )
}
