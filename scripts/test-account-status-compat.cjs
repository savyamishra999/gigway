// Synthetic local transport only; never contacts Supabase.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const ts = require('typescript');
function load(file, deps, env = {}) {
  const module = { exports: {} };
  vm.runInNewContext(ts.transpileModule(fs.readFileSync(file, 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  }).outputText, { module, exports: module.exports, URL, Request, Response,
    process: { env }, require: name => { assert.ok(name in deps, name); return deps[name]; } });
  return module.exports;
}
const { mutationGuard } = load('lib/supabase/mutation-guard.ts', {});
const missing = { data: null, error: { code: 'PGRST205', message: 'Missing view' } };
const ok = banned => ({ data: { is_banned: banned }, error: null });
function fixture({ status = missing, legacy = ok(false), user = { id: 'verified-A' }, authError = null } = {}) {
  const calls = []; let sent = 0;
  const db = { auth: { getUser: async () => ({ data: { user }, error: authError }) },
    from: table => ({ select: fields => ({ eq: (field, id) => ({ maybeSingle: async () => {
      assert.equal(table, 'own_profiles'); assert.equal(fields, 'is_banned');
      assert.equal(field, 'id'); assert.equal(id, user.id); return status;
    } }) }) }) };
  const fetch = mutationGuard(db, async () => { sent++; return new Response('ok'); }, async id => {
    calls.push(id); return typeof legacy === 'function' ? legacy() : legacy;
  });
  return { db, calls, sent: () => sent, write: () => fetch('https://local.invalid/rest/v1/posts', { method: 'POST' }) };
}
(async () => {
  const allowed = fixture(); assert.equal((await allowed.db.auth.getUser()).data.user.id, 'verified-A');
  assert.equal((await allowed.write()).status, 200); assert.equal(allowed.sent(), 1);
  assert.deepEqual(allowed.calls, ['verified-A', 'verified-A']);
  for (const legacy of [ok(true), { data: null, error: { message: 'unavailable' } }, { data: {}, error: null }]) {
    const f = fixture({ legacy }); assert.equal((await f.db.auth.getUser()).data.user, null);
    assert.ok((await f.write()).status >= 400); assert.equal(f.sent(), 0);
  }
  for (const code of ['42501', 'PGRST301', 'TIMEOUT']) {
    const f = fixture({ status: { data: null, error: { code, message: code } } });
    assert.equal((await f.write()).status, 503); assert.deepEqual(f.calls, []);
  }
  for (const args of [{ user: null }, { authError: { message: 'invalid token' } }]) {
    const f = fixture(args); assert.equal((await f.write()).status, 401); assert.deepEqual(f.calls, []);
  }
  const migrated = fixture({ status: ok(false) }); assert.equal((await migrated.write()).status, 200);
  assert.deepEqual(migrated.calls, []);
  let banned = false; const fresh = fixture({ legacy: () => ok(banned) });
  await fresh.db.auth.getUser(); banned = true; assert.equal((await fresh.write()).status, 403);
  assert.equal(fresh.sent(), 0);
  const b = fixture({ user: { id: 'verified-B' } }); await b.db.auth.getUser(); assert.deepEqual(b.calls, ['verified-B']);
  const trace = []; const boundedFetch = () => {};
  const deps = { 'server-only': {}, '@/lib/async': { boundedFetch }, '@supabase/supabase-js': {
    createClient(url, key, options) {
      trace.push([url, key]); assert.equal(options.auth.persistSession, false);
      assert.equal(options.auth.autoRefreshToken, false); assert.equal(options.auth.detectSessionInUrl, false);
      assert.equal(options.global.fetch, boundedFetch);
      return { from: table => ({ select: fields => ({ eq: (column, id) => ({ maybeSingle: async () => {
        trace.push([table, fields, column, id]); return ok(false);
      } }) }) }) };
    },
  } };
  const helper = load('lib/supabase/account-status.ts', deps, { NEXT_PUBLIC_SUPABASE_URL: 'https://local.invalid', SUPABASE_SERVICE_ROLE_KEY: 'synthetic' });
  await helper.readLegacyAccountStatus('verified-A');
  assert.deepEqual(trace, [['https://local.invalid', 'synthetic'], ['profiles', 'is_banned', 'id', 'verified-A']]);
  const noKey = load('lib/supabase/account-status.ts', deps);
  assert.ok((await noKey.readLegacyAccountStatus('verified-A')).error); assert.equal(trace.length, 2);
  const login = fixture();
  const { default: postLogin } = load('app/auth/post-login/page.tsx', {
    'next/navigation': { redirect: path => { throw new Error('REDIRECT:' + path); } },
    '@/lib/supabase/server': { createClient: async () => ({ from: () => ({ select: () => ({ eq: () => ({ maybeSingle: async () => ({ data: { profile_completed: true, username: 'fixture' }, error: null }) }) }) }) }) },
    '@/lib/auth/server': { getViewer: async () => (await login.db.auth.getUser()).data.user },
    '@/lib/auth/return-to': { safeReturnTo: (_, fallback) => fallback, loginHref: () => '/login' },
  });
  await assert.rejects(postLogin({ searchParams: Promise.resolve({}) }), /REDIRECT:\/home/);
  console.log('PASS account status compatibility: verified identity, fail-closed errors, fresh bans, fixed server-only read, post-login redirect');
})().catch(error => { console.error(error); process.exitCode = 1; });
