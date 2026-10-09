const assert=require('node:assert/strict'),fs=require('node:fs');
const {moduleAt,walk,def,placeholder}=require('./test-makkhan-pass2.cjs');
const text=n=>typeof n==='string'?n:Array.isArray(n)?n.map(text).join(''):n?.props?text(n.props.children):'';
let groups=0;
async function check(name,fn){await fn();groups++;console.log('PASS',name)}
(async()=>{
 await check('navigation recovery and auth ceilings are separate from general operations',()=>{
  const mod=moduleAt('lib/async.ts',{});
  assert.equal(mod.AUTH_CHECK_TIMEOUT_MS,15000);assert.equal(mod.ROUTE_RECOVERY_MS,15000);
  assert.equal(mod.REQUEST_TIMEOUT_MS,60000);assert.equal(mod.OPERATION_TIMEOUT_MS,120000);
 });
 await check('slow verified-user read aborts transport without shortening other requests/uploads',async()=>{
  for(const [url,init,expected]of [['https://local.invalid/auth/v1/user',{},15000],['https://local.invalid/rest/v1/profiles',{},60000],['https://local.invalid/storage/v1/object/file',{method:'POST',body:'file'},null]]){
   let timer,delay;const mod=moduleAt('lib/async.ts',{}, {Headers,Request,Response,AbortController,setTimeout:(fn,ms)=>{timer=fn;delay=ms;return 1},clearTimeout:()=>{},fetch:async(_url,opts)=>{if(!expected)return new Response('ok');return new Promise((resolve,reject)=>opts.signal.addEventListener('abort',()=>reject(opts.signal.reason)))}});
   const pending=mod.boundedFetch(url,init);assert.equal(delay,expected===null?undefined:expected);if(expected){timer();await assert.rejects(pending,/Request timed out/)}else assert.equal((await pending).status,200);
  }
 });
 await check('server auth still verifies identity and fails closed on timeout',async()=>{
  let deadline;const mod=moduleAt('lib/auth/server.ts',{'server-only':{},react:{cache:fn=>fn},'next/headers':{},'@/lib/supabase/server':{createClient:async()=>({auth:{getUser:()=>new Promise(()=>{})}})},'@/lib/async':{AUTH_CHECK_TIMEOUT_MS:15000,withDeadline:(_p,ms)=>{deadline=ms;throw Error('timeout')}},'./return-to':{}});
  await assert.rejects(mod.getViewer(),/timeout/);assert.equal(deadline,15000);
 });
 await check('route loading exposes retry after 15 seconds and clears timer on unmount',()=>{
  let expired=false,fire,ms,cleanup,cleared=false;const Failure=placeholder('retry');const comp=moduleAt('components/layout/RouteLoading.tsx',{react:{useState:()=>[expired,v=>expired=v],useEffect:fn=>{cleanup=fn()}},'@/lib/async':{ROUTE_RECOVERY_MS:15000},'./RequestFailure':def(Failure)},{setTimeout:(fn,n)=>{fire=fn;ms=n;return 7},clearTimeout:n=>{cleared=n===7}}).default;
  assert.ok(text(comp()).includes('Opening your page'));assert.equal(ms,15000);fire();assert.equal(comp().type,Failure);cleanup();assert.equal(cleared,true);
 });
 await check('navbar avoids background route requests and mobile nav remains reachable',()=>{
  const s=fs.readFileSync('components/layout/ModernNavbar.tsx','utf8');assert.equal((s.match(/<Link\b/g)||[]).length,(s.match(/<Link prefetch=\{false\}/g)||[]).length);
  const bottom=s.slice(s.indexOf('fixed bottom-0'));assert.match(bottom,/safe-area-inset-bottom/);assert.match(bottom,/relative flex h-16 min-w-0/);assert.doesNotMatch(bottom,/mobileChromeHidden|translate-y-full/);
  assert.match(fs.readFileSync('app/layout.tsx','utf8'),/viewportFit: 'cover'/);
 });
 await check('mobile headings and search text are readable on light pages',()=>{
  assert.match(fs.readFileSync('app/network/page.tsx','utf8'),/text-h3 font-extrabold text-brand-midnight sm:text-h2/);
  assert.match(fs.readFileSync('app/network/page.tsx','utf8'),/text-base text-brand-midnight placeholder:text-brand-slate/);
  assert.match(fs.readFileSync('app/work/page.tsx','utf8'),/text-h3 font-extrabold text-brand-midnight sm:text-h1/);
 });
 console.log(`${groups} loading/mobile groups PASS; synthetic failure/mobile-class checks.`);
})().catch(error=>{console.error(error);process.exitCode=1});
