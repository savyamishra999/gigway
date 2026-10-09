// Execute actual navbar markup and route selection with deterministic identity.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const React = require('react');
const { moduleAt, walk, def } = require('./test-makkhan-pass2.cjs');
const hooks = { ...React, useState: v => [v, () => {}], useEffect() {} };
function navbar(pathname, signedIn = true) {
  let pushes = 0;
  const loaded = moduleAt('components/layout/ModernNavbar.tsx', {
    react: hooks, 'next/image': def('img'), 'next/link': def('a'),
    'next/navigation': { usePathname: () => pathname, useRouter: () => ({ push() { pushes++; } }) },
    'lucide-react': new Proxy({}, { get: (_, name) => name }),
    '@/lib/auth/return-to': { authenticatedRootDestination: () => null, loginHref: () => '/login' },
    '@/lib/async': {}, '@/lib/supabase/client': { createClient: () => ({}) },
    '@/components/layout/AuthUiProvider': { useAuthUi: () => ({ user: signedIn ? { id: 'qa' } : null, profile: null }) },
    '@/components/moments/MomentExperience': { MomentHeader: () => null },
  });
  const tree = loaded.default({ moment: null });
  return { tree, active: loaded.isMobileTabActive, pushes: () => pushes };
}
const expected = ['/home', '/network', '/create', '/work', '/profile'];
for (const route of [...expected, '/social/create', '/jobs/new', '/projects/new', '/gigs/new', '/jobs/abc', '/create-other']) {
  const f = navbar(route);
  const nav = walk(f.tree, n => n.props?.['data-mobile-navigation'] !== undefined)[0];
  const tabs = walk(nav, n => n.props?.href);
  const desktop = walk(f.tree, n => n.type === 'nav' && n.props?.className?.includes('hidden lg:flex'))[0];
  assert.deepEqual(walk(desktop, n => n.props?.href).map(n => n.props.href), ['/home', '/network', '/work']);
  assert.deepEqual(tabs.map(n => n.props.href), expected);
  assert.deepEqual(tabs.map(n => n.props['aria-label']), ['Home', 'Network', 'Create', 'Work', 'Account']);
  assert.ok(tabs.every(n => !n.props.onClick && n.props.prefetch === false));
  assert.equal(f.pushes(), 0);
  assert.match(nav.props.className, /grid-cols-5.*safe-area-inset-bottom.*lg:hidden/);
  assert.match(nav.props.className, /z-30/);
  const circle = walk(nav, n => n.props?.['data-mobile-create'] !== undefined)[0];
  assert.match(circle.props.className, /-top-4.*h-14 w-14.*rounded-full/);
  assert.equal(tabs[2].props['aria-current'], f.active(route, '/create') ? 'page' : undefined);
  assert.ok(tabs.every(n => /focus-visible:ring-2/.test(n.props.className)));
  assert.ok(tabs.filter(n => n.props['aria-current']).length <= 1);
}
const { active } = navbar('/create');
for (const route of ['/social/create', '/jobs/new', '/projects/new', '/gigs/new', '/create']) assert.equal(active(route, '/create'), true);
for (const route of ['/projects/project-id', '/gigs/gig-id', '/jobs/newspaper', '/social/glimps/create']) assert.equal(active(route, '/create'), false);
assert.equal(walk(navbar('/home', false).tree, n => n.props?.['data-mobile-navigation'] !== undefined).length, 0);
const guestDesktop = walk(navbar('/', false).tree, n => n.type === 'nav' && n.props?.className?.includes('hidden lg:flex'))[0];
assert.deepEqual(walk(guestDesktop, n => n.props?.href).map(n => n.props.href), ['/', '/network', '/work']);
const source = fs.readFileSync('components/layout/ModernNavbar.tsx', 'utf8');
assert.doesNotMatch(source.slice(source.indexOf('{MOBILE_TABS.map')), /router.push|onClick|Date.now|Math.random|innerWidth|localStorage|sessionStorage|navigator/);
assert.match(fs.readFileSync('app/layout.tsx', 'utf8'), /pb-\[calc\(6rem\+env\(safe-area-inset-bottom\)\)\] lg:pb-0/);
console.log('Part 5.3 actual navbar: order, routes, single Link path, labels, active boundaries, focus, CSS breakpoint and safe area PASS.');
