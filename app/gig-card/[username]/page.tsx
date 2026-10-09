import Link from "next/link"
import { notFound } from "next/navigation"
import { createPublicClient } from "@/lib/supabase/public"
import ProfileShareActions from "@/components/profile/ProfileShareActions"

export default async function GigCardPage({ params }: { params: Promise<{ username: string }> }) {
  const { username } = await params
  const result = await createPublicClient().from("profiles").select("full_name,username,avatar_url,tagline,skills,location")
    .eq("username", username.toLowerCase()).maybeSingle()
  if (result.error) throw new Error("This GigCard could not be loaded. Please try again.")
  if (!result.data?.username) notFound()
  const profile = result.data
  return <main className="min-h-screen bg-brand-ivory px-4 py-8"><div className="mx-auto max-w-xl"><header className="mb-5 print:hidden"><h1 className="text-h2 font-extrabold text-brand-midnight">GigCard</h1><p className="mt-2 text-sm text-brand-slate">Your public professional introduction. Copy or share this free preview.</p></header><article aria-label="Public GigCard" className="min-w-0 rounded-2xl border border-brand-borderLight bg-white p-6 shadow-soft"><p className="text-sm font-extrabold text-brand-indigo">GigWay</p><div className="mt-5 grid h-20 w-20 place-items-center overflow-hidden rounded-full bg-brand-indigo/10 text-2xl font-bold text-brand-indigo">{profile.avatar_url ? <img width={80} height={80} src={profile.avatar_url} alt="" className="h-full w-full object-cover" /> : profile.full_name?.[0] || "G"}</div><h2 className="mt-4 break-words text-2xl font-extrabold text-brand-midnight">{profile.full_name || "GigWay professional"}</h2><p className="mt-1 break-all text-sm text-brand-indigo">@{profile.username}</p>{profile.tagline && <p className="mt-3 break-words text-sm leading-6 text-brand-slate">{profile.tagline}</p>}{profile.location && <p className="mt-3 break-words text-xs text-brand-slate">{profile.location}</p>}{profile.skills?.length > 0 && <p className="mt-3 break-words text-xs text-brand-indigo">{profile.skills.slice(0, 6).join(" · ")}</p>}<Link prefetch={false} href={`/u/${profile.username}`} className="mt-5 block break-all border-t border-brand-borderLight pt-4 text-sm font-bold text-brand-indigo">gigway.in/u/{profile.username}</Link></article><div className="print:hidden"><ProfileShareActions username={profile.username} card /><Link prefetch={false} href={`/u/${profile.username}`} className="mt-5 inline-block text-sm font-bold text-brand-indigo">View Professional Identity</Link></div></div></main>
}
