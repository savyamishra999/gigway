// Local-only browser QA. No production credentials, OAuth provider, or database.
// Requires installed Chrome (or P0_BROWSER) and Node's built-in WebSocket.
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const http = require('node:http');
const { spawn, spawnSync } = require('node:child_process');
const assert = require('node:assert/strict');
const temp = fs.mkdtempSync(path.join(os.tmpdir(), 'gigway-p0-qa-'));
const report = { mode: 'headless Chromium, development build, mocked local Supabase', viewports: [], scenarios: [], errors: [], temp };
const user = { id: '11111111-1111-4111-8111-111111111111', email: 'qa@example.invalid', aud: 'authenticated', role: 'authenticated', app_metadata: {}, user_metadata: {}, created_at: new Date().toISOString() };
const person = { id: user.id, username: 'qa-person', full_name: 'QA Professional', profile_completed: true, skills: [], portfolio_links: [], user_roles: ['find_work'], find_work_type: 'both', bio: 'Public identity fixture' };
const org = { id: '22222222-2222-4222-8222-222222222222', username: 'qa-workplace', name: 'QA Workplace', entity_type: 'company', description: 'Public Workplace fixture', website: 'https://example.invalid' };
let databaseFailure = false;
const mock = http.createServer(async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Headers', '*');
  res.setHeader('Access-Control-Expose-Headers', 'content-range');
  res.setHeader('Content-Type', 'application/json');
  if (req.method === 'OPTIONS') { res.end('{}'); return; }
  const url = new URL(req.url, 'http://127.0.0.1:54329');
  if (url.pathname.startsWith('/auth/v1/')) {
    if (url.pathname.endsWith('/user')) { res.end(JSON.stringify(user)); return; }
    if (url.pathname.endsWith('/verify') || url.pathname.endsWith('/token')) {
      const expires = Math.floor(Date.now() / 1000) + 3600;
      const token = [Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url'), Buffer.from(JSON.stringify({ sub: user.id, aud: 'authenticated', exp: expires, role: 'authenticated' })).toString('base64url'), 'dummy'].join('.');
      res.end(JSON.stringify({ access_token: token, token_type: 'bearer', expires_in: 3600, expires_at: expires, refresh_token: 'local-only', user })); return;
    }
    res.end('{}'); return;
  }
  if (databaseFailure) { res.statusCode = 503; res.end(JSON.stringify({ message: 'Injected query failure', code: 'QA503' })); return; }
  const table = url.pathname.split('/').pop();
  let rows = [];
  if (table === 'profiles') rows = url.searchParams.get('username') === 'eq.qa-workplace' ? [] : [person];
  if (table === 'organizations') rows = [org];
  if (table === 'organization_members') rows = [{ organization_id: org.id, profile_id: person.id, member_role: 'owner', status: 'active', organizations: org }];
  if (table === 'profile_intents') rows = [{ profile_id: person.id, intent_type: 'looking_for_work' }];
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
  await new Promise(resolve => mock.listen(54329, '127.0.0.1', resolve));
  const log = fs.openSync(path.join(temp, 'next.log'), 'a');
  next = spawn(process.execPath, ['node_modules/next/dist/bin/next', 'dev', '--hostname', '127.0.0.1', '--port', '3107'], {
    cwd: process.cwd(), windowsHide: true, stdio: ['ignore', log, log],
    env: { ...process.env, NODE_ENV: 'development', NEXT_TELEMETRY_DISABLED: '1', NEXT_PUBLIC_SUPABASE_URL: 'http://127.0.0.1:54329', NEXT_PUBLIC_SUPABASE_ANON_KEY: 'local-anon', SUPABASE_SERVICE_ROLE_KEY: 'local-service', ADMIN_EMAILS: 'admin@example.invalid' },
  });
  // Port 0 lets Chrome pick a free ephemeral port instead of a hardcoded one:
  // a stale headless instance left over from an earlier interrupted run (or a
  // second run of this script) previously squatted on a fixed debug port, so
  // every later run's version-check silently attached to that zombie browser
  // instead of its own freshly-spawned one and then hung driving a dead page.
  const browserDir = path.join(temp, 'browser');
  fs.mkdirSync(browserDir, { recursive: true });
  browser = spawn(process.env.P0_BROWSER || 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe', ['--headless=new','--disable-gpu','--no-first-run','--no-default-browser-check','--remote-debugging-port=0',`--user-data-dir=${browserDir}`], { windowsHide: true, stdio: 'ignore' });
  const portFile = path.join(browserDir, 'DevToolsActivePort');
  const debugPort = await eventually(async () => {
    if (!fs.existsSync(portFile)) return null;
    const port = Number(fs.readFileSync(portFile, 'utf8').split('\n')[0]);
    return Number.isInteger(port) && port > 0 ? port : null;
  });
  const devtools = `http://127.0.0.1:${debugPort}`;
  await eventually(async () => (await fetch(`${devtools}/json/version`)).ok);
  const tab = await (await fetch(`${devtools}/json/new?about:blank`, { method: 'PUT' })).json();
  socket = new WebSocket(tab.webSocketDebuggerUrl);
  await new Promise(resolve => socket.addEventListener('open', resolve, { once: true }));
  let sequence = 0; const pending = new Map();
  function cdp(method, params = {}) { const id = ++sequence; socket.send(JSON.stringify({ id, method, params })); return new Promise((resolve, reject) => pending.set(id, { resolve, reject })); }
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
  const base = 'http://localhost:3107';
  async function navigate(route, expected) {
    await cdp('Page.navigate', { url: base + route });
    try {
      await eventually(async () => evaluate(`document.body && document.body.innerText.includes(${JSON.stringify(expected)})`));
    } catch (e) {
      const state = await evaluate(`({ href: location.href, readyState: document.readyState, text: (document.body && document.body.innerText || '').slice(0, 300) })`).catch(err => ({ evaluateError: err.message }));
      console.error(`navigate(${route}, ${JSON.stringify(expected)}) failed; page state:`, JSON.stringify(state));
      throw e;
    }
    await wait(500);
    return evaluate(`({path:location.pathname+location.search, overflow:document.documentElement.scrollWidth>innerWidth, h1:[...document.querySelectorAll('h1')].map(e=>e.innerText), ttfb:performance.getEntriesByType('navigation')[0]?.responseStart})`);
  }
  // Wait for the development server before the first browser navigation.
  await eventually(async () => (await fetch(base + '/login')).ok, 120000);
  // Warm compilation before viewport checks; this remains development QA.
  await navigate('/login', 'Welcome back');
  for (const width of [320,360,375,390,412,430,1280]) {
    await cdp('Emulation.setDeviceMetricsOverride', { width, height: 900, deviceScaleFactor: 1, mobile: width < 600 });
    const routes = [];
    for (const [route, expected] of [['/','Your Professional Identity.'],['/u/qa-person','QA Professional'],['/u/qa-workplace','QA Workplace'],['/login','Welcome back']]) {
      const result = await navigate(route, expected); routes.push({ route, ...result });
      assert.equal(result.overflow, false, `Horizontal overflow at ${width} on ${route}`);
    }
    report.viewports.push({ width, routes }); console.log(`PASS browser width ${width}: landing, person, Workplace, login`);
  }
  await cdp('Emulation.setCPUThrottlingRate', { rate: 4 });
  await cdp('Network.emulateNetworkConditions', { offline: false, latency: 150, downloadThroughput: 200000, uploadThroughput: 100000 });
  report.scenarios.push({ name: 'throttled guest landing, 4x CPU / 150ms / 1.6Mbps', result: await navigate('/', 'Your Professional Identity.') });
  console.log('... throttled landing ok');
  await cdp('Emulation.setCPUThrottlingRate', { rate: 1 });
  await cdp('Network.emulateNetworkConditions', { offline: false, latency: 0, downloadThroughput: -1, uploadThroughput: -1 });
  await navigate('/workplaces?tab=active', 'Welcome back');
  assert.equal(new URL(await evaluate('location.href')).searchParams.get('next'), '/workplaces?tab=active');
  console.log('... guest protected destination -> login ok');
  async function login() {
    await evaluate(`document.querySelector('input[type=email]').focus()`);
    await cdp('Input.insertText', { text: 'qa@example.invalid' });
    await evaluate(`document.querySelector('form button[type=submit]').click()`);
    await eventually(() => evaluate(`document.body.innerText.includes('Check your inbox')`));
    await evaluate(`document.querySelector('input[inputmode=numeric]').focus()`);
    await cdp('Input.insertText', { text: '123456' });
    await evaluate(`document.querySelector('form button[type=submit]').click()`);
  }
  await login();
  console.log('... OTP submitted');
  await eventually(() => evaluate(`location.pathname === '/workplaces' && document.body.innerText.includes('My Workplaces')`));
  assert.equal(await evaluate('location.search'), '?tab=active'); report.scenarios.push({ name: 'protected destination -> OTP -> destination and query', passed: true });
  console.log('... login preserved protected destination + query');
  await cdp('Page.reload'); await eventually(() => evaluate(`document.body.innerText.includes('My Workplaces')`)); report.scenarios.push({ name: 'refresh authenticated protected route', passed: true });
  console.log('... refresh ok');
  await navigate('/', 'Welcome back'); await eventually(() => evaluate(`location.pathname === '/home'`)); report.scenarios.push({ name: 'authenticated root -> home', passed: true });
  console.log('... authenticated root -> home ok');
  await cdp('Network.clearBrowserCookies'); await evaluate('localStorage.clear()');
  await navigate('/login', 'Welcome back'); await login(); await eventually(() => evaluate(`location.pathname === '/home'`)); report.scenarios.push({ name: 'direct login -> home', passed: true });
  console.log('... direct login -> home ok');
  databaseFailure = true; await navigate('/workplaces', 'We couldn'); report.scenarios.push({ name: 'query failure -> retry UI', passed: true }); databaseFailure = false;
  console.log('... query failure -> retry UI ok');
  await evaluate(`document.querySelector('main button').click()`);
  try {
    await eventually(() => evaluate(`document.body.innerText.includes('My Workplaces')`));
  } catch (e) {
    const state = await evaluate(`({ href: location.href, text: (document.body && document.body.innerText || '').slice(0, 400) })`).catch(err => ({ evaluateError: err.message }));
    console.error('retry-after-query-recovery failed; page state:', JSON.stringify(state));
    throw e;
  }
  report.scenarios.push({ name: 'retry after query recovery', passed: true });
  console.log('PASS browser auth and failure scenarios');
})().catch(error => { report.failure = error.stack; console.error(error); process.exitCode = 1; }).finally(() => {
  socket?.close(); stop(browser); stop(next); mock.close();
  fs.writeFileSync(path.join(temp, 'report.json'), JSON.stringify(report, null, 2));
  console.log(`QA report: ${path.join(temp, 'report.json')}`);
});
