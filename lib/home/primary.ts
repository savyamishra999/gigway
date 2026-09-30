import "server-only";
import type { FeedItem } from "@/components/social/SocialHomeFeed";
import { accessibleDiscoverPage, safePosts, withReplyPreviews, enrichPostsWithVijoxTimedReactions } from "@/lib/social/server";

// Shared first-page traversal/visibility contract with the discover API.
// Server rendering avoids an internal HTTP/auth round trip and hydration waterfall.
export async function initialHomePosts(viewerId: string): Promise<{ items: FeedItem[]; nextCursor: string | null }> {
  const { posts: page, nextCursor } = await accessibleDiscoverPage(viewerId);
  const serialized = (await withReplyPreviews(await safePosts(page, viewerId))).map(post => ({ ...post, replyPreview: [...post.replyPreview] }));
  const items = await enrichPostsWithVijoxTimedReactions(serialized, viewerId);
  return { items: items as FeedItem[], nextCursor };
}
