const assert=require('node:assert/strict'),fs=require('node:fs');
const {moduleAt,def,walk}=require('./test-makkhan-pass2.cjs');
const model=moduleAt('lib/gigcard/model.ts',{},{URL});
const qr=moduleAt('lib/gigcard/render.ts',{'qrcode-generator':require('qrcode-generator'),'./model':model});
const plain=v=>JSON.parse(JSON.stringify(v));
const text=n=>typeof n==='string'?n:Array.isArray(n)?n.map(text).join(' '):n?.props?text(n.props.children):'';
async function main(){
  assert.equal(model.CARD_TEMPLATES.length,3);
  const initial=model.initialCardDetails({full_name:'Owner',username:'owner',avatar_url:null,tagline:'Designer',skills:['Design'],location:'Delhi',email:'private@example.invalid',phone:'private'});
  assert.equal(initial.email,'');assert.equal(initial.phone,'');
  const cleaned=model.cleanCardDetails({...initial,name:' x\ny ',headline:'h'.repeat(200)});assert.equal(cleaned.name,'x y');assert.equal(cleaned.headline.length,110);
  assert.equal(model.cardProfileUrl('a/b'),'https://www.gigway.in/u/a%2Fb');
  assert.equal(model.cardDestination('owner','https://example.com/team'),'https://example.com/team');
  assert.equal(model.cardDestination('owner',''),model.cardProfileUrl('owner'));
  for (const url of ['javascript:alert(1)','http://example.com','https://user:pass@example.com','not a URL']) assert.throws(()=>model.cardDestination('owner',url),/HTTPS/);
  for(const name of ['owner','a'.repeat(30)]){const code=qr.cardQr(name);assert.ok(code.getModuleCount()>20);assert.ok(code.isDark(0,0));}
  for(const kind of ['guest','owner','missing','error']){
    let reads=0;const user=kind==='guest'?null:{id:'verified-owner'};
    const Studio=()=>null;const db={from:table=>{assert.equal(table,'profiles');return{select:fields=>{reads++;assert.doesNotMatch(fields,/phone|email|is_verified|balance|\*/);return{eq:(key,value)=>{assert.equal(key,'id');assert.equal(value,'verified-owner');return{maybeSingle:async()=>({data:kind==='missing'?null:{...initial,full_name:'Owner',username:'owner'},error:kind==='error'?Error('unavailable'):null})}}}}}}};
    const page=moduleAt('app/profile/gigcard/page.tsx',{'next/navigation':{redirect:href=>{throw Error('redirect:'+href)}},'@/lib/auth/server':{getViewer:async()=>user,loginForCurrent:async p=>'/login?next='+p},'@/lib/supabase/server':{createClient:async()=>db},'@/components/profile/GigCardStudio':def(Studio)}).default;
    if(kind==='guest'){await assert.rejects(page(),/redirect:\/login/);assert.equal(reads,0)}
    else if(kind==='missing')await assert.rejects(page(),/redirect:\/profile\/complete/);
    else if(kind==='error')await assert.rejects(page(),/profile could not be loaded/);
    else{const tree=await page();assert.equal(tree.type,Studio);assert.equal(tree.props.profile.username,'owner')}
  }
  const notice=moduleAt('components/ai/ReportPurchaseNotice.tsx',{}).default();assert.match(text(notice),/not available yet/);assert.equal(walk(notice,n=>n.props?.href).length,0);
  const page=moduleAt('app/ai-tools/page.tsx',{'next/link':def('a')}).default();assert.doesNotMatch(text(page),/₹|Included with Pro|Upgrade/);assert.equal(walk(page,n=>n.props?.href==='/subscribe').length,0);assert.ok(walk(page,n=>n.props?.href==='/profile/gigcard').length);
  const launch=moduleAt('lib/billing/launch.ts',{});assert.equal(launch.BILLING_LAUNCH_ENABLED,false);assert.equal(launch.ESCROW_LAUNCH_ENABLED,false);
  const studio=fs.readFileSync('components/profile/GigCardStudio.tsx','utf8');assert.doesNotMatch(studio,/localStorage|\/api\/payment|\.from\(/);
  assert.doesNotMatch(studio,/downloadCardBlob|shareCardImage|canvasBlob|cardPdf/);
  const rail=moduleAt('components/home/GigCardInspiration.tsx',{'next/link':def('a'),'@/lib/gigcard/purchase':moduleAt('lib/gigcard/purchase.ts',{})}).default();
  assert.match(text(rail),/fictional names/);assert.match(text(rail),/permission/);
  assert.equal(walk(rail,n=>n.type==='article').length,3);
  console.log('PASS GigCard owner projection, guest/error gates, private contact defaults, field bounds, QR construction, truthful tools copy and unchanged payment pause');
}
main().catch(error=>{console.error(error);process.exitCode=1});
