const assert=require('node:assert/strict');const fs=require('node:fs');const vm=require('node:vm');
const sw=fs.readFileSync('public/sw.js','utf8'),routes=[],imports=[];
class NetworkOnly{constructor(){this.kind='NetworkOnly'}}class CacheFirst{constructor(options){this.kind='CacheFirst';this.options=options}}
class ExpirationPlugin{constructor(options){this.options=options}}class CacheableResponsePlugin{constructor(options){this.options=options}}
const workbox={clientsClaim(){},precacheAndRoute(entries){workbox.precache=entries},cleanupOutdatedCaches(){workbox.cleanup=true},registerRoute(pattern,handler,method){routes.push({pattern,handler,method})},NetworkOnly,CacheFirst,ExpirationPlugin,CacheableResponsePlugin};
const self={skipWaiting(){},location:{origin:'https://gigway.in'}};const define=(_deps,factory)=>factory(workbox);
vm.runInNewContext(sw,{self,define,URL,Response,importScripts:name=>imports.push(name)});
assert.equal(workbox.cleanup,true);assert.equal(routes.length,2);assert.equal(routes[0].handler.kind,'NetworkOnly');assert.equal(routes[0].method,'GET');
const match=(route,mode='cors')=>routes[0].pattern({request:{mode},url:new URL(`https://gigway.in${route}`)});
assert.equal(match('/','navigate'),true);assert.equal(match('/home','navigate'),true);assert.equal(match('/api/messages'),true);assert.equal(match('/api/notifications'),true);assert.equal(match('/_next/data/build/home.json'),false);
assert.equal(routes[1].handler.kind,'CacheFirst');assert.equal(routes[1].handler.options.cacheName,'gigway-static-v2');assert.equal(routes[1].pattern({url:new URL('https://gigway.in/_next/static/chunk.js')}),true);assert.equal(routes[1].pattern({url:new URL('https://cdn.invalid/private.jpg')}),false);
assert.equal(/start-url|new \w+\.NetworkFirst|cacheName:"apis"|cacheName:"others"|cacheName:"next-data"/.test(sw),false);assert.equal(/(?:url:\s*)?["']\/["']/.test(sw),false,'root must not be precached');
const workerName=imports.find(name=>/^worker-.*\.js$/.test(name));assert.ok(workerName);const custom=fs.readFileSync(`public/${workerName}`,'utf8');let activate;
const oldNames=['start-url','apis','others','next-data','static-data-assets','cross-origin','static-image-assets','next-image','static-audio-assets','static-video-assets'];const remaining=new Set([...oldNames,'workbox-precache-v2-safe','gigway-static-v2']);
const customSelf={addEventListener(type,listener){if(type==='activate')activate=listener}};const caches={keys:async()=>[...remaining],delete:async name=>remaining.delete(name)};vm.runInNewContext(custom,{self:customSelf,caches,Promise,Set});assert.ok(activate);let activation;activate({waitUntil(promise){activation=promise}});activation.then(()=>{
 for(const name of oldNames)assert.equal(remaining.has(name),false,`${name} survived activation`);assert.equal(remaining.has('workbox-precache-v2-safe'),true);assert.equal(remaining.has('gigway-static-v2'),true);
 const unsafeCache=new Map([['/',{body:'guest landing'}],['/api/me',{account:'A'}]]);const network=(account,url)=>({account,url});const fetchThroughGeneratedPolicy=(account,url,mode='cors')=>match(url,mode)?network(account,url):unsafeCache.get(url);
 assert.equal(fetchThroughGeneratedPolicy('B','/','navigate').account,'B');assert.equal(fetchThroughGeneratedPolicy('B','/api/me').account,'B');assert.equal(fetchThroughGeneratedPolicy('guest','/api/me').account,'guest');
 console.log(`PASS: generated ${workerName} uses NetworkOnly for navigations/APIs, CacheFirst only for versioned Next static assets, omits root precache/NetworkFirst, deletes all legacy unsafe caches, preserves safe caches, and isolates guest/A/B responses.`)
}).catch(error=>{console.error(error);process.exitCode=1});
