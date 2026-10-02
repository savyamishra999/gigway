import Link from "next/link";
import { Suspense } from "react";
import { getViewer, loginForCurrent } from "@/lib/auth/server";
import { redirect } from "next/navigation";
import NetworkClient from "@/components/connections/NetworkClient";
import DiscoveryCards from "@/components/connections/DiscoveryCards";
import { networkDiscovery, type DiscoveryKind } from "@/lib/network/discovery";
async function Results({ kind, viewerId, q }: { kind: DiscoveryKind; viewerId: string; q: string }) {
  try { return <><DiscoveryCards items={await networkDiscovery(kind, viewerId, 18, q)} kind={kind} /><p className="mt-4 text-caption text-brand-slate">Showing up to 18 recent matches. Search to narrow the results.</p></>; }
  catch { return <p role="alert" className="mt-5 text-body-sm text-brand-slate">Could not load {kind === "people" ? "professionals" : "Workplaces"}. Please try again.</p>; }
}
export default async function NetworkPage({ searchParams }: { searchParams: Promise<{ tab?: string; q?: string }> }) {
  const user = await getViewer();
  if (!user) redirect(await loginForCurrent("/network"));
  const params = await searchParams, tab = params.tab === "workplaces" || params.tab === "connections" ? params.tab : "people", q = (params.q || "").trim().slice(0, 80);
  return <main className="min-h-screen bg-brand-ivory px-4 py-8 pb-24"><div className="mx-auto min-w-0 max-w-5xl"><p className="text-caption font-bold tracking-[.16em] text-brand-coral">NETWORK</p><h1 className="mt-2 text-h2 font-extrabold text-brand-midnight">Find people, build connections and follow Workplaces.</h1><nav aria-label="Network sections" className="mt-5 flex flex-wrap gap-2">{[["people", "People"], ["workplaces", "Workplaces"], ["connections", "My Network"]].map(([value, label]) => <Link prefetch={false} key={value} href={`/network?tab=${value}`} aria-current={tab === value ? "page" : undefined} className={`rounded-xl border px-4 py-2 text-body-sm font-bold ${tab === value ? "border-brand-indigo bg-brand-indigo text-white" : "border-brand-borderLight bg-white text-brand-indigo"}`}>{label}</Link>)}</nav>{tab === "connections" ? <NetworkClient embedded /> : <section className="mt-6"><h2 className="text-h3 font-bold text-brand-midnight">{tab === "people" ? "People" : "Workplaces"}</h2><p className="mt-2 text-body-sm text-brand-slate">{tab === "people" ? "Find professionals and follow their updates. Follow and connection requests are separate." : "Discover companies, startups and organizations on GigWay."}</p><form action="/network" className="mt-4 flex gap-2"><input type="hidden" name="tab" value={tab} /><input key={`${tab}:${q}`} name="q" defaultValue={q} maxLength={80} aria-label={tab === "people" ? "Search professionals" : "Search Workplaces"} placeholder={tab === "people" ? "Search by name, username or headline" : "Search by name, username, tagline or industry"} className="min-w-0 flex-1 rounded-xl border border-brand-borderLight bg-white px-3 py-3 text-body-sm" /><button className="rounded-xl bg-brand-indigo px-4 py-2 text-body-sm font-bold text-white">Search</button></form><Suspense key={`${tab}:${q}`} fallback={<p role="status" className="mt-4">Loading {tab}...</p>}><Results kind={tab} viewerId={user.id} q={q} /></Suspense></section>}</div></main>;
}
