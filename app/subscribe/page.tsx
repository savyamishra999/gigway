import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { Check, Zap, Building2 } from "lucide-react"
import RazorpayButton from "@/components/payment/RazorpayButton"

const PLANS = [
  {
    name: "Pro",
    price: "₹199",
    period: "/month",
    type: "pro",
    icon: Zap,
    iconColor: "text-[#FFD700]",
    iconBg: "bg-[#FFD700]/15",
    borderColor: "border-[#FFD700]/50",
    highlight: true,
    description: "For serious freelancers",
    features: [
      "Unlimited connects",
      "Featured in search results",
      "Priority support",
      "Verified badge",
      "Profile analytics",
      "Advanced filters",
    ],
  },
  {
    name: "Business",
    price: "₹999",
    period: "/month",
    type: "business",
    icon: Building2,
    iconColor: "text-purple-400",
    iconBg: "bg-purple-500/15",
    borderColor: "border-purple-500/40",
    highlight: false,
    description: "For agencies & power users",
    features: [
      "Everything in Pro",
      "Post job listings",
      "Team accounts (up to 5)",
      "Bulk proposal tools",
      "API access",
      "Dedicated account manager",
    ],
  },
]

export default async function SubscribePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect("/login")

  const { data: profile } = await supabase
    .from("profiles")
    .select("subscription_tier, full_name")
    .eq("id", user.id)
    .single()

  const currentTier = profile?.subscription_tier || "free"

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0A0A0A] to-[#1a1a1a] py-16">
      <div className="container mx-auto px-4 max-w-4xl">
        {/* Header */}
        <div className="text-center mb-14">
          <p className="text-[#FFD700] text-sm font-semibold uppercase tracking-widest mb-3">Upgrade</p>
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
            Choose Your <span className="text-[#FFD700]">Plan</span>
          </h1>
          <p className="text-gray-400 max-w-xl mx-auto">
            Unlock the full power of GigWAY. Unlimited connects, premium features, and priority support.
          </p>
          {currentTier !== "free" && (
            <p className="mt-4 text-green-400 text-sm font-medium">
              Current plan: <span className="capitalize font-bold">{currentTier}</span>
            </p>
          )}
        </div>

        {/* Plans */}
        <div className="grid md:grid-cols-2 gap-6 max-w-3xl mx-auto">
          {PLANS.map(plan => {
            const Icon = plan.icon
            const isActive = currentTier === plan.type

            return (
              <div
                key={plan.name}
                className={`relative bg-white/5 border rounded-2xl p-8 ${plan.borderColor} ${
                  plan.highlight ? "shadow-lg shadow-[#FFD700]/10" : ""
                }`}
              >
                {plan.highlight && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <span className="bg-[#FFD700] text-black text-xs font-bold px-4 py-1 rounded-full">
                      MOST POPULAR
                    </span>
                  </div>
                )}

                <div className={`w-12 h-12 rounded-xl ${plan.iconBg} flex items-center justify-center mb-5`}>
                  <Icon className={`h-6 w-6 ${plan.iconColor}`} />
                </div>

                <h2 className="text-white text-2xl font-bold mb-1">{plan.name}</h2>
                <p className="text-gray-400 text-sm mb-5">{plan.description}</p>

                <div className="flex items-baseline gap-1 mb-6">
                  <span className="text-4xl font-extrabold text-white">{plan.price}</span>
                  <span className="text-gray-400">{plan.period}</span>
                </div>

                <ul className="space-y-3 mb-8">
                  {plan.features.map(feature => (
                    <li key={feature} className="flex items-center gap-3 text-sm text-gray-300">
                      <Check className="h-4 w-4 text-[#FFD700] flex-shrink-0" />
                      {feature}
                    </li>
                  ))}
                </ul>

                {isActive ? (
                  <div className="w-full py-3 rounded-xl bg-white/5 border border-white/10 text-center text-gray-400 text-sm font-medium">
                    Current Plan
                  </div>
                ) : (
                  <RazorpayButton
                    planType={plan.type}
                    label={`Get ${plan.name} →`}
                    className={`w-full py-5 font-bold text-base rounded-xl ${
                      plan.highlight
                        ? "bg-[#FFD700] hover:bg-[#FFD700]/90 text-black shadow-lg shadow-[#FFD700]/20"
                        : "bg-purple-600 hover:bg-purple-600/90 text-white"
                    }`}
                  />
                )}
              </div>
            )
          })}
        </div>

        {/* FAQ */}
        <div className="mt-16 max-w-2xl mx-auto">
          <h2 className="text-white text-2xl font-bold text-center mb-8">Frequently Asked Questions</h2>
          <div className="space-y-4">
            {[
              {
                q: "Can I cancel anytime?",
                a: "Yes, you can cancel your subscription at any time. Your plan stays active until the end of the billing period.",
              },
              {
                q: "What payment methods are accepted?",
                a: "We accept all major credit/debit cards, UPI, net banking, and wallets via Razorpay.",
              },
              {
                q: "What happens to my connects on upgrade?",
                a: "Your existing connects balance is preserved. Pro and Business plans include unlimited connects.",
              },
              {
                q: "Is there a free trial?",
                a: "Every account starts with 10 free connects on the Free plan. No credit card required.",
              },
            ].map(item => (
              <div
                key={item.q}
                className="bg-white/5 border border-white/10 rounded-xl p-5"
              >
                <p className="text-white font-medium mb-2">{item.q}</p>
                <p className="text-gray-400 text-sm">{item.a}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
