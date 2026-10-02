import "server-only";
import { createClient } from "@/lib/supabase/server";
import { compactIntentLabels } from "@/lib/identity";
export type DiscoveryKind = "people" | "workplaces";
export type NetworkPerson = { id: string; name: string; href: string; image?: string | null; tagline?: string | null; skills: string[]; intents: string[]; following: boolean };
export async function networkDiscovery(kind: DiscoveryKind, viewerId: string, limit: 6 | 18 = 18, search = ""): Promise<NetworkPerson[]> {
  const db = await createClient(), people = kind === "people";
  let query = people ? db.from("profiles").select("id,full_name,username,avatar_url,tagline,skills").eq("profile_completed", true).neq("id", viewerId) : db.from("organizations").select("id,name,username,logo_url,tagline,industry");
  query = query.not("username", "is", null);
  const term = search.trim().slice(0, 80).replace(/[^\p{L}\p{N}\s@-]/gu, " ");
  if (term.trim()) query = query.or(people ? `full_name.ilike.%${term}%,username.ilike.%${term}%,tagline.ilike.%${term}%` : `name.ilike.%${term}%,username.ilike.%${term}%,tagline.ilike.%${term}%,industry.ilike.%${term}%`);
  const { data, error } = await query.order("created_at", { ascending: false }).order("id", { ascending: false }).limit(limit);
  if (error) throw error;
  const rows = (data || []).slice(0, limit), ids = rows.map((row: any) => row.id);
  if (!ids.length) return [];
  const field = people ? "followed_profile_id" : "organization_id";
  const [follows, intents] = await Promise.all([
    db.from(people ? "profile_follows" : "organization_follows").select(field).eq("follower_user_id", viewerId).in(field, ids),
    people ? db.from("profile_intents").select("profile_id,intent_type").in("profile_id", ids).eq("is_active", true) : Promise.resolve({ data: [], error: null }),
  ]);
  if (follows.error || intents.error) throw follows.error || intents.error;
  const followed = new Set((follows.data || []).map((row: any) => row[field]));
  return rows.map((row: any) => ({ id: row.id, name: people ? row.full_name || "Professional" : row.name, href: `/u/${row.username}`, image: people ? row.avatar_url : row.logo_url, tagline: row.tagline || (!people ? row.industry : null), skills: people ? (row.skills || []).slice(0, 2) : [], intents: people ? compactIntentLabels((intents.data || []).filter((i: any) => i.profile_id === row.id).map((i: any) => i.intent_type)) : [], following: followed.has(row.id) }));
}
