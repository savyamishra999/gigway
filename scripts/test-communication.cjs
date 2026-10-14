const assert = require('node:assert/strict');
const { createClient } = require('@supabase/supabase-js');
const { moduleAt } = require('./test-makkhan-pass2.cjs');
const communication = moduleAt('lib/communication.ts', {});
const rank = moduleAt('lib/network/relevance.ts', {}).professionalRelevance;
const me = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', other = 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb';
const id = n => `00000000-0000-0000-0000-${String(n).padStart(12,'0')}`;
let authenticated = true, failed = false, inserts = 0;
const calls = [], rows = Array.from({length: 113}, (_, i) => ({id:id(i+1),sender_id:other,receiver_id:me,content:`Message ${i}`,is_read:false,created_at:'2026-10-13T06:00:00.123456+00:00'}));
const db = createClient('https://fixture.invalid','fixture',{auth:{persistSession:false,autoRefreshToken:false},global:{fetch:async (url, options={})=>{
  const u = new URL(url), method = options.method || 'GET', body = options.body ? JSON.parse(options.body) : null;
  calls.push({u,method,body});
  if(failed) return Response.json({message:'Injected failure'},{status:503});
  const table = u.pathname.split('/').at(-1);
  if(table === 'profiles') return Response.json(options.headers?.Accept?.includes('object') ? {id:other} : [{id:other,full_name:'Other',username:'other'}]);
  if(method==='PATCH') return new Response(null,{status:204});
  if(method==='POST') { inserts++; rows.push({...body,created_at:'2026-10-13T07:00:00Z'}); return Response.json(rows.at(-1)); }
  if(u.searchParams.has('id')) {
    const row=rows.find(r=>'eq.'+r.id===u.searchParams.get('id') && 'eq.'+r.sender_id===u.searchParams.get('sender_id'));
    return Response.json(row || null);
  }
  assert.ok(u.searchParams.getAll('or').some(x=>x.includes('sender_id.eq.'+me)&&x.includes('receiver_id.eq.'+me)), 'conversation scope must include verified viewer');
  let page=[...rows].sort((a,b)=>b.created_at.localeCompare(a.created_at)||b.id.localeCompare(a.id));
  const cursor=u.searchParams.getAll('or').find(x=>x.includes('created_at.lt.'));
  if(cursor) { const marker=cursor.match(/id.lt.([a-f0-9-]+)/)[1]; page=page.filter(r=>r.id<marker); }
  return Response.json(page.slice(0,Number(u.searchParams.get('limit'))));
}}});
db.auth.getUser=async()=>({data:{user:authenticated?{id:me}:null},error:null});
const routes=moduleAt('app/api/messages/route.ts',{'@/lib/supabase/server':{createClient:async()=>db},'next/server':{NextResponse:Response},'@/lib/communication':communication},{URL});
const request=(method,body,url='https://local.invalid/api/messages')=>new Request(url,{method,...(body?{headers:{'content-type':'application/json'},body:JSON.stringify(body)}:{})});
(async()=>{
  let cursor=null, seen=[];
  do { const before=calls.length; const response=await routes.GET(request('GET',null,`https://local.invalid/api/messages?with=${other}${cursor?'&cursor='+encodeURIComponent(cursor):''}`)); assert.equal(response.status,200);const p=await response.json();seen.push(...p.messages.map(m=>m.id));cursor=p.nextCursor;assert.ok(calls.slice(before).every(c=>c.method==='GET'),'GET does not mark read'); } while(cursor);
  assert.equal(seen.length,113);assert.equal(new Set(seen).size,113);
  for(const url of ['?with=bad.or.inject','?cursor=broken']) assert.equal((await routes.GET(request('GET',null,'https://local.invalid/api/messages'+url))).status,400);
  for(const body of [{receiver_id:me,content:'Hi'},{receiver_id:other,content:' '},{receiver_id:other,content:'x'.repeat(4001)},{receiver_id:'bad',content:'Hi'}]) assert.equal((await routes.POST(request('POST',body))).status,400);
  const body={id:id(999),receiver_id:other,content:' A thoughtful hello '};
  assert.equal((await routes.POST(request('POST',body))).status,201);
  assert.equal((await routes.POST(request('POST',body))).status,200);assert.equal(inserts,1,'retry must not duplicate a committed message');
  assert.equal((await routes.POST(request('POST',{...body,content:'different'}))).status,409);
  assert.equal((await routes.PATCH(request('PATCH',{ids:[id(1)]}))).status,200);
  const patch=calls.at(-1);assert.equal(patch.u.searchParams.get('receiver_id'),'eq.'+me);assert.deepEqual(patch.body,{is_read:true});
  assert.equal((await routes.PATCH(request('PATCH',{ids:[]}))).status,400);
  authenticated=false;const count=calls.length;for(const method of ['GET','POST','PATCH']) assert.equal((await routes[method](request(method,method==='GET'?null:body))).status,401);assert.equal(calls.length,count);
  authenticated=true;failed=true;assert.equal((await routes.GET(request('GET'))).status,503);
  assert.ok(rank({skills:[' Design ']},{skills:['design']}).score>rank({skills:['Design']},{skills:['Sales']}).score);
  assert.equal(rank({intents:['offering_services']},{intents:['hiring_talent']}).reason,'Interested in hiring talent');
  assert.equal(rank({},{skills:['Design']}).score,0);
  const merged=communication.mergeMessages([rows[0]],[{...rows[0],is_read:true}]);assert.equal(merged.length,1);assert.equal(merged[0].is_read,true);
  console.log('PASS: 113 tied-timestamp messages paginated without loss; authenticated participant scopes; GET side-effect free; invalid/self/oversized messages denied; idempotent delivery retry; recipient-only read updates; failure handling; professional matching. No live I/O.');
})().catch(e=>{console.error(e);process.exitCode=1});
