import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFileSync} from 'node:fs';
import {webcrypto} from 'node:crypto';
import {validateThreeOutfits,swapOnePiece,switchToDress,unchangedSnapshot} from '../research/family-alpha-15/three-outfit-validator.mjs';
import {prepareSavedBoard2D,fingerprintAlphaRetainedOriginal,identityForSavedGarment} from '../public/family-alpha-2d-saved-board.mjs';
const ownerA='a1111111-1111-4111-8111-111111111111',ownerB='b2222222-2222-4222-8222-222222222222';
const vmContext={URL,encodeURIComponent,Date};
vm.createContext(vmContext);
for(const file of ['outfit-matcher.js','trend-library.js','outfit-board-engine.js','closet-stylist-engine.js'])
 vm.runInContext(readFileSync('public/'+file,'utf8'),vmContext);
const stylist=(items,request={request:'Casual',audience:'All',season:'Fall'})=>vmContext.styleOwnedCollection(items,request);
const clean=(board,items)=>vmContext.cleanOutfitBoard(board,items);
const jpeg=(byte)=>{const bytes=new Uint8Array(130).fill(byte);bytes[0]=255;bytes[1]=216;bytes[128]=255;bytes[129]=217;return 'data:image/jpeg;base64,'+Buffer.from(bytes).toString('base64')};
const item=(id,category,itemType,seed,color='Blue')=>({
 id,category,itemType,name:itemType+' synthetic',color,pattern:seed%2?'Striped':'Solid',
 seasons:[],image:jpeg(seed),originalPhoto:{image:jpeg(seed+32)}
});
const closet=()=>[
 item('shirt-a','Tops','T-shirt',2),item('shirt-b','Tops','T-shirt',3),item('polo','Tops','Polo',4),
 item('jeans','Bottoms','Jeans',5),item('shorts','Bottoms','Shorts',6),item('skirt','Bottoms','Skirt',7),
 item('sneakers','Shoes','Sneakers',8),item('loafers','Shoes','Loafers',9),item('flats','Shoes','Flats',10),
 item('jacket','Outerwear','Jacket',11),item('coat','Outerwear','Coat',12),
 item('dress','Dresses','Casual dress',13),item('dress2','Dresses','Shirt dress',14)
];
const ctx=(who=ownerA,generation=1)=>({authenticatedUserId:who,currentUserId:who,cloudOwnerId:who,indexedDbName:'closet-current-user-'+who,sessionGeneration:generation});
const board=()=>clean({name:'Synthetic outfit',slots:{top:'shirt-a',bottom:'jeans',shoes:'sneakers',layer2:'jacket'}},closet());
async function presentations(items,who=ownerA){
 const result=Object.create(null);
 for(const x of items)result[x.id]={itemId:x.id,ownerId:who,sourceIdentity:identityForSavedGarment(x),
 sourceVersion:await fingerprintAlphaRetainedOriginal(x.originalPhoto.image,webcrypto),
 approved:true,image:{syntheticMaskFor:x.id}};
 return result;
}
const prep=(b,items,p,read=()=>ctx())=>prepareSavedBoard2D({board:b,items,presentations:p,getContext:read,cryptoProvider:webcrypto});
const signature=b=>JSON.stringify(b.slots);
test('real Closet Current stylist creates three distinct complete owned outfits',()=>{
 const items=closet(),copy=JSON.stringify(items),r=stylist(items);
 assert.equal(r.length,3);const summary=validateThreeOutfits(r,items);
 assert.equal(new Set(summary.map(x=>x.signature)).size,3);
 assert.ok(r.every(x=>x.missing.length===0&&Object.keys(x.board.ideas).length===0));
 assert.equal(JSON.stringify(items),copy);
});
test('saved original identity and source fingerprint follow all three real stylist boards',async()=>{
 const items=closet(),r=stylist(items),p=await presentations(items);
 for(const result of r){
  const verified=await prep(result.board,items,p);
  assert.deepEqual(verified.layerRefs.map(x=>x.itemId),
   verified.layerRefs.map(x=>verified.outfit[x.slot]));
  assert.ok(verified.layerRefs.every(x=>x.sourceVersion===p[x.itemId].sourceVersion));
  assert.ok(!JSON.stringify(verified.layerRefs).includes('data:image'));
 }
});
for(const [name,slot,from,to] of [
 ['shirt','top','shirt-a','shirt-b'],['pants to shorts','bottom','jeans','shorts'],
 ['pants to skirt','bottom','jeans','skirt'],['shoes','shoes','sneakers','loafers'],
 ['jacket','layer2','jacket','coat']
]){
 test('one-piece swap keeps every other slot and source identity: '+name,async()=>{
  const items=closet(),p=await presentations(items),before=board(),old=signature(before),saved=JSON.stringify(items);
  assert.equal(before.slots[slot],from);
  const next=swapOnePiece(before,slot,to,items,clean);
  assert.equal(next.slots[slot],to);
  assert.equal(signature(before),old,'previous saved outfit must not mutate');
  for(const key of Object.keys(before.slots))if(key!==slot)assert.equal(next.slots[key],before.slots[key]);
  const checked=await prep(next,items,p);
  const changed=checked.layerRefs.find(x=>x.itemId===to);
  assert.equal(changed.sourceVersion,p[to].sourceVersion);
  for(const x of checked.layerRefs)if(x.itemId!==to)assert.equal(x.sourceVersion,p[x.itemId].sourceVersion);
  assert.ok(unchangedSnapshot(items,saved));
 });
}
test('dress structural transition is explicit and discards incompatible separates',async()=>{
 const items=closet(),p=await presentations(items);
 const before=board(),next=switchToDress(before,'dress',items,clean);
 assert.equal(next.slots.top,'dress');assert.equal(next.slots.shoes,'sneakers');
 for(const key of ['bottom','layer','layer2','layer3'])assert.equal(next.slots[key],undefined);
 assert.equal(before.slots.bottom,'jeans');
 const view=await prep(next,items,p);
 assert.deepEqual(view.layerRefs.map(x=>x.slot),['shoes','dress']);
});
test('changing three active outfits never mixes their selected garment IDs',async()=>{
 const items=closet(),p=await presentations(items),r=stylist(items);
 const snapshots=r.map(x=>signature(x.board));
 for(const index of [0,1,2,0,2,1]){
  const checked=await prep(r[index].board,items,p);
  for(const layer of checked.layerRefs){
   const storedSlot=layer.slot==='dress'?'top':layer.slot;
   assert.equal(layer.itemId,r[index].board.slots[storedSlot]);
  }
 }
 assert.deepEqual(r.map(x=>signature(x.board)),snapshots);
});
test('duplicate, unknown, incompatible, missing and invalid swap targets fail atomically',()=>{
 const items=closet(),base=board(),before=signature(base),saved=JSON.stringify(items);
 for(const [slot,id] of [['shoes','jeans'],['top','missing'],['bottom','sneakers'],['top','dress'],['bottom','shirt-a'],['layer2','shirt-b']]){
  assert.throws(()=>swapOnePiece(base,slot,id,items,clean));
  assert.equal(signature(base),before);
 }
 assert.throws(()=>swapOnePiece(base,'shoes','sneakers',[...items,items[0]],clean),/Duplicate/);
 assert.throws(()=>swapOnePiece(base,'top','shirt-b',items,()=>({slots:{top:'shirt-b',shoes:'loafers',bottom:'jeans'}})),/different/);
 assert.equal(JSON.stringify(items),saved);
});
test('duplicate candidate outfits, partial outfits and unknown saved garment are rejected',()=>{
 const items=closet(),r=stylist(items);
 assert.throws(()=>validateThreeOutfits([r[0],r[0],r[2]],items),/distinct/);
 assert.throws(()=>validateThreeOutfits([r[0],r[1]],items),/Exactly three/);
 const partial=structuredClone(r[0]);delete partial.board.slots.shoes;
 assert.throws(()=>validateThreeOutfits([partial,r[1],r[2]],items),/Incomplete/);
 const missing=structuredClone(r[0]);missing.board.slots.top='not-in-closet';
 assert.throws(()=>validateThreeOutfits([missing,r[1],r[2]],items),/Missing/);
});
test('dress plus bottom or coat fails closed even when stylist boards are externally modified',async()=>{
 const items=closet(),p=await presentations(items);
 await assert.rejects(prep({slots:{top:'dress',bottom:'jeans',shoes:'sneakers'}},items,p),/Dress/);
 await assert.rejects(prep({slots:{top:'dress',layer2:'jacket',shoes:'sneakers'}},items,p),/Dress/);
 assert.throws(()=>swapOnePiece({slots:{top:'dress',shoes:'sneakers'}},'shoes','loafers',items,clean),/Dress/);
});
test('changed retained original invalidates presentation while identical cropped preview remains',async()=>{
 const items=closet(),p=await presentations(items),b=board(),oldCrop=items[0].image;
 items[0]={...items[0],originalPhoto:{image:jpeg(79)}};
 assert.equal(items[0].image,oldCrop);
 await assert.rejects(prep(b,items,p),/stale/);
});
test('crop change alone keeps the exact retained-original source hash, never substitutes another original',async()=>{
 const items=closet(),p=await presentations(items),b=board(),before=await prep(b,items,p);
 items[0]={...items[0],image:jpeg(85)};
 const next=await prep(b,items,p);
 assert.equal(before.sourceHashes.top,next.sourceHashes.top);
 assert.equal(next.outfit.top,'shirt-a');
});
test('changed source group invalidates even if original bytes did not change',async()=>{
 const items=closet(),p=await presentations(items);items[0]={...items[0],outfitSourceId:'different-source'};
 await assert.rejects(prep(board(),items,p),/stale/);
});
test('missing masks, unapproved/foreign masks and invalid JPEG refuse presentation',async()=>{
 const items=closet(),p=await presentations(items);
 delete p['shirt-a'];
 await assert.rejects(prep(board(),items,p),/Unprepared/);
 p['shirt-a']={...p['shirt-b'],itemId:'shirt-a'};
 await assert.rejects(prep(board(),items,p),/stale/);
 p['shirt-a']={...p['shirt-a'],ownerId:ownerB};
 await assert.rejects(prep(board(),items,p),/foreign/);
 p['shirt-a']={...p['shirt-a'],ownerId:ownerA,approved:false};
 await assert.rejects(prep(board(),items,p),/Unapproved/);
 items[0]={...items[0],originalPhoto:{image:'invalid photo'}};
 await assert.rejects(prep(board(),items,p),/Invalid/);
});
test('no cross-account access to synthetic A images and source hashes',async()=>{
 const items=closet(),p=await presentations(items);
 await assert.rejects(prep(board(),items,p,()=>ctx(ownerB,2)),/foreign/);
 assert.equal(p['shirt-a'].ownerId,ownerA);
});
test('client account changes during asynchronous original hashing fail without returning stale layers',async()=>{
 const items=closet(),p=await presentations(items);let account=ctx(ownerA,1),resume;
 const delayedCrypto={subtle:{digest:async(...args)=>{await new Promise(resolve=>resume=resolve);return webcrypto.subtle.digest(...args)}}};
 const pending=prepareSavedBoard2D({board:board(),items,presentations:p,getContext:()=>account,cryptoProvider:delayedCrypto});
 await new Promise(resolve=>setImmediate(resolve));account=ctx(ownerB,2);resume();
 await assert.rejects(pending,/Account changed/);
});
test('duplicate wardrobe IDs are rejected before avatar images can be approved',async()=>{
 const items=closet(),p=await presentations(items);
 await assert.rejects(prep(board(),[...items,items[0]],p),/Duplicate/);
});
test('synthetic original-image and photo presentation checks do not mutate wardrobe',async()=>{
 const items=closet(),saved=JSON.stringify(items),p=await presentations(items);
 await prep(board(),items,p);assert.ok(unchangedSnapshot(items,saved));
});
