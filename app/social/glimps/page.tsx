import { createClient } from "@/lib/supabase/server";
import { accessibleGlimpsPage, resolvePostAccess, safePost } from "@/lib/social/server";
import GlimpsFeed from "@/components/social/GlimpsFeed";
import type { Post } from "@/components/social/SocialHomeFeed";

export default async function GlimpsPage({ searchParams }: { searchParams: Promise<{ post?: string }> }) {
  const session = await createClient(), { data: { user } } = await session.auth.getUser();
  const requested = (await searchParams).post, page = await accessibleGlimpsPage(user?.id, undefined, 10), selected = requested ? await resolvePostAccess(requested, user?.id) : null, validSelected = selected?.content_format === "glimps" ? selected : null;
  const raw = validSelected ? [validSelected, ...page.posts.filter((post) => post.id !== validSelected.id)] : page.posts;
  return <main className="min-h-screen overflow-hidden bg-brand-ivory"><GlimpsFeed initialItems={await Promise.all(raw.map((post) => safePost(post, user?.id))) as Post[]} initialCursor={page.nextCursor} initialActiveId={validSelected?.id} authHref={user ? undefined : "/login?next=/social/glimps"} /></main>;
}
