import Link from "next/link"
import { ArrowRight, Sparkles } from "lucide-react"
import { createClient } from "@/lib/supabase/server"
import { withDeadline } from "@/lib/async"
import { professionalMilestones } from "@/lib/identity/profile-strength"

export default async function IdentityCompletionPrompt({ userId }: { userId: string }) {
  try {
    const db = await createClient()
    const [{ data, error }, { data: intents }] = await withDeadline(Promise.all([
      db.from("profiles").select("full_name,username,avatar_url,tagline,bio,skills,job_function,portfolio_links,experience_description").eq("id", userId).maybeSingle(),
      db.from("profile_intents").select("intent_type").eq("profile_id", userId).eq("is_active", true).limit(1),
    ]))
    if (error || !data || !data.full_name || !data.username) return null
    const milestones = professionalMilestones({ ...data, hasIntent: !!intents?.length })
    const next = milestones.find(item => !item.complete)
    if (!next) return null
    const completed = milestones.filter(item => item.complete).length
    return <section className="mx-auto mt-5 max-w-3xl rounded-2xl border border-brand-indigo/20 bg-white p-4 shadow-soft sm:flex sm:items-center sm:gap-4">
      <div className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-brand-indigo/10 text-brand-indigo"><Sparkles className="h-5 w-5" /></div>
      <div className="min-w-0 flex-1">
        <h2 className="font-extrabold text-brand-midnight">Build your Professional Identity</h2>
        <p className="mt-1 text-xs text-brand-slate">{completed} of {milestones.length} professional milestones added</p>
        <p className="mt-1.5 text-sm font-medium text-brand-midnight">Next recommended action: {next.label}</p>
      </div>
      <Link href={next.href} className="mt-3 inline-flex shrink-0 items-center gap-1 rounded-xl bg-brand-indigo px-4 py-2.5 text-sm font-bold text-white sm:mt-0">{next.label} <ArrowRight className="h-4 w-4" /></Link>
    </section>
  } catch { return null }
}
