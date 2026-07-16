import { createClient } from "@/lib/supabase/server"
import Link from "next/link"
import { CheckCircle2 } from "lucide-react"

const PLANS = [
  {
    key:      "find_work",
    emoji:    "⚡",
    badge:    "Most Popular",
    label:    "Find Work",
    who:      "Freelancers & Job Seekers",
    price:    "₹49",
    period:   "/month",
    color:    "border-[#4F46E5]/50",
    glow:     "shadow-[0_0_30px_rgba(79,70,229,0.12)]",
    badgeBg:  "bg-[#4F46E5]",
    btnClass: "from-[#4F46E5] to-[#6366F1]",
    perks: [
      "Profile visible in search results",
      "Apply to unlimited jobs & projects",
      "Gig stays listed & active",
      "Instant job & project alerts",
      "Priority application badge",
    ],
    href: "/login",
    cta:  "Get Started →",
  },
  {
    key:      "hire_talent",
    emoji:    "🏢",
    badge:    null,
    label:    "Hire Talent",
    who:      "Companies & Individuals",
    price:    "₹199",
    period:   "/month",
    color:    "border-[#F59E0B]/40",
    glow:     "",
    badgeBg:  "",
    btnClass: "from-[#F59E0B] to-[#F97316]",
    perks: [
      "Post unlimited jobs & projects",
      "Browse full CV database",
      "Direct message any freelancer",
      "Verified Company / Hirer badge",
      "Featured listing boost available",
    ],
    href: "/login",
    cta:  "Start Hiring →",
    btnTextDark: true,
  },
  {
    key:      "verified",
    emoji:    "✅",
    badge:    null,
    label:    "Verified Badge",
    who:      "For Everyone",
    price:    "₹299",
    period:   " one-time",
    color:    "border-[#10B981]/30",
    glow:     "",
    badgeBg:  "",
    btnClass: "from-[#10B981] to-[#059669]",
    perks: [
      "Permanent ✅ verified checkmark",
      "3× more client / employer trust",
      "Priority placement in search",
      "Never expires — pay once",
    ],
    href: "/verify",
    cta:  "Get Verified →",
  },
]

export default async function HomePricing() {
  const supabase = await createClient()

  const { count: boostedCount } = await supabase
    .from("profiles")
    .select("*", { count: "exact", head: true })
    .eq("is_boosted", true)
    .gt("boost_expires_at", new Date().toISOString())

  return (
    <section className="py-24 bg-[#0A0A0F] border-t border-[#1E1E2E]">
      <div className="container mx-auto px-4 max-w-6xl">

        {/* Heading */}
        <div className="text-center mb-14">
          <p className="text-[#818CF8] font-bold text-sm uppercase tracking-widest mb-3">Transparent Pricing</p>
          <h2 className="text-3xl md:text-4xl font-black text-white mb-3">
            Grow faster — whatever your goal
          </h2>
          <p className="text-[#6B7280] max-w-md mx-auto text-sm leading-relaxed">
            Freelancer, job seeker, or employer — one plan unlocks everything you need. Your basic account is always free.
          </p>
        </div>

        {/* Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start">
          {PLANS.map(plan => (
            <div
              key={plan.key}
              className={`relative bg-[#12121A] border-2 rounded-2xl p-7 ${plan.color} ${plan.glow}`}
            >
              {plan.badge && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <span className={`${plan.badgeBg} text-white text-[10px] font-black px-4 py-1 rounded-full uppercase tracking-wider whitespace-nowrap`}>
                    {plan.badge}
                  </span>
                </div>
              )}

              <div className="flex items-start justify-between mb-5">
                <div>
                  <span className="text-3xl">{plan.emoji}</span>
                  <p className="text-white font-black text-xl mt-2">{plan.label}</p>
                  <p className="text-[#6B7280] text-xs mt-0.5">{plan.who}</p>
                </div>
                <div className="text-right">
                  <p className="text-white font-black text-3xl">{plan.price}</p>
                  <p className="text-[#6B7280] text-xs">{plan.period}</p>
                </div>
              </div>

              <ul className="space-y-2.5 mb-7">
                {plan.perks.map(perk => (
                  <li key={perk} className="flex items-start gap-2.5 text-sm text-[#CBD5E1]">
                    <CheckCircle2 className="h-4 w-4 text-[#4ADE80] mt-0.5 flex-shrink-0" />
                    {perk}
                  </li>
                ))}
              </ul>

              <Link
                href={plan.href}
                className={`flex items-center justify-center w-full py-3 rounded-xl bg-gradient-to-r ${plan.btnClass} font-bold text-sm hover:opacity-90 transition-opacity ${plan.btnTextDark ? "text-black" : "text-white"}`}
              >
                {plan.cta}
              </Link>
            </div>
          ))}
        </div>

        {/* Bottom note */}
        <div className="text-center mt-8 space-y-1">
          <p className="text-[#475569] text-xs">
            Basic account is always free. Paid plans unlock visibility &amp; advanced features.
          </p>
          {(boostedCount ?? 0) > 0 && (
            <p className="text-[#6B7280] text-xs">
              ⭐ {boostedCount} professionals currently on a paid plan
            </p>
          )}
        </div>
      </div>
    </section>
  )
}
