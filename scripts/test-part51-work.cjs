const assert = require('node:assert/strict');
const fs = require('node:fs');
const React = require('react');
const {renderToStaticMarkup} = require('react-dom/server');
const {moduleAt,walk,def,placeholder} = require('./test-makkhan-pass2.cjs');
const source = f => fs.readFileSync(f,'utf8');
const dates = moduleAt('lib/content-time.ts',{});
function fixture(rows=[],error=null){
  const calls=[];
  const db={from(table){const c={table,orders:[]};calls.push(c);const q={select(fields){c.fields=fields;return q},eq(k,v){c.filter=[k,v];return q},order(k){c.orders.push(k);return q},limit(n){c.limit=n;return q},then(resolve){return Promise.resolve({data:rows,error:error||(c.fields.includes('owner_id(')?{code:'PGRST200'}:null)}).then(resolve)}};return q}};
  return {calls,load:moduleAt('lib/work/previews.ts',{'server-only':{},'@/lib/supabase/server':{createClient:async()=>db}}).workPreviews};
}
const Link = ({prefetch,children,...props}) => React.createElement('a',props,children);
const timestamp = p => React.createElement('span',null,dates.contentTimestamp(p.createdAt,p.updatedAt)?.label);
function rail(load){return moduleAt('components/work/WorkPreviewRail.tsx',{'next/link':def(Link),'@/components/ui/ContentTimestamp':def(timestamp),'@/components/work/WorkCreationLink':def('a'),'@/lib/work/previews':{workPreviews:load}})}
(async()=>{
  for(const count of [0,1,6,9]){
    const f=fixture(Array.from({length:count},(_,i)=>({id:String(i),title:'Service '+i,created_at:'2026-09-01T12:00:00Z',price:null,category:null,professional:i%2?null:{full_name:'Professional'}})));
    const result=await f.load('services');assert.equal(result.unavailable,false);assert.equal(result.items.length,Math.min(count,6));
    assert.equal(f.calls[0].limit,6);assert.equal(f.calls[0].fields,'*,professional:freelancer_id(full_name)');assert.equal(JSON.stringify(f.calls[0].filter),'["status","active"]');assert.equal(f.calls[0].orders.join(','),'created_at,id');
    assert.ok(result.items.every(i=>i.updatedAt===undefined&&i.amount===null&&i.detail===null));
    const html=renderToStaticMarkup(await rail(async()=>result).default({kind:'services'}));assert.ok(html.includes('href="/gigs"'));
    assert.equal((html.match(/<article/g)||[]).length,Math.min(count,6));assert.doesNotMatch(html,/undefined|NaN/);
    if(count===0){assert.match(html,/No services available yet/);assert.doesNotMatch(html,/role="region"/)}else{assert.match(html,/href="\/gigs\/0"/);assert.match(html,/Posted/)}
  }
  console.log('PASS Services zero/one/six/overflow fixtures, nullable provider/category/price, absent updated_at and bounded query');
  for(const professional of [null,{},[],[{full_name:'Array provider'}],{full_name:'Object provider'}]){
    const f=fixture([{id:'one',title:'Service',professional,price:0,created_at:'2026-09-01T12:00:00Z',updated_at:'2026-09-02T12:00:00Z'}]);const result=await f.load('services');assert.equal(result.unavailable,false);assert.equal(result.items[0].amount,0);assert.equal(dates.contentTimestamp(result.items[0].createdAt,result.items[0].updatedAt).label,'Updated');
  }
  for(const updated of [undefined,null,'invalid','2026-09-01T12:00:00Z'])assert.equal(dates.contentTimestamp('2026-09-01T12:00:00Z',updated).label,'Posted');
  console.log('PASS provider shapes, zero price and shared Posted/Updated compatibility');
  const failed=await fixture([],new Error('backend failure')).load('services');assert.equal(failed.unavailable,true);const failedHtml=renderToStaticMarkup(await rail(async()=>failed).default({kind:'services'}));assert.match(failedHtml,/could not be loaded/);assert.match(failedHtml,/href="\/gigs"/);
  const page=moduleAt('app/work/page.tsx',{react:React,'next/link':def('a'),'@/components/work/WorkPreviewRail':{...def(placeholder('rail')),WorkPreviewFallback:placeholder('fallback')}}).default();const boundaries=walk(page,n=>n.type===React.Suspense);assert.equal(boundaries.length,3);assert.equal(boundaries.map(n=>n.props.children.props.kind).join(','),'jobs,projects,services');
  for(const b of boundaries)assert.equal(b.props.children.props.kind,b.props.fallback.props.kind);
  assert.doesNotMatch(source('app/work/page.tsx'),/getViewer|getUser|getSession|Promise\.all/);assert.match(source('middleware.ts'),/const publicRoute = pathname === "\/work"/);
  for(const f of ['components/work/WorkPreviewRail.tsx','lib/work/previews.ts'])assert.doesNotMatch(source(f),/useEffect|"use client"|fetch\(/);
  const mod=rail(async()=>({items:[{id:'one',title:'Service'}],unavailable:false}));const loaded=renderToStaticMarkup(await mod.default({kind:'services'})),loading=renderToStaticMarkup(mod.WorkPreviewFallback({kind:'services'}));
  for(const html of [loaded,loading]){assert.match(html,/min-h-72/);assert.match(html,/min-h-\[18.75rem\]/);assert.match(html,/id="work-services"/);assert.match(html,/href="\/gigs"/)}
  assert.match(loading,/aria-busy="true"/);assert.match(loading,/role="status"/);
  for(const f of ['app/gigs/page.tsx','app/gigs/[id]/page.tsx'])assert.match(source(f),/profiles:freelancer_id/);
  console.log('PASS finite failure, independent streaming, public auth exclusion, SSR/no refetch and shared fallback geometry');
})().catch(e=>{console.error(e);process.exitCode=1});
