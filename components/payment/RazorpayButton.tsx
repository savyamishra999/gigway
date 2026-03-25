"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"

declare global {
  interface Window {
    Razorpay: new (options: Record<string, unknown>) => {
      open: () => void
      on: (event: string, handler: (response: Record<string, string>) => void) => void
    }
  }
}

interface RazorpayButtonProps {
  planType: string
  label: string
  className?: string
}

function loadRazorpayScript(): Promise<boolean> {
  return new Promise(resolve => {
    if (document.getElementById("razorpay-script")) {
      resolve(true)
      return
    }
    const script = document.createElement("script")
    script.id = "razorpay-script"
    script.src = "https://checkout.razorpay.com/v1/checkout.js"
    script.onload = () => resolve(true)
    script.onerror = () => resolve(false)
    document.body.appendChild(script)
  })
}

export default function RazorpayButton({ planType, label, className }: RazorpayButtonProps) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const router = useRouter()

  const handlePayment = async () => {
    setLoading(true)
    setError("")

    const scriptLoaded = await loadRazorpayScript()
    if (!scriptLoaded) {
      setError("Failed to load payment gateway. Please try again.")
      setLoading(false)
      return
    }

    // Create order
    let orderRes: Response
    let orderData: Record<string, unknown>
    try {
      orderRes = await fetch("/api/payment/create-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: planType }),
      })
      const text = await orderRes.text()
      orderData = text ? JSON.parse(text) : {}
    } catch (err) {
      setError("Network error creating order. Please try again.")
      setLoading(false)
      return
    }

    if (!orderRes.ok) {
      setError((orderData.error as string) || `Order failed (${orderRes.status})`)
      setLoading(false)
      return
    }

    const options = {
      key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
      amount: orderData.amount,
      currency: orderData.currency,
      name: "GigWAY",
      description: `GigWAY ${planType} Plan`,
      order_id: orderData.order_id,
      theme: { color: "#FFD700" },
      handler: async (response: {
        razorpay_payment_id: string
        razorpay_order_id: string
        razorpay_signature: string
      }) => {
        let verifyData: Record<string, unknown> = {}
        try {
          const verifyRes = await fetch("/api/payment/verify", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_order_id: response.razorpay_order_id,
              razorpay_signature: response.razorpay_signature,
              plan_type: planType,
            }),
          })
          const text = await verifyRes.text()
          verifyData = text ? JSON.parse(text) : {}
        } catch {
          setError("Payment made but verification failed. Contact support with your payment ID.")
          setLoading(false)
          return
        }

        if (verifyData.success) {
          router.push("/dashboard?payment=success")
          router.refresh()
        } else {
          setError("Payment verification failed. Contact support.")
        }
        setLoading(false)
      },
      modal: {
        ondismiss: () => setLoading(false),
      },
    }

    const rzp = new window.Razorpay(options)
    rzp.on("payment.failed", () => {
      setError("Payment failed. Please try again.")
      setLoading(false)
    })
    rzp.open()
  }

  return (
    <div>
      {error && (
        <p className="text-red-400 text-sm mb-2 text-center">{error}</p>
      )}
      <Button
        onClick={handlePayment}
        disabled={loading}
        className={className}
      >
        {loading ? "Processing..." : label}
      </Button>
    </div>
  )
}
