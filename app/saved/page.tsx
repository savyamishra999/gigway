import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import Link from "next/link"
import { Bookmark, Heart } from "lucide-react"
import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Saved | GigWay",
  description: "Your saved freelancers and gigs on GigWay.",
}

export default async function SavedPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/login")

  // Fetch saved items
  const { data: savedItems } = await supabase
    .from("saved_items")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })

  const savedFreelancers = (savedItems || []).filter(s => s.item_type === "freelancer")
  const savedGigs = (savedItems || []).filter(s => s.item_type === "gig")
  const savedProjects = (savedItems || []).filter(s => s.item_type === "project")

  // Fetch freelancer details
  let freelancers: { id: string; full_name: string | null; tagline: string | null; avg_rating: number | null }[] = []
  if (savedFreelancers.length > 0) {
    const { data } = await supabase
      .from("profiles")
      .select("id, full_name, tagline, avg_rating")
      .in("id", savedFreelancers.map(s => s.item_id))
    freelancers = data || []
  }

  // Fetch gig details
  let gigs: { id: string; title: string; price: number; category: string | null }[] = []
  if (savedGigs.length > 0) {
    const { data } = await supabase
      .from("gigs")
      .select("id, title, price, category")
      .in("id", savedGigs.map(s => s.item_id))
    gigs = data || []
  }

  // Fetch project details
  let projects: { id: string; title: string; budget: number | null; status: string }[] = []
  if (savedProjects.length > 0) {
    const { data } = await supabase
      .from("projects")
      .select("id, title, budget, status")
      .in("id", savedProjects.map(s => s.item_id))
    projects = data || []
  }

  const isEmpty = savedFreelancers.length === 0 && savedGigs.length === 0 && savedProjects.length === 0

  return (
    <div className="min-h-screen bg-[#0A0A0F] py-10">
      <div className="container mx-auto px-4 max-w-4xl">
        <div className="flex items-center gap-3 mb-8">
          <Bookmark className="h-6 w-6 text-[#818CF8]" />
          <h1 className="text-3xl font-black text-white">Saved Items</h1>
        </div>

        {isEmpty ? (
          <div className="bg-[#12121A] border border-[#1E1E2E] rounded-2xl p-16 text-center">
            <Heart className="h-12 w-12 text-[#1E1E2E] mx-auto mb-4" />
            <h2 className="text-white font-bold text-xl mb-2">Nothing saved yet</h2>
            <p className="text-[#6B7280] mb-6">Save freelancers, gigs, and projects to find them quickly later</p>
            <div className="flex gap-3 justify-center flex-wrap">
              <Link href="/freelancers" className="bg-gradient-to-r from-[#4F46E5] to-[#6366F1] text-white font-bold px-5 py-2.5 rounded-xl text-sm hover:opacity-90">
                Browse Freelancers
              </Link>
              <Link href="/gigs" className="border border-[#1E1E2E] text-[#6B7280] hover:text-white font-medium px-5 py-2.5 rounded-xl text-sm transition-colors">
                Browse Gigs
              </Link>
            </div>
          </div>
        ) : (
          <div className="space-y-8">
            {/* Saved Freelancers */}
            {freelancers.length > 0 && (
              <section>
                <h2 className="text-white font-bold text-lg mb-4">Saved Freelancers ({freelancers.length})</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {freelancers.map(f => (
                    <Link key={f.id} href={`/freelancers/${f.id}`}
                      className="bg-[#12121A] border border-[#1E1E2E] rounded-2xl p-5 hover:border-[#4F46E5]/50 transition-colors flex items-center gap-4"
                    >
                      <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#4F46E5] to-[#F97316] flex items-center justify-center text-white font-bold text-lg flex-shrink-0">
                        {f.full_name?.[0] || "?"}
                      </div>
                      <div>
                        <p className="text-white font-semibold">{f.full_name}</p>
                        {f.tagline && <p className="text-[#6B7280] text-sm">{f.tagline}</p>}
                        {(f.avg_rating ?? 0) > 0 && (
                          <p className="text-[#F97316] text-xs font-medium">★ {f.avg_rating?.toFixed(1)}</p>
                        )}
                      </div>
                    </Link>
                  ))}
                </div>
              </section>
            )}

            {/* Saved Gigs */}
            {gigs.length > 0 && (
              <section>
                <h2 className="text-white font-bold text-lg mb-4">Saved Gigs ({gigs.length})</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {gigs.map(g => (
                    <Link key={g.id} href={`/gigs/${g.id}`}
                      className="bg-[#12121A] border border-[#1E1E2E] rounded-2xl p-5 hover:border-[#4F46E5]/50 transition-colors"
                    >
                      <p className="text-[#6B7280] text-xs uppercase tracking-wide capitalize mb-1">{g.category || "Gig"}</p>
                      <p className="text-white font-semibold mb-2">{g.title}</p>
                      <p className="text-[#F97316] font-bold">Starting ₹{g.price.toLocaleString()}</p>
                    </Link>
                  ))}
                </div>
              </section>
            )}

            {/* Saved Projects */}
            {projects.length > 0 && (
              <section>
                <h2 className="text-white font-bold text-lg mb-4">Saved Projects ({projects.length})</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {projects.map(p => (
                    <Link key={p.id} href={`/projects/${p.id}`}
                      className="bg-[#12121A] border border-[#1E1E2E] rounded-2xl p-5 hover:border-[#4F46E5]/50 transition-colors"
                    >
                      <p className="text-white font-semibold mb-2">{p.title}</p>
                      <div className="flex items-center justify-between">
                        {p.budget && <p className="text-[#F97316] font-bold text-sm">₹{p.budget.toLocaleString()}</p>}
                        <span className={`text-xs px-2 py-0.5 rounded-full capitalize ${
                          p.status === "open" ? "bg-[#10B981]/20 text-[#10B981]" : "bg-[#6B7280]/20 text-[#6B7280]"
                        }`}>{p.status}</span>
                      </div>
                    </Link>
                  ))}
                </div>
              </section>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
