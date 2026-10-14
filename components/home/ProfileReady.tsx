import Link from "next/link"
import { CheckCircle2 } from "lucide-react"
import { createClient } from "@/lib/supabase/server"
import { createPublicClient } from "@/lib/supabase/public"
import { ProfileAvatar } from "@/components/ui/profile-avatar"
import ProfileShareActions from "@/components/profile/ProfileShareActions"
export default async function ProfileReady({ userId }: { userId: string }) {
  const db = await createClient()
  const { data: p, error } = await db.from("profiles").select("full_name,username,avatar_url,tagline,profile_completed").eq("id", userId).maybeSingle()
  if (error) throw error
  if (!p?.username || !p.profile_completed) return null
  // Only describe the link as ready to share after verifying anonymous visibility.
  const publicProfile = await createPublicClient().from("profiles").select("id").eq("id", userId).maybeSingle()
  if (publicProfile.error || !publicProfile.data) return null
  return <section className="mt-5 overflow-hidden rounded-2xl border border-indigo-200 bg-gradient-to-br from-indigo-50 via-white to-orange-50 p-5 sm:p-6"><p className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-brand-indigo"><CheckCircle2 className="h-4 w-4"/>Your professional identity</p><h2 className="mt-3 text-2xl font-extrabold text-brand-midnight">Your profile is ready to share.</h2><p className="mt-2 text-sm leading-6 text-brand-slate">One link to introduce yourself to employers, clients and people you work with. Keep adding your skills, experience and work as you grow.</p><Link href={`/u/${p.username}`} className="mt-4 flex items-center gap-4 rounded-2xl border border-white bg-white/90 p-4 shadow-soft"><ProfileAvatar src={p.avatar_url} name={p.full_name} className="h-16 w-16 shrink-0"/><div className="min-w-0"><h3 className="break-words text-lg font-extrabold text-brand-midnight">{p.full_name || p.username}</h3>{p.tagline && <p className="mt-1 text-sm text-brand-slate">{p.tagline}</p>}<p className="mt-2 break-all text-xs font-semibold text-brand-indigo">gigway.in/u/{p.username}</p></div></Link><ProfileShareActions username={p.username}/><Link href="/profile/edit" className="mt-3 inline-block py-2 text-sm font-bold text-brand-indigo">Add your skills and work</Link></section>
}
