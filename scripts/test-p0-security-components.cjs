// Actual SSR components with synthetic data. No browser, network or database claims.
const assert=require('node:assert/strict'),React=require('react');
const {renderToStaticMarkup}=require('react-dom/server');
const {moduleAt,def,walk}=require('./test-makkhan-pass2.cjs');
const nav={redirect:()=>{throw Error('redirect')},notFound:()=>{throw Error('not found')}};
async function main(){
  let user={id:'owner'},reads=[];
  const db={auth:{getUser:async()=>({data:{user}})},from(table){
    const q={select(fields){reads.push({table,fields});return q},eq(key,value){if(table==='own_profiles'){assert.equal(key,'id');assert.equal(value,'owner')}return q},maybeSingle:async()=>({data:{id:'owner',profile_completed:true,username:'owner',full_name:'Owner'},error:null}),then(resolve){resolve({data:[],error:null})}};return q;
  }};
  const auth={getViewer:async()=>user,loginForCurrent:async()=>'/login',completionForCurrent:async()=>'/profile/complete'};
  const edit=moduleAt('app/profile/edit/page.tsx',{'@/lib/auth/server':auth,'@/lib/supabase/server':{createClient:async()=>db},'next/navigation':nav,'@/components/profile/EditProfileForm':def(props=>React.createElement('form',null,props.profile.full_name)),'@/components/identity/WorkModesEditor':def(()=>null)}).default;
  const tree=await edit({searchParams:Promise.resolve({})});
  assert.equal(reads[0].table,'own_profiles');assert.match(renderToStaticMarkup(tree),/Edit profile/);
  assert.ok(walk(tree,n=>n.props?.profile?.id==='owner').length);
  user=null;await assert.rejects(edit({searchParams:Promise.resolve({})}),/redirect/);
  user={id:'owner'};
  const referral=moduleAt('app/refer/page.tsx',{'@/lib/auth/server':auth,'@/lib/supabase/server':{createClient:async()=>db},'next/navigation':nav,'next/link':def('a')}).default;
  const before=reads.length,html=renderToStaticMarkup(await referral());
  assert.match(html,/Referral rewards are paused/);assert.doesNotMatch(html,/5 free|[?&]ref=/);assert.equal(reads.length,before);
  let serviceClients=0,queryError=false;
  const env={ADMIN_EMAILS:'admin@example.invalid',SUPABASE_SERVICE_ROLE_KEY:'synthetic',NEXT_PUBLIC_SUPABASE_URL:'https://local.invalid'};
  const adminDb={from(){const q={select(){return q},order(){return q},range:async()=>({data:[],count:0,error:queryError?{code:'denied'}:null})};return q}};
  for(const [file,component,icon] of [['users','AdminUsersClient','Users'],['freelancers','AdminFreelancersClient','UserCheck']]){
    const page=moduleAt(`app/admin/${file}/page.tsx`,{'@/lib/supabase/server':{createClient:async()=>db},'@supabase/supabase-js':{createClient:()=>{serviceClients++;return adminDb}},'next/navigation':nav,'next/link':def('a'),'lucide-react':{[icon]:()=>null},[`@/components/admin/${component}`]:def(()=>React.createElement('div',null,'admin-list'))},{process:{env},URLSearchParams}).default;
    const request={searchParams:Promise.resolve({})};
    user={id:'owner',email:'person@example.invalid',user_metadata:{role:'admin'}};
    const before=serviceClients;await assert.rejects(page(request),/redirect/);assert.equal(serviceClients,before);
    user={id:'admin',email:'admin@example.invalid'};
    assert.match(renderToStaticMarkup(await page(request)),/admin-list/);
    queryError=true;await assert.rejects(page(request),/could not be loaded/);queryError=false;
    delete env.SUPABASE_SERVICE_ROLE_KEY;await assert.rejects(page(request),/configuration is required/);env.SUPABASE_SERVICE_ROLE_KEY='synthetic';
  }
  console.log('PASS P0 actual component SSR: owner edit, guest redirect, referral pause; admin roster authorization, privileged reads, explicit query/config failures.');
}main().catch(error=>{console.error(error);process.exitCode=1});
