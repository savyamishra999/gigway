// Compare generated worker policy against the frozen Pass 1 worker without editing either.
const fs=require('node:fs'),cp=require('node:child_process'),crypto=require('node:crypto'),ts=require('typescript'),assert=require('node:assert/strict');
const sha=s=>crypto.createHash('sha256').update(s).digest('hex').toUpperCase();
const base=cp.execFileSync('git',['show','HEAD:public/sw.js']).toString('utf8'),current=fs.readFileSync('public/sw.js','utf8');
function inspect(source){
 const tree=ts.createSourceFile('sw.js',source,ts.ScriptTarget.Latest,true,ts.ScriptKind.JS);let manifest,range;
 function walk(n){if(ts.isCallExpression(n)&&ts.isPropertyAccessExpression(n.expression)&&n.expression.name.text==='precacheAndRoute'){manifest=Function('return '+n.arguments[0].getText(tree))();range=[n.arguments[0].getStart(tree),n.arguments[0].getEnd()]}ts.forEachChild(n,walk)}walk(tree);assert.ok(range);
 const custom=source.match(/importScripts\("(worker-[^"]+\.js)"\)/)?.[1];assert.ok(custom);
 const normalized=(source.slice(0,range[0])+'[]'+source.slice(range[1])).replaceAll(custom,'CUSTOM-WORKER.js');
 return{manifest,custom,normalized};
}
function canonicalNames(source){
 const tree=ts.createSourceFile('normalized.js',source,ts.ScriptTarget.Latest,true,ts.ScriptKind.JS),names=new Map(),edits=[];
 function walk(n){if(ts.isIdentifier(n)&&/^[a-z]$/.test(n.text)&&!(ts.isPropertyAccessExpression(n.parent)&&n.parent.name===n)){if(!names.has(n.text))names.set(n.text,'v'+names.size);edits.push([n.getStart(tree),n.getEnd(),names.get(n.text)])}ts.forEachChild(n,walk)}walk(tree);
 for(const [start,end,name] of edits.reverse())source=source.slice(0,start)+name+source.slice(end);return source;
}
const old=inspect(base),now=inspect(current);assert.equal(canonicalNames(now.normalized),canonicalNames(old.normalized),'Policy differs beyond manifest/import and bijective minifier variable renaming');
const oldCustom=cp.execFileSync('git',['show','HEAD:public/'+old.custom]);const newCustom=fs.readFileSync('public/'+now.custom);assert.deepEqual(newCustom,oldCustom,'Custom-worker bytes changed');assert.ok(!current.includes(old.custom));
const oldUrls=new Map(old.manifest.map(x=>[x.url,x.revision])),newUrls=new Map(now.manifest.map(x=>[x.url,x.revision]));
const result={baselineHash:sha(base),currentHash:sha(current),oldCustom:old.custom,currentCustom:now.custom,customBytesIdentical:true,policyCodeIdenticalAfterManifestImportAndVariableNormalization:true,minifierVariableRenaming:now.normalized!==old.normalized,oldEntries:oldUrls.size,newEntries:newUrls.size,removed:[...oldUrls.keys()].filter(u=>!newUrls.has(u)),added:[...newUrls.keys()].filter(u=>!oldUrls.has(u)),revisionChanges:[...newUrls].filter(([u,r])=>oldUrls.has(u)&&oldUrls.get(u)!==r).map(([url,revision])=>({url,oldRevision:oldUrls.get(url),revision}))};
if(process.argv[2])fs.writeFileSync(process.argv[2],JSON.stringify(result,null,2));console.log(JSON.stringify({...result,removed:result.removed.length,added:result.added.length},null,2));
