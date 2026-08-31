import { NextRequest, NextResponse } from "next/server";
import { canManagePost, isValidJoxMedia, requireSocialUser, socialDb, validGlimpsMedia } from "@/lib/social/server";

export async function POST(_req:NextRequest,{params}:{params:Promise<{id:string}>}) {
  const user=await requireSocialUser(); if(!user)return NextResponse.json({error:"Unauthorized"},{status:401});
  const {id}=await params, db=socialDb(), {data:post}=await db.from("posts").select("id,author_user_id,author_organization_id,body,vijox_transcript_text,content_format").eq("id",id).maybeSingle();
  if(!post)return NextResponse.json({error:"Post not found."},{status:404}); if(!await canManagePost(post,user.id))return NextResponse.json({error:"You cannot publish this post."},{status:403});
  const {data:media,count}=await db.from("post_media").select("media_type,mime_type,file_size_bytes,duration_seconds",{count:"exact"}).eq("post_id",id), hasVijox=(media||[]).some(item=>isValidJoxMedia(item.media_type,item.mime_type));
  if(!post.body&&!count)return NextResponse.json({error:"Add text or media before publishing."},{status:400});
  if(post.vijox_transcript_text&&!hasVijox)return NextResponse.json({error:"A VIJOX transcript can only be published with a VIJOX recording."},{status:400});
  if(post.content_format==="vijox"&&!hasVijox)return NextResponse.json({error:"A VIJOX requires a valid Jox recording."},{status:400});
  if(post.content_format==="glimps"&&!validGlimpsMedia(media||[]))return NextResponse.json({error:"A GLIMPS requires one MP4 video of 60 seconds or less and no more than 100 MB."},{status:400});
  const {error}=await db.from("posts").update({status:"published",updated_at:new Date().toISOString()}).eq("id",id); if(error)return NextResponse.json({error:"Could not publish post."},{status:503}); return NextResponse.json({success:true});
}
