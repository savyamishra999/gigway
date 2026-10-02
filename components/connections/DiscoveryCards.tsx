"use client";
import Link from "next/link";
import { useState } from "react";
import { boundedFetch } from "@/lib/async";
import type { DiscoveryKind, NetworkPerson } from "@/lib/network/discovery";
function DiscoveryCard({ item, kind }: { item: NetworkPerson; kind: DiscoveryKind }) {
  const [following, setFollowing] = useState(item.following), [busy, setBusy] = useState(false), [error, setError] = useState("");
  async function follow() {
    setBusy(true); setError("");
    try {
      const response = await boundedFetch(`/api/social/follow/${kind === "people" ? "profile" : "organization"}/${item.id}`, { method: following ? "DELETE" : "POST" });
      if (!response.ok) throw Error();
      setFollowing(!following);
    } catch { setError("Could not update follow. Please try again."); }
    finally { setBusy(false); }
  }
  return <><Link prefetch={false} href={item.href} className="block min-w-0"><div className="flex min-w-0 items-center gap-3"><span className={`grid h-11 w-11 shrink-0 place-items-center overflow-hidden bg-brand-indigo/10 font-bold text-brand-indigo ${kind === "people" ? "rounded-full" : "rounded-xl"}`}>{item.image ? <img src={item.image} alt="" className="h-full w-full object-cover" /> : item.name[0]}</span><h3 className="min-w-0 break-words font-bold text-brand-midnight">{item.name}</h3></div>{item.tagline && <p className="mt-3 break-words text-body-sm text-brand-slate">{item.tagline}</p>}{item.skills.length > 0 && <p className="mt-2 break-words text-caption text-brand-indigo">{item.skills.join(" · ")}</p>}{item.intents.length > 0 && <p className="mt-2 break-words text-caption text-brand-slate">{item.intents.join(" · ")}</p>}</Link><button disabled={busy} onClick={follow} aria-label={`${following ? "Unfollow" : "Follow"} ${item.name}`} className="mt-4 w-full rounded-xl border border-brand-indigo/25 px-3 py-2 text-caption font-bold text-brand-indigo disabled:opacity-60">{busy ? "Working..." : following ? "Following" : "Follow"}</button>{error && <p role="alert" className="mt-2 text-caption text-brand-coral">{error}</p>}</>;
}
export default function DiscoveryCards({ items, kind, rail = false }: { items: NetworkPerson[]; kind: DiscoveryKind; rail?: boolean }) {
  if (!items.length) return <p className="mt-4 text-body-sm text-brand-slate">No {kind === "people" ? "professionals" : "Workplaces"} found. Try another search.</p>;
  return <div role={rail ? "region" : undefined} aria-label={rail ? kind === "people" ? "People for you" : "Workplaces to follow" : undefined} tabIndex={rail ? 0 : undefined} className={rail ? "mt-4 flex max-w-full snap-x gap-3 overflow-x-auto pb-3" : "mt-5 grid min-w-0 gap-4 sm:grid-cols-2 lg:grid-cols-3"}>{items.map(item => <article key={item.id} className={`min-w-0 rounded-2xl border border-brand-borderLight bg-white p-4 shadow-soft ${rail ? "w-[85%] shrink-0 snap-start sm:w-64" : ""}`}><DiscoveryCard item={item} kind={kind} /></article>)}</div>;
}
