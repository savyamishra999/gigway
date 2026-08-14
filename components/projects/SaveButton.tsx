"use client"

import { useEffect, useState } from "react"
import { Bookmark } from "lucide-react"
import { createClient } from "@/lib/supabase/client"

export default function SaveButton({ projectId, userId }: { projectId: string; userId: string }) {
  const [saved, setSaved] = useState(false)
  const [savedItemId, setSavedItemId] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [checked, setChecked] = useState(false)
  const supabase = createClient()

  useEffect(() => {
    let active = true
    supabase
      .from("saved_items")
      .select("id")
      .eq("user_id", userId)
      .eq("item_type", "project")
      .eq("item_id", projectId)
      .maybeSingle()
      .then(({ data }) => {
        if (!active) return
        setSaved(!!data)
        setSavedItemId(data?.id ?? null)
        setChecked(true)
      })
    return () => { active = false }
  }, [projectId, userId]) // eslint-disable-line react-hooks/exhaustive-deps

  const toggle = async () => {
    setLoading(true)
    if (saved && savedItemId) {
      const response = await fetch("/api/saved-items", { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id: savedItemId }) })
      if (response.ok) { setSaved(false); setSavedItemId(null) }
    } else {
      const response = await fetch("/api/saved-items", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ item_type: "project", item_id: projectId }) })
      const data = await response.json().catch(() => ({}))
      if (response.ok && data.id) { setSaved(true); setSavedItemId(data.id) }
    }
    setLoading(false)
  }

  return (
    <button
      type="button"
      onClick={toggle}
      disabled={loading || !checked}
      aria-pressed={saved}
      className={`flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border text-sm font-semibold transition-colors disabled:opacity-60 ${
        saved
          ? "bg-brand-indigo/10 border-brand-indigo/30 text-brand-indigo"
          : "bg-white border-brand-borderLight text-brand-slate hover:border-brand-indigo/30 hover:text-brand-midnight"
      }`}
    >
      <Bookmark className={`h-4 w-4 ${saved ? "fill-brand-indigo" : ""}`} />
      {saved ? "Saved" : "Save"}
    </button>
  )
}
