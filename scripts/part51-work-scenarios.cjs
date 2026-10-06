// Controlled same-data before/after streaming measurements; not production CLS.
const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
module.exports = async ({cdp,evaluate,eventually,wait,base,report,temp,variant,setWorkState,networkRequests,dbRequests,reset}) => {
  report.variant=variant;report.samples=[];
  report.environment='LOCAL DEV committed HEAD'+(variant==='before'?'':' plus three Work fixes')+'; same six-row fixture; staggered 1600/2800/4000ms reads';
  await cdp('Page.addScriptToEvaluateOnNewDocument',{source:`window.__shifts=[];new PerformanceObserver(l=>{for(const e of l.getEntries())if(!e.hadRecentInput)window.__shifts.push({value:e.value,time:e.startTime,sources:e.sources.map(s=>({tag:s.node?.tagName,previous:s.previousRect.toJSON(),current:s.currentRect.toJSON()}))})}).observe({type:'layout-shift',buffered:true});`});
  // Compile separately; do not include compiler startup in paired samples.
  await cdp('Page.navigate',{url:base+'/work'});await eventually(()=>evaluate("document.querySelectorAll('main article').length===18"));
  const geometry=()=>evaluate(`({headings:[...document.querySelectorAll('main h2')].map(e=>({text:e.textContent,y:e.getBoundingClientRect().top+scrollY})),rails:[...document.querySelectorAll('main [role=region]')].map(e=>({label:e.getAttribute('aria-label'),count:e.querySelectorAll('article').length,height:e.getBoundingClientRect().height})),overflow:document.documentElement.scrollWidth>innerWidth,loading:[...document.querySelectorAll('main [role=status]')].map(e=>e.textContent)})`);
  async function sample(width,throttled,n=1,state='loaded'){
    await cdp('Emulation.setDeviceMetricsOverride',{width,height:800,deviceScaleFactor:1,mobile:width<768});
    await cdp('Emulation.setCPUThrottlingRate',{rate:throttled?4:1});
    await cdp('Network.emulateNetworkConditions',{offline:false,latency:throttled?150:0,downloadThroughput:throttled?200000:-1,uploadThroughput:throttled?200000:-1});
    await cdp('Network.clearBrowserCache');reset();const start=performance.now();await cdp('Page.navigate',{url:base+'/work'});
    await eventually(()=>evaluate("!!document.querySelector('main h1')"));const shellMs=Math.round(performance.now()-start),fallback=await geometry();
    const snapshots=[];
    for(let i=0;i<32;i++){const g=await geometry();snapshots.push({at:Math.round(performance.now()-start),...g});if(!g.loading.some(s=>s.startsWith('Loading ')))break;await wait(200)}
    await eventually(()=>evaluate("![...document.querySelectorAll('main [role=status]')].some(e=>e.textContent.startsWith('Loading '))"));await wait(700);
    const final=await geometry(),shifts=await evaluate('window.__shifts'),sum=shifts.reduce((a,s)=>a+s.value,0);
    assert.equal(final.overflow,false);assert.ok(final.rails.every(r=>r.count<=6));
    if(state==='loaded')assert.equal(final.rails.length,3);
    if(state==='failure')assert.equal(final.rails.length,2);
    const row={width,throttled,n,state,shellMs,fallback,final,snapshots,shiftEntrySum:sum,shifts,reads:[...dbRequests],requests:networkRequests.map(r=>({url:r.url.replace(base,''),type:r.type}))};report.samples.push(row);
    const shot=await cdp('Page.captureScreenshot',{format:'png'});fs.writeFileSync(path.join(temp,`${state}-${width}-${throttled}-${n}.png`),Buffer.from(shot.data,'base64'));
    console.log(JSON.stringify({variant,width,throttled,n,state,sum,shellMs,counts:final.rails.map(r=>r.count)}));
    if(state==='loaded'){const scroll=await evaluate("(()=>{const r=document.querySelector('main [role=region]');r.scrollLeft=r.querySelector('article').getBoundingClientRect().width+12;return r.scrollLeft})()");assert.ok(scroll>0,'rail remains horizontally scrollable');}
  }
  for(const throttled of (process.env.PART51_THROTTLED_ONLY?[true]:[false,true]))for(const width of [320,360,375,390,412,430,1280])await sample(width,throttled);
  for(const throttled of [false,true])for(const n of [2,3])await sample(390,throttled,n);
  if(variant!=='before'){
    setWorkState({count:0});await sample(390,false,1,'empty');
    setWorkState({count:6,fail:true});await sample(390,false,1,'failure');
    assert.equal(await evaluate("document.body.innerText.includes('Services could not be loaded')"),true);
  }
  assert.equal(report.errors.length,0);
};
