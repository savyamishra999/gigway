const assert = require('node:assert/strict');
const fs = require('node:fs');
const ts = require('typescript');
const vm = require('node:vm');
let calls = [], failure = false;
const db = { from(table) {
  let ids, id, viewer;
  const q = { select() { return q; }, eq(key, value) { if (key === 'follower_user_id') viewer = value; else id = value; return q; }, in(_, values) { ids = values; return q; },
    then(resolve) { calls.push({ table, ids, viewer }); const key = table === 'profile_follows' ? 'followed_profile_id' : 'organization_id'; resolve({ data: (ids || [id]).filter(value => value === 'followed' || value === 'org-followed').map(value => ({ [key]: value })), error: failure ? {} : null }); },
    async maybeSingle() { let result; await q.then(value => result = value); return { ...result, data: result.data[0] || null }; },
  }; return q;
} };
const moduleUnderTest = { exports: {} };
const code = ts.transpileModule(fs.readFileSync('lib/social/server.ts', 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText;
vm.runInNewContext(code, { module: moduleUnderTest, exports: moduleUnderTest.exports, process: { env: { NEXT_PUBLIC_SUPABASE_URL: 'https://audit.invalid', SUPABASE_SERVICE_ROLE_KEY: 'dummy' } }, require: name => {
  if (name === '@supabase/supabase-js') return { createClient: () => db };
  if (['@/lib/supabase/server','@/lib/async','@/lib/social/vijox-timed-reactions','@/lib/social/content-domain','@/lib/social/gigthought'].includes(name)) return {};
  throw Error(name);
} });
(async () => {
  const { visiblePosts, canViewPost } = moduleUnderTest.exports;
  const rows = [
    { id: 'public', status: 'published', visibility: 'public' },
    { id: 'draft', status: 'draft', visibility: 'public', author_user_id: 'viewer' },
    { id: 'own', status: 'published', visibility: 'followers', author_user_id: 'viewer' },
    { id: 'followed', status: 'published', visibility: 'followers', author_profile_id: 'followed' },
    { id: 'private', status: 'published', visibility: 'followers', author_profile_id: 'not-followed' },
    { id: 'org', status: 'published', visibility: 'followers', author_organization_id: 'org-followed' },
    { id: 'org-private', status: 'published', visibility: 'followers', author_organization_id: 'other-org' },
    { id: 'both-author-fields', status: 'published', visibility: 'followers', author_profile_id: 'not-followed', author_organization_id: 'org-followed' },
  ].map(row => ({ author_user_id: "author", ...row }));
  for (const viewer of [undefined, 'viewer', 'other']) {
    const previous = [];
    for (const row of rows) if (await canViewPost(row, viewer)) previous.push(row.id);
    calls = [];
    const result = await visiblePosts(rows, viewer);
    assert.equal(result.map(row => row.id).join(','), previous.join(','));
    assert.equal(calls.length, viewer ? 2 : 0);
    for (const call of calls) assert.equal(call.viewer, viewer);
  }
  calls = []; const repeated = Array.from({ length: 40 }, (_, i) => ({ ...rows[3], id: String(i) }));
  assert.equal((await visiblePosts(repeated, 'viewer')).length, 40); assert.equal(calls.length, 1); assert.equal(calls[0].ids.length, 1);
  failure = true; await assert.rejects(visiblePosts(rows, 'viewer'));
  console.log('PASS: batched visibility matches existing public/own/follower/organization/draft rules, preserves author precedence and ordering, deduplicates author lookups, and fails closed. No live database.');
})().catch(error => { console.error(error); process.exitCode = 1; });
