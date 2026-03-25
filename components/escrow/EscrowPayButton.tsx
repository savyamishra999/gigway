"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"


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

interface EscrowPayButtonProps {
  proposalId: string
  projectId: string
  bidAmount: number
  freelancerName: string
}

export default function EscrowPayButton({ proposalId, projectId, bidAmount, freelancerName }: EscrowPayButtonProps) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const router = useRouter()

  const handleEscrowPayment = async () => {
    setLoading(true)
    setError("")

    const scriptLoaded = await loadRazorpayScript()
    if (!scriptLoaded) {
      setError("Failed to load payment gateway.")
      setLoading(false)
      return
    }

    let orderData: Record<string, unknown> = {}
    try {
      const res = await fetch("/api/escrow/hold", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ proposalId, projectId }),
      })
      const text = await res.text()
      orderData = text ? JSON.parse(text) : {}
      if (!res.ok) {
        setError((orderData.error as string) || "Failed to create escrow order")
        setLoading(false)
        return
      }
    } catch {
      setError("Network error. Please try again.")
      setLoading(false)
      return
    }

    const options = {
      key: orderData.key_id,
      amount: orderData.amount,
      currency: orderData.currency,
      name: "GigWay Escrow",
      description: `Pay ₹${bidAmount.toLocaleString()} to ${freelancerName} (held in escrow)`,
      order_id: orderData.order_id,
      theme: { color: "#4F46E5" },
      handler: async (response: { razorpay_payment_id: string; razorpay_order_id: string; razorpay_signature: string }) => {
        try {
          const verifyRes = await fetch("/api/escrow/release", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              action: "hold",
              projectId,
              proposalId,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_order_id: response.razorpay_order_id,
              razorpay_signature: response.razorpay_signature,
            }),
          })
          const text = await verifyRes.text()
          const data = text ? JSON.parse(text) : {}
          if (data.success) {
            router.push(`/projects/${projectId}?escrow=success`)
            router.refresh()
          } else {
            setError("Payment made but escrow setup failed. Contact support.")
          }
        } catch {
          setError("Verification error. Contact support with your payment ID.")
        }
        setLoading(false)
      },
      modal: { ondismiss: () => setLoading(false) },
    }

    const rzp = new window.Razorpay(options)
    rzp.on("payment.failed", () => {
      setError("Payment failed. Please try again.")
      setLoading(false)
    })
    rzp.open()
  }

  return (
    <div className="mt-4">
      {error && <p className="text-red-400 text-sm mb-3">{error}</p>}
      <button
        onClick={handleEscrowPayment}
        disabled={loading}
        className="w-full py-3.5 rounded-xl bg-gradient-to-r from-[#4F46E5] to-[#6366F1] text-white font-bold text-sm shadow-lg shadow-[#4F46E5]/20 hover:opacity-90 transition-opacity disabled:opacity-50"
      >
        {loading ? "Processing Payment..." : `Pay ₹${bidAmount.toLocaleString()} into Escrow`}
      </button>
      <p className="text-[#6B7280] text-xs text-center mt-2">
        Funds held securely. Released when you mark project complete.
      </p>
    </div>
  )
}
