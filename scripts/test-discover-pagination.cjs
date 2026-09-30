// Real SSR/API/visibility/serialization functions with local database fixtures.
const assert=require('node:assert/strict'),fs=require('node:fs'),os=require('node:os'),path=require('node:path');
const {socialFixture,post,hydrationAndPages}=require('./test-makkhan-pass2-final.cjs');
const report=[];
const rows=(n,hidden=()=>false)=>Array.from({length:n},(_,i)=>post(i,hidden(i)?'followers':'public'));
const canonical=(records,viewer)=>records.posts.filter(p=>p.status==='published'&&p.content_format==='standard'&&(p.visibility==='public'||p.author_user_id===viewer||!!viewer&&(p.author_profile_id?records.profile_follows.some(f=>f.follower_user_id===viewer&&f.followed_profile_id===p.author_profile_id):records.organization_follows.some(f=>f.follower_user_id===viewer&&f.organization_id===p.author_organization_id)))).sort((a,b)=>b.created_at.localeCompare(a.created_at)||b.id.localeCompare(a.id)).map(p=>p.id);
async function run(name,input,configure=()=>{},viewer='different-viewer'){
 const f=socialFixture(input,viewer);configure(f.records);const expected=canonical(f.records,viewer),got=[],pages=[];let cursor=null;
 for(let turn=0;turn<100;turn++){
  const start=f.calls.length,page=turn===0?await f.initial():await f.next(cursor),calls=f.calls.slice(start),raw=calls.filter(c=>c.table==='posts'),serializationStart=calls.findIndex(c=>!['posts','profile_follows','organization_follows'].includes(c.table)),visibility=calls.slice(0,serializationStart<0?calls.length:serializationStart).filter(c=>c.visibility);
  const metrics={rawCandidates:raw.reduce((n,c)=>n+c.rows,0),windows:raw.length,visibilityOperations:visibility.length,visible:page.items.length,nextCursor:page.nextCursor};pages.push(metrics);
  assert.ok(raw.length<=8);assert.ok(metrics.rawCandidates<=128);assert.ok(visibility.length<=2*raw.length);assert.ok(page.items.length<=15);
  assert.deepEqual(Array.from(page.items,p=>p.id),expected.slice(got.length,got.length+page.items.length));got.push(...page.items.map(p=>p.id));
  if(!page.nextCursor){assert.equal(got.length,expected.length,'premature exhaustion');break;}
  assert.notEqual(page.nextCursor,cursor,'stalled cursor');
  if(page.items.length<15)assert.equal(raw.length,8,'short page without exhaustion or bound');
  cursor=page.nextCursor;assert.ok(turn<99,'infinite traversal');
 }
 assert.deepEqual(got,expected);assert.equal(new Set(got).size,got.length);
 const api=await f.next(null);const ssr=await f.initial();assert.deepEqual(JSON.parse(JSON.stringify(ssr)),api);
 report.push({name,pages,visibleTotal:got.length});console.log('PASS',name,JSON.stringify(pages));return pages;
}
(async()=>{
 for(const n of [0,1,15,16,31,45])await run('public '+n,rows(n));
 await run('A all 16 visible',rows(16));
 await run('B first candidate hidden',rows(32,i=>i===0));
 await run('last candidate hidden',rows(48,i=>i===15));
 await run('every second hidden',rows(80,i=>i%2===0));
 await run('C first window hidden',rows(32,i=>i<16));
 await run('two windows hidden',rows(64,i=>i<32));
 await run('F three windows hidden',rows(80,i=>i<48));
 await run('E exact end',rows(15));
 await run('D baseline mixed public followers private drafts',rows(40).map((p,i)=>({...p,visibility:['public','followers','private','public'][i%4],status:i%4===3?'hidden':'published'})));
 await run('all hidden exact raw boundary',rows(16,()=>true));
 await run('hidden tail after full visible page',rows(48,i=>i>=15));
 const mixed=rows(72).map((p,i)=>({...p,visibility:['public','followers','private','followers','followers','followers'][i%6],status:i%9===0?'hidden':'published',author_user_id:i%6===5?'different-viewer':'author-user',author_profile_id:i%6===3||i%6===4?null:i%6===1?'followed':'unfollowed',author_organization_id:i%6===3?'followed-org':i%6===4?'hidden-org':null}));
 await run('D mixed visibility owner drafts profile organization',mixed,r=>{r.profile_follows.push({follower_user_id:'different-viewer',followed_profile_id:'followed'});r.organization_follows.push({follower_user_id:'different-viewer',organization_id:'followed-org'});});
 await run('anonymous visibility',mixed,()=>{},null);
 await run('different and tied timestamps',rows(65,i=>i%3===0).map((p,i)=>({...p,created_at:new Date(Date.UTC(2026,8,20-Math.floor(i/7))).toISOString()})));
 const bound=await run('safety bound then accessible posts',rows(160,i=>i<130));assert.equal(bound[0].visible,0);assert.equal(bound[0].windows,8);assert.equal(bound[0].rawCandidates,128);assert.ok(bound[0].nextCursor);
 const partial=await run('partial page at safety bound',rows(240,i=>i>0&&i<210));assert.equal(partial[0].visible,1);assert.equal(partial[0].windows,8);assert.ok(partial[0].nextCursor);
 for(const fail of ['profile_follows','organization_follows','posts']){
  const input=rows(32,()=>true).map(p=>fail==='organization_follows'?{...p,author_profile_id:null,author_organization_id:'hidden-org'}:p),f=socialFixture(input,'different-viewer',fail);
  await assert.rejects(f.initial());await assert.rejects(f.next(null),/503/);assert.ok(f.calls.every(c=>['posts','profile_follows','organization_follows'].includes(c.table)),'failed visibility reached serialization');report.push({name:'fail closed '+fail,calls:f.calls});console.log('PASS fail closed',fail);
 }
 for(const hidden of [1,16,32,130]){const result=await hydrationAndPages(hidden+31,hidden);report.push({name:'hydration/load more hidden '+hidden,...result});console.log('PASS hydration/load more hidden',hidden);}
 const output=path.join(os.tmpdir(),'discover-pagination-after.json');fs.writeFileSync(output,JSON.stringify(report,null,2));console.log('PASS all pagination invariants. Metrics:',output);
})().catch(e=>{console.error(e);process.exitCode=1});
