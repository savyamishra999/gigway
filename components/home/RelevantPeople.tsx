import Link from "next/link"
import { createClient } from "@/lib/supabase/server"
import { professionalRelevance } from "@/lib/network/relevance"
import { ProfileAvatar } from "@/components/ui/profile-avatar"
import ProfileConnectionActions from "@/components/connections/ProfileConnectionActions"

export default async function RelevantPeople({ userId }: { userId: string }) {
  const db = await createClient()
  const [viewer, candidates, ownIntents] = await Promise.all([
    db.from("profiles").select("skills,location").eq("id", userId).maybeSingle(),
    db.from("profiles").select("id,full_name,username,avatar_url,tagline,skills,location").eq("profile_completed", true).neq("id", userId).not("username", "is", null).order("created_at", { ascending: false }).order("id", { ascending: false }).limit(60),
    db.from("profile_intents").select("intent_type").eq("profile_id", userId).eq("is_active", true),
  ])
  if (viewer.error || candidates.error || ownIntents.error) throw Error("Suggestions unavailable")
  const ids = (candidates.data || []).map(p => p.id)
  if (!ids.length) return <section className="my-5 rounded-2xl border bg-white p-5"><h2 className="text-xl font-bold">Grow your professional circle</h2><p className="mt-2 text-sm text-brand-slate">Share your profile with someone you have worked with, or explore the network as it grows.</p><Link href="/network" className="mt-3 inline-block font-bold text-brand-indigo">Explore the network</Link></section>
  const [intents, outgoing, incoming, follows] = await Promise.all([
    db.from("profile_intents").select("profile_id,intent_type").in("profile_id", ids).eq("is_active", true),
    db.from("professional_connections").select("recipient_user_id,status").eq("requester_user_id", userId).in("recipient_user_id", ids),
    db.from("professional_connections").select("requester_user_id,status").eq("recipient_user_id", userId).in("requester_user_id", ids),
    db.from("profile_follows").select("followed_profile_id").eq("follower_user_id", userId).in("followed_profile_id", ids),
  ])
  if (intents.error || outgoing.error || incoming.error || follows.error) throw Error("Suggestions unavailable")
  const known = new Set([...(outgoing.data || []).map(r => ({ id: r.recipient_user_id, status: r.status })), ...(incoming.data || []).map(r => ({ id: r.requester_user_id, status: r.status }))].filter(r => ["accepted", "pending", "rejected"].includes(r.status)).map(r => r.id))
  const followed = new Set((follows.data || []).map(r => r.followed_profile_id))
  const people = (candidates.data || []).filter(p => !known.has(p.id)).map(p => ({ ...p, ...professionalRelevance({ ...viewer.data, intents: (ownIntents.data || []).map(i => i.intent_type) }, { ...p, intents: (intents.data || []).filter(i => i.profile_id === p.id).map(i => i.intent_type) }) })).sort((a, b) => b.score - a.score || a.id.localeCompare(b.id)).slice(0, 4)
  return <section className="my-5 min-w-0"><div className="flex items-center justify-between gap-3"><h2 className="text-xl font-extrabold text-brand-midnight">People to meet</h2><Link href="/network?tab=connections" className="text-sm font-bold text-brand-indigo">My connections</Link></div><p className="mt-2 text-sm text-brand-slate">Explore shared skills and professional interests. Follow their work or send a connection request.</p>{!people.length ? <p className="mt-3 rounded-xl bg-white p-4 text-sm">You have already connected with or reviewed these suggestions. <Link href="/network" className="font-bold text-brand-indigo">Explore more people</Link></p> : <div className="mt-4 flex snap-x gap-3 overflow-x-auto pb-3" aria-label="Professional suggestions">{people.map(p => <article key={p.id} className="w-[85%] shrink-0 snap-start rounded-2xl border border-brand-borderLight bg-white p-4 sm:w-72"><Link href={`/u/${p.username}`} className="flex min-w-0 items-center gap-3"><ProfileAvatar src={p.avatar_url} name={p.full_name} className="h-12 w-12 shrink-0"/><div className="min-w-0"><h3 className="truncate font-bold text-brand-midnight">{p.full_name || p.username}</h3><p className="truncate text-xs text-brand-slate">@{p.username}</p></div></Link><p className="mt-3 line-clamp-2 min-h-10 text-sm text-brand-slate">{p.tagline || "View their profile to learn about their work."}</p><p className="my-3 text-xs font-semibold text-brand-indigo">{p.reason}</p><ProfileConnectionActions profileId={p.id} initialState="none" initialFollowing={followed.has(p.id)}/></article>)}</div>}</section>
}
