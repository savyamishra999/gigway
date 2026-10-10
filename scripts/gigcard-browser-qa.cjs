// Local fixture only. Bundles the actual Studio/renderer, never loads app secrets or contacts Supabase.
const fs=require('node:fs'),path=require('node:path'),os=require('node:os'),cp=require('node:child_process'),http=require('node:http'),assert=require('node:assert/strict');
const webpack=require('webpack');
const root=process.cwd(),dir=fs.mkdtempSync(path.join(os.tmpdir(),'gigway-card-qa-'));
const write=(name,body)=>fs.writeFileSync(path.join(dir,name),body);
write('loader.cjs',`const ts=require(${JSON.stringify(require.resolve('typescript'))});module.exports=function(s){return ts.transpileModule(s,{compilerOptions:{jsx:ts.JsxEmit.ReactJSX,module:ts.ModuleKind.ESNext,target:ts.ScriptTarget.ES2022,esModuleInterop:true}}).outputText}`);
write('link.js',`import React from 'react';export default function Link({prefetch,children,...props}){return React.createElement('a',props,children)}`);
write('entry.js',`import React from 'react';import jsQR from 'jsqr';import{createRoot}from'react-dom/client';import Studio from '@/components/profile/GigCardStudio';import Inspiration from '@/components/home/GigCardInspiration';import{renderCard,canvasBlob,loadCardPhoto}from '@/lib/gigcard/render';import{cardPdf,shareCardImage}from '@/lib/gigcard/export';window.qa={renderCard,canvasBlob,cardPdf,shareCardImage,loadCardPhoto,jsQR};window.addEventListener('error',e=>{window.qaError=e.message});createRoot(document.getElementById('root')).render(React.createElement(React.Fragment,null,React.createElement(Studio,{profile:{username:'ananya_design',full_name:'Ananya Sharma',avatar_url:null,tagline:'Brand designer & visual storyteller',skills:['Brand strategy','Visual identity','Packaging'],location:'Bengaluru, India'}}),React.createElement(Inspiration))); `);
write('input.css','@tailwind base;@tailwind components;@tailwind utilities;');
write('index.html','<!doctype html><html><head><meta charset="utf-8"><style>body{font-family:Arial,sans-serif}</style><meta name="viewport" content="width=device-width,initial-scale=1"><link rel="stylesheet" href="/style.css"></head><body><div id="root"></div><script src="/bundle.js"></script></body></html>');
let chrome,server,socket;const requests=new Map();let seq=0;
let fixtureEnabled=false,fixtureCard=null,fixturePaid=false,fixtureExports=0;
async function cardFixture(req,res,pathname){
  const send=(status,data)=>res.writeHead(status,{'Content-Type':'application/json'}).end(JSON.stringify(data));
  if(!fixtureEnabled){send(503,{error:'GigCard payments are not open yet. Your card has not been charged or unlocked.'});return}
  if(req.method==='GET'){send(200,{cards:fixtureCard?[{id:fixtureCard.id,title:fixtureCard.design.details.name,revision:fixtureCard.revision}]:[]});return}
  let raw='';for await(const chunk of req)raw+=chunk;const body=JSON.parse(raw||'{}');
  if(pathname==='/api/gigcard/cards'){fixtureCard={id:body.card_id,revision:(fixtureCard?.revision||0)+1,design:body.design};send(200,{card:fixtureCard});return}
  if(pathname==='/api/gigcard/checkout'){
    if(body.operation==='create')send(200,{card_id:fixtureCard.id,already_paid:fixturePaid,order_id:'order_Fixture',key_id:'rzp_test_fixture',amount:9900,currency:'INR'});
    else{fixturePaid=true;send(200,{verified:true,card_id:fixtureCard.id})}return;
  }
  if(pathname==='/api/gigcard/export'){
    if(!fixturePaid){send(402,{error:'Purchase required'});return}
    fixtureExports++;const pdf=body.format==='pdf';res.writeHead(200,{'Content-Type':pdf?'application/pdf':'image/png'}).end(fs.readFileSync(path.join(dir,pdf?'studio.pdf':'studio.png')));return;
  }
  send(404,{error:'Unknown fixture'});
}
const wait=ms=>new Promise(r=>setTimeout(r,ms));
async function command(method,params={}){const id=++seq;return new Promise((resolve,reject)=>{const timer=setTimeout(()=>{requests.delete(id);reject(Error('CDP timeout '+method))},30000);requests.set(id,{resolve:v=>{clearTimeout(timer);resolve(v)},reject});socket.send(JSON.stringify({id,method,params}))})}
async function evaluate(expression){const r=await command('Runtime.evaluate',{expression,awaitPromise:true,returnByValue:true});if(r.exceptionDetails)throw Error(JSON.stringify(r.exceptionDetails));return r.result.value}
async function until(expression){for(let i=0;i<60;i++){if(await evaluate(expression))return;await wait(250)}throw Error('Timeout: '+expression)}
async function main(){
  const css=cp.spawnSync(process.execPath,[require.resolve('tailwindcss/lib/cli.js'),'-i',path.join(dir,'input.css'),'-o',path.join(dir,'style.css'),'--content',[path.join(root,'components/profile/GigCardStudio.tsx'),path.join(root,'components/home/GigCardInspiration.tsx'),path.join(root,'components/profile/GigCardPurchase.tsx')].join(',')],{cwd:root,encoding:'utf8',windowsHide:true});if(css.status)throw Error(css.stderr);
  await new Promise((resolve,reject)=>webpack({mode:'development',entry:path.join(dir,'entry.js'),output:{path:dir,filename:'bundle.js',publicPath:'/'},devtool:false,resolve:{extensions:['.ts','.tsx','.js'],modules:[path.join(root,'node_modules')],alias:{'@':root,'next/link':path.join(dir,'link.js')}},module:{rules:[{test:/\.tsx?$/,exclude:/node_modules/,use:path.join(dir,'loader.cjs')}]},optimization:{minimize:false}},(error,stats)=>error||stats.hasErrors()?reject(error||Error(stats.toString({all:false,errors:true}))):resolve()));
  server=http.createServer((req,res)=>{const pathname=new URL(req.url,'http://localhost').pathname;if(pathname.startsWith('/api/gigcard/')){void cardFixture(req,res,pathname).catch(e=>{res.writeHead(500).end(String(e))});return}const target=path.join(dir,pathname==='/'?'index.html':pathname.slice(1));if(!target.startsWith(dir+path.sep)||!fs.existsSync(target)){res.writeHead(404).end();return}res.setHeader('Content-Type',target.endsWith('.js')?'text/javascript':target.endsWith('.css')?'text/css':'text/html');res.end(fs.readFileSync(target))});await new Promise(r=>server.listen(0,'127.0.0.1',r));
  const profile=path.join(dir,'chrome-profile');fs.mkdirSync(profile);
  chrome=cp.spawn('C:/Program Files/Google/Chrome/Application/chrome.exe',['--headless=new','--disable-gpu','--no-first-run','--no-default-browser-check','--remote-debugging-port=0','--user-data-dir='+profile,'about:blank'],{windowsHide:true,stdio:'ignore'});
  const portFile=path.join(profile,'DevToolsActivePort');for(let i=0;i<80&&!fs.existsSync(portFile);i++)await wait(250);if(!fs.existsSync(portFile))throw Error('Chrome debugging endpoint unavailable');
  const port=fs.readFileSync(portFile,'utf8').split('\n')[0],targets=await(await fetch('http://127.0.0.1:'+port+'/json/list')).json();socket=new WebSocket(targets.find(t=>t.type==='page').webSocketDebuggerUrl);await new Promise((r,j)=>{socket.onopen=r;socket.onerror=j});socket.onmessage=e=>{const m=JSON.parse(e.data);const p=requests.get(m.id);if(p){requests.delete(m.id);m.error?p.reject(Error(m.error.message)):p.resolve(m.result)}};
  await command('Page.enable');await command('Runtime.enable');await command('Browser.setDownloadBehavior',{behavior:'allow',downloadPath:dir});
  await command('Emulation.setDeviceMetricsOverride',{width:1280,height:1100,deviceScaleFactor:1,mobile:false});await command('Page.navigate',{url:'http://127.0.0.1:'+server.address().port});
  await until(`!!document.querySelector('canvas') && document.querySelector('canvas').width === 1800`);
  assert.equal(await evaluate('window.qaError||null'),null);
  const initialCard = await evaluate(`document.querySelector('canvas').toDataURL()`);
  await evaluate(`document.querySelector('input[type="checkbox"]').click()`);
  await wait(600);
  assert.notEqual(await evaluate(`document.querySelector('canvas').toDataURL()`), initialCard, 'branding toggle must update the exported preview');
  const beforePhoto = await evaluate(`document.querySelector('canvas').toDataURL()`);
  assert.equal(await evaluate(`getComputedStyle(document.querySelector('input:not([type])')).fontSize`), '16px');
  await evaluate(`(()=>{const c=document.createElement('canvas');c.width=c.height=50;c.getContext('2d').fillRect(0,0,50,50);c.toBlob(blob=>{const transfer=new DataTransfer();transfer.items.add(new File([blob],'my-photo.png',{type:'image/png'}));const input=document.querySelector('input[type="file"]');input.files=transfer.files;input.dispatchEvent(new Event('change',{bubbles:true}))})})()`);
  await wait(700);
  assert.equal(await evaluate(`Array.from(document.querySelectorAll('button')).some(b=>b.textContent==='Upload photo or logo')`),true);
  assert.notEqual(await evaluate(`document.querySelector('canvas').toDataURL()`), beforePhoto, 'uploaded photo must change the card');
  const cardDetails={name:'Ananya Sharma',headline:'Brand designer & visual storyteller',skills:'Brand strategy · Visual identity · Packaging',location:'Bengaluru, India',email:'hello@example.com',phone:''};
  const business=await evaluate(`(()=>{const c=document.createElement('canvas');qa.renderCard(c,{name:'Jayden BEN',headline:'Product founder',skills:'Founder',location:'Singapore',email:'hello@example.com',phone:'+65 1234 5678',company:'Northstar Studio',website:'https://example.com'},'owner','studio','#8b7cff',null,false);const data=c.getContext('2d').getImageData(0,0,c.width,c.height);return{qr:qa.jsQR(data.data,c.width,c.height)?.data,png:c.toDataURL()}})()`);
  assert.equal(business.qr,'https://example.com/');fs.writeFileSync(path.join(dir,'business-card.png'),Buffer.from(business.png.split(',')[1],'base64'));
  for(const template of ['noir','studio','prism']){
    const result=await evaluate(`(async()=>{const c=document.createElement('canvas');qa.renderCard(c,${JSON.stringify(cardDetails)},'ananya_design','${template}','#8b7cff',null);const png=await qa.canvasBlob(c,'image/png'),jpg=await qa.canvasBlob(c,'image/jpeg'),pdf=await qa.cardPdf(jpg,'https://www.gigway.in/u/ananya_design');const pixels=c.getContext('2d').getImageData(0,0,c.width,c.height);const decoded=qa.jsQR(pixels.data,c.width,c.height);return{decoded:decoded?.data,png:c.toDataURL(),pdf:Array.from(new Uint8Array(await pdf.arrayBuffer())),pngSize:png.size,jpgSize:jpg.size,width:c.width,height:c.height}})()`);
    assert.equal(result.decoded,'https://www.gigway.in/u/ananya_design');assert.equal(result.width,1800);assert.equal(result.height,1000);assert.ok(result.pngSize>10000&&result.jpgSize>10000);
    fs.writeFileSync(path.join(dir,template+'.png'),Buffer.from(result.png.split(',')[1],'base64'));fs.writeFileSync(path.join(dir,template+'.pdf'),Buffer.from(result.pdf));assert.ok(Buffer.from(result.pdf).toString('latin1').startsWith('%PDF-'));assert.ok(Buffer.from(result.pdf).toString('latin1').includes('/URI (https://www.gigway.in/u/ananya_design)'));
  }
  // Native share must receive a File, not a URL; cancellation is not a download.
  const share=await evaluate(`(async()=>{let received;Object.defineProperty(navigator,'canShare',{configurable:true,value:()=>true});Object.defineProperty(navigator,'share',{configurable:true,value:async d=>{received=d}});const f=new File(['fixture'],'card.png',{type:'image/png'});const result=await qa.shareCardImage(f);Object.defineProperty(navigator,'share',{configurable:true,value:async()=>{throw new DOMException('cancel','AbortError')}});const cancelled=await qa.shareCardImage(f);return{result,cancelled,file:received.files[0].name,url:received.url||null}})()`);assert.deepEqual(share,{result:'shared',cancelled:'cancelled',file:'card.png',url:null});

  assert.equal(await evaluate(`Array.from(document.querySelectorAll('a')).some(a=>a.href.includes('wa.me'))`),false);
  for (const label of ['Download PNG','Download JPG','Download PDF','Share card image']) {
    await evaluate(`Array.from(document.querySelectorAll('button')).find(b=>b.textContent===${JSON.stringify(label)}).click()`);
    assert.equal(await evaluate(`document.querySelector('dialog').open`),true);
    assert.equal(await evaluate(`document.querySelector('dialog').textContent.includes('₹99')`),true);
    await evaluate(`Array.from(document.querySelectorAll('button')).find(b=>b.textContent==='Back to editing').click()`);
  }
  await evaluate(`Array.from(document.querySelectorAll('button')).find(b=>b.textContent==='Download PNG').click()`);
  await evaluate(`Array.from(document.querySelectorAll('button')).find(b=>b.textContent.startsWith('Continue with Razorpay')).click()`);
  await until(`document.querySelector('dialog').open && document.querySelector('dialog').textContent.includes('not been charged')`);
  assert.equal(await evaluate(`!!document.querySelector('script[src*="checkout.razorpay.com"]')`),false);
  assert.equal(fs.readdirSync(dir).some(f=>f.endsWith('-preview.png')),false,'no unpaid download');
  const purchaseCapture=await command('Page.captureScreenshot',{format:'png'});fs.writeFileSync(path.join(dir,'purchase-prompt.png'),Buffer.from(purchaseCapture.data,'base64'));
  await evaluate(`Array.from(document.querySelectorAll('button')).find(b=>b.textContent==='Back to editing').click()`);
  fixtureEnabled=true;
  await evaluate(`window.fixtureOpens=0;window.Razorpay=class{constructor(options){this.options=options}on(){}open(){window.fixtureOpens++;this.options.handler({razorpay_order_id:'order_Fixture',razorpay_payment_id:'pay_Fixture',razorpay_signature:'synthetic'})}}`);
  for(const label of ['Download PNG','Share card image']){
    await evaluate(`Array.from(document.querySelectorAll('button')).find(b=>b.textContent===${JSON.stringify(label)}).click()`);
    await evaluate(`Array.from(document.querySelectorAll('button')).find(b=>b.textContent.startsWith('Continue with Razorpay')).click()`);
    await until(`document.querySelector('dialog').open && !!Array.from(document.querySelectorAll('button')).find(b=>b.textContent===${JSON.stringify(label==='Download PNG'?'Download paid card':'Share paid card')})`);
    assert.equal(await evaluate('window.fixtureOpens'),1,'repeat actions must reuse the paid card');
    if(label==='Share card image'){await evaluate(`Object.defineProperty(navigator,'share',{configurable:true,value:async data=>{window.sharedPaidFile=data.files[0].name}});Array.from(document.querySelectorAll('button')).find(b=>b.textContent==='Share paid card').click()`);await until('!!window.sharedPaidFile');}
    await evaluate(`Array.from(document.querySelectorAll('button')).find(b=>b.textContent==='Back to editing').click()`);
  }
  assert.equal(fixtureExports,2);assert.equal(fixtureCard.revision,2);
  for(const width of [360,390,768,1280]){
    await command('Emulation.setDeviceMetricsOverride',{width,height:1000,deviceScaleFactor:1,mobile:width<768});await wait(150);
    assert.equal(await evaluate('document.documentElement.scrollWidth<=innerWidth'),true,'horizontal overflow at '+width);
    if(width===390||width===1280){const capture=await command('Page.captureScreenshot',{format:'png',captureBeyondViewport:true});fs.writeFileSync(path.join(dir,'studio-ui-'+width+'.png'),Buffer.from(capture.data,'base64'))}
  }
  await evaluate(`(()=>{const input=document.querySelector('input');Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,'value').set.call(input,'');input.dispatchEvent(new Event('input',{bubbles:true}))})()`);await wait(500);assert.equal(await evaluate(`Array.from(document.querySelectorAll('button')).find(b=>b.textContent==='Download PNG').disabled`),true);
  fs.writeFileSync(path.join(dir,'result.json'),JSON.stringify({status:'PASS',templates:3,exports:'PNG/JPG/PDF',widths:[360,390,768,1280],share:'Paused denial plus simulated save/payment/verified export/repeat share; one checkout for two exports',scope:'local synthetic profile and mocked payment APIs; no real provider transaction or production auth'},null,2));console.log('PASS GigCard browser/export QA. Artifacts: '+dir);
}
main().catch(e=>{console.error(e);process.exitCode=1}).finally(async()=>{if(socket){try{await command('Browser.close')}catch{}socket.close()}if(chrome)chrome.kill();if(server)server.close()});
