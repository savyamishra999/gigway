import { boundedFetch } from "@/lib/async"
import { createClient as createServiceClient } from "@supabase/supabase-js"
import { createClient } from "@/lib/supabase/server"
import { aggregateVijoxTimedReactions, type VijoxTimedReactionRow, zeroVijoxTimedReactionSummary } from "@/lib/social/vijox-timed-reactions"
import { isJox, isValidGlimpsVideoMime, parsePersistedContentFormat, toContentDomain, type ContentDomain, type PersistedContentFormat } from "@/lib/social/content-domain"
import { validPostHighlights, type PostHighlight } from "@/lib/social/gigthought"

export type SocialContentFormat = PersistedContentFormat
export const SOCIAL_POST_FIELDS = "id,author_user_id,author_profile_id,author_organization_id,body,content_format,visibility,status,created_at,edited_at,moment_slug,vijox_transcript_text,vijox_transcript_segments,jox_cover_media_id,jox_cover_scale,jox_cover_position_x,jox_cover_position_y,view_count,post_highlights"
export type SocialPost = { id:string; author_user_id:string; author_profile_id:string|null; author_organization_id:string|null; body:string|null; content_format?:SocialContentFormat|null; visibility:string; status:string; created_at:string; edited_at:string|null; moment_slug?:string|null; vijoxTranscriptText?:string|null; vijox_transcript_text?:string|null; vijox_transcript_segments?:unknown; jox_cover_media_id?:string|null; jox_cover_scale?:number|null; jox_cover_position_x?:number|null; jox_cover_position_y?:number|null; view_count?:number|null; post_highlights?:unknown }
export class SocialFeedStageError extends Error { constructor(public stage:string,public code:string|undefined,message:string){super(message)} }
function requireSocialResult(stage:string,result:unknown){const error=result&&typeof result==="object"&&"error" in result?(result as {error?:{code?:string;message?:string}|null}).error:null;if(error)throw new SocialFeedStageError(stage,error.code,error.message||"Supabase query failed")}
export function socialPerf(stage:string, startedAt:number, details:Record<string,number|string|boolean|null>={}) {
  if (process.env.NODE_ENV !== "development" && process.env.GIGWAY_PERF_DIAGNOSTICS !== "1") return
  console.info("gigway_perf", { stage, durationMs:Math.round(performance.now()-startedAt), ...details })
}

export function socialDb() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url) throw new SocialFeedStageError("social_db","missing_env","NEXT_PUBLIC_SUPABASE_URL")
  if (!key) throw new SocialFeedStageError("social_db","missing_env","SUPABASE_SERVICE_ROLE_KEY")
  return createServiceClient(url, key, { global: { fetch: boundedFetch } })
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

function byPost<T extends {post_id:string}>(rows:T[]|null|undefined){const map=new Map<string,T[]>();for(const row of rows||[]){const values=map.get(row.post_id)||[];values.push(row);map.set(row.post_id,values)}return map}

/** Serialize a bounded, already-authorized page with a fixed set of bulk DB
 * stages. Storage still signs each protected object independently. */
export async function safePosts(posts:SocialPost[],viewerId?:string|null) {
  if (!posts.length) return []
  const startedAt=performance.now(),db=socialDb(),postIds=[...new Set(posts.map(post=>post.id))]
  const profileIds=[...new Set(posts.map(post=>post.author_profile_id).filter((id):id is string=>!!id))]
  const organizationIds=[...new Set(posts.map(post=>post.author_organization_id).filter((id):id is string=>!!id))]
  const mentionNames=[...new Set(posts.flatMap(post=>(post.body||"").match(/(^|\s)@([a-zA-Z0-9_]{1,32})/g)?.map(x=>x.trim().slice(1).toLowerCase())||[]))].slice(0,200)
  const empty={data:[] as any[],error:null}
  const results=await Promise.all([
    profileIds.length?db.from("profiles").select("id,full_name,username,avatar_url,tagline,is_verified").in("id",profileIds):Promise.resolve(empty),
    organizationIds.length?db.from("organizations").select("id,name,username,logo_url,tagline,is_verified").in("id",organizationIds):Promise.resolve(empty),
    Promise.all(postIds.map(postId=>db.from("post_likes").select("post_id",{count:"exact",head:true}).eq("post_id",postId))),
    Promise.all(postIds.map(postId=>db.from("post_comments").select("id",{count:"exact",head:true}).eq("post_id",postId).eq("status","published"))),
    Promise.all(postIds.map(postId=>db.from("post_reposts").select("post_id",{count:"exact",head:true}).eq("post_id",postId))),
    viewerId?db.from("post_likes").select("post_id").eq("user_id",viewerId).in("post_id",postIds):Promise.resolve(empty),
    viewerId?db.from("post_saves").select("post_id").eq("user_id",viewerId).in("post_id",postIds):Promise.resolve(empty),
    viewerId?db.from("post_reposts").select("post_id").eq("user_id",viewerId).in("post_id",postIds):Promise.resolve(empty),
    db.from("post_media").select("id,post_id,media_type,storage_path,mime_type,file_name,width,height,duration_seconds,sort_order").in("post_id",postIds).order("sort_order"),
    viewerId&&organizationIds.length?db.from("organization_members").select("organization_id,member_role").eq("profile_id",viewerId).eq("status","active").in("organization_id",organizationIds):Promise.resolve(empty),
    viewerId&&profileIds.length?db.from("profile_follows").select("followed_profile_id").eq("follower_user_id",viewerId).in("followed_profile_id",profileIds):Promise.resolve(empty),
    viewerId&&organizationIds.length?db.from("organization_follows").select("organization_id").eq("follower_user_id",viewerId).in("organization_id",organizationIds):Promise.resolve(empty),
    mentionNames.length?db.from("profiles").select("username").in("username",mentionNames).eq("profile_completed",true):Promise.resolve(empty),
  ])
  const names=["profile_authors","organization_authors","likes","comments","reposts","liked_states","saved_states","reposted_states","media","organization_manage","profile_follow_states","organization_follow_states","mentions"]
  results.forEach((result,index)=>Array.isArray(result)?result.forEach(item=>requireSocialResult(names[index],item)):requireSocialResult(names[index],result))
  const profiles:any[]=(results[0] as any).data||[],organizations:any[]=(results[1] as any).data||[]
  const liked:any[]=(results[5] as any).data||[],saved:any[]=(results[6] as any).data||[],reposted:any[]=(results[7] as any).data||[]
  const media:any[]=(results[8] as any).data||[],memberships:any[]=(results[9] as any).data||[],profileFollows:any[]=(results[10] as any).data||[],organizationFollows:any[]=(results[11] as any).data||[],mentions:any[]=(results[12] as any).data||[]
  const likeCounts=new Map(postIds.map((id,index)=>[id,(results[2] as Array<{count?:number|null}>)[index]?.count||0])),commentCounts=new Map(postIds.map((id,index)=>[id,(results[3] as Array<{count?:number|null}>)[index]?.count||0])),repostCounts=new Map(postIds.map((id,index)=>[id,(results[4] as Array<{count?:number|null}>)[index]?.count||0]))
  const profileMap=new Map(profiles.map(row=>[row.id,row])),organizationMap=new Map(organizations.map(row=>[row.id,row]))
  const mediaByPost=byPost(media)
  const likedIds=new Set(liked.map(row=>row.post_id)),savedIds=new Set(saved.map(row=>row.post_id)),repostedIds=new Set(reposted.map(row=>row.post_id))
  const managedOrganizations=new Set(memberships.filter(row=>["owner","admin"].includes(row.member_role)).map(row=>row.organization_id))
  const followedProfiles=new Set(profileFollows.map(row=>row.followed_profile_id)),followedOrganizations=new Set(organizationFollows.map(row=>row.organization_id)),validMentions=new Set(mentions.map(row=>row.username))
  const serialized=await Promise.all(posts.map(async post=>{
    const profile=post.author_profile_id?profileMap.get(post.author_profile_id):null,organization=post.author_organization_id?organizationMap.get(post.author_organization_id):null
    const author=profile?{type:"profile",id:profile.id,name:profile.full_name,username:profile.username,avatar:profile.avatar_url,tagline:profile.tagline,verified:profile.is_verified}:organization?{type:"organization",id:organization.id,name:organization.name,username:organization.username,avatar:organization.logo_url,tagline:organization.tagline,verified:organization.is_verified}:null
    const canManage=!!viewerId&&(post.author_user_id===viewerId||!!post.author_organization_id&&managedOrganizations.has(post.author_organization_id))
    const mediaItems=await Promise.all((mediaByPost.get(post.id)||[]).map(async item=>{const publicDelivery=post.visibility==="public"&&["audio","video"].includes(item.media_type);const result=publicDelivery?null:await db.storage.from(POST_MEDIA_BUCKET).createSignedUrl(item.storage_path,300);if(result)requireSocialResult("signed_url",result);const url=publicDelivery?`/social/posts/${post.id}/media/${item.id}/public`:result?.data?.signedUrl;return url?{id:item.id,type:item.media_type,url,fileName:item.file_name,mimeType:item.mime_type,width:item.width,height:item.height,durationSeconds:item.duration_seconds}:null}))
    const visibleMedia=mediaItems.filter((item):item is NonNullable<typeof item>=>!!item),contentFormat=parsePersistedContentFormat(post.content_format)||"standard"
    const cover=post.jox_cover_media_id?visibleMedia.find(item=>item.id===post.jox_cover_media_id&&item.type==="image")||null:null
    const coverNumber=(value:unknown,fallback:number,min:number,max:number)=>typeof value==="number"&&Number.isFinite(value)?Math.max(min,Math.min(max,value)):fallback
    const postMentions=[...new Set((post.body||"").match(/(^|\s)@([a-zA-Z0-9_]{1,32})/g)?.map(x=>x.trim().slice(1).toLowerCase())||[])].filter(name=>validMentions.has(name)).slice(0,20)
    const isFollowing=!!post.author_profile_id&&followedProfiles.has(post.author_profile_id)||!!post.author_organization_id&&followedOrganizations.has(post.author_organization_id)
    return {id:post.id,body:post.body,contentFormat,contentDomain:toContentDomain(contentFormat)!,visibility:post.visibility,createdAt:post.created_at,editedAt:post.edited_at,momentSlug:post.moment_slug||null,vijoxTranscriptText:post.vijox_transcript_text||null,vijoxTranscriptSegments:validVijoxTranscriptSegments(post.vijox_transcript_segments),highlights:contentFormat==="standard"?validPostHighlights(post.post_highlights,post.body||""):[] as PostHighlight[],author,media:visibleMedia,joxCover:cover?{id:cover.id,url:cover.url,fileName:cover.fileName,scale:coverNumber(post.jox_cover_scale,1,1,3),positionX:coverNumber(post.jox_cover_position_x,0,-1,1),positionY:coverNumber(post.jox_cover_position_y,0,-1,1)}:null,viewCount:coverNumber(post.view_count,0,0,Number.MAX_SAFE_INTEGER),likeCount:likeCounts.get(post.id)||0,commentCount:commentCounts.get(post.id)||0,repostCount:repostCounts.get(post.id)||0,isRepostedByMe:repostedIds.has(post.id),canRepost:!!viewerId&&!canManage,isLikedByMe:likedIds.has(post.id),isSavedByMe:savedIds.has(post.id),canEdit:canManage,canDelete:canManage,canManageVisibility:canManage,canFollow:!!viewerId&&!canManage&&!!author,isFollowing,canReport:!!viewerId&&!canManage,mentions:postMentions}
  }))
  socialPerf("social_batch_serialization",startedAt,{posts:posts.length,dbStages:10+3*postIds.length,signedUrlOperations:media.filter(item=>!posts.some(post=>post.id===item.post_id&&post.visibility==="public"&&["audio","video"].includes(item.media_type))).length})
  return serialized
}

export async function safePost(post:SocialPost,viewerId?:string|null){return (await safePosts([post],viewerId))[0]}

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
/** Batch the same visibility rules as canViewPost; never serialize an
 * unauthorized candidate. At most two follow lookups per candidate page. */
export async function visiblePosts(posts: SocialPost[], viewerId?: string | null) {
  const published = posts.filter(post => post.status === "published")
  if (!viewerId) return published.filter(post => post.visibility === "public")
  const restricted = published.filter(post => post.visibility !== "public" && post.author_user_id !== viewerId)
  const profileIds = [...new Set(restricted.map(post => post.author_profile_id).filter((id): id is string => !!id))]
  const orgIds = [...new Set(restricted.filter(post => !post.author_profile_id).map(post => post.author_organization_id).filter((id): id is string => !!id))]
  const db = socialDb()
  const [profiles, organizations] = await Promise.all([
    profileIds.length ? db.from("profile_follows").select("followed_profile_id").eq("follower_user_id", viewerId).in("followed_profile_id", profileIds) : Promise.resolve({ data: [], error: null }),
    orgIds.length ? db.from("organization_follows").select("organization_id").eq("follower_user_id", viewerId).in("organization_id", orgIds) : Promise.resolve({ data: [], error: null }),
  ])
  requireSocialResult("visibility_profiles", profiles)
  requireSocialResult("visibility_organizations", organizations)
  const followedProfiles = new Set((profiles.data || []).map(row => row.followed_profile_id))
  const followedOrganizations = new Set((organizations.data || []).map(row => row.organization_id))
  return published.filter(post => post.visibility === "public" || post.author_user_id === viewerId ||
    (post.author_profile_id ? followedProfiles.has(post.author_profile_id) : !!post.author_organization_id && followedOrganizations.has(post.author_organization_id)))
}

/** Shared, access-aware query foundation for a later GLIMPS feed. */
export async function accessibleGlimps(viewerId?:string|null, limit=16) { const {data,error}=await socialDb().from("posts").select(SOCIAL_POST_FIELDS).eq("content_format","glimps").eq("status","published").order("created_at",{ascending:false}).order("id",{ascending:false}).limit(Math.max(1,Math.min(limit,50))); requireSocialResult("glimps_query",{error}); return visiblePosts((data || []) as SocialPost[], viewerId) }
export async function accessibleGlimpsPage(viewerId?:string|null, cursor?:string|null, limit=10) { const size=Math.max(1,Math.min(limit,20)), fetchSize=size*4+1; let query=socialDb().from("posts").select(SOCIAL_POST_FIELDS).eq("content_format","glimps").eq("status","published").order("created_at",{ascending:false}).order("id",{ascending:false}).limit(fetchSize); if(cursor){const [createdAt,id]=cursor.split("|"); if(!createdAt||!id) throw new SocialFeedStageError("glimps_cursor","invalid_cursor","Invalid cursor"); query=query.or(`created_at.lt.${createdAt},and(created_at.eq.${createdAt},id.lt.${id})`)} const {data,error}=await query; requireSocialResult("glimps_page",{error}); const rows=(data||[]) as SocialPost[], visible=await visiblePosts(rows,viewerId); const page=visible.slice(0,size), hasMore=visible.length>size||rows.length===fetchSize, marker=hasMore?(page.length===size?page.at(-1):rows.at(-1)):null; return { posts:page, nextCursor:marker?`${marker.created_at}|${marker.id}`:null } }
export async function accessibleJoxPage(viewerId?:string|null, cursor?:string|null, limit=10) { const size=Math.max(1,Math.min(limit,20)), fetchSize=size*4+1; let query=socialDb().from("posts").select(SOCIAL_POST_FIELDS).eq("content_format","vijox").eq("status","published").order("created_at",{ascending:false}).order("id",{ascending:false}).limit(fetchSize); if(cursor){const [createdAt,id]=cursor.split("|"); if(!createdAt||!id) throw new SocialFeedStageError("jox_cursor","invalid_cursor","Invalid cursor"); query=query.or(`created_at.lt.${createdAt},and(created_at.eq.${createdAt},id.lt.${id})`)} const {data,error}=await query; requireSocialResult("jox_page",{error}); const rows=(data||[]) as SocialPost[], visible=await visiblePosts(rows.filter(post=>isJox(post.content_format)),viewerId); const page=visible.slice(0,size), hasMore=visible.length>size||rows.length===fetchSize, marker=hasMore?(page.length===size?page.at(-1):rows.at(-1)):null; return { posts:page, nextCursor:marker?`${marker.created_at}|${marker.id}`:null } }
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
