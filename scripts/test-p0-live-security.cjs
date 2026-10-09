// Source contracts and actual route/guard execution with synthetic I/O.
// This is NOT a substitute for PostgreSQL/PostgREST denial tests.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const { moduleAt } = require('./test-makkhan-pass2.cjs');
const read = f => fs.readFileSync(f, 'utf8');
const migration = read('supabase/migrations/20261008053956_p0_profile_privileges_and_membership_lockdown.sql');
const fields = moduleAt('lib/profile/fields.ts', {});
const denied = ['aadhaar_front_url','aadhaar_back_url','ban_reason','is_banned','connects_balance','subscription_tier','user_roles','roles','is_verified','verification_status','verification_paid_at','avg_rating','plan','priority_credits','id','email','profile_completed'];
const publicList = migration.slice(migration.indexOf('-- Option 2:'), migration.indexOf("EXECUTE format('GRANT SELECT"));
const sqlLists=[...migration.matchAll(/AND attname = ANY \(ARRAY\[([\s\S]*?)\]\)/g)].map(m=>[...m[1].matchAll(/'([^']+)'/g)].map(m=>m[1]));
assert.deepEqual([...sqlLists[1]].sort(),[...fields.OWNER_EDITABLE_PROFILE_FIELDS].sort(),'SQL and API owner fields must agree');
for(const key of ['aadhaar_front_url','aadhaar_back_url','ban_reason','verification_doc','roles'])assert.ok(!sqlLists[2].includes(key),'Owner facade excludes '+key);
for (const field of denied.filter(f => !['id','is_verified','avg_rating','profile_completed'].includes(f))) {
  assert.ok(!publicList.includes(`'${field}'`), `${field} must not be public`);
}
for (const field of denied) assert.ok(!fields.OWNER_EDITABLE_PROFILE_FIELDS.includes(field), `${field} must not be owner editable`);
assert.match(migration, /REVOKE ALL ON TABLE public\.profiles FROM PUBLIC, anon, authenticated/);
assert.match(migration, /ALTER TABLE public\.subscriptions ENABLE ROW LEVEL SECURITY/);
assert.match(migration, /REVOKE ALL ON TABLE public\.subscriptions FROM PUBLIC, anon, authenticated/);
assert.match(migration, /p0_subscriptions_client_closed ON public\.subscriptions\s+AS RESTRICTIVE FOR ALL TO anon, authenticated USING \(false\) WITH CHECK \(false\)/);
assert.match(migration, /Unexpected subscriptions column privilege/);
assert.match(migration, /Required service_role subscriptions privilege missing/);
assert.doesNotMatch(migration, /GRANT [^;]*ON (?:TABLE )?public\.subscriptions TO (?:anon|authenticated)/);
assert.match(migration, /REVOKE SELECT \(%1\$I\), INSERT \(%1\$I\), UPDATE \(%1\$I\)/);
assert.match(migration, /security_barrier = true, security_invoker = false/);
assert.match(migration, /WHERE p\.id = \(SELECT auth\.uid\(\)\)/);
assert.match(migration, /GRANT SELECT ON public\.own_profiles TO authenticated/);
assert.doesNotMatch(migration, /GRANT (?:ALL|UPDATE|INSERT|DELETE).*own_profiles/);
assert.match(migration, /DROP POLICY IF EXISTS organization_members_insert_self/);
assert.match(migration, /REVOKE INSERT, UPDATE, DELETE, TRUNCATE, REFERENCES, TRIGGER/);
assert.match(migration, /p0_membership_insert_closed[\s\S]*?WITH CHECK \(false\)/);
assert.match(migration, /ALTER FUNCTION public\.handle_new_user\(\) SET search_path = pg_catalog, public, pg_temp/);
for (const name of ['handle_new_user','give_signup_connects','update_avg_rating']) {
  assert.ok(migration.includes(`REVOKE ALL ON FUNCTION public.${name}() FROM PUBLIC, anon, authenticated;`));
}
assert.match(migration, /REVOKE CREATE ON SCHEMA public FROM PUBLIC, anon, authenticated/);
assert.match(migration, /REVOKE ALL ON FUNCTION public\.increment_connects\(uuid,integer\) FROM PUBLIC, anon, authenticated/);
assert.doesNotMatch(migration, /DROP TRIGGER|CREATE.*give_signup_connects|UPDATE public\.profiles SET connects_balance/);
assert.doesNotMatch(read('app/auth/callback/route.ts'), /rpc\("increment_connects"/);
assert.match(read('app/refer/page.tsx'), /Referral rewards are paused/);
assert.doesNotMatch(read('app/organizations/[username]/team/page.tsx'), /\.insert\(|\.update\(|\.delete\(/);
for (const flag of ['ESCROW_LAUNCH_ENABLED','BILLING_LAUNCH_ENABLED','VERIFICATION_COLLECTION_ENABLED']) {
  assert.match(read('lib/billing/launch.ts'), new RegExp(`${flag} = false`));
}
assert.ok(fields.validLegacyWorkPreferences({user_roles:['find_work'],find_work_type:'freelancer'}));
for (const roles of [['admin'],['owner'],['find_work','admin'],['find_work','find_work'],'admin',[]]) {
  assert.equal(fields.validLegacyWorkPreferences({user_roles:roles}),false);
}
assert.equal(fields.validLegacyWorkPreferences({user_roles:['hire_talent'],account_type:'admin'}),false);

const json = {NextResponse:{json:(body,options)=>Response.json(body,options)}};
async function profileRouteTest() {
  let user = {id:'owner'}, writes=[];
  const db = {auth:{getUser:async()=>({data:{user}})},from(table){
    assert.equal(table,'profiles'); let payload;
    const query={select(){return query},update(value){payload=value;return query},eq(key,value){assert.equal(key,'id');assert.equal(value,'owner');return query},maybeSingle:async()=>({data:{portfolio_links:[]},error:null}),then(resolve){if(payload)writes.push(payload);resolve({error:null})}};
    return query;
  }};
  const PATCH=moduleAt('app/api/profile/route.ts',{'next/server':json,'@/lib/supabase/server':{createClient:async()=>db},'@/lib/profile/fields':fields,'@/lib/billing/limits':{getUsageLimit:async()=>({used:0,limit:5})},'@/lib/identity/username-server':{checkUsernameClaim:async()=>({username:'safe-name'})}}).PATCH;
  const request = body => new Request('https://local.invalid',{method:'PATCH',body:JSON.stringify(body)});
  const forged=Object.fromEntries(denied.map(key=>[key,'forged']));
  assert.equal((await PATCH(request({...forged,full_name:'Safe Name'}))).status,200);
  assert.deepEqual(JSON.parse(JSON.stringify(writes)),[{full_name:'Safe Name'}]);
  assert.equal((await PATCH(request(forged))).status,400);
  assert.equal((await PATCH(request(null))).status,400);
  user=null;
  assert.equal((await PATCH(request({full_name:'Denied'}))).status,401);
  assert.equal(writes.length,1);
}
async function workplaceTest() {
  let user={id:'actor'}, writes=[];
  const service={from(table){let value; const q={insert(v){value=v;writes.push({table,value:v});return q},select(){return q},single:async()=>({data:{id:'new-org',username:'workplace'},error:null})};return q}};
  // Inserts are awaited directly for membership; use a thenable too.
  const from=service.from;service.from=table=>{const q=from(table);q.then=resolve=>resolve({error:null});return q};
  const POST=moduleAt('app/api/organizations/create/route.ts',{'next/server':json,'@/lib/supabase/server':{createClient:async()=>({auth:{getUser:async()=>({data:{user}})}})},'@supabase/supabase-js':{createClient:()=>service},'@/lib/identity':{normalizeUsername:v=>v,usernameError:()=>null},'@/lib/identity/username-server':{checkUsernameClaim:async()=>({})}},{process:{env:{}}}).POST;
  const request=()=>new Request('https://local.invalid',{method:'POST',body:JSON.stringify({name:'Workplace',username:'workplace',created_by:'victim',organization_id:'victim-org',profile_id:'victim',member_role:'admin',status:'pending',is_primary:false})});
  assert.equal((await POST(request())).status,201);
  assert.equal(writes[0].value.created_by,'actor');
  assert.deepEqual(JSON.parse(JSON.stringify(writes[1].value)),{organization_id:'new-org',profile_id:'actor',member_role:'owner',status:'active',is_primary:true});
  user=null; assert.equal((await POST(request())).status,401);assert.equal(writes.length,2);
}
async function banTest() {
  const {mutationGuard}=moduleAt('lib/supabase/mutation-guard.ts',{}, {URL,Request,Response});
  for(const state of ['banned','active','error']) {
    let writes=0,reads=0;
    const db={auth:{getUser:async()=>({data:{user:{id:'actor',user_metadata:{is_banned:false,role:'admin'}}},error:null})},from(table){assert.equal(table,'own_profiles');return{select(value){assert.equal(value,'is_banned');return this},eq(key,value){assert.equal(value,'actor');return this},maybeSingle:async()=>{reads++;return{data:{is_banned:state==='banned'},error:state==='error'?Error('unavailable'):null}}}}};
    const guarded=mutationGuard(db,async()=>{writes++;return new Response('ok')});
    const response=await guarded('https://local.invalid/rest/v1/profiles',{method:'PATCH'});
    assert.equal(response.status,state==='active'?200:state==='banned'?403:503);assert.equal(writes,state==='active'?1:0);assert.ok(reads);
  }
}
async function onboardingTest(){
  const writes=[];const service={from(table){assert.equal(table,'profiles');return{upsert:async value=>{writes.push(value);return{error:null}}}}};
  const POST=moduleAt('app/api/onboarding/complete/route.ts',{'next/server':json,'@/lib/supabase/server':{createClient:async()=>({auth:{getUser:async()=>({data:{user:{id:'actor',email:'actor@example.invalid'}},error:null})}})},'@supabase/supabase-js':{createClient:()=>service},'@/lib/billing/limits':{},'@/lib/profile/fields':fields},{process:{env:{}}}).POST;
  const request=body=>new Request('https://local.invalid',{method:'POST',body:JSON.stringify(body)});
  assert.equal((await POST(request({full_name:'Person',user_roles:['admin']}))).status,400);assert.equal(writes.length,0);
  assert.equal((await POST(request({full_name:'Person',user_roles:['find_work'],id:'victim',email:'victim@example.invalid',is_banned:false,connects_balance:999,aadhaar_front_url:'forged'}))).status,200);
  assert.equal(writes[0].id,'actor');assert.equal(writes[0].email,'actor@example.invalid');
  for(const key of ['is_banned','connects_balance','aadhaar_front_url'])assert.ok(!(key in writes[0]));
}
async function adminCompatibilityTest(){
  const target='11111111-1111-4111-8111-111111111111';
  let user=null,clients=0,fail=false,absent=false,logFail=false;const writes=[];
  const env={ADMIN_EMAILS:'admin@example.invalid',SUPABASE_SERVICE_ROLE_KEY:'synthetic',NEXT_PUBLIC_SUPABASE_URL:'https://local.invalid'};
  const db={from(table){let payload;const q={select(){return q},eq(key,id){assert.equal(key,table==='profiles'?'id':'status');assert.equal(id,table==='profiles'?target:'active');return q},ilike(key,value){assert.equal(key,'email');assert.equal(value,'person@example.invalid');return q},order(){return q},limit(){return q},update(value){payload=value;writes.push(value);return q},insert(value){payload=value;return q},maybeSingle:async()=>({data:absent?null:{id:target,email:'person@example.invalid'},error:fail?{code:'denied'}:null}),single:async()=>({data:{id:'audit'},error:logFail?{code:'audit_failure'}:null}),then(resolve){resolve({data:[],error:fail?{code:'denied'}:null})}};return q}};
  class NextResponse extends Response {static json(body,options){return Response.json(body,options)}}
  const deps={'next/server':{NextResponse},'@/lib/supabase/server':{createClient:async()=>({auth:{getUser:async()=>({data:{user}})},from(){throw Error('Sensitive operation on session client')}})},'@supabase/supabase-js':{createClient:()=>{clients++;return db}}};
  const load=f=>moduleAt(f,deps,{process:{env}});
  const lookup=load('app/api/admin/find-user/route.ts').GET,grant=load('app/api/admin/special-grant/route.ts').POST,exportCsv=load('app/api/admin/revenue/export/route.ts').GET;
  const lookupReq={nextUrl:new URL('https://local.invalid?email=person@example.invalid')};
  const grantReq=grantType=>new Request('https://local.invalid',{method:'POST',body:JSON.stringify({userId:target,grantType,adminId:'forged',is_banned:true})});
  for(const action of [()=>lookup(lookupReq),()=>grant(grantReq('remove_ban')),()=>exportCsv()]){assert.equal((await action()).status,401)}
  user={id:'actor',email:'person@example.invalid',user_metadata:{role:'admin'}};
  for(const action of [()=>lookup(lookupReq),()=>grant(grantReq('remove_ban')),()=>exportCsv()])assert.ok([401,403].includes((await action()).status));
  assert.equal(clients,0);
  user={id:'admin',email:'admin@example.invalid'};
  for(const type of ['connects_20','connects_60'])assert.equal((await grant(grantReq(type))).status,503);
  assert.equal((await grant(grantReq('toString'))).status,400);assert.equal(clients,0);
  assert.equal((await lookup(lookupReq)).status,200);assert.equal((await exportCsv()).status,200);
  assert.equal((await grant(grantReq('remove_ban'))).status,200);assert.deepEqual(JSON.parse(JSON.stringify(writes[0])),{is_banned:false});
  fail=true;assert.equal((await lookup(lookupReq)).status,503);assert.equal((await exportCsv()).status,503);assert.equal((await grant(grantReq('verified_badge'))).status,503);
  fail=false;absent=true;assert.equal((await grant(grantReq('verified_badge'))).status,404);
  absent=false;logFail=true;const warning=await (await grant(grantReq('verified_badge'))).json();assert.equal(warning.success,true);assert.match(warning.warning,/Do not repeat/);
  delete env.SUPABASE_SERVICE_ROLE_KEY;assert.equal((await lookup(lookupReq)).status,503);assert.equal((await exportCsv()).status,503);assert.equal((await grant(grantReq('remove_ban'))).status,503);
}
Promise.all([profileRouteTest(),workplaceTest(),banTest(),onboardingTest(),adminCompatibilityTest()]).then(()=>console.log('PASS P0 security: SQL boundaries; actual profile/onboarding/admin authorization and errors; fixed initial membership; stored ban; financial grants paused. Database denial proof still required.')).catch(error=>{console.error(error);process.exitCode=1});
