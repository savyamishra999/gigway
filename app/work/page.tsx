import { Suspense } from "react";
import Link from "next/link";
import WorkPreviewRail from "@/components/work/WorkPreviewRail";

const destinations = [
  { href: "/jobs", title: "Jobs" },
  { href: "/projects", title: "Projects" },
  { href: "/gigs", title: "Services" },
  { href: "/freelancers", title: "Hire People" },
];
export default function WorkPage() {
  return <main className="min-h-screen bg-brand-ivory px-4 py-8 pb-24"><div className="mx-auto min-w-0 max-w-5xl">
    <p className="text-caption font-bold tracking-[.16em] text-brand-coral">WORK</p>
    <h1 className="mt-2 text-h1 font-extrabold text-brand-midnight">Find work. Hire people. Offer your skills.</h1>
    <nav aria-label="Work categories" className="mt-5 flex flex-wrap gap-2">{destinations.map(({ href, title }) => <Link prefetch={false} key={href} href={href} className="rounded-xl border border-brand-borderLight bg-white px-4 py-2 text-body-sm font-bold text-brand-indigo">{title}</Link>)}</nav>
    {(["jobs", "projects", "services"] as const).map(kind => <Suspense key={kind} fallback={<p role="status" className="mt-8 text-body-sm text-brand-slate">Loading {kind}...</p>}><WorkPreviewRail kind={kind} /></Suspense>)}
    <section className="mt-8 rounded-2xl border border-brand-borderLight bg-white p-5"><h2 className="text-h3 font-extrabold text-brand-midnight">Looking to hire?</h2><div className="mt-3 flex flex-wrap gap-4"><Link prefetch={false} href="/jobs/new" className="text-body-sm font-bold text-brand-indigo">Post a Job</Link><Link prefetch={false} href="/projects/new" className="text-body-sm font-bold text-brand-indigo">Post a Project</Link></div></section>
  </div></main>;
}
