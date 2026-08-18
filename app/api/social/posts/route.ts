import { NextRequest, NextResponse } from "next/server"
import { canViewPost, plainText, requireSocialUser, resolveProfile, safePost, socialDb } from "@/lib/social/server"

const PAGE_SIZE=15
export async function POST(req:NextRequest){
  const user=await requireSocialUser(); if(!user)return NextResponse.json({error:"Unauthorized"},{status:401})
  const b=await req.json().catch(()=>({})); const body=plainText(b.body,5000); const visibility=b.visibility==="followers"?"followers":b.visibility==="public"?"public":null
  if(!body||!visibility)return NextResponse.json({error:"Enter a plain-text post of up to 5,000 characters."},{status:400})
  const db=socialDb(); let author_profile_id:string|null=null,author_organization_id:string|null=null
  if(typeof b.organizationId==="string") { const p=await resolveProfile(user.id); const {data:m}=p?await db.from("organization_members").select("member_role").eq("organization_id",b.organizationId).eq("profile_id",p.id).eq("status","active").maybeSingle():{data:null}; if(!m||!["owner","admin"].includes(m.member_role))return NextResponse.json({error:"You are not authorized to post for this organization."},{status:403}); author_organization_id=b.organizationId }
  else { const p=await resolveProfile(user.id); if(!p)return NextResponse.json({error:"Complete your professional profile before posting."},{status:403}); author_profile_id=p.id }
  const {data,error}=await db.from("posts").insert({author_user_id:user.id,author_profile_id,author_organization_id,post_type:"text",body,visibility,status:"published"}).select("id,author_user_id,author_profile_id,author_organization_id,body,post_type,visibility,status,created_at,edited_at").single()
  if(error||!data)return NextResponse.json({error:"We could not publish your post."},{status:503}); return NextResponse.json({post:await safePost(data,user.id)},{status:201})
}
export async function GET(req:NextRequest){
  const viewer=await requireSocialUser(); const feed=req.nextUrl.searchParams.get("feed")||"discover"; if(feed!=="discover"&&feed!=="following")return NextResponse.json({error:"Invalid feed."},{status:400})
  const cursor=req.nextUrl.searchParams.get("cursor"); const db=socialDb(); let q=db.from("posts").select("id,author_user_id,author_profile_id,author_organization_id,body,post_type,visibility,status,created_at,edited_at").eq("status","published").order("created_at",{ascending:false}).order("id",{ascending:false}).limit(PAGE_SIZE+1)
  if(cursor){const [created,id]=cursor.split("|");if(!created||!id)return NextResponse.json({error:"Invalid cursor."},{status:400});q=q.or(`created_at.lt.${created},and(created_at.eq.${created},id.lt.${id})`)}
  const {data,error}=await q; if(error)return NextResponse.json({error:"We could not load the feed."},{status:503}); let posts=(data||[]) as any[]
  if(feed==="following"){ if(!viewer)return NextResponse.json({items:[],nextCursor:null}); const [pf,of]=await Promise.all([db.from("profile_follows").select("followed_profile_id").eq("follower_user_id",viewer.id),db.from("organization_follows").select("organization_id").eq("follower_user_id",viewer.id)]);const profiles=new Set((pf.data||[]).map(x=>x.followed_profile_id)),orgs=new Set((of.data||[]).map(x=>x.organization_id));posts=posts.filter(p=>p.author_user_id===viewer.id||!!(p.author_profile_id&&profiles.has(p.author_profile_id))||!!(p.author_organization_id&&orgs.has(p.author_organization_id))) }
  const accessible=[] as any[];for(const post of posts){if(await canViewPost(post,viewer?.id))accessible.push(post)} const page=accessible.slice(0,PAGE_SIZE); return NextResponse.json({items:await Promise.all(page.map(p=>safePost(p,viewer?.id))),nextCursor:accessible.length>PAGE_SIZE?`${page.at(-1).created_at}|${page.at(-1).id}`:null})
}
