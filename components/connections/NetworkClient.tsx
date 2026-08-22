"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Check, Loader2, UserRound } from "lucide-react";
import { ProfileAvatar } from "@/components/ui/profile-avatar";

type Item = {
  id: string;
  profile?: {
    id: string;
    full_name: string;
    username: string;
    avatar_url?: string | null;
    tagline?: string | null;
    location?: string | null;
    is_verified?: boolean;
  };
};

export default function NetworkClient() {
  const [requests, setRequests] = useState<Item[]>([]);
  const [connections, setConnections] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState("");

  const load = async () => {
    setLoading(true);
    const response = await fetch("/api/connections");
    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      setError(data.error || "Could not load network.");
    } else {
      setRequests(data.requests || []);
      setConnections(data.connections || []);
    }
    setLoading(false);
  };

  useEffect(() => {
    void load();
  }, []);

  const updateRequest = async (id: string, action: "accept" | "reject") => {
    setBusyId(id);
    setError("");
    const response = await fetch(`/api/connections/${id}/${action}`, { method: "POST" });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) setError(data.error || "Could not update request.");
    else await load();
    setBusyId(null);
  };

  const disconnect = async (item: Item) => {
    if (!item.profile) return;
    setBusyId(item.id);
    setError("");
    const response = await fetch(`/api/connections/${item.profile.id}`, { method: "DELETE" });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) setError(data.error || "Could not disconnect.");
    else await load();
    setBusyId(null);
  };

  const identity = (item: Item) => (
    <Link href={item.profile?.username ? `/u/${item.profile.username}` : "/network"} className="min-w-0 flex-1">
      <p className="flex items-center gap-1 truncate font-bold text-brand-midnight">
        <span className="truncate">{item.profile?.full_name || "GigWay member"}</span>
        {item.profile?.is_verified && <Check className="h-3.5 w-3.5 shrink-0 text-brand-indigo" />}
      </p>
      <p className="truncate text-caption text-brand-indigo">@{item.profile?.username || "member"}</p>
      <p className="truncate text-caption text-brand-slate">{item.profile?.tagline || item.profile?.location || "GigWay professional"}</p>
    </Link>
  );

  const row = (item: Item, actions?: React.ReactNode) => (
    <div key={item.id} className="flex min-w-0 items-center gap-3 border-t border-brand-borderLight py-3 first:border-0">
      <ProfileAvatar src={item.profile?.avatar_url} name={item.profile?.full_name} className="h-10 w-10 shrink-0 text-xs" />
      {identity(item)}
      {actions}
    </div>
  );

  return (
    <main className="min-h-screen bg-brand-ivory px-4 py-8 pb-24">
      <div className="mx-auto max-w-2xl">
        <div className="flex items-center gap-3">
          <span className="grid h-10 w-10 place-items-center rounded-xl bg-brand-indigo/10 text-brand-indigo"><UserRound className="h-5 w-5" /></span>
          <div><h1 className="text-h2 font-extrabold text-brand-midnight">My network</h1><p className="text-body-sm text-brand-slate">Professional connections are separate from who you follow.</p></div>
        </div>
        {error && <p className="mt-3 text-body-sm text-brand-coral">{error}</p>}
        <section className="mt-5 rounded-2xl border border-brand-borderLight bg-white p-4 shadow-soft">
          <h2 className="font-bold text-brand-midnight">Requests</h2>
          {loading ? <Loader2 className="mx-auto my-5 h-5 w-5 animate-spin text-brand-indigo" /> : requests.length ? requests.map((item) => row(item, <div className="flex shrink-0 gap-2"><button disabled={busyId === item.id} onClick={() => updateRequest(item.id, "accept")} className="rounded-lg bg-brand-indigo px-3 py-2 text-caption font-bold text-white disabled:opacity-60">Accept</button><button disabled={busyId === item.id} onClick={() => updateRequest(item.id, "reject")} className="rounded-lg border border-brand-borderLight px-3 py-2 text-caption font-bold text-brand-slate disabled:opacity-60">Decline</button></div>)) : <p className="mt-3 text-body-sm text-brand-slate">No pending requests.</p>}
        </section>
        <section className="mt-5 rounded-2xl border border-brand-borderLight bg-white p-4 shadow-soft">
          <h2 className="font-bold text-brand-midnight">Connections</h2>
          {loading ? <Loader2 className="mx-auto my-5 h-5 w-5 animate-spin text-brand-indigo" /> : connections.length ? connections.map((item) => row(item, <div className="flex shrink-0 flex-col items-end gap-1"><Link href={item.profile?.username ? `/u/${item.profile.username}` : "/network"} className="text-caption font-bold text-brand-indigo">View profile</Link><button disabled={busyId === item.id} onClick={() => disconnect(item)} className="text-caption font-semibold text-brand-slate disabled:opacity-60">Disconnect</button></div>)) : <p className="mt-3 text-body-sm text-brand-slate">Your accepted professional connections will appear here.</p>}
        </section>
      </div>
    </main>
  );
}
