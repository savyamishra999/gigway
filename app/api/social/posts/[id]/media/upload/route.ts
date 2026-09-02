import { NextRequest, NextResponse } from "next/server";
import { canManagePost, POST_MEDIA_BUCKET, requireSocialUser, socialDb, validMediaMetadata } from "@/lib/social/server";
import { allowsMediaComposition, isValidGlimpsVideoMime, toContentDomain } from "@/lib/social/content-domain";

export async function POST(req:NextRequest,{params}:{params:Promise<{id:string}>}) {
  const user=await requireSocialUser(); if(!user)return NextResponse.json({error:"Unauthorized"},{status:401});
  const {id}=await params, body=await req.json().catch(()=>({})), size=body.fileSize??body.size, rule=validMediaMetadata(body.fileName,body.mimeType,size);
  if(!rule)return NextResponse.json({error:"Only JPG, PNG, WebP (10 MB), MP4/WebM (100 MB), PDF (20 MB), or VIJOX audio (10 MB) files are allowed."},{status:400});
  const db=socialDb(),{data:post}=await db.from("posts").select("id,author_user_id,author_organization_id,status,content_format").eq("id",id).maybeSingle();
  if(!post||!["published","hidden"].includes(post.status))return NextResponse.json({error:"Post not found."},{status:404}); if(!await canManagePost(post,user.id))return NextResponse.json({error:"You cannot add media to this post."},{status:403});
  const domain=toContentDomain(post.content_format); if(!domain)return NextResponse.json({error:"Invalid post format."},{status:400});
  if(domain==="glimps"&&(rule.type!=="video"||!isValidGlimpsVideoMime(body.mimeType)))return NextResponse.json({error:"A GLIMPS requires an MP4 or WebM video."},{status:400});
  const {data:existing}=await db.from("post_media").select("media_type").eq("post_id",id),current=(existing||[]).map(x=>x.media_type);
  const allowed=allowsMediaComposition(domain,[...current.map(type=>({type})),{type:rule.type,mimeType:body.mimeType}]);
  if(current.length>=5)return NextResponse.json({error:"A post can have at most five attachments."},{status:400}); if(!allowed)return NextResponse.json({error:domain==="post"?"A normal Post cannot contain Jox audio.":"This attachment does not fit the selected content format."},{status:400});
  const folder=post.author_organization_id?`organizations/${post.author_organization_id}/${id}`:`users/${user.id}/${id}`,path=`${folder}/${crypto.randomUUID()}.${rule.extension}`,{data,error}=await db.storage.from(POST_MEDIA_BUCKET).createSignedUploadUrl(path);
  if(error||!data)return NextResponse.json({error:"Could not prepare the secure upload."},{status:503}); return NextResponse.json({path:data.path,token:data.token,signedUrl:data.signedUrl,method:"PUT",headers:{"content-type":body.mimeType},expiresInSeconds:120,file:{name:body.fileName.trim().slice(0,255),mimeType:body.mimeType,size,type:rule.type}});
}
