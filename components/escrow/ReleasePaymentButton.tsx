"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"

interface ReleasePaymentButtonProps {
  projectId: string
  amount: number
  freelancerName: string
}

export default function ReleasePaymentButton({ projectId, amount, freelancerName }: ReleasePaymentButtonProps) {
  const [loading, setLoading] = useState(false)
  const [confirm, setConfirm] = useState(false)
  const [error, setError] = useState("")
  const router = useRouter()

  const handleRelease = async () => {
    setLoading(true)
    setError("")
    try {
      const res = await fetch("/api/escrow/release", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "release", projectId }),
      })
      const text = await res.text()
      const data = text ? JSON.parse(text) : {}
      if (data.success) {
        router.refresh()
      } else {
        setError(data.error || "Failed to release payment")
      }
    } catch {
      setError("Network error. Please try again.")
    }
    setLoading(false)
    setConfirm(false)
  }

  if (confirm) {
    return (
      <div className="bg-[#12121A] border border-[#4F46E5]/40 rounded-2xl p-5">
        <p className="text-white font-semibold mb-1">Confirm Payment Release</p>
        <p className="text-[#9CA3AF] text-sm mb-4">
          Release ₹{amount.toLocaleString()} to {freelancerName}? This cannot be undone.
        </p>
        {error && <p className="text-red-400 text-sm mb-3">{error}</p>}
        <div className="flex gap-3">
          <button
            onClick={handleRelease}
            disabled={loading}
            className="flex-1 py-2.5 rounded-xl bg-[#10B981] text-white font-bold text-sm hover:bg-[#059669] transition-colors disabled:opacity-50"
          >
            {loading ? "Releasing..." : "Yes, Release Payment"}
          </button>
          <button
            onClick={() => setConfirm(false)}
            disabled={loading}
            className="flex-1 py-2.5 rounded-xl border border-[#1E1E2E] text-[#6B7280] font-medium text-sm hover:text-white transition-colors"
          >
            Cancel
          </button>
        </div>
      </div>
    )
  }

  return (
    <div>
      {error && <p className="text-red-400 text-sm mb-2">{error}</p>}
      <button
        onClick={() => setConfirm(true)}
        className="w-full py-3.5 rounded-xl bg-[#10B981] text-white font-bold text-sm hover:bg-[#059669] transition-colors"
      >
        Release Payment to Freelancer
      </button>
    </div>
  )
}
