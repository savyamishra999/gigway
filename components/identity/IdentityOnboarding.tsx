"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { CheckCircle2, ChevronLeft, ChevronRight } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { ImageUploader } from "@/components/ui/image-uploader"
import { WORK_MODES, normalizeUsername, usernameError, type WorkMode } from "@/lib/identity"
import { safeReturnTo } from "@/lib/auth/return-to"

const choices: { value: WorkMode; label: string; sub: string }[] = [
  { value: "looking_for_work", label: "Find Jobs", sub: "Explore roles and opportunities" },
  { value: "looking_for_project", label: "Find Freelance Projects", sub: "Find client projects" },
  { value: "offering_services", label: "Offer Services", sub: "Show what you can do" },
  { value: "hiring_talent", label: "Hire Talent", sub: "Find the right professionals" },
  { value: "grow_network", label: "Grow My Network", sub: "Build your professional community" },
]

function intentDestination(modes: WorkMode[]) {
  if (modes.length > 1) return "/work"
  if (modes.includes("looking_for_work")) return "/jobs"
  if (modes.includes("looking_for_project")) return "/projects"
  if (modes.includes("offering_services")) return "/gigs"
  if (modes.includes("hiring_talent")) return "/freelancers"
  return "/network"
}

type Props = {
  username?: string | null
  fullName?: string | null
  initialModes?: string[]
  next?: string
}

export default function IdentityOnboarding({ username: initialUsername, fullName: initialName, initialModes = [], next: nextValue }: Props) {
  const router = useRouter()
  const [step, setStep] = useState(1)
  const [username, setUsername] = useState(initialUsername || "")
  const [fullName, setFullName] = useState(initialName || "")
  const [avatarUrl, setAvatarUrl] = useState("")
  const [modes, setModes] = useState<WorkMode[]>(initialModes.filter((mode): mode is WorkMode => WORK_MODES.some((item) => item.value === mode)))
  const [available, setAvailable] = useState(!!initialUsername)
  const [error, setError] = useState("")
  const [saving, setSaving] = useState(false)
  const [identityLive, setIdentityLive] = useState(false)
  const normalized = normalizeUsername(username)
  const next = safeReturnTo(nextValue, "")

  useEffect(() => {
    if (initialUsername) return
    const invalid = usernameError(normalized)
    if (!normalized || invalid) {
      setAvailable(false)
      return
    }
    const timer = setTimeout(async () => {
      const response = await fetch(`/api/identity/username?username=${encodeURIComponent(normalized)}`)
      const data = await response.json().catch(() => ({}))
      setAvailable(response.ok && !!data.available)
    }, 350)
    return () => clearTimeout(timer)
  }, [normalized, initialUsername])

  const toggle = (mode: WorkMode) => setModes((current) => current.includes(mode) ? current.filter((item) => item !== mode) : [...current, mode])
  const continueSetup = () => {
    setError("")
    if (!fullName.trim() || (!initialUsername && (!available || usernameError(normalized)))) {
      setError("Add your name and an available username.")
      return
    }
    setStep(2)
  }
  const finish = async () => {
    if (!modes.length) {
      setError("Choose at least one way you want to use GigWay.")
      return
    }
    setSaving(true)
    setError("")
    const response = await fetch("/api/identity/complete", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        username: initialUsername ? undefined : normalized,
        fullName,
        avatarUrl,
        modes,
        hireAs: modes.includes("hiring_talent") ? "individual" : null,
        completingSetup: true,
      }),
    })
    const data = await response.json().catch(() => ({}))
    setSaving(false)
    if (!response.ok) {
      setError(data.error || "Could not make your identity live.")
      return
    }
    if (next) {
      router.replace(next)
      router.refresh()
      return
    }
    setIdentityLive(true)
  }

  if (identityLive) {
    return <section className="space-y-6 text-center">
      <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-brand-indigo/10 text-brand-indigo"><CheckCircle2 className="h-8 w-8" /></div>
      <div><h2 className="text-h2 font-extrabold text-brand-midnight">Your Professional Identity is Live</h2><p className="mt-2 text-body-sm text-brand-slate">You can now be discovered for the work, services and opportunities that matter to you.</p></div>
      <div className="rounded-2xl border border-brand-borderLight bg-brand-ivory p-4"><p className="font-bold text-brand-midnight">{fullName.trim()}</p><p className="text-body-sm text-brand-slate">@{normalized}</p></div>
      <div className="flex flex-col justify-center gap-3 sm:flex-row"><Button asChild variant="outline"><Link href={`/u/${normalized}`}>View My Profile</Link></Button><Button onClick={() => router.push(intentDestination(modes))}>Start Exploring<ChevronRight className="ml-1 h-4 w-4" /></Button></div>
    </section>
  }

  return <div className="space-y-6">
    <div className="h-1.5 overflow-hidden rounded-full bg-slate-100"><div className="h-full bg-brand-indigo transition-all" style={{ width: `${step / 2 * 100}%` }} /></div>
    <p className="text-caption font-bold text-brand-slate">{step} of 2</p>
    {step === 1 && <section className="space-y-4"><div><h2 className="text-h2 font-extrabold text-brand-midnight">Your professional identity</h2><p className="text-body-sm text-brand-slate">Start with the essentials. You can add more to your profile later.</p></div><ImageUploader value={avatarUrl} onChange={setAvatarUrl} label="Add profile photo (optional)" /><Input value={fullName} onChange={(event) => setFullName(event.target.value)} placeholder="Full name" maxLength={120} /><div><Input value={username} disabled={!!initialUsername} onChange={(event) => setUsername(event.target.value.replace(/\s/g, "").toLowerCase())} placeholder="Username" maxLength={30} /><p className="mt-1 text-caption text-brand-slate">gigway.in/u/{normalized || "username"}</p>{available && !initialUsername && <p className="mt-1 flex items-center gap-1 text-caption text-emerald-600"><CheckCircle2 className="h-3.5 w-3.5" />Username available</p>}</div></section>}
    {step === 2 && <section className="space-y-4"><div><h2 className="text-h2 font-extrabold text-brand-midnight">What brings you to GigWay?</h2><p className="text-body-sm text-brand-slate">Choose at least one. These interests tailor discovery and can be changed anytime.</p></div><div className="grid gap-3 sm:grid-cols-2">{choices.map((choice) => <button key={choice.value} type="button" onClick={() => toggle(choice.value)} className={`rounded-2xl border p-4 text-left transition-colors ${modes.includes(choice.value) ? "border-brand-indigo bg-brand-indigo/5" : "border-brand-borderLight bg-white hover:border-brand-indigo/40"}`}><b className="block text-brand-midnight">{choice.label}</b><span className="mt-1 block text-caption text-brand-slate">{choice.sub}</span></button>)}</div></section>}
    {error && <p className="text-sm text-brand-coral">{error}</p>}
    <div className="flex justify-between gap-3">{step === 2 ? <Button variant="outline" onClick={() => setStep(1)}><ChevronLeft className="mr-1 h-4 w-4" />Back</Button> : <span />}{step === 1 ? <Button onClick={continueSetup}>Continue<ChevronRight className="ml-1 h-4 w-4" /></Button> : <Button disabled={saving || !modes.length} onClick={finish}>{saving ? "Making it live…" : "Make identity live"}</Button>}</div>
  </div>
}
