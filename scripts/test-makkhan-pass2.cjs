// Local synthetic tests: execute actual Home loaders/boundaries with mocked I/O.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const ts = require('typescript');
const vm = require('node:vm');
const react = require('react');
function moduleAt(file, deps, globals = {}) {
  const module = { exports: {} };
  const code = ts.transpileModule(fs.readFileSync(file, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX, esModuleInterop: true } }).outputText;
  vm.runInNewContext(code, { module, exports: module.exports, performance, console, setTimeout, clearTimeout, ...globals, require: name => {
    if (name === "@/lib/product-visibility" && !deps[name]?.productVisibility) return moduleAt("lib/product-visibility.ts", {});
    if (name in deps) return deps[name];
    if (name === "@/lib/billing/launch") return moduleAt("lib/billing/launch.ts", {});
    if (name === 'react/jsx-runtime') return require(name);
    throw Error('Unmocked import: ' + name);
  }});
  return module.exports;
}
const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));
const placeholder = name => Object.assign(props => react.createElement('div', null, name), { displayName: name });
const def = value => ({ __esModule: true, default: value });
const statuses = { SectionUnavailable: placeholder('unavailable') };
const asyncLib = moduleAt('lib/async.ts', {});
const { HomeModule } = moduleAt('components/home/HomeModule.tsx', {
  react, '@/lib/async': asyncLib, '@/lib/social/server': { socialPerf() {} }, '@/components/layout/SectionStatus': statuses,
});
const socialClient = { ...def(placeholder('feed')), OpportunityRail: placeholder('opportunities'), NetworkRail: placeholder('network') };
function walk(node, predicate, found = []) {
  if (!node || typeof node !== 'object') return found;
  if (predicate(node)) found.push(node);
  react.Children.forEach(node.props?.children, child => walk(child, predicate, found));
  return found;
}
function fixture({ fault, delayed, hanging, records, realRanking = false, legacyProducts = false, deadline = 120000 } = {}) {
  const calls = [], counts = {};
  const deadlines = { ...asyncLib, withDeadline: promise => asyncLib.withDeadline(promise, deadline) };
  const db = { from(table) {
    const filters = {}; let fields = '', limit;
    const q = {
      select(value) { fields = value; return q; }, eq(k,v) { filters[k] = v; return q; }, neq(k,v) { filters['not-'+k] = v; return q; },
      not() { return q; }, order() { return q; }, limit(n) { limit = n; return q; }, in(k,v) { filters[k] = v; return q; }, maybeSingle() { filters.single = true; return q; },
      async then(resolve, reject) {
        try {
          calls.push({ table, fields, limit, filters }); counts[table] = (counts[table] || 0) + 1;
          const name = table === 'jobs' ? 'opportunities' : table === 'organizations' ? 'network' : table === 'messages' ? 'activity' : table === 'profiles' && filters.single ? 'completion' : '';
          if (hanging === name) await new Promise(()=>{});
          if (delayed === name) await sleep(5000);
          if (fault === name) return resolve({ data: null, error: Error('Injected'), count: null });
          let data = [];
          if (table === 'profiles') data = filters.single ? { full_name: 'Viewer', username: 'viewer', skills: ['design'] } : Array.from({length:24}, (_, i) => ({ id: 'p'+i, full_name:'Person '+i, username:'p'+i, skills:['design'] }));
          if (table === 'jobs') data = [{ id:'job', title:'Useful job', client_id:'other' }, {id:'own',title:'Own job',client_id:'viewer'}];
          if (table === 'profile_follows') data = [{followed_profile_id:'p0'}];
          if (table === 'profile_intents') data = Array.isArray(filters.profile_id) ? filters.profile_id.map(id => ({profile_id:id,intent_type:'grow_network'})) : [{intent_type:'grow_network'}];
          if (records && !filters.single && table in records) {
            data = [...records[table]];
            if (filters['not-id']) data = data.filter(row=>row.id!==filters['not-id']);
            if (table === 'profiles' || table === 'organizations') data = data.filter(row=>row.username != null);
            if (limit) data = data.slice(0,limit);
          }
          if (Array.isArray(data) && limit) data = data.slice(0,limit);
          resolve({ data, error: null, count: 1 });
        } catch (error) { reject(error); }
      }
    }; return q;
  }};
  const completion = moduleAt('components/home/IdentityCompletionPrompt.tsx', {
    'next/link':def(placeholder('link')), 'lucide-react':{ArrowRight:placeholder('arrow'),Sparkles:placeholder('sparkles')},
    '@/lib/supabase/server': {createClient:async()=>db}, '@/lib/async':deadlines,
    '@/lib/identity/profile-strength':moduleAt('lib/identity/profile-strength.ts',{}),
  }).default;
  const previewDeps = {'server-only':{}, '@/lib/supabase/server':{createClient:async()=>db}};
  const discovery = moduleAt('lib/network/discovery.ts',{...previewDeps,'@/lib/identity':{compactIntentLabels:()=>[]}});
  const previews = moduleAt('components/home/DiscoveryPreviews.tsx', {
    'next/link':def(placeholder('link')), '@/components/connections/DiscoveryCards':def(socialClient.NetworkRail),
    '@/lib/network/discovery':discovery, '@/lib/work/previews':moduleAt('lib/work/previews.ts',previewDeps),
    '@/components/ui/ContentTimestamp':def(placeholder('timestamp')),
  });
  const page = moduleAt('app/home/page.tsx', {
    "@/lib/product-visibility": legacyProducts ? { productVisibility: { joxCurrentProduct: true, glimpsCurrentProduct: true } } : moduleAt("lib/product-visibility.ts", {}),
    react: { ...react, cache: fn => { const memo = new Map(); return key => { if (!memo.has(key)) memo.set(key, fn(key)); return memo.get(key); }; } },
    '@/lib/auth/server': { getViewer: async () => { counts.viewer=(counts.viewer||0)+1; return { id:'viewer' }; } }, '@/lib/async': deadlines,
    '@/components/layout/SectionStatus': statuses, 'next/link':def(placeholder('link')),
    'lucide-react': { ArrowRight:placeholder('arrow'), CheckCircle2:placeholder('check') },
    '@/lib/supabase/server': { createClient: async () => db },
    '@/components/social/SocialHomeFeed': socialClient,
    '@/components/home/DiscoveryPreviews':previews,
    '@/lib/recommendations': realRanking ? moduleAt('lib/recommendations.ts',{}) : { scoreOpportunity: () => ({score:1,skills:[]}) },
    '@/lib/recommendations/intentRanking': realRanking ? moduleAt('lib/recommendations/intentRanking.ts',{}) : { scoreIntentAwareOpportunity: () => ({finalScore:1}), scoreNetworkCandidate: () => ({finalScore:1}) },
    '@/lib/social/server': {
      socialPerf() {}, safePosts: async posts => { counts.legacySerialization=(counts.legacySerialization||0)+1; return posts; },
      accessibleGlimpsPage: async () => { counts.glimps=(counts.glimps||0)+1; if(hanging==='glimps') await new Promise(()=>{}); if(delayed==='glimps') await sleep(5000); return {posts:[]}; },
      accessibleJoxPage: async () => { counts.jox=(counts.jox||0)+1; if(hanging==='jox') await new Promise(()=>{}); if(delayed==='jox') await sleep(5000); if(fault==='jox') throw Error('Injected'); return {posts:[]}; },
    },
    '@/lib/identity': { compactIntentLabels: () => [] },
    '@/components/home/HomeActionGuide': def(placeholder('action-guide')),
    '@/components/home/IdentityCompletionPrompt': def(async ({loadProfile,loadIntents}) => { if(fault==='completion') throw Error('Injected'); return completion({userId:'viewer',loadProfile,loadIntents}); }),
    '@/components/social/JoxOrbitRail': def(placeholder('jox')), '@/components/social/GlimpsRail':def(placeholder('glimps')),
    '@/lib/home/primary': { initialHomePosts: async id => { assert.equal(id,'viewer'); if(fault==='primary') throw Error('Injected'); return {items:[{id:'post',body:'Useful content'}],nextCursor:null}; } },
    '@/components/home/HomeModule': {HomeModule},
  });
  return {page,calls,counts};
}
async function scenario(options) {
  const {page,calls} = fixture({...options, legacyProducts:true}), shell = await page.default();
  const modules = walk(shell, n => n.type === HomeModule);
  assert.equal(modules.length,7);
  const settled = new Map();
  const tasks = modules.map(node => {
    const boundary = HomeModule(node.props), content = boundary.props.children.props.children;
    return content.type(content.props).then(result => { settled.set(node.props.name,result); return result; });
  });
  await sleep(20);
  assert.ok(settled.has('primary'), 'primary must settle without secondary dependencies');
  if(options?.delayed) assert.ok(!settled.has(options.delayed), 'injected delay must actually be pending');
  await Promise.all(tasks);
  if(options?.fault && !['activity','opportunities'].includes(options.fault)) assert.equal(settled.get(options.fault).props['data-home-error'],options.fault);
  if(options?.fault==='activity') assert.ok(walk(settled.get('activity'), n=>n.type===statuses.SectionUnavailable).length);
  if(options?.fault==='primary') for(const name of ['opportunities','network','jox','glimps','completion','activity']) assert.ok(settled.has(name));
  if(!options?.fault) {
    const rails=walk(settled.get('network'),n=>n.type===socialClient.NetworkRail);
    assert.equal(rails.length,2);assert.ok(rails.every(n=>n.props.items.length<=6));
    assert.equal(rails[0].props.items.find(item=>item.id==='p0')?.following,true,'existing follows accurately displayed');
    assert.ok(walk(settled.get('opportunities'),n=>n.type==='article').length<=6);
    assert.equal(calls.filter(q=>q.table==='profiles' && q.filters.single).length,1,'single viewer profile');
    assert.equal(calls.filter(q=>q.table==='profile_intents' && q.filters.profile_id==='viewer').length,1,'single viewer intents');
    for(const table of ['jobs','projects','gigs']) assert.equal(calls.find(q=>q.table===table).limit,2);
    assert.equal(calls.find(q=>q.table==='organizations').limit,6);
    const labels=calls.find(q=>q.table==='profile_intents' && Array.isArray(q.filters.profile_id));
    assert.ok(labels.filters.profile_id.length<=6);
  }
  console.log('PASS actual Home loaders/boundaries:', JSON.stringify(options || {normal:true}));
}
async function primaryTests() {
  let stages = [], fail = null;
  const posts = Array.from({length:16},(_,i)=>({id:String(i),created_at:'date'}));
  const social = { accessibleDiscoverPage:async viewer=>{stages.push('accessibleDiscoverPage');assert.equal(viewer,'viewer');if(fail==='accessibleDiscoverPage')throw Error('injected');return {posts:posts.slice(0,15),nextCursor:'date|14'};} };
  for(const name of ['safePosts','withReplyPreviews','enrichPostsWithVijoxTimedReactions']) social[name]=async (rows,viewer)=>{stages.push(name);if(fail===name)throw Error('injected');if(name==='safePosts')assert.equal(viewer,'viewer');return rows.map(row=>({...row,replyPreview:[]}));};
  const {initialHomePosts}=moduleAt('lib/home/primary.ts', {'server-only':{},'@/lib/social/server':social});
  const result=await initialHomePosts('viewer');assert.equal(result.items.length,15);assert.equal(result.nextCursor,'date|14');
  assert.deepEqual(stages,['accessibleDiscoverPage','safePosts','withReplyPreviews','enrichPostsWithVijoxTimedReactions']);
  for(const stage of [...stages]){fail=stage;await assert.rejects(initialHomePosts('viewer'));}
  console.log('PASS first-page bounds, cursor, viewer propagation, visibility-before-serialization and fail-closed stages');
}
async function hydrationTest() {
  let refs=[],state=[],effects=[],position=0,requests=0;
  const fakeReact = {
    useState(initial){const i=position++;if(!(i in state))state[i]=initial;return[state[i],value=>state[i]=typeof value==='function'?value(state[i]):value]},
    useRef(initial){const i=position++;return refs[i] ||= {current:initial}},useEffect(fn){effects.push(fn)},
  };
  const source=fs.readFileSync('components/social/SocialHomeFeed.tsx','utf8');
  const imports=[...source.matchAll(/from\s+["']([^"']+)["']/g)].map(x=>x[1]);
  const deps=Object.fromEntries(imports.map(name=>[name,def(placeholder(name))]));
  deps['lucide-react']=new Proxy({}, {get:(_,name)=>name==='__esModule'?true:placeholder(String(name))});deps['@/components/moments/MomentExperience']={MomentHomeCard:placeholder('moment')};deps.react=fakeReact;deps['@/lib/moments']={getActiveMoment:()=>null};deps['@/lib/async']={boundedFetch:async()=>{requests++;return{ok:true,json:async()=>({items:[],nextCursor:null})}}};
  const Feed=moduleAt('components/social/SocialHomeFeed.tsx',deps).default;
  const props={opportunities:[],network:[],glimps:[],jox:[],initialPage:{items:[],nextCursor:'next'}};
  function render(){position=0;effects=[];return Feed(props)}
  render();for(const effect of effects){effect();effect();} await sleep(0);assert.equal(requests,0,'StrictMode replay duplicates initial page');
  state[0]='following';render();effects.forEach(fn=>fn());await sleep(0);assert.equal(requests,1);
  state[0]='discover';render();effects.forEach(fn=>fn());await sleep(0);assert.equal(requests,2);
  console.log('PASS SSR hydration (including empty page and StrictMode replay) makes zero discover requests; tab changes fetch once');
}
if (require.main === module) (async()=>{
  await primaryTests();await hydrationTest();await scenario();
  await Promise.all([scenario({delayed:'glimps'}),scenario({delayed:'network'}),scenario({delayed:'opportunities'})]);
  for(const fault of ['jox','opportunities','activity','completion','primary'])await scenario({fault});
  const hanging=HomeModule({name:'primary',load:async()=>{throw Error('Injected')}}).props.children.props.children;
  const failed=await hanging.type(hanging.props);assert.ok(walk(failed,n=>n.type===statuses.SectionUnavailable).length);
  const bounded = moduleAt('components/home/HomeModule.tsx', { react, '@/lib/async': { withDeadline: promise => asyncLib.withDeadline(promise, 10) }, '@/lib/social/server': {socialPerf(){}}, '@/components/layout/SectionStatus': statuses }).HomeModule;
  const timed = bounded({name:'primary',load:()=>new Promise(()=>{})}).props.children.props.children;
  assert.equal((await timed.type(timed.props)).props['data-home-error'],'primary');
  console.log('PASS finite failure/retry and never-settling loader deadline, independent primary/secondary readiness. SYNTHETIC; no browser or live database.');
})().catch(error=>{console.error(error);process.exitCode=1});


module.exports = { moduleAt, fixture, walk, HomeModule, asyncLib, socialClient, statuses, def, placeholder };
