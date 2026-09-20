import { loginForCurrent } from "@/lib/auth/server"
import Link from "next/link"
import { redirect } from "next/navigation"
import { Building2 } from "lucide-react"
import { createClient } from "@/lib/supabase/server"
import { activeWorkplaces } from "@/lib/organizations/server"

export default async function WorkplacesPage() {
  const db = await createClient()
  const { data: { user } } = await db.auth.getUser()
  if (!user) redirect(await loginForCurrent("/workplaces"))
  const workplaces = await activeWorkplaces(db, user.id)
  return <main className="min-h-screen bg-brand-ivory px-4 py-8 pb-28">
    <div className="mx-auto max-w-3xl space-y-6">
      <header className="space-y-3">
        <Link href="/profile" className="text-sm font-semibold text-brand-indigo">My Account</Link>
        <h1 className="text-3xl font-bold text-brand-midnight">My Workplaces</h1>
        <p className="text-sm text-brand-slate">Workplaces you belong to, administered through your Professional Identity.</p>
        <Link href="/organizations/new" className="inline-flex rounded-xl bg-brand-indigo px-4 py-3 text-sm font-semibold text-white">Create Workplace</Link>
      </header>
      {workplaces.length ? <div className="space-y-3">{workplaces.map(workplace => <article key={workplace.id} className="min-w-0 rounded-2xl border border-brand-borderLight bg-white p-4 sm:p-5">
        <div className="flex min-w-0 items-start gap-3">
          <div className="grid h-12 w-12 shrink-0 place-items-center overflow-hidden rounded-xl bg-brand-indigo/10 text-brand-indigo">{workplace.logo_url ? <img src={workplace.logo_url} alt="" className="h-full w-full object-cover" /> : <Building2 className="h-6 w-6" />}</div>
          <div className="min-w-0 flex-1"><h2 className="break-words text-lg font-bold text-brand-midnight">{workplace.name}</h2><p className="text-sm capitalize text-brand-slate">{workplace.role}</p><p className="break-all text-sm text-brand-slate">@{workplace.username}</p></div>
        </div>
        <div className="mt-4 flex flex-wrap gap-3">
          <Link href={`/u/${workplace.username}`} className="rounded-xl border border-brand-borderLight px-4 py-2 text-sm font-semibold text-brand-indigo">View Workplace</Link>
          {workplace.canManage && <Link href={`/organizations/${workplace.username}/edit`} className="rounded-xl bg-brand-indigo px-4 py-2 text-sm font-semibold text-white">Manage</Link>}
        </div>
      </article>)}</div> : <section className="rounded-2xl border border-brand-borderLight bg-white p-5">
        <h2 className="font-semibold text-brand-midnight">You don&apos;t manage any Workplaces yet.</h2>
        <p className="mt-2 text-sm leading-6 text-brand-slate">Create a Workplace for your company, organization, brand, institute or team.</p>
      </section>}
    </div>
  </main>
}
