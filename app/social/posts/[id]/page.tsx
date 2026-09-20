import { toContentDomain } from "@/lib/social/content-domain";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import PostDetailContent from "@/components/social/PostDetailContent";
import type { Post } from "@/components/social/SocialHomeFeed";
import { resolvePostAccess, safePost, socialDb } from "@/lib/social/server";
import { createClient } from "@/lib/supabase/server";

const site = "https://gigway.in";
const snippet = (body: string | null, transcript?: string | null) => {
  const text = (body || "").replace(/<[^>]*>/g, "").replace(/\s+/g, " ").trim();
  const spoken = (transcript || "").replace(/\s+/g, " ").trim();
  return text ? text.slice(0, 180) : spoken ? spoken.slice(0, 180) : "Listen to this Jox on GigWay.";
};

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  const post = await resolvePostAccess(id);
  if (!post || post.visibility !== "public") return { title: "GigWay — Professional Network & Marketplace", robots: { index: false, follow: false } };

  // Metadata needs author and media identity, not engagement counts, viewer
  // state, or signed media URLs. Access above remains public-only.
  const db = socialDb()
  const [profile, organization, mediaResult] = await Promise.all([
    post.author_profile_id ? db.from("profiles").select("full_name").eq("id", post.author_profile_id).maybeSingle() : Promise.resolve({ data: null }),
    post.author_organization_id ? db.from("organizations").select("name").eq("id", post.author_organization_id).maybeSingle() : Promise.resolve({ data: null }),
    db.from("post_media").select("id,media_type,mime_type").eq("post_id", post.id).order("sort_order"),
  ])
  const author = profile.data?.full_name || organization.data?.name || "GigWay member"
  const contentDomain = toContentDomain(post.content_format)
  const media = mediaResult.data?.find(item => item.media_type === "audio" || item.media_type === "video")
  const title = contentDomain === "jox" ? `Jox by ${author} on GigWay` : contentDomain === "glimps" ? `GLIMPS by ${author} on GigWay` : `Post by ${author} on GigWay`
  const description = snippet(post.body, post.vijox_transcript_text), url = `${site}/social/posts/${id}`, image = `${url}/opengraph-image`
  const delivery = media ? `${url}/media/${media.id}/public` : undefined

  return {
    title, description,
    alternates: { canonical: url },
    openGraph: {
      type: contentDomain === "glimps" ? "video.other" : "article", url, title, description,
      siteName: "GigWay — Professional Network & Marketplace",
      images: [{ url: image, width: 1200, height: 630, alt: title }],
      audio: contentDomain === "jox" && delivery ? { url: delivery, secureUrl: delivery, type: media?.mime_type } : undefined,
      videos: contentDomain === "glimps" && delivery ? { url: delivery, secureUrl: delivery, type: media?.mime_type, width: 1280, height: 720 } : undefined,
    },
    twitter: { card: "summary_large_image", title, description, images: [image] },
  };
}

export default async function PostDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const db = await createClient();
  const { data: { user } } = await db.auth.getUser();
  const post = await resolvePostAccess(id, user?.id);
  if (!post || post.visibility !== "public" && !user) notFound();
  const value = await safePost(post, user?.id);
  return <PostDetailContent post={value as Post} viewerId={user?.id} />;
}
