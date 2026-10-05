import Link from "next/link";
import DiscoveryFollowButton from "./DiscoveryFollowButton";

import type { DiscoveryKind, NetworkPerson } from "@/lib/network/discovery";
function DiscoveryCard({ item, kind }: { item: NetworkPerson; kind: DiscoveryKind }) {
  return <><Link prefetch={false} href={item.href} className="block min-w-0"><div className="flex min-w-0 items-center gap-3"><span className={`grid h-11 w-11 shrink-0 place-items-center overflow-hidden bg-brand-indigo/10 font-bold text-brand-indigo ${kind === "people" ? "rounded-full" : "rounded-xl"}`}>{item.image ? <img loading="lazy" decoding="async" width={44} height={44} src={item.image} alt="" className="h-full w-full object-cover" /> : item.name[0]}</span><h3 className="min-w-0 break-words font-bold text-brand-midnight">{item.name}</h3></div>{item.tagline && <p className="mt-3 break-words text-body-sm text-brand-slate">{item.tagline}</p>}{item.skills.length > 0 && <p className="mt-2 break-words text-caption text-brand-indigo">{item.skills.join(" · ")}</p>}{item.intents.length > 0 && <p className="mt-2 break-words text-caption text-brand-slate">{item.intents.join(" · ")}</p>}</Link><DiscoveryFollowButton id={item.id} name={item.name} kind={kind} initialFollowing={item.following} /></>;
}
export default function DiscoveryCards({ items, kind, rail = false }: { items: NetworkPerson[]; kind: DiscoveryKind; rail?: boolean }) {
  if (!items.length) return <p className="mt-4 text-body-sm text-brand-slate">No {kind === "people" ? "professionals" : "Workplaces"} found. Try another search.</p>;
  return <div role={rail ? "region" : undefined} aria-label={rail ? kind === "people" ? "People for you" : "Workplaces to follow" : undefined} tabIndex={rail ? 0 : undefined} className={rail ? "mt-4 flex max-w-full snap-x gap-3 overflow-x-auto pb-3 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden" : "mt-5 grid min-w-0 gap-4 sm:grid-cols-2 lg:grid-cols-3"}>{items.map(item => <article key={item.id} className={`min-w-0 rounded-2xl border border-brand-borderLight bg-white p-4 shadow-soft ${rail ? "w-[85%] shrink-0 snap-start sm:w-64" : ""}`}><DiscoveryCard item={item} kind={kind} /></article>)}</div>;
}
