const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const ts = require('typescript');
const sharp = require('sharp');
const { NextRequest } = require('next/server');
function load(file, deps = {}, globals = {}) {
  const module = { exports: {} };
  const code = ts.transpileModule(fs.readFileSync(file, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX, esModuleInterop: true } }).outputText;
  vm.runInNewContext(code, { module, exports: module.exports, require: name => deps[name] || require(name), Buffer, Request, Response, Headers, URL, Uint8Array, AbortSignal, AbortController, File, fetch, process: { env: { NEXT_PUBLIC_SUPABASE_URL: 'https://fixture.supabase.co', SUPABASE_SERVICE_ROLE_KEY: 'test-only' } }, console, ...globals });
  return module.exports;
}
let groups = 0;
async function check(name, run) { await run(); console.log('PASS', name); groups++; }
(async () => {
  const images = load('lib/media/image-server.ts');
  const policy = load('lib/media/image-policy.ts');
  const fixture = await sharp(Buffer.from('<svg width="2048" height="1536"><rect width="2048" height="1536" fill="#6655cc"/><circle cx="700" cy="640" r="300" fill="#ff9966"/><text x="110" y="120" font-size="76" fill="white">GigWay: fine text &amp; colour</text></svg>')).png({ compressionLevel: 1 }).toBuffer();
  await check('Lossless upload retains full dimensions, alpha and decoded pixels; smaller output only', async () => {
    const result = await images.optimizeImage(fixture, 'image/png');
    assert.equal(result.type, 'image/webp'); assert(result.bytes.length < fixture.length);
    const before = await sharp(fixture).ensureAlpha().raw().toBuffer();
    const after = await sharp(result.bytes).ensureAlpha().raw().toBuffer();
    assert.deepEqual(after, before);
    const meta = await sharp(result.bytes).metadata(); assert.equal(meta.width, 2048); assert.equal(meta.height, 1536);
    console.log(`  Fixture upload: ${fixture.length} -> ${result.bytes.length} bytes`);
  });
  await check('Display variants match high-quality resampling exactly; avatar crop has enough pixels; no enlargement', async () => {
    const result = await images.optimizeImage(fixture, 'image/png', 384);
    const expected = await sharp(fixture).resize({ width: 384, withoutEnlargement: true }).ensureAlpha().raw().toBuffer();
    assert.deepEqual(await sharp(result.bytes).ensureAlpha().raw().toBuffer(), expected);
    const square = await images.optimizeImage(fixture, 'image/png', 384, true);
    const meta = await sharp(square.bytes).metadata(); assert(meta.width >= 384 && meta.height >= 384);
    const small = await sharp(fixture).resize(40).png().toBuffer();
    const smallResult = await images.optimizeImage(small, 'image/png', 384);
    assert.equal((await sharp(smallResult.bytes).metadata()).width, 40);
    console.log(`  384px display: ${result.bytes.length} bytes`);
  });
  await check('Unsupported/colour-managed images retain original; EXIF orientation is preserved visually', async () => {
    const tagged = await sharp(fixture).withIccProfile('p3').png().toBuffer();
    assert.equal((await images.optimizeImage(tagged, 'image/png', 96)).bytes, tagged);
    assert.equal((await images.optimizeImage(fixture, 'image/gif', 96)).bytes, fixture);
    const rotated = await sharp(fixture).jpeg().withMetadata({ orientation: 6 }).toBuffer();
    const result = await images.optimizeImage(rotated, 'image/jpeg', 384);
    // ICC-tagged JPEG is deliberately retained; browser honours EXIF itself.
    if (result.bytes === rotated) assert.equal((await sharp(result.bytes).metadata()).orientation, 6);
    else assert((await sharp(result.bytes).metadata()).height > (await sharp(result.bytes).metadata()).width);
  });
  await check('Concurrent/repeated variants share source work; errors are retryable; reads are byte bounded', async () => {
    let calls = 0;
    const work = async () => { calls++; await new Promise(resolve => setTimeout(resolve, 5)); return { bytes: fixture, type: 'image/png' }; };
    const rows = await Promise.all(Array.from({ length: 8 }, () => images.cachedImage('same', work)));
    assert.equal(calls, 1); assert(rows.every(row => row === rows[0]));
    await images.cachedImage('same', work); assert.equal(calls, 1);
    await assert.rejects(images.cachedImage('retry', async () => { throw Error('offline'); }));
    await images.cachedImage('retry', work); assert.equal(calls, 2);
    await assert.rejects(images.readImageBody(new Response(new Uint8Array(12)), 8), /large/);
  });
  await check('Variant allowlist rejects remote/private buckets, credentials, queries and arbitrary widths', async () => {
    assert(policy.imageVariantUrl('https://fixture.supabase.co/storage/v1/object/public/avatars/u/a.jpg', 192));
    for (const url of ['https://evil.invalid/a.jpg', 'https://fixture.supabase.co/storage/v1/object/sign/post-media/a?token=secret', 'https://fixture.supabase.co/storage/v1/object/public/cvs/a.jpg', 'https://user:password@fixture.supabase.co/storage/v1/object/public/avatars/a.jpg']) assert.equal(policy.imageVariantUrl(url, 192), null);
    assert.equal(policy.imageVariantUrl('/social/posts/p/media/m/public', 500), null);
    assert.equal(policy.imageVariantUrl('/api/social/posts/p/media/m/file', 192), '/api/social/posts/p/media/m/file?w=192');
  });
  let allowed = true, visibility = 'public', user = null, upstreamCalls = 0, receivedRange;
  const media = { id: 'm', storage_path: 'users/u/p/m.png', mime_type: 'image/png', media_type: 'image', file_size_bytes: fixture.length };
  const db = { from() { const q = { select: () => q, eq: () => q, in: () => q, maybeSingle: async () => ({ data: media }) }; return q; } };
  const delivery = load('lib/media/deliver-post-media.ts', {
    '@/lib/media/image-policy': policy, '@/lib/media/image-server': images,
    '@/lib/social/server': { POST_MEDIA_BUCKET: 'post-media', socialDb: () => db, requireSocialUser: async () => user, resolvePostAccess: async (_id, viewer) => allowed && (visibility === 'public' || viewer === 'viewer') ? { visibility } : null },
  }, { fetch: async (_url, init) => { upstreamCalls++; receivedRange = new Headers(init.headers).get('range'); return new Response(fixture, { status: receivedRange ? 206 : 200, headers: { 'content-type': media.mime_type, 'content-length': String(fixture.length), ...(receivedRange ? { 'content-range': `bytes 0-99/${fixture.length}` } : {}) } }); } });
  const request = (suffix = '', headers = {}) => new NextRequest(`https://gigway.test/social/posts/p/media/m/public${suffix}`, { headers });
  const params = Promise.resolve({ id: 'p', mediaId: 'm' });
  await check('Stable post variants revalidate without redownloading; revoked visibility blocks cached bytes', async () => {
    const first = await delivery.deliverPostMedia(request('?w=192'), params);
    assert.equal(first.status, 200); assert.equal(first.headers.get('cache-control'), 'private, no-cache');
    const etag = first.headers.get('etag'), calls = upstreamCalls;
    const second = await delivery.deliverPostMedia(request('?w=192', { 'if-none-match': etag }), params);
    assert.equal(second.status, 304); assert.equal(upstreamCalls, calls);
    visibility = 'followers';
    assert.equal((await delivery.deliverPostMedia(request('?w=192', { 'if-none-match': etag }), params)).status, 404);
    assert.equal((await delivery.deliverPostMedia(request('?w=192'), params, true)).status, 404);
    user = { id: 'viewer' };
    assert.equal((await delivery.deliverPostMedia(request('?w=192'), params, true)).status, 200);
    user = { id: 'other-account' };
    assert.equal((await delivery.deliverPostMedia(request('?w=192', { 'if-none-match': etag }), params, true)).status, 404);
    allowed = false;
    assert.equal((await delivery.deliverPostMedia(request('?w=192'), params, true)).status, 404);
    allowed = true; visibility = 'public';
  });
  await check('Video/audio preserve range seeking, conditional reuse, original bytes and HEAD behavior', async () => {
    media.media_type = 'video'; media.mime_type = 'video/mp4';
    const response = await delivery.deliverPostMedia(request('', { range: 'bytes=0-99' }), params);
    assert.equal(response.status, 206); assert.equal(receivedRange, 'bytes=0-99'); assert(response.headers.get('content-range'));
    const etag = response.headers.get('etag');
    await delivery.deliverPostMedia(request('', { range: 'bytes=0-99', 'if-range': '"old"' }), params);
    assert.equal(receivedRange, null);
    const before = upstreamCalls;
    assert.equal((await delivery.deliverPostMedia(request('', { 'if-none-match': etag }), params)).status, 304);
    assert.equal(upstreamCalls, before);
    const head = await delivery.deliverPostMedia(new NextRequest('https://gigway.test/x', { method: 'HEAD' }), params);
    assert.equal(await head.text(), '');
  });
  await check('Upload preparation coalesces the same File, bypasses large/video files, retains original on failure', async () => {
    let calls = 0;
    const prepare = load('lib/media/prepare-upload.ts', {}, { fetch: async () => { calls++; return new Response(new Uint8Array(100), { headers: { 'content-type': 'image/webp' } }); } });
    const file = new File([new Uint8Array(40_000)], 'photo.png', { type: 'image/png' });
    const [a, b] = await Promise.all([prepare.prepareImageUpload(file), prepare.prepareImageUpload(file)]);
    assert.equal(calls, 1); assert.equal(a, b); assert.equal(a.name, 'photo.webp');
    const video = new File(['video'], 'video.mp4', { type: 'video/mp4' }); assert.equal(await prepare.prepareImageUpload(video), video);
    const large = new File([new Uint8Array(4 * 1024 * 1024 + 1)], 'big.jpg', { type: 'image/jpeg' }); assert.equal(await prepare.prepareImageUpload(large), large); assert.equal(calls, 1);
    const failed = load('lib/media/prepare-upload.ts', {}, { fetch: async () => { throw Error('offline'); } });
    assert.equal(await failed.prepareImageUpload(file), file);
  });
  await check('Feed double-clicks coalesce; switching tabs aborts old work and ignores late media payloads', async () => {
    const React = require('react'), states = [], effects = [], dependencies = [];
    let index = 0;
    const hooks = {
      useState(value) { const i = index++; if (!(i in states)) states[i] = typeof value === 'function' ? value() : value; return [states[i], next => { states[i] = typeof next === 'function' ? next(states[i]) : next; }]; },
      useRef(value) { const i = index++; return states[i] ??= { current: value }; },
      useEffect(fn, deps) { const i = index++; if (!dependencies[i] || deps.some((value, j) => value !== dependencies[i][j])) effects.push(fn); dependencies[i] = deps; },
    };
    const source = fs.readFileSync('components/social/SocialHomeFeed.tsx', 'utf8');
    const stub = () => null;
    const deps = Object.fromEntries([...source.matchAll(/from\s+["']([^"']+)["']/g)].map(match => [match[1], { __esModule: true, default: stub }]));
    const calls = [];
    Object.assign(deps, {
      react: hooks,
      'next/dynamic': { __esModule: true, default: () => stub },
      'lucide-react': new Proxy({}, { get: () => stub }),
      '@/lib/product-visibility': { productVisibility: {} },
      '@/lib/moments': { getActiveMoment: () => null },
      '@/components/moments/MomentExperience': { MomentHomeCard: stub },
      '@/lib/async': { boundedFetch: (url, options) => new Promise(resolve => calls.push({ url, options, resolve })) },
    });
    const component = load('components/social/SocialHomeFeed.tsx', deps).default;
    const props = { initialPage: { items: [], nextCursor: 'page-2' }, opportunities: [], network: [], glimps: [], jox: [] };
    const render = () => { index = 0; const tree = component(props); effects.splice(0).forEach(fn => fn()); return tree; };
    const text = node => typeof node === 'string' ? node : Array.isArray(node) ? node.map(text).join('') : text(node?.props?.children || '');
    const buttons = (node, rows = []) => { if (!node || typeof node !== 'object') return rows; if (node.type === 'button') rows.push(node); React.Children.forEach(node.props?.children, child => buttons(child, rows)); return rows; };
    let tree = render(); assert.equal(calls.length, 0);
    const more = buttons(tree).find(node => text(node).trim() === 'Load more'); assert(more);
    const first = more.props.onClick(), duplicate = more.props.onClick();
    assert.equal(calls.length, 1);
    buttons(tree).find(node => text(node).trim() === 'FOLLOWING').props.onClick();
    tree = render(); assert.equal(calls.length, 2); assert(calls[0].options.signal.aborted);
    calls[1].resolve({ ok: true, json: async () => ({ items: [], nextCursor: null }) });
    await new Promise(resolve => setImmediate(resolve));
    calls[0].resolve({ ok: true, json: async () => ({ items: [{ id: 'stale-media' }], nextCursor: 'stale' }) });
    await Promise.all([first, duplicate]); render();
    assert.equal(states[1].length, 0); assert.equal(states[5], null);
  });
  console.log(`PASS ${groups} media egress groups (local fixtures; no production traffic).`);
})().catch(error => { console.error(error); process.exitCode = 1; });
