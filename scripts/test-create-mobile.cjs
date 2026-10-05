// Actual components and loaders, isolated I/O. No live session/database claims.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const React = require('react');
const { moduleAt, walk, def } = require('./test-makkhan-pass2.cjs');
const text = n => typeof n === 'string' ? n : Array.isArray(n) ? n.map(text).join(' ') : n?.props ? text(n.props.children) : '';
const hooks = { ...React, useState: v => [typeof v === 'function' ? v() : v, () => {}], useEffect() {}, useRef: v => ({ current: v }), useMemo: fn => fn() };
const ready = { organizations: [{ id: 'org', name: 'Workplace' }], loading: false, error: '', retry() {} };
function choices(query = '', workplaces = ready, identity = { user: { id: 'A' }, profile: { full_name: 'Mohit', username: 'muh21' } }) {
  return moduleAt('components/create/CreateChoices.tsx', {
    'next/link': def('a'), 'next/navigation': { useSearchParams: () => new URLSearchParams(query) },
    '@/components/layout/AuthUiProvider': { useAuthUi: () => identity },
    './useCreateWorkplaces': { useCreateWorkplaces: () => workplaces },
  }).default({ viewerId: 'A' });
}
function composer(query = '', workplaces = ready) {
  let submitted = 0;
  const tree = moduleAt('components/social/CreatePostComposer.tsx', {
    react: hooks, 'next/dynamic': def(() => () => null),
    'next/navigation': { useRouter: () => ({ back() {}, push() {} }), useSearchParams: () => new URLSearchParams(query) },
    'lucide-react': new Proxy({}, { get: () => () => null }),
    '@/components/create/useCreateWorkplaces': { useCreateWorkplaces: () => workplaces },
    '@/components/social/MentionPicker': def(() => null), '@/components/social/VijoxCircularProgress': def(() => null),
    '@/lib/social/mentions': { findActiveMention: () => null }, '@/lib/social/content-domain': { MAX_JOX_CAPTION_LENGTH: 100 },
    '@/lib/supabase/client': { createClient() { throw Error('unexpected browser auth'); } },
  }, { URL, fetch: () => { submitted++; throw Error('unexpected publish'); } }).default({ profile: { id: 'A', name: 'Mohit' }, organizations: [], loadWorkplaces: true });
  return { tree, submitted: () => submitted };
}
async function run() {
  let count = 0;
  const check = async (name, fn) => { await fn(); count++; console.log('PASS', name); };
  await check('Create shell needs one shared viewer and no profile or Workplace query', async () => {
    let auth = 0;
    const page = moduleAt('app/create/page.tsx', {
      '@/lib/auth/server': { getViewer: async () => { auth++; return { id: 'A' }; }, loginForCurrent: async () => '/login?next=%2Fcreate' },
      'next/navigation': { redirect: value => { throw Error(value); } }, '@/components/create/CreateChoices': def('choices'),
    }).default;
    assert.equal((await page()).props.viewerId, 'A'); assert.equal(auth, 1);
    const guest = moduleAt('app/create/page.tsx', {
      '@/lib/auth/server': { getViewer: async () => null, loginForCurrent: async () => '/login?next=%2Fcreate' },
      'next/navigation': { redirect: value => { throw Error(value); } }, '@/components/create/CreateChoices': def('choices'),
    }).default;
    await assert.rejects(guest(), /\/login\?next=%2Fcreate/);
  });
  await check('four actions survive pending/failed Workplaces and unavailable display identity', () => {
    for (const state of [ready, { ...ready, organizations: [], loading: true }, { ...ready, organizations: [], error: 'Failed' }]) {
      const tree = choices('', state, { user: null, profile: null });
      assert.deepEqual(walk(tree, n => n.props?.['data-create-action'] === true).map(n => n.props.href), ['/social/create','/jobs/new','/projects/new','/gigs/new']);
      assert.match(walk(tree, n => n.props?.['data-create-actions'] === true)[0].props.className, /grid-cols-1.*sm:grid-cols-2/);
      assert.doesNotMatch(text(tree), /jox|glimps/i);
    }
  });
  await check('composer keeps profile requirements; query errors do not redirect to onboarding', async () => {
    for (const outcome of ['ok','missing','error']) {
      let profiles=0;
      const q=new Proxy({}, {get:(_,key)=>key==='then'?(ok,bad)=>Promise.resolve({data:outcome==='missing'?null:{id:'A',full_name:'Mohit'},error:outcome==='error'?Error('offline'):null}).then(ok,bad):()=>q});
      const page=moduleAt('app/social/create/page.tsx', {
        '@/lib/auth/server':{getViewer:async()=>({id:'A'}),completionForCurrent:async()=>'/profile/complete',loginForCurrent:async()=>'/login'},
        'next/navigation':{redirect:p=>{throw Error('redirect:'+p)}},
        '@/lib/supabase/server':{createClient:async()=>({from:table=>{assert.equal(table,'profiles');profiles++;return q}})},
        '@/lib/async':{withDeadline:async p=>await p,AUTH_CHECK_TIMEOUT_MS:15000},
        '@/components/social/CreatePostComposer':def('composer'),
      }).default;
      if(outcome==='ok')assert.equal(walk(await page(),n=>n.type==='composer')[0].props.loadWorkplaces,true);
      else await assert.rejects(page(),outcome==='missing'?/redirect:\/profile\/complete/:/profile could not be loaded/);
      assert.equal(profiles,1);
    }
  });
  await check('Professional/Workplace selection preserves verified actor; unknown actor has no actions', () => {
    assert.equal(walk(choices('organization=org'), n => n.props?.['data-create-action']).length, 2);
    assert.ok(walk(choices('organization=org'), n => n.props?.href === '/jobs/new?organization=org').length);
    assert.equal(walk(choices('organization=other'), n => n.props?.['data-create-action']).length, 0);
    assert.equal(walk(choices('personal=1'), n => n.props?.['data-create-action']).length, 4);
  });
  await check('normal composer exposes Text Photo Video PDF together, with no legacy actions', async () => {
    const { tree } = composer();
    const toolbar = walk(tree, n => n.props?.['aria-label'] === 'Add to your GigThought')[0];
    assert.deepEqual(walk(toolbar, n => n.type === 'button').map(n=>text(n).trim()), ['Text','Photo','Video','PDF file']);
    assert.doesNotMatch(text(tree), /jox|glimps/i);
    assert.equal(walk(tree, n => n.type === 'textarea')[0].props.rows, 4);
    assert.equal(walk(tree, n => n.type === 'button' && text(n).trim() === 'Post')[0].props.disabled, false);
  });
  await check('unverified Workplace cannot publish or silently become personal', async () => {
    const f = composer('organization=unknown');
    const button = walk(f.tree, n => n.type === 'button' && text(n).trim() === 'Post')[0];
    assert.equal(button.props.disabled, true); await button.props.onClick(); assert.equal(f.submitted(), 0);
    assert.equal(walk(f.tree, n => n.type === 'select')[0].props.value, 'unknown');
  });
  await check('mobile plus has one Link navigation and no click router push', () => {
    const source = fs.readFileSync('components/layout/ModernNavbar.tsx', 'utf8');
    const section = source.slice(source.indexOf('{MOBILE_TABS.map'));
    assert.match(section, /<Link prefetch=\{false\} key=\{item.label\} href=\{item.href\}/);
    assert.doesNotMatch(section, /onClick|router.push/);
    assert.equal((source.match(/href: "\/create", label: "Create"/g) || []).length, 1);
  });
  await check('Workplace API uses one scoped join, no profile query, and finite error response', async () => {
    const { NextResponse } = require('next/server');
    for (const failure of [false, true, 'hang', 'guest']) {
      const calls = [];
      const q = new Proxy({}, { get: (_, key) => key === 'then' ? (ok, bad) => failure === 'hang' ? new Promise(() => {}) : Promise.resolve({ data: [{ organizations: { id:'org', name:'Org', logo_url:null } }], error: failure === true ? Error('offline') : null }).then(ok,bad) : (...args) => { calls.push([key,...args]); return q; } });
      const api = moduleAt('app/api/create/workplaces/route.ts', {
        'next/server': { NextResponse }, '@/lib/auth/server': { getViewer: async () => failure === 'guest' ? null : { id:'A' } },
        '@/lib/supabase/server': { createClient: async () => ({ from: name => { calls.push(['from',name]); return q; } }) },
        '@/lib/async': { withDeadline: p => Promise.race([Promise.resolve(p), new Promise((_,reject) => setTimeout(() => reject(Error('timeout')),10))]) },
      }, { AbortController }).GET;
      const response = await api();
      assert.equal(response.status, failure === 'guest' ? 401 : failure ? 503 : 200);
      if (failure !== 'guest') {
        assert.deepEqual(calls.filter(c=>c[0]==='from'), [['from','organization_members']]);
        assert.ok(calls.some(c=>c[0]==='eq'&&c[1]==='profile_id'&&c[2]==='A'));
        assert.ok(calls.some(c=>c[0]==='eq'&&c[1]==='status'&&c[2]==='active'));
        assert.deepEqual(Array.from(calls.find(c=>c[0]==='in')[2]), ['owner','admin']);
      }
    }
  });
  await check('Workplace hook aborts a stalled request, retries, and coalesces StrictMode', async () => {
    let states = [], index = 0, effect, requests = 0, fail = true;
    const hook = moduleAt('components/create/useCreateWorkplaces.ts', {
      react: { useState: initial => { const i=index++; states[i] ??= initial; return [states[i], value => states[i]=typeof value==='function'?value(states[i]):value]; }, useEffect: fn => { effect=fn; } },
      '@/lib/async': { boundedFetch: async (_, {signal}) => { requests++; if (fail) return new Promise((_,reject)=>signal.addEventListener('abort',()=>reject(Error('timeout')))); return { ok:true,json:async()=>({viewerId:'A',organizations:ready.organizations}) }; } },
    }, { AbortController, setTimeout: (fn,ms)=>setTimeout(fn,ms?10:0) }).useCreateWorkplaces;
    const render = () => { index=0; return hook('A'); };
    render(); const first=effect(); first(); render(); const cleanup=effect();
    await new Promise(r=>setTimeout(r,30)); assert.equal(requests,1); assert.equal(render().loading,false); assert.ok(render().error);
    render().retry(); assert.equal(states[1],1); cleanup(); fail=false; render(); const stop=effect();
    await new Promise(r=>setTimeout(r,20)); assert.equal(render().organizations.length,1); stop();
  });
  console.log(`${count} mobile Create groups PASS; synthetic.`);
}
if (require.main === module) run().catch(e => { console.error(e); process.exitCode=1; });
module.exports = { choices, composer, text, run };
