import { NextRequest, NextResponse } from "next/server"
import { canViewPost, plainText, requireSocialUser, resolveProfile, safePost, socialDb } from "@/lib/social/server"

const PAGE_SIZE=15
function logFeedFailure(stage:string,error:unknown){const detail=error&&typeof error==="object"?error as {stage?:unknown;code?:unknown;message?:unknown}:{};const code=typeof detail.code==="string"?detail.code:undefined,message=typeof detail.message==="string"?detail.message:undefined;console.error("social_feed_failure",{stage:typeof detail.stage==="string"?detail.stage:stage,code,missingEnv:code==="missing_env"?message:undefined,message:code==="missing_env"?undefined:message})}
export async function POST(req:NextRequest){
  const user=await requireSocialUser(); if(!user)return NextResponse.json({error:"Unauthorized"},{status:401})
  const b=await req.json().catch(()=>({})); const body=typeof b.body==="string"?plainText(b.body,5000,0):null; const visibility=b.visibility==="followers"?"followers":b.visibility==="public"?"public":null; const draft=b.draft===true
  if(body===null||!visibility||(!body&&!draft))return NextResponse.json({error:"Enter a plain-text post of up to 5,000 characters."},{status:400})
  const db=socialDb(); let author_profile_id:string|null=null,author_organization_id:string|null=null
  if(typeof b.organizationId==="string") { const p=await resolveProfile(user.id); const {data:m}=p?await db.from("organization_members").select("member_role").eq("organization_id",b.organizationId).eq("profile_id",p.id).eq("status","active").maybeSingle():{data:null}; if(!m||!["owner","admin"].includes(m.member_role))return NextResponse.json({error:"You are not authorized to post for this organization."},{status:403}); author_organization_id=b.organizationId }
  else { const p=await resolveProfile(user.id); if(!p)return NextResponse.json({error:"Complete your professional profile before posting."},{status:403}); author_profile_id=p.id }
  const {data,error}=await db.from("posts").insert({author_user_id:user.id,author_profile_id,author_organization_id,post_type:"text",body:body||null,visibility,status:draft?"hidden":"published"}).select("id,author_user_id,author_profile_id,author_organization_id,body,post_type,visibility,status,created_at,edited_at").single()
  if(error||!data)return NextResponse.json({error:"We could not publish your post."},{status:503});
  const mentions=[...new Set((body||"").match(/(^|\s)@([a-zA-Z0-9_]{1,32})/g)?.map(x=>x.trim().slice(1).toLowerCase())||[])].slice(0,5)
  if(mentions.length){const{data:recipients}=await db.from("profiles").select("id,username").in("username",mentions);const actor=author_organization_id?(await db.from("organizations").select("name").eq("id",author_organization_id).maybeSingle()).data?.name:(await db.from("profiles").select("full_name").eq("id",user.id).maybeSingle()).data?.full_name;const rows=(recipients||[]).filter(p=>p.id!==user.id).map(p=>({user_id:p.id,type:"social_mention",title:"You were mentioned in a post",body:`${actor||"Someone"} mentioned you in a post`,link:`/social/posts/${data.id}`}));if(rows.length)await db.from("notifications").insert(rows)}
  return NextResponse.json({post:await safePost(data,user.id)},{status:201})
}
export async function GET(req:NextRequest){
  let stage="auth"
  try {
  const viewer=await requireSocialUser(); const feed=req.nextUrl.searchParams.get("feed")||"discover"; if(feed!=="discover"&&feed!=="following")return NextResponse.json({error:"Invalid feed."},{status:400})
  const cursor=req.nextUrl.searchParams.get("cursor"); stage="social_db"; const db=socialDb(); const fields="id,author_user_id,author_profile_id,author_organization_id,body,post_type,visibility,status,created_at,edited_at"
  if(feed==="discover"){
    let q=db.from("posts").select(fields).eq("status","published").order("created_at",{ascending:false}).order("id",{ascending:false}).limit(PAGE_SIZE+1)
    if(cursor){const [created,id]=cursor.split("|");if(!created||!id)return NextResponse.json({error:"Invalid cursor."},{status:400});q=q.or(`created_at.lt.${created},and(created_at.eq.${created},id.lt.${id})`)}
    stage="base_posts"; const {data,error}=await q;if(error){logFeedFailure(stage,error);return NextResponse.json({error:"feed_unavailable"},{status:503})};const accessible=[] as any[];stage="post_access";for(const post of data||[]){if(await canViewPost(post,viewer?.id))accessible.push(post)}const page=accessible.slice(0,PAGE_SIZE);stage="serialization";return NextResponse.json({items:await Promise.all(page.map(p=>safePost(p,viewer?.id))),nextCursor:accessible.length>PAGE_SIZE?`${page.at(-1).created_at}|${page.at(-1).id}`:null})
  }
  if(!viewer)return NextResponse.json({items:[],nextCursor:null})
  const [pf,of]=await Promise.all([db.from("profile_follows").select("followed_profile_id").eq("follower_user_id",viewer.id),db.from("organization_follows").select("organization_id").eq("follower_user_id",viewer.id)])
  const profileIds=(pf.data||[]).map(x=>x.followed_profile_id),orgIds=(of.data||[]).map(x=>x.organization_id);let cursorTime:string|undefined,cursorKey:string|undefined
  if(cursor){try{const c=JSON.parse(Buffer.from(cursor,"base64url").toString("utf8"));if(typeof c.time!=="string"||typeof c.key!=="string")throw Error();cursorTime=c.time;cursorKey=c.key}catch{return NextResponse.json({error:"Invalid cursor."},{status:400})}}
  const originalFilters=[`author_user_id.eq.${viewer.id}`,...(profileIds.length?[`author_profile_id.in.(${profileIds.join(",")})`]:[]),...(orgIds.length?[`author_organization_id.in.(${orgIds.join(",")})`]:[])].join(",")
  let originalsQuery=db.from("posts").select(fields).eq("status","published").or(originalFilters).order("created_at",{ascending:false}).limit(PAGE_SIZE+1);if(cursorTime)originalsQuery=originalsQuery.lte("created_at",cursorTime)
  let repostsQuery=profileIds.length?db.from("post_reposts").select("post_id,user_id,created_at").in("user_id",profileIds).order("created_at",{ascending:false}).limit(PAGE_SIZE+1):null;if(repostsQuery&&cursorTime)repostsQuery=repostsQuery.lte("created_at",cursorTime)
  const [originalsRes,repostsRes,actorsRes]=await Promise.all([originalsQuery,repostsQuery||Promise.resolve({data:[],error:null}),profileIds.length?db.from("profiles").select("id,full_name,username,avatar_url").in("id",profileIds):Promise.resolve({data:[]})]);if(originalsRes.error||repostsRes.error)return NextResponse.json({error:"We could not load the feed."},{status:503})
  const repostRows=repostsRes.data||[],postIds=[...new Set(repostRows.map(r=>r.post_id))];const repostPosts=postIds.length?(await db.from("posts").select(fields).in("id",postIds).eq("status","published")).data||[]:[];const byPost=new Map(repostPosts.map(p=>[p.id,p]));const actors=new Map((actorsRes.data||[]).map(a=>[a.id,a]))
  const activities:any[]=[];for(const post of originalsRes.data||[]){if(await canViewPost(post,viewer.id))activities.push({type:"post",key:`post:${post.id}`,time:post.created_at,post})}for(const repost of repostRows){const post=byPost.get(repost.post_id),actor=actors.get(repost.user_id);if(post&&actor&&await canViewPost(post,viewer.id))activities.push({type:"repost",key:`repost:${repost.post_id}:${repost.user_id}`,time:repost.created_at,post,actor})}
  const remaining=activities.filter(x=>!cursorTime||x.time<cursorTime||(x.time===cursorTime&&x.key<(cursorKey||""))).sort((a,b)=>b.time.localeCompare(a.time)||b.key.localeCompare(a.key));const page=remaining.slice(0,PAGE_SIZE);const items=await Promise.all(page.map(async x=>x.type==="post"?await safePost(x.post,viewer.id):{type:"repost",repostedAt:x.time,repostActor:{id:x.actor.id,name:x.actor.full_name,username:x.actor.username,avatar:x.actor.avatar_url,href:x.actor.username?`/u/${x.actor.username}`:`/freelancers/${x.actor.id}`},originalPost:await safePost(x.post,viewer.id)}));const last=page.at(-1);return NextResponse.json({items,nextCursor:remaining.length>PAGE_SIZE&&last?Buffer.from(JSON.stringify({time:last.time,key:last.key})).toString("base64url"):null})
  } catch (error) {
    logFeedFailure(stage,error)
    return NextResponse.json({error:"feed_unavailable"},{status:503})
  }
}
