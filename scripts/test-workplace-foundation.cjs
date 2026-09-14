const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const ts = require('typescript');
function load(file, dependencies) {
  const module = { exports: {} };
  const code = ts.transpileModule(fs.readFileSync(file, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText;
  vm.runInNewContext(code, { module, exports: module.exports, require: name => { if (!(name in dependencies)) throw Error(name); return dependencies[name]; }, process: { env: { NEXT_PUBLIC_SUPABASE_URL: 'https://example.invalid', SUPABASE_SERVICE_ROLE_KEY: 'test-only' } } });
  return module.exports;
}
let state = {}, calls = [];
const identity = load('lib/identity.ts', {});
const { checkUsernameClaim } = load('lib/identity/username-server.ts', {
  'server-only': {}, '@/lib/identity': identity,
  '@supabase/supabase-js': { createClient: () => ({ from(table) {
    let pattern, excluded;
    return { select() { return this; }, ilike(_, value) { pattern = value; return this; }, neq(_, id) { excluded = id; return this; }, async limit() {
      calls.push({ table, pattern, excluded });
      if (state[table] === 'error') return { data: null, error: {} };
      if (state[table] === 'throw') throw Error('network failure');
      const handle = pattern.replace(/\\_/g, '_');
      return { data: (state[table] || []).filter(row => row.username.toLowerCase() === handle && row.id !== excluded), error: null };
    } };
  } }) }
});
(async () => {
 let count = 0;
 async function check(label, fn) { state = {}; calls = []; await fn(); console.log('PASS ' + label); count++; }
 await check('normalize an available handle', async () => { const r = await checkUsernameClaim('  Free.Name  '); assert.equal(r.username, 'free.name'); assert.equal(r.status, 200); assert.equal(calls.length, 2); });
 for (const table of ['profiles', 'organizations']) {
   await check('reject existing ' + table + ' handle for a new claim', async () => { state[table] = [{ id: 'other', username: 'Taken' }]; assert.equal((await checkUsernameClaim('taken')).status, 409); });
   await check('allow unchanged own handle in ' + table, async () => { state[table] = [{ id: 'own', username: 'mine' }]; assert.equal((await checkUsernameClaim('mine', { table, id: 'own' })).status, 200); });
   await check('reject update to another handle in ' + table, async () => { state[table] = [{ id: 'other', username: 'taken' }]; assert.equal((await checkUsernameClaim('taken', { table, id: 'own' })).status, 409); });
   await check('own ID cannot exclude the other entity table: ' + table, async () => { const other = table === 'profiles' ? 'organizations' : 'profiles'; state[other] = [{ id: 'own', username: 'mine' }]; assert.equal((await checkUsernameClaim('mine', { table, id: 'own' })).status, 409); });
   await check('fail closed on ' + table + ' query errors', async () => { state[table] = 'error'; assert.equal((await checkUsernameClaim('valid')).status, 503); });
 }
 await check('fail closed on network failure', async () => { state.profiles = 'throw'; assert.equal((await checkUsernameClaim('valid')).status, 503); });
 await check('escape literal underscores', async () => { state.profiles = [{ id: 'other', username: 'axb' }]; assert.equal((await checkUsernameClaim('a_b')).status, 200); assert.equal(calls[0].pattern, 'a\\_b'); });
 await check('reject reserved, empty, wildcard and malformed handles before DB calls', async () => { for (const value of ['admin', '', null, {}, 'ab', 'a%b', 'with space']) assert.equal((await checkUsernameClaim(value)).status, 400); assert.equal(calls.length, 0); });
 const { activeWorkplaces } = load('lib/organizations/server.ts', { 'server-only': {} });
 await check('active memberships: owner/admin manage, member only views; no private fields selected', async () => {
   const filters = [];
   const db = { from(table) { assert.equal(table, 'organization_members'); return { select(fields) { assert.equal(fields, 'member_role, organizations(id,name,username,logo_url)'); return this; }, eq(key,value) { filters.push([key,value]); if(key === 'status') return Promise.resolve({data: ['owner','admin','member'].map((role,i) => ({member_role:role, organizations:{id:String(i), name:role, username:role, logo_url:null}})), error:null}); return this; } }; } };
   const rows = await activeWorkplaces(db, 'professional');
   assert.deepEqual(filters, [['profile_id','professional'],['status','active']]);
   assert.equal(rows.find(r=>r.role==='owner').canManage,true); assert.equal(rows.find(r=>r.role==='admin').canManage,true); assert.equal(rows.find(r=>r.role==='member').canManage,false);
 });
 await check('empty memberships and query failure are distinct', async () => {
   const db = error => ({from(){return{select(){return this},eq(key){return key==='status'?Promise.resolve({data:[],error}):this}}}});
   assert.equal((await activeWorkplaces(db(null),'own')).length,0);
   await assert.rejects(()=>activeWorkplaces(db({}),'own'));
 });
 const routes = [
   ['app/api/identity/complete/route.ts', 'POST'],
   ['app/api/profile/route.ts', 'PATCH'],
   ['app/api/organizations/create/route.ts', 'POST'],
   ['app/api/organizations/[username]/route.ts', 'PATCH'],
 ];
 for (const [file, method] of routes) {
   for (const status of [409, 503, 200]) await check(`${file}: final check ${status}${status === 200 ? ' then duplicate write' : ' blocks write'}`, async () => {
     const events = [];
     const db = { auth: { getUser: async () => ({data:{user:{id:'own'}}}) }, from(table) {
       let writing = false;
       return {
         select(){return this}, eq(){return this},
         async maybeSingle(){return {data:table === 'organization_members' ? {member_role:'owner'} : {id:'own',user_roles:[],portfolio_links:[]},error:null}},
         insert(){writing=true; events.push('write'); return this}, update(){writing=true; events.push('write'); return this},
         async single(){return {data:null,error:{code:'23505'}}},
         then(resolve){resolve({data:null,error:writing?{code:'23505'}:null})},
       };
     } };
     const route = load(file, {
       '@/lib/supabase/server': {createClient:async()=>db},
       '@supabase/supabase-js': {createClient:()=>db},
       'next/server': {NextResponse:{json:(body,options)=>({body,status:options?.status||200})}},
       '@/lib/identity': identity,
       '@/lib/roles': {resolveRoles:()=>({isConfigured:true})},
       '@/lib/billing/limits': {getUsageLimit:async()=>({allowed:true}),limitResponse:()=>({})},
       '@/lib/identity/username-server': {
         USERNAME_UNAVAILABLE:'That username is unavailable. Please choose another.',
         checkUsernameClaim:async(value,current)=>{events.push('check'); assert.equal(value,'claimed'); if(file.includes('/profile/') || file.includes('/identity/')) assert.equal(current.table,'profiles'); if(file.includes('[username]')) assert.equal(current.table,'organizations'); return {username:'claimed',status,error:status===200?null:'unavailable'}},
       },
     });
     const result = await route[method]({json:async()=>({fullName:'Professional',name:'Workplace',username:'claimed',modes:[]})},{params:Promise.resolve({username:'old'})});
     assert.equal(result.status,status===200?409:status);
     assert.deepEqual(events,status===200?['check','write']:['check']);
     if(status===200) assert.equal(result.body.error,'That username is unavailable. Please choose another.');
   });
 }
 console.log(`${count} checks passed. No live database calls.`);
})().catch(error => { console.error(error); process.exitCode = 1; });
