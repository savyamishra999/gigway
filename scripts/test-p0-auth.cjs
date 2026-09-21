const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const ts = require('typescript');
const React = require('react');
const { renderToStaticMarkup } = require('react-dom/server');

function load(file, dependencies = {}, globals = {}) {
  const module = { exports: {} };
  const code = ts.transpileModule(fs.readFileSync(file, 'utf8'), { compilerOptions: {
    module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX, esModuleInterop: true,
  } }).outputText;
  vm.runInNewContext(code, {
    module, exports: module.exports, URL, URLSearchParams, Headers, Request, Response, AbortController,
    setTimeout, clearTimeout, console, process: { env: { NEXT_PUBLIC_SUPABASE_URL: 'https://audit.invalid', NEXT_PUBLIC_SUPABASE_ANON_KEY: 'dummy' } },
    require: name => { if (name in dependencies) return dependencies[name]; if (name === 'react/jsx-runtime') return require(name); throw Error(`Unexpected dependency: ${name}`); },
    ...globals,
  });
  return module.exports;
}
const destination = load('lib/auth/return-to.ts');
const asyncTools = load('lib/async.ts');
const redirect = url => { throw Error(`redirect:${url}`); };
let passed = 0;
async function check(name, operation) { await operation(); console.log(`PASS ${name}`); passed++; }
function query(result) { return new Proxy({}, { get: (_, key) => key === 'then' ? (ok, bad) => Promise.resolve(result).then(ok, bad) : () => query(result) }); }

(async () => {
  await check('safe destinations retain query/hash; invalid origins, controls, encodings, and auth trampolines rejected', () => {
    for (const value of ['/workplaces', '/u/name?section=jobs&page=2#workplace-sections', '/jobs?q=hello%20world', '/']) assert.equal(destination.safeReturnTo(value), value);
    for (const value of [undefined, {}, '', 'https://evil.example', '//evil.example', 'javascript:alert(1)', 'data:text/html,a', '/\\evil.example', '/\t/evil.example', '/\n/evil.example', '/%09/evil.example', '/%2f/evil.example', '/%255c/evil.example', '/login', '/auth/callback?next=/workplaces', '/onboarding', '/profile/complete', '/x/../login']) assert.equal(destination.safeReturnTo(value), '/home', String(value));
    assert.equal(new URL(destination.loginHref('/workplaces?tab=active'), 'https://gigway.invalid').searchParams.get('next'), '/workplaces?tab=active');
    assert.equal(destination.completionHref('/workplaces'), '/profile/complete?next=%2Fworkplaces');
    assert.equal(destination.authenticatedRootDestination('/', true), '/auth/post-login');
    assert.equal(destination.authenticatedRootDestination('/', false), null);
    assert.equal(destination.authenticatedRootDestination('/u/member', true), null);
  });
  await check('post-login default, next, onboarding, missing session, and profile failure have deterministic outcomes', async () => {
    let user = { id: 'viewer', email: 'viewer@example.invalid' }, profile = { profile_completed: true, username: 'viewer' }, error = null;
    const page = load('app/auth/post-login/page.tsx', {
      'next/navigation': { redirect }, '@/lib/auth/return-to': destination,
      '@/lib/auth/server': { getViewer: async () => user },
      '@/lib/supabase/server': { createClient: async () => ({ from: () => query({ data: profile, error }) }) },
    }).default;
    const render = next => page({ searchParams: Promise.resolve({ next }) });
    await assert.rejects(render(), /redirect:\/home$/);
    await assert.rejects(render('/workplaces?tab=active'), /redirect:\/workplaces\?tab=active$/);
    profile = null;
    await assert.rejects(render('/workplaces'), /redirect:\/profile\/complete\?next=%2Fworkplaces$/);
    error = { message: 'network' };
    await assert.rejects(render('/workplaces'), /profile could not be checked/);
    user = null;
    await assert.rejects(render('/workplaces'), /redirect:\/login\?next=%2Fworkplaces$/);
  });
  await check('request destination survives query strings and cannot be supplied as an external URL', async () => {
    let path = '/tools/opportunity-match?job=abc';
    const auth = load('lib/auth/server.ts', {
      'server-only': {}, react: { cache: fn => fn }, 'next/headers': { headers: async () => new Headers({ 'x-gigway-destination': path }) },
      '@/lib/supabase/server': {}, '@/lib/async': asyncTools, './return-to': destination,
    });
    assert.equal(await auth.loginForCurrent(), '/login?next=%2Ftools%2Fopportunity-match%3Fjob%3Dabc');
    path = 'https://evil.example'; assert.equal(await auth.loginForCurrent(), '/login?next=%2Fhome');
  });
  await check('middleware owns root auth decision; protected next and refreshed cookies survive redirects and downstream rendering', async () => {
    const { NextRequest, NextResponse } = require('next/server');
    let calls = 0, session = null, fail = false;
    const middleware = load('middleware.ts', {
      'next/server': { NextRequest, NextResponse }, '@/lib/auth/return-to': destination, '@/lib/async': asyncTools,
      '@supabase/ssr': { createServerClient: (_, __, options) => {
        calls++; return { auth: { getSession: async () => {
          if (fail) throw Error('offline');
          options.cookies.setAll([{ name: 'audit-session', value: 'refreshed', options: { path: '/', httpOnly: true } }]);
          return { data: { session }, error: null };
        } } };
      } },
    }).middleware;
    for (const path of ['/login', '/u/person', '/social/vijox']) await middleware(new NextRequest(`https://gigway.invalid${path}`));
    assert.equal(calls, 0);
    let response = await middleware(new NextRequest('https://gigway.invalid/'));
    assert.equal(response.headers.get('location'), null);
    assert.equal(calls, 1);
    session = { user: { id: 'viewer' } };
    response = await middleware(new NextRequest('https://gigway.invalid/'));
    assert.equal(new URL(response.headers.get('location')).pathname, '/auth/post-login');
    assert.equal(response.cookies.get('audit-session').value, 'refreshed');
    session = null;
    response = await middleware(new NextRequest('https://gigway.invalid/workplaces?tab=active'));
    assert.equal(new URL(response.headers.get('location')).searchParams.get('next'), '/workplaces?tab=active');
    assert.equal(response.cookies.get('audit-session').value, 'refreshed');
    session = { user: { id: 'viewer' } };
    response = await middleware(new NextRequest('https://gigway.invalid/workplaces?tab=active', { headers: { 'x-gigway-destination': 'https://evil.example' } }));
    assert.equal(response.headers.get('x-middleware-request-x-gigway-destination'), '/workplaces?tab=active');
    assert.match(response.headers.get('x-middleware-request-cookie'), /audit-session=refreshed/);
    fail = true; response = await middleware(new NextRequest('https://gigway.invalid/workplaces'));
    assert.equal(response.status, 503); assert.equal(response.headers.get('cache-control'), 'no-store');
  });
  await check('rejected and never-settling async work reaches terminal state', async () => {
    let loading = true, error = false;
    try { await asyncTools.withDeadline(new Promise(() => {}), 5); } catch { error = true; } finally { loading = false; }
    assert.equal(error, true); assert.equal(loading, false);
    await assert.rejects(asyncTools.withDeadline(Promise.reject(Error('offline')), 5), /offline/);
    assert.equal(await asyncTools.withDeadline(Promise.resolve('done'), 5), 'done');
  });
  await check('JSON deadline includes stalled response body and respects upstream abort', async () => {
    const transport = load('lib/async.ts', {}, {
      setTimeout: (fn, ms) => setTimeout(fn, Math.min(ms, 5)),
      fetch: async (_, { signal }) => ({ headers: new Headers({ 'content-type': 'application/json' }), text: () => new Promise((resolve, reject) => {
        if (signal.aborted) reject(Error('aborted'));
        signal.addEventListener('abort', () => reject(Error('aborted')), { once: true });
      }) }),
    });
    await assert.rejects(transport.boundedFetch('https://audit.invalid'), /aborted/);
    const controller = new AbortController(); controller.abort();
    await assert.rejects(transport.boundedFetch('https://audit.invalid', { signal: controller.signal }), /aborted/);
  });
  await check('landing component is guest-only and returns Hero without auth or database work', () => {
    let calls = 0;
    const noop = () => null;
    const dependencies = { react: React, 'next/navigation': { redirect }, '@/lib/async': asyncTools,
      '@/lib/supabase/public': { createPublicClient: () => { calls++; throw Error('must not block shell'); } },
      '@/components/layout/SectionStatus': { SectionLoading: noop, SectionUnavailable: noop },
    };
    for (const name of ['Hero','LiveStats','ProfessionalIdentity','WhatYouCanDo','RealOpportunities','FeaturedFreelancers','OrganizationsPreview','TrustVerification','HomePricing','WhyGigway','FinalCTA']) dependencies[`@/components/home/${name}`] = { default: name === 'Hero' ? () => React.createElement('h1', null, 'Meaningful landing hero') : noop, __esModule: true };
    const page = load('app/page.tsx', dependencies).default();
    assert.equal(typeof page.then, 'undefined'); assert.equal(calls, 0);
    const children = React.Children.toArray(page.props.children);
    assert.match(renderToStaticMarkup(children[0]), /Meaningful landing hero/);
    assert.ok(children.filter(child => child.type === React.Suspense).length >= 4);
  });
  await check('authenticated browser session cannot coexist with a root landing response', async () => {
    // The browser navbar and server share Supabase SSR cookies. Model the
    // production hybrid explicitly: the browser sees a user and the root request
    // carries that session. Root middleware must redirect before app/page renders.
    const browserUser = { id: 'viewer' };
    let pageRendered = false;
    const { NextRequest, NextResponse } = require('next/server');
    const middleware = load('middleware.ts', {
      'next/server': { NextRequest, NextResponse }, '@/lib/auth/return-to': destination, '@/lib/async': asyncTools,
      '@supabase/ssr': { createServerClient: () => ({ auth: { getSession: async () => ({ data: { session: { user: browserUser } }, error: null }) } }) },
    }).middleware;
    const response = await middleware(new NextRequest('https://gigway.invalid/', { headers: { cookie: 'sb-project-auth-token=fixture' } }));
    if (!response.headers.get('location')) pageRendered = true;
    assert.equal(browserUser.id, 'viewer');
    assert.equal(pageRendered, false);
    assert.equal(new URL(response.headers.get('location')).pathname, '/auth/post-login');
    // Cached navigation HTML can bypass middleware. The authenticated navbar
    // uses the same decision and replaces the document as reconciliation.
    assert.equal(destination.authenticatedRootDestination('/', !!browserUser), '/auth/post-login');
    const navbar = fs.readFileSync('components/layout/ModernNavbar.tsx', 'utf8');
    assert.match(navbar, /authenticatedRootDestination\(pathname, !!user\)/);
    assert.match(navbar, /window\.location\.replace\(rootDestination\)/);
  });
  await check('Google login rejection clears actual component loading state and exposes an error', async () => {
    const states = []; let cursor = 0;
    const hooks = { ...React, useEffect: () => {}, useState: initial => { const i = cursor++; states[i] = initial; return [initial, value => { states[i] = value; }]; } };
    const form = load('app/login/page.tsx', {
      react: hooks, 'next/navigation': { useSearchParams: () => new URLSearchParams('next=/workplaces') },
      '@/lib/async': asyncTools, '@/lib/auth/return-to': destination,
      'next/image': { __esModule: true, default: () => null }, 'next/link': { __esModule: true, default: () => null },
      'lucide-react': new Proxy({}, { get: () => () => null }), '@/lib/utils': { cn: () => '' },
      '@/lib/supabase/client': { createClient: () => ({ auth: { signInWithOAuth: async () => { throw Error('network failed'); } } }) },
    }, { window: { location: { origin: 'https://gigway.invalid', assign: () => { throw Error('must not navigate'); } } } }).default;
    const wrapper = form(), tree = wrapper.props.children.type();
    function find(node) { if (!React.isValidElement(node)) return null; if (node.type === 'button' && node.props.onClick) return node; for (const child of React.Children.toArray(node.props.children)) { const found = find(child); if (found) return found; } return null; }
    await find(tree).props.onClick();
    assert.equal(states[3], false); assert.equal(states[5].type, 'error');
  });
  await check('explicit Google account switching requests the chooser and preserves account isolation', () => {
    const login = fs.readFileSync('app/login/page.tsx', 'utf8');
    const callback = fs.readFileSync('app/auth/callback/route.ts', 'utf8');
    assert.match(login, /queryParams:\s*switchAccount \? \{ prompt: "select_account" \} : undefined/);
    assert.match(login, /Continue as current user/);
    assert.match(login, /Sign in with another Google account/);
    assert.match(callback, /exchangeCodeForSession\(code\)/);
    assert.match(callback, /onConflict: "id", ignoreDuplicates: true/);
    assert.doesNotMatch(callback, /update\([^)]*user\.user_metadata/);
    assert.match(callback, /\/auth\/post-login/);
  });
  await check('new identity onboarding keeps photo optional and never auto-overwrites a returning avatar', () => {
    const onboarding = fs.readFileSync('components/identity/IdentityOnboarding.tsx', 'utf8');
    const callback = fs.readFileSync('app/auth/callback/route.ts', 'utf8');
    const complete = fs.readFileSync('app/api/identity/complete/route.ts', 'utf8');
    const googleAvatar = fs.readFileSync('app/api/identity/google-avatar/route.ts', 'utf8');
    const homePrompt = fs.readFileSync('components/home/IdentityCompletionPrompt.tsx', 'utf8');
    assert.match(onboarding, /Skip photo and enter GigWay/);
    assert.match(onboarding, /router\.replace\(next \|\| "\/home"\)/);
    assert.match(onboarding, /Use Google Photo/);
    assert.doesNotMatch(complete, /completingSetup === true && modes\.length === 0/);
    assert.match(callback, /avatar_url:\s+null/);
    assert.match(googleAvatar, /if \(profile\?\.avatar_url\).*existing GigWay photo was kept/);
    assert.match(googleAvatar, /storage\.from\("avatars"\)\.upload/);
    assert.doesNotMatch(homePrompt, /67% complete/);
    assert.match(homePrompt, /professionalMilestones/);
    assert.match(homePrompt, /if \(error \|\| !data \|\| !data\.full_name \|\| !data\.username\)/);
    assert.match(homePrompt, /Next recommended action/);
  });
  await check('mobile Home constrains wide feed media to the viewport', () => {
    const home = fs.readFileSync('app/home/page.tsx', 'utf8');
    const feed = fs.readFileSync('components/social/SocialHomeFeed.tsx', 'utf8');
    const postText = fs.readFileSync('components/social/PostText.tsx', 'utf8');
    assert.match(home, /grid-cols-\[minmax\(0,1fr\)\]/);
    assert.match(home, /<div className="w-full min-w-0">/);
    assert.match(feed, /w-full min-w-0 max-w-full overflow-hidden border/);
    assert.match(feed, /w-full min-w-0 max-w-3xl overflow-x-hidden/);
    assert.match(feed, /block h-auto max-h-\[400px\] w-full max-w-full/);
    assert.match(postText, /\[overflow-wrap:anywhere\]/);
  });
  console.log(`${passed} P0 check groups passed. Isolated/mocked; no live auth, database, or browser.`);
})().catch(error => { console.error(error); process.exitCode = 1; });
