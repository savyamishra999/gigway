const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),ts=require('typescript'),React=require('react'),{renderToStaticMarkup}=require('react-dom/server');
function load(file,deps){const module={exports:{}};vm.runInNewContext(ts.transpileModule(fs.readFileSync(file,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022,jsx:ts.JsxEmit.ReactJSX,esModuleInterop:true}}).outputText,{module,exports:module.exports,require:n=>n==='react/jsx-runtime'?require(n):n in deps?deps[n]:(()=>{throw Error('Unexpected Home dependency '+n)})()});return module.exports;}
const Link=({children,...props})=>React.createElement('a',props,children),icon=()=>React.createElement('svg');
const actions=load('components/profile/ProfileNextActions.tsx',{'next/link':Link,'lucide-react':{ArrowUpRight:icon,FileText:icon,BriefcaseBusiness:icon,FolderOpen:icon}}).default;
let viewer={id:'fixture'};
const home=load('app/home/page.tsx',{'next/link':Link,'@/lib/auth/server':{getViewer:async()=>viewer},'@/components/profile/ProfileNextActions':actions,'@/components/home/HomeModule':{HomeModule:()=>React.createElement('section',null,'Opportunities')},'@/components/home/DiscoveryPreviews':{LatestOpportunities:()=>{throw Error('No eager opportunity query')}}}).default;
(async()=>{
 let html=renderToStaticMarkup(await home());
 for(const text of ['Check Resume Score','Post a Service / Gig','Add Portfolio / Project','Hiring?','Create my pitch'])assert.ok(html.includes(text),text);
 assert.ok(html.indexOf('Check Resume Score')<html.indexOf('Opportunities'));
 assert.ok(html.includes('href="/community"'));assert.equal(html.includes('Share a GigThought'),false);
 assert.equal((html.match(/<h2/g)||[]).length,4);
 viewer=null;html=renderToStaticMarkup(await home());assert.ok(html.includes('Join GigWay'));assert.equal(html.includes('Check Resume Score'),false);
 console.log('PASS: real Home/actions SSR, three primary actions, secondary community/pitch links, guest entry and no eager feed/profile/suggestion imports.');
})().catch(e=>{console.error(e);process.exitCode=1});
