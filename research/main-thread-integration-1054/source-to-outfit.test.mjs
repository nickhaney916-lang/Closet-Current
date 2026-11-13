import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import vm from 'node:vm';
import {preflightOwnedOutfit1054} from './source-to-outfit.mjs';

// This runs the REAL native board normalizer from the pinned repository tree.
// Data URLs below are synthetic source-envelope fixtures, NOT real photographs,
// real image decoding, 3D renders or evidence of visual acceptance.
const context={URL,encodeURIComponent};
vm.createContext(context);
vm.runInContext(readFileSync('public/outfit-board-engine.js','utf8'),context);
const cleanBoard=(board,items)=>context.cleanOutfitBoard(board,items);
const ownerId='owner-A';
const session=()=>({authenticated:true,ownerId,epoch:7,
 privateDbName:'closet-current-user-'+ownerId});
const rawImage=(seed)=>{
 const bytes=Buffer.alloc(128,0);
 bytes[0]=255;bytes[1]=216;bytes[12]=seed;bytes[126]=255;bytes[127]=217;
 return {image:'data:image/jpeg;base64,'+bytes.toString('base64'),
  sha:createHash('sha256').update(bytes).digest('hex')};
};
function garment(id,category,seed,changes={}){
 const {image,sha}=rawImage(seed);
 return {id,ownerId,category,itemType:'Other',color:'Blue',
  sourceSHA256:sha,sourceHashVerified:true,sourcePhotoOriginal:true,
  originalPhoto:{image,sha256:sha},image,ownerReviewed:true,userAdjusted:true,
  singleGarmentVerified:true,...changes};
}
const set=()=>[
 garment('shirt','Tops',1),garment('pants','Bottoms',2),
 garment('shoes','Shoes',3)
];
const opts=(items,board={slots:{top:'shirt',bottom:'pants',shoes:'shoes'}},over={})=>({
 getSession:session,readOwnerItems:async()=>structuredClone(items),cleanBoard,board,...over
});
test('real board slots + M3 owner source index produce only original-photo 2D plans',async()=>{
 const items=set(),originals=items.map(x=>x.originalPhoto.image);
 const output=await preflightOwnedOutfit1054(opts(items));
 assert.equal(output.status,'source-verified-2d-only');
 assert.equal(output.renderAuthorized3D,false);
 assert.equal(output.releaseAuthorized,false);
 assert.equal(output.familyAlpha,'HOLD');
 assert.equal(output.slots.length,3);
 assert.deepEqual(output.slots.map(s=>s.itemId),['shirt','pants','shoes']);
 assert.ok(output.slots.every(s=>s.presentationMode==='verified-original-photo-2d'));
 assert.deepEqual(items.map(x=>x.originalPhoto.image),originals);
 assert.equal(JSON.stringify(output).includes('data:image'),false);
});
test('unreviewed AI suggestion cannot become an accepted owner garment',async()=>{
 const items=set();items[0].ownerReviewed=false;
 await assert.rejects(preflightOwnedOutfit1054(opts(items)),/review evidence/);
});
test('unknown color and unconfirmed type cannot enter the validated outfit',async()=>{
 for(const change of [{color:'Unknown'},{itemType:'Unknown'},{colorSource:'photo-estimate'}]){
  const items=set();Object.assign(items[0],change);
  await assert.rejects(preflightOwnedOutfit1054(opts(items)),/review evidence/);
 }
});
test('foreign owner item and missing signed owner database always fail',async()=>{
 const items=set();items[0].ownerId='owner-B';
 await assert.rejects(preflightOwnedOutfit1054(opts(items)),/cross-owner-record/);
 const others=set();
 await assert.rejects(preflightOwnedOutfit1054(opts(others,undefined,{
  getSession:()=>({authenticated:true,ownerId,epoch:7,privateDbName:'closet-current-user-owner-B'})
 })),/signed owner session/);
});
test('owner switch or epoch refresh during asynchronous read revokes result',async()=>{
 const items=set();let epoch=7;
 await assert.rejects(preflightOwnedOutfit1054(opts(items,undefined,{
  getSession:()=>({...session(),epoch}),
  readOwnerItems:async()=>{epoch=8;return structuredClone(items);}
 })),/owner session changed/);
});
test('selected source edited between private reads cannot pass',async()=>{
 const items=set();let calls=0;
 await assert.rejects(preflightOwnedOutfit1054(opts(items,undefined,{
  readOwnerItems:async()=>{
   const copy=structuredClone(items);
   if(++calls===2)copy[0].color='Pink';
   return copy;
  }
 })),/saved garment changed/);
});
test('changed JPEG bytes with unchanged claimed SHA is rejected',async()=>{
 const items=set();items[0].originalPhoto.image=rawImage(99).image;
 await assert.rejects(preflightOwnedOutfit1054(opts(items)),/SHA does not match/);
});
test('missing original SHA, missing JPEG and legacy saved photo are blocked',async()=>{
 for(const change of [
  {sourceHashVerified:false},
  {originalPhoto:null},
  {sourcePhotoOriginal:false}
 ]){
  const items=set();Object.assign(items[0],change);
  await assert.rejects(preflightOwnedOutfit1054(opts(items)),/review evidence/);
 }
});
test('actual native dress normalizer silently drops outer layers: gate refuses loss',async()=>{
 const dress=garment('dress','Dresses',4),layer=garment('coat','Outerwear',5);
 const input={slots:{top:'dress',layer:'coat'}};
 const original=structuredClone(input);
 const normalized=cleanBoard(input,[dress,layer]);
 assert.equal(normalized.slots.layer,undefined);
 await assert.rejects(preflightOwnedOutfit1054(opts([dress,layer],input)),/silently lose/);
 assert.deepEqual(input,original);
});
test('dress alone stays eligible for safe original-photo fallback, not 3D',async()=>{
 const result=await preflightOwnedOutfit1054(opts([garment('dress','Dresses',6)],{slots:{top:'dress'}}));
 assert.equal(result.slots.length,1);
 assert.equal(result.renderAuthorized3D,false);
});
test('orphan garment ID, same ID twice and invalid slot all refuse',async()=>{
 const items=set();
 for(const board of [
  {slots:{top:'does-not-exist'}},
  {slots:{top:'shirt',layer:'shirt'}},
  {slots:{garment:'shirt'}}
 ])await assert.rejects(preflightOwnedOutfit1054(opts(items,board)));
});
test('same source for two physical items never silently de-duplicates or fits',async()=>{
 const items=set();
 items[1].originalPhoto=structuredClone(items[0].originalPhoto);
 items[1].sourceSHA256=items[0].sourceSHA256;
 await assert.rejects(preflightOwnedOutfit1054(opts(items)),/duplicate or ambiguous/);
});
test('multi-item crop requires explicit reviewed source-linked cutout evidence',async()=>{
 const items=set();
 items[0].singleGarmentVerified=false;
 items[0].segmentHint={cutoutSHA256:'b'.repeat(64),originalSHA256:items[0].sourceSHA256};
 items[0].outfitSourceId='original-outfit';
 await assert.rejects(preflightOwnedOutfit1054(opts(items)),/cutout proof/);
 items[0].segmentHint.verified=true;
 items[0].segmentHint.ownerReviewedInstance=true;
 const result=await preflightOwnedOutfit1054(opts(items));
 assert.equal(result.slots[0].presentationMode,'verified-original-photo-2d');
 assert.equal(result.renderAuthorized3D,false);
});
test('missing private account attestation or nonfunction board normalizer refuses',async()=>{
 const items=set();
 await assert.rejects(preflightOwnedOutfit1054(opts(items,undefined,{cleanBoard:null})),/adapter required/);
 await assert.rejects(preflightOwnedOutfit1054(opts(items,undefined,{getSession:()=>null})),/signed owner session/);
});
