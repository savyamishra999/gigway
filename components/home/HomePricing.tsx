import { createClient } from "@/lib/supabase/server"
import Link from "next/link"
import { CheckCircle2 } from "lucide-react"

export default async function HomePricing() {
  const supabase = await createClient()

  const { count: boostedCount } = await supabase
    .from("profiles")
    .select("*", { count: "exact", head: true })
    .eq("is_boosted", true)
    .gt("boost_expires_at", new Date().toISOString())

  const displayed = boostedCount ?? 0

  return (
    <section className="py-20 bg-[#0A0A0F] border-t border-[#1E1E2E]">
      <div className="container mx-auto px-4 max-w-5xl">
        {/* Heading */}
        <div className="text-center mb-12">
          <p className="text-[#F59E0B] font-bold text-sm uppercase tracking-widest mb-2">Get More Clients</p>
          <h2 className="text-3xl md:text-4xl font-black text-white mb-3">
            💰 Top freelancers invest in visibility
          </h2>
          <p className="text-[#6B7280] max-w-md mx-auto">
            Your basic profile is always free. Boost it to appear first and get hired faster.
          </p>
        </div>

        {/* Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Card 1 — Boost */}
          <div className="relative bg-[#12121A] border-2 border-[#F97316]/50 rounded-2xl p-7 shadow-[0_0_30px_rgba(249,115,22,0.1)]">
            <div className="absolute -top-3 right-5">
              <span className="bg-[#F97316] text-white text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-wider">
                Most Popular
              </span>
            </div>

            <div className="flex items-start justify-between mb-4">
              <div>
                <p className="text-[#F97316] font-bold text-sm uppercase tracking-wider mb-1">Boost Profile</p>
                <p className="text-white text-4xl font-black">₹199<span className="text-lg font-normal text-[#6B7280]">/mo</span></p>
              </div>
              <span className="text-3xl">⭐</span>
            </div>

            <ul className="space-y-2.5 mb-6">
              {[
                "Appear at top of all searches",
                "⭐ Featured orange badge on profile",
                "3x more profile views (proven)",
                "Cancel anytime — no lock-in",
              ].map(perk => (
                <li key={perk} className="flex items-start gap-2.5 text-sm text-[#CBD5E1]">
                  <CheckCircle2 className="h-4 w-4 text-[#4ADE80] mt-0.5 flex-shrink-0" />
                  {perk}
                </li>
              ))}
            </ul>

            <Link
              href="/dashboard"
              className="flex items-center justify-center w-full py-3 rounded-xl bg-gradient-to-r from-[#F97316] to-[#F59E0B] text-white font-bold text-sm hover:opacity-90 transition-opacity"
            >
              Boost My Profile →
            </Link>

            {displayed > 0 && (
              <p className="text-center text-[#6B7280] text-xs mt-3">
                ⭐ {displayed} freelancer{displayed !== 1 ? "s" : ""} currently boosted
              </p>
            )}
          </div>

          {/* Card 2 — Verified */}
          <div className="bg-[#12121A] border-2 border-[#4F46E5]/40 rounded-2xl p-7">
            <div className="flex items-start justify-between mb-4">
              <div>
                <p className="text-[#818CF8] font-bold text-sm uppercase tracking-wider mb-1">Verified Badge</p>
                <p className="text-white text-4xl font-black">₹299<span className="text-lg font-normal text-[#6B7280]"> once</span></p>
              </div>
              <span className="text-3xl">✅</span>
            </div>

            <div className="mb-4">
              <span className="bg-[#4ADE80]/10 text-[#4ADE80] text-xs font-bold px-3 py-1 rounded-full border border-[#4ADE80]/20">
                PERMANENT — Never expires
              </span>
            </div>

            <ul className="space-y-2.5 mb-6">
              {[
                "Blue ✅ checkmark on your profile",
                "2x more client trust",
                "Priority placement in search",
                "Verified Expert label",
              ].map(perk => (
                <li key={perk} className="flex items-start gap-2.5 text-sm text-[#CBD5E1]">
                  <CheckCircle2 className="h-4 w-4 text-[#4ADE80] mt-0.5 flex-shrink-0" />
                  {perk}
                </li>
              ))}
            </ul>

            <Link
              href="/dashboard"
              className="flex items-center justify-center w-full py-3 rounded-xl bg-gradient-to-r from-[#4F46E5] to-[#6366F1] text-white font-bold text-sm hover:opacity-90 transition-opacity"
            >
              Get Verified →
            </Link>
          </div>
        </div>

        <p className="text-center text-[#475569] text-xs mt-8">
          Basic profile listing is always free. Optional paid features only for faster growth.
        </p>
      </div>
    </section>
  )
}
