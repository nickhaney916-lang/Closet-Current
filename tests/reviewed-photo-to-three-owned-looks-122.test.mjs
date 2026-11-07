import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash,randomUUID,webcrypto} from 'node:crypto';
import 'fake-indexeddb/auto';
import {commitHumanReviewedPhoto119} from '../research/manual-reviewed-private-save-119/reviewed-source-commit.mjs';
import {suggestThreeNativeOwned03,validateOwnedSwap03} from '../research/style-owned-live-03/three-owned-looks-native.mjs';

const app=readFileSync('public/app.js','utf8');
const original=readFileSync('benchmark/fixtures/commons-0002.jpg');
const image='data:image/jpeg;base64,'+original.toString('base64');
const sha=createHash('sha256').update(original).digest('hex');
const orig=ownerId=>({
 id:'new-reviewed-source',ownerId,image,originalPhoto:{image,sha256:sha},
 sourceSHA256:sha,sourceHashVerified:true,singleGarmentVerified:false,
 category:'Uncategorized',itemType:'Unknown',color:'Unknown',seasons:[]
});
async function open(owner){
 return new Promise((resolve,reject)=>{
  const r=indexedDB.open('closet-current-user-'+owner,2);
  r.onupgradeneeded=()=>{
   r.result.createObjectStore('items',{keyPath:'id'});
   r.result.createObjectStore('state',{keyPath:'id'});
  };
  r.onsuccess=()=>resolve(r.result);r.onerror=()=>reject(r.error);
 });
}
async function read(db,store){
 return new Promise((resolve,reject)=>{
  const tx=db.transaction(store,'readonly'),q=tx.objectStore(store).getAll();
  q.onsuccess=()=>resolve(q.result);q.onerror=()=>reject(q.error);
 });
}
async function setup(fn){
 const ownerId='photo122-'+randomUUID(),db=await open(ownerId),record=orig(ownerId);
 const tx=db.transaction('state','readwrite');
 tx.objectStore('state').put({id:'draft',batch:[structuredClone(record)]});
 await new Promise((resolve,reject)=>{
  tx.oncomplete=resolve;tx.onabort=()=>reject(tx.error);
 });
 try{return await fn({ownerId,db,record});}
 finally{db.close();}
}
const donor=(owner,id,category,itemType,color)=>({
 id,ownerId:owner,category,itemType,color,seasons:[],
 sourceSHA256:sha,sourceVerified:true,categoryConfirmed:true
});
const projection=row=>({...row,sourceVerified:true,categoryConfirmed:true});
test('PHOTO122 actual app shortcut requires all five distinct opt-in research conditions',()=>{
 for(const part of [
  "const reviewedStyle122Active=reviewedSave120Active&&",
  "get('reviewedStyle122')==='research'&&",
  "get('styleOwned03')==='research'&&",
  "get('nativeLossless04')==='research'&&",
  "get('nativeIndex07')==='research';",
  "if(typeof reviewedStyle122Active!=='undefined'&&reviewedStyle122Active&&"
 ])assert.ok(app.includes(part),part);
 assert.ok(!app.includes('const reviewedStyle122Active=true'));
});
test('PHOTO122 button appears on actually SAVED, OWNER REVIEWED and source-verified captured photo only',()=>{
 for(const part of [
  "saved&&sessionCapturedIds.has(item.id)&&item.ownerReviewed===true&&",
  "item.sourceHashVerified===true&&item.userAdjusted===true",
  "node('button','Get 3 outfits with this piece','secondary')",
  "style.classList.add('reviewed-style122')",
  "style.dataset.savedItemId=item.id",
  "await styleJustReviewedPhoto122(item.id,item.sourceSHA256)"
 ])assert.ok(app.includes(part),part);
});
test('PHOTO122 user action verifies current owner DB row, SHA source identity and explicit review BEFORE styling',()=>{
 const s=app.slice(app.indexOf('async function styleJustReviewedPhoto122('),
  app.indexOf('function renderPhotoResults('));
 for(const part of [
  "window.closetAuth===auth&&auth.user?.id===owner",
  "db===originalDb&&db?.name==='closet-current-user-'+owner",
  "sessionCapturedIds.has(itemId)||batch.some(x=>x.id===itemId)",
  "originalDb.transaction('items','readonly').objectStore('items').get(itemId)",
  "persisted.sourceHashVerified!==true||persisted.ownerReviewed!==true",
  "persisted.sourceSHA256!==expectedSHA",
  "persisted.originalPhoto?.sha256!==expectedSHA",
  "persisted.originalPhoto?.image!==persisted.image",
  "persisted.category==='Uncategorized'",
  "persisted.itemType==='Unknown'"
 ])assert.ok(s.includes(part),part);
 assert.ok(s.indexOf('await nativeIndex07Refresh()')<s.indexOf('await panel.selectGarment(itemId)'));
 assert.ok(s.indexOf('await panel.selectGarment(itemId)')<s.indexOf('await panel.generate()'));
 assert.ok(s.indexOf('await panel.generate()')<s.indexOf("switchView('stylist')"));
 assert.ok(!s.includes("db.transaction('items','readwrite')"),'shortcut never writes another garment');
 assert.ok(!s.includes('board.persist('),'shortcut never saves looks without consent');
});
test('PHOTO122 first original JPEG human-reviewed user correction can pin THREE distinct genuine owned looks',()=>setup(async({ownerId,db,record})=>{
 const review={confirmed:true,recordId:record.id,originalSHA256:sha,
  category:'Tops',itemType:'T-shirt',color:'Red',singleGarmentConfirmed:true};
 const r=await commitHumanReviewedPhoto119({
  db,ownerId,currentOwner:()=>ownerId,record,review,cryptoProvider:webcrypto
 });
 assert.equal(r.saved,true);
 const saved=(await read(db,'items'))[0];
 assert.equal(saved.category,'Tops');assert.equal(saved.itemType,'T-shirt');
 assert.equal(saved.color,'Red');assert.equal(saved.sourceSHA256,sha);
 assert.equal(saved.originalPhoto.image,image);assert.equal(saved.ownerReviewed,true);
 const rows=[
  projection(saved),
  donor(ownerId,'jeans-blue','Bottoms','Jeans','Blue'),
  donor(ownerId,'trousers-black','Bottoms','Trousers','Black'),
  donor(ownerId,'shoes-white','Shoes','Sneakers','White'),
  donor(ownerId,'shoes-black','Shoes','Sneakers','Black')
 ];
 const result=suggestThreeNativeOwned03(rows,{ownerId,pinnedId:saved.id});
 assert.equal(result.status,'three-owned-outfits');
 assert.equal(result.combinations.length,3);
 assert.equal(new Set(result.combinations.map(c=>c.signature)).size,3);
 for(const look of result.combinations){
  assert.equal(look.slots.top,saved.id);
  assert.ok(rows.some(x=>x.id===look.slots.bottom));
  assert.ok(rows.some(x=>x.id===look.slots.shoes));
  assert.equal(look.sourceSHA256ById[saved.id],sha);
  assert.equal(look.certified3D,false);
 }
 assert.equal(result.releaseAuthorized,false,'authorization is a generator response field, not an outfit field');
 const changed=validateOwnedSwap03(rows,{
  ownerId,pinnedId:saved.id,slots:result.combinations[0].slots,
  slot:'bottom',itemId:result.combinations[0].slots.bottom==='jeans-blue'?
   'trousers-black':'jeans-blue'
 });
 assert.equal(changed.slots.top,saved.id);
 assert.notEqual(changed.slots.bottom,result.combinations[0].slots.bottom);
 await assert.rejects(async()=>validateOwnedSwap03(rows,{
  ownerId,pinnedId:saved.id,slots:result.combinations[0].slots,
  slot:'top',itemId:'jeans-blue'
 }),/pinned|incompatible/);
 assert.equal((await read(db,'items')).length,1,
  'styling never writes an additional garment to the owned closet');
}));
test('PHOTO122 only one saved original plus no compatible owned bottoms/shoes produces ZERO, not invented three outfits',()=>setup(async({ownerId,db,record})=>{
 const r=await commitHumanReviewedPhoto119({
  db,ownerId,currentOwner:()=>ownerId,record,
  review:{confirmed:true,recordId:record.id,originalSHA256:sha,
   category:'Tops',itemType:'T-shirt',color:'Red',singleGarmentConfirmed:true},
  cryptoProvider:webcrypto
 });
 assert.equal(r.saved,true);
 const alone=projection((await read(db,'items'))[0]);
 const insufficient=suggestThreeNativeOwned03([alone],{ownerId,pinnedId:alone.id});
 assert.equal(insufficient.status,'insufficient-owned-combinations');
 assert.equal(insufficient.combinations.length,0);
 assert.match(insufficient.reason,/Only 0 compatible/);
}));
test('PHOTO122 cross-owner source/wardrobe mixing is rejected by existing owner-only outfit planner',()=>{
 const own='owner-P122-A',other='owner-P122-B';
 const rows=[
  donor(own,'pin','Tops','T-shirt','Red'),
  donor(own,'jeans','Bottoms','Jeans','Blue'),
  donor(other,'foreign-shoes','Shoes','Sneakers','White')
 ];
 assert.throws(()=>suggestThreeNativeOwned03(rows,{ownerId:own,pinnedId:'pin'}),
  /cross-owner/);
});
test('PHOTO122 fallback never presents fabricated 3D reconstruction and manual lookup retains original source JPEG',()=>{
 assert.ok(app.includes("if(count<3)message('Your saved photo is pinned."));
 assert.ok(app.includes("originalSHA256Verified:panel.status().sourceSHA256Verified===true"));
 assert.ok(app.includes("familyAlpha:'HOLD',releaseAuthorized:false"));
 assert.ok(app.includes("Could not style that saved photo safely."));
 assert.ok(app.includes("Your closet and saved outfits are unchanged."));
 assert.ok(!app.includes('window.location.href='));
});
