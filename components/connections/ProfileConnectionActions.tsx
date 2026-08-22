"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Check, UserPlus } from "lucide-react";
import type { ConnectionState } from "@/lib/connections/server";

type Props = {
  profileId: string;
  connectionId?: string;
  initialState: ConnectionState;
  initialFollowing: boolean;
};

export default function ProfileConnectionActions({ profileId, connectionId, initialState, initialFollowing }: Props) {
  const router = useRouter();
  const [state, setState] = useState(initialState);
  const [following, setFollowing] = useState(initialFollowing);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const request = async (url: string, method = "POST") => {
    setBusy(true);
    setError("");
    try {
      const response = await fetch(url, { method });
      const data = await response.json().catch(() => ({}));
      if (data.state) setState(data.state);
      if (!response.ok) throw Error(data.error || "Could not update connection.");
      router.refresh();
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Could not update connection.");
    } finally {
      setBusy(false);
    }
  };

  const follow = async () => {
    setBusy(true);
    setError("");
    try {
      const response = await fetch(`/api/social/follow/profile/${profileId}`, { method: following ? "DELETE" : "POST" });
      if (!response.ok) throw Error("Could not update follow.");
      setFollowing((value) => !value);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Could not update follow.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="flex min-w-0 flex-wrap items-center gap-2">
      {state === "none" && (
        <button disabled={busy} onClick={() => request(`/api/connections/${profileId}`)} className="inline-flex items-center gap-2 rounded-xl bg-brand-indigo px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-60">
          <UserPlus className="h-4 w-4" />
          Connect
        </button>
      )}
      {state === "outgoing_pending" && (
        <>
          <span className="rounded-xl bg-brand-indigo/10 px-3 py-2.5 text-sm font-semibold text-brand-indigo">Pending</span>
          <button disabled={busy} onClick={() => request(`/api/connections/${profileId}`, "DELETE")} className="rounded-xl border border-brand-borderLight px-3 py-2.5 text-sm font-semibold text-brand-slate disabled:opacity-60">Cancel request</button>
        </>
      )}
      {state === "incoming_pending" && connectionId && (
        <>
          <button disabled={busy} onClick={() => request(`/api/connections/${connectionId}/accept`)} className="rounded-xl bg-brand-indigo px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-60">Accept</button>
          <button disabled={busy} onClick={() => request(`/api/connections/${connectionId}/reject`)} className="rounded-xl border border-brand-borderLight px-3 py-2.5 text-sm font-semibold text-brand-slate disabled:opacity-60">Decline</button>
        </>
      )}
      {state === "connected" && (
        <>
          <span className="inline-flex items-center gap-2 rounded-xl bg-brand-indigo/10 px-3 py-2.5 text-sm font-semibold text-brand-indigo"><Check className="h-4 w-4" />Connected</span>
          <button disabled={busy} onClick={() => request(`/api/connections/${profileId}`, "DELETE")} className="rounded-xl border border-brand-borderLight px-3 py-2.5 text-sm font-semibold text-brand-slate disabled:opacity-60">Disconnect</button>
        </>
      )}
      <button disabled={busy} onClick={follow} className="rounded-xl border border-brand-indigo px-4 py-2.5 text-sm font-semibold text-brand-indigo disabled:opacity-60">
        {following ? "Following" : "Follow"}
      </button>
      {error && <p className="basis-full text-caption text-brand-coral">{error}</p>}
    </div>
  );
}
