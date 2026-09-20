"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { CheckCircle2, ChevronLeft, ChevronRight, Image as ImageIcon } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { ImageUploader } from "@/components/ui/image-uploader"
import { WORK_MODES, normalizeUsername, usernameError, mapModesToLegacyRoles, type WorkMode } from "@/lib/identity"
import { boundedFetch, withDeadline } from "@/lib/async"
import { safeReturnTo } from "@/lib/auth/return-to"

const choices: { value: WorkMode; label: string; sub: string }[] = [
  { value: "looking_for_work", label: "Find Jobs", sub: "Explore roles and opportunities" },
  { value: "looking_for_project", label: "Find Freelance Projects", sub: "Find client projects" },
  { value: "offering_services", label: "Offer Services", sub: "Show what you can do" },
  { value: "hiring_talent", label: "Hire Talent", sub: "Find the right professionals" },
  { value: "grow_network", label: "Grow My Network", sub: "Build your professional community" },
]

type Props = {
  username?: string | null
  fullName?: string | null
  avatarUrl?: string | null
  googleAvatarUrl?: string | null
  initialModes?: string[]
  next?: string
  requiresWorkRole?: boolean
}

export default function IdentityOnboarding({ username: initialUsername, fullName: initialName, avatarUrl: initialAvatar, googleAvatarUrl, initialModes = [], next: nextValue, requiresWorkRole = false }: Props) {
  const router = useRouter()
  const [step, setStep] = useState(1)
  const [username, setUsername] = useState(initialUsername || "")
  const [fullName, setFullName] = useState(initialName || "")
  const [avatarUrl, setAvatarUrl] = useState(initialAvatar || "")
  const [modes, setModes] = useState<WorkMode[]>(initialModes.filter((mode): mode is WorkMode => WORK_MODES.some(item => item.value === mode)))
  const [available, setAvailable] = useState(!!initialUsername)
  const [error, setError] = useState("")
  const [saving, setSaving] = useState(false)
  const [importingGooglePhoto, setImportingGooglePhoto] = useState(false)
  const [photoBusy, setPhotoBusy] = useState(false)
  const normalized = normalizeUsername(username)
  const next = safeReturnTo(nextValue, "")

  useEffect(() => {
    if (initialUsername) return
    const invalid = usernameError(normalized)
    if (!normalized || invalid) { setAvailable(false); return }
    let cancelled = false
    const timer = setTimeout(async () => {
      try {
        const response = await boundedFetch(`/api/identity/username?username=${encodeURIComponent(normalized)}`)
        const data = await response.json().catch(() => ({}))
        if (!cancelled) {
          setAvailable(response.ok && !!data.available)
          setError(response.ok ? "" : data.error || "Username availability could not be checked. Please try again.")
        }
      } catch { if (!cancelled) { setAvailable(false); setError("Username availability could not be checked. Please try again.") } }
    }, 350)
    return () => { cancelled = true; clearTimeout(timer) }
  }, [normalized, initialUsername])

  const toggle = (mode: WorkMode) => setModes(current => current.includes(mode) ? current.filter(item => item !== mode) : [...current, mode])
  const validIdentity = () => {
    setError("")
    if (!fullName.trim() || (!initialUsername && (!available || usernameError(normalized)))) {
      setError("Add your name and an available username.")
      return false
    }
    return true
  }
  const useGooglePhoto = async () => {
    setImportingGooglePhoto(true); setError("")
    try {
      const response = await withDeadline(boundedFetch("/api/identity/google-avatar", { method: "POST" }))
      const data = await response.json().catch(() => ({}))
      if (!response.ok || !data.avatarUrl) throw new Error(data.error || "Google photo could not be imported.")
      setAvatarUrl(data.avatarUrl)
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Google photo could not be imported. Upload a photo or skip for now.")
    } finally { setImportingGooglePhoto(false) }
  }
  const finish = async () => {
    if (!validIdentity()) return
    if (requiresWorkRole && !mapModesToLegacyRoles(modes, modes.includes("hiring_talent") ? "individual" : null)?.user_roles.length) {
      setError("To continue to this page, choose Find Jobs, Offer Services, or Hire Talent.")
      return
    }
    setSaving(true); setError("")
    try {
      const response = await withDeadline(boundedFetch("/api/identity/complete", {
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
      }))
      const data = await response.json().catch(() => ({}))
      if (!response.ok) { setError(data.error || "Could not make your identity live."); return }
      router.replace(next || "/home")
      router.refresh()
    } catch { setError("Your identity could not be saved. Check your connection and try again.") }
    finally { setSaving(false) }
  }
  const continueSetup = () => {
    if (!validIdentity()) return
    if (requiresWorkRole) setStep(2)
    else void finish()
  }

  return <div className="space-y-6">
    {requiresWorkRole && <><div className="h-1.5 overflow-hidden rounded-full bg-slate-100"><div className="h-full bg-brand-indigo transition-all" style={{ width: `${step / 2 * 100}%` }} /></div><p className="text-caption font-bold text-brand-slate">{step} of 2</p></>}
    {step === 1 && <section className="space-y-5">
      <div><h2 className="text-h2 font-extrabold text-brand-midnight">Complete your Professional Identity</h2><p className="text-body-sm text-brand-slate">Add the essentials people use to recognize you. You can complete the rest later.</p></div>
      <div className="rounded-2xl border border-brand-indigo/15 bg-brand-indigo/[.03] p-4">
        <ImageUploader value={avatarUrl} onChange={setAvatarUrl} label="Upload Photo" guidance="A clear photo helps people recognize and trust your profile." prominent onBusyChange={setPhotoBusy} />
        {googleAvatarUrl && !initialAvatar && <button type="button" onClick={useGooglePhoto} disabled={saving || importingGooglePhoto} className="mt-3 inline-flex items-center gap-2 rounded-lg border border-brand-indigo px-3 py-2 text-sm font-semibold text-brand-indigo disabled:opacity-50"><ImageIcon className="h-4 w-4" />{importingGooglePhoto ? "Importing Google photo…" : "Use Google Photo"}</button>}
      </div>
      <div><label className="mb-1 block text-sm font-semibold text-brand-midnight">Name</label><Input value={fullName} onChange={event => setFullName(event.target.value)} placeholder="Full name" maxLength={120} /></div>
      <div><label className="mb-1 block text-sm font-semibold text-brand-midnight">Username</label><Input value={username} disabled={!!initialUsername} onChange={event => setUsername(event.target.value.replace(/\s/g, "").toLowerCase())} placeholder="Username" maxLength={30} /><p className="mt-1 text-caption text-brand-slate">gigway.in/u/{normalized || "username"}</p>{available && !initialUsername && <p className="mt-1 flex items-center gap-1 text-caption text-emerald-600"><CheckCircle2 className="h-3.5 w-3.5" />@{normalized} is available</p>}{!initialUsername && normalized && usernameError(normalized) && <p className="mt-1 text-caption text-brand-coral">{usernameError(normalized)}</p>}</div>
      {!avatarUrl && <p className="text-xs text-brand-slate">You can skip the photo for now. We’ll remind you on Home.</p>}
    </section>}
    {step === 2 && <section className="space-y-4"><div><h2 className="text-h2 font-extrabold text-brand-midnight">What brings you to GigWay?</h2><p className="text-body-sm text-brand-slate">Choose at least one so this destination can be configured.</p></div><div className="grid gap-3 sm:grid-cols-2">{choices.map(choice => <button key={choice.value} type="button" onClick={() => toggle(choice.value)} className={`rounded-2xl border p-4 text-left transition-colors ${modes.includes(choice.value) ? "border-brand-indigo bg-brand-indigo/5" : "border-brand-borderLight bg-white hover:border-brand-indigo/40"}`}><b className="block text-brand-midnight">{choice.label}</b><span className="mt-1 block text-caption text-brand-slate">{choice.sub}</span></button>)}</div></section>}
    {error && <p role="alert" className="text-sm text-brand-coral">{error}</p>}
    <div className="flex justify-between gap-3">{step === 2 ? <Button variant="outline" onClick={() => setStep(1)}><ChevronLeft className="mr-1 h-4 w-4" />Back</Button> : <span />}{step === 1 ? <Button disabled={saving || importingGooglePhoto || photoBusy} onClick={continueSetup}>{saving ? "Saving…" : photoBusy ? "Uploading photo…" : requiresWorkRole ? "Continue" : avatarUrl ? "Enter GigWay" : "Skip photo and enter GigWay"}<ChevronRight className="ml-1 h-4 w-4" /></Button> : <Button disabled={saving || !modes.length} onClick={finish}>{saving ? "Making it live…" : "Make identity live"}</Button>}</div>
  </div>
}
