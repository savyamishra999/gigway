import "server-only";
import type { FeedItem } from "@/components/social/SocialHomeFeed";
import { socialDb, SOCIAL_POST_FIELDS, visiblePosts, safePosts, withReplyPreviews, enrichPostsWithVijoxTimedReactions, type SocialPost } from "@/lib/social/server";

// Same first-page selection/visibility/serialization as the frozen discover API.
// Server rendering avoids an internal HTTP/auth round trip and hydration waterfall.
export async function initialHomePosts(viewerId: string): Promise<{ items: FeedItem[]; nextCursor: string | null }> {
  const { data, error } = await socialDb().from("posts").select(SOCIAL_POST_FIELDS)
    .eq("status", "published").eq("content_format", "standard")
    .order("created_at", { ascending: false }).order("id", { ascending: false }).limit(16);
  if (error) throw error;
  const accessible = await visiblePosts((data || []) as SocialPost[], viewerId);
  const page = accessible.slice(0, 15);
  const serialized = (await withReplyPreviews(await safePosts(page, viewerId))).map(post => ({ ...post, replyPreview: [...post.replyPreview] }));
  const items = await enrichPostsWithVijoxTimedReactions(serialized, viewerId);
  const marker = page.at(-1);
  return { items: items as FeedItem[], nextCursor: accessible.length > 15 && marker ? `${marker.created_at}|${marker.id}` : null };
}
