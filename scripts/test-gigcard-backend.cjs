const assert=require('node:assert/strict'),crypto=require('node:crypto'),fs=require('node:fs'),path=require('node:path'),os=require('node:os');
const {moduleAt,def}=require('./test-makkhan-pass2.cjs');
const purchase=moduleAt('lib/gigcard/purchase.ts',{});
const payments=moduleAt('lib/gigcard/payments.ts',{'./purchase':purchase});
const model=moduleAt('lib/gigcard/model.ts',{},{URL});
const designs=moduleAt('lib/gigcard/design.ts',{'./model':model});
const render=moduleAt('lib/gigcard/render.ts',{'qrcode-generator':require('qrcode-generator'),'./model':model});
const serverRender=moduleAt('lib/gigcard/server-render.ts',{'server-only':{},sharp:require('sharp'),jspdf:require('jspdf'),'./model':model,'./render':render,'./design':designs},{Buffer});
const id='11111111-1111-4111-8111-111111111111',owner='22222222-2222-4222-8222-222222222222';
function fixture(){
  let local={id,card_id:id,owner_id:owner,mode:'test',amount_paise:9900,currency:'INR',status:'creating',razorpay_order_id:null,razorpay_payment_id:null};
  let reserved=false,creates=0,settles=0,refund=0,captured=false,wrongAmount=false;
  const remote=()=>({id:'order_Test',amount:wrongAmount?1:9900,currency:'INR',receipt:'gc_'+id.replaceAll('-',''),notes:{gigcard_order:id,owner_id:owner,card_id:id},status:captured?'paid':'created'});
  const payment=()=>({id:'pay_Test',order_id:'order_Test',amount:9900,currency:'INR',status:captured?'captured':'authorized',amount_refunded:refund});
  const store={reserve:async()=>{const isNew=!reserved;reserved=true;return{...local,new_order:isNew}},attach:async(i,o,p)=>{assert.equal(o,owner);local={...local,razorpay_order_id:p,status:'created'};return{...local}},settle:async(o,p,r)=>{settles++;local={...local,razorpay_payment_id:p,status:r||local.status==='refunded'?'refunded':'paid'};return{...local}}};
  const provider={createOrder:async data=>{creates++;assert.equal(data.amount,9900);return remote()},findOrders:async()=>creates?[remote()]:[],getOrder:async()=>remote(),getPayment:async()=>payment(),getOrderPayments:async()=>[payment()]};
  return{store,provider,get local(){return local},get creates(){return creates},get settles(){return settles},capture(){captured=true},refund(){refund=9900},wrong(){wrongAmount=true}};
}
async function main(){
  for(const env of [{},{GIGCARD_PAYMENTS_MODE:'live'},{GIGCARD_PAYMENTS_MODE:'test',VERCEL_ENV:'production'}]) assert.equal(moduleAt('lib/gigcard/config.ts',{},{process:{env}}).gigcardMode(),'paused');
  assert.equal(moduleAt('lib/gigcard/config.ts',{},{process:{env:{GIGCARD_PAYMENTS_MODE:'test'}}}).gigcardMode(),'test');
  const f=fixture();await payments.prepareCardOrder(f.store,f.provider,id,owner,'test');await payments.prepareCardOrder(f.store,f.provider,id,owner,'test');assert.equal(f.creates,1);
  await assert.rejects(payments.settleCardPayment(f.store,f.provider,f.local,'pay_Test'),/pending/);assert.equal(f.settles,0);
  f.capture();assert.equal((await payments.recoverCardPayment(f.store,f.provider,f.local)).status,'paid');
  assert.equal((await payments.prepareCardOrder(f.store,f.provider,id,owner,'test')).status,'paid');assert.equal(f.creates,1);
  f.refund();assert.equal((await payments.recoverCardPayment(f.store,f.provider,f.local)).status,'refunded');
  await assert.rejects(payments.prepareCardOrder(f.store,f.provider,id,owner,'test'),/revoked/);
  const bad=fixture();bad.wrong();await assert.rejects(payments.prepareCardOrder(bad.store,bad.provider,id,owner,'test'),/validated/);assert.equal(bad.settles,0);
  const uncertain=fixture();const create=uncertain.provider.createOrder;uncertain.provider.createOrder=async data=>{await create(data);throw Error('response lost')};
  await assert.rejects(payments.prepareCardOrder(uncertain.store,uncertain.provider,id,owner,'test'),/response lost/);
  assert.equal((await payments.prepareCardOrder(uncertain.store,uncertain.provider,id,owner,'test')).razorpay_order_id,'order_Test');assert.equal(uncertain.creates,1);
  await assert.rejects(payments.prepareCardOrder(f.store,f.provider,id,'other','test'),/Invalid card order/);
  for(const mismatch of [{id:'pay_Other'},{order_id:'order_Other'},{amount:1},{currency:'USD'},{status:'failed'},{amount_refunded:-1},{amount_refunded:10000}]){
    const invalid=fixture();await payments.prepareCardOrder(invalid.store,invalid.provider,id,owner,'test');invalid.capture();const get=invalid.provider.getPayment;
    invalid.provider.getPayment=async()=>({...await get(),...mismatch});
    await assert.rejects(payments.settleCardPayment(invalid.store,invalid.provider,invalid.local,'pay_Test'),/pending/);assert.equal(invalid.settles,0);
  }

  const profile={username:'owner',full_name:'Example Founder',avatar_url:null,tagline:'Founder',skills:['Design'],location:'Delhi'};
  const design={details:{...model.initialCardDetails(profile),company:'Example & Co <script>',website:'https://example.com'},template:'studio',accent:'#8b7cff',showBrand:false,photo:''};
  assert.throws(()=>designs.validateDesign({...design,paid:true,details:{...design.details,website:'javascript:alert(1)'}}),/HTTPS/);
  assert.equal(designs.validateDesign({...design,paid:true}).paid,undefined);
  assert.throws(()=>designs.validateDesign({...design,photo:'http://127.0.0.1/private'}),/photo/);
  const large=Buffer.alloc(24);Buffer.from('89504e470d0a1a0a','hex').copy(large);large.writeUInt32BE(999999,16);large.writeUInt32BE(999999,20);
  await assert.rejects(serverRender.normalizeCardPhoto('data:image/png;base64,'+large.toString('base64')),/1024/);
  const out=fs.mkdtempSync(path.join(os.tmpdir(),'gigway-paid-export-'));
  for(const format of ['png','jpeg','pdf']){
    const artifact=await serverRender.paidCardImage(design,'owner',format);assert.ok(artifact.bytes.length>1000);fs.writeFileSync(path.join(out,'card.'+artifact.extension),artifact.bytes);
    if(format==='pdf')assert.equal(artifact.bytes.subarray(0,5).toString(),'%PDF-');
    else{const metadata=await require('sharp')(artifact.bytes).metadata();assert.equal(metadata.width,1800);assert.equal(metadata.height,1000);}
    if(format==='png'){const {data,info}=await require('sharp')(artifact.bytes).ensureAlpha().raw().toBuffer({resolveWithObject:true});assert.equal(require('jsqr')(new Uint8ClampedArray(data),info.width,info.height).data,'https://example.com/');}
  }
  let touched=0;
  const config={gigcardMode:()=> 'paused'};
  const server=moduleAt('lib/gigcard/server.ts',{'server-only':{},'node:crypto':crypto,razorpay:def(()=>{touched++;throw Error()}),'@supabase/supabase-js':{createClient:()=>{touched++;throw Error()}},'@/lib/auth/server':{getViewer:async()=>{touched++;throw Error()}},'@/lib/async':{},'./config':config,'./payments':payments,'./design':designs},{Buffer,Response,URL,process:{env:{}}});
  const secret='fixture-secret',signature=crypto.createHmac('sha256',secret).update('order|pay').digest('hex');assert.equal(server.validHmac('order|pay',signature,secret),true);for(const bad of ['',null,7,'a','z'.repeat(64)])assert.equal(server.validHmac('order|pay',bad,secret),false);
  for(const body of ['null','[]','"text"'])await assert.rejects(server.cardJson(new Request('https://local.invalid',{method:'POST',headers:{'content-type':'application/json'},body})),/Invalid JSON/);
  for(const route of ['checkout','export','cards','webhook']){
    const deps={'@/lib/gigcard/payments':payments,'@/lib/gigcard/server':server,'@/lib/gigcard/server-render':serverRender,'@/lib/gigcard/design':designs};
    const mod=moduleAt('app/api/gigcard/'+route+'/route.ts',deps,{Response,Buffer});
    assert.equal((await mod.POST(new Request('https://local.invalid',{method:'POST'}))).status,503);
    if(mod.GET)assert.equal((await mod.GET(new Request('https://local.invalid'))).status,503);
  }
  assert.equal(touched,0,'paused endpoints must not access DB/auth/provider');
  // Execute the export route and verify it never renders for unpaid/wrong-owner requests.
  for(const scenario of ['unpaid','wrong-owner','paid','refunded']){
    let renders=0;const exp=fixture();await payments.prepareCardOrder(exp.store,exp.provider,id,owner,'test');if(scenario!=='unpaid')exp.capture();if(scenario==='refunded')exp.refund();
    const deps={...server,cardModeOrThrow:()=> 'test',requireSameOrigin:()=>{},cardDatabase:()=>({}),cardOwner:async()=>({id:owner,username:'owner'}),cardJson:async()=>({card_id:id,format:'png'}),ownedCard:async()=>{if(scenario==='wrong-owner')throw new payments.GigCardError('Not found',404);return{id,design}},ownedOrder:async()=>scenario==='unpaid'?null:exp.local,cardGateway:()=>({provider:exp.provider}),cardStore:()=>exp.store};
    const route=moduleAt('app/api/gigcard/export/route.ts',{'@/lib/gigcard/payments':payments,'@/lib/gigcard/server':deps,'@/lib/gigcard/server-render':{paidCardImage:async()=>{renders++;return{bytes:Buffer.from('paid-file'),type:'image/png',extension:'png'}}}},{Response}).POST;
    const res=await route(new Request('https://local.invalid',{method:'POST'}));assert.equal(res.status,scenario==='paid'?200:scenario==='wrong-owner'?404:402);assert.equal(renders,scenario==='paid'?1:0);if(scenario==='paid')assert.equal(res.headers.get('cache-control'),'private, no-store');
  }
  console.log('PASS GigCard backend: server pricing, uncertain-order recovery, capture/refund checks, repeated access, wrong-owner/unpaid export denial, bounded photos, HMAC validation and real PNG/JPG/PDF generation. Artifacts: '+out);
}
main().catch(error=>{console.error(error);process.exitCode=1});
