import { notFound, redirect } from "next/navigation";
import PostDetailContent from "@/components/social/PostDetailContent";
import type { Post } from "@/components/social/SocialHomeFeed";
import { createClient } from "@/lib/supabase/server";
import { resolvePostAccess, safePost } from "@/lib/social/server";

export default async function PostDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const db = await createClient();
  const { data: { user } } = await db.auth.getUser();
  if (!user) redirect(`/login?next=/social/posts/${id}`);
  const post = await resolvePostAccess(id, user.id);
  if (!post) notFound();
  const value = await safePost(post, user.id);
  return <PostDetailContent post={value as Post} viewerId={user.id} />;
}
