import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';

// Native app source is executed, not a copied implementation. IDB and owner
// transports are synthetic; these tests do NOT establish physical-device,
// hosted-user, independent-human, or real-model recognition accuracy.
const app=readFileSync(new URL('../public/app.js',import.meta.url),'utf8');
function extract(first,last){
 const start=app.indexOf(first),end=app.indexOf(last,start+first.length);
 assert.ok(start>=0&&end>start,'native source delimiter changed: '+first);
 return app.slice(start,end);
}
const native=[
 extract('function unit70Receipts(','function unit70OwnerEvidenceValid('),
 extract('function durableReviewedNewItemPeers88(','// P88: ordinary one-photo review'),
 extract('function savePiece(','// Saved-item edits'),
 extract('function saveSourceBoundPiece88(','// Mission 1 #88: unresolved')
].join('\n');

function runCase({kind='plain',persisted=[],knownPeers=[],missingGetAll=false}={}){
 const source='a'.repeat(64),mask='b'.repeat(64);
 const value={id:'pending-88',image:'jpeg-duplicate-88',originalPhoto:{image:'original-88'},
  recognitionPhoto:{image:'review-88'},outfitSourceId:'capture-88',
  segmentHint:null,cropBounds:null};
 if(kind==='source'){
  value.reconciliation70={ownerId:'owner-A',sourceSha256:source,maskSha256:mask};
  value.reconciliation70Status='separate_confirmed';
  value.ownerSourceReview88={schema:'p88-owner-source-review/v1'};
 }
 const state={items:structuredClone(persisted),draft:[structuredClone(value)],
  savedCalls:0,addCalls:0,readCalls:0,aborts:0};
 const ownerDb={name:'closet-current-user-owner-A',transaction(stores,mode){
  assert.equal(mode,'readwrite');
  assert.equal(JSON.stringify(stores),'["items","state"]');
  const tx={aborted:false,error:null,objectStore(name){
   if(name==='state')return {
    get(key){
     assert.equal(key,'draft');
     const req={result:{id:'draft',batch:structuredClone(state.draft)}};
     queueMicrotask(()=>req.onsuccess?.());
     return req;
    },
    put(row){
     const snapshot=structuredClone(row.batch);
     queueMicrotask(()=>{
      if(tx.aborted)return;
      state.items.push(added);
      state.draft=snapshot;
      state.savedCalls++;
      tx.oncomplete?.();
     });
    }
   };
   if(name==='items')return {
    ...(missingGetAll?{}:{getAll(){
     state.readCalls++;
     const req={result:structuredClone(state.items)};
     queueMicrotask(()=>req.onsuccess?.());
     return req;
    }}),
    add(row){
     state.addCalls++;
     if(state.items.some(x=>x.id===row.id))throw Error('COLLIDING_SAVED_KEY');
     added=structuredClone(row);
    }
   };
   throw Error('UNEXPECTED_STORE');
  },abort(){
   tx.aborted=true;state.aborts++;
   queueMicrotask(()=>tx.onabort?.());
  }};
  let added;
  return tx;
 }};
 const ctx={structuredClone,Promise,Error,JSON,Array,queueMicrotask,
  batch:[value],items:[],window:{closetAuth:{user:{id:'owner-A'}}},
  reviewedSaveLeaseLive88:()=>true,sourceSaveLeaseLive88:()=>true,
  reviewedDistinctPhotoReceiptValid88:()=>true,
  ordinarySourceEvidence88:()=> 'stable-source-evidence',
  reviewedSourceReceiptValid88:()=>true,unit70OwnerEvidenceValid:()=>true,
  sourceGroupRevision88:()=> 'stable-group',
  queued:fn=>Promise.resolve().then(fn)
 };
 vm.createContext(ctx);
 vm.runInContext(native,ctx);
 vm.runInContext('var draftStoreRevision88=JSON.stringify(batch);',ctx);
 const lease={item:value,user:ctx.window.closetAuth.user,
  ownerDb,ownerId:'owner-A',wasDraft:true,
  image:value.image,original:value.originalPhoto.image,
  recognition:value.recognitionPhoto.image,review:value.recognitionPhoto.image,
  sourceId:value.outfitSourceId,maskRevision:'null',hintRevision:'null',
  cropRevision:'null',evidenceRevision:'stable-source-evidence',
  exactPhotoPeers88:knownPeers,
  source,mask,receipt:value.reconciliation70,
  receiptRevision:JSON.stringify(value.reconciliation70),
  status:value.reconciliation70Status,groupRevision:'stable-group'};
 const action=kind==='source'?'saveSourceBoundPiece88':'savePiece';
 const promise=ctx[action](value,[],lease);
 return {promise,state};
}

test('ordinary reviewed draft: second-tab exact-original peer prevents silent new saved item',async()=>{
 const c=runCase({persisted:[{id:'other-tab',image:'jpeg-duplicate-88'}]});
 await assert.rejects(c.promise,/P88_DURABLE_REVIEWED_DUPLICATE_CHANGED/);
 assert.equal(c.state.savedCalls,0);
 assert.equal(c.state.addCalls,0);
 assert.equal(c.state.aborts,1);
 assert.equal(c.state.draft.length,1,'original unsaved draft preserved');
 assert.equal(c.state.items[0].id,'other-tab');
});

test('ordinary reviewed draft: new unique garment commits once with atomic pending removal',async()=>{
 const c=runCase({persisted:[{id:'unrelated',image:'different-jpeg'}]});
 await c.promise;
 assert.equal(c.state.readCalls,1,'durable wardrobe checked in same transaction');
 assert.equal(c.state.savedCalls,1);
 assert.equal(c.state.addCalls,1);
 assert.equal(c.state.draft.length,0);
 assert.equal(c.state.items.at(-1).id,'pending-88');
});

test('owner-attested same-JPEG pair must match exact prior durable peer identities',async()=>{
 const peer={id:'previous-item',image:'jpeg-duplicate-88'};
 const okay=runCase({persisted:[peer],knownPeers:[peer]});
 await okay.promise;
 assert.equal(okay.state.savedCalls,1);
 const conflict=runCase({persisted:[peer,{id:'added-from-other-tab',image:peer.image}],knownPeers:[peer]});
 await assert.rejects(conflict.promise,/P88_DURABLE_REVIEWED_DUPLICATE_CHANGED/);
 assert.equal(conflict.state.savedCalls,0);
 assert.equal(conflict.state.draft.length,1);
});

test('physical mask receipt already saved in another tab blocks duplicate P70 unit',async()=>{
 const c=runCase({kind:'source',persisted:[{
  id:'same-mask-other-tab',image:'different-crop-image',
  reconciliation70:{ownerId:'owner-A',sourceSha256:'a'.repeat(64),maskSha256:'b'.repeat(64)}
 }]});
 await assert.rejects(c.promise,/P88_DURABLE_PHYSICAL_UNIT_ALREADY_SAVED/);
 assert.equal(c.state.savedCalls,0);
 assert.equal(c.state.draft.length,1);
});

test('a distinct P70 mask can be reviewed without treating one original as only one garment',async()=>{
 const c=runCase({kind:'source',persisted:[{
  id:'other-physical-unit',image:'other-crop',
  reconciliation70:{ownerId:'owner-A',sourceSha256:'a'.repeat(64),maskSha256:'c'.repeat(64)}
 }]});
 await c.promise;
 assert.equal(c.state.savedCalls,1);
 assert.equal(c.state.draft.length,0);
});

test('missing durable read capability fails closed: no saved replacement or draft loss',async()=>{
 const c=runCase({missingGetAll:true});
 await assert.rejects(c.promise);
 assert.equal(c.state.savedCalls,0);
 assert.equal(c.state.draft.length,1);
 assert.equal(c.state.aborts,1);
});
