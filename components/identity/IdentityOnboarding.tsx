"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { CheckCircle2, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { WORK_MODES, normalizeUsername, usernameError, type WorkMode } from "@/lib/identity"

export default function IdentityOnboarding({ username: initialUsername, fullName, initialModes = [] }: {
  username?: string | null; fullName?: string | null; initialModes?: string[]
}) {
  const router = useRouter()
  const [username, setUsername] = useState(initialUsername ?? "")
  const [modes, setModes] = useState<WorkMode[]>(initialModes.filter((m): m is WorkMode => WORK_MODES.some(x => x.value === m)))
  const [availability, setAvailability] = useState<"idle" | "checking" | "available" | "taken">(initialUsername ? "available" : "idle")
  const [error, setError] = useState("")
  const [saving, setSaving] = useState(false)
  const normalized = normalizeUsername(username)

  useEffect(() => {
    if (initialUsername) return
    const invalid = usernameError(normalized)
    if (!normalized) { setAvailability("idle"); setError(""); return }
    if (invalid) { setAvailability("idle"); setError(invalid); return }
    setAvailability("checking"); setError("")
    const timer = window.setTimeout(async () => {
      const res = await fetch(`/api/identity/username?username=${encodeURIComponent(normalized)}`)
      const data = await res.json().catch(() => ({}))
      if (!res.ok) { setAvailability("idle"); setError(data.error || "Could not check that username."); return }
      setAvailability(data.available ? "available" : "taken")
      if (!data.available) setError("That username is already taken.")
    }, 350)
    return () => window.clearTimeout(timer)
  }, [normalized, initialUsername])

  const submit = async () => {
    if (!initialUsername && (usernameError(normalized) || availability !== "available")) {
      setError(usernameError(normalized) || "Choose an available username."); return
    }
    setSaving(true); setError("")
    const res = await fetch("/api/identity/complete", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ username: initialUsername ? undefined : normalized, modes }) })
    const data = await res.json().catch(() => ({}))
    setSaving(false)
    if (!res.ok) { setError(data.error || "Could not save your identity."); return }
    router.push("/dashboard"); router.refresh()
  }

  return <div className="space-y-7">
    {!initialUsername && <section className="space-y-3">
      <div><h2 className="text-xl font-bold text-white">{fullName ? "Create your GigWay username" : "Choose your username"}</h2><p className="text-sm text-[#94A3B8] mt-1">This is your public GigWay profile link.</p></div>
      {fullName && <p className="text-sm text-[#CBD5E1]">Your name: {fullName}</p>}
      <div className="relative"><span className="absolute left-3 top-2.5 text-[#94A3B8]">@</span><Input value={username} onChange={e => setUsername(e.target.value.replace(/\s/g, "").toLowerCase())} maxLength={30} autoComplete="username" className="pl-8 bg-[#0A0A0F] border-[#334155] text-white" placeholder="your.username" />{availability === "checking" && <Loader2 className="absolute right-3 top-2.5 h-4 w-4 animate-spin text-[#94A3B8]" />}</div>
      {availability === "available" && <p className="flex gap-1.5 items-center text-sm text-emerald-400"><CheckCircle2 className="h-4 w-4" /> Username available</p>}
    </section>}
    <section className="border-t border-[#1E1E2E] pt-6"><h2 className="text-xl font-bold text-white">What are you open to?</h2><p className="text-sm text-[#94A3B8] mt-1 mb-4">Optional. You can change these Work Modes anytime.</p><div className="space-y-2">{WORK_MODES.map(mode => <label key={mode.value} className="flex items-center gap-3 p-3 rounded-xl border border-[#334155] hover:border-[#6366F1] cursor-pointer"><input type="checkbox" checked={modes.includes(mode.value)} onChange={() => setModes(p => p.includes(mode.value) ? p.filter(m => m !== mode.value) : [...p, mode.value])} className="h-4 w-4 accent-[#6366F1]" /><span className="text-sm font-medium text-white">{mode.label}</span></label>)}</div></section>
    {error && <p className="text-sm text-red-400">{error}</p>}
    <Button onClick={submit} disabled={saving || (!initialUsername && availability !== "available")} className="w-full bg-[#6366F1] hover:bg-[#4F46E5] text-white">{saving ? "Saving…" : "Continue"}</Button>
  </div>
}
