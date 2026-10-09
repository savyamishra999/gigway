// Initial-output consistency tests. No credentials, network or app changes.
const assert=require('node:assert/strict');
const React=require('react');
const {renderToStaticMarkup}=require('react-dom/server');
const {moduleAt}=require('./test-makkhan-pass2.cjs');
const time=moduleAt('lib/content-time.ts',{});
function initialTimestamp(clock,props){
  const effects=[];let calls=0;
  class Clock extends Date {static now(){calls++;return clock}}
  const render=moduleAt('components/ui/ContentTimestamp.tsx',{
    react:{useState:initial=>[initial,()=>{}],useEffect:fn=>effects.push(fn)},
    '@/lib/content-time':time,
  },{Date:Clock}).default;
  const html=renderToStaticMarkup(render(props));
  assert.equal(calls,0,'Initial timestamp must not read the browser/server clock');
  return html;
}
for(const props of [
  {createdAt:'2026-10-01T12:00:00Z'},
  {createdAt:'2026-10-01T12:00:00Z',updatedAt:'2026-10-02T12:00:00Z'},
  {createdAt:'2026-10-01T12:00:00Z',updatedAt:null},
  {createdAt:'invalid'},
]){
  const server=initialTimestamp(Date.UTC(2000,0,1),props);
  const client=initialTimestamp(Date.UTC(2050,0,1),props);
  assert.equal(server,client);
  if(props.createdAt!=='invalid')assert.ok(server.includes('IST'));
}
assert.equal(time.formatContentDate('2026-10-01T12:00:00Z'),'1 Oct 2026, 5:30 PM IST');
console.log('PASS actual shared timestamp SSR/first-client output across different clocks and optional fields');
for(const browser of [undefined,{localStorage:{getItem(){throw Error('Storage read during initial render')}},innerWidth:320},{innerWidth:1280}]){
  const effects=[];const Context={Provider:()=>null};
  const Provider=moduleAt('components/layout/AuthUiProvider.tsx',{
    react:{createContext:()=>Context,useContext:()=>null,useState:v=>[v,()=>{}],useRef:v=>({current:v}),useEffect:fn=>effects.push(fn)},
    '@/lib/supabase/client':{createClient(){throw Error('Auth read during initial render')}},
    '@/lib/auth/browser-ui':{observeAuthUi(){throw Error('Subscription during initial render')}},
    '@/lib/auth/return-to':{safeReturnTo:v=>v},
  },{window:browser}).default;
  const tree=Provider({children:React.createElement('span',null,'content')});
  assert.equal(tree.props.value.user,null);assert.equal(tree.props.value.profile,null);
  assert.equal(effects.length,1);
}
console.log('PASS actual auth provider starts guest consistently; storage/viewport/auth work deferred to effect');
