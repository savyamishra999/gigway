// Local-only browser QA. No production credentials, OAuth provider, or database.
// Requires installed Chrome (or P0_BROWSER) and Node's built-in WebSocket.
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const http = require('node:http');
const { spawn, spawnSync } = require('node:child_process');
const assert = require('node:assert/strict');
const temp = fs.mkdtempSync(path.join(os.tmpdir(), 'gigway-home-qa-'));
const report = { mode: 'headless Chromium, development build, mocked local Supabase', viewports: [], scenarios: [], errors: [], temp };
const user = { id: '11111111-1111-4111-8111-111111111111', email: 'qa@example.invalid', aud: 'authenticated', role: 'authenticated', app_metadata: {}, user_metadata: { full_name: 'QA New Professional', avatar_url: 'https://lh3.googleusercontent.com/qa-fixture' }, created_at: new Date().toISOString() };
const person = { id: user.id, username: 'qa-person', full_name: 'QA Professional With A Deliberately Long Display Name', avatar_url: 'https://example.invalid/avatar.jpg', profile_completed: true, skills: ['Product Strategy', 'Performance Marketing'], portfolio_links: [], user_roles: ['find_work'], find_work_type: 'both', tagline: 'I build useful professional products for teams across India without losing clarity on small screens', bio: 'Public identity fixture About text that must remain below the identity header.' };
const org = { id: '22222222-2222-4222-8222-222222222222', username: 'qa-workplace', name: 'QA Workplace', entity_type: 'company', description: 'Public Workplace fixture', website: 'https://example.invalid' };
let databaseFailure = false;
let fault = null;
let delay = null;
const dbRequests = [];
let authUserRequests = 0;
const fixturePost = { id: '33333333-3333-4333-8333-333333333333', author_user_id: 'other', author_profile_id: person.id, author_organization_id: null, body: 'Home primary useful post fixture', content_format: 'standard', visibility: 'public', status: 'published', created_at: '2026-09-20T12:00:00Z', edited_at: null };

const mock = http.createServer(async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Headers', '*');
  res.setHeader('Access-Control-Expose-Headers', 'content-range');
  res.setHeader('Content-Type', 'application/json');
  if (req.method === 'OPTIONS') { res.end('{}'); return; }
  const url = new URL(req.url, 'http://127.0.0.1:54339');
  if (url.pathname.startsWith('/auth/v1/')) {
    if (url.pathname.endsWith('/user')) { authUserRequests++; res.end(JSON.stringify(user)); return; }
    if (url.pathname.endsWith('/verify') || url.pathname.endsWith('/token')) {
      const expires = Math.floor(Date.now() / 1000) + 3600;
      const token = [Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url'), Buffer.from(JSON.stringify({ sub: user.id, aud: 'authenticated', exp: expires, role: 'authenticated' })).toString('base64url'), 'dummy'].join('.');
      res.end(JSON.stringify({ access_token: token, token_type: 'bearer', expires_in: 3600, expires_at: expires, refresh_token: 'local-only', user })); return;
    }
    res.end('{}'); return;
  }
  if (databaseFailure) { res.statusCode = 503; res.end(JSON.stringify({ message: 'Injected query failure', code: 'QA503' })); return; }
  const table = url.pathname.split('/').pop();
  dbRequests.push({ table, query: url.search });
  const module = table === 'posts' ? (url.searchParams.get('content_format') === 'eq.glimps' ? 'glimps' : url.searchParams.get('content_format') === 'eq.vijox' ? 'jox' : 'primary') : table === 'organizations' ? 'network' : table === 'jobs' ? 'opportunities' : table === 'messages' ? 'activity' : table === 'profiles' && url.searchParams.get('id') === 'eq.' + user.id ? 'completion' : null;
  if (delay === module && module) await new Promise(resolve => setTimeout(resolve, 5000));
  if (fault === module && module) { res.statusCode = 503; res.end(JSON.stringify({ message: 'Synthetic failure', code: 'QA503' })); return; }
  let rows = [];
  if (table === 'posts' && module === 'primary') rows = [fixturePost];
  if (table === 'posts' && module === 'jox') rows = [{...fixturePost,id:'44444444-4444-4444-8444-444444444444',body:'Jox fixture',content_format:'vijox'}];
  if (table === 'posts' && module === 'glimps') rows = [{...fixturePost,id:'55555555-5555-4555-8555-555555555555',body:'Glimps fixture',content_format:'glimps'}];
  if (table === 'profiles') {
    if (req.method === 'PATCH') {
      let body = ''; for await (const chunk of req) body += chunk;
      Object.assign(person, JSON.parse(body || '{}')); rows = [person];
    } else {
      const username = url.searchParams.get('username') || '';
      rows = username === 'eq.qa-workplace' || username.startsWith('ilike.') ? [] : [person];
    }
  }
  if (table === 'organizations') rows = (url.searchParams.get('username') || '').startsWith('ilike.') ? [] : [org];
  if (table === 'organization_members') rows = [{ organization_id: org.id, profile_id: person.id, member_role: 'owner', status: 'active', organizations: org }];
  if (table === 'profile_intents') rows = [{ profile_id: person.id, intent_type: 'looking_for_work' }];
  if (table === 'gigs') rows = [{ id: 'gig-qa', title: 'Mobile-first identity design service', status: 'active', freelancer_id: person.id }];
  if (table === 'jobs') rows = [{ id: 'job-qa', title: 'Senior product designer', status: 'active', client_id: 'other' }];
  if (table === 'projects') rows = [{ id: 'project-qa', title: 'Professional network research', status: 'open', client_id: 'other' }];
  res.setHeader('content-range', rows.length ? `0-${rows.length - 1}/${rows.length}` : '*/0');
  res.end(JSON.stringify(req.headers.accept?.includes('vnd.pgrst.object') ? rows[0] || null : rows));
});
let next, browser, socket;
const wait = ms => new Promise(resolve => setTimeout(resolve, ms));
async function eventually(operation, limit = 90000) {
  const end = Date.now() + limit; let error;
  while (Date.now() < end) { try { const result = await operation(); if (result) return result; } catch (e) { error = e; } await wait(200); }
  throw error || Error('Timed out');
}
function stop(child) {
  if (!child?.pid) return;
  if (process.platform === 'win32') spawnSync('taskkill', ['/pid', String(child.pid), '/t', '/f'], { windowsHide: true, stdio: 'ignore' });
  else child.kill('SIGTERM');
}
(async () => {
  await new Promise(resolve => mock.listen(54339, '127.0.0.1', resolve));
  const log = fs.openSync(path.join(temp, 'next.log'), 'a');
  next = spawn(process.execPath, ['node_modules/next/dist/bin/next', 'dev', '--hostname', '127.0.0.1', '--port', '3117'], {
    cwd: process.cwd(), windowsHide: true, stdio: ['ignore', log, log],
    env: { ...process.env, NODE_ENV: 'development', NEXT_TELEMETRY_DISABLED: '1', NEXT_PUBLIC_SUPABASE_URL: 'http://127.0.0.1:54339', NEXT_PUBLIC_SUPABASE_ANON_KEY: 'local-anon', SUPABASE_SERVICE_ROLE_KEY: 'local-service', ADMIN_EMAILS: 'admin@example.invalid' },
  });
  if (process.env.HOME_HTTP_QA === '1') {
    report.mode = 'SYNTHETIC HTTP streaming, development build, local mocked Supabase; not browser visibility';
    const base = 'http://localhost:3117';
    await eventually(async () => (await fetch(base + '/login', { signal: AbortSignal.timeout(10000) })).ok, 120000);
    const session = await (await fetch('http://127.0.0.1:54339/auth/v1/token')).json();
    const cookie = 'sb-127-auth-token=base64-' + Buffer.from(JSON.stringify(session)).toString('base64url');
    async function streamHome() {
      dbRequests.length = 0; authUserRequests = 0;
      const started = performance.now(), marks = {}; let html = '';
      const response = await fetch(base + '/home', { headers: { Cookie: cookie }, signal: AbortSignal.timeout(90000) });
      assert.equal(response.status, 200);
      for await (const chunk of response.body) {
        html += Buffer.from(chunk).toString();
        for (const name of ['primary','opportunities','network','jox','glimps','completion','activity']) {
          if (html.includes('data-home-ready="' + name + '"') || html.includes('data-home-error="' + name + '"')) marks[name] ??= Math.round(performance.now()-started);
        }
        if (html.includes('Welcome back.')) marks.shell ??= Math.round(performance.now()-started);
        if (html.includes('Home primary useful post fixture')) marks.usefulBytes ??= Math.round(performance.now()-started);
      }
      assert.equal(Object.keys(marks).filter(k=>!['shell','usefulBytes'].includes(k)).length, 7, 'Missing module outcome');
      assert.ok(marks.shell !== undefined);
      if (fault !== 'primary') assert.ok(marks.usefulBytes !== undefined);
      if (fault==='primary') for (const heading of ['Opportunities for You','Grow Your Network','Voices on GigWay','Quick professional moments','Build your Professional Identity','Your activity']) assert.ok(html.includes(heading),'Primary failure removed '+heading);
      return { marks, authUserRequests, errors: [...html.matchAll(/data-home-error="([^"]+)"/g)].map(m=>m[1]), requests: [...dbRequests], hasRetry: html.includes('Try again') };
    }
    await streamHome();
    report.normal = await streamHome();
    assert.equal(report.normal.authUserRequests, 1, 'repeated authoritative viewer lookup');
    assert.equal(report.normal.requests.filter(q=>q.table==='profiles' && new URLSearchParams(q.query).get('id')==='eq.'+user.id).length, 1);
    assert.equal(report.normal.requests.filter(q=>q.table==='profile_intents' && new URLSearchParams(q.query).get('profile_id')==='eq.'+user.id).length, 1);
    for (const name of ['opportunities','network','jox','glimps','completion','activity']) {
      delay = name; const result = await streamHome();
      assert.ok(result.marks.primary < result.marks[name], name + ' delayed primary stream');
      report.scenarios.push({ name: name + ' delayed 5000ms', ...result }); delay = null;
    }
    for (const name of ['jox','opportunities','activity','completion','primary']) {
      fault = name; const result = await streamHome(); assert.ok(result.hasRetry);
      if (name==='primary') assert.deepEqual(result.errors,['primary'],'secondary failed with primary');
      report.scenarios.push({ name: name + ' fails', ...result }); fault = null;
    }
    console.log('PASS real Next Home HTTP streams primary independently; local mock only, no browser measurements');
    return;
  }
  // Port 0 lets Chrome pick a free ephemeral port instead of a hardcoded one:
  // a stale headless instance left over from an earlier interrupted run (or a
  // second run of this script) previously squatted on a fixed debug port, so
  // every later run's version-check silently attached to that zombie browser
  // instead of its own freshly-spawned one and then hung driving a dead page.
  const browserDir = path.join(temp, 'browser');
  fs.mkdirSync(browserDir, { recursive: true });
  browser = spawn(process.env.P0_BROWSER || 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe', ['--headless=new','--disable-gpu','--no-first-run','--no-default-browser-check','--remote-allow-origins=*','--remote-debugging-address=127.0.0.1','--remote-debugging-port=0',`--user-data-dir=${browserDir}`], { windowsHide: true, stdio: 'ignore' });
  const portFile = path.join(browserDir, 'DevToolsActivePort');
  const debugPort = await eventually(async () => {
    if (!fs.existsSync(portFile)) return null;
    const port = Number(fs.readFileSync(portFile, 'utf8').split('\n')[0]);
    return Number.isInteger(port) && port > 0 ? port : null;
  });
  const devtools = `http://127.0.0.1:${debugPort}`;
  await eventually(async () => (await fetch(`${devtools}/json/version`, { signal: AbortSignal.timeout(10000) })).ok);
  const tab = await (await fetch(`${devtools}/json/new?about:blank`, { method: 'PUT', signal: AbortSignal.timeout(10000) })).json();
  socket = new WebSocket(tab.webSocketDebuggerUrl);
  await Promise.race([
    new Promise(resolve => socket.addEventListener('open', resolve, { once: true })),
    new Promise((_, reject) => setTimeout(() => reject(Error('Chrome DevTools WebSocket did not open')), 10000)),
  ]);
  let sequence = 0; const pending = new Map();
  function cdp(method, params = {}) { const id = ++sequence; return new Promise((resolve, reject) => { const timer = setTimeout(() => { pending.delete(id); reject(Error('CDP timeout: ' + method)); }, 15000); pending.set(id, { resolve: value => { clearTimeout(timer); resolve(value); }, reject: error => { clearTimeout(timer); reject(error); } }); socket.send(JSON.stringify({ id, method, params })); }); }
  socket.addEventListener('message', async event => {
    const message = JSON.parse(event.data);
    if (message.id) { const entry = pending.get(message.id); if (!entry) return; pending.delete(message.id); message.error ? entry.reject(Error(message.error.message)) : entry.resolve(message.result); }
    if (message.method === 'Fetch.requestPaused') {
      const { requestId, request } = message.params;
      // Next dev's own redirect responses (e.g. middleware's `new URL('/login', req.url)`)
      // can report an origin of "localhost" even when the server was bound to
      // 127.0.0.1; allow both loopback spellings so a same-server redirect is
      // never mistaken for third-party network egress.
      const local = /^(?:http:\/\/(?:127\.0\.0\.1|localhost)(?::\d+)?\/|data:|about:)/.test(request.url);
      await cdp(local ? 'Fetch.continueRequest' : 'Fetch.failRequest', local ? { requestId } : { requestId, errorReason: 'BlockedByClient' }).catch(() => {});
    }
    if (message.method === 'Runtime.exceptionThrown') report.errors.push(message.params.exceptionDetails.text + ': ' + (message.params.exceptionDetails.exception?.description || ''));
  });
  await cdp('Page.enable'); await cdp('Runtime.enable'); await cdp('Network.enable'); await cdp('Fetch.enable', { patterns: [{ urlPattern: '*' }] });
  const evaluate = async expression => { const value = await cdp('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true }); if (value.exceptionDetails) throw Error(value.exceptionDetails.text); return value.result.value; };
  // Next dev's middleware redirects (`new URL('/login', req.url)`) resolve to
  // "localhost", not "127.0.0.1", even when the server is bound to 127.0.0.1 and
  // was reached that way — a dev-server-only quirk absent in production, where the
  // canonical domain is fixed. Browser cookies are host-specific, so navigating
  // this harness on "127.0.0.1" while the login redirect chain lands on
  // "localhost" makes a just-set session cookie invisible on the next direct
  // navigate() call. Using the same host middleware already redirects to keeps
  // every navigation on one consistent origin for the whole run.
  const base = 'http://localhost:3117';
  await eventually(async () => (await fetch(base + '/login', { signal: AbortSignal.timeout(10000) })).ok, 120000);
  const session = await (await fetch('http://127.0.0.1:54339/auth/v1/token')).json();
  await cdp('Network.setCookie', { name: 'sb-127-auth-token', value: 'base64-' + Buffer.from(JSON.stringify(session)).toString('base64url'), url: base });
  await cdp('Page.addScriptToEvaluateOnNewDocument', { source: `
    window.homeMarks = { navigation: 0 };
    new MutationObserver(() => {
      if (document.querySelector('main h1')?.textContent.includes('Welcome back')) window.homeMarks.shell ??= performance.now();
      for (const element of document.querySelectorAll('[data-home-ready], [data-home-error]')) {
        const name = element.dataset.homeReady || element.dataset.homeError;
        if (element.getBoundingClientRect().height || !element.textContent) window.homeMarks[name] ??= performance.now();
      }
      if (document.body?.innerText.includes('Home primary useful post fixture')) window.homeMarks.useful ??= performance.now();
    }).observe(document, { childList: true, subtree: true });
  ` });
  async function home() {
    dbRequests.length = 0;
    await cdp('Page.navigate', { url: base + '/home' });
    await eventually(() => evaluate(`!!document.querySelector('[data-home-ready="primary"], [data-home-error="primary"]')`));
    await eventually(() => evaluate(`document.querySelectorAll('[data-home-ready], [data-home-error]').length === 7`));
    const result = await evaluate(`({ marks: window.homeMarks, overflow: document.documentElement.scrollWidth > innerWidth, errors: [...document.querySelectorAll('[data-home-error]')].map(e => e.dataset.homeError), discoverRequests: performance.getEntriesByType('resource').filter(e => e.name.includes('/api/social/posts?feed=discover')).length })`);
    assert.equal(result.discoverRequests, 0, 'SSR first page fetched again');
    return result;
  }
  await home(); // compilation warm-up, not a reported performance sample
  for (const width of [320,360,375,390,412,430,1280]) {
    await cdp('Emulation.setDeviceMetricsOverride', { width, height: 900, deviceScaleFactor: 1, mobile: width < 600 });
    const result = await home(); assert.equal(result.overflow, false);
    report.viewports.push({ width, ...result });
  }
  report.normal = await home();
  await cdp('Emulation.setCPUThrottlingRate', { rate: 4 });
  await cdp('Network.emulateNetworkConditions', { offline: false, latency: 150, downloadThroughput: 200000, uploadThroughput: 100000 });
  report.throttled = await home();
  await cdp('Emulation.setCPUThrottlingRate', { rate: 1 });
  await cdp('Network.emulateNetworkConditions', { offline: false, latency: 0, downloadThroughput: -1, uploadThroughput: -1 });
  for (const name of ['glimps', 'network', 'opportunities']) {
    delay = name; const result = await home();
    assert.ok(result.marks.useful < result.marks[name], name + ' blocked primary');
    report.scenarios.push({ name: name + ' delayed 5s', ...result }); delay = null;
  }
  for (const name of ['jox', 'opportunities', 'activity', 'completion', 'primary']) {
    fault = name; const result = await home();
    if (name !== 'primary') assert.ok(result.marks.useful);
    assert.ok(result.marks.shell); report.scenarios.push({ name: name + ' fails', ...result }); fault = null;
  }
  console.log('PASS Home browser readiness, failures, widths and request duplication');
})().catch(error => { report.failure = error.stack; console.error(error); process.exitCode = 1; }).finally(() => {
  socket?.close(); stop(browser); stop(next); mock.closeAllConnections(); mock.close();
  fs.writeFileSync(path.join(temp, 'report.json'), JSON.stringify(report, null, 2));
  console.log(`QA report: ${path.join(temp, 'report.json')}`);
});
