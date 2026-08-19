import { createClient as createServiceClient } from "@supabase/supabase-js"
import { createClient } from "@/lib/supabase/server"

export type SocialPost = { id:string; author_user_id:string; author_profile_id:string|null; author_organization_id:string|null; body:string|null; post_type:string; visibility:string; status:string; created_at:string; edited_at:string|null }

export function socialDb() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) throw new Error("Social server configuration is unavailable")
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
  const { data } = await socialDb().from("posts").select("id,author_user_id,author_profile_id,author_organization_id,body,post_type,visibility,status,created_at,edited_at").eq("id", id).maybeSingle()
  if (!data || !(await canViewPost(data as SocialPost, viewerId))) return null
  return data as SocialPost
}

export async function safePost(post:SocialPost, viewerId?:string|null) {
  const db = socialDb()
  const [profileRes, orgRes, likeRes, commentRes, likedRes, savedRes, mediaRes, canManage] = await Promise.all([
    post.author_profile_id ? db.from("profiles").select("id,full_name,username,avatar_url,tagline,is_verified").eq("id",post.author_profile_id).maybeSingle() : Promise.resolve({data:null}),
    post.author_organization_id ? db.from("organizations").select("id,name,username,logo_url,tagline,is_verified").eq("id",post.author_organization_id).maybeSingle() : Promise.resolve({data:null}),
    db.from("post_likes").select("post_id",{count:"exact",head:true}).eq("post_id",post.id),
    db.from("post_comments").select("id",{count:"exact",head:true}).eq("post_id",post.id).eq("status","published"),
    viewerId ? db.from("post_likes").select("post_id").eq("post_id",post.id).eq("user_id",viewerId).maybeSingle() : Promise.resolve({data:null}),
    viewerId ? db.from("post_saves").select("post_id").eq("post_id",post.id).eq("user_id",viewerId).maybeSingle() : Promise.resolve({data:null}),
    db.from("post_media").select("id,media_type,storage_path,mime_type,file_name,width,height,duration_seconds,sort_order").eq("post_id",post.id).order("sort_order"),
    viewerId ? canManagePost(post,viewerId) : Promise.resolve(false),
  ])
  const author = profileRes.data ? { type:"profile", id:profileRes.data.id, name:profileRes.data.full_name, username:profileRes.data.username, avatar:profileRes.data.avatar_url, tagline:profileRes.data.tagline, verified:profileRes.data.is_verified } : orgRes.data ? { type:"organization", id:orgRes.data.id, name:orgRes.data.name, username:orgRes.data.username, avatar:orgRes.data.logo_url, tagline:orgRes.data.tagline, verified:orgRes.data.is_verified } : null
  const media=await Promise.all((mediaRes.data||[]).map(async item=>{const {data}=await db.storage.from(POST_MEDIA_BUCKET).createSignedUrl(item.storage_path,300);return data?.signedUrl?{id:item.id,type:item.media_type,url:data.signedUrl,fileName:item.file_name,mimeType:item.mime_type,width:item.width,height:item.height,durationSeconds:item.duration_seconds}:null}))
  const follow=viewerId&&!canManage?(post.author_profile_id?await db.from("profile_follows").select("followed_profile_id").eq("follower_user_id",viewerId).eq("followed_profile_id",post.author_profile_id).maybeSingle():post.author_organization_id?await db.from("organization_follows").select("organization_id").eq("follower_user_id",viewerId).eq("organization_id",post.author_organization_id).maybeSingle():{data:null}):{data:null}
  return { id:post.id, body:post.body, postType:post.post_type, visibility:post.visibility, createdAt:post.created_at, editedAt:post.edited_at, author, media:media.filter(Boolean), likeCount:likeRes.count||0, commentCount:commentRes.count||0, isLikedByMe:!!likedRes.data, isSavedByMe:!!savedRes.data, canEdit:canManage, canDelete:canManage, canManageVisibility:canManage, canFollow:!!viewerId&&!canManage&&!!author, isFollowing:!!follow.data, canReport:!!viewerId&&!canManage }
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
} as const
export type MediaType = "image"|"video"|"document"

export function validMediaMetadata(fileName:unknown,mimeType:unknown,size:unknown) {
  if(typeof fileName!=="string"||typeof mimeType!=="string"||typeof size!=="number"||!Number.isSafeInteger(size)||size<1)return null
  const rule=MEDIA_RULES[mimeType as keyof typeof MEDIA_RULES]; if(!rule||size>rule.max)return null
  const extension=fileName.trim().split(".").pop()?.toLowerCase(); if(!rule.extensions.includes(extension as never))return null
  return rule
}

export async function canManagePost(post:{author_user_id:string;author_organization_id:string|null},userId:string) {
  if(post.author_organization_id)return (await canPostAsOrganization(userId,post.author_organization_id)).allowed
  return post.author_user_id===userId
}

export async function updatePostType(postId:string) {
  const db=socialDb(); const {data}=await db.from("post_media").select("media_type").eq("post_id",postId)
  const types=new Set((data||[]).map(x=>x.media_type)); const post_type=types.size===0?"text":types.size>1?"mixed":types.has("image")?"image":types.has("video")?"video":"document"
  await db.from("posts").update({post_type,updated_at:new Date().toISOString()}).eq("id",postId)
  return post_type
}
