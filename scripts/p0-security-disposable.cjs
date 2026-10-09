// Isolated SQL integration harness. No URLs, credentials or project refs accepted.
// Requires a locally cached postgres:17 image; no pull, ports or container network.
const fs=require('node:fs'),cp=require('node:child_process'),crypto=require('node:crypto');
const available=cp.spawnSync('docker',['version'],{encoding:'utf8',windowsHide:true,timeout:10000});
if(available.error||available.status!==0){console.log('NOT RUN: Docker engine unavailable; no database contacted.');process.exit(2)}
const name='gigway-p0-disposable-'+crypto.randomBytes(8).toString('hex');let created=false;
function run(args,input){const r=cp.spawnSync('docker',args,{input,encoding:'utf8',windowsHide:true,timeout:60000});if(r.error||r.status!==0)throw Error(r.error?.message||r.stderr);return r.stdout}
try{
  run(['run','--detach','--pull=never','--network','none','--name',name,'-e','POSTGRES_PASSWORD=disposable-test-only','-e','POSTGRES_DB=gigway_p0_disposable','postgres:17']);created=true;
  run(['exec',name,'sh','-c','for i in $(seq 1 30); do pg_isready -U postgres -d gigway_p0_disposable && exit 0; sleep 1; done; exit 1']);
  for(const f of ['supabase/tests/p0-security-fixture.sql','supabase/migrations/20261008053956_p0_profile_privileges_and_membership_lockdown.sql','supabase/migrations/20261008053956_p0_profile_privileges_and_membership_lockdown.sql','supabase/tests/p0-security-denials.sql']){
    run(['exec','-i',name,'psql','-X','-v','ON_ERROR_STOP=1','-U','postgres','-d','gigway_p0_disposable'],fs.readFileSync(f,'utf8'));
  }
  console.log('PASS isolated PostgreSQL grants/RLS/view/trigger/owner-edit and repeat-apply assertions. Synthetic foundation only.');
}catch(error){console.error(error.message);process.exitCode=1}finally{if(created)run(['rm','--force',name])}
