"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { ShieldCheck, CheckCircle2, Clock, BadgeCheck } from "lucide-react"

declare global {
  interface Window {
    Razorpay: new (options: Record<string, unknown>) => {
      open: () => void
      on: (event: string, handler: (response: Record<string, string>) => void) => void
    }
  }
}

interface VerifiedBadgeCardProps {
  verificationStatus: string | null
  isVerified: boolean | null
}

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

export default function VerifiedBadgeCard({ verificationStatus, isVerified }: VerifiedBadgeCardProps) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const router = useRouter()

  // Already verified — show status chip only, no card
  if (isVerified || verificationStatus === "verified") {
    return (
      <div className="flex items-center gap-2 bg-[#4F46E5]/10 border border-[#4F46E5]/30 rounded-xl px-4 py-3">
        <BadgeCheck className="h-5 w-5 text-[#818CF8]" />
        <span className="text-[#818CF8] font-semibold text-sm">Verified Freelancer ✅ — Badge active on your profile</span>
      </div>
    )
  }

  // Pending review
  if (verificationStatus === "pending") {
    return (
      <div className="bg-[#1E293B] border border-[#334155] rounded-xl p-5">
        <div className="flex items-center gap-3 mb-2">
          <Clock className="h-5 w-5 text-yellow-400" />
          <p className="text-white font-bold">Verification Pending ⏳</p>
        </div>
        <p className="text-[#94A3B8] text-sm">
          We&apos;re reviewing your documents. You&apos;ll get a WhatsApp message within 24 hours once approved.
        </p>
      </div>
    )
  }

  const handlePay = async () => {
    setLoading(true)
    setError("")

    const loaded = await loadRazorpayScript()
    if (!loaded) {
      setError("Payment gateway failed. Try again.")
      setLoading(false)
      return
    }

    let orderData: Record<string, unknown> = {}
    try {
      const res = await fetch("/api/payment/create-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "verified_badge" }),
      })
      const text = await res.text()
      orderData = text ? JSON.parse(text) : {}
      if (!res.ok) {
        setError((orderData.error as string) || "Failed to create order")
        setLoading(false)
        return
      }
    } catch {
      setError("Network error. Please try again.")
      setLoading(false)
      return
    }

    const rzp = new window.Razorpay({
      key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
      amount: orderData.amount,
      currency: orderData.currency,
      name: "GigWay",
      image: "https://gigway.in/icon.png",
      description: "GigWay — Verified Badge · One-time · Permanent",
      order_id: orderData.order_id,
      theme: { color: "#4F46E5" },
      handler: async (response: { razorpay_payment_id: string; razorpay_order_id: string; razorpay_signature: string }) => {
        try {
          const verifyRes = await fetch("/api/payment/verify", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_order_id: response.razorpay_order_id,
              razorpay_signature: response.razorpay_signature,
              plan_type: "verified_badge",
            }),
          })
          const data = await verifyRes.json()
          if (data.success) {
            router.push("/verify-me")
          } else {
            setError("Payment verified but setup failed. Contact support.")
          }
        } catch {
          setError("Verification error. Contact support with your payment ID.")
        }
        setLoading(false)
      },
      modal: { ondismiss: () => setLoading(false) },
    })
    rzp.on("payment.failed", () => {
      setError("Payment failed. Please try again.")
      setLoading(false)
    })
    rzp.open()
  }

  return (
    <div className="bg-[#1E293B] border border-[#334155] rounded-xl p-5">
      <div className="flex items-center gap-3 mb-3">
        <div className="w-10 h-10 rounded-full bg-[#4F46E5]/20 flex items-center justify-center">
          <ShieldCheck className="h-5 w-5 text-[#818CF8]" />
        </div>
        <div>
          <p className="text-white font-bold">Get Verified Badge</p>
          <p className="text-[#6B7280] text-xs">₹299 one-time · Permanent</p>
        </div>
        <span className="ml-auto bg-[#4F46E5]/20 text-[#818CF8] text-xs font-bold px-2.5 py-1 rounded-full border border-[#4F46E5]/30">
          ✅ Blue Badge
        </span>
      </div>

      <ul className="space-y-1.5 mb-4">
        {[
          "Blue ✅ checkmark badge next to your name",
          "Permanent — never expires",
          "Clients trust verified freelancers 5x more",
          "Submit LinkedIn or Aadhaar (last 4 digits)",
          "Approved within 24 hours",
        ].map(perk => (
          <li key={perk} className="flex items-start gap-2 text-xs text-[#94A3B8]">
            <CheckCircle2 className="h-3.5 w-3.5 text-[#4ADE80] mt-0.5 flex-shrink-0" />
            {perk}
          </li>
        ))}
      </ul>

      {error && (
        <p className="text-red-400 text-xs mb-3 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">{error}</p>
      )}

      <button
        onClick={handlePay}
        disabled={loading}
        className="w-full py-2.5 rounded-lg bg-gradient-to-r from-[#4F46E5] to-[#6366F1] text-white font-bold text-sm hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {loading ? "Processing…" : "Pay ₹299 & Get Verified →"}
      </button>
    </div>
  )
}
