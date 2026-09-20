import Link from "next/link"
import { Camera, ArrowRight } from "lucide-react"
import { createClient } from "@/lib/supabase/server"
import { withDeadline } from "@/lib/async"

export default async function IdentityCompletionPrompt({ userId }: { userId: string }) {
  try {
    const db = await createClient()
    const { data, error } = await withDeadline(db.from("profiles").select("full_name,username,avatar_url").eq("id", userId).maybeSingle())
    if (error || !data || data.avatar_url || !data.full_name || !data.username) return null
    return <section className="mx-auto mt-5 max-w-3xl rounded-2xl border border-brand-indigo/20 bg-white p-4 shadow-soft sm:flex sm:items-center sm:gap-4">
      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-brand-indigo/10 text-brand-indigo"><Camera className="h-5 w-5" /></div>
      <div className="mt-3 min-w-0 flex-1 sm:mt-0">
        <div className="flex items-center justify-between gap-3"><h2 className="font-extrabold text-brand-midnight">Complete your Professional Identity</h2><span className="text-xs font-bold text-brand-indigo">67% complete</span></div>
        <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-slate-100"><div className="h-full w-2/3 rounded-full bg-brand-indigo" /></div>
        <p className="mt-2 text-sm text-brand-slate">Add a profile photo so people can recognize you.</p>
      </div>
      <Link href="/profile/edit" className="mt-3 inline-flex shrink-0 items-center gap-1 text-sm font-bold text-brand-indigo sm:mt-0">Complete Profile <ArrowRight className="h-4 w-4" /></Link>
    </section>
  } catch { return null }
}
