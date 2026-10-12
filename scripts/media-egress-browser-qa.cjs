// Real Chromium + real MediaImage and image handlers; local fixture storage only.
const fs = require('node:fs'), os = require('node:os'), path = require('node:path'), http = require('node:http'), vm = require('node:vm');
const { spawn } = require('node:child_process');
const assert = require('node:assert/strict'), ts = require('typescript'), sharp = require('sharp'), WebSocket = require('ws');
const { NextRequest } = require('next/server');
const temp = fs.mkdtempSync(path.join(os.tmpdir(), 'gigway-media-egress-'));
const env = { NEXT_PUBLIC_SUPABASE_URL: 'https://fixture.supabase.co', SUPABASE_SERVICE_ROLE_KEY: 'fixture-only' };
const transpile = file => ts.transpileModule(fs.readFileSync(file, 'utf8'), { compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.React, esModuleInterop: true } }).outputText;
function load(file, deps = {}, extra = {}) { const module = { exports: {} }; vm.runInNewContext(transpile(file), { module, exports: module.exports, require: name => deps[name] || require(name), Buffer, Uint8Array, Request, Response, Headers, URL, AbortSignal, process: { env }, ...extra }); return module.exports; }
const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));
let browser, socket, server;
(async () => {
  const fixture = await sharp(Buffer.from('<svg width="1800" height="1200"><rect width="1800" height="1200" fill="#4f46e5"/><circle cx="850" cy="560" r="430" fill="#ff9988"/><path d="M0 1150L1800 0" stroke="white" stroke-width="9"/></svg>')).png().toBuffer();
  const images = load('lib/media/image-server.ts'), policy = load('lib/media/image-policy.ts');
  const requests = [], storage = [], errors = [];
  const upstream = async url => { storage.push(String(url)); return new Response(fixture, { headers: { 'content-type': 'image/png' } }); };
  const avatar = load('app/api/media/image/route.ts', { '@/lib/media/image-policy': policy, '@/lib/media/image-server': images }, { fetch: upstream });
  const db = { from() { const q = { select: () => q, eq: () => q, in: () => q, maybeSingle: async () => ({ data: { storage_path: 'u/p/photo.png', file_size_bytes: fixture.length, mime_type: 'image/png', media_type: 'image' } }) }; return q; } };
  const media = load('lib/media/deliver-post-media.ts', { '@/lib/media/image-policy': policy, '@/lib/media/image-server': images, '@/lib/social/server': { POST_MEDIA_BUCKET: 'post-media', resolvePostAccess: async () => ({ visibility: 'public' }), requireSocialUser: async () => null, socialDb: () => db } }, { fetch: upstream });
  const component = transpile('components/ui/media-image.tsx');
  const html = `<!doctype html><html><head><meta name="viewport" content="width=device-width,initial-scale=1"><style>body{font:16px sans-serif;margin:24px;background:#faf9f5}img{object-fit:cover}section{display:flex;gap:20px;align-items:center}#post{width:320px;height:auto}button{padding:12px;margin:20px 0}</style></head><body><h1>GigWay media verification</h1><div id="root"></div><script src="/react.js"></script><script src="/react-dom.js"></script><script>
  const policy=(()=>{const module={exports:{}};const exports=module.exports;const process={env:${JSON.stringify(env)}};${transpile('lib/media/image-policy.ts')};return module.exports})();
  const MediaImage=(()=>{const module={exports:{}};const exports=module.exports;const require=name=>name==='react'?React:policy;${component};return module.exports.MediaImage})();
  const root=ReactDOM.createRoot(document.getElementById('root'));let version=0;let original=false;
  function render(){root.render(React.createElement(React.Fragment,null,React.createElement('section',null,...['a','b'].map(id=>React.createElement(MediaImage,{key:id,id,src:'https://fixture.supabase.co/storage/v1/object/public/avatars/u/photo.png',sizes:'128px',width:128,height:128,style:{borderRadius:'50%'},alt:'Avatar',loading:'eager'}))),React.createElement('p',null,'Render '+version),React.createElement(MediaImage,{id:'post',src:'/social/posts/p/media/m/public',sizes:'320px',original,alt:'Post',loading:'eager'}),React.createElement('br'),React.createElement('button',{onClick:()=>{version++;render()}},'Rerender'),React.createElement('button',{id:'zoom',onClick:()=>{original=true;render()}},'Open original'),React.createElement('div',{style:{marginTop:8000}},React.createElement(MediaImage,{id:'offscreen',src:'/social/posts/offscreen/media/m/public',sizes:'320px',alt:'Offscreen'}))));}render();window.rerender=()=>{version++;render()};window.showOriginal=()=>{original=true;render()};
  </script></body></html>`;
  server = http.createServer(async (req, res) => {
    try {
      const url = new URL(req.url, `http://127.0.0.1:${server.address().port}`);
      if (url.pathname === '/') { res.setHeader('Content-Type', 'text/html'); return res.end(html); }
      if (url.pathname === '/react.js' || url.pathname === '/react-dom.js') { res.setHeader('Content-Type', 'application/javascript'); return res.end(fs.readFileSync(require.resolve(url.pathname === '/react.js' ? 'react' : 'react-dom').replace(/index\.js$/, `umd/${url.pathname === '/react.js' ? 'react' : 'react-dom'}.development.js`))); }
      let response;
      if (url.pathname === '/api/media/image') response = await avatar.GET(new NextRequest(url, { headers: req.headers }));
      else if (url.pathname.startsWith('/social/posts/')) response = await media.deliverPostMedia(new NextRequest(url, { headers: req.headers }), Promise.resolve({ id: url.pathname.split('/')[3], mediaId: 'm' }));
      else { res.statusCode = 404; return res.end(); }
      requests.push({ url: req.url, status: response.status, conditional: !!req.headers['if-none-match'] });
      res.writeHead(response.status, Object.fromEntries(response.headers)); res.end(Buffer.from(await response.arrayBuffer()));
    } catch (error) { errors.push(String(error)); res.statusCode = 500; res.end(); }
  });
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  const profile = path.join(temp, 'chrome'); fs.mkdirSync(profile);
  browser = spawn(process.env.P0_BROWSER || 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe', ['--headless=new', '--disable-gpu', '--no-first-run', '--no-default-browser-check', '--remote-allow-origins=*', '--remote-debugging-address=127.0.0.1', '--remote-debugging-port=0', `--user-data-dir=${profile}`], { windowsHide: true, stdio: 'ignore' });
  browser.on('error', error => errors.push(String(error)));
  const activePort = path.join(profile, 'DevToolsActivePort');
  for (let i = 0; !fs.existsSync(activePort) && i < 100; i++) await sleep(100);
  assert(fs.existsSync(activePort), 'Chrome did not start');
  const port = fs.readFileSync(activePort, 'utf8').split('\n')[0];
  const tab = await (await fetch(`http://127.0.0.1:${port}/json/new?about:blank`, { method: 'PUT', signal: AbortSignal.timeout(10000) })).json();
  socket = new WebSocket(tab.webSocketDebuggerUrl);
  await new Promise((resolve, reject) => { socket.once('open', resolve); socket.once('error', reject); });
  let sequence = 0; const pending = new Map();
  socket.on('message', buffer => { const item = JSON.parse(buffer); if (item.id) { const request = pending.get(item.id); pending.delete(item.id); item.error ? request.reject(Error(JSON.stringify(item.error))) : request.resolve(item.result); } if (item.method === 'Runtime.exceptionThrown') errors.push(item.params.exceptionDetails.text); });
  const call = (method, params = {}) => new Promise((resolve, reject) => { const id = ++sequence; const timer=setTimeout(()=>reject(Error('DevTools timeout: '+method)),10000); pending.set(id, { resolve:value=>{clearTimeout(timer);resolve(value)}, reject:error=>{clearTimeout(timer);reject(error)} }); socket.send(JSON.stringify({ id, method, params })); });
  const evaluate = async expression => (await call('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true })).result.value;
  await call('Runtime.enable'); await call('Page.enable');
  await call('Emulation.setDeviceMetricsOverride', { width: 390, height: 844, deviceScaleFactor: 2, mobile: true });
  const address = `http://127.0.0.1:${server.address().port}/`;
  await call('Page.navigate', { url: address });
  for (let i = 0; i < 100 && !await evaluate("document.querySelector('#post')?.complete && document.querySelector('#post')?.naturalWidth > 0 && document.querySelector('#a')?.naturalWidth > 0"); i++) await sleep(100);
  assert(await evaluate("document.querySelector('#post')?.naturalWidth > 0"), 'Post did not render');
  assert.equal(requests.filter(x => x.url.startsWith('/api/media/image')).length, 1, 'Duplicate avatars must share one request');
  assert(!requests.some(x => x.url.includes('/offscreen/')), 'Offscreen image fetched eagerly');
  assert(requests.filter(x => x.url.includes('/posts/p/')).every(x => x.url.includes('?w=')), 'Original fetched before variant');
  const before = requests.length;
  await evaluate('window.rerender()'); await sleep(250); assert.equal(requests.length, before, 'Rerender fetched images');
  const selected = await evaluate("[...document.querySelectorAll('img')].map(x=>({id:x.id,src:x.currentSrc,width:x.naturalWidth}))");
  const screenshot = await call('Page.captureScreenshot', { format: 'png' }); fs.writeFileSync(path.join(temp, 'mobile.png'), Buffer.from(screenshot.data, 'base64'));
  await call('Page.reload', { ignoreCache: false });
  for (let i = 0; i < 100 && !requests.some(x => x.status === 304); i++) await sleep(100);
  assert(requests.some(x => x.status === 304 && x.conditional), 'Reload did not conditionally reuse post image');
  assert.equal(requests.filter(x => x.url.startsWith('/api/media/image')).length, 1, 'Fresh avatar cache missed on reload');
  await evaluate('window.showOriginal()');
  for (let i = 0; i < 50 && !requests.some(x => x.url === '/social/posts/p/media/m/public'); i++) await sleep(100);
  assert(requests.some(x => x.url === '/social/posts/p/media/m/public'), 'Enlargement did not use original');
  assert.equal(errors.length, 0, JSON.stringify(errors));
  const report = { mode: 'Chromium DPR 2, real component/handlers, local fixture storage', selected, requests, upstreamFetches: storage.length, errors, checks: ['one request for duplicate avatars', 'no eager original', 'no offscreen transfer', 'no rerender transfer', 'avatar fresh-cache reuse', 'post authorized 304 reuse', 'original on enlargement'] };
  fs.writeFileSync(path.join(temp, 'report.json'), JSON.stringify(report, null, 2));
  console.log('PASS browser media cache and DPR checks. Artifacts:', temp);
})().catch(error => { console.error(error); process.exitCode = 1; }).finally(() => { socket?.close(); browser?.kill(); server?.close(); });
