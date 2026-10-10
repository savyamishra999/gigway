// Isolated in-memory PostgreSQL. No Docker, network or production credentials.
const assert=require('node:assert/strict'),fs=require('node:fs');
const {PGlite}=require('@electric-sql/pglite');
const alice='11111111-1111-4111-8111-111111111111',bob='22222222-2222-4222-8222-222222222222';
const a='aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',b='bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb';
async function main(){
  const db=new PGlite();
  try{
    await db.exec(`create role anon; create role authenticated; create role service_role bypassrls;
      create schema auth; create table auth.users(id uuid primary key);
      create function auth.uid() returns uuid language sql stable as $$ select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid $$;
      grant usage on schema auth,public to anon,authenticated,service_role;
      insert into auth.users values ('${alice}'),('${bob}');`);
    await db.exec(fs.readFileSync('supabase/migrations/20261010150000_gigcard_paid_cards.sql','utf8'));
    const one=async(sql,params=[])=> (await db.query(sql,params)).rows[0];
    for(const fn of ['gigcard_save(uuid,uuid,integer,jsonb)','gigcard_reserve_order(uuid,uuid,text)','gigcard_attach_order(uuid,uuid,text)','gigcard_settle(uuid,text,text,integer,text,boolean)']){
      assert.equal((await one('select has_function_privilege($1,$2,$3) as allowed',['authenticated','public.'+fn,'EXECUTE'])).allowed,false);
      assert.equal((await one('select has_function_privilege($1,$2,$3) as allowed',['anon','public.'+fn,'EXECUTE'])).allowed,false);
      assert.equal((await one('select has_function_privilege($1,$2,$3) as allowed',['service_role','public.'+fn,'EXECUTE'])).allowed,true);
    }
    await db.exec('set role service_role');
    const save=(id,owner,revision=0)=>one('select public.gigcard_save($1,$2,$3,$4::jsonb) as card',[id,owner,revision,JSON.stringify({details:{name:'Fixture'}})]);
    assert.equal((await save(a,alice)).card.revision,1);
    await assert.rejects(save(a,bob,1),/not found/);
    await assert.rejects(save(a,alice,0),/changed/);
    assert.equal((await save(a,alice,1)).card.revision,2);
    await save(b,bob);
    await assert.rejects(one('select public.gigcard_reserve_order($1,$2,$3)',[a,bob,'test']),/not found/);
    const reserve=async(card,owner)=>(await one('select public.gigcard_reserve_order($1,$2,$3) as payment',[card,owner,'test'])).payment;
    const o=await reserve(a,alice),again=await reserve(a,alice);assert.equal(o.new_order,true);assert.equal(again.new_order,false);assert.equal(o.id,again.id);
    await assert.rejects(one('select public.gigcard_reserve_order($1,$2,$3)',[a,alice,'live']),/mode mismatch/);
    await one('select public.gigcard_attach_order($1,$2,$3)',[o.id,alice,'order_Alpha']);
    await assert.rejects(one('select public.gigcard_attach_order($1,$2,$3)',[o.id,alice,'order_Other']),/attached/);
    const settle=async(order,payment='pay_Alpha',refund=false,amount=9900)=>(await one('select public.gigcard_settle($1,$2,$3,$4,$5,$6) as payment',[order,'order_Alpha',payment,amount,'INR',refund])).payment;
    await assert.rejects(settle(o.id,'pay_Alpha',false,1),/does not match/);
    assert.equal((await settle(o.id)).status,'paid');assert.equal((await settle(o.id)).status,'paid');
    assert.equal((await one('select count(*)::int as n from public.gigcard_orders')).n,1);
    const other=await reserve(b,bob);await one('select public.gigcard_attach_order($1,$2,$3)',[other.id,bob,'order_Beta']);
    await assert.rejects(one('select public.gigcard_settle($1,$2,$3,9900,$4,false)',[other.id,'order_Beta','pay_Alpha','INR']),/unique/);
    assert.equal((await one('select status from public.gigcard_orders where id=$1',[other.id])).status,'created','failed duplicate payment must roll back');
    assert.equal((await settle(o.id,'pay_Alpha',true)).status,'refunded');
    assert.equal((await settle(o.id,'pay_Alpha',false)).status,'refunded','late captured event must not undo refund');
    await db.exec('set role authenticated');await db.query("select set_config('request.jwt.claim.sub',$1,false)",[alice]);
    assert.deepEqual((await db.query('select id from public.gigcard_designs')).rows.map(x=>x.id),[a]);
    await assert.rejects(db.query("update public.gigcard_designs set revision=99 where id=$1",[a]),/permission denied/);
    await assert.rejects(db.query('select * from public.gigcard_orders'),/permission denied/);
    await assert.rejects(save(a,alice,2),/permission denied/);
    await db.exec('set role anon');await assert.rejects(db.query('select * from public.gigcard_designs'),/permission denied/);
    await db.exec('set role service_role');
    for(let i=1;i<20;i++)await save(`cccccccc-cccc-4ccc-8ccc-${String(i).padStart(12,'0')}`,alice);
    await assert.rejects(save('dddddddd-dddd-4ddd-8ddd-dddddddddddd',alice),/limit reached/);
    console.log('PASS real isolated PostgreSQL: migration, owner RLS, denied direct writes/RPCs, revision conflicts, one order per card, immutable provider binding, duplicate payment rollback, refund monotonicity and card quota. No production DB; no multi-session concurrency proof.');
  }finally{await db.close()}
}
main().catch(error=>{console.error(error);process.exitCode=1});
