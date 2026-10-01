// Final verification only. Executes the existing loaders/API/client hooks with local fixtures.
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),os=require('node:os');
const react=require('react');
const {moduleAt,fixture,walk,HomeModule,asyncLib,statuses,def,placeholder,socialClient}=require('./test-makkhan-pass2.cjs');
const output=process.argv[2]||fs.mkdtempSync(path.join(os.tmpdir(),'gigway-pass2-final-tests-'));
const report={evidence:'SYNTHETIC, actual application functions with mock I/O and hook lifecycle; not browser hydration',checks:[],findings:[]};
async function check(name,fn){try{const detail=await fn();report.checks.push({name,passed:true,detail});console.log('PASS',name);}catch(error){report.checks.push({name,passed:false,error:error.message});console.error('FAIL',name,error.message);}}
// The three reproduced pre-existing pagination failures now gate the focused fix.
const plain=value=>JSON.parse(JSON.stringify(value));
const wait=()=>new Promise(resolve=>setTimeout(resolve,0));
function post(index,visibility='public') {return {id:String(10000-index).padStart(5,'0'),author_user_id:'author-user',author_profile_id:'author',author_organization_id:null,body:'Post '+index,content_format:'standard',status:'published',visibility,created_at:'2026-09-20T12:00:00Z',edited_at:null};}
function socialFixture(posts,viewer='viewer',failTable=null) {
  const calls=[];
  const records={posts,profiles:[{id:'author',username:'author',full_name:'Author',profile_completed:true}],post_media:[],post_comments:[],organization_follows:[],organization_members:[],organizations:[],
    profile_follows:[{follower_user_id:'viewer',followed_profile_id:'author'}],
    post_likes:posts.slice(0,1).map(p=>({post_id:p.id,user_id:'viewer'})),post_saves:posts.slice(0,1).map(p=>({post_id:p.id,user_id:'viewer'})),post_reposts:posts.slice(0,1).map(p=>({post_id:p.id,user_id:'viewer'}))};
  const db={from(table){let filters=[],limit=Infinity,cursor=null,head=false,fieldsSelected='',orders=[];const q={
    select(fields,options){fieldsSelected=fields;head=options?.head===true;return q},eq(k,v){filters.push(row=>row[k]===v);return q},in(k,v){filters.push(row=>v.includes(row[k]));return q},is(k,v){filters.push(row=>(row[k]??null)===v);return q},order(key,options={}){orders.push([key,options.ascending]);return q},limit(n){limit=n;return q},
    or(value){const match=/created_at\.lt\.([^,]+),and\(created_at\.eq\.[^,]+,id\.lt\.([^\)]+)\)/.exec(value);assert.ok(match,'unexpected cursor expression');cursor={time:match[1],id:match[2]};return q},
    then(resolve){const call={table,limit,cursor,head,visibility:["followed_profile_id","organization_id"].includes(fieldsSelected)};calls.push(call);let data=[...(records[table]||[])].filter(row=>filters.every(fn=>fn(row)));if(table==='posts'){assert.deepEqual(orders,[['created_at',false],['id',false]],'canonical ordering');data.sort((a,b)=>b.created_at.localeCompare(a.created_at)||b.id.localeCompare(a.id));if(cursor)data=data.filter(row=>row.created_at<cursor.time||(row.created_at===cursor.time&&row.id<cursor.id));}data=data.slice(0,limit);call.rows=data.length;if(table===failTable)return resolve({data:null,error:{message:'Injected query failure'}});resolve({data:head?null:data,count:data.length,error:null})}
  };return q},storage:{from(){return{createSignedUrl:async()=>{throw Error('Unexpected media signing')}}}}};
  const domain=moduleAt('lib/social/content-domain.ts',{});
  const social=moduleAt('lib/social/server.ts',{
    '@/lib/async':{},'@supabase/supabase-js':{createClient:()=>db},'@/lib/supabase/server':{createClient:async()=>({auth:{getUser:async()=>({data:{user:{id:viewer}}})}})},
    '@/lib/social/vijox-timed-reactions':{},'@/lib/social/content-domain':domain,'@/lib/social/gigthought':{validPostHighlights:()=>[]},
  },{process:{env:{NODE_ENV:'test',NEXT_PUBLIC_SUPABASE_URL:'http://fixture.invalid',SUPABASE_SERVICE_ROLE_KEY:'local-only'}}});
  const initial=moduleAt('lib/home/primary.ts',{'server-only':{},'@/lib/social/server':social}).initialHomePosts;
  const route=moduleAt('app/api/social/posts/route.ts',{
    'next/server':require('next/server'),'@/lib/social/server':social,'@/lib/social/content-domain':domain,'@/lib/moments':{specialMoments:[]},'@/lib/social/gigthought':{},
  });
  async function next(cursor){const response=await route.GET({nextUrl:new URL('http://local/api/social/posts?feed=discover'+(cursor?'&cursor='+encodeURIComponent(cursor):''))});assert.equal(response.status,200);return response.json()}
  return{initial:()=>initial(viewer),next,records,calls};
}
function hooks(){let values=[],refs=[],deps=[],position=0,effects=[];return{
  react:{useState(initial){const i=position++;if(!(i in values))values[i]=initial;return[values[i],value=>values[i]=typeof value==='function'?value(values[i]):value]},useRef(initial){const i=position++;return refs[i]??=( {current:initial} )},useEffect(fn,next){const i=position++;if(!deps[i]||next.some((v,k)=>v!==deps[i][k]))effects.push(fn);deps[i]=next}},
  render(fn){position=0;effects=[];return fn()},async flush(replay=false){for(const fn of effects){fn();if(replay)fn()}await wait()},values,
};}
function clientModule(h,fetcher){const source=fs.readFileSync('components/social/SocialHomeFeed.tsx','utf8');const deps=Object.fromEntries([...source.matchAll(/from\s+["']([^"']+)["']/g)].map(x=>[x[1],def(placeholder(x[1]))]));deps.react=h.react;deps['lucide-react']=new Proxy({},{get:(_,name)=>name==='__esModule'?true:placeholder(String(name))});deps['@/components/moments/MomentExperience']={MomentHomeCard:placeholder('moment')};deps['@/lib/moments']={getActiveMoment:()=>null};deps['@/lib/social/external-links']={urlsInText:()=>[],externalPreviewFor:()=>null};deps['@/lib/async']={boundedFetch:fetcher};deps['@/components/social/usePostEngagement']=moduleAt('components/social/usePostEngagement.ts',{react:h.react},{fetch:fetcher});return moduleAt('components/social/SocialHomeFeed.tsx',deps)}
const text=node=>typeof node==='string'?node:Array.isArray(node)?node.map(text).join(''):node?.props?text(node.props.children):'';
async function hydrationAndPages(total, hiddenFirst=0){
  const records=Array.from({length:total},(_,i)=>post(i,i<hiddenFirst?'followers':'public')),server=socialFixture(records,hiddenFirst?'different-viewer':'viewer'),initial=await server.initial();
  const h=hooks(),requests=[];const client=clientModule(h,async url=>{requests.push(url);const cursor=new URL(url,'http://local').searchParams.get('cursor');assert.ok(cursor,'continuation omitted initial cursor');const page=await server.next(cursor);return{ok:true,json:async()=>page}});
  const props={opportunities:[],network:[],glimps:[],jox:[],initialPage:initial};const render=()=>h.render(()=>client.default(props));
  let tree=render();const initialIds=initial.items.map(p=>p.id);await h.flush(true);tree=render();
  assert.equal(requests.length,0);assert.deepEqual(plain(h.values[1].map(p=>p.id)),plain(initialIds));
  assert.deepEqual(walk(tree,n=>n.props?.post).map(n=>n.props.post.id),plain(initialIds),'rendered order changed at hydration');
  let rounds=0;while(h.values[5]){ // cursor state follows feed/posts/loading/error/tuneOpen
    assert.ok(++rounds<10,'pagination loop');tree=render();const button=walk(tree,n=>n.type==='button'&&text(n).trim()==='Load more')[0];assert.ok(button);await button.props.onClick();tree=render();
    const expectedCursor=rounds===1?initial.nextCursor:null;if(expectedCursor)assert.equal(new URL(requests[0],'http://local').searchParams.get('cursor'),expectedCursor);
  }
  const ids=plain(h.values[1].map(p=>p.id));assert.deepEqual(ids,records.filter(p=>p.visibility==='public').map(p=>p.id));assert.equal(new Set(ids).size,ids.length);assert.ok(!walk(tree,n=>n.type==='button'&&text(n).trim()==='Load more').length);
  return{total,initial:initial.items.length,continuations:requests.length,stableOrder:true,unique:true};
}
async function stateTest(){for(const viewer of ['viewer','different-viewer']){
  const server=socialFixture([post(0)],viewer),page=await server.initial(),item=page.items[0];for(const key of ['isLikedByMe','isSavedByMe','isRepostedByMe','isFollowing'])assert.equal(item[key],viewer==='viewer',key+' leaked or lost');
  const h=hooks(),client=clientModule(h,async()=>{throw Error('Unexpected hydration fetch')});let tree=h.render(()=>client.PostCard({post:item}));await h.flush(true);tree=h.render(()=>client.PostCard({post:item}));
  assert.equal(walk(tree,n=>n.type==='button'&&n.props['aria-label']===(viewer==='viewer'?'Unsave post':'Save post')).length,1);
  assert.ok(walk(tree,n=>n.type==='button'&&text(n).includes(viewer==='viewer'?'Undo Repost':'Repost')).length);
  const heart=walk(tree,n=>n.type?.displayName==='Heart')[0];assert.equal(heart.props.className.includes('fill-current'),viewer==='viewer');
}return 'Actual safePosts + PostCard/usePostLike state preserved for two viewers; no hydration mutations';}
async function sparseParity(hiddenFirst){const rows=Array.from({length:32},(_,i)=>post(i,i<hiddenFirst?'followers':'public'));const server=socialFixture(rows,'different-viewer');const first=await server.initial();const apiFirst=await server.next(null);assert.deepEqual(plain(first),plain(apiFirst),"SSR/API parity");
  const hidden=new Set(rows.filter(p=>p.visibility!=='public').map(p=>p.id));assert.ok(first.items.every(p=>!hidden.has(p.id)),'hidden post leaked');return{hiddenFirst,initial:first.items.length,parity:true,hiddenLeaked:false};}
async function sparseCase(hiddenFirst){const rows=Array.from({length:32},(_,i)=>post(i,i<hiddenFirst?'followers':'public'));const server=socialFixture(rows,'different-viewer');const first=await server.initial();const apiFirst=await server.next(null);assert.deepEqual(plain(first),plain(apiFirst),"SSR/API parity");const expected=rows.filter(p=>p.visibility==='public').map(p=>p.id);let got=[...first.items],cursor=first.nextCursor;while(cursor){const more=await server.next(cursor);got.push(...more.items);cursor=more.nextCursor;}
  const detail={hiddenFirst,initial:first.items.length,cursor:first.nextCursor,returned:got.length,accessible:expected.length};report.findings.push({type:'pagination',...detail});assert.deepEqual(got.map(p=>p.id),expected,'Accessible older posts are stranded when the visible candidate count is <=15. '+JSON.stringify(detail));}
async function sparseContinuation(){
 const rows=Array.from({length:48},(_,i)=>post(i,i===16?'followers':'public')),server=socialFixture(rows,'different-viewer');
 const first=await server.initial();assert.ok(first.nextCursor);const second=await server.next(first.nextCursor);assert.equal(second.items.length,15);
 report.findings.push({type:'continuation-starvation',first:first.items.length,second:second.items.length,cursor:second.nextCursor,olderAccessible:17});
 assert.ok(second.nextCursor,'Continuation stops after30 visible posts with17 accessible posts still remaining');
}
async function neverSettles(name){const f=fixture({hanging:name,deadline:30,legacyProducts:true}),shell=await f.page.default(),nodes=walk(shell,n=>n.type===HomeModule),settled=new Map();
  const bounded=moduleAt('components/home/HomeModule.tsx',{react,'@/lib/async':{withDeadline:p=>asyncLib.withDeadline(p,40)},'@/lib/social/server':{socialPerf(){}},'@/components/layout/SectionStatus':statuses}).HomeModule;
  const started=performance.now();await Promise.all(nodes.map(async n=>{const c=bounded(n.props).props.children.props.children;settled.set(n.props.name,await c.type(c.props))}));
  assert.ok(settled.get('primary').props['data-home-ready']);assert.equal(settled.size,7);assert.ok(performance.now()-started<1000);
  const result=settled.get(name);assert.ok(result.props['data-home-error']||walk(result,n=>n.type===statuses.SectionUnavailable).length||name==='completion');
  assert.equal(f.counts.viewer,1);return{module:name,terminal:true,elapsedMs:Math.round(performance.now()-started),testDeadlineMs:40};}
async function headroom(){const people=Array.from({length:60},(_,i)=>({id:'p'+i,username:'p'+i,full_name:'Person '+i,skills:['design']})),orgs=Array.from({length:60},(_,i)=>({id:'o'+i,username:'o'+i,name:'Org '+i})),jobs=Array.from({length:60},(_,i)=>({id:'j'+i,title:'Job '+i,client_id:'other',created_at:'2026-09-20T12:00:00Z'}));
  const cases=[];
  for(const dense of [false,true]){const records={profiles:people,organizations:orgs,jobs,projects:[],gigs:[],profile_follows:dense?people.slice(0,24).map(p=>({followed_profile_id:p.id})):[],organization_follows:dense?orgs.slice(0,24).map(p=>({organization_id:p.id})):[]};
    const f=fixture({records,realRanking:true}),nodes=walk(await f.page.default(),n=>n.type===HomeModule),network=await nodes.find(n=>n.props.name==='network').props.load(),opp=await nodes.find(n=>n.props.name==='opportunities').props.load();
    const opportunities=walk(opp,n=>n.type===socialClient.OpportunityRail)[0].props.items;
    const detail={dense,candidatesPeople:24,candidatesOrganizations:24,networkVisible:network.props.items.length,opportunityVisible:opportunities.length,olderUnfollowed: dense?72:0};cases.push(detail);
    if(!dense){assert.equal(network.props.items.length,12);assert.equal(opportunities.length,12)}else{assert.equal(network.props.items.length,0);report.findings.push({type:'candidate-starvation',...detail});}
  }
  for (const table of ['jobs','projects','gigs','profiles','organizations']) {
    const records={profiles:[],organizations:[],jobs:[],projects:[],gigs:[],profile_follows:[],organization_follows:[]};
    records[table]=table==='profiles'?people:table==='organizations'?orgs:jobs;
    const f=fixture({records,realRanking:true}),nodes=walk(await f.page.default(),n=>n.type===HomeModule);
    const isNetwork=['profiles','organizations'].includes(table),result=await nodes.find(n=>n.props.name===(isNetwork?'network':'opportunities')).props.load();
    const items=isNetwork?result.props.items:walk(result,n=>n.type===socialClient.OpportunityRail)[0].props.items;
    assert.equal(items.length,12,table+' cannot fill rail');cases.push({table,candidates:table==='gigs'?12:24,visible:items.length});
  }
  // Self-heavy opportunities with no other categories available.
  const records={profiles:[],organizations:[],jobs:jobs.map((j,i)=>({...j,client_id:i<24?'viewer':'other'})),projects:[],gigs:[],profile_follows:[],organization_follows:[]};
  const f=fixture({records,realRanking:true}),nodes=walk(await f.page.default(),n=>n.type===HomeModule),opp=await nodes.find(n=>n.props.name==='opportunities').props.load();const items=walk(opp,n=>n.type===socialClient.OpportunityRail)[0].props.items;assert.equal(items.length,0);report.findings.push({type:'self-heavy-starvation',candidates:24,visible:0,olderEligible:36});return cases;
}
async function main(){
  for(const count of [0,1,15,16,31,45])await check('hydration/pagination '+count+' public posts',()=>hydrationAndPages(count));
  await check('viewer engagement hydration A/B',stateTest);
  for(const count of [1,16])await check('SSR/API parity and fail-closed visibility after '+count+' hidden candidates',()=>sparseParity(count));
  for(const count of [1,16])await check('no skipped accessible posts after '+count+' hidden candidates',()=>sparseCase(count));
  await check('no skipped accessible posts on API continuation',sparseContinuation);
  for(const name of ['opportunities','network','jox','glimps','completion','activity'])await check('never-settling '+name,()=>neverSettles(name));
  await check('candidate capacity and starvation fixtures',headroom);
  const failed=report.checks.filter(c=>!c.passed).length;
  report.summary={gate:{passed:report.checks.length-failed,failed},originalPaginationRegressionsPassed:report.checks.filter(c=>c.name.startsWith("no skipped accessible posts")&&c.passed).length};
  fs.writeFileSync(path.join(output,'verification.json'),JSON.stringify(report,null,2));console.log('Verification report:',path.join(output,'verification.json'));
  console.log(`Pass 2 regression gate: ${report.checks.length-failed} PASS / ${failed} FAIL`);
  console.log('Original three pagination regressions are hard PASS/FAIL assertions.');
  if(failed)process.exitCode=1;
}
module.exports={socialFixture,post,hydrationAndPages};
if(require.main===module)main().catch(error=>{console.error(error);process.exitCode=1});
