"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { WORK_MODES, type WorkMode } from "@/lib/identity"
import { Button } from "@/components/ui/button"

export default function WorkModesEditor({ userId }: { userId: string }) {
  const [modes, setModes] = useState<WorkMode[]>([]); const [saving, setSaving] = useState(false); const [message, setMessage] = useState("")
  const supabase = createClient()
  useEffect(() => { supabase.from("profile_intents").select("intent_type").eq("profile_id", userId).then(({ data }) => setModes((data ?? []).map(x => x.intent_type).filter((intent): intent is WorkMode => WORK_MODES.some(x => x.value === intent)))) }, [userId]) // eslint-disable-line react-hooks/exhaustive-deps
  const save = async () => { setSaving(true); setMessage(""); const { data: existing, error: readError } = await supabase.from("profile_intents").select("intent_type").eq("profile_id", userId); if (readError) { setMessage(readError.message); setSaving(false); return }; const { error: deactivateError } = await supabase.from("profile_intents").update({ is_active: false }).eq("profile_id", userId); if (deactivateError) { setMessage(deactivateError.message); setSaving(false); return }; for (const intent of modes) { const query = (existing ?? []).some(row => row.intent_type === intent) ? supabase.from("profile_intents").update({ is_active: true }).eq("profile_id", userId).eq("intent_type", intent) : supabase.from("profile_intents").insert({ profile_id: userId, intent_type: intent, is_active: true }); const { error } = await query; if (error) { setMessage(error.message); setSaving(false); return } }; setMessage("Work Modes saved."); setSaving(false) }
  return <section className="bg-[#1E293B] border border-[#334155] rounded-xl p-5 space-y-3"><div><h2 className="text-[#F8FAFC] font-semibold">What are you open to?</h2><p className="text-[#94A3B8] text-xs mt-1">These are preferences, not permanent roles.</p></div><div className="flex flex-wrap gap-2">{WORK_MODES.map(mode => <button type="button" key={mode.value} onClick={() => setModes(p => p.includes(mode.value) ? p.filter(x => x !== mode.value) : [...p, mode.value])} className={`px-3 py-2 rounded-lg text-xs border ${modes.includes(mode.value) ? "bg-[#6366F1]/20 border-[#6366F1] text-white" : "border-[#475569] text-[#CBD5E1]"}`}>{mode.label}</button>)}</div><div className="flex items-center gap-3"><Button type="button" onClick={save} disabled={saving} className="h-8 text-xs bg-[#334155] hover:bg-[#475569]">{saving ? "Saving…" : "Save Work Modes"}</Button>{message && <span className={`text-xs ${message === "Work Modes saved." ? "text-emerald-400" : "text-red-400"}`}>{message}</span>}</div></section>
}
