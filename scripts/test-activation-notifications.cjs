const assert=require('node:assert/strict');
const {moduleAt,def,walk}=require('./test-makkhan-pass2.cjs');
const {createClient}=require('@supabase/supabase-js');
const me='aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',id=n=>`00000000-0000-0000-0000-${String(n).padStart(12,'0')}`;
let auth=true,fail=false;const calls=[];
const rows=Array.from({length:67},(_,n)=>({id:id(n+1),user_id:me,created_at:'2026-10-13T06:00:00Z',is_read:false,title:'Connection request'}));
const db=createClient('https://fixture.invalid','fixture',{auth:{persistSession:false,autoRefreshToken:false},global:{fetch:async(url,options={})=>{
  const u=new URL(url),method=options.method||'GET';calls.push({u,method,body:options.body?JSON.parse(options.body):null});
  assert.equal(u.searchParams.get('user_id'),'eq.'+me,'notification reads/writes scoped to verified owner');
  if(fail)return Response.json({message:'fixture error'},{status:503});
  if(method==='PATCH')return new Response(null,{status:204});
  let data=[...rows].reverse();const cursor=u.searchParams.get('or');if(cursor)data=data.filter(r=>r.id<cursor.match(/id.lt.([a-f0-9-]+)/)[1]);return Response.json(data.slice(0,31));
}}});db.auth.getUser=async()=>({data:{user:auth?{id:me}:null}});
const communication=moduleAt('lib/communication.ts',{}),route=moduleAt('app/api/notifications/route.ts',{'@/lib/supabase/server':{createClient:async()=>db},'next/server':{NextResponse:Response},'@/lib/communication':communication},{URL});
const request=body=>new Request('https://local.invalid/api/notifications',{method:'PATCH',headers:{'content-type':'application/json'},body:JSON.stringify(body)});
async function profileCheck(){
  let visible=true,completed=true;const p={full_name:'Aditi',username:'aditi',tagline:'Designer',profile_completed:true};
  const q=data=>({select(){return this},eq(){return this},maybeSingle:async()=>({data,error:null})});
  const Ready=moduleAt('components/home/ProfileReady.tsx',{'next/link':def('a'),'lucide-react':{CheckCircle2:'svg'},'@/lib/supabase/server':{createClient:async()=>({from:()=>q({...p,profile_completed:completed})})},'@/lib/supabase/public':{createPublicClient:()=>({from:()=>q(visible?{id:me}:null)})},'@/components/ui/profile-avatar':{ProfileAvatar:()=>null},'@/components/profile/ProfileShareActions':def(()=>null)}).default;
  assert.ok(walk(await Ready({userId:me}),n=>n.type==='a'&&n.props.href==='/u/aditi').length);
  visible=false;assert.equal(await Ready({userId:me}),null,'Do not claim an invisible profile is ready to share');
  visible=true;completed=false;assert.equal(await Ready({userId:me}),null);
}
(async()=>{
 let cursor=null,seen=[];do{const r=await route.GET(new Request('https://local.invalid/api/notifications'+(cursor?'?cursor='+encodeURIComponent(cursor):'')));assert.equal(r.status,200);const p=await r.json();seen.push(...p.notifications.map(n=>n.id));cursor=p.nextCursor;}while(cursor);assert.equal(new Set(seen).size,67);
 assert.equal((await route.PATCH(request({all:'yes'}))).status,400);
 assert.equal((await route.PATCH(request({id:id(1)}))).status,200);assert.equal(calls.at(-1).u.searchParams.get('id'),'eq.'+id(1));assert.deepEqual(calls.at(-1).body,{is_read:true});
 fail=true;assert.equal((await route.PATCH(request({all:true}))).status,500);fail=false;
 auth=false;const before=calls.length;assert.equal((await route.GET(new Request('https://local.invalid/api/notifications'))).status,401);assert.equal((await route.PATCH(request({all:true}))).status,401);assert.equal(calls.length,before);
 const safe=moduleAt('lib/auth/return-to.ts',{}, {URL,URLSearchParams}).safeReturnTo;for(const bad of ['https://external.invalid','//external.invalid','/\\external.invalid','javascript:alert(1)'])assert.equal(safe(bad,''),'');
 await profileCheck();console.log('PASS: owner-only notification pagination/read mutations, unauthorized denial, update failures, unsafe destinations rejected, profile-ready public visibility and completion gates. No live I/O.');
})().catch(e=>{console.error(e);process.exitCode=1});
