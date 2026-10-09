// Actual components/loaders with local fixtures; no live auth/database.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const React = require('react');
const {moduleAt, fixture, walk, HomeModule, def, placeholder} = require('./test-makkhan-pass2.cjs');
const {choices, text} = require('./test-create-mobile.cjs');
const source = f => fs.readFileSync(f, 'utf8');
const icons = new Proxy({}, {get: (_, key) => key === '__esModule' ? true : placeholder(String(key))});
let groups = 0;
async function check(name, fn) { await fn(); groups++; console.log('PASS', name); }
(async () => {
  await check('Home executes bounded preview loaders and zero dormant loaders', async () => {
    const f = fixture(), tree = await f.page.default();
    await Promise.all(walk(tree, n => n.type === HomeModule).map(n => n.props.load()));
    assert.equal(f.counts.viewer, 1); assert.equal(f.counts.jox || 0, 0); assert.equal(f.counts.glimps || 0, 0);
    assert.equal(f.calls.find(c => c.table === 'profiles' && !c.filters.single).limit, 6);
    assert.equal(f.calls.find(c => c.table === 'organizations').limit, 6);
    for (const table of ['jobs', 'projects', 'gigs']) assert.equal(f.calls.find(c => c.table === table).limit, 2);
  });
  await check('SSR Home initial page including empty skips fetch on effect replay', () => {
    for (const items of [[], [{id:'post'}]]) {
      let requests = 0; const effects = [];
      const src = source('components/social/SocialHomeFeed.tsx');
      const deps = Object.fromEntries([...src.matchAll(/from\s+["']([^"']+)["']/g)].map(m => [m[1], def(placeholder(m[1]))]));
      Object.assign(deps, {react: {useState: x => [x, () => {}], useRef: x => ({current:x}), useEffect: fn => effects.push(fn)}, 'lucide-react': icons,
        '@/lib/async': {boundedFetch: () => {requests++; throw Error('Duplicate initial request');}},
        '@/lib/moments': {getActiveMoment: () => null}, '@/components/moments/MomentExperience': {MomentHomeCard: placeholder('moment')}});
      moduleAt('components/social/SocialHomeFeed.tsx', deps).default({initialPage:{items,nextCursor:null},opportunities:[],network:[],jox:[],glimps:[]});
      effects.forEach(fn => {fn(); fn();}); assert.equal(requests, 0);
    }
  });
  await check('Work executes only three six-row server reads without auth', async () => {
    const calls = []; const db = {from(table) {const call = {table}; calls.push(call); const q = {select(){return q},eq(){return q},order(){return q},limit(n){call.limit=n;return q},then(resolve){resolve({data:Array.from({length:30},(_,i)=>({id:String(i),title:'work'})),error:null})}};return q}};
    const load = moduleAt('lib/work/previews.ts', {'server-only':{},'@/lib/supabase/server':{createClient:async()=>db}}).workPreviews;
    for (const kind of ['jobs','projects','services']) assert.equal((await load(kind)).items.length,6);
    assert.ok(calls.every(c => c.limit === 6));
    assert.doesNotMatch(source('app/work/page.tsx'), /getViewer|getUser|getSession|useEffect/);
    assert.match(source('middleware.ts'), /const publicRoute = pathname === "\/work"/);
  });
  await check('Network results use 18 and discovery markup stays server with tiny interactive props', async () => {
    assert.match(source('app/network/page.tsx'), /networkDiscovery\(kind, viewerId, 18, q\)/);
    const Follow = placeholder('follow');
    const Cards = moduleAt('components/connections/DiscoveryCards.tsx', {'next/link':def('a'),'./DiscoveryFollowButton':def(Follow)}).default;
    const tree = Cards({kind:'people',rail:true,items:[{id:'p',name:'Person',href:'/u/p',image:'https://signed.invalid/image?token=unchanged',tagline:'Headline',skills:['Design'],intents:[],following:true}]});
    const card = walk(tree,n=>n.type==='article')[0].props.children;
    const rendered = card.type(card.props), image = walk(rendered,n=>n.type==='img')[0];
    assert.equal(image.props.loading,'lazy'); assert.equal(image.props.decoding,'async'); assert.equal(image.props.width,44); assert.equal(image.props.height,44);
    assert.equal(image.props.src,'https://signed.invalid/image?token=unchanged');
    assert.deepEqual(Object.keys(walk(rendered,n=>n.type===Follow)[0].props).sort(),['id','initialFollowing','kind','name']);
    assert.ok(walk(rendered,n=>n.type==='a').every(n=>n.props.prefetch===false));
    assert.doesNotMatch(source('components/connections/DiscoveryCards.tsx'), /use client|useEffect|useState/);
  });
  await check('Network mount coalesces replay, cancels stale reads, and failures release action state', async () => {
    let states, pos, effects, requests = [], timers = new Map(), serial = 0;
    const item = {id:'r',profile:{id:'p',username:'person',full_name:'Person'}};
    const Component = moduleAt('components/connections/NetworkClient.tsx', {react:{useRef:v=>({current:v}),useState(initial){const i=pos++;return[states[i],v=>states[i]=typeof v==='function'?v(states[i]):v]},useEffect(fn){effects.push(fn)}},'next/link':def('a'),'lucide-react':icons,'@/components/ui/profile-avatar':{ProfileAvatar:placeholder('avatar')},'@/lib/async':{boundedFetch:async(url,options)=>{requests.push({url,options});throw Error('offline')}}}, {AbortController,setTimeout:fn=>{timers.set(++serial,fn);return serial},clearTimeout:id=>timers.delete(id)}).default;
    const render = () => {pos=0;effects=[];return Component({embedded:true})};
    states=[[item],[item],false,null,'']; let tree=render();
    const cleanup=effects[0](); cleanup(); const unmount=effects[0](); assert.equal(timers.size,1);
    const fire=[...timers.values()][0]; timers.clear(); fire(); await new Promise(r=>setImmediate(r));
    assert.equal(requests.length,1); assert.equal(states[2],false); assert.match(states[4],/Could not load/);
    unmount(); assert.equal(requests[0].options.signal.aborted,false); // Completed failed request has detached its upstream listener.
    assert.match(source('components/connections/NetworkClient.tsx'),/requestRef\.current\?\.abort\(\)/);
    for(const label of ['Accept','Decline','Disconnect']) {tree=render();await walk(tree,n=>n.type==='button'&&text(n)===label)[0].props.onClick();assert.equal(states[3],null);assert.match(states[4],/Could not/);}
    const count=requests.length; render(); assert.equal(requests.length,count); assert.equal(timers.size,0);
    assert.ok(walk(tree,n=>n.type==='a').every(n=>n.props.prefetch===false));
  });
  await check('personal Create remains usable with optional Workplace loading/error', () => {
    for (const workplaces of [{loading:true,organizations:[],error:''},{loading:false,organizations:[],error:'Unavailable'}]) {
      const tree=choices('',{...workplaces,retry(){}}); assert.equal(walk(tree,n=>n.props?.['data-create-action']!==undefined).length,4);
      assert.ok(text(tree).includes('Post a Gig Project'));
    }
  });
  await check('shared avatar has stable dimensions, lazy async decode and no dormant dependency', () => {
    const Avatar=moduleAt('components/ui/profile-avatar.tsx',{'lucide-react':icons}).ProfileAvatar;
    const img=walk(Avatar({src:'/avatar',name:'Person'}),n=>n.type==='img')[0];
    assert.equal(img.props.width,40);assert.equal(img.props.height,40);assert.equal(img.props.loading,'lazy');assert.equal(img.props.decoding,'async');
    assert.doesNotMatch(source('components/ui/profile-avatar.tsx'),/Glimps|Jox|Vijox|useMedia/);
    assert.doesNotMatch(source('components/social/ProfileSocialFeed.tsx'),/GlimpsExperience|glimps|vijox/);
    assert.match(source('components/layout/ModernNavbar.tsx'),/<img width=\{40\} height=\{40\} decoding="async"/);
  });
  console.log(`${groups} Part 4 groups PASS. Synthetic behavior, not production timings.`);
})().catch(error=>{console.error(error);process.exitCode=1});
