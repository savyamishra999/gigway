"use client"
import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { ImageUploader } from "@/components/ui/image-uploader"
import { normalizeUsername, usernameError } from "@/lib/identity"
type Org = Record<string, any>
const details = [["website", "Website"], ["industry", "Industry"], ["company_size", "Company size"], ["founded_year", "Founded year"], ["location", "Location"], ["country", "Country"]] as const
export default function OrganizationForm({ organization }: { organization?: Org }) {
  const router = useRouter(); const [step, setStep] = useState(1); const [data, setData] = useState<Org>(() => ({ name: organization?.name ?? "", username: organization?.username ?? "", entity_type: organization?.entity_type === "company" ? "company" : "organization", logo_url: organization?.logo_url ?? "", cover_url: organization?.cover_url ?? "", tagline: organization?.tagline ?? "", description: organization?.description ?? "", website: organization?.website ?? "", industry: organization?.industry ?? "", company_size: organization?.company_size ?? "", founded_year: organization?.founded_year ?? "", location: organization?.location ?? "", country: organization?.country ?? "" })); const [availability, setAvailability] = useState<"idle"|"checking"|"available"|"taken"|"error">("idle"); const [error, setError] = useState(""); const [saving, setSaving] = useState(false)
  const username = normalizeUsername(data.username), label = "Workplace"
  useEffect(() => {
    if (organization?.username === username) { setAvailability("idle"); return }
    if (!username || usernameError(username)) { setAvailability("idle"); return }
    setAvailability("checking")
    const controller = new AbortController()
    const timer = setTimeout(async () => {
      try {
        const response = await fetch(`/api/organizations/username?username=${encodeURIComponent(username)}`, { signal: controller.signal })
        const result = await response.json()
        if (!controller.signal.aborted) setAvailability(response.ok && result.available ? "available" : response.status === 409 ? "taken" : "error")
      } catch { if (!controller.signal.aborted) setAvailability("error") }
    }, 350)
    return () => { clearTimeout(timer); controller.abort() }
  }, [username, organization?.username])

  const field = (key: keyof Org, fieldLabel: string, required = false) => <label className="block text-sm font-medium text-[#D5D9E4]">{fieldLabel}{required && <span className="text-[#FB923C]"> *</span>}<Input required={required} value={data[key] ?? ""} onChange={e => setData(p => ({ ...p, [key]: key === "username" ? e.target.value.replace(/\s/g, "").toLowerCase() : e.target.value }))} className="mt-1.5 h-11 rounded-xl border-white/10 bg-white/[.045] text-white" /></label>
  const submit = async () => {
    if (saving) return
    const invalid = usernameError(username)
    if (!data.name.trim() || invalid) { setError(!data.name.trim() ? "Add your Workplace name." : invalid!); return }
    setSaving(true); setError("")
    try {
      // The server revalidates both namespaces, including an unchanged handle.
      const response = await fetch(organization ? `/api/organizations/${organization.username}` : "/api/organizations/create", { method: organization ? "PATCH" : "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...data, username }) })
      const result = await response.json().catch(() => ({}))
      if (!response.ok) { setError(result.error || "Could not save this Workplace."); return }
      router.push(`/u/${result.organization.username}`); router.refresh()
    } catch { setError("Could not save this Workplace. Please try again.") }
    finally { setSaving(false) }
  }

  return <div className="space-y-7"><div className="flex gap-2 overflow-x-auto pb-1">{["Brand", "Details", "About"].map((title, index) => <button type="button" key={title} onClick={() => setStep(index + 1)} className={`shrink-0 rounded-full px-3 py-2 text-xs font-semibold ${step === index + 1 ? "bg-[#6D5DFB] text-white" : "bg-white/[.045] text-[#9099aa]"}`}>{title}</button>)}</div>{step === 1 && <section className="space-y-5"><label className="block text-sm font-medium text-[#D5D9E4]">Workplace type<select value={data.entity_type} onChange={e => setData(p => ({ ...p, entity_type: e.target.value }))} className="mt-1.5 h-11 w-full rounded-xl border border-white/10 bg-white/[.045] px-3 text-white"><option value="company">Company</option><option value="organization">Organization / Brand / Institute / Team</option></select></label><ImageUploader label="Upload cover" kind="cover" maxMb={8} value={data.cover_url} onChange={cover_url => setData(p => ({ ...p, cover_url }))} /><ImageUploader label="Upload logo" kind="logo" value={data.logo_url} onChange={logo_url => setData(p => ({ ...p, logo_url }))} />{field("name", `${label} name`, true)}{field("username", `${label} username`, true)}<p className="text-xs text-[#7d8596]">{availability === "available" ? "Username available" : availability === "taken" ? "Username unavailable" : availability === "error" ? "Could not check availability. Saving will check again." : availability === "checking" ? "Checking username..." : "Your public address will be @username."}</p></section>}{step === 2 && <section className="space-y-5">{field("tagline", "Tagline")}<div className="grid gap-4 sm:grid-cols-2">{details.map(([key, detailLabel]) => field(key, detailLabel))}</div></section>}{step === 3 && <section><label className="block text-sm font-medium text-[#D5D9E4]">Description<Textarea value={data.description} onChange={e => setData(p => ({ ...p, description: e.target.value }))} rows={7} className="mt-1.5 rounded-xl border-white/10 bg-white/[.045] text-white" /></label></section>}{error && <p className="text-sm text-red-400">{error}</p>}<div className="flex flex-wrap justify-between gap-3 border-t border-white/8 pt-5"><Button type="button" variant="ghost" disabled={step === 1} onClick={() => setStep(s => s - 1)}>Back</Button>{step < 3 ? <Button type="button" onClick={() => setStep(s => s + 1)}>Continue</Button> : <Button type="button" disabled={saving} onClick={submit}>{saving ? "Saving…" : organization ? `Save ${label}` : `Create ${label}`}</Button>}</div></div>
}
