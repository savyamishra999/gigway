const fs = require('node:fs'), path = require('node:path'), assert = require('node:assert/strict');
module.exports = async function ({cdp,evaluate,eventually,wait,base,report,temp,networkRequests,dbRequests,auth,reset,setDelay}) {
  await cdp('Page.addScriptToEvaluateOnNewDocument',{source:"window.__shifts=[];new PerformanceObserver(l=>{for(const e of l.getEntries())if(!e.hadRecentInput)window.__shifts.push({value:e.value,time:e.startTime})}).observe({type:'layout-shift',buffered:true});"});
  const routes=[['/home','Welcome back.','Home primary useful post fixture'],['/network','Find people, build connections','Professional 0'],['/work','Find work. Hire people.','Senior product designer'],['/u/qa-person','QA Professional With','About'],['/create','Choose what to create','Offer a Service']];
  const has = text => evaluate('document.body.innerText.includes('+JSON.stringify(text)+')');
  // Compile all routes first. These are warm dev observations, not production benchmarks.
  for(const [route,,content]of routes){console.log('WARM '+route);await cdp('Page.navigate',{url:base+route});await eventually(()=>has(content));await wait(700);}
  await cdp('Emulation.setCPUThrottlingRate',{rate:4});
  for(const width of (process.env.PART4_WIDTHS ? process.env.PART4_WIDTHS.split(',').map(Number) : report.baseline?[390]:[320,360,375,390,412,430,1280])) {
    await cdp('Emulation.setDeviceMetricsOverride',{width,height:800,deviceScaleFactor:1,mobile:width<768});
    for(const [route,shell,content]of routes) {
      reset(); const started=performance.now();await cdp('Page.navigate',{url:base+route});
      await eventually(()=>has(shell));const shellMs=Math.round(performance.now()-started);
      await eventually(()=>has(content));const usefulMs=Math.round(performance.now()-started),firstRequests=networkRequests.length;
      await wait(1800);
      const layout=await evaluate(`({overflow:document.documentElement.scrollWidth>innerWidth,shifts:window.__shifts||[],images:[...document.images].map(i=>({src:i.currentSrc||i.src,loading:i.loading,width:i.width,height:i.height,complete:i.complete,top:i.getBoundingClientRect().top})),actions:[...document.querySelectorAll('[data-create-action]')].map(e=>({text:e.querySelector('h2').textContent,top:e.getBoundingClientRect().top,bottom:e.getBoundingClientRect().bottom})),resources:performance.getEntriesByType('resource').map(r=>({name:r.name,type:r.initiatorType,bytes:r.transferSize})),buttons:[...document.querySelectorAll('button')].filter(b=>!b.disabled).length})`);
      report.viewports.push({width,height:800,route,cpuRate:4,network:'unthrottled loopback',shellMs,usefulMs,firstRequests,requests:[...networkRequests],postUsefulRequests:networkRequests.length-firstRequests,authUserRequests:auth(),dbRequests:[...dbRequests],...layout});
      assert.equal(layout.overflow,false,'overflow '+width+' '+route);
      if(route==='/home') assert.equal(networkRequests.filter(r=>r.url.includes('/api/social/posts?feed=discover')).length,0);
      if(route==='/create') {assert.equal(layout.actions.length,4);assert.ok(layout.actions.every(a=>a.top>=0&&a.bottom<728),'Create actions above navigation');}
      const shot=await cdp('Page.captureScreenshot',{format:'png'});fs.writeFileSync(path.join(temp,route.replaceAll('/','_')+'-'+width+'.png'),Buffer.from(shot.data,'base64'));
      console.log('MEASURED '+width+' '+route+' shell='+shellMs+' useful='+usefulMs);
    }
  }
  await cdp('Emulation.setDeviceMetricsOverride',{width:390,height:800,deviceScaleFactor:1,mobile:true});
  await cdp('Page.navigate',{url:base+'/work'});await eventually(()=>evaluate("!![...document.querySelectorAll('nav a')].find(a=>a.textContent.trim()==='Create')"));await wait(1500);
  await cdp('Network.emulateNetworkConditions',{offline:false,latency:150,downloadThroughput:200000,uploadThroughput:200000,connectionType:'cellular3g'});
  for(const label of ['Create','Home','Network','Work']) {
    reset();const started=performance.now();await evaluate("[...document.querySelectorAll('nav a')].find(a=>a.getClientRects().length&&a.textContent.trim()==="+JSON.stringify(label)+").click()");
    const marker={Create:'Offer a Service',Home:'Home primary useful post fixture',Network:'Professional 0',Work:'Senior product designer'}[label];
    await eventually(()=>evaluate('location.pathname==='+JSON.stringify('/'+label.toLowerCase())+'&&document.body.innerText.includes('+JSON.stringify(marker)+')'),120000);const usefulMs=Math.round(performance.now()-started);await wait(1000);
    report.scenarios.push({label,width:390,cpuRate:4,rttMs:150,downloadMbps:1.6,usefulMs,requests:[...networkRequests],authUserRequests:auth(),dbRequests:[...dbRequests]});
    console.log('THROTTLED '+label+' '+usefulMs+'ms');
  }
  await cdp('Network.emulateNetworkConditions',{offline:false,latency:0,downloadThroughput:-1,uploadThroughput:-1});
  await cdp('Page.navigate',{url:base+'/network'});await eventually(()=>has('Professional 0'));await wait(1000);
  const followStarted=performance.now();await evaluate("document.querySelector('[aria-label=\"Follow Professional 0\"]').click()");
  await eventually(()=>evaluate("!!document.querySelector('[aria-label=\"Unfollow Professional 0\"]')"));
  report.scenarios.push({label:'Follow interaction',width:390,settledMs:Math.round(performance.now()-followStarted),passed:true});
  setDelay('network');await cdp('Page.navigate',{url:base+'/home'});await eventually(()=>has('Home primary useful post fixture'));
  report.scenarios.push({label:'delayed secondary network',primaryBeforeNetwork:await evaluate("!!document.querySelector('[data-home-ready=primary]')&&!document.querySelector('[data-home-ready=network]')")});setDelay(null);
  report.keyboard='NOT MEASURED: physical keyboard and devices';assert.equal(report.errors.length,0,'runtime exceptions');
  console.log('PASS Part 4 browser checks');
};
