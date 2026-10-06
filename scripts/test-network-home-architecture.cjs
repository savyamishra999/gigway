// Local fixture tests: actual loaders/components, no remote service operations.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const React = require('react');
const {moduleAt,fixture,walk,HomeModule,def,placeholder} = require('./test-makkhan-pass2.cjs');
const source = p => fs.readFileSync(p,'utf8');
const text = n => typeof n === 'string' ? n : Array.isArray(n) ? n.map(text).join('') : n?.props ? text(n.props.children) : '';
let groups=0;
async function check(name,fn){await fn();groups++;console.log('PASS',name)}
const icons=new Proxy({}, {get:(_,k)=>k==='__esModule'?true:placeholder(String(k))});
const Cards=placeholder('discovery'),Connections=placeholder('connections');
function networkPage(user={id:'viewer'}, loader=async()=>[]) {
  return moduleAt('app/network/page.tsx', {react:React,'next/link':def('a'),'next/navigation':{redirect:href=>{throw Error(href)}},'@/lib/auth/server':{getViewer:async()=>user,loginForCurrent:async()=>'/login?next=/network'},'@/components/connections/NetworkClient':def(Connections),'@/components/connections/DiscoveryCards':def(Cards),'@/lib/network/discovery':{networkDiscovery:loader}}).default;
}
function dbFixture(fail=false) {
  const calls=[];
  return {calls,db:{from(table){const c={table,filters:[],orders:[]};calls.push(c);const q={select(v){c.fields=v;return q},eq(k,v){c.filters.push([k,v]);return q},neq(k,v){c.exclude=[k,v];return q},not(){return q},or(v){c.search=v;return q},order(k,v){c.orders.push(k);return q},limit(v){c.limit=v;return q},in(k,v){c.ids=v;return q},then(resolve){let data=Array.from({length:30},(_,i)=>({id:'p'+i,full_name:'Person '+i,name:'Company '+i,username:'person'+i,tagline:'Designer',skills:['Design','Writing','Research']}));if(table==='profile_follows')data=[{followed_profile_id:'p0'}];if(table==='organization_follows')data=[{organization_id:'p0'}];if(table==='profile_intents')data=[{profile_id:'p0',intent_type:'grow_network'}];return Promise.resolve({data:c.limit?data.slice(0,c.limit):data,error:fail?Error('offline'):null}).then(resolve)}};return q}}};
}
(async()=>{
 await check('desktop and mobile Network route directly to /network; existing search opens /explore',()=>{
  const nav=source('components/layout/ModernNavbar.tsx');
  for(const part of [nav.slice(nav.indexOf('const links'),nav.indexOf('const MOBILE_TABS')),nav.slice(nav.indexOf('const MOBILE_TABS'),nav.indexOf('const MENU_ITEMS'))]){assert.match(part,/href: "\/network", label: "Network"/);assert.doesNotMatch(part,/href: "\/explore"/)}
  assert.match(nav,/href="\/explore" aria-label="Search"/);assert.match(nav,/router.push\(`\/explore/);
 });
 await check('Network exposes People/Workplaces/My Network only and retains login guard',async()=>{
  for(const tab of ['people','workplaces','connections','jobs']){const tree=await networkPage()({searchParams:Promise.resolve({tab})});const nav=walk(tree,n=>n.type==='nav')[0];assert.deepEqual(walk(nav,n=>n.type==='a').map(text),['People','Workplaces','My Network']);assert.doesNotMatch(text(tree),/Jobs|Projects|Services/);assert.equal(walk(tree,n=>n.type===Connections).length,tab==='connections'?1:0);if(tab!=='connections')assert.equal(walk(tree,n=>n.type==='form')[0].props.action,'/network');}
  await assert.rejects(()=>networkPage(null)({searchParams:Promise.resolve({})}),/login\?next=\/network/);
 });
 await check('Network search invokes only the selected discovery loader with bounded limit and honest copy',async()=>{
  for(const tab of ['people','workplaces']){const calls=[];const tree=await networkPage({id:'viewer'},async(...args)=>{calls.push(args);return[]})({searchParams:Promise.resolve({tab,q:'designer'})});const boundary=walk(tree,n=>n.type===React.Suspense)[0];await boundary.props.children.type(boundary.props.children.props);assert.deepEqual(calls,[[tab,'viewer',18,'designer']]);const input=walk(tree,n=>n.type==='input'&&n.props.name==='q')[0];assert.doesNotMatch(input.props.placeholder,/skill|role/i);}
 });
 await check('real discovery reads six/eighteen only, preserves following, scopes follows/intents to returned IDs',async()=>{
  for(const kind of ['people','workplaces'])for(const limit of [6,18]){const f=dbFixture(),load=moduleAt('lib/network/discovery.ts',{'server-only':{},'@/lib/supabase/server':{createClient:async()=>f.db},'@/lib/identity':{compactIntentLabels:v=>v}}).networkDiscovery;const rows=await load(kind,'viewer',limit,'Design,_%()');assert.equal(rows.length,limit);assert.equal(rows[0].following,true);assert.equal(f.calls[0].limit,limit);assert.deepEqual(f.calls[0].orders,['created_at','id']);assert.ok(f.calls.slice(1).every(c=>c.ids.length===limit));assert.ok(rows.every(r=>r.skills.length<=2));assert.ok(f.calls.every(c=>!['jobs','projects','gigs'].includes(c.table)));assert.ok(!f.calls[0].search.includes('()'));if(kind==='people'){assert.deepEqual(f.calls[0].exclude,['id','viewer']);assert.ok(f.calls[0].filters.some(([k,v])=>k==='profile_completed'&&v===true))}}
 });
 await check('discovery query failures render finite error state',async()=>{
  const tree=await networkPage({id:'viewer'},async()=>{throw Error('offline')})({searchParams:Promise.resolve({})});const boundary=walk(tree,n=>n.type===React.Suspense)[0];const rendered=await boundary.props.children.type(boundary.props.children.props);assert.equal(rendered.props.role,'alert');
 });
 await check('discovery Follow uses existing profile/organization endpoint and has no mount fetch',async()=>{
  for(const kind of ['people','workplaces']){let requests=[];const hooks={useState:value=>[value,()=>{}]};const mod=moduleAt('components/connections/DiscoveryFollowButton.tsx',{react:hooks,'@/lib/async':{boundedFetch:async(...args)=>{requests.push(args);return{ok:true}}}}).default;const tree=mod({kind,id:'p',name:'Person',initialFollowing:false});assert.equal(requests.length,0);await walk(tree,n=>n.type==='button')[0].props.onClick();assert.equal(requests[0][0],'/api/social/follow/'+(kind==='people'?'profile':'organization')+'/p');assert.equal(requests[0][1].method,'POST');}
  assert.doesNotMatch(source('components/connections/DiscoveryCards.tsx'),/useEffect|setInterval/);
 });
 await check('My Network preserves Accept/Decline/View profile/Disconnect and connection endpoints',async()=>{
  const item={id:'request',profile:{id:'person',full_name:'Person',username:'person'}};let index=0,calls=[];const states=[[item],[item],false,null,''];const comp=moduleAt('components/connections/NetworkClient.tsx',{react:{useState:()=>[states[index++],()=>{}],useEffect:()=>{}},'next/link':def('a'),'lucide-react':icons,'@/components/ui/profile-avatar':{ProfileAvatar:placeholder('avatar')},'@/lib/async':{boundedFetch:async(url,options)=>{if(options?.method)calls.push([url,options.method]);return{ok:true,json:async()=>({})}}}},{fetch:async(url,options)=>{calls.push([url,options.method]);return{ok:true,json:async()=>({})}}}).default;
  const tree=comp({embedded:true});for(const label of ['Accept','Decline','Disconnect'])await walk(tree,n=>n.type==='button'&&text(n)===label)[0].props.onClick();assert.ok(text(tree).includes('View profile'));assert.deepEqual(calls,[['/api/connections/request/accept','POST'],['/api/connections/request/reject','POST'],['/api/connections/person','DELETE']]);
 });
 await check('Home order and actual preview query bounds; one viewer and zero legacy loads',async()=>{
  const f=fixture(),tree=await f.page.default(),nodes=walk(tree,n=>n.type===HomeModule);assert.deepEqual(nodes.slice(0,3).map(n=>n.props.name),['primary','network','opportunities']);await Promise.all(nodes.map(n=>n.props.load()));assert.equal(f.counts.viewer,1);assert.equal(f.counts.jox||0,0);assert.equal(f.counts.glimps||0,0);assert.equal(f.calls.find(c=>c.table==='profiles'&&!c.filters.single).limit,6);assert.equal(f.calls.find(c=>c.table==='organizations').limit,6);for(const table of ['jobs','projects','gigs'])assert.equal(f.calls.find(c=>c.table===table).limit,2);const home=source('app/home/page.tsx');assert.ok(home.indexOf('name="network"')<home.indexOf('<FindWorkEntry'));assert.ok(home.indexOf('<FindWorkEntry')<home.indexOf('name="opportunities"'));
 });
 await check('Home opportunities never exceed six and render shared stored timestamps/routes',async()=>{
  const Timestamp=placeholder('time');const calls=[];const mod=moduleAt('components/home/DiscoveryPreviews.tsx',{'next/link':def('a'),'@/components/connections/DiscoveryCards':def(Cards),'@/lib/network/discovery':{},'@/lib/work/previews':{workPreviews:async(kind,limit)=>{calls.push([kind,limit]);return{items:Array.from({length:limit},(_,i)=>({id:String(i),title:'Work',createdAt:'2026-10-01T10:00:00Z'})),unavailable:false}}},'@/components/ui/ContentTimestamp':def(Timestamp)});const tree=await mod.LatestOpportunities();assert.equal(walk(tree,n=>n.type==='article').length,6);assert.equal(walk(tree,n=>n.type===Timestamp).length,6);assert.deepEqual(calls,[['jobs',2],['projects',2],['services',2]]);assert.ok(walk(tree,n=>n.props?.href==='/work').length);const entry=mod.FindWorkEntry();assert.equal(walk(entry,n=>n.type==='input'||n.type==='form').length,0);assert.deepEqual(walk(entry,n=>n.type==='a').map(n=>n.props.href),['/work','/jobs','/projects','/gigs']);
 });
 await check('Work retains categories/rails and Find Professionals points at existing /freelancers',()=>{
  const tree=moduleAt('app/work/page.tsx',{react:React,'next/link':def('a'),'@/components/work/WorkPreviewRail':{...def(placeholder('rail')),WorkPreviewFallback:placeholder('fallback')}}).default();assert.deepEqual(walk(walk(tree,n=>n.type==='nav')[0],n=>n.type==='a').map(text),['Jobs','Projects','Services','Find Professionals']);assert.equal(walk(tree,n=>n.type==='a'&&text(n)==='Find Professionals')[0].props.href,'/freelancers');assert.equal(walk(tree,n=>n.type===React.Suspense).length,3);
 });
 await check('/explore remains global search, honest placeholder, connections links reach correct tab',()=>{
  assert.ok(fs.existsSync('app/explore/page.tsx'));const s=source('components/discover/DiscoverClient.tsx');assert.match(s,/Search GigWay/);assert.match(s,/Search people, Workplaces, jobs, projects and services/);assert.doesNotMatch(s,/Search people, skills/);assert.match(source('app/u/[username]/page.tsx'),/href="\/network\?tab=connections"/);
 });
 console.log(`${groups} architecture groups PASS. Local fixtures; browser/live data NOT MEASURED.`);
})().catch(error=>{console.error(error);process.exitCode=1});
