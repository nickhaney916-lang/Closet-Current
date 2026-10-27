import {assertWork43HOLD} from '../../scripts/build-work43-photo-board-hold.mjs';
import {test} from 'node:test';
import assert from 'node:assert/strict';
import {webcrypto,createHash} from 'node:crypto';
import {indexedDB,IDBKeyRange} from 'fake-indexeddb';
import {evaluateOutfit} from '../../research/work43-integration/policy.mjs';
import {createTrustedOutfitPhotoSourceBoundary}
 from '../../research/work43-integration/trusted-photo-source-boundary.mjs';
const A='11111111-1111-4111-8111-111111111111';
const B='22222222-2222-4222-8222-222222222222';
const DIGEST=async bytes=>createHash('sha256').update(bytes).digest('hex');
const PICTURE=new Uint8Array(125);
PICTURE.set([255,216,255,224,0,16,74,70,73,70,0,1,1,0,0,1,0,1,0,0],0);
for(let i=20;i<123;i++)PICTURE[i]=i%230+5;
PICTURE[123]=255;PICTURE[124]=217;
const URI='data:image/jpeg;base64,'+Buffer.from(PICTURE).toString('base64');
const SLIM=URI.replace(/.$/,'A');
async function database(owner){
 const name='closet-current-user-'+owner;
 return new Promise((resolve,reject)=>{
  const req=indexedDB.open(name,1);
  req.onupgradeneeded=()=>{if(!req.result.objectStoreNames.contains('items'))req.result.createObjectStore('items',{keyPath:'id'});};
  req.onsuccess=()=>resolve(req.result);
  req.onerror=()=>reject(req.error);
 });
}
async function put(db,item){
 await new Promise((resolve,reject)=>{
  const tx=db.transaction('items','readwrite');
  tx.objectStore('items').put(item);
  tx.oncomplete=resolve;tx.onerror=()=>reject(tx.error);tx.onabort=()=>reject(tx.error);
 });
}
let caseId=0;
function setup({owner=A}={}){
 let user=owner,epoch=1,cloud=owner,dbHandle=null;
 const readContext=()=>({
  authenticatedUserId:user,currentUserId:user,cloudOwnerId:cloud,
  indexedDbName:user?'closet-current-user-'+user:null,
  sessionGeneration:epoch
 });
 const boundary=createTrustedOutfitPhotoSourceBoundary({
  readContext,getDatabase:()=>dbHandle,cryptoProvider:webcrypto,
  verifySession:async()=>({ownerId:user,sessionGeneration:epoch})
 });
 return {
  readContext,boundary,
  setDatabase:db=>{dbHandle=db;},
  changeUser:id=>{user=id;cloud=id;epoch++;},
  invalidate:()=>boundary.invalidate(),
  changeEpoch:()=>{epoch++;},
  changeCloud:next=>{cloud=next;}
 };
}
const outfit=ids=>({slots:Object.fromEntries(ids.map((id,i)=>[i===0?'top':i===1?'bottom':'layer2',id]))});
const row=(id,more={})=>({id,itemType:'Blouse',category:'Tops',name:'Test source '+id,
 image:URI,localAnalyzed:true,saveFailed:false,...more});
async function createCase(owner=A){
 // Tests are serialized at the Node test runner level; this is a private
 // in-memory IndexedDB with no remote provider and synthetic JPEG only.
 const db=await database(owner);
 const environment=setup({owner});
 environment.setDatabase(db);
 return {db,...environment};
}
test('canonical persisted JPEG, SHA and current authenticated owner form Work42 PHOTO PREVIEW',async()=>{
 const c=await createCase();
 await put(c.db,row('garment-1'));
 const result=await c.boundary.resolveBoard(outfit(['garment-1']));
 assert.equal(result.items[0].ownerId,A);
 assert.equal(result.items[0].trustedSourceSha256,await DIGEST(PICTURE));
 assert.equal(result.items[0].original.size,PICTURE.length);
 assert.equal(result.items[0].original.type,'image/jpeg');
 assert.equal(result.isCurrent(),true);
 assert.equal(Object.isFrozen(result.items),true);
 assert.equal(Object.isFrozen(result.items[0]),true);
 assert.equal((await evaluateOutfit({...result,digest:DIGEST})).mode,'PHOTO PREVIEW');
});
test('wardrobe original crop wins over derived clipping; no crop cannot use generated display',async()=>{
 const c=await createCase();
 await put(c.db,row('outfit-layer',{
  outfitSourceId:'outfit-42',image:'data:image/png;base64,AAA=',
  recognitionPhoto:{image:URI},originalPhoto:{image:'data:image/jpeg;base64,NOTJPEG'}
 }));
 let snapshot=await c.boundary.resolveBoard(outfit(['outfit-layer']));
 assert.equal((await evaluateOutfit({...snapshot,digest:DIGEST})).mode,'PHOTO PREVIEW');
 await put(c.db,row('outfit-layer',{outfitSourceId:'outfit-42',image:URI}));
 c.invalidate();
 await assert.rejects(c.boundary.resolveBoard(outfit(['outfit-layer'])),/Unmasked original garment crop missing/);
 assert.equal(snapshot.getContext(),null,'Old original-source board must not outlive wardrobe mutation');
});
test('caller cannot supply fake JPEG, owner, source hash or wear approval to bypass private IndexedDB',async()=>{
 const c=await createCase();
 await put(c.db,row('owned-item'));
 const tampered={slots:{top:'owned-item'},ownerId:B,original:'fake',trustedSourceSha256:'a'.repeat(64),
  wornApproved:true};
 const snap=await c.boundary.resolveBoard(tampered);
 assert.equal(snap.items[0].ownerId,A);
 assert.equal(snap.items[0].trustedSourceSha256,await DIGEST(PICTURE));
 assert.equal(snap.items[0].wornApproved,undefined);
 assert.equal((await evaluateOutfit({...snap,digest:DIGEST})).mode,'PHOTO PREVIEW');
});
test('wrong account and same database with account changed after async verification fail closed',async()=>{
 const c=await createCase();
 await put(c.db,row('item-1'));
 const original=await c.boundary.resolveBoard(outfit(['item-1']));
 c.changeUser(B);
 assert.equal(original.getContext(),null);
 await assert.rejects(c.boundary.resolveBoard(outfit(['item-1'])),/Current private signed-in wardrobe required/);
 const c2=setup({owner:A});c2.setDatabase(c.db);
 c2.changeCloud(B);
 await assert.rejects(c2.boundary.resolveBoard(outfit(['item-1'])),/Current private signed-in wardrobe required/);
});
test('changed session or wardrobe generation invalidates previously approved source before board can display',async()=>{
 const c=await createCase();
 await put(c.db,row('a'));
 const snap=await c.boundary.resolveBoard(outfit(['a']));
 c.changeEpoch();
 assert.equal(snap.isCurrent(),false);
 assert.equal((await evaluateOutfit({...snap,digest:DIGEST})).mode,'REVIEW REQUIRED');
 const c2=await createCase();
 await put(c2.db,row('b'));
 const snap2=await c2.boundary.resolveBoard(outfit(['b']));
 c2.invalidate();
 assert.equal(snap2.isCurrent(),false);
 assert.equal((await evaluateOutfit({...snap2,digest:DIGEST})).mode,'REVIEW REQUIRED');
});
test('foreign-owner saved record, unsaved review and untrusted originals refuse preview',async()=>{
 const c=await createCase();
 for(const [id,props] of [
  ['foreign',{ownerId:B}],['unreviewed',{recognitionReviewRequired:true}],
  ['failed',{saveFailed:true}],['scan-error',{scanFailed:true}],
  ['remote',{image:'https://example.invalid/user.jpg'}],
  ['cutout',{image:'data:image/png;base64,AABB'}],
  ['not-jpeg',{image:'data:image/jpeg;base64,'+Buffer.from('not jpeg').toString('base64')}]
 ])await put(c.db,row(id,props));
 for(const id of ['foreign','unreviewed','failed','scan-error','remote','cutout','not-jpeg','missing'])
  await assert.rejects(c.boundary.resolveBoard(outfit([id])));
});
test('garment swaps must derive a new saved row; duplicate, unknown slot, huge selection fail before DB',async()=>{
 const c=await createCase();
 await put(c.db,row('shirt'));
 await put(c.db,row('pants',{category:'Bottoms',itemType:'Jeans'}));
 const a=await c.boundary.resolveBoard(outfit(['shirt','pants']));
 await put(c.db,row('skirt',{category:'Bottoms',itemType:'Skirt'}));
 c.invalidate();
 const b=await c.boundary.resolveBoard(outfit(['shirt','skirt']));
 assert.equal(a.getContext(),null);
 assert.equal(b.items[1].id,'skirt');
 assert.notEqual(a.context.sessionId,b.context.sessionId);
 for(const board of [
  {slots:{top:'shirt',bottom:'shirt'}},{slots:{unknown:'shirt'}},
  {slots:{top:'../../private'}},{slots:{}},{slots:{...Object.fromEntries(Array.from({length:10},(_,i)=>['item'+i,'id-'+i]))}}
 ])await assert.rejects(c.boundary.resolveBoard(board));
});
test('current owner hard gate checks database name and refuses missing Auth verification',async()=>{
 const c=await createCase();
 await put(c.db,row('shirt'));
 const invalid=createTrustedOutfitPhotoSourceBoundary({
  readContext:c.readContext,getDatabase:()=>c.db,cryptoProvider:webcrypto,
  verifySession:async()=>({ownerId:B,sessionGeneration:1})
 });
 await assert.rejects(invalid.resolveBoard(outfit(['shirt'])),/certification changed/);
});

test('full source-pin Work43 integration overlays only accepted photo-board sources and passes existing signed-in owner DB to adapter',async()=>{
 const m=await assertWork43HOLD();
 assert.equal(m.releaseGate,'HOLD');
 assert.equal(m.realAccountVerified,false);
 assert.equal(m.deployAuthorized,false);
 const boot=await import('node:fs/promises').then(fs=>fs.readFile('dist-work43-photo-board-HOLD/__alpha_research/family-alpha-29/boot.js','utf8'));
 assert.match(boot,/getDatabase:\(\)=>db,verifySession/);
 const bridge=await import('node:fs/promises').then(fs=>fs.readFile('dist-work43-photo-board-HOLD/__alpha_research/work43-integration/verified-board.mjs','utf8'));
 assert.match(bridge,/createTrustedOutfitPhotoSourceBoundary/);
 assert.doesNotMatch(bridge,/originalPhoto===undefined/);
});
