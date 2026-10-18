const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const code=fs.readFileSync('public/app.js','utf8');
const begin=code.indexOf('function canConfirmReviewedColor('),end=code.indexOf('function renderPhotoResults(',begin);
assert.ok(begin>=0&&end>begin,'Inline color confirmation must exist');

function setup(overrides={}){
 const saves=[],drafts=[],messages=[];let renderCount=0,persistCount=0,notifyCount=0,blocked=false;
 const item={id:'shirt',image:'photo',category:'Tops',itemType:'T-shirt',localAnalyzed:true,color:'',...overrides};
 const state={item,items:[],batch:[item],localPending:new Set(),categories:['Tops','Bottoms','Dresses','Outerwear','Shoes','Accessories'],db:{
  transaction(){const tx={objectStore:name=>({put(value){if(name==='items')saves.push(value);else drafts.push(value);}})};setImmediate(()=>{if(blocked)tx.onabort?.();else tx.oncomplete?.()});return tx;}
 },
 ClothingDetails:{validColor:v=>['Blue','Red','Brown','Orange','Black','White','Multicolor'].includes(v)},
 structuredClone,Date,queued:fn=>fn(),normalizeClothing:x=>x,
 persistDraft:()=>persistCount++,render:()=>renderCount++,scheduleMemoryReview:()=>notifyCount++,
 message:t=>messages.push(t)
 };
 vm.createContext(state);vm.runInContext(code.slice(begin,end),state);
 return {state,item,saves,drafts,messages,counts:()=>({renderCount,persistCount,notifyCount}),block:()=>blocked=true};
}
test('one selected color saves a recognized item and removes its draft',async()=>{
 const h=setup();assert.equal(h.state.canConfirmReviewedColor(h.item),true);
 const ok=await h.state.confirmReviewedColor(h.item,'Blue');
 assert.equal(ok,true);assert.equal(h.saves.length,1);
 assert.equal(h.saves[0].color,'Blue');assert.equal(h.saves[0].colorSource,'user');
 assert.equal(h.saves[0].name,'Blue T-shirt');
 assert.equal(h.state.items.length,1);assert.equal(h.state.batch.length,0);
 assert.deepEqual(h.drafts[0].batch,[]);
 assert.equal(h.counts().renderCount,1);
});
test('category-only result can be saved with color without inventing clothing subtype',async()=>{
 const h=setup({category:'Dresses',itemType:'Unknown'});
 assert.equal(await h.state.confirmReviewedColor(h.item,'Red'),true);
 assert.equal(h.saves[0].category,'Dresses');
 assert.equal(h.saves[0].itemType,'Unknown');
 assert.equal(h.saves[0].indexingLevel,'category-color');
 assert.equal(h.saves[0].name,'Red Dresses');
});
test('unsupported colors and unfinished recognition cannot quick-save',async()=>{
 const h=setup();
 assert.equal(await h.state.confirmReviewedColor(h.item,'Invisible'),false);
 assert.equal(h.saves.length,0);
 h.state.localPending.add(h.item.id);
 assert.equal(await h.state.confirmReviewedColor(h.item,'Blue'),false);
 assert.equal(h.state.batch.length,1);
});
test('duplicate, clipped, ownership, errors and manual edit items require full Adjust review',async()=>{
 for(const flag of ['possibleDuplicate','requiresOwnershipConfirmation','scanFailed','saveFailed','userAdjusted']){
  const h=setup({[flag]:true});
  assert.equal(await h.state.confirmReviewedColor(h.item,'Blue'),false,flag);
  assert.equal(h.saves.length,0);
 }
 for(const category of ['Uncategorized','Aliens']){
  const h=setup({category});
  assert.equal(await h.state.confirmReviewedColor(h.item,'Blue'),false,category);
 }
});
test('quick save cannot replace an already confirmed color',async()=>{
 const h=setup({color:'Brown'});
 assert.equal(h.state.canConfirmReviewedColor(h.item),false);
 assert.equal(await h.state.confirmReviewedColor(h.item,'Blue'),false);
});
test('a new photo captured before the write remains in the queued draft',async()=>{
 const h=setup(),newPhoto={id:'later',image:'another',category:'Uncategorized'};
 h.state.queued=work=>{h.state.batch.push(newPhoto);return work();};
 assert.equal(await h.state.confirmReviewedColor(h.item,'Black'),true);
 assert.equal(h.state.batch.length,1);assert.equal(h.state.batch[0],newPhoto);
 assert.equal(h.drafts.length,1);
 assert.deepEqual(h.drafts[0].batch,[newPhoto]);
});
test('photo removed during queued save is never written',async()=>{
 const h=setup();h.state.queued=work=>{h.state.batch=[];return work();};
 assert.equal(await h.state.confirmReviewedColor(h.item,'Black'),false);
 assert.equal(h.saves.length,0);assert.equal(h.counts().persistCount,0);
});
test('storage failure leaves original photo and does not create phantom closet item',async()=>{
 const h=setup();h.block();
 await assert.rejects(()=>h.state.confirmReviewedColor(h.item,'Black'));
 assert.equal(h.state.items.length,0);assert.equal(h.state.batch.length,1);
 assert.equal(h.counts().persistCount,0);
});

test('quick color save cannot bypass a clipped or category-conflicting outfit segmentation hint',async()=>{
 for(const hint of [
  {categories:['Tops'],types:[],clipped:true},
  {categories:['Bottoms'],types:[],clipped:false},
  {categories:['Tops'],types:['Polo'],clipped:false},
  {categories:[],types:[],clipped:false},
  {clipped:false}
 ]){
  const h=setup({segmentHint:hint});
  assert.equal(h.state.canConfirmReviewedColor(h.item),false,'unsafe hint '+JSON.stringify(hint));
  assert.equal(await h.state.confirmReviewedColor(h.item,'Blue'),false);
  assert.equal(h.saves.length,0);
 }
 const safe=setup({segmentHint:{categories:['Tops'],types:['Polo'],clipped:false},itemType:'Unknown'});
 assert.equal(safe.state.canConfirmReviewedColor(safe.item),true,'verified broad category may save without subtype');
 assert.equal(await safe.state.confirmReviewedColor(safe.item,'Blue'),true);
});
test('one-choice color confirmation is clearly offered rather than forcing Adjust for known garments',()=>{
 assert.match(code,/canConfirmReviewedColor\(item\)\?'Choose color to save'/);
 assert.match(code,/Garment category recognized\. Choose a color below to save; specific type is optional/);
 assert.match(code,/Garment identified\. Choose a color below to save; your original photo is kept/);
});

test('fragmented whole-outfit region cannot be quick-saved merely by choosing color',async()=>{
 const h=setup({outfitSourceId:'outfit-photo',
  segmentHint:{categories:['Tops'],types:[],clipped:false,
   displayFallback:'original-crop',displayFallbackReason:'fragmented-mask'}});
 assert.equal(h.state.canConfirmReviewedColor(h.item),false);
 assert.equal(await h.state.confirmReviewedColor(h.item,'Blue'),false);
 assert.equal(h.saves.length,0);
 assert.equal(h.state.batch.length,1);
 const other=setup({outfitSourceId:'outfit-photo',
  segmentHint:{categories:['Tops'],types:[],clipped:false}});
 assert.equal(other.state.canConfirmReviewedColor(other.item),true,
  'reliable masks keep the normal one-choice color flow');
});
