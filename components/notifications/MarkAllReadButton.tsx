"use client"

import { useState } from "react"

export default function AutoMarkRead() {
  const [done, setDone] = useState(false)
  const markAll = () => {
    fetch("/api/notifications", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ all: true }),
    }).then(() => setDone(true)).catch(() => null)
  }

  return <button onClick={markAll} disabled={done} className="rounded-xl border border-brand-borderLight bg-white px-4 py-2 text-body-sm font-bold text-brand-indigo hover:border-brand-indigo disabled:opacity-60">{done ? "All read" : "Mark all as read"}</button>
}
