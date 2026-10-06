import Link from "next/link";
import ContentTimestamp from "@/components/ui/ContentTimestamp";
import WorkCreationLink from "@/components/work/WorkCreationLink";
import { workPreviews, type WorkKind } from "@/lib/work/previews";
import type { ReactNode } from "react";

const labels = {
  jobs: { title: "Latest Jobs", noun: "jobs", href: "/jobs", create: "/jobs/new", action: "Post a Job", view: "View / Apply" },
  projects: { title: "Latest Projects", noun: "projects", href: "/projects", create: "/projects/new", action: "Post a Project", view: "View Project" },
  services: { title: "Services", noun: "services", href: "/gigs", create: "/gigs/new", action: "Offer a Service", view: "View Service" },
};
const rowClass = "flex max-w-full snap-x gap-3 overflow-x-auto pb-3 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden focus-visible:outline-brand-indigo";
const cardClass = "flex min-h-72 w-[85%] min-w-0 shrink-0 snap-start flex-col rounded-2xl border border-brand-borderLight bg-white p-4 shadow-soft sm:w-72";

function RailFrame({ kind, loading = false, children }: { kind: WorkKind; loading?: boolean; children: ReactNode }) {
  const label = labels[kind];
  return <section aria-labelledby={`work-${kind}`} aria-busy={loading || undefined} className="mt-8 min-w-0">
    <h2 id={`work-${kind}`} className="text-h3 font-extrabold text-brand-midnight">{label.title}</h2>
    {/* Reserve the same row plus scrollbar spacing for loading, empty and error states. */}
    <div className="mt-3 min-h-[18.75rem]">{children}</div>
    <Link prefetch={false} href={label.href} className="mt-3 inline-block text-body-sm font-bold text-brand-indigo">View all {label.noun} →</Link>
  </section>;
}

export function WorkPreviewFallback({ kind }: { kind: WorkKind }) {
  return <RailFrame kind={kind} loading><p role="status" className="sr-only">Loading {kind}...</p><div aria-hidden="true" className={rowClass}>
    {[0, 1, 2].map(index => <div key={index} className={cardClass}><div className="h-5 w-3/4 rounded bg-brand-borderLight" /><div className="mt-3 h-4 w-1/2 rounded bg-brand-borderLight" /><div className="mt-auto h-4 w-1/3 rounded bg-brand-borderLight" /></div>)}
  </div></RailFrame>;
}

export default async function WorkPreviewRail({ kind }: { kind: WorkKind }) {
  const { items, unavailable } = await workPreviews(kind), label = labels[kind];
  return <RailFrame kind={kind}>
    {unavailable ? <p role="status" className="rounded-2xl border border-brand-borderLight bg-white p-4 text-body-sm text-brand-slate">{label.title} could not be loaded. Try the full listing.</p>
      : !items.length ? <div className="rounded-2xl border border-brand-borderLight bg-white p-4"><p className="text-body-sm text-brand-slate">No {label.noun} available yet.</p><WorkCreationLink href={label.create}>{label.action}</WorkCreationLink></div>
      : <div role="region" aria-label={label.title} tabIndex={0} className={rowClass}>
        {items.map(item => <article key={item.id} className={cardClass}>
          <h3 className="break-words font-bold text-brand-midnight">{item.title}</h3>
          {item.author && <p className="mt-2 break-words text-body-sm text-brand-slate">{item.author}</p>}
          {item.detail && <p className="mt-2 break-words text-caption text-brand-slate">{item.detail}</p>}
          {item.amount != null && Number.isFinite(Number(item.amount)) && <p className="mt-2 text-body-sm font-semibold text-brand-indigo">{kind === "services" ? "From " : "Budget: "}₹{Number(item.amount).toLocaleString("en-IN")}</p>}
          <ContentTimestamp createdAt={item.createdAt} updatedAt={item.updatedAt} className="mt-3 block text-caption text-brand-slate" />
          <Link prefetch={false} href={`${label.href}/${item.id}`} className="mt-auto pt-4 text-body-sm font-bold text-brand-indigo">{label.view}</Link>
        </article>)}
      </div>}
  </RailFrame>;
}
