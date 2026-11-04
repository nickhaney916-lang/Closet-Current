import test from 'node:test';
import assert from 'node:assert/strict';
import {createHash,randomUUID,webcrypto} from 'node:crypto';
import {readFileSync} from 'node:fs';
import 'fake-indexeddb/auto';
import {validateRestore01,readOwnerSnapshot01,exportBackup01,restoreOwner01} from '../research/restore-atomic-01/atomic-restore.mjs';
if(!globalThis.crypto)globalThis.crypto=webcrypto;

const jpeg=readFileSync('benchmark/fixtures/commons-0053.jpg');
const locked=JSON.parse(readFileSync('benchmark/locked-photo-sources.json','utf8')).find(x=>x.id==='commons-0053');
const hash=createHash('sha256').update(jpeg).digest('hex');
assert.equal(hash,locked.sha256,'original license-locked photo fixture must match repository SHA');
const image='data:image/jpeg;base64,'+jpeg.toString('base64');
const ownerA='a1111111-1111-4111-8111-111111111111';
const ownerB='b2222222-2222-4222-8222-222222222222';
const deep=x=>structuredClone(x);
const garment=(owner=ownerA)=>({id:owner+'-dress',ownerId:owner,category:'Dresses',
 itemType:'Casual dress',color:'Indigo',userAdjusted:true,sourceSHA256:hash,
 image,originalPhoto:{image,sha256:hash},
 futureRecognition:{model:'v8',confident:false},correctionHistory:['manual-indigo']});
const board=(owner=ownerA)=>({id:'outfit-board',futureBoard:'retain',current:{
 name:'Editing now',slots:{},unknownCurrent:{retain:true}},saved:[{
 id:owner+'-outfit',outfit3dId:owner+'-outfit3d',ownerId:owner,
 name:'Dress with jacket and coat',slots:{top:owner+'-dress',
 layer2:owner+'-temporarily-missing-jacket',
 layer3:owner+'-temporarily-missing-coat'},
 slotSources:{layer3:{sha256:hash,categoryAtSave:'Outerwear'}},
 unknownNested:{priority:'keep',ownerSettings:[1,2,3]}}]});
const file=(owner=ownerA)=>({format:'closet-current',version:4,ownerId:owner,
 items:[garment(owner)],state:{'outfit-board':board(owner),
 looks:{id:'looks',looks:[]},draft:{id:'draft',batch:[]}}});
function open(owner=ownerA){return new Promise((resolve,reject)=>{
 const r=indexedDB.open('closet-current-user-'+owner+'-'+randomUUID(),2);
 r.onupgradeneeded=()=>{r.result.createObjectStore('items',{keyPath:'id'});
 r.result.createObjectStore('state',{keyPath:'id'});};
 r.onerror=()=>reject(r.error);r.onsuccess=()=>resolve(r.result);
});}
function write(db,rows){return new Promise((resolve,reject)=>{
 const tx=db.transaction(['items','state'],'readwrite');
 for(const row of rows.items)tx.objectStore('items').put(row);
 for(const row of Object.values(rows.state))tx.objectStore('state').put(row);
 tx.oncomplete=resolve;tx.onerror=()=>reject(tx.error);tx.onabort=()=>reject(tx.error);
});}
const snapshot=async db=>(await readOwnerSnapshot01(db,()=>{}));
const saved=async db=>(await snapshot(db)).rows;
test('source pinned genuine JPEG, future metadata, category correction and missing outerwear IDs validate',async()=>{
 const backup=file(),receipt=await validateRestore01(backup,{ownerId:ownerA});
 assert.equal(receipt.itemCount,1);assert.equal(receipt.savedCount,1);
 assert.ok(receipt.photoFieldsVerified>=2);
 assert.equal(backup.state['outfit-board'].saved[0].slots.layer3,ownerA+'-temporarily-missing-coat');
 assert.equal(backup.items[0].futureRecognition.model,'v8');
});
test('owner B cannot import owner A document, including hidden foreign nested owner',async()=>{
 await assert.rejects(validateRestore01(file(),{ownerId:ownerB}),/owner/);
 const b=file(ownerB);b.state['outfit-board'].saved[0].slotSources.top={ownerId:ownerA};
 await assert.rejects(validateRestore01(b,{ownerId:ownerB}),/foreign owner/);
});
test('unowned old JSON v3 requires deliberate migration; no silent normalization',async()=>{
 const b=file();b.version=3;delete b.ownerId;
 await assert.rejects(validateRestore01(b,{ownerId:ownerA}),/v4 backup/);
});
test('malformed and duplicate garment, outfit alias, unsafe keys all fail before mutation',async()=>{
 for(const change of [
 b=>b.items.push(deep(b.items[0])),
 b=>b.state['outfit-board'].saved.push(deep(b.state['outfit-board'].saved[0])),
 b=>b.items[0].id='',
 b=>b.state['outfit-board'].saved[0].slots.top='',
 b=>b.state['outfit-board'].future=JSON.parse('{"__proto__":{"admin":true}}'),
 b=>b.state['outfit-board'].saved[0].ownerId=ownerB,
 b=>b.state.cloudSync={id:'cloudSync'}
 ]){const b=file();change(b);await assert.rejects(validateRestore01(b,{ownerId:ownerA}));}
 assert.equal({}.admin,undefined);
});
test('tampered original, inconsistent SHA, invalid image and remote unresolved photo are rejected',async()=>{
 for(const change of [
 b=>b.items[0].originalPhoto.sha256='0'.repeat(64),
 b=>b.items[0].sourceSHA256='1'.repeat(64),
 b=>b.items[0].originalPhoto.image='data:image/jpeg;base64,YWJj',
 b=>b.items[0].image='closet-photo:wrong/123.jpg',
 b=>delete b.items[0].originalPhoto.image
 ]){const b=file();change(b);await assert.rejects(validateRestore01(b,{ownerId:ownerA}));}
});
test('export retains original JSON identity and known complete state with no photo recompression',async()=>{
 const db=await open();try{
  await write(db,file());
  const pre=await snapshot(db),data=exportBackup01({ownerId:ownerA,rows:pre.rows});
  await validateRestore01(data,{ownerId:ownerA});
  assert.deepEqual(data,file());assert.equal(data.items[0].image,image);
  assert.equal(data.state['outfit-board'].saved[0].outfit3dId,ownerA+'-outfit3d');
 }finally{db.close();}
});
test('owner expressly authorizes single-transaction restore and untouched unknown metadata survives',async()=>{
 const db=await open();try{
  await write(db,file());const before=await snapshot(db);
  const target=deep(file());target.items[0].color='Teal';
  target.state['outfit-board'].saved[0].unknownNested.priority='restored';
  const receipt=await restoreOwner01({db,ownerId:ownerA,backup:target,
   expectedFingerprint:before.fingerprint,confirmed:true,assertLease:()=>{}});
  assert.equal(receipt.restored,true);
  const after=await saved(db);
  assert.equal(after.items[0].color,'Teal');
  assert.equal(after.items[0].originalPhoto.image,image);
  assert.equal(after.state.find(x=>x.id==='outfit-board').saved[0].slots.layer3,
   ownerA+'-temporarily-missing-coat');
  assert.equal(after.state.find(x=>x.id==='outfit-board').saved[0].unknownNested.priority,'restored');
  const cloud=after.state.find(x=>x.id==='cloud-sync');
  assert.equal(cloud.dirty,true);assert.equal(cloud.localRevision,1);
 }finally{db.close();}
});
test('canceled or absent authorization makes no write',async()=>{
 const db=await open();try{
  await write(db,file());const before=await snapshot(db);
  await assert.rejects(restoreOwner01({db,ownerId:ownerA,backup:file(),
   expectedFingerprint:before.fingerprint,assertLease:()=>{}}),/authorization/);
  assert.deepEqual((await snapshot(db)).rows,before.rows);
 }finally{db.close();}
});
test('a stale tab or edited saved outfit rejects entire restore with no partial writes',async()=>{
 const db=await open();try{
  await write(db,file());const before=await snapshot(db);
  const newer=file();newer.state['outfit-board'].saved[0].name='Edited in second tab';
  await write(db,newer);
  const now=await snapshot(db);
  await assert.rejects(restoreOwner01({db,ownerId:ownerA,backup:file(),
   expectedFingerprint:before.fingerprint,confirmed:true,assertLease:()=>{}}),/CONFLICT/);
  assert.deepEqual((await snapshot(db)).rows,now.rows);
 }finally{db.close();}
});
test('transaction failure after items.clear and state.put rolls back every record',async()=>{
 const db=await open();try{
  await write(db,file());const before=await snapshot(db);
  const target=file();target.items=[];target.state['outfit-board'].saved=[];
  await assert.rejects(restoreOwner01({db,ownerId:ownerA,backup:target,
   expectedFingerprint:before.fingerprint,confirmed:true,assertLease:()=>{},
   onStage:()=>{throw Error('injected power loss');}}),/power loss/);
  assert.deepEqual((await snapshot(db)).rows,before.rows);
 }finally{db.close();}
});
test('session revoked after preflight cannot replace the source owner',async()=>{
 const db=await open();try{
  await write(db,file());const before=await snapshot(db);
  let checks=0;const lease=()=>{checks++;if(checks>=3)throw Error('session revoked');};
  await assert.rejects(restoreOwner01({db,ownerId:ownerA,backup:file(),
   expectedFingerprint:before.fingerprint,confirmed:true,assertLease:lease}),/session revoked/);
  assert.deepEqual((await snapshot(db)).rows,before.rows);
 }finally{db.close();}
});
test('valid cloud-document shape retains missing referenced IDs, rejects foreign owner',async()=>{
 const b=file(),cloud={schemaVersion:1,items:b.items,state:b.state};
 assert.equal((await validateRestore01(cloud,{ownerId:ownerA,mode:'cloud'})).valid,true);
 cloud.items[0].ownerId=ownerB;
 await assert.rejects(validateRestore01(cloud,{ownerId:ownerA,mode:'cloud'}),/foreign owner/);
});
test('existing unrelated state survives an otherwise atomic restore',async()=>{
 const db=await open();try{
  await write(db,file());
  await write(db,{items:[],state:{'ui-preferences':{id:'ui-preferences',future:true}}});
  const before=await snapshot(db);
  await restoreOwner01({db,ownerId:ownerA,backup:file(),expectedFingerprint:before.fingerprint,
   confirmed:true,assertLease:()=>{}});
  const after=await saved(db);
  assert.deepEqual(after.state.find(x=>x.id==='ui-preferences'),{id:'ui-preferences',future:true});
 }finally{db.close();}
});
