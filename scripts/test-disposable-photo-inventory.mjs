// Disposable LOCAL Supabase Storage inventory acceptance, never hosted cleanup.
// Requires a fresh local stack already configured by the 207-check security QA.
// Two invented owners and generated 2x2 synthetic JPEGs only.
import assert from 'node:assert/strict';
import {createHash,randomUUID} from 'node:crypto';
import {readFile} from 'node:fs/promises';
import {localConfig,localRequestURL} from './disposable-supabase-guard.mjs';
import {jpeg} from '../tests/helpers/issue196-deletion-fixture.mjs';

const cfg=localConfig(JSON.parse(await readFile(process.argv[2],'utf8')),process.env.CLOSET_DISPOSABLE_SUPABASE);
const report={localOnly:true,hostedConnections:0,accountCount:2,httpChecks:0,storageDeletes:0,
  authDeletes:0,customerPhotos:0,realAppSourceModified:false};
const pause=ms=>new Promise(resolve=>setTimeout(resolve,ms));
async function req(actor,path,{method='GET',body,bytes,headers={}}={}){
 report.httpChecks++;
 const resp=await fetch(localRequestURL(cfg.origin,path),{
  method,signal:AbortSignal.timeout(20000),redirect:'error',
  headers:{apikey:cfg.anon,Authorization:'Bearer '+(actor?.token||cfg.anon),
   ...(body===undefined?{}:{'Content-Type':'application/json'}),...headers},
  body:bytes??(body===undefined?undefined:JSON.stringify(body))
 });
 return {status:resp.status,ok:resp.ok,body:Buffer.from(await resp.arrayBuffer())};
}
const data=r=>JSON.parse(r.body.toString());
function success(r,msg){assert.ok(r.ok,msg+' HTTP '+r.status+' '+r.body.toString().slice(0,140));}
async function account(tag){
 const email='closet-local-inventory-'+tag+'-'+randomUUID()+'@example.invalid';
 const password='Only-local-'+randomUUID()+'-Aa9!';
 success(await req(null,'/auth/v1/signup',{method:'POST',body:{email,password}}),'Local signup');
 const r=await req(null,'/auth/v1/token?grant_type=password',{method:'POST',body:{email,password}});
 success(r,'Local login');const body=data(r);assert.ok(body.user?.id&&body.access_token);
 return {id:body.user.id,token:body.access_token,tag};
}
async function upload(a,label){
 const bytes=jpeg('inventory-'+label),digest=createHash('sha256').update(bytes).digest('hex');
 const path=a.id+'/'+digest+'.jpg';
 const response=await req(a,'/storage/v1/object/closet-private/'+path,{method:'POST',
  bytes,headers:{'Content-Type':'image/jpeg'}});success(response,'Owner-only synthetic upload');
 return {path,name:digest+'.jpg',digest,bytes};
}
async function list(a,prefix,offset=0,limit=35){
 const r=await req(a,'/storage/v1/object/list/closet-private',{
  method:'POST',body:{prefix,limit,offset,sortBy:{column:'name',order:'asc'}}});
 success(r,'Owner-scoped Storage list');
 const rows=data(r);assert.ok(Array.isArray(rows),'Storage listing must be an array');
 assert.ok(rows.length<=limit,'Storage listing exceeded requested page size');
 return rows;
}
async function inventory(a,owner=a.id){
 const found=[],seen=new Set(),limit=35;let pages=0;
 for(let offset=0;offset<1000;offset+=limit){
  const rows=await list(a,owner,offset,limit);pages++;
  for(const x of rows){
   assert.match(x.name,/^[a-f0-9]{64}\.jpg$/,'Refuse unexpected/nested Storage path');
   assert.ok(!seen.has(x.name),'Duplicate object returned across pages');
   seen.add(x.name);found.push(x.name);
  }
  if(rows.length<limit)break;
 }
 assert.ok(pages<30,'Owner inventory exceeded controlled fixture bounds');
 const sorted=[...found].sort();
 const fingerprint=createHash('sha256').update(sorted.join('\n')).digest('hex');
 return {count:found.length,pages,names:sorted,fingerprint};
}
const [a,b]=await Promise.all([account('A'),account('B')]);
assert.notEqual(a.id,b.id);
const first=await upload(a,'referenced-original');
const second=await upload(b,'same-clothing-original');

// Exactly one A photo is referenced by live cloud metadata. The others are
// valid owner uploads with no committed backup reference (potential orphans).
const doc={schemaVersion:1,items:[{id:'owned-a',name:'Synthetic owned top',
  category:'Tops',color:'Blue',image:'closet-photo:'+first.path}],state:{}};
const saved=await req(a,'/rest/v1/rpc/save_closet_backup',{method:'POST',
 body:{p_expected_revision:0,p_document:doc}});
success(saved,'Owner cloud metadata');assert.equal(data(saved),1);
const expected=new Set([first.name]);
const photos=[];
for(let i=0;i<122;i+=6){
 const block=Array.from({length:Math.min(6,122-i)},(_,j)=>upload(a,'unreferenced-'+(i+j)));
 photos.push(...await Promise.all(block));
 for(const p of photos.slice(-Math.min(6,122-i)))expected.add(p.name);
}
const before=await inventory(a);
assert.equal(before.count,123);assert.ok(before.pages>=4);
assert.deepEqual(before.names,[...expected].sort());
const ownB=await inventory(b);assert.equal(ownB.count,1);
assert.deepEqual(ownB.names,[second.name]);
const aCannotListB=await inventory(a,b.id),bCannotListA=await inventory(b,a.id);
assert.equal(aCannotListB.count,0);
assert.equal(bCannotListA.count,0);
const foreignRead=await req(b,'/storage/v1/object/closet-private/'+first.path);
assert.ok([400,401,403,404].includes(foreignRead.status),'B read A original');
const anonList=await list(null,a.id);assert.equal(anonList.length,0);
const anonPhoto=await req(null,'/storage/v1/object/closet-private/'+first.path);
assert.ok([400,401,403,404].includes(anonPhoto.status));

const backing=await req(a,'/rest/v1/closet_backups?select=revision,document&owner_id=eq.'+a.id);
success(backing,'Owner backup read');const rows=data(backing);assert.equal(rows.length,1);
assert.equal(rows[0].revision,1);
assert.ok(rows[0].document.items[0].image.includes(first.path));
for(const photo of photos)assert.ok(!JSON.stringify(rows[0].document).includes(photo.path),
 'Unreferenced upload was accidentally promoted into the saved backup');
// Simulate a storage upload succeeded but stale revision backup RPC rejected.
const late=await upload(a,'uncommitted-metadata-after-upload');
const failedSave=await req(a,'/rest/v1/rpc/save_closet_backup',{method:'POST',
 body:{p_expected_revision:999,p_document:{...doc,items:[{...doc.items[0],image:'closet-photo:'+late.path}]}}});
success(failedSave,'Stale revision should return null, not accept new metadata');
assert.equal(data(failedSave),null);
const after=await inventory(a);
assert.equal(after.count,before.count+1);
assert.notEqual(after.fingerprint,before.fingerprint,'Presence-only snapshot failed to detect change');
assert.ok(after.names.includes(late.name));
const same=await inventory(a);
assert.deepEqual(same,after,'Two consecutive read-only inventories should agree');
const current=await req(a,'/rest/v1/closet_backups?select=revision,document&owner_id=eq.'+a.id);
success(current,'Read after stale backup save');
assert.equal(data(current)[0].revision,1);
assert.equal(data(current)[0].document.items[0].image,'closet-photo:'+first.path);
const orphanCount=after.names.filter(name=>name!==first.name).length;
assert.equal(orphanCount,123);
const namesOwned=after.names.every(x=>/^[a-f0-9]{64}\.jpg$/.test(x));
assert.ok(namesOwned);
// No deletions are attempted. This proves a scoped inventory and one
// failure path, NOT a stable transactionally fenced deletion inventory.
Object.assign(report,{
 ownerAPhotos:after.count,ownerBPhotos:ownB.count,ownerAInventoryPages:after.pages,
 orphanCandidates:orphanCount,orphanAfterRejectedRPC:true,
 siblingAccountListEmpty:true,privateOwnerReadDenied:true,
 anonymousListEmpty:true,staleRevisionNoMetadataPromotion:true,
 changedInventoryFingerprintDetected:true,repeatSnapshotEqual:true,
 exhaustiveFencedSnapshotVerified:false,deleteExecutorEnabled:false,
 providerBackupsErased:false,releaseApproved:false,readOnlyInventoryPathsSafe:namesOwned
});
console.log('REAL_LOCAL_STORAGE_ORPHAN_INVENTORY_PASS '+JSON.stringify(report));
