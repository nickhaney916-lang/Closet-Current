/**
 * MAIN1054 M49 — genuine public licensed source JPEG through the REAL native
 * PHOTO119 owner-confirmed save, private IndexedDB wardrobe, actual native
 * outfit-board normalizer, M16 2D original-photo renderer and release/3D veto.
 *
 * TEST HARNESS: local fake-indexeddb owner / mock auth; NOT real owner JWT,
 * physical phone, cloud RLS, or independent photograph category/color review.
 * No production/hosted accounts, photo mutations, WebGL authorization or writes.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash,randomUUID,webcrypto} from 'node:crypto';
import vm from 'node:vm';
import 'fake-indexeddb/auto';
import {commitHumanReviewedPhoto119} from '../public/native-reviewed-private-save-167.mjs';
import {preflightOwnedOutfit1054} from '../research/main-thread-integration-1054/source-to-outfit.mjs';
import {mountOwnerOutfitPhotoPreview1054} from '../research/main-thread-integration-1054/native-2d-preview.mjs';
import {M48} from '../research/main1054-3d48/photo-neckline-edge-admission48.mjs';

const bytes=readFileSync('benchmark/fixtures/commons-0053.jpg');
const digest=createHash('sha256').update(bytes).digest('hex');
const image='data:image/jpeg;base64,'+bytes.toString('base64');
const PHOTO_2D='verified-original-photo-2d';
// M48 is only source-specific genuine PUBLIC photograph renderer evidence.
// Its NO-GO status cannot grant any real private owner's 3D permission.
const sourceQualityGate=M48.consumer3DAdmitted===false&&
 M48.releaseAuthorized===false&&M48.familyAlpha==='HOLD';
function node(tag='div'){
 return {tagName:tag,children:[],dataset:{},style:{},
  append(...children){this.children.push(...children);},
  replaceChildren(...children){this.children=[...children];},
  querySelectorAll(type){
   const found=[];
   const walk=part=>{if(part?.tagName===type)found.push(part);
    for(const child of part?.children||[])walk(child);};
   walk(this);return found;
  }};
}
class TestDoc extends EventTarget{
 constructor(){super();this.hidden=false;}
 createElement(tag){return node(tag);}
}
const runBoard={URL,encodeURIComponent};vm.createContext(runBoard);
vm.runInContext(readFileSync('public/outfit-board-engine.js','utf8'),runBoard);
const cleanBoard=(board,rows)=>runBoard.cleanOutfitBoard(board,rows);

function open(ownerId){
 return new Promise((resolve,reject)=>{
  const r=indexedDB.open('closet-current-user-'+ownerId,2);
  r.onupgradeneeded=()=>{
   r.result.createObjectStore('items',{keyPath:'id'});
   r.result.createObjectStore('state',{keyPath:'id'});
  };
  r.onsuccess=()=>resolve(r.result);r.onerror=()=>reject(r.error);
 });
}
function put(db,store,item){
 return new Promise((resolve,reject)=>{
  const tx=db.transaction(store,'readwrite');
  tx.objectStore(store).put(item);
  tx.oncomplete=()=>resolve();tx.onabort=tx.onerror=()=>reject(tx.error);
 });
}
function rows(db){
 return new Promise((resolve,reject)=>{
  const q=db.transaction('items','readonly').objectStore('items').getAll();
  q.onsuccess=()=>resolve(q.result);q.onerror=()=>reject(q.error);
 });
}
async function harness(action){
 const ownerId='m49-'+randomUUID(),db=await open(ownerId),id='original-licensed-dress';
 const record={id,ownerId,category:'Uncategorized',itemType:'Unknown',
  color:'Unknown',singleGarmentVerified:false,
  sourceSHA256:digest,sourceHashVerified:true,
  originalPhoto:{image,sha256:digest},image};
 // Synthetic explicit owner decision: accuracy and visual category were NOT
 // independently assessed by a second human (never 10/10 model evidence).
 const review={confirmed:true,recordId:id,originalSHA256:digest,
  category:'Dresses',itemType:'Casual dress',color:'Black',
  singleGarmentConfirmed:true};
 const board={name:'Source-bound verified fallback',
  slots:{top:id}};
 const target=node('section'),doc=new TestDoc(),events=new EventTarget();
 let authRef={user:{id:ownerId},assertCurrent(){}},loggedIn=true,
  epoch=11,dbRef=db;
 const getSession=()=>({authenticated:loggedIn,ownerId,epoch:'m49-test-epoch',
  operationEpoch:epoch,authRef,privateDbRef:dbRef,
  privateDbName:'closet-current-user-'+ownerId});
 const readOwnerItems=async()=>rows(db);
 const preview=mountOwnerOutfitPhotoPreview1054({target,doc,events,getSession,
  getBoard:()=>structuredClone(board),readOwnerItems,cleanBoard});
 const preflight=()=>preflightOwnedOutfit1054({getSession,readOwnerItems,cleanBoard,
  board:structuredClone(board)});
 const commit=async()=>{
  await put(db,'state',{id:'draft',batch:[structuredClone(record)]});
  return commitHumanReviewedPhoto119({db,ownerId,record,review,
   cryptoProvider:webcrypto,currentOwner:()=>loggedIn?ownerId:null,
   assertLease:()=>loggedIn&&getSession().authRef===authRef&&dbRef===db});
 };
 const owner={db,id,ownerId,record,review,board,target,doc,events,preview,
  preflight,commit,rows:()=>rows(db),getSession,
  logout(){loggedIn=false;events.dispatchEvent(new Event('closet:session-locked'));},
  reloginSameId(){authRef={user:{id:ownerId},assertCurrent(){}};},
  replacePrivateConnection(){dbRef={name:db.name};},
  incrementCaptureEpoch(){epoch++;},
  mutateGarment:async patch=>{
   const row=(await rows(db)).find(x=>x.id===id);
   await put(db,'items',{...row,...patch});
   events.dispatchEvent(new Event('closet:style-owned-inventory-committed'));
  }
 };
 try{return await action(owner);}
 finally{preview.dispose();db.close();}
}
const shown=ctx=>ctx.target.querySelectorAll('img');
function assertNoSource(ctx){
 // The native preview's status getter is a synchronous owner/session/board
 // recheck; it revokes exposed image nodes before returning the status.
 // Real callers poll status or receive focus/visibility/session-lock events.
 const status=ctx.preview.status;
 assert.equal(status.hasOwnerPhotos,false);
 assert.equal(shown(ctx).length,0);
 assert.equal(status.renderAuthorized3D,false);
 assert.equal(status.releaseAuthorized,false);
}
test('M49 original licensed photo bytes match real M47 source and public research has NO 3D approval',()=>{
 assert.equal(digest,M48.sourceSHA256);
 assert.equal(sourceQualityGate,true);
 assert.equal(M48.consumer3DAdmitted,false);
 assert.equal(M48.releaseAuthorized,false);
 assert.equal(M48.familyAlpha,'HOLD');
});
test('M49 one genuine public source → actual owner-confirmed save → private IDB → real outfit board → original 2D preview',()=>harness(async h=>{
 const save=await h.commit();
 assert.equal(save.saved,true);
 const saved=await h.rows();
 assert.equal(saved.length,1);
 assert.equal(saved[0].ownerId,h.ownerId);
 assert.equal(saved[0].sourceSHA256,digest);
 assert.equal(saved[0].originalPhoto.image,image);
 assert.equal(saved[0].ownerReviewed,true);
 assert.equal(saved[0].userAdjusted,true);
 const plan=await h.preflight();
 assert.equal(plan.status,'source-verified-2d-only');
 assert.equal(plan.slots.length,1);
 assert.equal(plan.slots[0].itemId,h.id);
 assert.equal(plan.slots[0].sourceSHA256,digest);
 assert.equal(plan.renderAuthorized3D,false);
 assert.equal(plan.releaseAuthorized,false);
 const result=await h.preview.refresh();
 assert.equal(result.presentationMode,PHOTO_2D);
 assert.equal(result.slotCount,1);
 assert.equal(result.renderAuthorized3D,false);
 assert.equal(result.releaseAuthorized,false);
 assert.equal(shown(h).length,1);
 assert.equal(shown(h)[0].src,image,'the EXACT original JPEG saved privately is shown');
 assert.equal(h.preview.status.familyAlpha,'HOLD');
 const emitted=JSON.stringify({result,status:h.preview.status,planSummary:{status:plan.status}});
 for(const secret of [h.ownerId,h.id,image,digest,'authRef','privateDbRef'])
  assert.equal(emitted.includes(secret),false);
 assert.equal((await h.rows())[0].originalPhoto.image,image,'preview is read-only');
}));
test('M49 no silent save: original unreviewed photo cannot enter outfit preflight or display',()=>harness(async h=>{
 await assert.rejects(h.preflight());
 await assert.rejects(h.preview.refresh());
 assertNoSource(h);
 assert.equal((await h.rows()).length,0);
}));
test('M49 same-owner auth object replacement revokes earlier displayed licensed JPEG',()=>harness(async h=>{
 await h.commit();await h.preview.refresh();
 assert.equal(shown(h).length,1);
 h.reloginSameId();
 h.events.dispatchEvent(new Event('focus'));
 assertNoSource(h);
}));
test('M49 private IDB connection replacement revokes photo even if owner ID and DB name match',()=>harness(async h=>{
 await h.commit();await h.preview.refresh();
 h.replacePrivateConnection();
 assertNoSource(h);
}));
test('M49 changed source-bound saved garment revokes displayed original photo and rejects stale 2D proof',()=>harness(async h=>{
 await h.commit();await h.preview.refresh();
 await h.mutateGarment({sourceSHA256:'0'.repeat(64)});
 assertNoSource(h);
 await assert.rejects(h.preflight());
 await assert.rejects(h.preview.refresh());
 assertNoSource(h);
}));
test('M49 logged-out owner loses original-photo display; no success from stale saved outfit',()=>harness(async h=>{
 await h.commit();await h.preview.refresh();
 h.logout();assertNoSource(h);
 await assert.rejects(h.preview.refresh());
 assertNoSource(h);
}));
test('M49 outfit slot replacement and same-auth generation update refuse stale photograph',()=>harness(async h=>{
 await h.commit();await h.preview.refresh();
 h.board.slots.top='not-a-saved-garment';
 h.events.dispatchEvent(new Event('focus'));
 assertNoSource(h);
 h.board.slots.top=h.id;
 await h.preview.refresh();
 h.incrementCaptureEpoch();
 assertNoSource(h);
}));
