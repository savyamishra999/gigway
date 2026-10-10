// Local fixture only. Bundles the actual Studio/renderer, never loads app secrets or contacts Supabase.
const fs=require('node:fs'),path=require('node:path'),os=require('node:os'),cp=require('node:child_process'),http=require('node:http'),assert=require('node:assert/strict');
const webpack=require('webpack');
const root=process.cwd(),dir=fs.mkdtempSync(path.join(os.tmpdir(),'gigway-card-qa-'));
const write=(name,body)=>fs.writeFileSync(path.join(dir,name),body);
write('loader.cjs',`const ts=require(${JSON.stringify(require.resolve('typescript'))});module.exports=function(s){return ts.transpileModule(s,{compilerOptions:{jsx:ts.JsxEmit.ReactJSX,module:ts.ModuleKind.ESNext,target:ts.ScriptTarget.ES2022,esModuleInterop:true}}).outputText}`);
write('link.js',`import React from 'react';export default function Link({prefetch,children,...props}){return React.createElement('a',props,children)}`);
write('entry.js',`import React from 'react';import jsQR from 'jsqr';import{createRoot}from'react-dom/client';import Studio from '@/components/profile/GigCardStudio';import{renderCard,canvasBlob,loadCardPhoto}from '@/lib/gigcard/render';import{cardPdf,shareCardImage}from '@/lib/gigcard/export';window.qa={renderCard,canvasBlob,cardPdf,shareCardImage,loadCardPhoto,jsQR};window.addEventListener('error',e=>{window.qaError=e.message});createRoot(document.getElementById('root')).render(React.createElement(Studio,{profile:{username:'ananya_design',full_name:'Ananya Sharma',avatar_url:null,tagline:'Brand designer & visual storyteller',skills:['Brand strategy','Visual identity','Packaging'],location:'Bengaluru, India'}}));`);
write('input.css','@tailwind base;@tailwind components;@tailwind utilities;');
write('index.html','<!doctype html><html><head><meta charset="utf-8"><style>body{font-family:Arial,sans-serif}</style><meta name="viewport" content="width=device-width,initial-scale=1"><link rel="stylesheet" href="/style.css"></head><body><div id="root"></div><script src="/bundle.js"></script></body></html>');
let chrome,server,socket;const requests=new Map();let seq=0;
const wait=ms=>new Promise(r=>setTimeout(r,ms));
async function command(method,params={}){const id=++seq;return new Promise((resolve,reject)=>{const timer=setTimeout(()=>{requests.delete(id);reject(Error('CDP timeout '+method))},30000);requests.set(id,{resolve:v=>{clearTimeout(timer);resolve(v)},reject});socket.send(JSON.stringify({id,method,params}))})}
async function evaluate(expression){const r=await command('Runtime.evaluate',{expression,awaitPromise:true,returnByValue:true});if(r.exceptionDetails)throw Error(JSON.stringify(r.exceptionDetails));return r.result.value}
async function until(expression){for(let i=0;i<60;i++){if(await evaluate(expression))return;await wait(250)}throw Error('Timeout: '+expression)}
async function main(){
  const css=cp.spawnSync(process.execPath,[require.resolve('tailwindcss/lib/cli.js'),'-i',path.join(dir,'input.css'),'-o',path.join(dir,'style.css'),'--content',path.join(root,'components/profile/GigCardStudio.tsx')],{cwd:root,encoding:'utf8',windowsHide:true});if(css.status)throw Error(css.stderr);
  await new Promise((resolve,reject)=>webpack({mode:'development',entry:path.join(dir,'entry.js'),output:{path:dir,filename:'bundle.js',publicPath:'/'},devtool:false,resolve:{extensions:['.ts','.tsx','.js'],modules:[path.join(root,'node_modules')],alias:{'@':root,'next/link':path.join(dir,'link.js')}},module:{rules:[{test:/\.tsx?$/,exclude:/node_modules/,use:path.join(dir,'loader.cjs')}]},optimization:{minimize:false}},(error,stats)=>error||stats.hasErrors()?reject(error||Error(stats.toString({all:false,errors:true}))):resolve()));
  server=http.createServer((req,res)=>{const pathname=new URL(req.url,'http://localhost').pathname;const target=path.join(dir,pathname==='/'?'index.html':pathname.slice(1));if(!target.startsWith(dir+path.sep)||!fs.existsSync(target)){res.writeHead(404).end();return}res.setHeader('Content-Type',target.endsWith('.js')?'text/javascript':target.endsWith('.css')?'text/css':'text/html');res.end(fs.readFileSync(target))});await new Promise(r=>server.listen(0,'127.0.0.1',r));
  const profile=path.join(dir,'chrome-profile');fs.mkdirSync(profile);
  chrome=cp.spawn('C:/Program Files/Google/Chrome/Application/chrome.exe',['--headless=new','--disable-gpu','--no-first-run','--no-default-browser-check','--remote-debugging-port=0','--user-data-dir='+profile,'about:blank'],{windowsHide:true,stdio:'ignore'});
  const portFile=path.join(profile,'DevToolsActivePort');for(let i=0;i<80&&!fs.existsSync(portFile);i++)await wait(250);if(!fs.existsSync(portFile))throw Error('Chrome debugging endpoint unavailable');
  const port=fs.readFileSync(portFile,'utf8').split('\n')[0],targets=await(await fetch('http://127.0.0.1:'+port+'/json/list')).json();socket=new WebSocket(targets.find(t=>t.type==='page').webSocketDebuggerUrl);await new Promise((r,j)=>{socket.onopen=r;socket.onerror=j});socket.onmessage=e=>{const m=JSON.parse(e.data);const p=requests.get(m.id);if(p){requests.delete(m.id);m.error?p.reject(Error(m.error.message)):p.resolve(m.result)}};
  await command('Page.enable');await command('Runtime.enable');await command('Browser.setDownloadBehavior',{behavior:'allow',downloadPath:dir});
  await command('Emulation.setDeviceMetricsOverride',{width:1280,height:1100,deviceScaleFactor:1,mobile:false});await command('Page.navigate',{url:'http://127.0.0.1:'+server.address().port});
  await until(`!!document.querySelector('canvas') && !Array.from(document.querySelectorAll('button')).find(b=>b.textContent==='Download PNG')?.disabled`);
  assert.equal(await evaluate('window.qaError||null'),null);
  const initialCard = await evaluate(`document.querySelector('canvas').toDataURL()`);
  await evaluate(`document.querySelector('input[type="checkbox"]').click()`);
  await wait(600);
  assert.notEqual(await evaluate(`document.querySelector('canvas').toDataURL()`), initialCard, 'branding toggle must update the exported preview');
  assert.equal(await evaluate(`getComputedStyle(document.querySelector('input:not([type])')).fontSize`), '16px');
  await evaluate(`(()=>{const c=document.createElement('canvas');c.width=c.height=50;c.getContext('2d').fillRect(0,0,50,50);c.toBlob(blob=>{const transfer=new DataTransfer();transfer.items.add(new File([blob],'my-photo.png',{type:'image/png'}));const input=document.querySelector('input[type="file"]');input.files=transfer.files;input.dispatchEvent(new Event('change',{bubbles:true}))})})()`);
  await wait(700);
  assert.equal(await evaluate(`Array.from(document.querySelectorAll('button')).some(b=>b.textContent==='Upload your photo')`),true);
  assert.notEqual(await evaluate(`document.querySelector('canvas').toDataURL()`), initialCard);
  const cardDetails={name:'Ananya Sharma',headline:'Brand designer & visual storyteller',skills:'Brand strategy · Visual identity · Packaging',location:'Bengaluru, India',email:'hello@example.com',phone:''};
  for(const template of ['noir','studio','prism']){
    const result=await evaluate(`(async()=>{const c=document.createElement('canvas');qa.renderCard(c,${JSON.stringify(cardDetails)},'ananya_design','${template}','#8b7cff',null);const png=await qa.canvasBlob(c,'image/png'),jpg=await qa.canvasBlob(c,'image/jpeg'),pdf=await qa.cardPdf(jpg,'https://www.gigway.in/u/ananya_design');const pixels=c.getContext('2d').getImageData(0,0,c.width,c.height);const decoded=qa.jsQR(pixels.data,c.width,c.height);return{decoded:decoded?.data,png:c.toDataURL(),pdf:Array.from(new Uint8Array(await pdf.arrayBuffer())),pngSize:png.size,jpgSize:jpg.size,width:c.width,height:c.height}})()`);
    assert.equal(result.decoded,'https://www.gigway.in/u/ananya_design');assert.equal(result.width,1800);assert.equal(result.height,1000);assert.ok(result.pngSize>10000&&result.jpgSize>10000);
    fs.writeFileSync(path.join(dir,template+'.png'),Buffer.from(result.png.split(',')[1],'base64'));fs.writeFileSync(path.join(dir,template+'.pdf'),Buffer.from(result.pdf));assert.ok(Buffer.from(result.pdf).toString('latin1').startsWith('%PDF-'));assert.ok(Buffer.from(result.pdf).toString('latin1').includes('/URI (https://www.gigway.in/u/ananya_design)'));
  }
  // Native share must receive a File, not a URL; cancellation is not a download.
  const share=await evaluate(`(async()=>{let received;Object.defineProperty(navigator,'canShare',{configurable:true,value:()=>true});Object.defineProperty(navigator,'share',{configurable:true,value:async d=>{received=d}});const f=new File(['fixture'],'card.png',{type:'image/png'});const result=await qa.shareCardImage(f);Object.defineProperty(navigator,'share',{configurable:true,value:async()=>{throw new DOMException('cancel','AbortError')}});const cancelled=await qa.shareCardImage(f);return{result,cancelled,file:received.files[0].name,url:received.url||null}})()`);assert.deepEqual(share,{result:'shared',cancelled:'cancelled',file:'card.png',url:null});
  await evaluate(`Object.defineProperty(navigator,'canShare',{configurable:true,value:()=>false})`);
  await evaluate(`Array.from(document.querySelectorAll('button')).find(b=>b.textContent==='Share card image').click()`);await until(`document.body.textContent.includes('PNG downloaded')`);for(let i=0;i<40&&!fs.readdirSync(dir).some(f=>f.endsWith('-preview.png'));i++)await wait(250);assert.ok(fs.readdirSync(dir).some(f=>f.endsWith('-preview.png')));
  for(const width of [360,390,768,1280]){
    await command('Emulation.setDeviceMetricsOverride',{width,height:1000,deviceScaleFactor:1,mobile:width<768});await wait(150);
    assert.equal(await evaluate('document.documentElement.scrollWidth<=innerWidth'),true,'horizontal overflow at '+width);
    if(width===390||width===1280){const capture=await command('Page.captureScreenshot',{format:'png',captureBeyondViewport:true});fs.writeFileSync(path.join(dir,'studio-ui-'+width+'.png'),Buffer.from(capture.data,'base64'))}
  }
  await evaluate(`(()=>{const input=document.querySelector('input');Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,'value').set.call(input,'');input.dispatchEvent(new Event('input',{bubbles:true}))})()`);await wait(500);assert.equal(await evaluate(`Array.from(document.querySelectorAll('button')).find(b=>b.textContent==='Download PNG').disabled`),true);
  fs.writeFileSync(path.join(dir,'result.json'),JSON.stringify({status:'PASS',templates:3,exports:'PNG/JPG/PDF',widths:[360,390,768,1280],share:'file, cancellation, unsupported download',scope:'local synthetic profile; no production auth or payment'},null,2));console.log('PASS GigCard browser/export QA. Artifacts: '+dir);
}
main().catch(e=>{console.error(e);process.exitCode=1}).finally(async()=>{if(socket){try{await command('Browser.close')}catch{}socket.close()}if(chrome)chrome.kill();if(server)server.close()});
