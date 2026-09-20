const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),ts=require('typescript');
function load(file,deps={}){const m={exports:{}};vm.runInNewContext(ts.transpileModule(fs.readFileSync(file,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText,{module:m,exports:m.exports,URL,require:n=>{if(!(n in deps))throw Error(n);return deps[n]}});return m.exports}
const identity=load('lib/identity.ts'),setup=load('lib/organizations/setup.ts',{'@/lib/identity':identity});
const data=setup.setupData({name:'Legacy',username:'legacy',entity_type:'organization',company_size:'5-10 MEMBERS',country:'india',industry:'SOCIAL MEDIA',founded_year:2024});
assert.equal(data.company_size,'5-10 MEMBERS');assert.equal(data.country,'india');assert.equal(data.founded_year,'2024');
assert.equal(setup.compatibleOptions(setup.WORKPLACE_SIZES,data.company_size)[0],'5-10 MEMBERS');assert.equal(setup.compatibleOptions(setup.WORKPLACE_SIZES,'2-10').filter(v=>v==='2-10').length,1);
assert.equal(setup.workplaceCompleteness(setup.setupData()).percent,0);
const complete=setup.setupData(Object.fromEntries(setup.COMPLETENESS_FIELDS.map(([k])=>[k,k==='website'?'https://example.com':k==='username'?'valid_handle': 'Present'])));
assert.equal(setup.workplaceCompleteness(complete).percent,100);complete.logo_url='';assert.equal(setup.workplaceCompleteness(complete).complete,8);
for(const url of ['javascript:alert(1)','https://user:pass@example.com','example.com']){complete.website=url;assert.ok(setup.setupErrors(complete).website)}
complete.website='https://example.com';complete.founded_year='not-a-year';assert.ok(setup.setupErrors(complete).founded_year);complete.founded_year='2020';assert.equal(Object.keys(setup.setupErrors(complete)).length,0);
complete.username='a bad handle';assert.ok(setup.setupErrors(complete).username);assert.ok(setup.workplaceCompleteness(complete).missing.some(([k])=>k==='username'));
console.log('PASS: legacy option values, string initialization, exact completeness denominator and missing fields, website/username/year validation.');
// Exercise the existing server edit gate with anonymous/member/owner/admin fixtures.
(async()=>{
 const ReactRuntime=require('react/jsx-runtime');let memberRole=null,user=null;const filters=[];
 const supabase={auth:{getUser:async()=>({data:{user}})},from:table=>({select(){return this},eq(key,value){filters.push([table,key,value]);return this},maybeSingle:async()=>({data:table==='organizations'?{id:'org',name:'Legacy',username:'legacy'}:memberRole?{member_role:memberRole}:null})})};
 const deps={'@/lib/auth/server':{loginForCurrent:async()=>'/login?next=/organizations/legacy/edit'},'react/jsx-runtime':ReactRuntime,'next/navigation':{redirect:url=>{throw Error('redirect:'+url)},notFound:()=>{throw Error('notFound')}},'@/lib/supabase/server':{createClient:async()=>supabase},'@/components/organizations/OrganizationForm':{default:()=>null}};
 const m={exports:{}};vm.runInNewContext(ts.transpileModule(fs.readFileSync('app/organizations/[username]/edit/page.tsx','utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022,jsx:ts.JsxEmit.ReactJSX}}).outputText,{module:m,exports:m.exports,require:n=>{if(!(n in deps))throw Error(n);return deps[n]}});
 const render=()=>m.exports.default({params:Promise.resolve({username:'legacy'})});
 await assert.rejects(render,/redirect:\/login/);user={id:'viewer'};
 for(const role of [null,'member']){memberRole=role;await assert.rejects(render,/redirect:\/u\/legacy/)}
 for(const role of ['owner','admin']){memberRole=role;assert.ok(await render())}
 assert.ok(filters.some(([table,key,value])=>table==='organization_members'&&key==='status'&&value==='active'));assert.ok(filters.some(([table,key,value])=>table==='organization_members'&&key==='profile_id'&&value==='viewer'));assert.ok(filters.some(([table,key,value])=>table==='organization_members'&&key==='organization_id'&&value==='org'));
 console.log('PASS: edit route rejects anonymous/missing/member access, accepts owner/admin, and scopes membership by viewer, organization and active status.');
})().catch(e=>{console.error(e);process.exitCode=1});
