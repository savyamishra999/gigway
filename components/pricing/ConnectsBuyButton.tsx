"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"

interface Props {
  plan: string
  label: string
  isLoggedIn: boolean
  highlight?: boolean
}

declare global {
  interface Window {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    Razorpay: new (options: Record<string, unknown>) => {
      open: () => void
      on: (event: string, handler: (response: Record<string, string>) => void) => void
    }
  }
}

function loadScript(src: string) {
  return new Promise<boolean>(resolve => {
    if (document.querySelector(`script[src="${src}"]`)) { resolve(true); return }
    const s = document.createElement("script")
    s.src = src
    s.onload = () => resolve(true)
    s.onerror = () => resolve(false)
    document.body.appendChild(s)
  })
}

export default function ConnectsBuyButton({ plan, label, isLoggedIn, highlight }: Props) {
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const buy = async () => {
    if (!isLoggedIn) { router.push("/login?redirect=/pricing#connects"); return }
    setLoading(true)
    try {
      await loadScript("https://checkout.razorpay.com/v1/checkout.js")

      const res = await fetch("/api/payment/create-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: plan }),
      })
      const order = await res.json()
      if (!res.ok) { alert(order.error || "Payment setup failed"); setLoading(false); return }

      const rzp = new window.Razorpay({
        key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
        amount: order.amount,
        currency: order.currency,
        name: "GigWay",
        image: "https://gigway.in/logo.png",
        description: "GigWay — Zero Commission Freelance Platform",
        order_id: order.order_id,
        handler: async (resp: { razorpay_payment_id: string; razorpay_order_id: string; razorpay_signature: string }) => {
          const vRes = await fetch("/api/payment/verify", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ ...resp, plan_type: plan }),
          })
          if (vRes.ok) {
            router.push("/dashboard?connects=purchased")
          } else {
            alert("Payment verification failed. Contact support.")
          }
        },
        theme: { color: "#4ADE80" },
      })
      rzp.open()
    } catch (e) {
      alert("Something went wrong. Try again.")
      console.error(e)
    }
    setLoading(false)
  }

  return (
    <button
      onClick={buy}
      disabled={loading}
      className={`w-full py-3 rounded-xl font-bold text-sm transition-opacity hover:opacity-90 disabled:opacity-50 ${
        highlight
          ? "bg-gradient-to-r from-[#4ADE80] to-[#22C55E] text-black"
          : "bg-[#1E293B] border border-[#334155] text-white hover:border-[#475569]"
      }`}
    >
      {loading ? "Loading…" : label + " →"}
    </button>
  )
}
