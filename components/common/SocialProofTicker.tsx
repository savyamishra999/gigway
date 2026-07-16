"use client"

import { useEffect, useState } from "react"

const WINS = [
  "🎉 Arjun from Pune got hired as React Developer — ₹45,000/mo",
  "⚡ Priya from Delhi landed her first freelance client — ₹12,000 project",
  "🚀 Rahul upgraded and got 3 proposals in 2 days",
  "💼 Sneha got shortlisted in 4 jobs after upgrading",
  "🏆 Vikram from Bengaluru earned ₹28,000 from one gig",
  "✅ Meera got verified and her profile views went 4×",
  "🎯 Karan from Mumbai hired a designer through GigWay",
  "💰 Ananya closed a ₹50,000 project — zero commission",
  "🔥 Ravi upgraded 2 days ago — already got 2 interview calls",
  "⭐ Divya from Hyderabad: 'Got hired in 3 days of upgrading!'",
  "🚀 Aditya posted a job, got 12 proposals in 24 hours",
  "💼 Neha from Chennai landed a remote job — ₹35,000/mo",
]

export default function SocialProofTicker() {
  const [offset, setOffset] = useState(0)

  useEffect(() => {
    const id = setInterval(() => {
      setOffset(p => p + 1)
    }, 3000)
    return () => clearInterval(id)
  }, [])

  const visible = [
    WINS[offset % WINS.length],
    WINS[(offset + 1) % WINS.length],
    WINS[(offset + 2) % WINS.length],
  ]

  return (
    <div className="overflow-hidden bg-[#12121A] border border-[#1E1E2E] rounded-2xl px-5 py-3">
      <div className="flex items-center gap-3">
        <span className="w-2 h-2 rounded-full bg-[#4ADE80] animate-pulse flex-shrink-0" />
        <p className="text-xs text-[#4ADE80] font-bold flex-shrink-0">LIVE</p>
        <div className="flex-1 overflow-hidden">
          <p
            key={offset}
            className="text-[#94A3B8] text-xs truncate animate-in fade-in duration-500"
          >
            {visible[0]}
          </p>
        </div>
      </div>
    </div>
  )
}
