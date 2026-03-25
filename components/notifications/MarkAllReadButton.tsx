"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { CheckCheck } from "lucide-react"

export default function MarkAllReadButton() {
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const handleMarkAll = async () => {
    setLoading(true)
    await fetch("/api/notifications", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ all: true }),
    })
    setLoading(false)
    router.refresh()
  }

  return (
    <Button
      size="sm"
      variant="outline"
      onClick={handleMarkAll}
      disabled={loading}
      className="border-white/20 text-gray-300 hover:bg-white/10 gap-2"
    >
      <CheckCheck className="h-4 w-4" />
      {loading ? "Marking..." : "Mark all read"}
    </Button>
  )
}
