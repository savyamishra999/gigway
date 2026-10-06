// Local fixture execution only: no live auth, Supabase, storage or browser claims.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const React = require('react');
const { moduleAt, walk, def, placeholder } = require('./test-makkhan-pass2.cjs');
const time = moduleAt('lib/content-time.ts', {});
const policy = moduleAt('lib/product-visibility.ts', {});
const text = n => typeof n === 'string' ? n : Array.isArray(n) ? n.map(text).join('') : n?.props ? text(n.props.children) : '';
const source = f => fs.readFileSync(f,'utf8');
const icons = new Proxy({}, {get:(_,k)=>k==='__esModule'?true:placeholder(String(k))});
const created = '2026-10-01T10:12:00Z';
let groups = 0;
async function check(name, fn) { await fn(); groups++; console.log('PASS',name); }
function dbFixture({fail, empty=false}={}) {
  const calls=[];
  const db={from(table){const call={table,filters:[],orders:[]};calls.push(call);let limit=Infinity;
    const query={select(fields){call.fields=fields;return query},eq(k,v){call.filters.push([k,v]);return query},order(k,v){call.orders.push([k,v]);return query},limit(n){limit=n;call.limit=n;return query},then(resolve,reject){
      if(fail===table)return Promise.reject(Error('offline')).then(resolve,reject);
      const rows=empty?[]:Array.from({length:12},(_,i)=>({id:String(12-i),title:'Real title',status:i===0?'hidden':table==='projects'?'open':'active',created_at:created,updated_at:'2026-10-01T11:12:00Z',location:null,job_type:null,company_name:'Company',workplace:[{name:'Workplace'}],poster:{full_name:'Poster'},provider:{full_name:'Owner'},professional:{full_name:'Freelancer'},price:125,budget:500,category:'Design'}));
      return Promise.resolve({data:rows.filter(row=>call.filters.every(([k,v])=>row[k]===v)).slice(0,limit),error:null}).then(resolve,reject);
    }};return query}};
  return {db,calls};
}
function previews(db) { return moduleAt('lib/work/previews.ts', {'server-only':{},'@/lib/supabase/server':{createClient:async()=>db}}); }
const Timestamp=placeholder('timestamp'),Creation=placeholder('creation');
function rail(loader) { const render = moduleAt('components/work/WorkPreviewRail.tsx',{'next/link':def('a'),'@/components/ui/ContentTimestamp':def(Timestamp),'@/components/work/WorkCreationLink':def(Creation),'@/lib/work/previews':{workPreviews:loader}}).default; return async props => { const frame=await render(props); return frame.type(frame.props); }; }
(async()=>{
  await check('exact dates are English/IST and independent of host timezone',()=>{
    assert.equal(time.formatContentDate(created),'1 Oct 2026, 3:42 PM IST');
    assert.equal(time.formatContentDate('2026-10-01T15:42:00+05:30'),time.formatContentDate(created));
    assert.equal(time.formatContentDate('2026-09-30T20:00:00Z'),'1 Oct 2026, 1:30 AM IST');
    for(const value of [null,undefined,'','invalid','2026-10-01T10:12:00'])assert.equal(time.formatContentDate(value),null);
  });
  await check('relative times, future timestamps and service Posted/Updated semantics',()=>{
    const now=Date.parse(created);
    for(const [delta,label]of [[0,'just now'],[60000,'1m ago'],[7200000,'2h ago'],[86400000,'1d ago']])assert.equal(time.formatContentAge(created,now+delta),label);
    assert.equal(time.formatContentAge(created,now-60000),time.formatContentDate(created));
    assert.equal(time.contentTimestamp(created,created).label,'Posted');
    assert.equal(time.contentTimestamp(created,'2026-10-01T10:12:01Z').label,'Posted');
    assert.equal(time.contentTimestamp(created,'2026-10-01T10:13:00Z').label,'Updated');
    assert.equal(time.contentTimestamp(created,'invalid').value,created);
    assert.equal(time.contentTimestamp(null,null),null);
  });
  await check('timestamp SSR and initial hydration match; effect alone switches cards to relative',()=>{
    function harness(clock){let state=null,effects=[];const component=moduleAt('components/ui/ContentTimestamp.tsx',{react:{useState:()=>[state,v=>state=v],useEffect:fn=>effects.push(fn)},'@/lib/content-time':time},{Date:{now:()=>clock}}).default;return{render:props=>component(props),flush:()=>effects.forEach(fn=>fn())}}
    const server=harness(Date.parse(created)),client=harness(Date.parse(created)+7200000);
    assert.equal(text(server.render({createdAt:created})),text(client.render({createdAt:created})));
    client.flush();const hydrated=client.render({createdAt:created});assert.equal(text(hydrated),'Posted 2h ago');assert.equal(hydrated.props.title,'Posted 1 Oct 2026, 3:42 PM IST');assert.equal(hydrated.props.dateTime,created);
    assert.equal(text(client.render({createdAt:created,exact:true})),'Posted 1 Oct 2026, 3:42 PM IST');
    assert.equal(client.render({createdAt:'bad'}),null);
  });
  await check('Work previews query exactly six published rows per category, with no auth calls',async()=>{
    const f=dbFixture(),load=previews(f.db);
    for(const kind of ['jobs','projects','services']){const result=await load.workPreviews(kind);assert.equal(result.unavailable,false);assert.equal(result.items.length,6);assert.equal(result.items[0].id,'11');assert.equal(result.items[0].author,kind==='services'?'Freelancer':'Workplace');if(kind==='jobs')assert.equal(result.items[0].detail,'');}
    assert.deepEqual(f.calls.map(c=>[c.table,c.limit]),[['jobs',6],['projects',6],['gigs',6]]);
    for(const c of f.calls){assert.deepEqual(c.orders.map(o=>o[0]),['created_at','id']);assert.equal(c.filters[0][0],'status');}
  });
  await check('one failed preview leaves other categories usable; empty is distinct from unavailable',async()=>{
    const f=dbFixture({fail:'jobs'}),load=previews(f.db);
    const results=await Promise.all(['jobs','projects','services'].map(kind => load.workPreviews(kind)));assert.equal(results[0].unavailable,true);assert.equal(results[1].items.length,6);assert.equal(results[2].items.length,6);
    assert.equal((await previews(dbFixture({empty:true}).db).workPreviews('jobs')).unavailable,false);
  });
  await check('Work rails have semantic dates, real routes, swipe regions and no fabricated missing fields',async()=>{
    for(const kind of ['jobs','projects','services']){const tree=await rail(async()=>({items:[{id:'real',title:'Real title',createdAt:created}],unavailable:false}))({kind});assert.equal(walk(tree,n=>n.type==='article').length,1);assert.equal(walk(tree,n=>n.props?.role==='region'&&n.props.tabIndex===0).length,1);assert.equal(walk(tree,n=>n.type===Timestamp)[0].props.createdAt,created);assert.doesNotMatch(text(tree),/undefined|null|rating|salary/i);const href=kind==='services'?'/gigs':`/${kind}`;assert.ok(walk(tree,n=>n.props?.href===href+'/real').length);assert.ok(walk(tree,n=>n.props?.href===href).length);}
  });
  await check('empty rails have no blank scroll region; guest empty-state creation is hidden',async()=>{
    for(const kind of ['jobs','projects','services']){const tree=await rail(async()=>({items:[],unavailable:false}))({kind});assert.ok(text(tree).includes(`No ${kind} available yet.`));assert.equal(walk(tree,n=>n.props?.role==='region').length,0);assert.equal(walk(tree,n=>n.type===Creation).length,1);}
    for(const user of [null,{id:'viewer'}]){const Link=moduleAt('components/work/WorkCreationLink.tsx',{'next/link':def('a'),'@/components/layout/AuthUiProvider':{useAuthUi:()=>({user})}}).default;assert.equal(Link({href:'/jobs/new',children:'Post a Job'})===null,!user);}
    const failure=await rail(async()=>({items:[],unavailable:true}))({kind:'jobs'});assert.ok(text(failure).includes('could not be loaded'));assert.equal(walk(failure,n=>n.type===Creation).length,0);
  });
  await check('public Work shell preserves destinations and has three independent server boundaries',()=>{
    const Preview=placeholder('preview');const tree=moduleAt('app/work/page.tsx',{react:React,'next/link':def('a'),'@/components/work/WorkPreviewRail':{...def(Preview),WorkPreviewFallback:placeholder('fallback')}}).default();
    assert.deepEqual(walk(tree,n=>n.type==='a').map(n=>n.props.href),['/jobs','/projects','/gigs','/freelancers','/jobs/new','/projects/new']);assert.equal(walk(tree,n=>n.type===React.Suspense).length,3);assert.deepEqual(walk(tree,n=>n.type===Preview).map(n=>n.props.kind),['jobs','projects','services']);assert.ok(text(tree).includes('Find work. Hire people. Offer your skills.'));assert.doesNotMatch(text(tree),/Gigs|JOX|GLIMPS/);
  });
  await check('Create has four clear English examples, secondary styling and intact personal/workplace selection',async()=>{
    const { choices } = require('./test-create-mobile.cjs');
    const tree=choices('personal=1');const copy=text(tree);assert.equal(walk(tree,n=>n.type==='h2').length,4);assert.ok(copy.includes('You are posting as'));assert.ok(copy.includes('@muh21'));assert.ok(copy.includes('Professional Profile'));assert.doesNotMatch(copy,/JOX|GLIMPS|monetize|engagement/i);
    for(const phrase of ['Share an update, idea, photo or video','Hire someone for a role','Get a specific piece of work done','Show people what you can do'])assert.ok(copy.includes(phrase));
    const examples=walk(tree,n=>n.type==='p'&&text(n).startsWith('Example:'));assert.equal(examples.length,4);assert.ok(examples.every(n=>n.props.className.includes('hidden')&&n.props.className.includes('sm:block')));
    assert.ok(walk(choices(),n=>n.props?.href==='/create?personal=1').length);
    const org=choices('organization=org');assert.deepEqual(walk(org,n=>n.type==='h2').map(text),['Share a GigThought','Post a Job']);assert.ok(walk(org,n=>n.props?.href==='/jobs/new?organization=org').length);
  });
  await check('shared timestamps wired into post/job/project/service cards and exact detail pages',()=>{
    for(const f of ['components/social/SocialHomeFeed.tsx','components/jobs/JobsClient.tsx','components/projects/ProjectsClient.tsx','components/gigs/GigCard.tsx','app/jobs/[id]/page.tsx','app/projects/[id]/page.tsx','app/gigs/[id]/page.tsx'])assert.match(source(f),/ContentTimestamp/);
    for(const f of ['app/jobs/[id]/page.tsx','app/projects/[id]/page.tsx','app/gigs/[id]/page.tsx'])assert.match(source(f),/ContentTimestamp[^>]*\bexact\b/);
    assert.match(source('components/social/PostDetailContent.tsx'),/exactTimestamp=\{post.contentDomain === "post"\}/);
    assert.match(source('components/social/SocialHomeFeed.tsx'),/post.contentDomain === "post" \? <ContentTimestamp/);
  });
  console.log(`${groups} UX correction groups PASS. Synthetic; live data/browser geometry NOT MEASURED.`);
})().catch(error=>{console.error(error);process.exitCode=1});
