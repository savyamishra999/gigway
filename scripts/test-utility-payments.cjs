const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),ts=require('typescript'),crypto=require('node:crypto');
function load(file,deps={},globals={}){
 const m={exports:{}},code=ts.transpileModule(fs.readFileSync(file,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022,esModuleInterop:true}}).outputText;
 vm.runInNewContext(code,{module:m,exports:m.exports,console,Buffer,process,Response,URL,Date,...globals,require:n=>{if(n in deps)return deps[n];throw Error('Unmocked '+n)}});return m.exports;
}
class UtilityError extends Error{constructor(message,status=400){super(message);this.status=status}}
const catalog=load('lib/utility/catalog.ts');
const server=load('lib/utility/server.ts',{'server-only':{},'node:crypto':crypto,'@supabase/supabase-js':{},'@/lib/auth/server':{},'@/lib/gigcard/server':{},'@/lib/gigcard/payments':{GigCardError:class extends Error{}},'@/lib/async':{}});
const result={overallScore:58,strengths:['Clear experience'],improvements:['Add measurable outcomes'],missingSections:['Portfolio'],skillsAnalysis:['Relevant skills'],formatting:['Use clear headings'],recommendedActions:['Tailor the summary']};
assert.equal(catalog.utilityProduct('__proto__'),null);
assert.equal(catalog.UTILITY_PRODUCTS.resume_report.amount,4900);
assert.throws(()=>catalog.validateReport({...result,overallScore:101}));
assert.throws(()=>catalog.validatePitch({title:'Title',pitch:'',coverLetter:''}));
assert.equal(catalog.reportPreview(result).recommendedActions,undefined);
const h=crypto.createHmac('sha256','fixture').update('order|pay').digest('hex');
assert.equal(server.validSignature('order|pay',h,'fixture'),true);
for(const bad of ['', 'x', '0'.repeat(64),null])assert.equal(server.validSignature('order|pay',bad,'fixture'),false);
const pdf=load('lib/utility/pdf.ts',{'jspdf':require('jspdf')});
const rendered=Buffer.from(pdf.resumePdf(result,'Frontend developer'));
assert.equal(rendered.subarray(0,5).toString(),'%PDF-');
assert.ok(rendered.includes(Buffer.from('Recommended actions')));
assert.throws(()=>pdf.resumePdf({...result,strengths:['你好']},'Test'));
async function main(){
 let calls=0;
 const mod=load('lib/utility/payments.ts',{'server-only':{},razorpay:class{},'./catalog':catalog,'./server':{UtilityError,utilityMode:()=> 'test',rpc:async(db,name,args)=>{calls++;return {status:args.p_refunded?'refunded':'paid'}}}});
 const o={id:'11111111-1111-4111-8111-111111111111',owner_id:'owner',product:'resume_report',mode:'test',amount_paise:4900,currency:'INR',provider_order:'order_One',provider_payment:null,status:'created'};
 const remote={id:'order_One',amount:4900,currency:'INR',receipt:'ut_'+o.id.replace(/-/g,''),notes:{utility_order:o.id,owner_id:'owner'},status:'paid'};
 const payment={id:'pay_One',order_id:'order_One',amount:4900,currency:'INR',status:'captured',amount_refunded:0};
 const gateway=(r=remote,p=payment)=>({mode:'test',sdk:{orders:{fetch:async()=>r,fetchPayments:async()=>({items:[p]})},payments:{fetch:async()=>p}}});
 assert.equal((await mod.settleUtility({},o,'pay_One',gateway())).status,'paid');
 assert.equal(calls,1);
 for(const bad of [{...payment,status:'authorized'},{...payment,amount:1},{...payment,currency:'USD'},{...payment,order_id:'order_Other'},{...payment,amount_refunded:-1}]){
  await assert.rejects(mod.settleUtility({},o,'pay_One',gateway(remote,bad)));assert.equal(calls,1);
 }
 await assert.rejects(mod.settleUtility({},o,'pay_One',gateway({...remote,notes:{...remote.notes,owner_id:'attacker'}})));assert.equal(calls,1);
 await assert.rejects(mod.settleUtility({},{...o,mode:'live'},'pay_One',gateway()));assert.equal(calls,1);
 assert.equal((await mod.settleUtility({},o,'pay_One',gateway(remote,{...payment,amount_refunded:100}))).status,'refunded');
 assert.equal((await mod.recoverUtility({},o,gateway())).status,'paid');
 const before=calls;assert.equal((await mod.recoverUtility({},o,gateway({...remote,status:'created'}))).status,'created');assert.equal(calls,before);
 // Replay preserves the reserved order; network uncertainty never creates a second provider order.
 let creates=0;
 const prepared=load('lib/utility/payments.ts',{'server-only':{},razorpay:class{},'./catalog':catalog,'./server':{UtilityError,utilityMode:()=> 'test',rpc:async()=>({...o,provider_order:null,new_order:false})}});
 await assert.rejects(prepared.prepareUtility({},'owner','resume_report','doc',{mode:'test',sdk:{orders:{all:async()=>({items:[]}),create:async()=>{creates++}}}}),/earlier order/);
 assert.equal(creates,0);
 console.log('PASS: price whitelist, result validation, HMAC malformed inputs, PDF generation, captured-only fulfillment, amount/currency/owner/mode checks, refund revocation and interrupted-checkout recovery.');
}
main().catch(e=>{console.error(e);process.exitCode=1});
