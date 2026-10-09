// Actual onboarding page and save handler with synthetic transport; no remote writes.
const assert=require('node:assert/strict');
const {moduleAt,def,walk}=require('./test-makkhan-pass2.cjs');
const roles=moduleAt('lib/roles.ts',{}), identity=moduleAt('lib/identity.ts',{});
async function scenario(code, completed=false, guest=false){
  const reads=[],writes=[]; const user=guest?null:{id:'verified-owner',user_metadata:{}};
  const profile={id:'verified-owner',user_roles:[],profile_completed:completed,username:'owner',full_name:'Owner'};
  const db={auth:{getUser:async()=>({data:{user},error:null})},from(table){
    let fields;const filters=[];
    const q={select(s){fields=s;return q},eq(k,v){filters.push([k,v]);return q},in(){return q},update(){return q},insert(){return q},
      maybeSingle:async()=>{reads.push({table,fields,filters});assert.deepEqual(filters,[['id','verified-owner']]);return table==='own_profiles'&&code?{data:null,error:{code,message:'fixture error'}}:{data:profile,error:null}},
      then(resolve){resolve({data:[],error:null})}};return q;
  }};
  const onboarding=()=>null;
  const page=moduleAt('app/profile/complete/page.tsx',{
    '@/lib/supabase/server':{createClient:async()=>db},'next/navigation':{redirect:p=>{throw Error('REDIRECT:'+p)}},
    'next/image':def(()=>null),'@/components/identity/IdentityOnboarding':def(onboarding),
    '@/lib/auth/server':{getViewer:async()=>user},'@/lib/auth/return-to':{safeReturnTo:()=>'',loginHref:()=>'/login'},'@/lib/roles':roles,
  }).default;
  if(guest){await assert.rejects(page({searchParams:Promise.resolve({})}),/REDIRECT:\/login/);assert.equal(reads.length,0);return}
  if(code&&code!=='PGRST205'){await assert.rejects(page({searchParams:Promise.resolve({})}),/profile could not be checked/)}
  else if(completed){await assert.rejects(page({searchParams:Promise.resolve({})}),/REDIRECT:\/home/)}
  else{const tree=await page({searchParams:Promise.resolve({})});assert.equal(walk(tree,n=>n.type===onboarding)[0].props.username,'owner')}
  const api=moduleAt('app/api/identity/complete/route.ts',{
    '@/lib/identity/username-server':{checkUsernameClaim:async()=>({username:'owner'}),USERNAME_UNAVAILABLE:'unavailable'},
    'next/server':{NextResponse:{json:(body,options)=>({body,status:options?.status||200})}},
    '@supabase/supabase-js':{createClient:()=>({from:table=>({update:payload=>({eq:async(k,v)=>{writes.push({table,payload,k,v});return{error:null}}})})})},
    '@/lib/supabase/server':{createClient:async()=>db},'@/lib/identity':identity,'@/lib/roles':roles,
  },{process:{env:{NEXT_PUBLIC_SUPABASE_URL:'https://local.invalid',SUPABASE_SERVICE_ROLE_KEY:'synthetic'}}}).POST;
  const result=await api({json:async()=>({fullName:'Owner',modes:[],completingSetup:true,id:'attacker-target',is_banned:false})});
  if(code&&code!=='PGRST205'){assert.equal(result.status,500);assert.equal(writes.length,0);assert.ok(reads.every(r=>r.table==='own_profiles'))}
  else{assert.equal(result.status,200);assert.equal(writes.length,1);assert.equal(writes[0].v,'verified-owner');assert.equal(writes[0].payload.profile_completed,true);assert.equal(writes[0].payload.is_banned,undefined);assert.equal(writes[0].payload.id,undefined);assert.ok(reads.every(r=>r.fields!=='*'));assert.equal(reads.filter(r=>r.table==='profiles').length,code?2:0)}
}
(async()=>{await scenario('PGRST205');await scenario('PGRST205',true);await scenario(null);await scenario('42501');await scenario('TIMEOUT');await scenario('PGRST205',false,true);console.log('PASS onboarding render, completed redirect, owner-scoped save, no privilege bypass, guest/error denial')})().catch(e=>{console.error(e);process.exitCode=1});
