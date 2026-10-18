const assert=require('node:assert/strict'),fs=require('node:fs');
const {PGlite}=require('@electric-sql/pglite');
const alice='11111111-1111-4111-8111-111111111111',bob='22222222-2222-4222-8222-222222222222';
async function main(){
 const db=new PGlite();
 try{
  await db.exec(`create role anon;create role authenticated;create role service_role bypassrls;create schema auth;create table auth.users(id uuid primary key);grant usage on schema auth,public to anon,authenticated,service_role;insert into auth.users values ('${alice}'),('${bob}');`);
  await db.exec(fs.readFileSync('supabase/migrations/20261018090000_utility_products.sql','utf8'));
  const one=async(sql,args=[])=>(await db.query(sql,args)).rows[0];
  for(const table of ['utility_documents','utility_orders','utility_verifications','utility_generation_attempts']){
   for(const role of ['anon','authenticated'])for(const action of ['SELECT','INSERT','UPDATE','DELETE'])
    assert.equal((await one('select has_table_privilege($1,$2,$3) as ok',[role,'public.'+table,action])).ok,false);
  }
  for(const fn of ['utility_reserve_document(uuid,text,text,text,text)','utility_reserve_order(uuid,text,uuid,text)','utility_settle_order(uuid,text,text,integer,boolean)','utility_publish_pitch(uuid,uuid,boolean,jsonb)'])
   for(const role of ['anon','authenticated'])assert.equal((await one('select has_function_privilege($1,$2,$3) as ok',[role,'public.'+fn,'EXECUTE'])).ok,false);
  await db.exec('set role service_role');
  const document=async(owner,kind,hash)=>(await one('select utility_reserve_document($1,$2,$3,$4,$5) as d',[owner,kind,hash.repeat(64).slice(0,64),'Fixture','live'])).d;
  const pitch=await document(alice,'pitch','a');
  assert.equal(pitch.generate,true);
  await assert.rejects(document(alice,'pitch','a'),/Generation in progress/);
  await assert.rejects(document(alice,'pitch','b'),/PRO_REQUIRED/);
  await db.query("update utility_documents set status='failed' where id=$1",[pitch.id]);
  const retry=await document(alice,'pitch','a');assert.equal(retry.id,pitch.id);
  await db.query("update utility_documents set status='ready',result=$2 where id=$1",[pitch.id,JSON.stringify({title:'Fixture',pitch:'Example',coverLetter:'Example'})]);
  assert.equal((await document(alice,'pitch','a')).generate,false);
  await assert.rejects(document(alice,'pitch','b'),/PRO_REQUIRED/);
  const resume=await document(alice,'resume','c');
  const reserve=async(owner,product,doc=null,mode='live')=>(await one('select utility_reserve_order($1,$2,$3,$4) as o',[owner,product,doc,mode])).o;
  await assert.rejects(reserve(alice,'resume_report',resume.id),/Report not found/);
  await db.query("update utility_documents set status='ready',result='{}' where id=$1",[resume.id]);
  await assert.rejects(reserve(bob,'resume_report',resume.id),/Report not found/);
  const order=await reserve(alice,'resume_report',resume.id);
  assert.equal(order.amount_paise,4900);
  assert.equal((await reserve(alice,'resume_report',resume.id)).id,order.id);
  await db.query("update utility_orders set provider_order='order_One',status='created' where id=$1",[order.id]);
  const settle=async(id,porder,payment,amount,refund=false)=>(await one('select utility_settle_order($1,$2,$3,$4,$5) as o',[id,porder,payment,amount,refund])).o;
  await assert.rejects(settle(order.id,'order_One','pay_One',1),/does not match/);
  const paid=await settle(order.id,'order_One','pay_One',4900);assert.equal(paid.status,'paid');
  assert.equal((await settle(order.id,'order_One','pay_One',4900)).paid_at,paid.paid_at);
  await assert.rejects(settle(order.id,'order_One','pay_Other',4900),/already attached/);
  assert.equal((await settle(order.id,'order_One','pay_One',4900,true)).status,'refunded');
  assert.equal((await settle(order.id,'order_One','pay_One',4900)).status,'refunded');
  const pro=await reserve(alice,'pitch_pro');
  await db.query("update utility_orders set provider_order='order_Pro',status='created' where id=$1",[pro.id]);
  const active=await settle(pro.id,'order_Pro','pay_Pro',14900);
  assert.equal(Math.round((Date.parse(active.expires_at)-Date.parse(active.paid_at))/86400000),30);
  assert.equal((await settle(pro.id,'order_Pro','pay_Pro',14900)).expires_at,active.expires_at);
  const second=await document(alice,'pitch','b');
  await db.query("update utility_documents set status='ready',result='{}' where id=$1",[second.id]);
  const publish=(owner,id,yes)=>one('select utility_publish_pitch($1,$2,$3,$4::jsonb)',[owner,id,yes,JSON.stringify({title:'Pitch',pitch:'Text',coverLetter:'Letter'})]);
  await assert.rejects(publish(bob,pitch.id,true),/not found/);
  await publish(alice,pitch.id,true);await publish(alice,second.id,true);
  assert.equal((await one('select count(*)::int as n from utility_documents where published')).n,1);
  await publish(alice,second.id,false);
  assert.equal((await one('select count(*)::int as n from utility_documents where published')).n,0);
  await assert.rejects(reserve(alice,'professional_verified'),/approved before payment/);
  await db.query("insert into utility_verifications(owner_id,evidence,status) values ($1,'Reviewed fixture','approved')",[alice]);
  const verified=await reserve(alice,'professional_verified');
  await db.query("update utility_orders set provider_order='order_Verified',status='created' where id=$1",[verified.id]);
  const badge=await settle(verified.id,'order_Verified','pay_Verified',29900);
  assert.equal(Math.round((Date.parse(badge.expires_at)-Date.parse(badge.paid_at))/86400000),365);
  // Test-mode payment cannot enable live generation.
  const test=await reserve(bob,'pitch_pro',null,'test');
  await db.query("update utility_orders set status='paid',expires_at=now()+interval '30 days' where id=$1",[test.id]);
  const bp=await document(bob,'pitch','d');
  await db.query("update utility_documents set status='ready',result='{}' where id=$1",[bp.id]);
  await assert.rejects(document(bob,'pitch','e'),/PRO_REQUIRED/);
  // Expired access does not grant further free generations.
  await db.query("update utility_orders set expires_at=now()-interval '1 day' where id=$1",[pro.id]);
  await assert.rejects(document(alice,'pitch','f'),/PRO_REQUIRED/);
  // Direct client bypass is denied even for the row owner.
  await db.exec('reset role;set role authenticated');
  await assert.rejects(db.query('select result from utility_documents'),/permission denied/);
  await assert.rejects(db.query("update utility_orders set status='paid'"),/permission denied/);
  console.log('PASS: private report isolation, service-only RPCs, free-pitch reservation, deduplication, payment amounts/ownership/idempotency/refunds, expiry, mode isolation and publish controls.');
 }finally{await db.close()}
}
main().catch(e=>{console.error(e);process.exitCode=1});
