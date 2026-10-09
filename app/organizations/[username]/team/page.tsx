import Link from "next/link"
import { notFound, redirect } from "next/navigation"
import { getViewer, loginForCurrent } from "@/lib/auth/server"
import { createClient } from "@/lib/supabase/server"

export default async function WorkplaceTeam({ params, searchParams }: { params: Promise<{ username: string }>; searchParams: Promise<{ page?: string }> }) {
  const { username } = await params, user = await getViewer()
  if (!user) redirect(await loginForCurrent(`/organizations/${username}/team`))
  const db = await createClient()
  const org = await db.from("organizations").select("id,name,username").eq("username", username).maybeSingle()
  if (org.error) throw new Error("Workplace could not be loaded.")
  if (!org.data) notFound()
  const permission = await db.from("organization_members").select("member_role").eq("organization_id", org.data.id).eq("profile_id", user.id).eq("status", "active").maybeSingle()
  if (permission.error) throw new Error("Workplace access could not be checked.")
  if (!permission.data || !["owner", "admin"].includes(permission.data.member_role)) redirect(`/u/${username}`)
  const value = Number((await searchParams).page || 1)
  const page = Number.isSafeInteger(value) && value > 0 && value <= Math.floor(Number.MAX_SAFE_INTEGER / 25) ? value : 1
  const result = await db.from("organization_members").select("id,member_role,status,profiles(full_name,username)")
    .eq("organization_id", org.data.id).order("created_at", { ascending: false }).order("id", { ascending: false }).range((page - 1) * 25, page * 25)
  if (result.error) throw new Error("Team members could not be loaded. Please try again.")
  const members = (result.data || []).slice(0, 25), more = (result.data || []).length > 25
  return <main className="min-h-screen bg-brand-ivory px-4 py-8"><section className="mx-auto max-w-3xl space-y-5">
    <Link prefetch={false} href={`/organizations/${username}/edit`} className="text-sm font-semibold text-brand-indigo">Manage Workplace</Link>
    <h1 className="break-words text-h2 font-extrabold text-brand-midnight">{org.data.name} — Team</h1>
    <p className="text-sm text-brand-slate">View your Workplace members and their current roles. Team changes are not available yet.</p>
    <ul className="space-y-3">{members.map(member => { const profile = (Array.isArray(member.profiles) ? member.profiles[0] : member.profiles) as { full_name?: string; username?: string } | null; return <li key={member.id} className="min-w-0 rounded-xl border border-brand-borderLight bg-white p-4"><p className="break-words font-bold text-brand-midnight">{profile?.full_name || "Workplace member"}</p><p className="mt-1 break-words text-sm text-brand-slate">Role: {member.member_role} · Status: {member.status}</p>{profile?.username && <Link prefetch={false} href={`/u/${profile.username}`} className="mt-2 inline-block text-sm text-brand-indigo">View profile</Link>}</li> })}</ul>
    {!members.length && <p className="text-sm text-brand-slate">No members on this page.</p>}
    <nav aria-label="Team pages" className="flex flex-wrap gap-4 text-sm font-bold text-brand-indigo">{page > 1 && <Link prefetch={false} href={`?page=${page - 1}`}>Previous</Link>}{more && <Link prefetch={false} href={`?page=${page + 1}`}>Next</Link>}</nav>
  </section></main>
}
