import { NextRequest, NextResponse } from "next/server";
import { canViewPost, requireSocialUser, socialDb } from "@/lib/social/server";
import { isStandardPost } from "@/lib/social/content-domain";

export async function POST(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await requireSocialUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params, db = socialDb();
  const { data: post } = await db.from("posts").select("id,status,visibility,author_user_id,author_profile_id,author_organization_id,content_format").eq("id", id).maybeSingle();
  if (!post || !isStandardPost(post.content_format) || !await canViewPost(post as Parameters<typeof canViewPost>[0], user.id)) return NextResponse.json({ error: "Post not found." }, { status: 404 });
  const { data, error } = await db.rpc("increment_social_post_view", { target_post_id: id });
  if (error) return NextResponse.json({ error: "Could not record view." }, { status: 503 });
  return NextResponse.json({ viewCount: data });
}
