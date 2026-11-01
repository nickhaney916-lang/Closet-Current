import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {prepareIndexedGarmentsFor3D,applyIndexed3DSelection,VERIFIED_PUBLIC_SHIRT_SHA256} from '../research/three-d-69/index-to-real-garment-viewer.mjs';
import {isVettedOriginalGarmentCandidate,loadSourceVetted3D69ResearchBundle} from '../research/three-d-69/sha-verified-original-garment-sources.mjs';
import {PANTS_RESEARCH_SOURCE as A,PANTS_RESEARCH_SOURCE_SECOND as B} from '../research/three-d-30/reviewed-photo-pants.mjs';
const ownerId='only-synthetic-research-owner';
const fixture=(slot,hash)=>({
 itemId:slot==='top'?'shirt':'pants',sourceSHA256:hash,actual3DMeshReady:false,
 category:slot==='top'?'Tops':'Bottoms',anatomicalSlot:slot==='top'?'shirt-or-dress':'pants',
 originalSourceId:'original-source-'+slot
});
const plan=(slots)=>({ownerId,generation:2,selected:slots,releaseAuthorized:false,
 actual3DMeshReady:false,sourceClothingCategoryVerified:true,sourcePhotoIdentityPreserved:true});
test('3D69 exact licensed source SHA registry pinned to genuine source files',()=>{
 assert.equal(VERIFIED_PUBLIC_SHIRT_SHA256,'cb909d7ad9c3940bfa4db0cc50b2ea7025faebe3dcec8fe80067f900760bba64');
 assert.equal(A.originalSHA256,'b316902ad85e8ff46b164ceb7f2c38d3c1424c9d789703e0267e3dfce68fbe1c');
 assert.equal(B.originalSHA256,'aa7f288055874773b87cd38b5b4e473b532920f61c2d17cb0ccd7872466c444a');
 const loader=readFileSync(new URL('../research/three-d-69/sha-verified-original-garment-sources.mjs',import.meta.url),'utf8');
 assert.match(loader,/crypto\.subtle\.digest\('SHA-256',bytes\)/);
 assert.match(loader,/loadLicensedCutout\('commons-0003'/);
 assert.match(loader,/cutoutSHA256/);
 assert.match(loader,/visible color pixels do not match/);
 assert.match(loader,/trusted\.add\(pant\);trusted\.add\(shirt\)/);
 assert.doesNotMatch(loader,/localStorage|indexedDB|sendBeacon|navigator\.sendBeacon/);
});
test('generic closet photo MUST FALL BACK, not invent 3D clothing',()=>{
 const unverified=plan({top:fixture('top','d'.repeat(64)),bottom:fixture('bottom',A.originalSHA256)});
 const x=prepareIndexedGarmentsFor3D(unverified);
 assert.equal(x.status,'original-photo-fallback');
 assert.equal(x.actual3DMeshReady,false);
 assert.equal(x.releaseAuthorized,false);
 assert.equal(x.fallback,'existing-2d-board-and-original-photo');
 assert.throws(()=>applyIndexed3DSelection({},x,{checkCurrentSession:()=>({authenticated:true,ownerId,generation:2})}),/Actual approved/);
 const pantsOnly=prepareIndexedGarmentsFor3D(plan({bottom:fixture('bottom',A.originalSHA256)}));
 assert.equal(pantsOnly.actual3DMeshReady,false);
});
test('source candidates spoofed with perfect-looking SHA/booleans are NOT acceptable',()=>{
 const p=plan({top:fixture('top',VERIFIED_PUBLIC_SHIRT_SHA256),bottom:fixture('bottom',A.originalSHA256)});
 const fakeShirt={id:'commons-0003',sourceSHA256:VERIFIED_PUBLIC_SHIRT_SHA256,type:'shirt',
  cutout:{width:1024,height:1536,decode:async()=>{}},realFabricTexture:true,
  original:{},ownerApproved:false,releaseAuthorized:false,humanVisualApproval:false,
  cropRect:[0,0,1,1],baseColor:[.1,.1,.1]};
 const fakePants={id:A.id,sourceSHA256:A.originalSHA256,cutoutSHA256:A.cutoutSHA256,
  cutout:{width:435,height:650},type:'pants',sourceAssetsVerified:true,
  originalVerified:true,cutoutVerified:true,visibleSourceRGBPreserved:true,
  frontOrientationReviewed:true,neutralColorRGB:[83,104,135],cropRect:[.1,.1,.8,.8],
  ownerApproved:false,humanVisualApproval:false,releaseAuthorized:false,provisional:true};
 assert.equal(isVettedOriginalGarmentCandidate(fakeShirt),false);
 assert.equal(isVettedOriginalGarmentCandidate(fakePants),false);
 assert.throws(()=>prepareIndexedGarmentsFor3D(p,{shirtCandidate:fakeShirt,pantsCandidate:fakePants}),/Independently SHA-tested/);
 assert.throws(()=>prepareIndexedGarmentsFor3D(plan({bottom:fixture('bottom',A.originalSHA256)}),{pantsCandidate:fakePants}),/Independently SHA-tested/);
 assert.equal(Object.hasOwn(p,'candidatePants'),false);
 const fakeReady={status:'source-bound-3d-ready-for-provisional-preview',actual3DMeshReady:true,ownerId,generation:2,releaseAuthorized:false};
 assert.throws(()=>applyIndexed3DSelection({},fakeReady,{checkCurrentSession:()=>({authenticated:true,ownerId,generation:2})}),/Actual approved/);
});
test('unsupported dresses, layers, shoes and third-party clothes refuse pretend wearable 3D',()=>{
 const p=plan({top:fixture('top',VERIFIED_PUBLIC_SHIRT_SHA256),bottom:fixture('bottom',B.originalSHA256),
  layer:{itemId:'jacket',sourceSHA256:'f'.repeat(64),actual3DMeshReady:false,category:'Outerwear'}});
 const x=prepareIndexedGarmentsFor3D(p);
 assert.equal(x.actual3DMeshReady,false);
 assert.match(x.reason,/layers\/shoes\/dress\/accessories/);
 const dress=prepareIndexedGarmentsFor3D(plan({top:{...fixture('top','e'.repeat(64)),category:'Dresses'}}));
 assert.equal(dress.actual3DMeshReady,false);
 assert.throws(()=>prepareIndexedGarmentsFor3D({ownerId,generation:2,releaseAuthorized:true,
  selected:{},actual3DMeshReady:false,sourceClothingCategoryVerified:true,sourcePhotoIdentityPreserved:true}),/Verified/);
});
test('only actual real licensed original image loaders grant research source capability',async()=>{
 await assert.rejects(()=>loadSourceVetted3D69ResearchBundle({denim:'unrecognized'}),/Only pinned/);
 await assert.rejects(()=>loadSourceVetted3D69ResearchBundle({denim:'public',fetcher:async()=>({ok:false})}),/asset not available/);
 const source=readFileSync(new URL('../research/three-d-69/index-to-real-garment-viewer.mjs',import.meta.url),'utf8');
 assert.match(source,/WeakMap/);
 assert.match(source,/get\(prepared\)/);
 assert.match(source,/sourceSHA256s/);
 assert.doesNotMatch(source,/userCameraImage|generateFakeRear|fakePhotorealisticTexture/);
});
