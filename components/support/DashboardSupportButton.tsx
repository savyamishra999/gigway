"use client"

import { useState } from "react"
import { MessageCircle } from "lucide-react"
import SupportModal from "./SupportModal"

export default function DashboardSupportButton() {
  const [open, setOpen] = useState(false)
  return (
    <>
      <SupportModal open={open} onClose={() => setOpen(false)} />
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-2 px-4 py-3 bg-[#7C3AED]/10 hover:bg-[#7C3AED]/20 border border-[#7C3AED]/30 hover:border-[#7C3AED]/50 text-[#A78BFA] font-semibold text-sm rounded-xl transition-colors w-full justify-center"
      >
        <MessageCircle className="h-4 w-4" />
        💬 Message GigWay Support
      </button>
    </>
  )
}
