import { createClient } from "@/lib/supabase/server";
import { accessibleJoxPage, safePost } from "@/lib/social/server";
import VijoxContinuousFeed from "@/components/social/VijoxContinuousFeed";
import type { Post } from "@/components/social/SocialHomeFeed";

export default async function VijoxPage() {
  const session = await createClient(), { data: { user } } = await session.auth.getUser(), page = await accessibleJoxPage(user?.id, undefined, 10);
  return <main className="min-h-screen bg-brand-ivory px-4 py-6 pb-24 sm:py-10"><VijoxContinuousFeed initialItems={await Promise.all(page.posts.map(post => safePost(post, user?.id))) as Post[]} initialCursor={page.nextCursor} authHref={user ? undefined : "/login?next=/social/vijox"} /></main>;
}
