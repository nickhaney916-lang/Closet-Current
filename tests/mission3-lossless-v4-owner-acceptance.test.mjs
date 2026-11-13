// Source-executed v4 owner-private export+atomic restore on actual fake IDB.
// Genuine synthetic JPEG byte arrays, SHA-256 proof, never private user data.
import test from 'node:test';
import assert from 'node:assert/strict';
import {randomUUID,createHash,webcrypto} from 'node:crypto';
import {readFileSync} from 'node:fs';
import {createRequire} from 'node:module';
import {
 exportLosslessV4M3,restoreLosslessV4M3
} from '../public/native-lossless-v4-owner-acceptance-m3.mjs';
import {readOwnerSnapshot01} from '../research/restore-atomic-01/atomic-restore.mjs';
const require=createRequire(import.meta.url);
const {indexedDB}=require('fake-indexeddb');
globalThis.crypto??=webcrypto;
const imageBytes=Buffer.from([255,216,255,20,40,90,255,217]);
const draftBytes=Buffer.from([255,216,255,80,60,25,255,217]);
const savedImage='data:image/jpeg;base64,'+imageBytes.toString('base64');
const draftImage='data:image/jpeg;base64,'+draftBytes.toString('base64');
const savedSHA=createHash('sha256').update(imageBytes).digest('hex');
const draftSHA=createHash('sha256').update(draftBytes).digest('hex');
const garment=(owner,id='saved-dress')=>({
 id,ownerId:owner,category:'Dresses',itemType:'Casual dress',
 image:savedImage,sourceSHA256:savedSHA,sourceHashVerified:true,
 originalPhoto:{image:savedImage,sha256:savedSHA},color:'Owner approved blue',
 userAdjusted:true,correctionHistory:['manual-blue'],futureRecognition:{model:'v42'}
});
const pending=(owner,id='awaiting-jacket')=>({
 id,ownerId:owner,image:draftImage,sourceSHA256:draftSHA,
 originalPhoto:{image:draftImage,sha256:draftSHA},
 sourceHashVerified:true,localAnalyzed:false,
 category:'Outerwear',itemType:'Jacket',color:'Uncertain'
});
const board=(owner)=>({id:'outfit-board',current:{name:'Saved draft outfit',slots:{
 top:'saved-dress'}},saved:[{id:'chosen-style',ownerId:owner,
 name:'My favorite',slots:{top:'saved-dress',layer2:'temporarily-missing-coat'}}]});
async function open(owner){
 return new Promise((ok,fail)=>{
  const r=indexedDB.open('closet-current-user-'+owner,1);
  r.onupgradeneeded=()=>{r.result.createObjectStore('items',{keyPath:'id'});
   r.result.createObjectStore('state',{keyPath:'id'});};
  r.onsuccess=()=>ok(r.result);r.onerror=()=>fail(r.error);
 });
}
async function write(db,changes){
 return new Promise((ok,fail)=>{
  const tx=db.transaction(['items','state'],'readwrite');
  for(const [store,value] of changes)tx.objectStore(store).put(value);
  tx.oncomplete=ok;tx.onerror=tx.onabort=()=>fail(tx.error);
 });
}
const clone=x=>structuredClone(x);
const stored=async db=>(await readOwnerSnapshot01(db,()=>{})).rows;
async function fixture({seed=true}={}){
 const owner=randomUUID(),db=await open(owner);
 if(seed)await write(db,[['items',garment(owner)],
  ['state',{id:'draft',batch:[pending(owner)]}],
  ['state',{id:'looks',looks:[{id:'look',title:'Verified inspiration',pieces:[]}]}],
  ['state',board(owner)],
  ['state',{id:'cloud-sync',localRevision:11,dirty:false,
   baseVersion:3,baseDocument:null}]]);
 return {owner,db,close:()=>db.close(),lease:()=>{},
  export(){return exportLosslessV4M3({ownerDB:db,ownerId:owner,
   assertLease:this.lease});},
  restore(data,confirm=()=>true,rest={}){return restoreLosslessV4M3({
   ownerDB:db,ownerId:owner,assertLease:this.lease,
   data,confirm,...rest
  });}};
}
test('exact source v4 export includes ALL saved JPEG, draft original, owner correction and outfit metadata',async()=>{
 const f=await fixture();
 try{
  const before=await stored(f.db),r=await f.export();
  assert.equal(r.fullLosslessV4,true);
  assert.equal(r.savedCount,1);assert.equal(r.pendingOriginals,1);
  assert.equal(r.receipt.valid,true);
  const backup=JSON.parse(r.json);
  assert.equal(backup.version,4);assert.equal(backup.ownerId,f.owner);
  assert.equal(backup.items[0].originalPhoto.image,savedImage);
  assert.equal(backup.items[0].sourceSHA256,savedSHA);
  assert.equal(backup.items[0].correctionHistory[0],'manual-blue');
  assert.equal(backup.state.draft.batch[0].originalPhoto.image,draftImage);
  assert.equal(backup.state.draft.batch[0].sourceSHA256,draftSHA);
  assert.equal(backup.state['outfit-board'].saved[0].slots.layer2,'temporarily-missing-coat');
  assert.deepEqual(await stored(f.db),before,'export does not mutate any original');
 }finally{f.close();}
});
test('owner-confirmed v4 restore replaces saved JPEG and draft original atomically, cloud revision is dirty',async()=>{
 const f=await fixture();
 try{
  const original=(await f.export()).data;
  await write(f.db,[['items',{...garment(f.owner),color:'Wrong unsaved state'}],
   ['state',{id:'draft',batch:[]}],
   ['state',{id:'looks',looks:[]}]]);
  let asked=0;
  const result=await f.restore(original,info=>{
   asked++;
   assert.equal(info.incomingDrafts,1);
   assert.equal(info.existingDrafts,0);
   return true;
  });
  assert.equal(asked,1);
  assert.equal(result.atomic,true);
  assert.equal(result.pendingOriginals,1);
  const after=await stored(f.db);
  assert.equal(after.items[0].originalPhoto.image,savedImage);
  assert.equal(after.items[0].color,'Owner approved blue');
  const byId=Object.fromEntries(after.state.map(row=>[row.id,row]));
  assert.equal(byId.draft.batch[0].originalPhoto.image,draftImage);
  assert.equal(byId.draft.batch[0].sourceSHA256,draftSHA);
  assert.equal(byId.looks.looks[0].title,'Verified inspiration');
  assert.equal(byId['outfit-board'].saved[0].slots.layer2,'temporarily-missing-coat');
  assert.equal(byId['cloud-sync'].localRevision,12);
  assert.equal(byId['cloud-sync'].dirty,true);
 }finally{f.close();}
});
test('async owner denial and cancellation retain EVERY local JPEG and cloud marker',async()=>{
 const f=await fixture();
 try{
  const data=(await f.export()).data;
  const before=await stored(f.db);
  const cancelled=await f.restore(data,async()=>false);
  assert.equal(cancelled.cancelled,true);
  assert.deepEqual(await stored(f.db),before);
 }finally{f.close();}
});
test('v4 backup from another signed owner rejects before confirmation and cannot alter current owner',async()=>{
 const f=await fixture(),other=await fixture();
 try{
  const data=(await other.export()).data;
  const before=await stored(f.db);let confirmed=0;
  await assert.rejects(f.restore(data,()=>{confirmed++;return true;}),/OWNER_BOUND_V4_REQUIRED/);
  assert.equal(confirmed,0);
  assert.deepEqual(await stored(f.db),before);
 }finally{f.close();other.close();}
});
test('tampered pending draft original SHA and conflicting identities cannot be restored',async()=>{
 const f=await fixture();
 try{
  const data=(await f.export()).data,before=await stored(f.db);
  data.state.draft.batch[0].originalPhoto.sha256='f'.repeat(64);
  await assert.rejects(f.restore(data),/SOURCE_IDENTITIES_DISAGREE|JPEG SHA mismatch/);
  assert.deepEqual(await stored(f.db),before);
  data.state.draft.batch[0].originalPhoto.sha256=draftSHA;
  data.state.draft.batch[0].originalPhoto.image=savedImage;
  await assert.rejects(f.restore(data),/JPEG SHA mismatch|SOURCE_SHA_MISMATCH/);
  assert.deepEqual(await stored(f.db),before);
 }finally{f.close();}
});
test('duplicate pending original IDs or foreign owner private metadata are refused before confirmation',async()=>{
 const f=await fixture();
 try{
  const data=(await f.export()).data;
  data.state.draft.batch.push(clone(data.state.draft.batch[0]));
  await assert.rejects(f.restore(data),/INVALID_DRAFT_OWNER_OR_ID/);
  data.state.draft.batch.pop();
  data.state.draft.batch[0].ownerId='different-owner';
  await assert.rejects(f.restore(data),/foreign owner data|INVALID_DRAFT_OWNER_OR_ID/);
 }finally{f.close();}
});
test('same-owner second-tab change during confirmation rejects full restore with source and outfit unchanged',async()=>{
 const f=await fixture(),second=await open(f.owner);
 try{
  const data=(await f.export()).data;
  const changed=clone(pending(f.owner));changed.color='Confirmed from other tab';
  const started=await f.restore(data,async()=>{
   await write(second,[['state',{id:'draft',batch:[changed]}]]);
   return true;
  }).then(()=>null,e=>e);
  assert.match(started.message,/CONFLICT/);
  const final=await stored(f.db);
  const byId=Object.fromEntries(final.state.map(row=>[row.id,row]));
  assert.equal(byId.draft.batch[0].color,'Confirmed from other tab');
  assert.equal(byId.draft.batch[0].originalPhoto.image,draftImage);
  assert.equal(final.items[0].originalPhoto.image,savedImage);
  assert.equal(byId['cloud-sync'].localRevision,11);
 }finally{f.close();second.close();}
});
test('injected failure after clear/items/looks/draft/board staged rolls back entire owner restore',async()=>{
 const f=await fixture();
 try{
  const data=(await f.export()).data;
  data.items=[];data.state.draft.batch=[];
  const before=await stored(f.db);
  await assert.rejects(f.restore(data,()=>true,{
   onStage:()=>{throw Error('Synthetic power interruption');}
  }),/Synthetic power interruption/);
  assert.deepEqual(await stored(f.db),before);
 }finally{f.close();}
});
test('session revoked during async owner confirmation fails before any source erase',async()=>{
 const f=await fixture();
 try{
  const data=(await f.export()).data,before=await stored(f.db);
  let active=true;
  await assert.rejects(f.restore(data,async()=>{active=false;return true;},{
   assertLease:()=>{if(!active)throw Error('Owner session revoked');}
  }),/Owner session revoked/);
  assert.deepEqual(await stored(f.db),before);
 }finally{f.close();}
});
test('new camera action after native transaction completion cannot turn a COMMITTED v4 restore into false failure',async()=>{
 const f=await fixture();
 try{
  const data=(await f.export()).data;
  let cameraStartedAfterCommit=false;
  const ownerDB={name:f.db.name,
   transaction(stores,mode){
    const tx=f.db.transaction(stores,mode);
    if(mode==='readwrite')tx.addEventListener('complete',()=>{
     cameraStartedAfterCommit=true;
    });
    return tx;
   }
  };
  const result=await restoreLosslessV4M3({
   ownerDB,ownerId:f.owner,assertLease:()=>{},
   assertIdle:()=>{if(cameraStartedAfterCommit)
    throw Error('A new camera capture has begun after the transaction committed');},
   data,confirm:()=>true
  });
  assert.equal(cameraStartedAfterCommit,true);
  assert.equal(result.restored,true);
  const snap=await stored(f.db);
  assert.equal(snap.items[0].originalPhoto.image,savedImage);
  assert.equal(snap.state.find(x=>x.id==='draft').batch[0].originalPhoto.image,draftImage);
 }finally{f.close();}
});
test('invalid or unowned legacy v3 input is not silently upgraded into a v4 whole-wardrobe replacement',async()=>{
 const f=await fixture();
 try{
  const data=(await f.export()).data;data.version=3;
  await assert.rejects(f.restore(data),/OWNER_BOUND_V4_REQUIRED/);
  delete data.ownerId;data.version=4;
  await assert.rejects(f.restore(data),/OWNER_BOUND_V4_REQUIRED/);
 }finally{f.close();}
});
test('v4 acceptance requires original research flag in app handlers and preserves existing default v3 paths',()=>{
 const s=readFileSync('public/app.js','utf8');
 const ex=s.slice(s.indexOf("$('export').onclick=async()=>"),s.indexOf("$('import').onchange=async"));
 const importStart=s.indexOf("$('import').onchange=async");
 const im=s.slice(importStart,s.indexOf("window.addEventListener('beforeunload'",importStart));
 assert.match(ex,/losslessV4M3.*research/);
 assert.match(im,/losslessV4M3.*research/);
 assert.match(ex,/exportLosslessV4M3/);
 assert.match(im,/restoreLosslessV4M3/);
 assert.match(ex,/exportDurableOwnerBackupM3/);
 assert.match(im,/prepareDefaultAtomicM3/);
 assert.match(im,/mission3ReloadOwnerCloudView/);
 assert.match(im,/confirm\('Replace '/);
});
