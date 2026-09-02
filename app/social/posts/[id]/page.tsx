import { notFound } from "next/navigation";
import type { Metadata } from "next";
import PostDetailContent from "@/components/social/PostDetailContent";
import type { Post } from "@/components/social/SocialHomeFeed";
import { resolvePostAccess, safePost } from "@/lib/social/server";
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

  const value = await safePost(post);
  const author = value.author?.name || "GigWay member";
  const media = value.media.find((item: any) => item.type === "audio" || item.type === "video");
  const title = value.contentDomain === "jox" ? `Jox by ${author} on GigWay` : value.contentDomain === "glimps" ? `GLIMPS by ${author} on GigWay` : `Post by ${author} on GigWay`;
  const description = snippet(post.body, value.vijoxTranscriptText), url = `${site}/social/posts/${id}`, image = `${url}/opengraph-image`;
  const delivery = media ? `${url}/media/${media.id}/public` : undefined;

  return {
    title, description,
    alternates: { canonical: url },
    openGraph: {
      type: value.contentDomain === "glimps" ? "video.other" : "article", url, title, description,
      siteName: "GigWay — Professional Network & Marketplace",
      images: [{ url: image, width: 1200, height: 630, alt: title }],
      audio: value.contentDomain === "jox" && delivery ? { url: delivery, secureUrl: delivery, type: media?.mimeType } : undefined,
      videos: value.contentDomain === "glimps" && delivery ? { url: delivery, secureUrl: delivery, type: media?.mimeType, width: 1280, height: 720 } : undefined,
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
