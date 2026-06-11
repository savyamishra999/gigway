"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Rocket, Zap, Crown, CheckCircle2, TrendingUp, Clock } from "lucide-react"

declare global {
  interface Window {
    Razorpay: new (options: Record<string, unknown>) => {
      open: () => void
      on: (event: string, handler: (response: Record<string, string>) => void) => void
    }
  }
}

interface BoostProfileCardProps {
  isAlreadyBoosted: boolean
  boostPlan?: string | null
  boostExpiresAt?: string | null
  boostedCount: number
}

const PLANS = [
  {
    id: "boost_basic",
    label: "Basic",
    price: 99,
    icon: Zap,
    color: "from-[#6366F1] to-[#8B5CF6]",
    borderColor: "border-[#6366F1]/30",
    hoverBorder: "hover:border-[#6366F1]/60",
    badgeColor: "bg-[#6366F1]/10 text-[#818CF8]",
    perks: ["Top search results", "⭐ Featured badge", "30-day boost"],
    popular: false,
  },
  {
    id: "boost_standard",
    label: "Standard",
    price: 199,
    icon: Rocket,
    color: "from-[#F97316] to-[#FFD700]",
    borderColor: "border-[#F97316]/40",
    hoverBorder: "hover:border-[#F97316]/70",
    badgeColor: "bg-[#F97316]/10 text-[#F97316]",
    perks: ["Everything in Basic", "Priority badge 🔥", "3x more profile views", "30-day boost"],
    popular: true,
  },
  {
    id: "boost_premium",
    label: "Premium",
    price: 299,
    icon: Crown,
    color: "from-[#FFD700] to-[#F59E0B]",
    borderColor: "border-[#FFD700]/30",
    hoverBorder: "hover:border-[#FFD700]/60",
    badgeColor: "bg-[#FFD700]/10 text-[#FFD700]",
    perks: ["Everything in Standard", "First position on page", "WhatsApp support", "30-day boost"],
    popular: false,
  },
]

function loadRazorpayScript(): Promise<boolean> {
  return new Promise(resolve => {
    if (document.getElementById("razorpay-script")) { resolve(true); return }
    const script = document.createElement("script")
    script.id = "razorpay-script"
    script.src = "https://checkout.razorpay.com/v1/checkout.js"
    script.onload = () => resolve(true)
    script.onerror = () => resolve(false)
    document.body.appendChild(script)
  })
}

export default function BoostProfileCard({
  isAlreadyBoosted,
  boostPlan,
  boostExpiresAt,
  boostedCount,
}: BoostProfileCardProps) {
  const [loadingPlan, setLoadingPlan] = useState<string | null>(null)
  const [error, setError] = useState("")
  const router = useRouter()

  const daysLeft = boostExpiresAt
    ? Math.max(0, Math.ceil((new Date(boostExpiresAt).getTime() - Date.now()) / (1000 * 60 * 60 * 24)))
    : 0

  const currentPlanLabel = PLANS.find(p => p.id === boostPlan)?.label ?? boostPlan

  const handleBoost = async (planId: string) => {
    setLoadingPlan(planId)
    setError("")

    const loaded = await loadRazorpayScript()
    if (!loaded) {
      setError("Payment gateway failed to load. Try again.")
      setLoadingPlan(null)
      return
    }

    let orderData: Record<string, unknown> = {}
    try {
      const res = await fetch("/api/payment/create-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: planId }),
      })
      const text = await res.text()
      orderData = text ? JSON.parse(text) : {}
      if (!res.ok) {
        setError((orderData.error as string) || "Failed to create order")
        setLoadingPlan(null)
        return
      }
    } catch {
      setError("Network error. Please try again.")
      setLoadingPlan(null)
      return
    }

    const rzp = new window.Razorpay({
      key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
      amount: orderData.amount,
      currency: orderData.currency,
      name: "GigWay",
      image: "https://gigway.in/logo.png",
      description: `GigWay — Profile Boost ${planId.replace("boost_", "").replace(/^\w/, (c: string) => c.toUpperCase())} · 30 days`,
      order_id: orderData.order_id,
      theme: { color: "#F97316" },
      handler: async (response: { razorpay_payment_id: string; razorpay_order_id: string; razorpay_signature: string }) => {
        try {
          const verifyRes = await fetch("/api/payment/verify", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_order_id: response.razorpay_order_id,
              razorpay_signature: response.razorpay_signature,
              plan_type: planId,
            }),
          })
          const verifyData = await verifyRes.json()
          if (verifyData.success) {
            router.push("/dashboard?boost=success")
            router.refresh()
          } else {
            setError("Payment verified but activation failed. Contact support.")
          }
        } catch {
          setError("Verification error. Contact support with your payment ID.")
        }
        setLoadingPlan(null)
      },
      modal: { ondismiss: () => setLoadingPlan(null) },
    })
    rzp.on("payment.failed", () => {
      setError("Payment failed. Please try again.")
      setLoadingPlan(null)
    })
    rzp.open()
  }

  if (isAlreadyBoosted && daysLeft > 0) {
    return (
      <div className="bg-gradient-to-r from-[#F97316]/10 to-[#FFD700]/5 border border-[#F97316]/30 rounded-xl p-5">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-10 h-10 rounded-full bg-[#F97316]/20 flex items-center justify-center">
            <Rocket className="h-5 w-5 text-[#F97316]" />
          </div>
          <div>
            <p className="text-white font-bold">Profile Boosted ⭐</p>
            <p className="text-[#F97316] text-sm font-medium">{currentPlanLabel} Plan</p>
          </div>
        </div>
        <div className="flex items-center gap-2 text-sm text-[#94A3B8]">
          <Clock className="h-4 w-4 text-[#F97316]" />
          <span>{daysLeft} day{daysLeft !== 1 ? "s" : ""} remaining — your profile appears at the top of search results</span>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-[#1E293B] border border-[#334155] rounded-xl p-5">
      {/* Header */}
      <div className="flex items-start justify-between mb-1">
        <div className="flex items-center gap-2">
          <TrendingUp className="h-5 w-5 text-[#F97316]" />
          <h2 className="text-white font-bold text-lg">Boost Your Profile</h2>
        </div>
        <span className="text-xs text-[#6B7280] bg-[#0F172A] border border-[#334155] px-2 py-1 rounded-full">
          {boostedCount > 0 ? `${boostedCount} active` : "New"} · Scarcity: max 3/page
        </span>
      </div>
      <p className="text-[#94A3B8] text-sm mb-1">Appear at the top of search results · Get 3x more client views</p>
      <div className="flex items-center gap-2 mb-5">
        <span className="text-[#4ADE80] text-xs font-semibold">✓ {boostedCount} freelancers currently boosted</span>
        <span className="text-[#6B7280] text-xs">·</span>
        <span className="text-[#94A3B8] text-xs">Boosted profiles get 3x more views</span>
      </div>

      {error && (
        <p className="text-red-400 text-sm mb-3 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">{error}</p>
      )}

      {/* Plan cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {PLANS.map(plan => {
          const Icon = plan.icon
          const isLoading = loadingPlan === plan.id
          return (
            <div
              key={plan.id}
              className={`relative bg-[#0F172A] border ${plan.borderColor} ${plan.hoverBorder} rounded-xl p-4 transition-all flex flex-col`}
            >
              {plan.popular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 whitespace-nowrap">
                  <span className="bg-gradient-to-r from-[#F97316] to-[#FFD700] text-black text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-wider">
                    Most Popular
                  </span>
                </div>
              )}

              <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${plan.color} flex items-center justify-center mb-3 ${plan.popular ? "mt-2" : ""}`}>
                <Icon className="h-4 w-4 text-white" />
              </div>

              <p className="text-white font-bold text-sm mb-0.5">{plan.label}</p>
              <p className="text-2xl font-black text-white mb-0.5">
                ₹{plan.price}
                <span className="text-xs font-normal text-[#6B7280]">/mo</span>
              </p>

              <ul className="space-y-1 mb-4 flex-1">
                {plan.perks.map(perk => (
                  <li key={perk} className="flex items-start gap-1.5 text-xs text-[#94A3B8]">
                    <CheckCircle2 className="h-3 w-3 text-[#4ADE80] mt-0.5 flex-shrink-0" />
                    {perk}
                  </li>
                ))}
              </ul>

              <button
                onClick={() => handleBoost(plan.id)}
                disabled={!!loadingPlan}
                className={`w-full py-2 rounded-lg text-sm font-bold transition-all ${
                  plan.popular
                    ? "bg-gradient-to-r from-[#F97316] to-[#FFD700] text-black hover:opacity-90"
                    : `${plan.badgeColor} border ${plan.borderColor} hover:opacity-90`
                } disabled:opacity-50 disabled:cursor-not-allowed`}
              >
                {isLoading ? "Processing…" : "Choose Plan"}
              </button>
            </div>
          )
        })}
      </div>
    </div>
  )
}
