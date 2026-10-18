const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),ts=require('typescript');
function load(file,deps){
 const module={exports:{}};vm.runInNewContext(ts.transpileModule(fs.readFileSync(file,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022,esModuleInterop:true}}).outputText,{module,exports:module.exports,Response,URL,console,process,require:n=>{if(n in deps)return deps[n];throw Error('Unmocked '+n)}});return module.exports;
}
class UtilityError extends Error{constructor(message,status=400){super(message);this.status=status}}
const catalog=load('lib/utility/catalog.ts',{}),id='11111111-1111-4111-8111-111111111111';
const report={overallScore:58,strengths:['Clear skills'],improvements:['Add evidence'],missingSections:['Private full detail'],skillsAnalysis:['Private skills'],formatting:['Private formatting'],recommendedActions:['Private actions']};
async function main(){
 let signedIn=true,paid=false,owner='alice',pdfCalls=0;
 const server={UtilityError,utilityDb:()=>({}),utilityOwner:async()=>{if(!signedIn)throw new UtilityError('Sign in',401);return{id:owner}},ownedDocument:async(db,who)=>{if(who!=='alice')throw new UtilityError('Not found',404);return{id,kind:'resume',title:'Resume',result:report}},paidAccess:async()=>paid,utilityJson:(x,s=200)=>Response.json(x,{status:s}),utilityError:e=>Response.json({error:e.message},{status:e.status||503})};
 const docs=load('app/api/tools/documents/route.ts',{'@/lib/utility/server':server,'@/lib/utility/catalog':catalog});
 const pdf=load('app/api/tools/resume-report/pdf/route.ts',{'@/lib/utility/server':server,'@/lib/utility/catalog':catalog,'@/lib/utility/pdf':{resumePdf:()=>{pdfCalls++;return new ArrayBuffer(4)}}});
 const req=new Request('https://gigway.in/api/tools/documents?id='+id);
 let r=await docs.GET(req),data=await r.json();assert.equal(data.locked,true);assert.equal(data.result.overallScore,58);assert.equal(JSON.stringify(data).includes('Private'),false);
 assert.equal((await pdf.GET(req)).status,403);assert.equal(pdfCalls,0);
 paid=true;data=await(await docs.GET(req)).json();assert.equal(data.locked,false);assert.ok(data.result.recommendedActions);
 r=await pdf.GET(req);assert.equal(r.status,200);assert.equal(r.headers.get('cache-control'),'private, no-store');assert.equal(pdfCalls,1);
 owner='bob';assert.equal((await docs.GET(req)).status,404);assert.equal((await pdf.GET(req)).status,404);assert.equal(pdfCalls,1);
 signedIn=false;assert.equal((await docs.GET(req)).status,401);assert.equal((await pdf.GET(req)).status,401);
 console.log('PASS: API preview excludes full report, unpaid PDF denied, purchased PDF allowed, cross-owner access denied, signed-out requests denied.');
}
main().catch(e=>{console.error(e);process.exitCode=1});
