const assert=require('node:assert/strict'), React=require('react');
const {moduleAt,def,walk,placeholder}=require('./test-makkhan-pass2.cjs');
const text=n=>typeof n==='string'?n:Array.isArray(n)?n.map(text).join(' '):n?.props?text(n.props.children):'';
const tabs=moduleAt('lib/profile/tabs.ts',{});
const icons=new Proxy({}, {get:(_,key)=>placeholder(String(key))});
const deadlines=moduleAt('lib/async.ts',{});
function work(records={},fault,hang){
 const calls=[];const db={from(table){const filters={};let limit;const q={select(){return q},eq(k,v){filters[k]=v;return q},order(){return q},limit(n){limit=n;return q},then(resolve){calls.push({table,filters,limit});if(table===hang)return;resolve({data:records[table]||[],error:table===fault?Error('fixture'):null})}};return q}};
 const render=moduleAt('components/profile/ProfileWorkPreview.tsx',{'next/link':def('a'),'lucide-react':icons,'@/lib/supabase/public':{createPublicClient:()=>db},'@/lib/async':{withDeadline:p=>deadlines.withDeadline(p,25)}}).default;
 return {render,calls};
}
function feedHarness(fetch){
 const values=[],effects=[],refs=[];let index=0,pending=[],props,tree;
 const equal=(a,b)=>a&&b&&a.length===b.length&&a.every((v,i)=>Object.is(v,b[i]));
 const hooks={useState(initial){const i=index++;if(!(i in values))values[i]=typeof initial==='function'?initial():initial;return [values[i],v=>values[i]=typeof v==='function'?v(values[i]):v]},useRef(initial){const i=index++;return refs[i]||(refs[i]={current:initial})},useEffect(fn,deps){const i=index++;if(!equal(effects[i]?.deps,deps))pending.push({i,fn,deps})}};
 const render=moduleAt('components/social/ProfileSocialFeed.tsx',{react:hooks,'next/link':def('a'),'lucide-react':icons,'@/lib/profile/tabs':tabs,'@/lib/async':{boundedFetch:fetch},'@/components/social/SocialHomeFeed':{PostCard:placeholder('post')}},{AbortController}).default;
 return {render(p=props){props=p;index=0;tree=render(props);return tree},flush(){const batch=pending;pending=[];for(const e of batch){effects[e.i]?.cleanup?.();effects[e.i]={deps:e.deps,cleanup:e.fn()}}},tree:()=>tree};
}
(async()=>{
 assert.deepEqual([...tabs.PROFILE_TABS].map(t=>t.label),['GigThoughts','Work','Reposts']);assert.equal(tabs.profileTab('glimps'),'gigthoughts');assert.equal(tabs.profileTab('work'),'work');
 const rows=Array.from({length:9},(_,i)=>({id:String(i),title:'Real offer '+i}));const populated=work({gigs:rows,jobs:rows,projects:rows});const tree=await populated.render({profileId:'owner'});
 assert.equal(walk(tree,n=>n.type==='a').length,18);assert.equal(populated.calls.length,3);assert.deepEqual(populated.calls.map(c=>c.limit),[6,6,6]);assert.equal(populated.calls[0].filters.freelancer_id,'owner');assert.equal(populated.calls[1].filters.client_id,'owner');
 const empty=work();const owner=await empty.render({profileId:'owner',isOwner:true});assert.deepEqual(walk(owner,n=>n.type==='a').map(n=>n.props.href),['/gigs/new','/jobs/new','/projects/new']);assert.equal(walk(await empty.render({profileId:'owner'}),n=>n.type==='section').length,0);
 const partial=await work({jobs:[{id:'job',title:'Available job'}]},'gigs').render({profileId:'owner',username:'owner'});assert.ok(text(partial).includes('Available job'));assert.equal(walk(partial,n=>n.props?.role==='alert').length,1);
 const stalled=await work({jobs:[{id:'job',title:'Survives timeout'}]},null,'gigs').render({profileId:'owner',username:'owner'});assert.ok(text(stalled).includes('Survives timeout'));assert.equal(walk(stalled,n=>n.props?.role==='alert').length,1);
 let calls=[];const h=feedHarness((url,init)=>new Promise(resolve=>calls.push({url,signal:init.signal,resolve})));
 let p={profileId:'A',name:'A',initialTab:'work',workPreview:React.createElement('p',null,'Server work')};let t=h.render(p);h.flush();assert.equal(calls.length,0);assert.ok(text(t).includes('Server work'));assert.deepEqual(walk(t,n=>n.props?.role==='tab').map(text),['GigThoughts','Work','Reposts']);
 walk(t,n=>n.props?.role==='tab')[0].props.onClick();h.render();h.flush();assert.equal(calls.length,1);
 p={...p,profileId:'B',name:'B',initialTab:'gigthoughts'};h.render(p);h.flush();h.render();h.flush();assert.equal(calls[0].signal.aborted,true);assert.equal(calls.length,2);
 calls[0].resolve({ok:true,json:async()=>({items:[{id:'stale',body:'STALE'}],nextCursor:null})});calls[1].resolve({ok:true,json:async()=>({items:[],nextCursor:null})});await new Promise(r=>setImmediate(r));t=h.render();h.flush();assert.doesNotMatch(text(t),/STALE/);
 walk(t,n=>n.props?.role==='tab')[1].props.onClick();h.render();h.flush();walk(h.tree(),n=>n.props?.role==='tab')[0].props.onClick();h.render();h.flush();assert.equal(calls.length,2,'cached tab does not refetch');
 console.log('PASS Part 6 actual loaders: bounded public rows, owner actions, visitor empties, partial failure, finite timeout. Actual client hooks: Work SSR, abort stale identity, cached content. No live DB/browser claim.');
})().catch(e=>{console.error(e);process.exitCode=1});
