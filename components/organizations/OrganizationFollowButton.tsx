"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"

export default function OrganizationFollowButton({ organizationId, initialFollowing }: { organizationId: string; initialFollowing: boolean }) {
  const router = useRouter()
  const [following, setFollowing] = useState(initialFollowing)
  const [busy, setBusy] = useState(false)
  const toggle = async () => {
    if (busy) return
    setBusy(true)
    const before = following
    setFollowing(!before)
    try {
      const response = await fetch(`/api/social/follow/organization/${organizationId}`, { method: before ? "DELETE" : "POST" })
      if (!response.ok) throw new Error("Follow request failed")
      router.refresh()
    } catch { setFollowing(before) } finally { setBusy(false) }
  }
  return <button type="button" disabled={busy} onClick={toggle} className={`rounded-xl px-4 py-2 text-sm font-bold transition disabled:opacity-60 ${following ? "border border-brand-borderLight bg-white text-brand-midnight hover:bg-brand-ivory" : "bg-brand-indigo text-white hover:bg-brand-indigoDark"}`}>{following ? "Following" : "Follow"}</button>
}
