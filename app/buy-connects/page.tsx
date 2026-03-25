import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { Zap } from "lucide-react"
import RazorpayButton from "@/components/payment/RazorpayButton"
import Link from "next/link"

const PACKS = [
  {
    type: "connects_10",
    connects: 10,
    price: "₹99",
    priceRaw: 99,
    perConnect: "₹9.9",
    badge: null,
    highlight: false,
  },
  {
    type: "connects_25",
    connects: 25,
    price: "₹199",
    priceRaw: 199,
    perConnect: "₹7.96",
    badge: "BEST VALUE",
    highlight: true,
  },
  {
    type: "connects_50",
    connects: 50,
    price: "₹349",
    priceRaw: 349,
    perConnect: "₹6.98",
    badge: "SAVE 30%",
    highlight: false,
  },
]

export default async function BuyConnectsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect("/login")

  const { data: profile } = await supabase
    .from("profiles")
    .select("connects_balance, subscription_tier")
    .eq("id", user.id)
    .single()

  const balance = profile?.connects_balance ?? 0
  const isPro = profile?.subscription_tier === "pro" || profile?.subscription_tier === "business"

  if (isPro) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#0A0A0A] to-[#1a1a1a] flex items-center justify-center">
        <div className="text-center max-w-md">
          <Zap className="h-16 w-16 text-[#FFD700] mx-auto mb-6" />
          <h1 className="text-2xl font-bold text-white mb-3">Unlimited Connects Included</h1>
          <p className="text-gray-400 mb-6">
            Your <span className="text-[#FFD700] capitalize font-semibold">{profile?.subscription_tier}</span> plan includes
            unlimited connects. No need to buy more!
          </p>
          <Link
            href="/dashboard"
            className="bg-[#FFD700] hover:bg-[#FFD700]/90 text-black font-bold px-8 py-3 rounded-xl inline-block"
          >
            Go to Dashboard
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0A0A0A] to-[#1a1a1a] py-16">
      <div className="container mx-auto px-4 max-w-3xl">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 bg-[#FFD700]/10 border border-[#FFD700]/30 text-[#FFD700] text-sm font-semibold px-4 py-2 rounded-full mb-6">
            <Zap className="h-4 w-4" />
            Your balance: {balance} connects
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
            Buy <span className="text-[#FFD700]">Connects</span>
          </h1>
          <p className="text-gray-400 max-w-lg mx-auto">
            Use connects to submit proposals to projects. Each proposal costs 1 connect.
            Get more connects and never miss an opportunity.
          </p>
        </div>

        {/* Packs */}
        <div className="grid md:grid-cols-3 gap-5 mb-12">
          {PACKS.map(pack => (
            <div
              key={pack.type}
              className={`relative bg-white/5 border rounded-2xl p-7 text-center ${
                pack.highlight
                  ? "border-[#FFD700]/50 shadow-lg shadow-[#FFD700]/10"
                  : "border-white/10"
              }`}
            >
              {pack.badge && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <span className="bg-[#FFD700] text-black text-xs font-bold px-3 py-1 rounded-full">
                    {pack.badge}
                  </span>
                </div>
              )}

              <div className="flex items-center justify-center gap-2 mb-4">
                <Zap className={`h-5 w-5 ${pack.highlight ? "text-[#FFD700]" : "text-gray-400"}`} />
                <span className={`text-4xl font-extrabold ${pack.highlight ? "text-[#FFD700]" : "text-white"}`}>
                  {pack.connects}
                </span>
              </div>

              <p className="text-gray-400 text-sm mb-2">connects</p>
              <p className="text-xs text-gray-600 mb-6">{pack.perConnect} per connect</p>

              <p className="text-3xl font-bold text-white mb-6">{pack.price}</p>

              <RazorpayButton
                planType={pack.type}
                label={`Buy ${pack.connects} Connects`}
                className={`w-full py-4 font-bold rounded-xl ${
                  pack.highlight
                    ? "bg-[#FFD700] hover:bg-[#FFD700]/90 text-black"
                    : "bg-white/10 hover:bg-white/20 text-white border border-white/20"
                }`}
              />
            </div>
          ))}
        </div>

        {/* Tip */}
        <div className="bg-white/5 border border-white/10 rounded-xl p-5 text-center">
          <p className="text-gray-400 text-sm">
            Want unlimited connects?{" "}
            <Link href="/subscribe" className="text-[#FFD700] font-semibold hover:underline">
              Upgrade to Pro ₹199/mo →
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
