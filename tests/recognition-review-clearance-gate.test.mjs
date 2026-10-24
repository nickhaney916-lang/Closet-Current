import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import vm from 'node:vm';

// Exercise the ACTUAL async app recognition function, not a copied policy or
// mock gate. No browser, internet, model weights, customer photos or Supabase.
const source=await readFile('public/app.js','utf8');
const begin=source.indexOf('async function recognizeItem(item){');
const end=source.indexOf('\nasync function recognizeBatch()',begin);
assert.ok(begin>=0&&end>begin,'real recognition handler must remain accessible for the regression fixture');
const handler=source.slice(begin,end);
assert.ok(source.includes('!item.recognitionReviewRequired&&'),
 'save-index admission must continue checking reviewRequired');

function runFixture({
 category='Uncategorized',type='Unknown',color='Blue',
 strong=true,partial=false,modelCategory='Shoes',modelType='Sneakers',
 allowsMask=true,userAdjusted=false,duplicate=false,ownership=false,
 originalCrop=false,sourceChanges=false,blank=false
}={}){
 const item={
  id:'synthetic-item-1',image:'data:image/jpeg;base64,synthetic-source-A',
  category,itemType:type,color,userAdjusted,
  requiresOwnershipConfirmation:ownership,
  originalPhoto:originalCrop?{image:'data:image/jpeg;base64,synthetic-scene-A'}:null,
  outfitSourceId:originalCrop?'synthetic-outfit-id':null,
  segmentHint:originalCrop?{displayFallback:'original-crop'}:null
 };
 let saved=0;
 const fakeDB={};
 const ctx={
  window:{closetAuth:{user:{id:'synthetic-owner-A'}}},
  db:fakeDB,batch:[item],items:duplicate?[{id:'synthetic-existing',image:item.image}]:[],recognitionState:{phase:'ready',activeId:null},
  render(){},persistDraft(){},message(){},
  localPending:new Set([item.id]),
  localReady:true,recognitionUnavailable:false,
  recognitionSourcePhoto:x=>x.image,
  checkPhoto:async()=>({blank,signature:'synthetic-signature',aspect:1,colorEstimate:null}),
  ClothingDetails:{
   fillColor(){return {};},
   fill(i,c,details){return details?.color?{color:details.color}:{};},
   validColor:value=>typeof value==='string'&&value.length>0&&value!=='Unknown'
  },
  trustedAutomaticPhotoColor(){return null;},
  exactlyRepeatedCapturedItem:()=>false,
  independentlyDistinctOutfitRegions:()=>true,
  similarPhotos:()=>false,
  localRequest:async()=>{
   if(sourceChanges)item.image='data:image/jpeg;base64,synthetic-source-B';
   return {
    strong,categoryConfirmed:partial,categoryOnly:partial,
    choices:strong||partial?[{category:modelCategory,itemType:partial?'Unknown':modelType}]:[],
    details:{color},reason:strong?'strong':'review'
   };
  },
  clothingSchema:{types:{
   Shoes:['Sneakers','Ankle boots'],
   Tops:['T-shirt','Blouse'],
   Bottoms:['Shorts','Skirt'],
   Dresses:['Dress']
  }},
  segmentationAllows:()=>allowsMask,
  applyLocalChoice:(target,choice)=>{
   target.category=choice.category;
   target.itemType=choice.itemType;
  },
  saveIndexed:async target=>{
   assert.equal(target.recognitionReviewRequired,false,
    'only a fully verified path may enter the save routine');
   saved++;
   return true;
  },
  recordDeviceEvent(){},
  $:()=>({textContent:''})
 };
 const execute=vm.runInNewContext(handler+'\nrecognizeItem',ctx,{timeout:1200});
 return {item,run:async()=>execute(item),get saved(){return saved}};
}

test('strong Shoes/Sneakers, with known color and correct mask, clears review only on final save path',async()=>{
 const fixture=runFixture();
 await fixture.run();
 assert.equal(fixture.saved,1);
 assert.equal(fixture.item.category,'Shoes');
 assert.equal(fixture.item.itemType,'Sneakers');
 assert.equal(fixture.item.recognitionReviewRequired,false);
});
test('strong model with incompatible segmentation stays review-required, never auto-saves',async()=>{
 const fixture=runFixture({allowsMask:false});
 await fixture.run();
 assert.equal(fixture.saved,0);
 assert.equal(fixture.item.recognitionReviewRequired,true);
 assert.match(fixture.item.localStatus,/mask and garment checks disagree/);
});
test('even a broad-category-only proposal cannot bypass segmentation denial',async()=>{
 const fixture=runFixture({strong:false,partial:true,allowsMask:false,modelCategory:'Bottoms'});
 await fixture.run();
 assert.equal(fixture.saved,0);
 assert.equal(fixture.item.recognitionReviewRequired,true);
 assert.equal(fixture.item.category,'Uncategorized');
});
test('unverified original-outfit crop remains review-required despite a confident subtype',async()=>{
 const fixture=runFixture({originalCrop:true});
 await fixture.run();
 assert.equal(fixture.saved,0);
 assert.equal(fixture.item.recognitionReviewRequired,true);
 assert.match(fixture.item.localStatus,/may include more than one item/);
});
test('user-edited garment is preserved and remains flagged for review',async()=>{
 const fixture=runFixture({userAdjusted:true,category:'Bottoms',type:'Shorts',modelCategory:'Bottoms',modelType:'Shorts'});
 await fixture.run();
 assert.equal(fixture.saved,0);
 assert.equal(fixture.item.category,'Bottoms');
 assert.equal(fixture.item.itemType,'Shorts');
 assert.equal(fixture.item.recognitionReviewRequired,true);
});
test('category conflict and shoe-vs-bottom subtype conflict refuse automatic clearance',async()=>{
 const fixture=runFixture({category:'Bottoms',type:'Skirt',modelCategory:'Shoes'});
 await fixture.run();
 assert.equal(fixture.saved,0);
 assert.equal(fixture.item.recognitionReviewRequired,true);
 assert.match(fixture.item.localStatus,/disagree with the current category/);
});
test('missing original-derived color must not clear the review flag',async()=>{
 const fixture=runFixture({color:''});
 await fixture.run();
 assert.equal(fixture.saved,0);
 assert.equal(fixture.item.recognitionReviewRequired,true);
 assert.match(fixture.item.localStatus,/Choose a color/);
});
test('possible duplicate and pending ownership confirmation cannot clear review flag',async()=>{
 for(const opts of [{duplicate:true},{ownership:true}]){
  const fixture=runFixture(opts);
  await fixture.run();
  assert.equal(fixture.saved,0);
  assert.equal(fixture.item.recognitionReviewRequired,true);
 }
});
test('category-only Bottoms/Unknown with original color can safely save, no fabricated skirt/shorts label',async()=>{
 const fixture=runFixture({strong:false,partial:true,modelCategory:'Bottoms'});
 await fixture.run();
 assert.equal(fixture.saved,1);
 assert.equal(fixture.item.category,'Bottoms');
 assert.equal(fixture.item.itemType,'Unknown');
 assert.equal(fixture.item.recognitionReviewRequired,false);
});
test('category-only with no color remains review-required rather than falsely complete',async()=>{
 const fixture=runFixture({strong:false,partial:true,color:'',modelCategory:'Bottoms'});
 await fixture.run();
 assert.equal(fixture.saved,0);
 assert.equal(fixture.item.recognitionReviewRequired,true);
});
test('abstained model output cannot clear reviewRequired even when color is known',async()=>{
 const fixture=runFixture({strong:false,partial:false});
 await fixture.run();
 assert.equal(fixture.saved,0);
 assert.equal(fixture.item.recognitionReviewRequired,true);
});
test('source photo changes during delayed classification cannot clear old item reviewRequired',async()=>{
 const fixture=runFixture({sourceChanges:true});
 await fixture.run();
 assert.equal(fixture.saved,0);
 assert.equal(fixture.item.recognitionReviewRequired,true);
 assert.match(fixture.item.localStatus,/Photo or category changed during recognition/);
});
test('blank original photo cannot be automatically indexed by a confident classifier',async()=>{
 const fixture=runFixture({blank:true});
 await fixture.run();
 assert.equal(fixture.saved,0);
 assert.equal(fixture.item.recognitionReviewRequired,true);
});
