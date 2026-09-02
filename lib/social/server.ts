import { createClient as createServiceClient } from "@supabase/supabase-js"
import { createClient } from "@/lib/supabase/server"
import { aggregateVijoxTimedReactions, type VijoxTimedReactionRow, zeroVijoxTimedReactionSummary } from "@/lib/social/vijox-timed-reactions"
import { isJox, isValidGlimpsVideoMime, parsePersistedContentFormat, toContentDomain, type ContentDomain, type PersistedContentFormat } from "@/lib/social/content-domain"

export type SocialContentFormat = PersistedContentFormat
export const SOCIAL_POST_FIELDS = "id,author_user_id,author_profile_id,author_organization_id,body,content_format,visibility,status,created_at,edited_at,moment_slug,vijox_transcript_text,vijox_transcript_segments"
export type SocialPost = { id:string; author_user_id:string; author_profile_id:string|null; author_organization_id:string|null; body:string|null; content_format?:SocialContentFormat|null; visibility:string; status:string; created_at:string; edited_at:string|null; moment_slug?:string|null; vijox_transcript_text?:string|null; vijox_transcript_segments?:unknown }
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
  const { data } = await socialDb().from("posts").select(SOCIAL_POST_FIELDS).eq("id", id).maybeSingle()
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
  const media=await Promise.all((mediaRes.data||[]).map(async item=>{const publicDelivery=post.visibility==="public"&&["audio","video"].includes(item.media_type);const result=publicDelivery?null:await db.storage.from(POST_MEDIA_BUCKET).createSignedUrl(item.storage_path,300);if(result)requireSocialResult("signed_url",result);const url=publicDelivery?`/social/posts/${post.id}/media/${item.id}/public`:result?.data?.signedUrl;return url?{id:item.id,type:item.media_type,url,fileName:item.file_name,mimeType:item.mime_type,width:item.width,height:item.height,durationSeconds:item.duration_seconds}:null}))
  const follow=viewerId&&!canManage?(post.author_profile_id?await db.from("profile_follows").select("followed_profile_id").eq("follower_user_id",viewerId).eq("followed_profile_id",post.author_profile_id).maybeSingle():post.author_organization_id?await db.from("organization_follows").select("organization_id").eq("follower_user_id",viewerId).eq("organization_id",post.author_organization_id).maybeSingle():{data:null}):{data:null}
  const mentionResult=mentionNames.length?await db.from("profiles").select("username").in("username",mentionNames).eq("profile_completed",true):{data:[]};requireSocialResult("mentions",mentionResult);const mentions=mentionResult.data||[]
  const contentFormat=parsePersistedContentFormat(post.content_format)||"standard";
  return {id:post.id,body:post.body,contentFormat,contentDomain:toContentDomain(contentFormat)!,visibility:post.visibility,createdAt:post.created_at,editedAt:post.edited_at,momentSlug:post.moment_slug||null,vijoxTranscriptText:post.vijox_transcript_text||null,vijoxTranscriptSegments:validVijoxTranscriptSegments(post.vijox_transcript_segments),author,media:media.filter(Boolean),likeCount:likeRes.count||0,commentCount:commentRes.count||0,repostCount:repostRes.count||0,isRepostedByMe:!!repostedRes.data,canRepost:!!viewerId&&!canManage,isLikedByMe:!!likedRes.data,isSavedByMe:!!savedRes.data,canEdit:canManage,canDelete:canManage,canManageVisibility:canManage,canFollow:!!viewerId&&!canManage&&!!author,isFollowing:!!follow.data,canReport:!!viewerId&&!canManage,mentions:mentions.map(x=>x.username)}
}

export const MAX_VIJOX_TRANSCRIPT_LENGTH = 2000
export type VijoxTranscriptSegment = { startMs:number; endMs:number; text:string }
export function validVijoxTranscriptSegments(value:unknown): VijoxTranscriptSegment[] | null {
  if (!Array.isArray(value) || value.length > 120) return null
  const segments=value.map(item=>item&&typeof item==="object"?item as Record<string,unknown>:null)
  if (segments.some(segment=>!segment||!Number.isInteger(segment.startMs)||!Number.isInteger(segment.endMs)||typeof segment.text!=="string"||!segment.text.trim()||segment.text.length>300||(segment.startMs as number)<0||(segment.endMs as number)<=(segment.startMs as number)||(segment.endMs as number)>27000)) return null
  return segments.map(segment=>({startMs:segment!.startMs as number,endMs:segment!.endMs as number,text:(segment!.text as string).trim()}))
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

/** Adds reaction summaries to already-authorized serialized VIJOX posts in one query. */
export async function enrichPostsWithVijoxTimedReactions<T extends { id:string; contentDomain?: ContentDomain; contentFormat?: SocialContentFormat; media?: Array<{ type?: string; mimeType?: string | null } | null> }>(posts:T[], viewerUserId?:string|null) {
  const ids=[...new Set(posts.filter(post=>isJox(post.contentDomain||post.contentFormat)&&post.media?.some(media=>media&&isValidJoxMedia(media.type,media.mimeType))).map(post=>post.id))]
  if (!ids.length) return posts
  const {data,error}=await socialDb().from("vijox_timed_reactions").select("post_id,reactor_user_id,reaction_type,time_bucket_ms").in("post_id",ids)
  requireSocialResult("vijox_timed_reactions",{error})
  const summaries=aggregateVijoxTimedReactions((data||[]) as VijoxTimedReactionRow[],viewerUserId)
  return posts.map(post=>ids.includes(post.id)?{...post,vijoxTimedReactionSummary:summaries.get(post.id)||zeroVijoxTimedReactionSummary()}:post)
}

export function plainText(value:unknown, max:number, min=1) {
  if (typeof value !== "string") return null
  const text=value.trim()
  if (text.length < min || text.length > max || /<[^>]*>/.test(text)) return null
  return text
}

export const POST_MEDIA_BUCKET = "post-media"
export const GLIMPS_MAX_DURATION_SECONDS = 60
export const GLIMPS_MAX_FILE_SIZE_BYTES = 100 * 1024 * 1024
export function socialContentFormat(value:unknown): SocialContentFormat | null { return parsePersistedContentFormat(value) }
export function validGlimpsMedia(media: Array<{media_type?:unknown;mime_type?:unknown;file_size_bytes?:unknown;duration_seconds?:unknown}>) { if (media.length !== 1) return false; const item=media[0]; return item.media_type === "video" && isValidGlimpsVideoMime(item.mime_type) && typeof item.file_size_bytes === "number" && Number.isSafeInteger(item.file_size_bytes) && item.file_size_bytes > 0 && item.file_size_bytes <= GLIMPS_MAX_FILE_SIZE_BYTES && typeof item.duration_seconds === "number" && Number.isSafeInteger(item.duration_seconds) && item.duration_seconds > 0 && item.duration_seconds <= GLIMPS_MAX_DURATION_SECONDS }
/** Shared, access-aware query foundation for a later GLIMPS feed. */
export async function accessibleGlimps(viewerId?:string|null, limit=16) { const {data,error}=await socialDb().from("posts").select(SOCIAL_POST_FIELDS).eq("content_format","glimps").eq("status","published").order("created_at",{ascending:false}).order("id",{ascending:false}).limit(Math.max(1,Math.min(limit,50))); requireSocialResult("glimps_query",{error}); const visible=[] as SocialPost[]; for(const post of data||[]) if(await canViewPost(post as SocialPost,viewerId)) visible.push(post as SocialPost); return visible }
export async function accessibleGlimpsPage(viewerId?:string|null, cursor?:string|null, limit=10) { const size=Math.max(1,Math.min(limit,20)), fetchSize=size*4+1; let query=socialDb().from("posts").select(SOCIAL_POST_FIELDS).eq("content_format","glimps").eq("status","published").order("created_at",{ascending:false}).order("id",{ascending:false}).limit(fetchSize); if(cursor){const [createdAt,id]=cursor.split("|"); if(!createdAt||!id) throw new SocialFeedStageError("glimps_cursor","invalid_cursor","Invalid cursor"); query=query.or(`created_at.lt.${createdAt},and(created_at.eq.${createdAt},id.lt.${id})`)} const {data,error}=await query; requireSocialResult("glimps_page",{error}); const rows=(data||[]) as SocialPost[], visible=[] as SocialPost[]; for(const post of rows){if(await canViewPost(post,viewerId)) visible.push(post); if(visible.length>size) break} const page=visible.slice(0,size), hasMore=visible.length>size||rows.length===fetchSize, marker=hasMore?(page.length===size?page.at(-1):rows.at(-1)):null; return { posts:page, nextCursor:marker?`${marker.created_at}|${marker.id}`:null } }
export async function accessibleJoxPage(viewerId?:string|null, cursor?:string|null, limit=10) { const size=Math.max(1,Math.min(limit,20)), fetchSize=size*4+1; let query=socialDb().from("posts").select(SOCIAL_POST_FIELDS).eq("content_format","vijox").eq("status","published").order("created_at",{ascending:false}).order("id",{ascending:false}).limit(fetchSize); if(cursor){const [createdAt,id]=cursor.split("|"); if(!createdAt||!id) throw new SocialFeedStageError("jox_cursor","invalid_cursor","Invalid cursor"); query=query.or(`created_at.lt.${createdAt},and(created_at.eq.${createdAt},id.lt.${id})`)} const {data,error}=await query; requireSocialResult("jox_page",{error}); const rows=(data||[]) as SocialPost[], visible=[] as SocialPost[]; for(const post of rows){if(isJox(post.content_format)&&await canViewPost(post,viewerId)) visible.push(post); if(visible.length>size) break} const page=visible.slice(0,size), hasMore=visible.length>size||rows.length===fetchSize, marker=hasMore?(page.length===size?page.at(-1):rows.at(-1)):null; return { posts:page, nextCursor:marker?`${marker.created_at}|${marker.id}`:null } }
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

/** The only persisted audio container accepted as a Jox: WebM, optionally Opus. */
export function isValidJoxMedia(mediaType:unknown,mimeType:unknown) {
  if (mediaType !== "audio" || typeof mimeType !== "string") return false
  const [base,...parameters]=mimeType.toLowerCase().split(";").map(value=>value.trim())
  return base === "audio/webm" && (!parameters.length || parameters.every(parameter=>parameter === "codecs=opus"))
}

export function validMediaMetadata(fileName:unknown,mimeType:unknown,size:unknown) {
  if(typeof fileName!=="string"||typeof mimeType!=="string"||typeof size!=="number"||!Number.isSafeInteger(size)||size<1)return null
  const rule=isValidJoxMedia("audio",mimeType)?MEDIA_RULES["audio/webm"]:MEDIA_RULES[mimeType as keyof typeof MEDIA_RULES]; if(!rule||size>rule.max)return null
  const extension=fileName.trim().split(".").pop()?.toLowerCase(); if(!rule.extensions.includes(extension as never))return null
  return rule
}

export function validMediaDimensions(width:unknown,height:unknown,durationSeconds:unknown,type:MediaType) {
  const validDimension=(value:unknown)=>typeof value==="number"&&Number.isSafeInteger(value)&&value>0&&value<=16384
  const validDuration=(value:unknown)=>typeof value==="number"&&Number.isSafeInteger(value)&&value>0&&value<=86400
  if (width===undefined&&height===undefined&&durationSeconds===undefined) return {}
  if (type === "audio") {
    if (width !== undefined || height !== undefined || !validDuration(durationSeconds) || (durationSeconds as number) > 27) return null
    return { width:null, height:null, duration_seconds:durationSeconds as number }
  }
  if (!validDimension(width)||!validDimension(height)||(type==="video"&&!validDuration(durationSeconds))||(type!=="video"&&durationSeconds!==undefined)) return null
  return {width,height,duration_seconds:type==="video"?durationSeconds:null}
}

export async function canManagePost(post:{author_user_id:string;author_organization_id:string|null},userId:string) {
  if(post.author_organization_id)return (await canPostAsOrganization(userId,post.author_organization_id)).allowed
  return post.author_user_id===userId
}

export async function updatePostType(postId:string) {
  // Legacy attachment-summary metadata only. Product identity is content_format/domain.
  const db=socialDb(); const {data}=await db.from("post_media").select("media_type").eq("post_id",postId)
  const types=new Set((data||[]).map(x=>x.media_type)); const post_type=types.size===0?"text":types.size>1?"mixed":types.has("image")?"image":types.has("video")?"video":types.has("audio")?"audio":"document"
  await db.from("posts").update({post_type,updated_at:new Date().toISOString()}).eq("id",postId)
  return post_type
}
