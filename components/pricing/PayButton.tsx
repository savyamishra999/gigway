"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"

declare global {
  interface Window {
    Razorpay: new (options: Record<string, unknown>) => {
      open: () => void
      on: (event: string, handler: (response: Record<string, string>) => void) => void
    }
  }
}

interface Props {
  plan: string
  label: string
  description?: string
  isLoggedIn: boolean
  redirectTo?: string
  className?: string
  metadata?: Record<string, unknown>
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

export default function PayButton({
  plan,
  label,
  description,
  isLoggedIn,
  redirectTo = "/dashboard",
  className = "",
  metadata,
}: Props) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const router = useRouter()

  const pay = async () => {
    if (!isLoggedIn) {
      router.push(`/login?redirect=/pricing`)
      return
    }
    setLoading(true)
    setError("")

    try {
      await loadScript("https://checkout.razorpay.com/v1/checkout.js")

      const res = await fetch("/api/payment/create-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: plan, metadata }),
      })
      const order = await res.json()
      if (!res.ok) {
        setError(order.error || "Payment setup failed")
        setLoading(false)
        return
      }

      const rzp = new window.Razorpay({
        key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
        amount: order.amount,
        currency: order.currency,
        name: "GigWay",
        description: description || label,
        order_id: order.order_id,
        theme: { color: "#7C3AED" },
        handler: async (resp: { razorpay_payment_id: string; razorpay_order_id: string; razorpay_signature: string }) => {
          try {
            const vRes = await fetch("/api/payment/verify", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ ...resp, plan_type: plan, metadata }),
            })
            const vData = await vRes.json()
            if (vData.success) {
              router.push(redirectTo)
              router.refresh()
            } else {
              setError("Verification failed. Contact support with payment ID: " + resp.razorpay_payment_id)
            }
          } catch {
            setError("Verification error. Contact support.")
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
    } catch {
      setError("Something went wrong. Please try again.")
      setLoading(false)
    }
  }

  return (
    <div className="w-full">
      {error && (
        <p className="text-red-400 text-xs mb-2 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">
          {error}
        </p>
      )}
      <button
        onClick={pay}
        disabled={loading}
        className={`w-full py-2.5 rounded-xl font-bold text-sm transition-opacity hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed ${className}`}
      >
        {loading ? "Processing…" : label}
      </button>
    </div>
  )
}
