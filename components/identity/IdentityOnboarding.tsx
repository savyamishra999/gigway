"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { CheckCircle2, Loader2, Users, Building2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { WORK_MODES, normalizeUsername, usernameError, type WorkMode, type HireAs } from "@/lib/identity"

const INTENT_COPY: Record<WorkMode, { label: string; sub: string }> = {
  offering_services: { label: "Offer my services",   sub: "Freelance / professional work" },
  looking_for_work:  { label: "Find a full-time job", sub: "Looking for employment" },
  hiring_talent:     { label: "Hire people",          sub: "Looking for talent" },
}

const HIRE_AS_OPTIONS: { value: HireAs; label: string; sub: string; icon: typeof Users }[] = [
  { value: "individual", label: "As an Individual",           sub: "Hire for personal projects", icon: Users },
  { value: "company",    label: "As a Company / Organization", sub: "Scale your team & business", icon: Building2 },
]

export default function IdentityOnboarding({ username: initialUsername, fullName, initialModes = [], rolesConfigured = false }: {
  username?: string | null; fullName?: string | null; initialModes?: string[]; rolesConfigured?: boolean
}) {
  const router = useRouter()
  const [username, setUsername] = useState(initialUsername ?? "")
  const [modes, setModes] = useState<WorkMode[]>(initialModes.filter((m): m is WorkMode => WORK_MODES.some(x => x.value === m)))
  const [hireAs, setHireAs] = useState<HireAs | null>(null)
  const [availability, setAvailability] = useState<"idle" | "checking" | "available" | "taken">(initialUsername ? "available" : "idle")
  const [error, setError] = useState("")
  const [saving, setSaving] = useState(false)
  const normalized = normalizeUsername(username)
  const needsHireAs = !rolesConfigured && modes.includes("hiring_talent")

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

  const toggleMode = (value: WorkMode) => {
    setModes(p => p.includes(value) ? p.filter(m => m !== value) : [...p, value])
    if (value === "hiring_talent") setHireAs(null)
  }

  const submit = async () => {
    if (!initialUsername && (usernameError(normalized) || availability !== "available")) {
      setError(usernameError(normalized) || "Choose an available username."); return
    }
    if (needsHireAs && !hireAs) { setError("Choose how you're hiring."); return }
    setSaving(true); setError("")
    const res = await fetch("/api/identity/complete", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username: initialUsername ? undefined : normalized, modes, hireAs, completingSetup: true }),
    })
    const data = await res.json().catch(() => ({}))
    setSaving(false)
    if (!res.ok) { setError(data.error || "Could not save your identity."); return }
    router.push("/home"); router.refresh()
  }

  return <div className="space-y-7">
    {!initialUsername && <section className="space-y-3">
      <div><h2 className="text-xl font-bold text-white">{fullName ? "Create your GigWay username" : "Choose your username"}</h2><p className="text-sm text-[#94A3B8] mt-1">This is your public GigWay profile link.</p></div>
      {fullName && <p className="text-sm text-[#CBD5E1]">Your name: {fullName}</p>}
      <div className="relative"><span className="absolute left-3 top-2.5 text-[#94A3B8]">@</span><Input value={username} onChange={e => setUsername(e.target.value.replace(/\s/g, "").toLowerCase())} maxLength={30} autoComplete="username" className="pl-8 bg-[#0A0A0F] border-[#334155] text-white" placeholder="your.username" />{availability === "checking" && <Loader2 className="absolute right-3 top-2.5 h-4 w-4 animate-spin text-[#94A3B8]" />}</div>
      {availability === "available" && <p className="flex gap-1.5 items-center text-sm text-emerald-400"><CheckCircle2 className="h-4 w-4" /> Username available</p>}
    </section>}
    <section className="border-t border-[#1E1E2E] pt-6">
      <h2 className="text-xl font-bold text-white">What do you want to do on GigWay?</h2>
      <p className="text-sm text-[#94A3B8] mt-1 mb-4">Choose everything that applies — you can change this anytime.</p>
      <div className="space-y-2">
        {WORK_MODES.map(mode => <label key={mode.value} className="flex items-center gap-3 p-3 rounded-xl border border-[#334155] hover:border-[#6366F1] cursor-pointer">
          <input type="checkbox" checked={modes.includes(mode.value)} onChange={() => toggleMode(mode.value)} className="h-4 w-4 accent-[#6366F1]" />
          <span>
            <span className="block text-sm font-medium text-white">{INTENT_COPY[mode.value].label}</span>
            <span className="block text-xs text-[#94A3B8]">{INTENT_COPY[mode.value].sub}</span>
          </span>
        </label>)}
      </div>
      {needsHireAs && <div className="mt-5 space-y-2">
        <p className="text-sm font-semibold text-white">How are you hiring?</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {HIRE_AS_OPTIONS.map(opt => {
            const Icon = opt.icon
            const active = hireAs === opt.value
            return <button key={opt.value} type="button" onClick={() => setHireAs(opt.value)}
              className={`flex items-start gap-3 p-3.5 rounded-xl border-2 text-left transition-all ${active ? "border-[#6366F1] bg-[#6366F1]/10" : "border-[#334155] hover:border-[#6366F1]/50"}`}>
              <Icon className={`h-5 w-5 mt-0.5 flex-shrink-0 ${active ? "text-[#818CF8]" : "text-[#6B7280]"}`} />
              <span>
                <span className="block text-sm font-semibold text-white">{opt.label}</span>
                <span className="block text-xs text-[#94A3B8] mt-0.5">{opt.sub}</span>
              </span>
            </button>
          })}
        </div>
      </div>}
    </section>
    {error && <p className="text-sm text-red-400">{error}</p>}
    <Button onClick={submit} disabled={saving || (!initialUsername && availability !== "available") || (needsHireAs && !hireAs)} className="w-full bg-[#6366F1] hover:bg-[#4F46E5] text-white">{saving ? "Saving…" : "Continue"}</Button>
  </div>
}
