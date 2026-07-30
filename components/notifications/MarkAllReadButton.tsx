"use client"

import { useEffect } from "react"

export default function AutoMarkRead() {
  useEffect(() => {
    fetch("/api/notifications", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ all: true }),
    }).catch(() => null)
  }, [])

  return null
}
