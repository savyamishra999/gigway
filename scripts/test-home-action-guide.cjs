const assert=require('node:assert/strict');
const React=require('react');
const {moduleAt,def,walk}=require('./test-makkhan-pass2.cjs');
const text=n=>typeof n==='string'?n:Array.isArray(n)?n.map(text).join(' '):n?.props?text(n.props.children):'';
async function main(){
  let state={owner:'',hidden:false,posted:false},effect;
  const storage=new Map();
  const Guide=moduleAt('components/home/HomeActionGuide.tsx',{
    react:{useState:()=>[state,v=>state=typeof v==='function'?v(state):v],useEffect:fn=>effect=fn},'next/link':def('a'),
  },{localStorage:{getItem:k=>storage.get(k),setItem:(k,v)=>storage.set(k,v),removeItem:k=>storage.delete(k)}}).default;
  let tree=Guide({userId:'A'});effect();tree=Guide({userId:'A'});
  for(const path of ['/social/create?intro=1','/work','/gigs/new','/create','/network','/organizations/new'])assert.equal(walk(tree,n=>n.type==='a'&&n.props.href===path).length,1);
  assert.match(text(tree),/Start with one action/);
  walk(tree,n=>n.type==='button')[0].props.onClick();tree=Guide({userId:'A'});assert.match(text(tree),/Show getting-started/);
  tree.props.onClick();assert.equal(storage.size,0);
  storage.set('gigway:introduction:A','posted');Guide({userId:'A'});effect();tree=Guide({userId:'A'});assert.equal(walk(tree,n=>n.props?.href==='/social/create?intro=1').length,0);
  tree=Guide({userId:'B'});effect();tree=Guide({userId:'B'});assert.equal(walk(tree,n=>n.props?.href==='/social/create?intro=1').length,1);
  const editFile='app/profile/edit/page.tsx';
  for(const code of ['PGRST205','42501',null]){
    const reads=[];const profile={id:'A',full_name:'A',profile_completed:true,username:'owner'};
    const db={from:table=>{const q={select:fields=>{reads.push({table,fields});return q},eq:(key,id)=>{if(table==='profiles'||table==='own_profiles'){assert.equal(key,'id');assert.equal(id,'A')}return q},maybeSingle:async()=>table==='own_profiles'&&code?{data:null,error:{code}}:{data:profile,error:null},then:fn=>fn({data:[],error:null})};return q}};
    const Form=()=>null;
    const page=moduleAt(editFile,{'@/lib/auth/server':{getViewer:async()=>({id:'A'})},'@/lib/supabase/server':{createClient:async()=>db},'next/navigation':{redirect:()=>{throw Error('unexpected redirect')}},'@/components/profile/EditProfileForm':def(Form),'@/components/identity/WorkModesEditor':def(()=>null)}).default;
    if(code==='42501'){await assert.rejects(page({searchParams:Promise.resolve({})}),/profile could not be checked/);assert.equal(reads.length,1)}
    else{const result=await page({searchParams:Promise.resolve({})});assert.equal(walk(result,n=>n.type===Form)[0].props.userId,'A');if(code){const read=reads.find(r=>r.table==='profiles');assert.ok(read);assert.doesNotMatch(read.fields,/\*|balance|is_banned|verification_document/)}else assert.ok(!reads.some(r=>r.table==='profiles'))}
  }
  console.log('PASS Home guide actions, hide/replay, per-account state, success signal and editor missing-view/permission boundaries');
}
main().catch(e=>{console.error(e);process.exitCode=1});
