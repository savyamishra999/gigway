const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),ts=require('typescript'),React=require('react'),{renderToStaticMarkup}=require('react-dom/server');
function load(file,deps){const module={exports:{}};vm.runInNewContext(ts.transpileModule(fs.readFileSync(file,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022,jsx:ts.JsxEmit.ReactJSX,esModuleInterop:true}}).outputText,{module,exports:module.exports,performance,require:n=>n==='react/jsx-runtime'?require(n):n in deps?deps[n]:(()=>{throw Error('Unexpected Home dependency '+n)})()});return module.exports;}
const Link=({children,...props})=>React.createElement('a',props,children),icon=()=>React.createElement('svg');
const icons={ArrowUpRight:icon,FileText:icon,BriefcaseBusiness:icon,FolderOpen:icon,ArrowRight:icon,CheckCircle2:icon,MessageSquare:icon,Sparkles:icon};
const actions=load('components/home/HomeActionRails.tsx',{'next/link':Link,'lucide-react':icons}).default;
let viewer={id:'fixture'};
const placeholder=label=>()=>React.createElement('div',null,label);
const deps={
 'next/link':Link,react:{...React,cache:fn=>fn},'lucide-react':icons,
 '@/lib/auth/server':{getViewer:async()=>viewer},
 '@/components/home/HomeActionRails':actions,
 '@/components/home/HomeModule':{HomeModule:({name})=>React.createElement('section',{'data-home-module':name},name)},
 '@/components/home/DiscoveryPreviews':{LatestOpportunities:placeholder('Latest Opportunities'),FindWorkEntry:placeholder('Find Work'),PeoplePreview:placeholder('Workplaces')},
 '@/lib/supabase/server':{createClient:()=>{throw Error('No eager DB query in shell')}},
 '@/lib/async':{},'@/components/layout/SectionStatus':{},
 '@/lib/social/server':{socialPerf(){}},
 '@/lib/home/primary':{initialHomePosts:()=>{throw Error('Feed must load inside boundary')}},
 '@/lib/product-visibility':{productVisibility:{joxCurrentProduct:false,glimpsCurrentProduct:false}},
};
for(const name of ['ProfileReady','RelevantPeople','GigCardInspiration','IdentityCompletionPrompt','HomeActionGuide'])deps['@/components/home/'+name]=placeholder(name);
for(const name of ['SocialHomeFeed','JoxOrbitRail','GlimpsRail'])deps['@/components/social/'+name]=placeholder(name);
const home=load('app/home/page.tsx',deps).default;
(async()=>{
 let html=renderToStaticMarkup(await home());
 for(const text of ['Check Resume Score','Post a Gig / Service','Post a Project','Post a Job','Share a GigThought','Add Portfolio / Project','Create Job-Tailored Pitch'])assert.ok(html.includes(text),text);
 assert.ok(html.indexOf('aria-label="Create / Post"')<html.indexOf('aria-label="Professional Tools"'));
 assert.ok(html.includes('href="/ai-tools"'));
 const pitchAt=html.indexOf('Create Job-Tailored Pitch');
 for(const name of ['identity','suggestions','completion','primary','network','opportunities','activity']){
  const index=html.indexOf('data-home-module="'+name+'"');
  assert.ok(index>pitchAt,name+' must be retained below utility actions');
  assert.equal((html.match(new RegExp('data-home-module="'+name+'"','g'))||[]).length,1);
 }
 assert.ok(html.includes('Your activity'));assert.ok(html.includes('Find Work'));assert.ok(html.includes('GigCardInspiration'));assert.ok(html.includes('HomeActionGuide'));
 const order=['identity','completion','primary','opportunities','suggestions','network'];
 for(let i=1;i<order.length;i++)assert.ok(html.indexOf('data-home-module="'+order[i]+'"')>html.indexOf('data-home-module="'+order[i-1]+'"'),order[i]+' order');
 assert.ok(html.indexOf('Apply for verification')<html.indexOf('data-home-module="identity"'));
 assert.equal((html.match(/<details /g)||[]).length,3);
 viewer=null;html=renderToStaticMarkup(await home());assert.ok(html.includes('Join GigWay'));assert.equal(html.includes('Check Resume Score'),false);
 console.log('PASS: utility actions above all retained Home modules; feed, people/connect suggestions, profiles, activity, work and guide present; guest gate preserved.');
})().catch(e=>{console.error(e);process.exitCode=1});
