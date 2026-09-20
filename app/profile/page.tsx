import { loginForCurrent } from "@/lib/auth/server"
import Link from "next/link"
import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { activeWorkplaces } from "@/lib/organizations/server"

export default async function ProfilePage() {
  const db = await createClient()
  const { data: { user } } = await db.auth.getUser()
  if (!user) redirect(await loginForCurrent("/profile"))
  const [{ data: profile, error }, workplaces] = await Promise.all([
    db.from("profiles").select("full_name,username,avatar_url").eq("id", user.id).maybeSingle(),
    activeWorkplaces(db, user.id),
  ])
  if (error) throw new Error("Your account could not be loaded. Please try again.")
  return <main className="min-h-screen bg-brand-ivory px-4 py-8 pb-28">
    <div className="mx-auto max-w-3xl space-y-4">
      <header className="mb-6"><h1 className="text-3xl font-bold text-brand-midnight">My Account</h1><p className="mt-2 text-sm text-brand-slate">Manage your professional identity, workplaces and account.</p></header>
      <section className="rounded-2xl border border-brand-borderLight bg-white p-4 sm:p-6">
        <h2 className="font-bold text-brand-midnight">Professional Identity</h2>
        <div className="mt-4 flex min-w-0 items-center gap-3">
          <div className="grid h-12 w-12 shrink-0 place-items-center overflow-hidden rounded-full bg-brand-indigo/10 font-bold text-brand-indigo">{profile?.avatar_url ? <img src={profile.avatar_url} alt="" className="h-full w-full object-cover" /> : profile?.full_name?.[0] || "G"}</div>
          <div className="min-w-0"><p className="break-words font-semibold text-brand-midnight">{profile?.full_name || "Your Professional Identity"}</p>{profile?.username && <p className="break-all text-sm text-brand-slate">@{profile.username}</p>}</div>
        </div>
        <div className="mt-4 flex flex-wrap gap-3 text-sm font-semibold text-brand-indigo">
          {profile?.username ? <Link href={`/u/${profile.username}`} className="rounded-xl border border-brand-borderLight px-3 py-2">View Professional Identity</Link> : <Link href="/profile/complete" className="rounded-xl border border-brand-borderLight px-3 py-2">Complete Professional Identity</Link>}
          <Link href="/profile/edit" className="rounded-xl border border-brand-borderLight px-3 py-2">Edit Professional Identity</Link>
        </div>
      </section>
      <section className="rounded-2xl border border-brand-borderLight bg-white p-4 sm:p-6">
        <h2 className="font-bold text-brand-midnight">My Workplaces</h2>
        <p className="mt-1 text-sm text-brand-slate">{workplaces.length} {workplaces.length === 1 ? "Workplace" : "Workplaces"}</p>
        {workplaces.length ? <ul className="mt-3 space-y-2">{workplaces.slice(0, 3).map(workplace => <li key={workplace.id} className="break-words text-sm text-brand-midnight">{workplace.name} <span className="capitalize text-brand-slate">&mdash; {workplace.role}</span></li>)}</ul> : <p className="mt-3 text-sm text-brand-slate">Create a Workplace for your company, organization, brand, institute or team.</p>}
        {workplaces.length > 3 && <p className="mt-2 text-sm text-brand-slate">+{workplaces.length - 3} more</p>}
        <div className="mt-4 flex flex-wrap gap-3 text-sm font-semibold text-brand-indigo"><Link href="/workplaces" className="rounded-xl border border-brand-borderLight px-3 py-2">Manage Workplaces</Link><Link href="/organizations/new" className="rounded-xl border border-brand-borderLight px-3 py-2">Create Workplace</Link></div>
      </section>
      <nav aria-label="Account" className="flex flex-wrap gap-x-5 gap-y-3 p-2 text-sm font-semibold text-brand-indigo"><Link href="/subscribe">GigWay Pro</Link><Link href="/saved">Saved</Link><Link href="/contact">Help &amp; Support</Link></nav>
    </div>
  </main>
}
