const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const ts = require('typescript');
const moduleUnderTest = { exports: {} };
const code = ts.transpileModule(fs.readFileSync('lib/organizations/public.ts', 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText;
vm.runInNewContext(code, { module: moduleUnderTest, exports: moduleUnderTest.exports, URL, require: name => { if (name === 'server-only') return {}; if(name === '@/lib/async') return { boundedFetch: () => { throw Error('No network'); } }; if (name === '@supabase/supabase-js') return { createClient: () => { throw Error('No live DB in tests'); } }; throw Error(name); } });
const { workplaceSection, workplacePage, workplaceWebsite, workplacePeople, workplacePeopleCount, workplaceOpportunities } = moduleUnderTest.exports;
function database(tables, failure) {
 const calls = [];
 return { calls, from(table) {
   let rows = tables[table] || [];
   const call = {table,filters:[]}; calls.push(call);
   return {
     select(fields){call.fields=fields;return this},
     eq(key,value){call.filters.push([key,value]);rows=rows.filter(row=>row[key]===value);return this},
     order(){return this},
     range(start,end){call.range=[start,end];rows=rows.slice(start,end+1);return this},
     in(key,values){rows=rows.filter(row=>values.includes(row[key]));return this},
     not(key){rows=rows.filter(row=>row[key]!=null);return this},
     or(value){assert.equal(value,'is_private.eq.false,is_private.is.null');rows=rows.filter(row=>row.is_private!==true);return this},
     then(resolve){resolve({data:failure===table?null:rows,error:failure===table?{}:null})},
   };
 } };
}
(async()=>{
 for(const name of ['home','about','people','jobs','projects','content'])assert.equal(workplaceSection(name),name);
 assert.equal(workplaceSection('services'),'home');assert.equal(workplaceSection('inbox'),'home');
 for(const value of ['-1','0','NaN','1.5'])assert.equal(workplacePage(value),1);
 assert.equal(workplacePage('2'),2);assert.equal(workplacePage('99999'),1000);
 for(const url of ['javascript:alert(1)','data:text/html,test','https://user:password@example.com','bad',null])assert.equal(workplaceWebsite(url),null);
 assert.equal(workplaceWebsite('https://example.com'),'https://example.com/');
 const members=[{profile_id:'owner',member_role:'owner',status:'active',organization_id:'org'},{profile_id:'admin',member_role:'admin',status:'active',organization_id:'org'},{profile_id:'member',member_role:'member',status:'active',organization_id:'org'},{profile_id:'private',member_role:'member',status:'active',organization_id:'org'},{profile_id:'pending',member_role:'member',status:'pending',organization_id:'org'},{profile_id:'inactive',member_role:'member',status:'inactive',organization_id:'org'},{profile_id:'other',member_role:'member',status:'active',organization_id:'other'}];
 const profiles=members.map(m=>({id:m.profile_id,username:m.profile_id,is_private:m.profile_id==='private'}));
 const db=database({organization_members:members,profiles});
 const people=await workplacePeople(db,'org',12);
 assert.equal(people.items.length,3);assert.equal(people.items.map(p=>p.role).join(','),'owner,admin,member');assert.equal(db.calls.length,2);
 assert.equal(db.calls[0].fields,'profile_id,member_role');assert.ok(!db.calls[1].fields.includes('email'));
 const previewDb=database({organization_members:members,profiles});const preview=await workplacePeople(previewDb,'org',2);
 assert.equal(preview.items.length,2);assert.equal(preview.hasMore,true);assert.deepEqual(previewDb.calls[0].range,[0,2]);
 const failed=await workplacePeople(database({organization_members:members},'organization_members'),'org',4);assert.equal(failed.error,true);
 const failedProfiles=await workplacePeople(database({organization_members:members},'profiles'),'org',4);assert.equal(failedProfiles.error,true);
 const emptyDb=database({});assert.equal((await workplacePeople(emptyDb,'org',4)).items.length,0);assert.equal(emptyDb.calls.length,1);
 for(const table of ['jobs','projects']){
   const status=table==='jobs'?'active':'open';
   const rows=[...Array.from({length:5},(_,i)=>({id:String(i),organization_id:'org',status})),{id:'wrong',organization_id:'other',status},{id:'closed',organization_id:'org',status:'closed'}];
   const data=database({[table]:rows});const result=await workplaceOpportunities(data,table,'org',2,2);
   assert.equal(result.items.map(r=>r.id).join(','),'2,3');assert.equal(result.hasMore,true);assert.deepEqual(data.calls[0].range,[2,4]);assert.equal(data.calls[0].filters[1][1],status);
   assert.equal((await workplaceOpportunities(database({},table),table,'org',3)).error,true);
 }
 const countCalls = [];
 const countDb = (count, error = null) => ({ from(table) {
   countCalls.push(['from',table]);
   return {
     select(fields, options) { countCalls.push(['select',fields,options.count,options.head]); return this; },
     eq(key,value) { countCalls.push(['eq',key,value]); return this; },
     not(key,op,value) { countCalls.push(['not',key,op,value]); return this; },
     or(filter,options) { countCalls.push(['or',filter,options.referencedTable]); return this; },
     then(resolve) { resolve({count,error}); },
   };
 } });
 assert.equal(await workplacePeopleCount(countDb(1),'org'),1);
 assert.equal(countCalls.filter(c=>c[0]==='from').length,1);
 assert.deepEqual(countCalls,[['from','organization_members'],['select','profile_id,person:profiles!profile_id!inner(id)','exact',true],['eq','organization_id','org'],['eq','status','active'],['not','person.username','is',null],['or','is_private.eq.false,is_private.is.null','person']]);
 assert.equal(await workplacePeopleCount(countDb(0),'org'),0);
 assert.equal(await workplacePeopleCount(countDb(null,{}),'org'),null);
 const React = require('react');
 const { renderToStaticMarkup } = require('react-dom/server');
 let role = null, requested = [], peopleCount = 1;
 const fakeLink = ({children,prefetch,...props}) => React.createElement('a',props,children);
 const dependencies = {
   'react/jsx-runtime':require('react/jsx-runtime'),
   'react':{...React,cache:fn=>fn},
   '@/lib/auth/server':{getViewer:async()=>role?{id:'user'}:null},
   '@/lib/async':{withDeadline:async value=>value},
   '@/components/layout/SectionStatus':{SectionLoading:()=>null,SectionUnavailable:()=>React.createElement('p',null,'Unavailable')},
   'next/link':{default:fakeLink,__esModule:true},
   'lucide-react':{Building2:()=>null,CheckCircle2:()=>null,MapPin:()=>null},
   '@/lib/social/server': { socialDb: () => ({
     from(table) {
       return {
         select() { return this }, eq() { return this },
         maybeSingle: async () => ({ data: table === 'organization_members' && role ? { member_role: role } : null }),
         then(resolve) { resolve({ count: 7, error: null }) },
       };
     },
   }) },
   '@/lib/organizations/public':{...moduleUnderTest.exports,publicWorkplaceDb:()=>({}),workplacePeopleCount:async()=>peopleCount,workplacePeople:async()=>{requested.push('people');return{items:[],hasMore:false,error:false}},workplaceOpportunities:async(_,table)=>{requested.push(table);return{items:[],hasMore:false,error:false}}},
   '@/components/organizations/OrganizationFollowButton':{__esModule:true,default:()=>React.createElement('button',null,'Follow')},
   '@/components/social/OrganizationSocialFeed':{__esModule:true,default:()=>React.createElement('p',null,'No Workplace posts yet.')},
 };
 async function resolveTree(element) {
   if (Array.isArray(element)) return Promise.all(element.map(resolveTree));
   if (!React.isValidElement(element)) return element;
   if (typeof element.type === 'function') return resolveTree(await element.type(element.props));
   const children = await resolveTree(element.props.children);
   return React.cloneElement(element, {}, ...(Array.isArray(children) ? children : [children]));
 }
 const componentModule={exports:{}};
 const componentCode=ts.transpileModule(fs.readFileSync('components/organizations/PublicWorkplace.tsx','utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022,jsx:ts.JsxEmit.ReactJSX,esModuleInterop:true}}).outputText;
 vm.runInNewContext(componentCode,{module:componentModule,exports:componentModule.exports,URL,require:name=>{if(!(name in dependencies))throw Error(name);return dependencies[name]}});
 const org={id:'org',name:'Test Workplace',username:'test-workplace',website:'https://example.com',entity_type:'company',is_verified:true};
 for(const section of ['home','about','people','jobs','projects','content']){
   for(const memberRole of [null,'owner','admin','member']){
     role=memberRole;requested=[];
     const html=renderToStaticMarkup(await resolveTree(await componentModule.exports.default({organization:org,viewerId:role?'user':undefined,section,page:1})));
     assert.equal(html.includes('Manage Workplace'),role==='owner'||role==='admin');
     assert.ok(html.includes('Visit Website'));assert.ok(html.includes('7 Followers'));assert.ok(html.includes('1 person'));
     assert.ok(!html.includes('Connections'));assert.ok(!html.includes('Open to Jobs'));assert.ok(!html.includes('Message'));
     assert.equal(requested.join(','),section==='home'?'people,jobs,projects':['people','jobs','projects'].includes(section)?section:'');
     if(section==='people'||section==='home')assert.ok(html.includes('No team members are listed yet.'));
     if(section==='jobs'||section==='home')assert.ok(html.includes('No open jobs right now.'));
     if(section==='projects'||section==='home')assert.ok(html.includes('No active projects right now.'));
   }
 }
 for (const count of [0, 2, null]) {
   peopleCount = count;
   const html = renderToStaticMarkup(await resolveTree(await componentModule.exports.default({organization:org,section:'about',page:1})));
   if (count === null) assert.ok(!html.includes(' people'));
   else assert.ok(html.includes(`${count} people`));
 }
 console.log('PASS: public count uses one exact HEAD query, active/public eligibility, zero/unknown handling, and singular/plural hero rendering.');
 console.log('PASS: 24 server-rendered section/role combinations; public actions, owner/admin management, section-specific queries, and empty states.');
 console.log('PASS: section/page parsing, safe websites, active public people, honest roles, batch lookups, bounded previews, pagination, organization/status scoping, and query-error states. No live database calls.');
})().catch(error=>{console.error(error);process.exitCode=1});
