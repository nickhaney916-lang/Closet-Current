// Real local GoTrue, PostgREST, PostgreSQL and Storage. Never a hosted project.
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {spawnSync} from 'node:child_process';
import {randomUUID,createHash} from 'node:crypto';
import {localConfig,localRequestURL} from './disposable-supabase-guard.mjs';

const cfg=localConfig(JSON.parse(await readFile(process.argv[2],'utf8')),process.env.CLOSET_DISPOSABLE_SUPABASE);
const report={httpChecks:0,accountCount:2,localOnly:true,phases:[],hostedMigrationAuthorized:false,productionPromotion:'BLOCKED'};
function sql(source,{expectFailure=false}={}){
 const result=spawnSync('psql',['-X','-q','-A','-t','-v','ON_ERROR_STOP=1','-h','127.0.0.1','-p','54322','-U','postgres','-d','postgres'],
  {input:source,encoding:'utf8',env:{...process.env,PGPASSWORD:'postgres',PGCONNECT_TIMEOUT:'5'},timeout:45000,maxBuffer:1024*1024});
 if(expectFailure){assert.ok(Number.isInteger(result.status)&&result.status>0,'Drifted recovery must fail through SQL');assert.match(result.stderr,/Public wrapper drift: recovery refused/);return;}
 assert.equal(result.status,0,'Disposable SQL failed: '+result.stderr);return result.stdout.trim();
}
const apply=async path=>sql(await readFile(path,'utf8'));
const state=async expected=>assert.equal(sql(await readFile('supabase/audits/backup-migration-state.sql','utf8')),expected+'|f|f');
async function http(actor,path,{method='GET',body,bytes,headers={}}={}){
 report.httpChecks++;
 const response=await fetch(localRequestURL(cfg.origin,path),{method,redirect:'error',signal:AbortSignal.timeout(15000),
  headers:{apikey:cfg.anon,Authorization:'Bearer '+(actor?.token||cfg.anon),...(body===undefined?{}:{'Content-Type':'application/json'}),...headers},
  body:bytes??(body===undefined?undefined:JSON.stringify(body))});
 return {status:response.status,ok:response.ok,bytes:Buffer.from(await response.arrayBuffer())};
}
const json=response=>JSON.parse(response.bytes.toString());
const success=(r,label)=>assert.ok(r.ok,label+' returned HTTP '+r.status);
const denied=(r,label)=>assert.ok([400,401,403,404,409].includes(r.status),label+' was not rejected: HTTP '+r.status);
const accounts=[];
const freshDocument=(a,label)=>({schemaVersion:1,items:[{id:'synthetic-'+a.tag,name:label,category:'Tops',color:'Blue',image:'closet-photo:'+a.photoPath}],state:{}});
const rpc=(a,expected,document)=>http(a,'/rest/v1/rpc/save_closet_backup',{method:'POST',body:{p_expected_revision:expected,p_document:document}});
async function own(a){const r=await http(a,'/rest/v1/closet_backups?select=owner_id,revision,document&owner_id=eq.'+a.id);success(r,'Owned backup read');const rows=json(r);assert.equal(rows.length,1);assert.equal(rows[0].owner_id,a.id);return rows[0];}
async function photo(a,path=a.photoPath){return http(a,'/storage/v1/object/closet-private/'+path);}
async function verifyPreserved(a,snapshot){assert.deepEqual(await own(a),snapshot,'Another account changed a backup');const r=await photo(a);success(r,'Owned photo read');assert.deepEqual(r.bytes,a.jpeg,'Private original photo bytes changed');}
async function isolation(phase){
 for(const actor of accounts){
  const victim=accounts.find(a=>a!==actor),before=await own(victim);
  const read=await http(actor,'/rest/v1/closet_backups?select=*&owner_id=eq.'+victim.id);success(read,'Other backup filtered read');assert.deepEqual(json(read),[]);
  const all=await http(actor,'/rest/v1/closet_backups?select=owner_id');success(all,'Unfiltered owned-row read');assert.deepEqual(json(all).map(r=>r.owner_id),[actor.id]);
  const patch=await http(actor,'/rest/v1/closet_backups?owner_id=eq.'+victim.id,{method:'PATCH',body:{document:freshDocument(actor,'attacker')},headers:{Prefer:'return=representation'}});
  if(patch.ok)assert.deepEqual(json(patch),[]);else denied(patch,'Cross-owner patch');
  denied(await http(actor,'/rest/v1/closet_backups',{method:'POST',body:{owner_id:victim.id,revision:99,document:freshDocument(actor,'attacker')}}),'Cross-owner insert');
  const remove=await http(actor,'/rest/v1/closet_backups?owner_id=eq.'+victim.id,{method:'DELETE',headers:{Prefer:'return=representation'}});
  if(remove.ok)assert.deepEqual(json(remove),[]);else denied(remove,'Cross-owner delete');
  denied(await photo(actor,victim.photoPath),'Cross-owner photo read');
  denied(await http(actor,'/storage/v1/object/closet-private/'+victim.photoPath,{method:'PUT',bytes:actor.jpeg,headers:{'Content-Type':'image/jpeg'}}),'Cross-owner photo overwrite');
  denied(await http(actor,'/storage/v1/object/closet-private/'+victim.photoPath,{method:'POST',bytes:actor.jpeg,headers:{'Content-Type':'image/jpeg','x-upsert':'true'}}),'Cross-owner photo upsert');
  denied(await http(actor,'/storage/v1/object/closet-private/'+victim.id+'/forged.jpg',{method:'POST',bytes:actor.jpeg,headers:{'Content-Type':'image/jpeg'}}),'Cross-owner new photo');
  const deleted=await http(actor,'/storage/v1/object/closet-private',{method:'DELETE',body:{prefixes:[victim.photoPath]}});
  if(deleted.ok)assert.deepEqual(json(deleted),[]);else denied(deleted,'Cross-owner photo delete');
  const list=await http(actor,'/storage/v1/object/list/closet-private',{method:'POST',body:{prefix:victim.id,limit:100}});success(list,'Other account photo list');assert.deepEqual(json(list),[]);
  denied(await http(actor,'/storage/v1/object/sign/closet-private/'+victim.photoPath,{method:'POST',body:{expiresIn:60}}),'Cross-owner signed photo URL');
  denied(await http(null,'/storage/v1/object/public/closet-private/'+victim.photoPath),'Public private-photo URL');
  await verifyPreserved(victim,before);
 }
 denied(await http(null,'/rest/v1/closet_backups?select=*'),'Anonymous backup read');
 denied(await rpc(null,0,{schemaVersion:1,items:[],state:{}}),'Anonymous RPC');
 denied(await photo(null,accounts[0].photoPath),'Anonymous private photo read');
 const spoof={token:accounts[0].token.slice(0,-12)+'invalid-signature'};
 denied(await http(spoof,'/rest/v1/closet_backups?select=*'),'Forged JWT');
 // Client-editable metadata must never authorize another owner.
 const edited=await http(accounts[0],'/auth/v1/user',{method:'PUT',body:{data:{owner_id:accounts[1].id,role:'service_role',is_admin:true}}});success(edited,'Synthetic user metadata edit');
 const hidden=await http(accounts[0],'/rest/v1/closet_backups?select=*&owner_id=eq.'+accounts[1].id);success(hidden,'Metadata authorization check');assert.deepEqual(json(hidden),[]);
 report.phases.push({name:phase,twoWayOwnerIsolation:true,privatePhotoIntegrity:true,anonymousAndForgedJWTDenied:true,editableMetadataNotTrusted:true});
}

// Refuse a pre-existing app database even if pointed at localhost by mistake.
assert.equal(sql("SELECT to_regclass('public.closet_backups') IS NULL AND (SELECT count(*)=0 FROM auth.users);"),'t','Disposable stack is not empty');
await apply('supabase/cloud-backup.sql');
await apply('supabase/design/closet-backup-least-privilege.DRAFT.sql');
sql("NOTIFY pgrst, 'reload schema';");
await state('LIMITED_DIRECT_WRITES');
// PostgREST reload is asynchronous; wait for table discovery, never mock it.
for(let attempt=0;;attempt++){
 const probe=await http(null,'/rest/v1/closet_backups?select=owner_id');
 if(probe.status===401)break;
 assert.ok(attempt<30,'PostgREST did not load the protected backup table');
 await new Promise(resolve=>setTimeout(resolve,300));
}

const jpeg=Buffer.from('/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAgGBgcGBQgHBwcJCQgKDBQNDAsLDBkSEw8UHRofHh0aHBwgJC4nICIsIxwcKDcpLDAxNDQ0Hyc5PTgyPC4zNDL/2wBDAQkJCQwLDBgNDRgyIRwhMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjL/wAARCAAIAAgDASIAAhEBAxEB/8QAHwAAAQUBAQEBAQEAAAAAAAAAAAECAwQFBgcICQoL/8QAtRAAAgEDAwIEAwUFBAQAAAF9AQIDAAQRBRIhMUEGE1FhByJxFDKBkaEII0KxwRVS0fAkM2JyggkKFhcYGRolJicoKSo0NTY3ODk6Q0RFRkdISUpTVFVWV1hZWmNkZWZnaGlqc3R1dnd4eXqDhIWGh4iJipKTlJWWl5iZmqKjpKWmp6ipqrKztLW2t7i5usLDxMXGx8jJytLT1NXW19jZ2uHi4+Tl5ufo6erx8vP09fb3+Pn6/8QAHwEAAwEBAQEBAQEBAQAAAAAAAAECAwQFBgcICQoL/8QAtREAAgECBAQDBAcFBAQAAQJ3AAECAxEEBSExBhJBUQdhcRMiMoEIFEKRobHBCSMzUvAVYnLRChYkNOEl8RcYGRomJygpKjU2Nzg5OkNERUZHSElKU1RVVldYWVpjZGVmZ2hpanN0dXZ3eHl6goOEhYaHiImKkpOUlZaXmJmaoqOkpaanqKmqsrO0tba3uLm6wsPExcbHyMnK0tPU1dbX2Nna4uPk5ebn6Onq8vP09fb3+Pn6/9oADAMBAAIRAxEAPwDmqKKK+yPmz//Z','base64');
for(const tag of ['a','b']){
 const email='closet-disposable-'+tag+'-'+randomUUID()+'@example.invalid',password='Only-local-'+randomUUID()+'-Aa9!';
 const signed=await http(null,'/auth/v1/signup',{method:'POST',body:{email,password}});success(signed,'Disposable signup');
 const login=await http(null,'/auth/v1/token?grant_type=password',{method:'POST',body:{email,password}});success(login,'Real password login');
 const session=json(login);assert.ok(session.access_token&&session.user?.id);
 const a={tag,id:session.user.id,token:session.access_token,jpeg:Buffer.from(jpeg)};
 const verified=await http(a,'/auth/v1/user');success(verified,'Verified Auth user');assert.equal(json(verified).id,a.id);
 a.photoPath=a.id+'/'+createHash('sha256').update(a.jpeg).digest('hex')+'.jpg';accounts.push(a);
 const upload=await http(a,'/storage/v1/object/closet-private/'+a.photoPath,{method:'POST',bytes:a.jpeg,headers:{'Content-Type':'image/jpeg'}});success(upload,'Owned JPEG upload');
 const saved=await rpc(a,0,freshDocument(a,'Initial synthetic wardrobe'));success(saved,'Initial backup RPC');assert.equal(json(saved),1);
}
assert.notEqual(accounts[0].id,accounts[1].id);
await isolation('limited-direct-writes');

await apply('supabase/design/backup-rpc-only-writes.DRAFT.sql');sql("NOTIFY pgrst, 'reload schema';");await state('RPC_ONLY_EXPECTED_CATALOG');
await isolation('rpc-only-hardened');
for(const a of accounts){
 const initial=await own(a);
 denied(await http(a,'/rest/v1/closet_backups?owner_id=eq.'+a.id,{method:'PATCH',body:{revision:999}}),'Own direct write after hardening');
 denied(await http(a,'/rest/v1/closet_backups',{method:'POST',body:{owner_id:a.id,document:initial.document,revision:999}}),'Own direct insert after hardening');
 const attempts=await Promise.all([rpc(a,initial.revision,freshDocument(a,'Concurrent one')),rpc(a,initial.revision,freshDocument(a,'Concurrent two'))]);
 attempts.forEach(r=>success(r,'Concurrent RPC'));
 assert.deepEqual(attempts.map(json).sort((x,y)=>Number(x)-Number(y)),[null,initial.revision+1]);
 const current=await own(a);assert.equal(current.revision,initial.revision+1);
 const bad=await rpc(a,current.revision,{schemaVersion:1,items:'invalid',state:{}});assert.ok(!bad.ok,'Invalid backup accepted');await verifyPreserved(a,current);
 // Inject a real database failure, then exercise REST error and retry atomically.
 sql("CREATE FUNCTION public.closet_disposable_fail_save() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN RAISE EXCEPTION 'Injected disposable save failure'; END $$; CREATE TRIGGER closet_disposable_fail_save BEFORE UPDATE ON public.closet_backups FOR EACH ROW EXECUTE FUNCTION public.closet_disposable_fail_save();");
 const failed=await rpc(a,current.revision,freshDocument(a,'Must not commit'));assert.ok(!failed.ok,'Injected failure committed');await verifyPreserved(a,current);
 sql('DROP TRIGGER closet_disposable_fail_save ON public.closet_backups; DROP FUNCTION public.closet_disposable_fail_save();');
 const retry=await rpc(a,current.revision,freshDocument(a,'Recovered save'));success(retry,'Failed-save recovery');assert.equal(json(retry),current.revision+1);
 // Simulate the caller losing an acknowledged response: retry its old revision.
 const beforeLost=await own(a),lost=await rpc(a,beforeLost.revision,freshDocument(a,'Lost reply retained'));success(lost,'Committed response-loss fixture');
 const repeated=await rpc(a,beforeLost.revision,freshDocument(a,'Lost reply retained'));success(repeated,'Old revision retry');assert.equal(json(repeated),null);
 const afterLost=await own(a);assert.equal(afterLost.revision,beforeLost.revision+1);assert.equal(afterLost.document.items.length,1);assert.equal(afterLost.document.items[0].name,'Lost reply retained');
}
report.revisionRacesAndFailedSaveRecovery=true;

const preserved=await Promise.all(accounts.map(own));
const wrapper=sql("SELECT pg_get_functiondef('public.save_closet_backup(bigint,jsonb)'::regprocedure);");
sql("CREATE OR REPLACE FUNCTION public.save_closet_backup(p_expected_revision bigint,p_document jsonb) RETURNS bigint LANGUAGE sql SECURITY INVOKER SET search_path='' AS 'SELECT NULL::bigint';");
await applyRecoveryFailure();
function applyRecoveryFailure(){return readFile('supabase/design/backup-rpc-only-writes-safe-recovery.DRAFT.sql','utf8').then(source=>sql(source,{expectFailure:true}));}
assert.equal(sql("SELECT NOT has_table_privilege('authenticated','public.closet_backups','INSERT') AND NOT has_table_privilege('authenticated','public.closet_backups','TRUNCATE') AND EXISTS(SELECT 1 FROM pg_roles WHERE rolname='closet_backup_writer');"),'t','Rejected recovery partially changed privileges');
sql(wrapper);await state('RPC_ONLY_EXPECTED_CATALOG');
await apply('supabase/design/backup-rpc-only-writes-safe-recovery.DRAFT.sql');sql("NOTIFY pgrst, 'reload schema';");await state('LIMITED_DIRECT_WRITES');
for(let i=0;i<accounts.length;i++)await verifyPreserved(accounts[i],preserved[i]);
await isolation('safe-recovered-limited');
await apply('supabase/design/backup-rpc-only-writes.DRAFT.sql');sql("NOTIFY pgrst, 'reload schema';");await state('RPC_ONLY_EXPECTED_CATALOG');
for(const a of accounts){const before=await own(a),r=await rpc(a,before.revision,freshDocument(a,'After re-hardening'));success(r,'Re-hardened save');assert.equal(json(r),before.revision+1);}
await isolation('re-hardened');
report.permissionRecoveryAndRehardening=true;
report.rejectedDriftWasAtomic=true;
report.fullResolutionRecognitionSourceChanged=false;
console.log('DISPOSABLE_SUPABASE_SECURITY_PASS '+JSON.stringify(report));
