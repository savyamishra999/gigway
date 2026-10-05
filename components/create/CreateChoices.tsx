"use client"
import Link from "next/link"
import { useSearchParams } from "next/navigation"
import { useAuthUi } from "@/components/layout/AuthUiProvider"
import { useCreateWorkplaces } from "./useCreateWorkplaces"

export const personalActions = [
  { href: "/social/create", label: "Share a GigThought", description: "Share an update, idea, photo or video.", example: "I'm available for new freelance projects." },
  { href: "/jobs/new", label: "Post a Job", description: "Hire someone for a role.", example: "Hiring a Sales Executive in Lucknow." },
  { href: "/projects/new", label: "Post a Gig Project", description: "Get a specific piece of work done.", example: "Need someone to build a business website." },
  { href: "/gigs/new", label: "Offer a Service", description: "Show people what you can do.", example: "Logo Design, Tuition, Legal Help, Photography." },
]

export default function CreateChoices({ viewerId }: { viewerId: string }) {
  const { user, profile } = useAuthUi()
  const identity = user?.id === viewerId ? profile : null
  const workplaces = useCreateWorkplaces(viewerId)
  const requested = useSearchParams().get("organization")
  const selected = workplaces.organizations.find(org => org.id === requested)
  const actions = requested ? selected ? personalActions.slice(0, 2) : [] : personalActions
  return <main className="min-h-screen bg-brand-ivory px-3 pt-3 pb-24 text-brand-midnight sm:px-4 sm:pt-8"><div className="mx-auto min-w-0 max-w-2xl">
    <h1 className="text-lg font-extrabold sm:text-h2">Choose what to create</h1>
    <div className="mt-2 rounded-xl border border-brand-borderLight bg-white px-3 py-2">
      <p className="text-xs text-brand-slate">You are posting as</p>
      <p className="truncate text-sm font-bold">{requested ? selected?.name || "Checking Workplace…" : identity?.full_name || "Your Professional Profile"}</p>
      <p className="truncate text-xs text-brand-slate">{requested ? "Workplace" : `${identity?.username ? `@${identity.username} · ` : ""}Professional Profile`}</p>
    </div>
    {requested && !selected && <p role="status" className="mt-3 text-sm">{workplaces.loading ? "Checking your permission to post as this Workplace…" : "This Workplace is unavailable or you do not have permission to post as it."} <Link prefetch={false} href="/create?personal=1" className="underline">Use Professional Profile</Link></p>}
    <div data-create-actions className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2 sm:gap-3">
      {actions.map(action => <Link data-create-action key={action.href} prefetch={false} href={selected ? `${action.href}?organization=${encodeURIComponent(selected.id)}` : action.href} className="min-w-0 rounded-xl border border-brand-borderLight bg-white p-3 shadow-soft hover:border-brand-indigo sm:p-5">
        <h2 className="text-sm font-bold leading-5 text-brand-indigo sm:text-base">{action.label}</h2>
        <p className="mt-1 text-xs leading-4 text-brand-slate sm:text-sm">{action.description}</p>
        <p className="mt-3 hidden text-xs text-brand-slate sm:block">Example: {action.example}</p>
      </Link>)}
    </div>
    <section aria-label="Posting identity" className="mt-4 text-sm">
      {workplaces.loading && <p role="status" className="text-brand-slate">Loading Workplaces…</p>}
      {workplaces.error && <p role="alert">{workplaces.error} <button type="button" onClick={workplaces.retry} className="min-h-11 px-2 font-bold text-brand-indigo">Retry</button></p>}
      {(requested || workplaces.organizations.length > 0) && <details><summary className="min-h-11 cursor-pointer py-3 font-bold text-brand-indigo">Change posting identity</summary><div className="grid gap-2">
        <Link prefetch={false} href="/create?personal=1" className="min-h-11 rounded-lg border p-3">Professional Profile</Link>
        {workplaces.organizations.map(org => <Link prefetch={false} key={org.id} href={`/create?organization=${encodeURIComponent(org.id)}`} className="min-h-11 break-words rounded-lg border p-3">{org.name} · Workplace</Link>)}
      </div></details>}
    </section>
  </div></main>
}
