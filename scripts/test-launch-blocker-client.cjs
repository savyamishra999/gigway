const assert=require('node:assert/strict'),React=require('react'),{moduleAt,walk}=require('./test-makkhan-pass2.cjs');
const asyncTools=moduleAt('lib/async.ts',{});
async function test(mode){let index=0;const changes=[],router={refresh(){throw Error('failure must not refresh')}};const hooks={...React,useState:initial=>{const slot=index++;return[slot===0?true:initial,value=>changes.push([slot,value])]}};let signal;const form=moduleAt('components/jobs/JobApplyButton.tsx',{react:hooks,'next/navigation':{useRouter:()=>router},'@/components/ui/button':{Button:'button'},'@/components/ui/textarea':{Textarea:'textarea'},'@/components/ui/label':{Label:'label'},'@/components/ui/card':{Card:'section',CardContent:'div',CardHeader:'header',CardTitle:'h2'},'@/lib/async':{withDeadline:p=>asyncTools.withDeadline(p,10),OPERATION_TIMEOUT_MS:10}},{AbortController,fetch:async(_url,opts)=>{signal=opts.signal;if(mode==='network')throw Error('offline');return{ok:true,json:()=>new Promise(()=>{})}}}).default;const tree=form({jobId:'fixture',userId:'spoofed',jobTitle:'Fixture'});await walk(tree,n=>n.type==='form')[0].props.onSubmit({preventDefault(){}});assert.ok(changes.some(([slot,value])=>slot===3&&value?.type==='error'));assert.deepEqual(changes.filter(([slot])=>slot===2).at(-1),[2,false]);assert.equal(signal.aborted,true)}

async function testFreeDiscovery(){
  const {def}=require('./test-makkhan-pass2.cjs');const Card=()=>null;
  const client=moduleAt('components/freelancers/FreelancersClient.tsx',{react:{useState:v=>[v,()=>{}],useEffect:()=>{},useCallback:f=>f,useMemo:f=>f()},'@/lib/supabase/client':{createClient:()=>({})},'@/components/freelancers/FreelancerCard':def(Card),'@/components/ui/input':{Input:'input'},'lucide-react':{Search:'svg',Star:'svg'}}).default;
  const profiles=Array.from({length:20},(_,i)=>({id:String(i),full_name:'Person '+i,skills:[],is_boosted:false,is_verified:false}));
  for(const isProUser of [false,true])assert.equal(walk(client({initialFreelancers:profiles,isProUser}),n=>n.type===Card).length,20);
}
async function testPausedPurchases(){
  const {def}=require('./test-makkhan-pass2.cjs');
  const paused=()=>null;
  const deps={'@/components/billing/PurchasesPaused':def(paused),'@/lib/auth/server':{loginForCurrent(){throw Error('must not request login')}},'@/lib/supabase/server':{createClient(){throw Error('must not query database')}},'next/navigation':{redirect(){throw Error('must not redirect')}},'next/link':def('a'),'lucide-react':{},'@/components/payment/RazorpayButton':def(()=>null),'@/lib/billing/entitlements':{getUserEntitlements(){throw Error('must not query entitlements')}},'@/lib/billing/catalog':{PRODUCTS:{},RATE_CARD:{},displayPrice:()=>''}};
  for(const file of ['app/buy-connects/page.tsx','app/subscribe/page.tsx','app/dashboard/jobs/boost/page.tsx'])assert.equal((await moduleAt(file,deps).default()).type,paused);
  const button=moduleAt('components/payment/RazorpayButton.tsx',{react:{useState:v=>[v,()=>{throw Error('must not start checkout')}]},'next/navigation':{useRouter:()=>({})},'@/components/ui/button':{Button:'button'}},{fetch(){throw Error('must not fetch')},document:{getElementById(){throw Error('must not load SDK')}}}).default({planType:'pro_monthly',label:'Buy'});
  const control=walk(button,n=>n.type==='button')[0];assert.equal(control.props.disabled,true);assert.equal(control.props.children,'Purchases paused');await control.props.onClick();
}

(async()=>{await testFreeDiscovery();await testPausedPurchases();await test('network');await test('body-timeout');const lib=moduleAt('lib/billing/entitlements.ts',{'./launch':moduleAt('lib/billing/launch.ts',{})});await assert.rejects(()=>lib.provisionProduct({},{}),/paused/);console.log('PASS free discovery for both viewer tiers; paused purchase pages before DB access; disabled checkout before SDK/request; apply network/body timeout recovery; fulfillment fails closed.');})().catch(e=>{console.error(e);process.exitCode=1});
