"use client";
import { useState } from "react";
import { boundedFetch } from "@/lib/async";
import type { DiscoveryKind } from "@/lib/network/discovery";

export default function DiscoveryFollowButton({ id, name, kind, initialFollowing }: { id: string; name: string; kind: DiscoveryKind; initialFollowing: boolean }) {
  const [following, setFollowing] = useState(initialFollowing), [busy, setBusy] = useState(false), [error, setError] = useState("");
  async function follow() {
    setBusy(true); setError("");
    try {
      const response = await boundedFetch(`/api/social/follow/${kind === "people" ? "profile" : "organization"}/${id}`, { method: following ? "DELETE" : "POST" });
      if (!response.ok) throw Error();
      setFollowing(!following);
    } catch { setError("Could not update follow. Please try again."); }
    finally { setBusy(false); }
  }
  return <><button disabled={busy} onClick={follow} aria-label={`${following ? "Unfollow" : "Follow"} ${name}`} className="mt-4 w-full rounded-xl border border-brand-indigo/25 px-3 py-2 text-caption font-bold text-brand-indigo disabled:opacity-60">{busy ? "Working..." : following ? "Following" : "Follow"}</button>{error && <p role="alert" className="mt-2 text-caption text-brand-coral">{error}</p>}</>;
}
