import { createClient as createServiceClient } from "@supabase/supabase-js"
import { createClient } from "@/lib/supabase/server"

export type SocialPost = { id:string; author_user_id:string; author_profile_id:string|null; author_organization_id:string|null; body:string|null; post_type:string; visibility:string; status:string; created_at:string; edited_at:string|null; moment_slug?:string|null }
export class SocialFeedStageError extends Error { constructor(public stage:string,public code:string|undefined,message:string){super(message)} }
function requireSocialResult(stage:string,result:unknown){const error=result&&typeof result==="object"&&"error" in result?(result as {error?:{code?:string;message?:string}|null}).error:null;if(error)throw new SocialFeedStageError(stage,error.code,error.message||"Supabase query failed")}

export function socialDb() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url) throw new SocialFeedStageError("social_db","missing_env","NEXT_PUBLIC_SUPABASE_URL")
  if (!key) throw new SocialFeedStageError("social_db","missing_env","SUPABASE_SERVICE_ROLE_KEY")
  return createServiceClient(url, key)
}

export async function requireSocialUser() {
  const sessionDb = await createClient()
  const { data: { user } } = await sessionDb.auth.getUser()
  return user ?? null
}

// Profiles are presently keyed by the authenticated user ID. Keep this lookup in
// one place so a future legacy identity mapping can replace it safely.
export async function resolveProfile(userId:string) {
  const { data } = await socialDb().from("profiles").select("id,full_name,username,avatar_url,tagline,is_verified").eq("id", userId).maybeSingle()
  return data
}

export async function canPostAsOrganization(userId:string, organizationId:string) {
  const profile = await resolveProfile(userId)
  if (!profile) return { allowed:false, profile:null }
  const { data } = await socialDb().from("organization_members").select("member_role").eq("organization_id", organizationId).eq("profile_id", profile.id).eq("status", "active").maybeSingle()
  return { allowed: !!data && ["owner", "admin"].includes(data.member_role), profile }
}

export async function canViewPost(post:SocialPost, viewerId?:string|null) {
  if (post.status !== "published") return false
  if (post.visibility === "public" || post.author_user_id === viewerId) return true
  if (!viewerId) return false
  const db = socialDb()
  if (post.author_profile_id) {
    const { data } = await db.from("profile_follows").select("followed_profile_id").eq("follower_user_id", viewerId).eq("followed_profile_id", post.author_profile_id).maybeSingle()
    return !!data
  }
  if (post.author_organization_id) {
    const { data } = await db.from("organization_follows").select("organization_id").eq("follower_user_id", viewerId).eq("organization_id", post.author_organization_id).maybeSingle()
    return !!data
  }
  return false
}

export async function resolvePostAccess(id:string, viewerId?:string|null) {
  const { data } = await socialDb().from("posts").select("id,author_user_id,author_profile_id,author_organization_id,body,post_type,visibility,status,created_at,edited_at,moment_slug").eq("id", id).maybeSingle()
  if (!data || !(await canViewPost(data as SocialPost, viewerId))) return null
  return data as SocialPost
}

export async function safePost(post:SocialPost, viewerId?:string|null) {
  const db = socialDb()
  const mentionNames=[...new Set((post.body||"").match(/(^|\s)@([a-zA-Z0-9_]{1,32})/g)?.map(x=>x.trim().slice(1).toLowerCase())||[])].slice(0,20)
  const [profileRes, orgRes, likeRes, commentRes, likedRes, savedRes, mediaRes, canManage, repostRes, repostedRes] = await Promise.all([
    post.author_profile_id ? db.from("profiles").select("id,full_name,username,avatar_url,tagline,is_verified").eq("id",post.author_profile_id).maybeSingle() : Promise.resolve({data:null}),
    post.author_organization_id ? db.from("organizations").select("id,name,username,logo_url,tagline,is_verified").eq("id",post.author_organization_id).maybeSingle() : Promise.resolve({data:null}),
    db.from("post_likes").select("post_id",{count:"exact",head:true}).eq("post_id",post.id),
    db.from("post_comments").select("id",{count:"exact",head:true}).eq("post_id",post.id).eq("status","published"),
    viewerId ? db.from("post_likes").select("post_id").eq("post_id",post.id).eq("user_id",viewerId).maybeSingle() : Promise.resolve({data:null}),
    viewerId ? db.from("post_saves").select("post_id").eq("post_id",post.id).eq("user_id",viewerId).maybeSingle() : Promise.resolve({data:null}),
    db.from("post_media").select("id,media_type,storage_path,mime_type,file_name,width,height,duration_seconds,sort_order").eq("post_id",post.id).order("sort_order"),
    viewerId ? canManagePost(post,viewerId) : Promise.resolve(false),
    db.from("post_reposts").select("post_id",{count:"exact",head:true}).eq("post_id",post.id),
    viewerId ? db.from("post_reposts").select("post_id").eq("post_id",post.id).eq("user_id",viewerId).maybeSingle() : Promise.resolve({data:null}),
  ])
  for(const [stage,result] of [["profile_author",profileRes],["organization_author",orgRes],["likes",likeRes],["comments",commentRes],["liked_state",likedRes],["saves",savedRes],["media",mediaRes],["reposts",repostRes],["reposted_state",repostedRes]] as const)requireSocialResult(stage,result)
  const author = profileRes.data ? { type:"profile", id:profileRes.data.id, name:profileRes.data.full_name, username:profileRes.data.username, avatar:profileRes.data.avatar_url, tagline:profileRes.data.tagline, verified:profileRes.data.is_verified } : orgRes.data ? { type:"organization", id:orgRes.data.id, name:orgRes.data.name, username:orgRes.data.username, avatar:orgRes.data.logo_url, tagline:orgRes.data.tagline, verified:orgRes.data.is_verified } : null
  const media=await Promise.all((mediaRes.data||[]).map(async item=>{const result=await db.storage.from(POST_MEDIA_BUCKET).createSignedUrl(item.storage_path,300);requireSocialResult("signed_url",result);return result.data?.signedUrl?{id:item.id,type:item.media_type,url:result.data.signedUrl,fileName:item.file_name,mimeType:item.mime_type,width:item.width,height:item.height,durationSeconds:item.duration_seconds}:null}))
  const follow=viewerId&&!canManage?(post.author_profile_id?await db.from("profile_follows").select("followed_profile_id").eq("follower_user_id",viewerId).eq("followed_profile_id",post.author_profile_id).maybeSingle():post.author_organization_id?await db.from("organization_follows").select("organization_id").eq("follower_user_id",viewerId).eq("organization_id",post.author_organization_id).maybeSingle():{data:null}):{data:null}
  const mentionResult=mentionNames.length?await db.from("profiles").select("username").in("username",mentionNames).eq("profile_completed",true):{data:[]};requireSocialResult("mentions",mentionResult);const mentions=mentionResult.data||[]
  return {id:post.id,body:post.body,postType:post.post_type,visibility:post.visibility,createdAt:post.created_at,editedAt:post.edited_at,momentSlug:post.moment_slug||null,author,media:media.filter(Boolean),likeCount:likeRes.count||0,commentCount:commentRes.count||0,repostCount:repostRes.count||0,isRepostedByMe:!!repostedRes.data,canRepost:!!viewerId&&!canManage,isLikedByMe:!!likedRes.data,isSavedByMe:!!savedRes.data,canEdit:canManage,canDelete:canManage,canManageVisibility:canManage,canFollow:!!viewerId&&!canManage&&!!author,isFollowing:!!follow.data,canReport:!!viewerId&&!canManage,mentions:mentions.map(x=>x.username)}
}

/** Adds a deliberately small discussion sample to a page of already-safe posts.
 * This is one comments query and one identity query for the whole page, never one
 * browser request (or API call) per card. */
export async function withReplyPreviews<T extends { id:string }>(posts:T[]) {
  if (!posts.length) return posts.map(post => ({ ...post, replyPreview: [] as const }))
  const db=socialDb(), ids=posts.map(post=>post.id)
  const {data: comments,error}=await db.from("post_comments").select("id,post_id,user_id,body,created_at").in("post_id",ids).eq("status","published").is("parent_comment_id",null).order("created_at",{ascending:false})
  requireSocialResult("reply_previews",{error})
  const selected=new Map<string, typeof comments>()
  for(const comment of comments||[]){const list=selected.get(comment.post_id)||[];if(list.length<2){list.push(comment);selected.set(comment.post_id,list)}}
  const userIds=[...new Set((comments||[]).filter(comment=>(selected.get(comment.post_id)||[]).some(item=>item.id===comment.id)).map(comment=>comment.user_id))]
  const {data: profiles,error: profileError}=userIds.length?await db.from("profiles").select("id,full_name,username,avatar_url,is_verified").in("id",userIds):{data:[],error:null}
  requireSocialResult("reply_preview_authors",{error:profileError})
  const authors=new Map((profiles||[]).map(profile=>[profile.id,profile]))
  return posts.map(post=>({...post,replyPreview:(selected.get(post.id)||[]).reverse().map(comment=>{const author=authors.get(comment.user_id);return{id:comment.id,body:comment.body,createdAt:comment.created_at,author:author?{id:author.id,name:author.full_name,username:author.username,avatar:author.avatar_url,verified:author.is_verified}:null}})}))
}

export function plainText(value:unknown, max:number, min=1) {
  if (typeof value !== "string") return null
  const text=value.trim()
  if (text.length < min || text.length > max || /<[^>]*>/.test(text)) return null
  return text
}

export const POST_MEDIA_BUCKET = "post-media"
export const MEDIA_RULES = {
  "image/jpeg": { type:"image", extension:"jpg", extensions:["jpg","jpeg"], max:10*1024*1024 },
  "image/png": { type:"image", extension:"png", extensions:["png"], max:10*1024*1024 },
  "image/webp": { type:"image", extension:"webp", extensions:["webp"], max:10*1024*1024 },
  "video/mp4": { type:"video", extension:"mp4", extensions:["mp4"], max:100*1024*1024 },
  "video/webm": { type:"video", extension:"webm", extensions:["webm"], max:100*1024*1024 },
  "application/pdf": { type:"document", extension:"pdf", extensions:["pdf"], max:20*1024*1024 },
  "audio/webm": { type:"audio", extension:"webm", extensions:["webm"], max:10*1024*1024 },
} as const
export type MediaType = "image"|"video"|"document"|"audio"

export function validMediaMetadata(fileName:unknown,mimeType:unknown,size:unknown) {
  if(typeof fileName!=="string"||typeof mimeType!=="string"||typeof size!=="number"||!Number.isSafeInteger(size)||size<1)return null
  const rule=MEDIA_RULES[mimeType as keyof typeof MEDIA_RULES]; if(!rule||size>rule.max)return null
  const extension=fileName.trim().split(".").pop()?.toLowerCase(); if(!rule.extensions.includes(extension as never))return null
  return rule
}

export function validMediaDimensions(width:unknown,height:unknown,durationSeconds:unknown,type:MediaType) {
  const validDimension=(value:unknown)=>typeof value==="number"&&Number.isSafeInteger(value)&&value>0&&value<=16384
  const validDuration=(value:unknown)=>typeof value==="number"&&Number.isSafeInteger(value)&&value>0&&value<=86400
  if (width===undefined&&height===undefined&&durationSeconds===undefined) return {}
  if (!validDimension(width)||!validDimension(height)||(type==="video"&&!validDuration(durationSeconds))||(type!=="video"&&durationSeconds!==undefined)) return null
  return {width,height,duration_seconds:type==="video"?durationSeconds:null}
}

export async function canManagePost(post:{author_user_id:string;author_organization_id:string|null},userId:string) {
  if(post.author_organization_id)return (await canPostAsOrganization(userId,post.author_organization_id)).allowed
  return post.author_user_id===userId
}

export async function updatePostType(postId:string) {
  const db=socialDb(); const {data}=await db.from("post_media").select("media_type").eq("post_id",postId)
  const types=new Set((data||[]).map(x=>x.media_type)); const post_type=types.size===0?"text":types.size>1?"mixed":types.has("image")?"image":types.has("video")?"video":types.has("audio")?"audio":"document"
  await db.from("posts").update({post_type,updated_at:new Date().toISOString()}).eq("id",postId)
  return post_type
}
