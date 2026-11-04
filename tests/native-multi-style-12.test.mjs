import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {verifiedRecord24} from '../research/multi-garment-capture-01/atomic-group.mjs';
import {reviewedVisiblePiece12,verifiedPrivateStyleRoster03} from '../research/style-owned-live-03/native-style-panel.mjs';
import {suggestThreeNativeOwned03} from '../research/style-owned-live-03/three-owned-looks-native.mjs';
import {assessWardrobePhoto01} from '../research/user-photo-3d-01/photo-readiness.mjs';
const owner='integration12-owner-A';
const bytes=readFileSync('benchmark/fixtures/commons-0003.jpg');
const hash=createHash('sha256').update(bytes).digest('hex');
const image='data:image/jpeg;base64,'+bytes.toString('base64');
const proof={image,sourceSHA256:hash,sourceHashVerified:true,
 originalPhoto:{image,sha256:hash,width:800,height:900,origin:'licensed-fixture'}};
const specs=[
 ['shirt','seg-4-3-5-17-24-1','Tops','T-shirt','Red'],
 ['jeans','seg-6-2-18-20-33-1','Bottoms','Jeans','Blue'],
 ['shoes','seg-9-3-30-16-36-1','Shoes','Sneakers','White']
];
function rows(){
 return specs.map(([id,instanceKey,category,itemType,color],i)=>verifiedRecord24({
  proof,ownerId:owner,piece:{id,instanceKey,category,itemType,color,
   cropBounds:{x:.1+i*.25,y:.15,width:.22,height:.42},image,
   confirmed:true,cropReviewed:true,manual:false,maskApplied:false}
 }));
}
function board(items,{id=owner,generation=12}={}){
 return {status:()=>({active:true}),sessionLease:()=>({ownerId:id,generation}),
  readOnlyWardrobe:()=>({ownerId:id,generation,boardFingerprint:'unchanged-12',
   items:structuredClone(items)})};
}
test('one unchanged authentic source produces three distinct reviewed, owner-indexed photo-only items',()=>{
 const r=rows();
 assert.equal(new Set(r.map(x=>x.id)).size,3);
 assert.equal(new Set(r.map(x=>x.sourcePieceKey)).size,3);
 assert.ok(r.every(x=>reviewedVisiblePiece12(x)&&x.originalPhoto.image===image&&
  x.sourceSHA256===hash&&x.singleGarmentVerified===false&&x.threeDReady===false));
 assert.deepEqual(r.map(x=>x.category),['Tops','Bottoms','Shoes']);
});
test('verified native styling admits human-reviewed visible crops, never rebrands their original as a singleton',async()=>{
 const r=rows(),snapshot=structuredClone(r);
 const admission=await verifiedPrivateStyleRoster03(board(r));
 assert.equal(admission.items.length,3);
 assert.equal(admission.pending.length,0);
 assert.equal(admission.rejected.length,0);
 assert.ok(admission.items.every(x=>x.visibleCropPhotoOnly&&x.threeDReady===false&&
  x.sourcePhotoFallbackRequired&&x.genuinePhoto===x.image&&x.sourceSHA256===hash));
 const style=suggestThreeNativeOwned03(admission.items,{ownerId:owner,pinnedId:'shirt'});
 assert.equal(style.combinations.length,1,'3 saved pieces allow one real look, not 3 fabricated looks');
 assert.equal(style.combinations[0].slots.top,'shirt');
 assert.equal(style.combinations[0].slots.bottom,'jeans');
 assert.equal(style.combinations[0].slots.shoes,'shoes');
 assert.equal(style.combinations[0].certified3D,false);
 const readiness=await assessWardrobePhoto01(r[0],{ownerId:owner});
 assert.equal(readiness.readiness,'Photo-Only');
 assert.equal(readiness.rendered3D,false);
 assert.deepEqual(r,snapshot,'styling and readiness never edit the stored JPEG or outfit rows');
});
test('missing user evidence and wrong region keys fail closed without a false single-photo approval',async()=>{
 const valid=rows()[0];
 for(const edited of [
  {...valid,sourcePieceKey:hash+'/not-a-region'},
  {...valid,sourceHashVerified:false},
  {...valid,sourceCropReviewed:false},
  {...valid,extractionReview:'model-guessed'},
  {...valid,photoOnly:false},
  {...valid,threeDReady:true},
  {...valid,itemType:'Unknown'},
  {...valid,sourcePhotoId:'0'.repeat(64)}
 ]){
  assert.equal(reviewedVisiblePiece12(edited),false);
  const rejected=await verifiedPrivateStyleRoster03(board([edited]));
  assert.equal(rejected.items.length,0);
  assert.equal(rejected.pending.length,0,'a multi-piece photo cannot honestly be re-approved as one original');
  assert.equal(rejected.rejected.length,1);
 }
 assert.throws(()=>verifiedRecord24({proof,ownerId:owner,piece:{
  id:'unknown',instanceKey:'manual-120-340-230-300',
  category:'Tops',itemType:'Unknown',color:'Blue',
  image,cropBounds:{x:.1,y:.1,width:.3,height:.3},
  confirmed:true,manual:true,cropReviewed:true
 }}),/unreviewed or invalid/);
});
test('category correction does not alter canonical SHA/source key, and tampered JPEG loses style eligibility',async()=>{
 const originals=rows(),changed=structuredClone(originals);
 changed[0].category='Outerwear';changed[0].itemType='Jacket';
 const corrected=await verifiedPrivateStyleRoster03(board(changed));
 assert.equal(corrected.items.length,3);
 assert.equal(corrected.items[0].id,'shirt');
 assert.equal(corrected.items[0].sourcePieceKey,originals[0].sourcePieceKey);
 assert.equal(corrected.items[0].originalPhoto.image,image);
 assert.equal(suggestThreeNativeOwned03(corrected.items,{ownerId:owner,pinnedId:'shirt'}).combinations.length,0,
  'no alternative top exists; incompatible correction must not invent a complete look');
 const tampered=structuredClone(originals);
 tampered[0].originalPhoto.sha256='0'.repeat(64);
 const blocked=await verifiedPrivateStyleRoster03(board(tampered));
 assert.equal(blocked.items.length,2);
 assert.equal(blocked.rejected.length,1);
 assert.deepEqual(originals.map(x=>[x.id,x.sourcePieceKey,x.sourceSHA256,x.originalPhoto.sha256]),
  rows().map(x=>[x.id,x.sourcePieceKey,x.sourceSHA256,x.originalPhoto.sha256]),
  'permanent owner IDs and source hashes are deterministic; savedAt timestamps are not');
});
test('foreign owner and incorrect generation cannot share a multi-photo styling roster',async()=>{
 await assert.rejects(verifiedPrivateStyleRoster03(board(rows(),{id:'other-owner'})),/owner|mismatch/);
 let generation=12;
 const b=board(rows());b.sessionLease=()=>({ownerId:owner,generation:++generation});
 await assert.rejects(verifiedPrivateStyleRoster03(b),/changed/);
});
