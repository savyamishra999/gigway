import { notFound, redirect } from "next/navigation";
import PostDetailContent from "@/components/social/PostDetailContent";
import type { Post } from "@/components/social/SocialHomeFeed";
import { createClient } from "@/lib/supabase/server";
import { resolvePostAccess, safePost } from "@/lib/social/server";
import type { Metadata } from "next";

const site="https://gigway.in";
function snippet(body:string|null){const text=(body||"").replace(/<[^>]*>/g,"").replace(/\s+/g," ").trim();return text?text.slice(0,180):"View this post on GigWay."}
export async function generateMetadata({params}:{params:Promise<{id:string}>}):Promise<Metadata>{const{id}=await params;const post=await resolvePostAccess(id);if(!post||post.visibility!=="public")return{title:"GigWay — Professional Network & Marketplace",robots:{index:false,follow:false}};const value=await safePost(post);const author=value.author?.name||"GigWay member",title=`${author}${value.author?.username?` (@${value.author.username})`:""} on GigWay`,description=snippet(post.body),url=`${site}/social/posts/${id}`,image=`${url}/opengraph-image`;return{title,description,alternates:{canonical:url},openGraph:{type:"article",url,title,description,siteName:"GigWay — Professional Network & Marketplace",images:[{url:image,width:1200,height:630,alt:title}]},twitter:{card:"summary_large_image",title,description,images:[image]}}}

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
