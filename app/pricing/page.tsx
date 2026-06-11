import { createClient } from "@/lib/supabase/server"
import Link from "next/link"
import { CheckCircle2, Zap, Link2 } from "lucide-react"
import type { Metadata } from "next"
import PricingFAQ from "@/components/pricing/PricingFAQ"
import ConnectsBuyButton from "@/components/pricing/ConnectsBuyButton"

export const metadata: Metadata = {
  title: "Pricing — GigWay Boost & Verified Badge",
  description: "Boost profile ₹199/month. Get verified ₹299 one-time. India's zero commission freelance platform — basic use always free.",
  openGraph: {
    title: "Pricing — GigWay",
    description: "Boost ₹199/mo · Verified ₹299 once · Basic always free.",
    type: "website",
  },
}

export default async function PricingPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { count: boostedCount } = await supabase
    .from("profiles")
    .select("*", { count: "exact", head: true })
    .eq("is_boosted", true)
    .gt("boost_expires_at", new Date().toISOString())

  const cta = user ? "/dashboard" : "/login?redirect=/dashboard"
  const displayed = boostedCount ?? 0

  return (
    <div className="min-h-screen bg-[#0F172A]">

      {/* Hero */}
      <div className="text-center pt-20 pb-14 px-4">
        <div className="inline-flex items-center gap-2 bg-[#4F46E5]/10 border border-[#4F46E5]/20 rounded-full px-4 py-1.5 mb-6">
          <Zap className="h-3.5 w-3.5 text-[#818CF8]" />
          <span className="text-[#818CF8] text-xs font-semibold uppercase tracking-wider">Transparent Pricing</span>
        </div>
        <h1 className="text-4xl md:text-5xl font-black text-white mb-4">
          Simple, Transparent Pricing
        </h1>
        <p className="text-[#94A3B8] text-lg max-w-md mx-auto">
          Zero commission forever. Pay only to grow faster.
        </p>
      </div>

      <div className="container mx-auto px-4 max-w-5xl pb-24">

        {/* Plans */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-20">

          {/* FREE */}
          <div className="bg-[#1E293B] border border-[#334155] rounded-2xl p-7 flex flex-col">
            <div className="mb-6">
              <p className="text-[#94A3B8] font-bold text-sm uppercase tracking-wider mb-2">Free</p>
              <div className="flex items-baseline gap-1">
                <span className="text-white text-4xl font-black">₹0</span>
                <span className="text-[#6B7280] text-lg ml-1">forever</span>
              </div>
            </div>
            <ul className="space-y-3 mb-8 flex-1">
              {[
                "Create unlimited gigs",
                "Apply to unlimited projects",
                "Keep 100% of earnings",
                "Basic profile listing",
                "Message clients directly",
              ].map(f => (
                <li key={f} className="flex items-start gap-2.5 text-sm text-[#CBD5E1]">
                  <CheckCircle2 className="h-4 w-4 text-[#4ADE80] mt-0.5 flex-shrink-0" />
                  {f}
                </li>
              ))}
            </ul>
            <Link
              href="/login"
              className="flex items-center justify-center w-full py-3 rounded-xl border border-[#334155] text-white font-bold text-sm hover:bg-white/5 transition-colors"
            >
              Join Free →
            </Link>
          </div>

          {/* BOOST — center, highlighted */}
          <div className="relative bg-[#12121A] border-2 border-[#F97316]/50 rounded-2xl p-7 flex flex-col shadow-[0_0_40px_rgba(249,115,22,0.12)]">
            <div className="absolute -top-4 left-1/2 -translate-x-1/2 whitespace-nowrap">
              <span className="bg-gradient-to-r from-[#F97316] to-[#F59E0B] text-white text-[10px] font-black px-4 py-1.5 rounded-full uppercase tracking-wider shadow-lg">
                Most Popular
              </span>
            </div>
            <div className="mb-6 mt-2">
              <p className="text-[#F97316] font-bold text-sm uppercase tracking-wider mb-2">Boost Profile</p>
              <div className="flex items-baseline gap-1">
                <span className="text-white text-4xl font-black">₹199</span>
                <span className="text-[#6B7280] text-lg ml-1">/month</span>
              </div>
            </div>
            <ul className="space-y-3 mb-8 flex-1">
              {[
                "Appear at top of all searches",
                "⭐ Featured orange badge on profile",
                "3x more profile views (proven)",
                "Priority above free profiles",
                "Cancel anytime — no lock-in",
              ].map(f => (
                <li key={f} className="flex items-start gap-2.5 text-sm text-[#CBD5E1]">
                  <CheckCircle2 className="h-4 w-4 text-[#4ADE80] mt-0.5 flex-shrink-0" />
                  {f}
                </li>
              ))}
            </ul>
            <Link
              href={cta}
              className="flex items-center justify-center w-full py-3 rounded-xl bg-gradient-to-r from-[#F97316] to-[#F59E0B] text-white font-bold text-sm hover:opacity-90 transition-opacity shadow-lg shadow-[#F97316]/20"
            >
              Boost My Profile →
            </Link>
            {displayed > 0 && (
              <p className="text-center text-[#6B7280] text-xs mt-3">
                ⭐ {displayed} freelancer{displayed !== 1 ? "s" : ""} currently boosted
              </p>
            )}
          </div>

          {/* VERIFIED */}
          <div className="bg-[#1E293B] border border-[#4F46E5]/30 rounded-2xl p-7 flex flex-col">
            <div className="mb-4">
              <p className="text-[#818CF8] font-bold text-sm uppercase tracking-wider mb-2">Verified Badge</p>
              <div className="flex items-baseline gap-1">
                <span className="text-white text-4xl font-black">₹299</span>
                <span className="text-[#6B7280] text-lg ml-1">one-time</span>
              </div>
            </div>
            <div className="mb-5">
              <span className="bg-[#4ADE80]/10 text-[#4ADE80] text-xs font-bold px-3 py-1 rounded-full border border-[#4ADE80]/20">
                PERMANENT — Never expires
              </span>
            </div>
            <ul className="space-y-3 mb-8 flex-1">
              {[
                "Blue ✅ checkmark on your profile",
                "Instant trust from clients",
                "Priority in search results",
                "Verified Expert label",
                "One-time payment — own it forever",
              ].map(f => (
                <li key={f} className="flex items-start gap-2.5 text-sm text-[#CBD5E1]">
                  <CheckCircle2 className="h-4 w-4 text-[#4ADE80] mt-0.5 flex-shrink-0" />
                  {f}
                </li>
              ))}
            </ul>
            <Link
              href={cta}
              className="flex items-center justify-center w-full py-3 rounded-xl bg-gradient-to-r from-[#4F46E5] to-[#6366F1] text-white font-bold text-sm hover:opacity-90 transition-opacity"
            >
              Get Verified →
            </Link>
          </div>
        </div>

        {/* ⚡ Flash Offer — ₹49 */}
        <div className="mb-14">
          <div className="relative bg-gradient-to-r from-[#F97316]/10 via-[#F59E0B]/10 to-[#F97316]/10 border-2 border-[#F97316]/40 rounded-2xl p-7 overflow-hidden">
            {/* Animated glow pulse */}
            <div className="absolute inset-0 bg-gradient-to-r from-[#F97316]/5 to-[#F59E0B]/5 animate-pulse" />
            <div className="relative flex flex-col md:flex-row items-center justify-between gap-6">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <span className="bg-[#F97316] text-white text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-wider animate-pulse">
                    ⚡ Flash Offer — Today Only
                  </span>
                </div>
                <h3 className="text-white font-black text-2xl md:text-3xl mb-1">
                  5 Connects for{" "}
                  <span className="bg-gradient-to-r from-[#F97316] to-[#F59E0B] bg-clip-text text-transparent">
                    ₹49
                  </span>
                </h3>
                <p className="text-[#94A3B8] text-sm max-w-sm">
                  Perfect first purchase. Try applying to projects risk-free — if it works, you&apos;ll buy more.
                </p>
                <p className="text-[#6B7280] text-xs mt-1 line-through">Regular price ₹99 for 20 connects</p>
              </div>
              <div className="flex-shrink-0 text-center">
                <div className="text-4xl font-black text-[#F97316] mb-1">₹49</div>
                <div className="text-[#94A3B8] text-xs mb-4">5 connects · one-time</div>
                <Link
                  href={user ? "/buy-connects?plan=flash_5" : "/login?redirect=/pricing"}
                  className="inline-flex items-center justify-center px-8 py-3 rounded-xl bg-gradient-to-r from-[#F97316] to-[#F59E0B] text-white font-black text-sm shadow-xl shadow-[#F97316]/25 hover:opacity-90 transition-opacity whitespace-nowrap"
                >
                  Grab Flash Deal →
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* Connects */}
        <div id="connects" className="mb-20">
          <div className="text-center mb-10">
            <div className="inline-flex items-center gap-2 bg-[#4ADE80]/10 border border-[#4ADE80]/20 rounded-full px-4 py-1.5 mb-4">
              <Link2 className="h-3.5 w-3.5 text-[#4ADE80]" />
              <span className="text-[#4ADE80] text-xs font-semibold uppercase tracking-wider">Connects</span>
            </div>
            <h2 className="text-white font-black text-3xl mb-2">Buy Connects</h2>
            <p className="text-[#94A3B8] text-sm max-w-md mx-auto">
              Use connects to apply to projects. Each application costs 2 connects. New users get 10 free.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-3xl mx-auto">
            {/* Starter */}
            <div className="bg-[#1E293B] border border-[#334155] rounded-2xl p-6 flex flex-col">
              <div className="mb-5">
                <p className="text-[#94A3B8] font-bold text-xs uppercase tracking-wider mb-2">Starter</p>
                <div className="flex items-baseline gap-1">
                  <span className="text-white text-3xl font-black">₹99</span>
                </div>
                <p className="text-[#4ADE80] font-black text-lg mt-1">20 Connects</p>
                <p className="text-[#6B7280] text-xs">₹4.95 per connect</p>
              </div>
              <p className="text-[#94A3B8] text-sm mb-6 flex-1">Perfect for occasional project applications.</p>
              <ConnectsBuyButton plan="connects_20" label="Buy 20 Connects" isLoggedIn={!!user} />
            </div>

            {/* Popular */}
            <div className="relative bg-[#12121A] border-2 border-[#4ADE80]/40 rounded-2xl p-6 flex flex-col shadow-[0_0_30px_rgba(74,222,128,0.08)]">
              <div className="absolute -top-4 left-1/2 -translate-x-1/2 whitespace-nowrap">
                <span className="bg-gradient-to-r from-[#4ADE80] to-[#22C55E] text-black text-[10px] font-black px-4 py-1.5 rounded-full uppercase tracking-wider">
                  Best Value ⭐
                </span>
              </div>
              <div className="mb-5 mt-1">
                <p className="text-[#4ADE80] font-bold text-xs uppercase tracking-wider mb-2">Popular</p>
                <div className="flex items-baseline gap-1">
                  <span className="text-white text-3xl font-black">₹249</span>
                </div>
                <p className="text-[#4ADE80] font-black text-lg mt-1">60 Connects</p>
                <p className="text-[#6B7280] text-xs">₹4.15 per connect — save 16%</p>
              </div>
              <p className="text-[#94A3B8] text-sm mb-6 flex-1">Ideal for active freelancers applying regularly.</p>
              <ConnectsBuyButton plan="connects_60" label="Buy 60 Connects" isLoggedIn={!!user} highlight />
            </div>

            {/* Pro */}
            <div className="bg-[#1E293B] border border-[#334155] rounded-2xl p-6 flex flex-col">
              <div className="mb-5">
                <p className="text-[#94A3B8] font-bold text-xs uppercase tracking-wider mb-2">Pro</p>
                <div className="flex items-baseline gap-1">
                  <span className="text-white text-3xl font-black">₹499</span>
                </div>
                <p className="text-[#4ADE80] font-black text-lg mt-1">150 Connects</p>
                <p className="text-[#6B7280] text-xs">₹3.33 per connect — save 33%</p>
              </div>
              <p className="text-[#94A3B8] text-sm mb-6 flex-1">For power freelancers who apply to many projects.</p>
              <ConnectsBuyButton plan="connects_150" label="Buy 150 Connects" isLoggedIn={!!user} />
            </div>
          </div>
        </div>

        {/* FAQ */}
        <div className="max-w-2xl mx-auto">
          <h2 className="text-white font-black text-2xl text-center mb-8">
            Frequently Asked Questions
          </h2>
          <PricingFAQ />
        </div>
      </div>
    </div>
  )
}
