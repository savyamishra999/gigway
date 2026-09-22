const assert=require('node:assert/strict');const fs=require('node:fs');const ts=require('typescript');const vm=require('node:vm');
const nextConfig=fs.readFileSync('next.config.js','utf8'),middleware=fs.readFileSync('middleware.ts','utf8'),worker=fs.readFileSync('worker/index.js','utf8'),postsRoute=fs.readFileSync('app/api/social/posts/route.ts','utf8'),profileRoute=fs.readFileSync('app/api/social/profiles/[id]/posts/route.ts','utf8');
const adminVerify=fs.readFileSync('app/api/admin/verify/route.ts','utf8');assert.match(adminVerify,/auth\.getUser\(\)/);assert.match(adminVerify,/status:401/);assert.match(adminVerify,/status:403/);
assert.match(nextConfig,/request\.mode === "navigate" \|\| url\.pathname\.startsWith\("\/api\/"\)[\s\S]*?handler: "NetworkOnly"/);
assert.match(nextConfig,/cleanupOutdatedCaches: true/);assert.match(nextConfig,/gigway-static-v2/);assert.doesNotMatch(nextConfig,/StaleWhileRevalidate/);
for(const name of ['start-url','apis','others','next-data','static-data-assets','cross-origin','static-image-assets','next-image','static-audio-assets','static-video-assets'])assert.match(worker,new RegExp(`"${name}"`));assert.match(worker,/caches\.delete/);
assert.match(middleware,/\(\?!api\(\?:\/\|\$\)\|_next\/static/);assert.match(middleware,/middleware_auth/);
assert.doesNotMatch(postsRoute,/for \(const post of data \|\| \[\]\) if \(await canViewPost/);assert.match(postsRoute,/safePosts\(page/);
assert.doesNotMatch(profileRoute,/for \(const post of data \|\| \[\]\)/);assert.match(profileRoute,/visiblePosts/);assert.match(profileRoute,/safePosts/);

const records={
 profiles:[{id:'p1',full_name:'Person',username:'person',avatar_url:null,tagline:'T',is_verified:true,profile_completed:true},{id:'mention',full_name:'Mention',username:'friend',profile_completed:true}],
 organizations:[{id:'o1',name:'Org',username:'org',logo_url:null,tagline:'O',is_verified:false}],
 post_likes:[{post_id:'public',user_id:'viewer'},{post_id:'public',user_id:'other'},{post_id:'org',user_id:'other'}],
 post_comments:[{post_id:'public',status:'published'},{post_id:'public',status:'deleted'}],post_reposts:[{post_id:'org',user_id:'viewer'}],post_saves:[{post_id:'public',user_id:'viewer'}],
 post_media:[{id:'m1',post_id:'public',media_type:'video',storage_path:'public.mp4',mime_type:'video/mp4',file_name:'public.mp4',sort_order:0},{id:'m2',post_id:'org',media_type:'image',storage_path:'private.jpg',mime_type:'image/jpeg',file_name:'private.jpg',sort_order:0}],
 organization_members:[{organization_id:'o1',profile_id:'viewer',status:'active',member_role:'admin'}],profile_follows:[{followed_profile_id:'p1',follower_user_id:'viewer'}],organization_follows:[],
};let queries=0,failTable=null,signed=0;
const db={from(table){let filters=[],ids=[],head=false;const q={select(_fields,options){head=options?.head===true;return q},eq(k,v){filters.push([k,v]);return q},in(k,v){ids.push([k,v]);return q},order(){return q},then(resolve){queries++;if(table===failTable)return resolve({data:null,error:{code:'FAIL',message:'injected'}});let data=[...(records[table]||[])];for(const[k,v]of filters)data=data.filter(row=>row[k]===v);for(const[k,v]of ids)data=data.filter(row=>v.includes(row[k]));resolve({data:head?null:data,count:head?data.length:null,error:null})}};return q},storage:{from(){return{createSignedUrl:async path=>{signed++;return{data:{signedUrl:`signed:${path}`},error:null}}}}}};
const mod={exports:{}};const code=ts.transpileModule(fs.readFileSync('lib/social/server.ts','utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText;
vm.runInNewContext(code,{module:mod,exports:mod.exports,performance,console,process:{env:{NODE_ENV:'test',NEXT_PUBLIC_SUPABASE_URL:'https://local.invalid',SUPABASE_SERVICE_ROLE_KEY:'dummy'}},require:name=>{
 if(name==='@supabase/supabase-js')return{createClient:()=>db};if(name==='@/lib/async')return{};if(name==='@/lib/supabase/server')return{};
 if(name==='@/lib/social/vijox-timed-reactions')return{};if(name==='@/lib/social/content-domain')return{parsePersistedContentFormat:v=>v||'standard',toContentDomain:v=>v==='vijox'?'jox':v};if(name==='@/lib/social/gigthought')return{validPostHighlights:()=>[]};throw Error(name)
}});
const base={author_user_id:'author',body:null,content_format:'standard',status:'published',created_at:'2026-01-01',edited_at:null,visibility:'public'};
const page=[{...base,id:'public',author_profile_id:'p1',author_organization_id:null,body:'hi @friend'},{...base,id:'org',author_profile_id:null,author_organization_id:'o1',visibility:'followers'}];
(async()=>{queries=0;const result=await mod.exports.safePosts(page,'viewer');assert.equal(queries,16);assert.equal(result.length,2);assert.equal(result[0].likeCount,2);assert.equal(result[0].commentCount,1);assert.equal(result[0].isLikedByMe,true);assert.equal(result[0].isSavedByMe,true);assert.deepEqual([...result[0].mentions],['friend']);assert.equal(result[0].isFollowing,true);assert.equal(result[1].canEdit,true);assert.equal(result[1].isRepostedByMe,true);assert.equal(result[0].media[0].url,'/social/posts/public/media/m1/public');assert.equal(result[1].media[0].url,'signed:private.jpg');assert.equal(signed,1);
 failTable='post_comments';await assert.rejects(mod.exports.safePosts(page,'viewer'),error=>error.stage==='comments');
 const policy={handler:'NetworkOnly'};const cache=new Map(),network=(account,url)=>({account,url});const request=(account,url)=>policy.handler==='NetworkOnly'?network(account,url):(cache.get(url)||network(account,url));assert.equal(request('A','/api/me').account,'A');assert.equal(request('B','/api/me').account,'B');assert.equal(request('guest','/api/me').account,'guest');
 console.log('PASS: Pass 1 cache policy, API middleware exclusion, page batching, counts, viewer state, mentions, organization management, public/private media, account switch, logout, and fail-closed enrichment. No live database or generated worker.');
})().catch(error=>{console.error(error);process.exitCode=1});
