import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFileSync} from 'node:fs';
import {createOutfitLifecycle,snapshotCloset,validateOutfitSlots} from '../research/issue240/outfit-lifecycle.mjs';

function engines(){
 const c={URL,Date,encodeURIComponent};
 vm.createContext(c);
 for(const path of ['outfit-matcher.js','outfit-board-engine.js','closet-stylist-engine.js'])vm.runInContext(readFileSync('public/'+path,'utf8'),c);
 vm.runInContext('this.findSlot=id=>outfitSlots.find(x=>x.id===id)',c);
 return {
  generate:(items,request)=>c.styleOwnedCollection(items,request,null),
  cleanBoard:(board,items)=>c.cleanOutfitBoard(board,items),
  slotAllows:(slot,item)=>Boolean(c.findSlot(slot)&&c.slotAllows(c.findSlot(slot),item))
 };
}
function photo(value){return 'data:image/jpeg;base64,'+Buffer.from([255,216,255,224,...Buffer.from(value),255,217]).toString('base64');}
function piece(id,category,itemType,color='Blue',extra={}){
 return {id,category,itemType,color,image:photo('crop-'+id),originalPhoto:{image:photo('full-'+id)},pattern:'Solid',name:itemType,seasons:[],...extra};
}
function base(){return [
 piece('shirt-1','Tops','T-shirt','Blue'),
 piece('shirt-2','Tops','Polo','White'),
 piece('shirt-3','Tops','Sweater','Cream'),
 piece('pants-1','Bottoms','Jeans','Blue'),
 piece('pants-2','Bottoms','Trousers','Black'),
 piece('shoes-1','Shoes','Sneakers','White'),
 piece('shoes-2','Shoes','Loafers','Brown'),
 piece('jacket-1','Outerwear','Jacket','Brown'),
 piece('bag-1','Accessories','Bag','Brown')
];}
function setup(items=base(),owner='account-A'){
 const state={owner,items},engine=engines();
 const lifecycle=createOutfitLifecycle({ownerId:owner,readOwner:()=>state.owner,readCloset:()=>state.items,...engine});
 return {lifecycle,state,engine,request:{request:'Casual',season:'Fall',audience:'All'}};
}
test('existing classifier produces three distinct complete owned looks with unchanged JPEG originals',async()=>{
 const {lifecycle,state,request}=setup();
 const before=JSON.stringify(state.items),r=await lifecycle.refresh(request);
 assert.equal(r.results.length,3);
 assert.equal(new Set(r.results.map(x=>x.signature)).size,3);
 for(const option of r.results){
  for(const id of Object.values(option.board.slots))assert.ok(state.items.some(x=>x.id===id));
  assert.equal(Object.keys(option.board.ideas).length,0);
  assert.equal(option.missing.length,0);
 }
 assert.equal(JSON.stringify(state.items),before);
});
test('garment addition, deletion, category, type and color edits invalidate previous recommendations',async t=>{
 for(const [name,mutate]of [
  ['new compatible piece',x=>x.push(piece('brand-new','Tops','T-shirt','Green'))],
  ['deletion',x=>x.splice(x.findIndex(a=>a.id==='shirt-1'),1)],
  ['category edit',x=>{x[0].category='Bottoms';x[0].itemType='Jeans';}],
  ['item type edit',x=>{x[0].itemType='Hoodie';}],
  ['color edit',x=>{x[0].color='Magenta';}],
  ['pattern edit',x=>{x[0].pattern='Striped';}]
 ]){
  await t.test(name,async()=>{
   const {lifecycle,state,request}=setup();
   await lifecycle.refresh(request);mutate(state.items);
   assert.equal((await lifecycle.visible()).status,'stale');
   await assert.rejects(lifecycle.save(0),/stale/i);
   const next=await lifecycle.refresh(request);
   assert.equal(next.status,'fresh');
   assert.equal((await lifecycle.visible()).status,'fresh');
  });
 }
});
test('replacing the full original with the same crop still invalidates; crop and full bytes remain untouched',async()=>{
 const {lifecycle,state,request}=setup(),item=state.items[0];
 await lifecycle.refresh(request);
 const crop=item.image;
 item.originalPhoto.image=photo('a completely different full-frame photo');
 assert.equal(item.image,crop);
 assert.equal((await lifecycle.visible()).status,'stale');
 await assert.rejects(lifecycle.save(0),/stale/);
 await lifecycle.refresh(request);
 assert.equal(item.image,crop);
});
test('invalid blank and multi-garment original missing source never produces a recommendation',async()=>{
 const a=setup(),b=setup();a.state.items[0].image='';
 b.state.items[0].outfitSourceId='shared-frame';delete b.state.items[0].originalPhoto;
 await assert.rejects(a.lifecycle.refresh(a.request),/Blank/);
 await assert.rejects(b.lifecycle.refresh(b.request),/original source missing/);
});
test('pinning owned top enforces selected piece across up to three distinct recommendations',async()=>{
 const {lifecycle,state,request}=setup();
 await lifecycle.refresh(request);const pinnedId='shirt-2';
 await lifecycle.pin('top',pinnedId);
 assert.equal((await lifecycle.visible()).status,'empty');
 const {results}=await lifecycle.refresh(request);
 assert.equal(results.length,3);
 assert.ok(results.every(x=>x.board.slots.top===pinnedId));
 assert.equal(new Set(results.map(x=>x.signature)).size,3);
 await assert.rejects(lifecycle.pin('bottom',pinnedId),/Invalid pinned/);
 await lifecycle.pin('top',null);
 const newResults=(await lifecycle.refresh(request)).results;
 assert.equal(newResults.length,3);
 assert.equal(state.items.find(x=>x.id===pinnedId).image,photo('crop-'+pinnedId));
});
test('pin-compatible edit requires refresh and edited pin revalidates on refresh',async()=>{
 const {lifecycle,state,request}=setup();
 await lifecycle.pin('top','shirt-2');await lifecycle.refresh(request);
 state.items.find(x=>x.id==='shirt-2').color='Green';
 assert.equal((await lifecycle.visible()).status,'stale');
 assert.ok((await lifecycle.refresh(request)).results.every(x=>x.board.slots.top==='shirt-2'));
 state.items.find(x=>x.id==='shirt-2').category='Shoes';
 await assert.rejects(lifecycle.refresh(request),/Pinned clothing deleted or recategorized/);
});
test('swapping exactly one compatible piece does not alter other selections and preserves saved JPEGs',async()=>{
 const {lifecycle,state,request}=setup(),initial=(await lifecycle.refresh(request)).results;
 const first=initial[0],before=structuredClone(first.board.slots),target=before.bottom==='pants-1'?'pants-2':'pants-1';
 const after=await lifecycle.swap(0,'bottom',target);
 assert.equal(after.board.slots.bottom,target);
 for(const slot of Object.keys(before))if(slot!=='bottom')assert.equal(after.board.slots[slot],before[slot]);
 assert.equal((await lifecycle.visible()).results[0].board.slots.bottom,target);
 assert.equal(state.items.find(x=>x.id===target).originalPhoto.image,photo('full-'+target));
 await assert.rejects(lifecycle.swap(0,'shoes','shirt-2'),/compatible/);
 await assert.rejects(lifecycle.swap(0,'shoes',after.board.slots.top),/compatible/);
});
test('cannot secretly swap pinned piece or reuse same garment in two slots',async()=>{
 const {lifecycle,request}=setup();
 await lifecycle.pin('top','shirt-2');await lifecycle.refresh(request);
 await assert.rejects(lifecycle.swap(0,'top','shirt-1'),/Pinned/);
 await assert.rejects(lifecycle.swap(0,'layer','shirt-2'),/same clothing twice/);
});
test('saved outfits restore by selected ID and source versions; unrelated new clothes permitted',async()=>{
 const {lifecycle,state,request}=setup();
 await lifecycle.refresh(request);const saved=await lifecycle.save(0);
 const before=JSON.stringify(saved.board);
 const first=await lifecycle.restore(saved);
 assert.equal(first.status,'restored');
 assert.equal(JSON.stringify(first.board),before);
 state.items.push(piece('unrelated-new','Tops','T-shirt','Pink'));
 const restored=await lifecycle.restore(saved);
 assert.equal(restored.status,'restored');
 assert.equal(JSON.stringify(restored.board),before);
});
test('saved outfit rejects deletion, category edits, color edits or full-original replacement of selected item',async t=>{
 for(const [name,mutate]of [
  ['deleted item',(x,id)=>x.splice(x.findIndex(v=>v.id===id),1)],
  ['changed category',(x,id)=>{const item=x.find(v=>v.id===id);item.category='Uncategorized';}],
  ['changed color',(x,id)=>{x.find(v=>v.id===id).color='Orange';}],
  ['changed full original, unchanged crop',(x,id)=>{x.find(v=>v.id===id).originalPhoto.image=photo('different full source');}]
 ]){
  await t.test(name,async()=>{
   const {lifecycle,state,request}=setup();await lifecycle.refresh(request);
   const saved=await lifecycle.save(0),id=Object.values(saved.board.slots)[0];
   mutate(state.items,id);
   await assert.rejects(lifecycle.restore(saved),/references deleted|changed color|source|photo/i);
  });
 }
});
test('saved outfits never cross account boundaries even when IDs and photos match',async()=>{
 const a=setup(),b=setup(base(),'account-B');
 await a.lifecycle.refresh(a.request);
 const saved=await a.lifecycle.save(0);
 await assert.rejects(b.lifecycle.restore(saved),/owner\/session mismatch/);
 a.state.owner='account-B';
 assert.equal((await a.lifecycle.visible()).status,'stale');
 await assert.rejects(a.lifecycle.refresh(a.request),/Account changed/);
 await assert.rejects(a.lifecycle.restore(saved),/Account changed/);
});
test('duplicate IDs and unknown owned slot references fail closed',async()=>{
 const {lifecycle,state,request,engine}=setup();
 state.items.push({...state.items[0]});
 await assert.rejects(lifecycle.refresh(request),/Duplicate clothing IDs/);
 assert.throws(()=>validateOutfitSlots({top:'absent'},base(),engine.slotAllows),/missing or incompatible/);
 assert.throws(()=>validateOutfitSlots({top:'shirt-1',layer:'shirt-1'},base(),engine.slotAllows),/duplicate/i);
});
test('dress covers bottoms and layers while saved dress combination safely restores',async()=>{
 const list=[piece('dress','Dresses','Casual dress','Red'),piece('flats','Shoes','Flats','Brown'),
 piece('jacket','Outerwear','Jacket','Blue'),piece('trousers','Bottoms','Trousers','Black')];
 const {lifecycle,request}=setup(list);
 const {results}=await lifecycle.refresh(request);
 assert.equal(results.length,1);
 assert.equal(results[0].board.slots.top,'dress');
 assert.equal(results[0].board.slots.bottom,undefined);
 assert.equal(results[0].board.slots.layer,undefined);
 const saved=await lifecycle.save(0);
 assert.equal((await lifecycle.restore(saved)).board.slots.top,'dress');
});
test('outfit source signatures differ when only original-photo bytes differ',async()=>{
 const a=base(),b=structuredClone(a);
 b[0].originalPhoto.image=photo('new source');
 const [x,y]=await Promise.all([snapshotCloset('owner',a),snapshotCloset('owner',b)]);
 assert.notEqual(x.wardrobeVersion,y.wardrobeVersion);
 assert.equal(x.versions.get(a[1].id),y.versions.get(b[1].id));
});
