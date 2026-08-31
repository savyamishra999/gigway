import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { socialDb } from "@/lib/social/server";
import GlimpsCreateComposer from "@/components/social/GlimpsCreateComposer";

export default async function CreateGlimpsPage() {
  const session = await createClient(), { data: { user } } = await session.auth.getUser();
  if (!user) redirect("/login?next=/social/glimps/create");
  const db = socialDb();
  const [{ data: profile }, { data: memberships }] = await Promise.all([db.from("profiles").select("id,full_name,avatar_url").eq("id", user.id).maybeSingle(), db.from("organization_members").select("organization_id").eq("profile_id", user.id).eq("status", "active").in("member_role", ["owner", "admin"])]);
  if (!profile) redirect("/profile/complete");
  const ids = (memberships || []).map((membership) => membership.organization_id), { data: organizations } = ids.length ? await db.from("organizations").select("id,name,logo_url").in("id", ids) : { data: [] };
  return <main className="min-h-screen bg-brand-ivory px-4 py-6 pb-28 sm:py-10"><div className="mx-auto max-w-2xl"><GlimpsCreateComposer profile={{ name: profile.full_name || "My profile", avatar: profile.avatar_url }} organizations={(organizations || []).map((organization) => ({ id: organization.id, name: organization.name, avatar: organization.logo_url }))} /></div></main>;
}
