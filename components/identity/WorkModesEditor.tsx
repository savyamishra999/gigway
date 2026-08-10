"use client"

import { useState } from "react"
import { WORK_MODES, type WorkMode } from "@/lib/identity"
import { Button } from "@/components/ui/button"

export default function WorkModesEditor({ initialModes = [] }: { initialModes?: string[] }) {
  const [modes, setModes] = useState<WorkMode[]>(() => initialModes.filter((intent): intent is WorkMode => WORK_MODES.some(mode => mode.value === intent))); const [saving, setSaving] = useState(false); const [message, setMessage] = useState("")
  const save = async () => { setSaving(true); setMessage(""); const response = await fetch("/api/identity/complete", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ modes }) }); const result = await response.json().catch(() => ({})); setSaving(false); setMessage(response.ok ? "Work Modes saved." : result.error || "Work Modes could not be saved.") }
  return <section className="bg-[#1E293B] border border-[#334155] rounded-xl p-5 space-y-3"><div><h2 className="text-[#F8FAFC] font-semibold">What are you open to?</h2><p className="text-[#94A3B8] text-xs mt-1">These are preferences, not permanent roles.</p></div><div className="flex flex-wrap gap-2">{WORK_MODES.map(mode => <button type="button" key={mode.value} onClick={() => setModes(p => p.includes(mode.value) ? p.filter(x => x !== mode.value) : [...p, mode.value])} className={`px-3 py-2 rounded-lg text-xs border ${modes.includes(mode.value) ? "bg-[#6366F1]/20 border-[#6366F1] text-white" : "border-[#475569] text-[#CBD5E1]"}`}>{mode.label}</button>)}</div><div className="flex items-center gap-3"><Button type="button" onClick={save} disabled={saving} className="h-8 text-xs bg-[#334155] hover:bg-[#475569]">{saving ? "Saving…" : "Save Work Modes"}</Button>{message && <span className={`text-xs ${message === "Work Modes saved." ? "text-emerald-400" : "text-red-400"}`}>{message}</span>}</div></section>
}
