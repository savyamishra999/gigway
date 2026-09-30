// SYNTHETIC: actual modules/hooks with local I/O; no credentials or remote writes.
const assert=require('node:assert/strict'),fs=require('node:fs'),cp=require('node:child_process'),vm=require('node:vm'),ts=require('typescript'),React=require('react');
const {AsyncLocalStorage}=require('node:async_hooks');
function load(file,deps={},globals={},source=fs.readFileSync(file,'utf8')){const module={exports:{}};vm.runInNewContext(ts.transpileModule(source,{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022,jsx:ts.JsxEmit.ReactJSX,esModuleInterop:true}}).outputText,{module,exports:module.exports,URL,URLSearchParams,Headers,Request,Response,console,performance,setTimeout,clearTimeout,process:{env:{NEXT_PUBLIC_SUPABASE_URL:'https://local.invalid',NEXT_PUBLIC_SUPABASE_ANON_KEY:'local',SUPABASE_SERVICE_ROLE_KEY:'local',ADMIN_EMAILS:'admin@local.invalid'}},require:n=>n==='react/jsx-runtime'?require(n):n in deps?deps[n]:(()=>{throw Error('Unmocked '+n)})(),...globals});return module.exports;}
const plain=x=>JSON.parse(JSON.stringify(x));
const asyncTools=load('lib/async.ts');
const fast={...asyncTools,withDeadline:p=>asyncTools.withDeadline(p,35)};
const dest=load('lib/auth/return-to.ts');
const tick=()=>new Promise(r=>setTimeout(r,5));
const deferred=()=>{let resolve;const promise=new Promise(r=>resolve=r);return{promise,resolve}};
const q=result=>new Proxy({}, {get:(_,k)=>k==='then'?(ok,bad)=>Promise.resolve(result).then(ok,bad):()=>q(result)});
let groups=0;async function check(name,fn){await fn();console.log('PASS',name);groups++;}
function browser(){let user={id:'A',email:'A@local.invalid'},event,auth=0,profiles=0,failAuth=false,failProfile=false,hold=null;const states=[],changes=[];const db={auth:{getUser:async()=>{auth++;if(hold)return hold.promise;if(failAuth)throw Error('auth unavailable');return{data:{user},error:null}},onAuthStateChange(fn){event=fn;return{data:{subscription:{unsubscribe(){}}}}}},from(){profiles++;return{select(){return this},eq(_,id){this.id=id;return this},maybeSingle(){return failProfile?Promise.resolve({data:null,error:Error('profile')}):Promise.resolve({data:{full_name:this.id,avatar_url:this.id+'.png'},error:null})}}}};const {observeAuthUi}=load('lib/auth/browser-ui.ts',{'@/lib/async':fast});return{db,states,changes,start:()=>observeAuthUi(db,s=>states.push(plain(s)),v=>changes.push(v)),emit:(e,u=user)=>event(e,u?{user:u}:null),setUser:u=>user=u,failAuth:()=>failAuth=true,failProfile:()=>failProfile=true,hold:()=>hold=deferred(),counts:()=>({auth,profiles})};}
(async()=>{
 await check('BEFORE mounted navbar + login duplicate auth reads = 2 (actual baseline hooks)',async()=>{
  let calls=0;const effects=[];const db={auth:{getUser:async()=>{calls++;return{data:{user:null},error:null}},onAuthStateChange:()=>({data:{subscription:{unsubscribe(){}}}})}};
  for(const file of ['components/layout/ModernNavbar.tsx','app/login/page.tsx']){
   const source=cp.execFileSync('git',['show','b86c703ebc0112b8837be87f9890bf2e815aee7c:'+file],{encoding:'utf8'});const deps={};for(const m of source.matchAll(/from\s+["']([^"']+)["']/g))deps[m[1]]=new Proxy({__esModule:true,default:()=>null},{get:(o,k)=>k in o?o[k]:()=>null});
   Object.assign(deps,{react:{...React,useState:v=>[v,()=>{}],useEffect:fn=>effects.push(fn)},'@/lib/async':fast,'@/lib/auth/return-to':dest,'@/lib/supabase/client':{createClient:()=>db},'next/navigation':{usePathname:()=>'/login',useRouter:()=>({}),useSearchParams:()=>new URLSearchParams()}});
   const mod=load(file,deps,{window:{scrollY:0,addEventListener(){},removeEventListener(){}}},source),tree=mod.default({moment:null});if(file.includes('/login/'))tree.props.children.type();
  }
  effects.forEach(fn=>fn());await tick();assert.equal(calls,2);
 });
 await check('AFTER shared initial identity = 1 auth + 1 profile; same-account events add zero',async()=>{
  const f=browser(),stop=f.start();await tick();f.emit('INITIAL_SESSION');f.emit('SIGNED_IN');f.emit('SIGNED_IN');f.emit('TOKEN_REFRESHED');await tick();assert.deepEqual(f.counts(),{auth:1,profiles:1});assert.equal(f.states.at(-1).profile.full_name,'A');stop();
 });
 await check('A to B to A clears stale identity and reloads document; signout clears guest state',async()=>{
  const f=browser(),stop=f.start();await tick();for(const id of ['B','A']){f.setUser({id});f.emit('SIGNED_IN');assert.equal(f.states.at(-1).user,null);assert.equal(f.states.at(-1).profile,null);await tick();assert.equal(f.states.at(-1).user.id,id);assert.equal(f.states.at(-1).profile.full_name,id);}assert.deepEqual(f.changes,[true,true]);f.emit('SIGNED_OUT',null);assert.deepEqual(f.states.at(-1),{user:null,profile:null});assert.equal(f.changes.at(-1),false);stop();
 });
 await check('late A auth response cannot overwrite B/signout; cleanup ignores pending work',async()=>{
  const f=browser(),hold=f.hold(),stop=f.start();await tick();f.setUser({id:'B'});f.emit('SIGNED_IN');f.emit('SIGNED_OUT',null);hold.resolve({data:{user:{id:'A'}},error:null});await tick();assert.deepEqual(f.states.at(-1),{user:null,profile:null});const n=f.states.length;stop();await tick();assert.equal(f.states.length,n);
 });
 await check('late A profile cannot overwrite B and repeated in-flight B events coalesce',async()=>{
  const f=browser(),pending=deferred();let calls=0;
  f.db.from=()=>({select(){return this},eq(_,id){this.id=id;return this},maybeSingle(){calls++;return this.id==='A'?pending.promise:Promise.resolve({data:{full_name:this.id},error:null})}});
  const stop=f.start();await tick();f.setUser({id:'B'});f.emit('SIGNED_IN');f.emit('SIGNED_IN');await tick();pending.resolve({data:{full_name:'A'},error:null});await tick();assert.equal(f.states.at(-1).profile.full_name,'B');assert.equal(f.counts().auth,2);assert.equal(calls,2);stop();
 });
 await check('optional auth/profile failures and timeout settle without blocking content; StrictMode coalesces',async()=>{
  for(const fault of ['auth','profile','timeout']){const f=browser();if(fault==='auth')f.failAuth();if(fault==='profile')f.failProfile();if(fault==='timeout')f.hold();const stop=f.start();await new Promise(r=>setTimeout(r,50));assert.ok(f.states.every(s=>s.profile===null));stop();}
  const f=browser(),first=f.start();first();const second=f.start();await tick();assert.equal(f.counts().auth,1);second();
 });
 await check('request-scoped viewer/client reuse and cross-request account isolation',async()=>{
  const scope=new AsyncLocalStorage();const cache=fn=>{const key=Symbol();return(...args)=>{const request=scope.getStore();if(!request)return fn(...args);if(!request.memo.has(key))request.memo.set(key,new Map());const entries=request.memo.get(key),k=JSON.stringify(args);if(!entries.has(k))entries.set(k,fn(...args));return entries.get(k)}};
  let clients=0,reads=0;const server=load('lib/supabase/server.ts',{react:{cache},'@supabase/ssr':{createServerClient:()=>{clients++;const user=scope.getStore().user;return{auth:{getUser:async()=>{reads++;return{data:{user},error:null}}}}}},'@/lib/async':fast,'next/headers':{cookies:async()=>({get(){}})}});
  const auth=load('lib/auth/server.ts',{'server-only':{},react:{cache},'next/headers':{},'@/lib/supabase/server':server,'@/lib/async':fast,'./return-to':dest});
  await Promise.all(['A','B'].map(id=>scope.run({user:{id},memo:new Map()},async()=>{const results=await Promise.all([auth.getViewer(),auth.getViewer(),auth.getViewer()]);assert.ok(results.every(u=>u.id===id));assert.equal(await server.createClient(),await server.createClient());})));assert.equal(reads,2);assert.equal(clients,2);
 });
 await check('server viewer errors fail closed; absent session alone is guest',async()=>{
  for(const error of [{name:'AuthSessionMissingError'},{name:'AuthApiError'}]){const auth=load('lib/auth/server.ts',{'server-only':{},react:{cache:fn=>fn},'next/headers':{},'@/lib/supabase/server':{createClient:async()=>({auth:{getUser:async()=>({data:{user:null},error})}})},'@/lib/async':fast,'./return-to':dest});if(error.name==='AuthSessionMissingError')assert.equal(await auth.getViewer(),null);else await assert.rejects(auth.getViewer(),/session could not be checked/);}
 });
 await check('middleware retains refresh/cookies, skips Work and callback, and times out finitely',async()=>{
  const {NextRequest,NextResponse}=require('next/server');let reads=0;const mid=load('middleware.ts',{'next/server':{NextRequest,NextResponse},'@/lib/async':fast,'@/lib/auth/return-to':dest,'@supabase/ssr':{createServerClient:()=>({auth:{getSession:()=>{reads++;return new Promise(()=>{})}}})}}).middleware;
  for(const p of ['/work','/auth/callback?code=fixture','/login','/u/person'])assert.equal((await mid(new NextRequest('https://local.invalid'+p))).status,200);assert.equal(reads,0);assert.equal((await mid(new NextRequest('https://local.invalid/profile'))).status,503);
 });
 await check('PKCE callback retains new-user setup and avatar behavior; completion decision stays post-login',async()=>{
  const {NextResponse}=require('next/server');let profile={id:'B'},selected=[],writes=[],exchange=0;
  const callback=load('app/auth/callback/route.ts',{'next/server':{NextResponse},'@/lib/async':fast,'@/lib/auth/return-to':dest,'next/headers':{cookies:async()=>({get(){},set(){}})},'@supabase/ssr':{createServerClient:()=>({auth:{exchangeCodeForSession:async()=>{exchange++;return{data:{user:{id:'B',email:'b@local.invalid',user_metadata:{avatar_url:'google'}}},error:null}}},from:()=>({select:s=>{selected.push(s);return q({data:profile,error:null})}})})},'@supabase/supabase-js':{createClient:()=>({from:()=>({upsert:(row,options)=>{writes.push({row,options});return Promise.resolve({error:null})}})})}}).GET;
  for(const p of [{id:'B'},null]){profile=p;const response=await callback(new Request('https://local.invalid/auth/callback?code=pkce&next=%2Fwork'));assert.equal(response.headers.get('location'),'https://local.invalid/auth/post-login?next=%2Fwork');}
  assert.deepEqual(selected,['id','id']);assert.equal(exchange,2);assert.equal(writes.length,1);assert.equal(writes[0].row.id,'B');assert.equal(writes[0].row.avatar_url,null);assert.equal(writes[0].options.ignoreDuplicates,true);
 });
 await check('USER_UPDATED refreshes UI; mismatched auth identity is never published',async()=>{
  const f=browser(),stop=f.start();await tick();f.emit('USER_UPDATED');await tick();assert.equal(f.counts().auth,2);assert.equal(f.counts().profiles,2);f.emit('SIGNED_IN',{id:'B'});await tick();assert.equal(f.states.at(-1).user,null);assert.ok(!f.states.some(s=>s.user?.id==='B'));stop();
 });
 await check('actual provider clears document cache on switch/logout but preserves login ownership',()=>{
  let effect,changed;const urls=[];const location={pathname:'/profile',search:'?tab=account',hash:'',replace:url=>urls.push(url)};
  const mod=load('components/layout/AuthUiProvider.tsx',{react:{createContext:()=>({Provider:()=>null}),useContext:()=>null,useRef:()=>({current:null}),useState:v=>[v,()=>{}],useEffect:fn=>effect=fn},'@/lib/supabase/client':{createClient:()=>({})},'@/lib/auth/browser-ui':{observeAuthUi:(_,__,cb)=>{changed=cb;return()=>{}}},'@/lib/auth/return-to':dest},{window:{location}});
  mod.default({children:'useful content'});effect();changed(true);assert.equal(urls[0],'/auth/post-login?next=%2Fprofile%3Ftab%3Daccount');changed(false);assert.equal(urls[1],'/');location.pathname='/login';changed(true);assert.equal(urls.length,2);changed(false);assert.equal(urls[2],'/');
 });
 await check('provider invalidates document state on account changes and shares identity with login/navbar',()=>{
  const provider=fs.readFileSync('components/layout/AuthUiProvider.tsx','utf8'),nav=fs.readFileSync('components/layout/ModernNavbar.tsx','utf8'),login=fs.readFileSync('app/login/page.tsx','utf8');assert.match(provider,/window.location.replace/);assert.match(provider,/safeReturnTo/);assert.doesNotMatch(nav+login,/auth.getUser\(|auth.getSession\(|onAuthStateChange/);assert.match(nav,/\[pathname, user\]/);assert.match(login,/useAuthUi\(\)/);assert.match(fs.readFileSync('app/layout.tsx','utf8'),/<AuthUiProvider>/);
 });
 await check('profile edit fails on query error instead of misrouting to completion',async()=>{
  const noop=()=>null;const page=load('app/profile/edit/page.tsx',{'@/lib/auth/server':{getViewer:async()=>({id:'A'}),completionForCurrent:async()=>'/profile/complete',loginForCurrent:async()=>'/login'},'@/lib/supabase/server':{createClient:async()=>({from:()=>q({data:null,error:Error('offline')})})},'next/navigation':{redirect:p=>{throw Error('redirect:'+p)}},'@/components/profile/EditProfileForm':{default:noop},'@/components/identity/WorkModesEditor':{default:noop}}).default;await assert.rejects(page({searchParams:Promise.resolve({})}),/profile could not be checked/);
 });
 await check('navbar logout success has one provider-owned navigation; failures recheck root',async()=>{
  for(const failure of [false,true]){
    let position=0,signouts=0;const urls=[];
    const deps={};const source=fs.readFileSync('components/layout/ModernNavbar.tsx','utf8');for(const m of source.matchAll(/from\s+["']([^"']+)["']/g))deps[m[1]]=new Proxy({__esModule:true,default:()=>null},{get:(o,k)=>k in o?o[k]:()=>null});
    Object.assign(deps,{react:{useEffect(){},useState:()=>[position++===0,()=>{}]},'@/components/layout/AuthUiProvider':{useAuthUi:()=>({user:{id:'A'},profile:null})},'@/lib/async':fast,'@/lib/auth/return-to':dest,'next/navigation':{usePathname:()=>'/profile',useRouter:()=>({})},'@/lib/supabase/client':{createClient:()=>({auth:{signOut:async options=>{signouts++;assert.equal(options.scope,'local');if(!failure)urls.push('provider:/');return{error:failure?Error('network'):null}}}})}});
    const tree=load('components/layout/ModernNavbar.tsx',deps,{window:{location:{replace:url=>urls.push(url)}}}).default({moment:null});
    const walk=n=>{if(!n||typeof n!=='object')return null;if(n.type==='button'&&n.props.onClick?.name==='logout')return n;for(const child of React.Children.toArray(n.props?.children)){const found=walk(child);if(found)return found;}return null};
    const button=walk(tree);assert.ok(button);await button.props.onClick();assert.equal(signouts,1);assert.deepEqual(urls,[failure?'/':'provider:/']);
  }
 });
 await check('Network boot rejection reaches terminal error without endless spinner',async()=>{
  const values=[],effects=[];let i=0;const hooks={useState:v=>{const n=i++;values[n]=v;return[v,x=>values[n]=x]},useEffect:fn=>effects.push(fn)};
  const mod=load('components/connections/NetworkClient.tsx',{react:hooks,'next/link':{default:()=>null},'lucide-react':new Proxy({},{get:()=>()=>null}),'@/components/ui/profile-avatar':{ProfileAvatar:()=>null},'@/lib/async':{boundedFetch:async()=>{throw Error('offline')}}});mod.default();effects.forEach(fn=>fn());await tick();assert.equal(values[2],false);assert.match(values[4],/Could not load network/);
 });
 await check('profile-only save refreshes mounted name/avatar without another auth read',async()=>{
  let name='Old',auth=0,profiles=0;const states=[];
  const db={auth:{getUser:async()=>{auth++;return{data:{user:{id:'A'}},error:null}},onAuthStateChange:()=>({data:{subscription:{unsubscribe(){}}}})},from:()=>{profiles++;return q({data:{full_name:name,avatar_url:name+'.png'},error:null})}};
  const stop=load('lib/auth/browser-ui.ts',{'@/lib/async':fast}).observeAuthUi(db,s=>states.push(plain(s)),()=>{});await tick();name='New';
  await stop.refreshProfile('A');assert.equal(states.at(-1).profile.full_name,'New');assert.equal(states.at(-1).profile.avatar_url,'New.png');assert.equal(auth,1);assert.equal(profiles,2);stop();
 });
 await check('new profile refresh wins over old response; A save after switch to B is ignored',async()=>{
  const f=browser(),old=deferred();let reads=0;
  f.db.from=()=>({select(){return this},eq(_,id){this.id=id;return this},maybeSingle(){reads++;return reads===1?old.promise:Promise.resolve({data:{full_name:this.id+' updated',avatar_url:'new.png'},error:null})}});
  const stop=f.start();await tick();await stop.refreshProfile('A');assert.equal(f.states.at(-1).profile.full_name,'A updated');old.resolve({data:{full_name:'A old',avatar_url:'old.png'},error:null});await tick();assert.equal(f.states.at(-1).profile.full_name,'A updated');assert.equal(f.counts().auth,1);
  f.setUser({id:'B'});f.emit('SIGNED_IN');assert.equal(f.states.at(-1).profile,null);await tick();const count=reads;await stop.refreshProfile('A');assert.equal(reads,count);assert.equal(f.states.at(-1).user.id,'B');assert.equal(f.states.at(-1).profile.full_name,'B updated');stop();
 });
 await check('successful actual edit save notifies provider; rejected save does not',async()=>{
  for(const ok of [true,false]){
    const source=fs.readFileSync('components/profile/EditProfileForm.tsx','utf8'),deps={};for(const m of source.matchAll(/from\s+["']([^"']+)["']/g))deps[m[1]]=new Proxy({__esModule:true,default:()=>null},{get:(o,k)=>k in o?o[k]:()=>null});
    const calls=[],values=[];let index=0;
    Object.assign(deps,{react:{useState:v=>{const i=index++;values[i]=v;return[v,n=>values[i]=n]}},'next/navigation':{useRouter:()=>({refresh:()=>calls.push('router')})},'@/lib/roles':{resolveRoles:()=>({})},'@/components/layout/AuthUiProvider':{useAuthUi:()=>({refreshProfile:id=>calls.push(id)})}});
    const mod=load('components/profile/EditProfileForm.tsx',deps,{fetch:async()=>({ok,json:async()=>ok?{success:true}:{error:'rejected'}})});
    const tree=mod.default({profile:{id:'A',full_name:'Saved name',avatar_url:'saved.png'},userId:'A'});
    const walk=n=>{if(!n||typeof n!=='object')return null;if(n.props?.onClick?.name==='handleSave')return n;for(const c of React.Children.toArray(n.props?.children)){const found=walk(c);if(found)return found}return null};
    const button=walk(tree);assert.ok(button);await button.props.onClick();assert.deepEqual(calls,ok?['A','router']:[]);
  }
 });
 await check('Work renders only static links; exact exclusion does not bypass child/target guards',async()=>{
  const source=fs.readFileSync('app/work/page.tsx','utf8');assert.doesNotMatch(source,/getUser|getViewer|createClient|fetch\(|saved|profile_intents/);
  const Link=()=>null;const page=load('app/work/page.tsx',{'next/link':{__esModule:true,default:Link},'lucide-react':new Proxy({},{get:()=>()=>null})}).default();
  const links=[];const walk=n=>{if(!n||typeof n!=='object')return;if(n.type===Link)links.push(n.props.href);React.Children.forEach(n.props?.children,walk)};walk(page);assert.deepEqual(links,['/jobs','/projects','/gigs','/freelancers']);
  const {NextRequest,NextResponse}=require('next/server');let reads=0;const mid=load('middleware.ts',{'next/server':{NextRequest,NextResponse},'@/lib/async':fast,'@/lib/auth/return-to':dest,'@supabase/ssr':{createServerClient:()=>({auth:{getSession:async()=>{reads++;return{data:{session:null},error:null}}}})}}).middleware;
  await mid(new NextRequest('https://local.invalid/work'));assert.equal(reads,0);await mid(new NextRequest('https://local.invalid/work/private'));assert.equal(reads,1);
  for(const p of ['/jobs/new','/projects/new','/gigs/new','/saved']){const response=await mid(new NextRequest('https://local.invalid'+p));assert.equal(new URL(response.headers.get('location')).pathname,'/login');}
 });
 await check('root redirect retains cookies and canonical authoritative one-read identity gate',async()=>{
  const {NextRequest,NextResponse}=require('next/server');let profiles=0,auth=0;
  const mid=load('middleware.ts',{'next/server':{NextRequest,NextResponse},'@/lib/async':fast,'@/lib/auth/return-to':dest,'@supabase/ssr':{createServerClient:(_,__,o)=>({auth:{getSession:async()=>{o.cookies.setAll([{name:'session',value:'fresh',options:{path:'/'}}]);return{data:{session:{user:{id:'A'}}},error:null}}}})}}).middleware;
  const response=await mid(new NextRequest('https://local.invalid/'));assert.equal(response.status,307);assert.equal(new URL(response.headers.get('location')).pathname,'/auth/post-login');assert.equal(response.cookies.get('session').value,'fresh');assert.equal(response.headers.get('x-middleware-rewrite'),null);
  const page=load('app/auth/post-login/page.tsx',{'next/navigation':{redirect:p=>{throw Error('redirect:'+p)}},'@/lib/auth/return-to':dest,'@/lib/auth/server':{getViewer:async()=>{auth++;return{id:'A'}}},'@/lib/supabase/server':{createClient:async()=>({from:()=>{profiles++;return q({data:{profile_completed:true,username:'a'},error:null})}})}}).default;
  await assert.rejects(page({searchParams:Promise.resolve({})}),/redirect:\/home$/);assert.equal(auth,1);assert.equal(profiles,1);
 });
 console.log(groups+' auth/navigation groups PASS; SYNTHETIC, no live auth/database/browser timings.');
})().catch(e=>{console.error(e);process.exitCode=1});
