import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash,randomUUID,webcrypto} from 'node:crypto';
import 'fake-indexeddb/auto';
import {commitHumanReviewedPhoto119} from '../research/manual-reviewed-private-save-119/reviewed-source-commit.mjs';
import {suggestThreeNativeOwned03} from '../research/style-owned-live-03/three-owned-looks-native.mjs';

const app=readFileSync('public/app.js','utf8');
const bytes=readFileSync('benchmark/fixtures/commons-0002.jpg');
const image='data:image/jpeg;base64,'+bytes.toString('base64');
const hash=createHash('sha256').update(bytes).digest('hex');
const ownerRow=(ownerId)=>({
 id:'photo-from-before-reload',ownerId,image,
 originalPhoto:{image,sha256:hash},sourceSHA256:hash,
 sourceHashVerified:true,singleGarmentVerified:false,
 category:'Uncategorized',itemType:'Unknown',color:'Unknown'
});
function dbOpen(ownerId){return new Promise((resolve,reject)=>{
 const req=indexedDB.open('closet-current-user-'+ownerId,2);
 req.onupgradeneeded=()=>{
  req.result.createObjectStore('items',{keyPath:'id'});
  req.result.createObjectStore('state',{keyPath:'id'});
 };
 req.onsuccess=()=>resolve(req.result);
 req.onerror=()=>reject(req.error);
});}
function write(db,store,row){return new Promise((resolve,reject)=>{
 const tx=db.transaction(store,'readwrite');
 tx.objectStore(store).put(row);
 tx.oncomplete=resolve;tx.onabort=()=>reject(tx.error);
});}
function get(db,store,id){return new Promise((resolve,reject)=>{
 const req=db.transaction(store,'readonly').objectStore(store).get(id);
 req.onsuccess=()=>resolve(req.result);req.onerror=()=>reject(req.error);
});}
async function savedSetup(callback){
 const ownerId='p123-'+randomUUID(),db=await dbOpen(ownerId),record=ownerRow(ownerId);
 await write(db,'state',{id:'draft',batch:[structuredClone(record)]});
 const result=await commitHumanReviewedPhoto119({
  db,ownerId,currentOwner:()=>ownerId,
  record,review:{confirmed:true,recordId:record.id,originalSHA256:hash,
   category:'Tops',itemType:'T-shirt',color:'Red',singleGarmentConfirmed:true},
  cryptoProvider:webcrypto
 });
 assert.equal(result.saved,true);
 try{return await callback({ownerId,db,record,saved:await get(db,'items',record.id)});}
 finally{db.close();}
}
test('PHOTO123 opt-in never enables saved-closet shortcut without PHOTO122/P120/index/private native gates',()=>{
 for(const part of [
  "const reviewedCloset123Active=reviewedStyle122Active&&",
  "get('reviewedCloset123')==='research';",
  "if(fromCloset123&&!reviewedCloset123Active)",
  "PHOTO123 saved closet styling requires explicit research opt-in"
 ])assert.ok(app.includes(part),part);
 assert.ok(!app.includes('const reviewedCloset123Active=true'));
});
test('PHOTO123 My Closet saved human-corrected garment gets a one-tap distinct CSS class, source ID, and callback',()=>{
 for(const part of [
  "item.ownerReviewed===true&&item.userAdjusted===true&&",
  "item.sourceHashVerified===true&&item.sourcePhotoOriginal===true&&",
  "item.singleGarmentVerified===true&&",
  "item.reviewProvenance==='explicit-owner-claim-not-independent-review-evidence'",
  "styleNew.classList.add('reviewed-closet123')",
  "styleNew.dataset.savedItemId=item.id",
  "reviewedStored123?'Get 3 outfits with this piece':'Style this piece'",
  "await styleJustReviewedPhoto122(item.id,item.sourceSHA256,{fromCloset123:true})"
 ])assert.ok(app.includes(part),part);
});
test('PHOTO123 reuses proven PHOTO122 live owner and original JPEG checks while restricting fresh-camera session only to PHOTO122',()=>{
 const section=app.slice(app.indexOf('async function styleJustReviewedPhoto122('),
  app.indexOf('function renderPhotoResults('));
 for(const part of [
  "window.closetAuth===auth&&auth.user?.id===owner",
  "db===originalDb&&db?.name==='closet-current-user-'+owner",
  "(!fromCloset123&&(!sessionCapturedIds.has(itemId)||batch.some(x=>x.id===itemId)))",
  "(fromCloset123&&batch.some(x=>x.id===itemId))",
  "persisted.sourcePhotoOriginal!==true",
  "persisted.reviewProvenance!=='explicit-owner-claim-not-independent-review-evidence'",
  "persisted.singleGarmentVerified!==true",
  "persisted.sourceSHA256!==expectedSHA",
  "persisted.originalPhoto?.sha256!==expectedSHA",
  "persisted.originalPhoto?.image!==persisted.image",
  "await nativeIndex07Refresh()",
  "await panel.selectGarment(itemId)",
  "await panel.generate()",
  "panel.status()?.pinnedId!==itemId",
  "switchView('stylist')",
  "if(count<3)message("
 ])assert.ok(section.includes(part),part);
 assert.ok(!section.includes("db.transaction('items','readwrite')"),
  'reopened shortcut reads only; no second local photo write');
 assert.ok(!section.includes('board.persist('),
  'outfit is only saved by existing native user-confirmed board');
});
test('PHOTO123 real original-JPEG P119 reviewed source persists across a freshly opened IndexedDB connection',()=>savedSetup(async({ownerId,db,record,saved})=>{
 assert.equal(saved.id,record.id);
 assert.equal(saved.ownerId,ownerId);
 assert.equal(saved.ownerReviewed,true);
 assert.equal(saved.userAdjusted,true);
 assert.equal(saved.singleGarmentVerified,true);
 assert.equal(saved.sourcePhotoOriginal,true);
 assert.equal(saved.reviewProvenance,'explicit-owner-claim-not-independent-review-evidence');
 assert.equal(saved.category,'Tops');assert.equal(saved.itemType,'T-shirt');
 assert.equal(saved.color,'Red');
 assert.equal(saved.originalPhoto.image,image);
 assert.equal(saved.sourceSHA256,hash);
 const originalDB=db;
 db.close();
 const reopened=await dbOpen(ownerId);
 try{
  assert.notEqual(reopened,originalDB);
  assert.deepEqual(await get(reopened,'items',saved.id),saved);
  const draft=await get(reopened,'state','draft');
  assert.equal(draft.batch.length,0,'atomic original capture must not reappear as unsaved');
 }finally{reopened.close();}
}));
test('PHOTO123 reloaded original reviewed garment can pin three previously owned outfit combinations without new photo writes',()=>savedSetup(async({ownerId,db,saved})=>{
 const roster=[
  {...saved,sourceVerified:true,categoryConfirmed:true},
  ...[
   ['denim','Bottoms','Jeans','Blue'],
   ['trousers','Bottoms','Trousers','Black'],
   ['shoes-white','Shoes','Sneakers','White'],
   ['shoes-black','Shoes','Sneakers','Black']
  ].map(([id,category,itemType,color])=>({
   id,ownerId,category,itemType,color,sourceVerified:true,
   categoryConfirmed:true,sourceSHA256:hash
  }))
 ];
 const first=suggestThreeNativeOwned03(roster,{ownerId,pinnedId:saved.id});
 assert.equal(first.combinations.length,3);
 assert.equal(new Set(first.combinations.map(x=>x.signature)).size,3);
 assert.ok(first.combinations.every(x=>x.slots.top===saved.id&&
  x.sourceSHA256ById[saved.id]===hash&&x.certified3D===false));
 assert.equal(first.releaseAuthorized,false);
 assert.equal((await get(db,'items',saved.id)).originalPhoto.image,image);
}));
test('PHOTO123 unsupported unreviewed/cutout source is excluded from shortcut; existing Style this piece path retained',()=>{
 const code=app.slice(app.indexOf("if(new URLSearchParams(location.search).get('styleOwned03')==='research'){const style"),
  app.indexOf("actions.append(edit,cropButton(item),del);"));
 assert.ok(code.includes("item.singleGarmentVerified===true"));
 assert.ok(code.includes("item.reviewProvenance==="));
 assert.ok(code.includes("else{\n    switchView('stylist');"));
 assert.ok(code.includes('await window.styleOwnedLive03Bridge.selectGarment(item.id)'));
 assert.ok(code.includes('styleNew.disabled=true'));
 assert.ok(code.includes('finally{styleNew.disabled=false;}'));
});
test('PHOTO123 owner account switch or SHA/correction mutation is rejected before styling; shortage stays honest',()=>{
 const code=app.slice(app.indexOf('async function styleJustReviewedPhoto122('),app.indexOf('function renderPhotoResults('));
 assert.ok(code.includes('if(!live())throw Error('));
 assert.ok(code.includes('if(!live()||!persisted||persisted.ownerId!==owner'));
 assert.ok(code.includes("!persisted.color||persisted.color==='Unknown'"));
 assert.ok(code.includes("if(!live())throw Error('Owner signed out while refreshing"));
 assert.ok(code.includes("if(!live())throw Error('Owner changed while selecting"));
 assert.ok(code.includes("if(!live()||panel.status()?.pinnedId!==itemId"));
 assert.ok(code.includes("count+' complete owned outfits are available; add compatible clothes to reach three.'"));
});
