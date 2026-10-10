import Link from "next/link"
import { ArrowRight } from "lucide-react"
import { createClient } from "@/lib/supabase/server"
import { withDeadline } from "@/lib/async"
import { professionalMilestones, type ProfessionalIdentitySignals } from "@/lib/identity/profile-strength"

type Props = {
  userId: string
  loadProfile?: () => PromiseLike<{
    data: (ProfessionalIdentitySignals & { full_name?: string | null; username?: string | null }) | null
    error: unknown
  }>
  loadIntents?: () => PromiseLike<{ data: { intent_type: string }[] | null }>
}

export default async function IdentityCompletionPrompt({ userId, loadProfile, loadIntents }: Props) {
  try {
    const db = await createClient()
    const [{ data, error }, { data: intents }] = await withDeadline(Promise.all([
      loadProfile ? loadProfile() : db.from("profiles").select("full_name,username,avatar_url,tagline,bio,skills,job_function,portfolio_links,experience_description").eq("id", userId).maybeSingle(),
      loadIntents ? loadIntents() : db.from("profile_intents").select("intent_type").eq("profile_id", userId).eq("is_active", true).limit(1),
    ]))
    if (error || !data || !data.full_name || !data.username) return null
    const milestones = professionalMilestones({ ...data, hasIntent: !!intents?.length })
    const next = milestones.find(item => !item.complete)
    if (!next) return null
    const completed = milestones.filter(item => item.complete).length
    return <section className="mx-auto mt-5 max-w-3xl rounded-2xl border border-brand-indigo/20 bg-white p-4 shadow-soft sm:flex sm:items-center sm:gap-4">
      <div role="img" aria-label={`${completed} of ${milestones.length} profile milestones complete`} className="relative grid h-16 w-16 shrink-0 place-items-center">
        <svg viewBox="0 0 64 64" className="absolute inset-0 h-16 w-16 -rotate-90" aria-hidden="true"><circle cx="32" cy="32" r="28" fill="none" stroke="#E0E7FF" strokeWidth="4" /><circle cx="32" cy="32" r="28" fill="none" stroke="#4F46E5" strokeWidth="4" pathLength="5" strokeDasharray={`${completed} 5`} strokeLinecap="round" /></svg>
        {data.avatar_url ? <img src={data.avatar_url} alt="" className="h-12 w-12 rounded-full object-cover" /> : <span className="text-xl font-bold text-brand-indigo">{data.full_name[0]}</span>}
      </div>
      <div className="min-w-0 flex-1">
        <h2 className="font-extrabold text-brand-midnight">Build your Professional Identity</h2>
        <p className="mt-1 text-xs font-semibold text-brand-indigo">Profile incomplete · Keep building at your own pace</p>
        <p className="mt-1 text-xs text-brand-slate">{completed} of {milestones.length} professional milestones added</p>
        <p className="mt-1.5 text-sm font-medium text-brand-midnight">Next recommended action: {next.label}</p>
      </div>
      <Link href={next.href} className="mt-3 inline-flex shrink-0 items-center gap-1 rounded-xl bg-brand-indigo px-4 py-2.5 text-sm font-bold text-white sm:mt-0">{next.label} <ArrowRight className="h-4 w-4" /></Link>
    </section>
  } catch { return null }
}
