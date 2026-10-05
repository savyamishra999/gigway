// Actual components, loaders and routes with local fixtures. Never connects to Supabase.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const React = require('react');
const { moduleAt, fixture, walk, HomeModule, def, placeholder } = require('./test-makkhan-pass2.cjs');
const policy = moduleAt('lib/product-visibility.ts', {});
const source = file => fs.readFileSync(file, 'utf8');
const text = node => typeof node === 'string' ? node : Array.isArray(node) ? node.map(text).join(' ') : node?.props ? text(node.props.children) : '';
const noLegacy = tree => {
  assert.doesNotMatch(text(tree), /\b(?:jox|vijox|glimps)\b/i);
  assert.equal(walk(tree, n => /\/social\/(vijox|glimps)/.test(n.props?.href || '')).length, 0);
};
let groups = 0;
async function check(name, run) { await run(); groups++; console.log('PASS', name); }
function ui(file, overrides = {}, states = []) {
  let index = 0;
  const deps = Object.fromEntries([...source(file).matchAll(/from\s+["']([^"']+)["']/g)].map(x => [x[1], new Proxy(def(placeholder(x[1])), { get: (target,key) => key in target ? target[key] : placeholder(String(key)) })]));
  Object.assign(deps, {
    react: { useState: initial => [index < states.length ? states[index++] : (++index, typeof initial === 'function' ? initial() : initial), () => {}], useEffect() {}, useRef: value => ({ current: value }), useMemo: fn => fn(), useCallback: fn => fn },
    'next/link': def('a'), 'next/image': def('img'),
    'next/dynamic': def(() => placeholder('dynamic')),
    'next/navigation': { usePathname: () => '/home', useRouter: () => ({ push() {} }), useSearchParams: () => new URLSearchParams() },
    'lucide-react': new Proxy({}, { get: (_, name) => name === '__esModule' ? true : placeholder(String(name)) }),
    '@/lib/product-visibility': policy,
    ...overrides,
  });
  return moduleAt(file, deps, { URLSearchParams });
}
function database(records, viewer) {
  const calls = [], signed = [];
  const db = { auth: { getUser: async () => ({ data: { user: viewer ? { id: viewer } : null } }) }, from(table) {
    let filters = [], limit = Infinity, head = false;
    const q = {
      select(_, options) { head = !!options?.head; return q; },
      eq(k,v) { filters.push(r => r[k] === v); return q; }, in(k,v) { filters.push(r => v.includes(r[k])); return q; },
      order() { return q; }, limit(n) { limit = n; return q; }, or() { return q; }, ilike() { return q; }, is(k,v) { filters.push(r => (r[k] ?? null) === v); return q; },
      async maybeSingle() { const result = await q; return { ...result, data: result.data[0] || null }; },
      then(resolve) { const data = (records[table] || []).filter(r => filters.every(f => f(r))).slice(0,limit); calls.push({ table, ids: data.map(r => r.id), limit }); resolve({ data: head ? null : data, count: data.length, error: null }); },
    }; return q;
  }, storage: { from: () => ({ createSignedUrl: async path => { signed.push(path); return { data: { signedUrl: `signed:${path}` }, error: null }; } }) } };
  return { db, calls, signed };
}
const globals = { process: { env: { NODE_ENV: 'test', NEXT_PUBLIC_SUPABASE_URL: 'https://fixture.invalid', SUPABASE_SERVICE_ROLE_KEY: 'fixture' } }, Response, Headers };
function social(db) {
  return moduleAt('lib/social/server.ts', {
    '@supabase/supabase-js': { createClient: () => db }, '@/lib/supabase/server': { createClient: async () => db }, '@/lib/async': {},
    '@/lib/social/content-domain': moduleAt('lib/social/content-domain.ts', {}),
    '@/lib/social/vijox-timed-reactions': {}, '@/lib/social/gigthought': { validPostHighlights: () => [] },
  }, globals);
}
const base = { author_user_id: 'author', author_profile_id: 'author', author_organization_id: null, status: 'published', visibility: 'public', created_at: '2026-01-01', body: 'Update', edited_at: null };
const legacyRows = ['vijox', 'glimps'].flatMap(format => [
  { ...base, id: format, content_format: format },
  { ...base, id: `${format}-private`, content_format: format, visibility: 'followers' },
  { ...base, id: `${format}-org`, content_format: format, author_profile_id: null, author_organization_id: 'org', visibility: 'followers' },
  { ...base, id: `${format}-draft`, content_format: format, status: 'hidden' },
]);
const records = {
  posts: [{ ...base, id: 'standard', content_format: 'standard' }, ...legacyRows],
  profiles: [{ id: 'author', username: 'author', full_name: 'Author' }], organizations: [{ id: 'org', name: 'Workplace', username: 'workplace' }],
  profile_follows: [{ follower_user_id: 'follower', followed_profile_id: 'author' }],
  organization_follows: [{ follower_user_id: 'follower', organization_id: 'org' }],
  post_media: legacyRows.map(p => ({ id: `m-${p.id}`, post_id: p.id, media_type: p.content_format === 'vijox' ? 'audio' : 'video', storage_path: `${p.id}/media`, mime_type: p.content_format === 'vijox' ? 'audio/webm' : 'video/mp4', file_name: 'media', sort_order: 0 })),
  post_reposts: legacyRows.map(p => ({ post_id: p.id, user_id: 'author', created_at: p.created_at })),
};
(async () => {
  await check('central policy hides both products and supports independent relaunch', () => {
    assert.deepEqual([...policy.currentProductFormats()], ['standard']);
    for (const key of ['jox', 'vijox', 'glimps']) assert.equal(policy.isCurrentProductCategory(key), false);
    policy.productVisibility.joxCurrentProduct = true;
    assert.deepEqual([...policy.currentProductFormats()], ['standard', 'vijox']);
    policy.productVisibility.joxCurrentProduct = false;
  });
  await check('desktop, guest/mobile drawer and authenticated bottom navigation have no legacy links', () => {
    for (const user of [null, { id: 'viewer' }]) {
      const nav = ui('components/layout/ModernNavbar.tsx', {
        '@/lib/supabase/client': { createClient: () => ({}) }, '@/components/layout/AuthUiProvider': { useAuthUi: () => ({ user, profile: null }) },
        '@/lib/auth/return-to': moduleAt('lib/auth/return-to.ts', {}, { URL, URLSearchParams }),
      }, [true]).default({ moment: null });
      noLegacy(nav);
      const navs = walk(nav, n => n.type === 'nav');
      assert.deepEqual(walk(navs[0], n => n.type === 'a').map(n => text(n)), ['Home', 'Network', 'Work']);
      if (user) assert.deepEqual(walk(navs[1], n => n.type === 'a').map(n => text(n).trim()), ['Home', 'Network', 'Create', 'Work', 'Account']);
    }
  });
  await check('Home omits legacy boundaries entirely; all five retained loaders run', async () => {
    const f = fixture(), tree = await f.page.default(), nodes = walk(tree, n => n.type === HomeModule);
    assert.deepEqual(nodes.map(n => n.props.name).sort(), ['activity','completion','network','opportunities','primary']);
    await Promise.all(nodes.map(n => n.props.load()));
    assert.equal(f.counts.jox || 0, 0); assert.equal(f.counts.glimps || 0, 0); assert.equal(f.counts.legacySerialization || 0, 0);
    const before = fixture({ legacyProducts: true });
    await Promise.all(walk(await before.page.default(), n => n.type === HomeModule).map(n => n.props.load()));
    assert.equal(before.counts.jox, 1); assert.equal(before.counts.glimps, 1); assert.equal(before.counts.legacySerialization, 2);
  });
  await check('Home client never mounts rails even if old props contain media', () => {
    const tree = ui('components/social/SocialHomeFeed.tsx', { '@/lib/moments': { getActiveMoment: () => null } }).default({ opportunities: [], network: [], jox: legacyRows, glimps: legacyRows, initialPage: { items: [], nextCursor: null } });
    assert.equal(walk(tree, n => /JoxOrbitRail|GlimpsRail/.test(n.type?.displayName || '')).length, 0);
    noLegacy(tree);
  });
  await check('real Home primary query/serialization excludes legacy posts, media and reaction work', async () => {
    const {db,calls,signed}=database(records,'follower'), server=social(db);
    const {initialHomePosts}=moduleAt('lib/home/primary.ts', {'server-only':{},'@/lib/social/server':server});
    const page=await initialHomePosts('follower');
    assert.deepEqual([...page.items].map(p=>p.id),['standard']);
    assert.ok(calls.filter(c=>c.table==='posts').every(c=>c.ids.every(id=>id==='standard')));
    assert.ok(calls.filter(c=>c.table==='post_media').every(c=>c.ids.length===0));
    assert.equal(calls.filter(c=>c.table==='vijox_timed_reactions').length,0);
    assert.equal(signed.length,0);
  });
  await check('owner and visitor profile tabs/empty states are GigThoughts and Reposts', () => {
    for (const isOwner of [true,false]) {
      const tree = ui('components/social/ProfileSocialFeed.tsx').default({ profileId: 'author', name: 'Author', isOwner });
      noLegacy(tree);
      assert.deepEqual(walk(tree,n => n.type === 'button').map(n => text(n)), ['GigThoughts','Reposts']);
    }
  });
  await check('Create personal/workplace actions retain product visibility', () => {
    const { choices } = require('./test-create-mobile.cjs');
    for(const query of ['', 'personal=1', 'organization=org']) {
      const tree=choices(query); noLegacy(tree);
      assert.deepEqual(walk(tree,n=>n.type==='h2').map(text),query==='organization=org'?['Share a GigThought','Post a Job']:['Share a GigThought','Post a Job','Post a Gig Project','Offer a Service']);
    }
    assert.ok(walk(choices(),n=>n.props?.href==='/create?personal=1').length);
  });
  await check('search tabs and queries exclude legacy before visibility/media serialization', async () => {
    const { db, calls } = database(records, 'viewer'); const serialized = [];
    const page = ui('app/social/explore/page.tsx', {
      '@/lib/supabase/server': { createClient: async () => db },
      '@/lib/social/server': { socialDb: () => db, canViewPost: async () => true, safePost: async p => { serialized.push(p.id); return p; }, accessibleJoxPage: () => { throw Error('JOX query'); }, accessibleGlimps: () => { throw Error('GLIMPS query'); } },
      '@/lib/identity': { compactIntentLabels: () => [] },
    }).default;
    const tree = await page({ searchParams: Promise.resolve({ tab: 'glimps' }) }); noLegacy(tree);
    assert.deepEqual(serialized, ['standard']); assert.deepEqual(calls.find(c => c.table === 'posts').ids, ['standard']);
  });
  await check('seasonal prompts and landing/composer copy do not advertise legacy creators', () => {
    const moment = moduleAt('lib/moments.ts', {}, { process: { env: {} } }).specialMoments[0];
    noLegacy(ui('components/moments/MomentExperience.tsx', {}, [true]).MomentHeader({ moment }));
    noLegacy(ui('components/moments/MomentExperience.tsx', {}, [false]).MomentHomeCard({ moment }));
    assert.doesNotMatch(source('components/home/Hero.tsx'), /jox|glimps/i);
    assert.ok(source('components/social/CreatePostComposer.tsx').includes('Add photos, a video or a PDF to your GigThought.'));
  });
  await check('current profile reposts and workplace feeds filter before serialization; direct API retains legacy', async () => {
    for (const route of ['profiles','organizations']) for (const current of [false,true]) {
      const fixtureRecords = route === 'organizations' ? { ...records, posts: records.posts.map(p => ({ ...p, author_organization_id:'org' })) } : records;
      const {db} = database(fixtureRecords,'follower'), server = social(db);
      const api = moduleAt(`app/api/social/${route}/[id]/posts/route.ts`, { 'next/server': { NextResponse: { json: value => value } }, '@/lib/social/server': server });
      const result = await api.GET({ nextUrl: new URL(`http://local/?tab=reposts${current?'&currentProduct=1':''}`) }, { params: Promise.resolve({id:route === 'profiles'?'author':'org'}) });
      assert.ok(Array.isArray(result.items), JSON.stringify(result));
      const posts = result.items.map(p => p.originalPost || p);
      if (current) assert.ok(posts.every(p => p.contentFormat === 'standard'));
      else assert.ok(posts.some(p => p.contentFormat === 'vijox') && posts.some(p => p.contentFormat === 'glimps'));
    }
  });
  await check('legacy JOX/GLIMPS direct feeds and content retain access checks, including workplace fixtures', async () => {
    for (const viewer of [undefined,'stranger','follower','author']) {
      const {db,signed} = database(records,viewer), server = social(db);
      for (const [route,component] of [['vijox','VijoxContinuousFeed'],['glimps','GlimpsFeed']]) {
        const page = ui(`app/social/${route}/page.tsx`, { '@/lib/supabase/server': { createClient:async()=>db }, '@/lib/social/server': server, '@/lib/social/content-domain': moduleAt('lib/social/content-domain.ts', {}) }).default;
        const tree = await page({searchParams:Promise.resolve({post:`${route}-private`})});
        const feed = walk(tree,n=>n.type?.displayName?.endsWith(component))[0]; assert.ok(feed);
        assert.ok(feed.props.initialItems.some(p=>p.id===route));
        assert.ok(feed.props.initialItems.every(p=>!p.id.endsWith('-draft')));
        if (!viewer || viewer==='stranger') assert.deepEqual([...feed.props.initialItems].map(p=>p.id),[route]);
      }
      const detail = ui('app/social/posts/[id]/page.tsx', { '@/lib/supabase/server': {createClient:async()=>db}, '@/lib/social/server':server, 'next/navigation': {notFound(){throw Error('404')}} }).default;
      for (const row of legacyRows) {
        const allowed = row.status==='published' && (row.visibility==='public' || viewer==='author' || viewer==='follower');
        if (allowed) { const result=await detail({params:Promise.resolve({id:row.id})}); assert.equal(result.props.post.id,row.id); }
        else await assert.rejects(detail({params:Promise.resolve({id:row.id})}),/404/);
      }
      if (!viewer || viewer==='stranger') assert.equal(signed.length,0,'unauthorized media signed');
      else assert.ok(signed.length>0,'authorized protected media retained');
    }
  });
  await check('legacy public media supports ranges; private/draft/media mismatch fail closed', async () => {
    const {db}=database(records),server=social(db); let fetches=0;
    const api=moduleAt('app/social/posts/[id]/media/[mediaId]/public/route.ts', {'@/lib/social/server':server}, {...globals,fetch:async(_url,init)=>{fetches++;assert.equal(init.headers.get('Range'),'bytes=0-4');return new Response('media',{status:206,headers:{'content-range':'bytes 0-4/5'}})}});
    for(const row of legacyRows){const response=await api.GET({method:'GET',headers:new Headers({range:'bytes=0-4'})},{params:Promise.resolve({id:row.id,mediaId:`m-${row.id}`})});assert.equal(response.status,row.visibility==='public'&&row.status==='published'?206:404);}
    const mismatch=await api.GET({method:'GET',headers:new Headers()},{params:Promise.resolve({id:'vijox',mediaId:'m-glimps'})});assert.equal(mismatch.status,404);assert.equal(fetches,2);
  });
  await check('SEO does not promote legacy hubs; legacy route/media/creator files remain present', () => {
    assert.doesNotMatch(source('app/sitemap.ts'), /jox|glimps/i);
    for(const file of ['app/social/vijox/page.tsx','app/social/glimps/page.tsx','app/social/vijox/create/page.tsx','app/social/glimps/create/page.tsx','app/social/posts/[id]/page.tsx','app/social/posts/[id]/opengraph-image/route.tsx','app/social/posts/[id]/jox-clip/route.ts','app/api/social/vijox/route.ts','app/api/social/glimps/route.ts'])assert.ok(fs.existsSync(file),file);
  });
  console.log(`${groups} Part 3 simplification groups PASS. Synthetic local execution; live content and browser layout NOT MEASURED.`);
})().catch(error=>{console.error(error);process.exitCode=1});
