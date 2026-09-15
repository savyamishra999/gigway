"use client"
import Link from "next/link"
import { useEffect, useRef, useState } from "react"
import { useRouter } from "next/navigation"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { ImageUploader } from "@/components/ui/image-uploader"
import { normalizeUsername, usernameError } from "@/lib/identity"
import { INDUSTRIES, COUNTRIES, WORKPLACE_SIZES, compatibleOptions, setupData, setupErrors, workplaceCompleteness, type SetupData } from "@/lib/organizations/setup"

const control = "mt-2 h-11 w-full min-w-0 rounded-xl border border-brand-borderLight bg-white px-3 text-base text-brand-midnight focus-visible:outline focus-visible:outline-2 focus-visible:outline-brand-indigo"
const sectionStyle = "min-w-0 space-y-5 rounded-2xl border border-brand-borderLight bg-white p-4 sm:p-6"
const action = "inline-flex min-h-11 items-center justify-center rounded-xl px-4 py-2 text-sm font-semibold focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-indigo disabled:opacity-50"
export default function OrganizationForm({ organization }: { organization?: Record<string, any> }) {
  const router = useRouter(), formRef = useRef<HTMLFormElement>(null), submitting = useRef(false)
  const [data, setData] = useState(() => setupData(organization))
  const [savedUsername, setSavedUsername] = useState(organization?.username || "")
  const [availability, setAvailability] = useState<"idle" | "checking" | "available" | "taken" | "error">("idle")
  const [errors, setErrors] = useState<Partial<Record<keyof SetupData, string>>>({})
  const [error, setError] = useState(""), [success, setSuccess] = useState(""), [saving, setSaving] = useState(false)
  const [uploads, setUploads] = useState({ logo: false, cover: false })
  const uploading = uploads.logo || uploads.cover, username = normalizeUsername(data.username)
  const completeness = workplaceCompleteness(data)
  const set = (key: keyof SetupData, value: string) => { setData(p => ({ ...p, [key]: value })); setErrors(p => ({ ...p, [key]: undefined })); setError(""); setSuccess("") }
  useEffect(() => {
    if (savedUsername === username || !username || usernameError(username)) { setAvailability("idle"); return }
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
  }, [username, savedUsername])
  const fieldError = (key: keyof SetupData) => errors[key] && <p id={`${key}-error`} className="mt-2 text-sm text-red-700">{errors[key]}</p>
  const input = (key: keyof SetupData, label: string, props: React.InputHTMLAttributes<HTMLInputElement> = {}) => <div className="min-w-0"><label htmlFor={key} className="text-sm font-semibold text-brand-midnight">{label}</label><Input id={key} name={key} value={data[key]} onChange={e => set(key, e.target.value)} className={control} aria-invalid={!!errors[key]} aria-describedby={errors[key] ? `${key}-error` : undefined} {...props} />{fieldError(key)}</div>
  const suggestions = (key: "industry" | "country", label: string, values: string[]) => <div>{input(key, label, { list: `${key}-options`, autoComplete: "off", "aria-describedby": `${key}-hint` })}<datalist id={`${key}-options`}>{compatibleOptions(values, data[key]).map(value => <option key={value} value={value} />)}</datalist><p id={`${key}-hint`} className="mt-2 text-xs text-brand-slate">Choose a suggestion or enter your own. Existing values are kept as entered.</p></div>
  const submit = async (event: React.FormEvent) => {
    event.preventDefault()
    if (submitting.current || uploading) return
    const invalid = setupErrors(data)
    if (availability === "taken" && username !== savedUsername) invalid.username = "This username is unavailable. Choose another."
    setErrors(invalid); setError(""); setSuccess("")
    if (Object.keys(invalid).length) { formRef.current?.querySelector<HTMLElement>(`[name="${Object.keys(invalid)[0]}"]`)?.focus(); return }
    submitting.current = true; setSaving(true)
    try {
      // The existing server checks both namespaces and owner/admin membership.
      const response = await fetch(organization ? `/api/organizations/${savedUsername}` : "/api/organizations/create", { method: organization ? "PATCH" : "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...data, username }) })
      const result = await response.json().catch(() => ({}))
      if (!response.ok) {
        if (response.status === 409 && /username/i.test(String(result.error))) setErrors({ username: "This username is unavailable. Choose another." })
        else setError(response.status === 401 ? "Your session has expired. Sign in again before saving." : response.status === 403 ? "Only active Workplace owners and admins can save changes." : "Could not save your Workplace. Your changes are still here. Please try again.")
        return
      }
      if (!result.organization?.username) { setError("Could not confirm the save. Please reload your Workplace before trying again."); return }
      const nextUsername = result.organization.username
      setSavedUsername(nextUsername); setSuccess(organization ? "Changes saved. Your Workplace is up to date." : "Workplace created. Complete your profile next.")
      if (!organization) router.push(`/organizations/${nextUsername}/edit`)
      else if (nextUsername !== savedUsername) router.replace(`/organizations/${nextUsername}/edit`)
      router.refresh()
    } catch { setError("Could not save your Workplace. Check your connection and try again. Your changes are still here.") }
    finally { submitting.current = false; setSaving(false) }
  }
  return <form ref={formRef} onSubmit={submit} noValidate className="min-w-0 space-y-5">
    {organization && <section className={sectionStyle} aria-label="Workplace profile completeness"><div className="flex flex-wrap items-center justify-between gap-3"><div><h2 className="font-bold text-brand-midnight">Workplace profile</h2><p className="mt-1 text-sm text-brand-slate">{completeness.percent}% complete · {completeness.complete} of {completeness.total} identity details</p></div><Link href={`/u/${savedUsername}`} className={`${action} border border-brand-borderLight text-brand-indigo`} target="_blank" rel="noopener noreferrer">View Workplace<span className="sr-only"> (opens in a new tab)</span></Link></div><progress aria-label="Workplace profile completeness" value={completeness.complete} max={completeness.total} className="h-2 w-full accent-brand-indigo" /><p className="text-xs text-brand-slate">Each listed identity detail counts equally. This reflects your current form, including unsaved changes; optional details are not required to save.</p>{!!completeness.missing.length && <ul className="flex flex-wrap gap-x-4 gap-y-2">{completeness.missing.map(([key, label]) => <li key={key}><a href={`#${key}`} className="text-sm text-brand-indigo underline underline-offset-4">{label}</a></li>)}</ul>}</section>}
    <fieldset disabled={saving} className="min-w-0 space-y-5">
      <section className={sectionStyle} aria-labelledby="identity-heading"><div><h2 id="identity-heading" className="text-lg font-bold text-brand-midnight">Workplace identity</h2><p className="mt-1 text-sm text-brand-slate">How people recognise your Workplace. Name and username are required.</p></div>
        {input("name", "Workplace name *", { required: true, autoComplete: "organization" })}
        <div><label htmlFor="username" className="text-sm font-semibold text-brand-midnight">Username *</label><div className="mt-2 flex min-w-0 items-center rounded-xl border border-brand-borderLight bg-white"><span aria-hidden="true" className="pl-3 text-brand-slate">@</span><Input id="username" name="username" required value={data.username} onChange={e => set("username", e.target.value.toLowerCase())} className="h-11 border-0 bg-transparent text-base text-brand-midnight" autoCapitalize="none" autoCorrect="off" spellCheck={false} aria-invalid={!!errors.username} aria-describedby={`username-hint username-status${errors.username ? " username-error" : ""}`} /></div><p id="username-hint" className="mt-2 text-xs leading-5 text-brand-slate">3–30 lowercase letters, numbers, periods or underscores. Start with a letter or number.</p><p className="mt-1 break-all text-sm text-brand-indigo">gigway.in/u/{username || "username"}</p><p id="username-status" role="status" className="mt-2 text-xs text-brand-slate">{usernameError(username) && username ? usernameError(username) : availability === "available" ? "Username available" : availability === "taken" ? "Username unavailable" : availability === "error" ? "Could not check availability. Saving will check again." : availability === "checking" ? "Checking username..." : savedUsername === username ? "Your current username. Availability is checked again when you save." : "Choose your public address."}</p>{fieldError("username")}</div>
        <div><label htmlFor="entity_type" className="text-sm font-semibold text-brand-midnight">Workplace type</label><select id="entity_type" name="entity_type" value={data.entity_type} onChange={e => set("entity_type", e.target.value)} className={control}><option value="company">Company / business</option><option value="organization">Organization / brand / institution / team</option>{!["company", "organization"].includes(data.entity_type) && <option value={data.entity_type}>{data.entity_type || "Not specified"} (current)</option>}</select><p className="mt-2 text-xs text-brand-slate">Businesses, startups and agencies can use Company. Institutions, nonprofits, brands and teams can use Organization.</p></div>
        {input("tagline", "Tagline", { placeholder: "A short introduction to what you do" })}
        <div id="logo_url" className="scroll-mt-24"><h3 className="mb-3 text-sm font-semibold text-brand-midnight">Workplace logo</h3><ImageUploader label="Add logo" kind="logo" value={data.logo_url} onChange={value => set("logo_url", value)} workplacePreview guidance="Recommended: 400 × 400 px square. Larger images are accepted. Preview matches the rounded-square public logo." onBusyChange={busy => setUploads(p => ({ ...p, logo: busy }))} disabled={saving} /></div>
        {organization && <div id="cover_url" className="scroll-mt-24"><h3 className="mb-3 text-sm font-semibold text-brand-midnight">Cover image</h3><ImageUploader label="Add cover" kind="cover" maxMb={8} value={data.cover_url} onChange={value => set("cover_url", value)} workplacePreview guidance="Recommended: 1600 × 240 px (about 6.7:1). The public cover is a full-width strip: 208 px tall on desktop and 144 px on mobile. Screens crop it differently. Keep key artwork near the centre; the dashed area is a guide, not a guaranteed safe area. Avoid embedded text near the edges." onBusyChange={busy => setUploads(p => ({ ...p, cover: busy }))} disabled={saving} /></div>}
      </section>
      {organization && <><section className={sectionStyle} aria-labelledby="about-heading"><h2 id="about-heading" className="text-lg font-bold text-brand-midnight">About your Workplace</h2><div><label htmlFor="description" className="text-sm font-semibold text-brand-midnight">About</label><Textarea id="description" name="description" rows={6} value={data.description} onChange={e => set("description", e.target.value)} className="mt-2 border-brand-borderLight bg-white text-base text-brand-midnight" /></div>{suggestions("industry", "Industry", INDUSTRIES)}<div className="grid min-w-0 gap-5 sm:grid-cols-2"><div className="min-w-0"><label htmlFor="company_size" className="text-sm font-semibold text-brand-midnight">Workplace size</label><select id="company_size" name="company_size" value={data.company_size} onChange={e => set("company_size", e.target.value)} className={control}><option value="">Not specified</option>{compatibleOptions(WORKPLACE_SIZES, data.company_size).map(value => <option value={value} key={value}>{value}{WORKPLACE_SIZES.includes(value) ? (value === "1" ? " person" : " people") : " (current)"}</option>)}</select></div>{input("founded_year", "Founded year", { inputMode: "numeric", placeholder: "e.g. 2020" })}</div>{input("website", "Website", { type: "url", placeholder: "https://example.com", autoComplete: "url" })}</section><section className={sectionStyle} aria-labelledby="location-heading"><h2 id="location-heading" className="text-lg font-bold text-brand-midnight">Location</h2>{suggestions("country", "Country", COUNTRIES)}{input("location", "City / location", { autoComplete: "address-level2", placeholder: "e.g. Bangalore" })}</section></>}
    </fieldset>
    {!organization && <p className="text-sm leading-6 text-brand-slate">Start with the essentials. After creation, add a cover, About, industry, website and location in Manage Workplace.</p>}
    {error && <p role="alert" className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">{error}</p>}
    {!!Object.keys(errors).filter(key => errors[key as keyof SetupData]).length && <p role="alert" className="text-sm text-red-700">Check the highlighted fields before saving.</p>}
    {success && <p role="status" className="rounded-xl bg-green-50 p-4 text-sm text-green-800">{success}</p>}
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-brand-borderLight bg-white p-4"><p className="text-xs text-brand-slate">{uploading ? "Wait for image uploads to finish." : "Changes appear publicly after saving."}</p><button type="submit" disabled={saving || uploading} className={`${action} bg-brand-indigo text-white`}>{saving ? "Saving..." : organization ? "Save Changes" : "Create Workplace"}</button></div>
  </form>
}
