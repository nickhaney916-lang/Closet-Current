import test from 'node:test';
import assert from 'node:assert/strict';
import {measureUpperSilhouette62,fitReviewedUpperPhoto62,UPPER_PHOTO_SOURCES_62}
 from '../research/user-photo-to-anatomical-3d-62/silhouette-fit.mjs';
import {inspectPhotoSilhouetteFit62}
 from '../research/user-photo-to-anatomical-3d-62/admission.mjs';

const source=UPPER_PHOTO_SOURCES_62['commons-0016'];
const cutoutSHA='b'.repeat(64);
const cutoutReviewReceipt=()=>({ownerReviewed:true,status:'approved',reviewId:'review-62-valid',
 ownerId:'owner-p62',garmentId:'saved-blouse',sourceId:'commons-0016',
 originalSourceSHA256:source.sourceSHA256,cutoutSHA256:cutoutSHA});
function mask(){
 const width=96,height=128,data=new Uint8ClampedArray(width*height*4);
 for(let y=10;y<118;y++){
  const t=(y-10)/108,half=t<.2?18+t*30:t>.78?31-(t-.78)*14:24;
  for(let x=Math.floor(width/2-half);x<Math.ceil(width/2+half);x++)data[(y*width+x)*4+3]=255;
 }
 return {data,width,height};
}
const profile=()=>measureUpperSilhouette62({...mask(),sourceId:'commons-0016',
 sourceSHA256:source.sourceSHA256,cutoutSHA256:cutoutSHA,
 cutoutReviewReceipt:cutoutReviewReceipt()});

test('P62 derives a bounded normalized silhouette only from an exact reviewed source and mask',()=>{
 const p=profile();assert.equal(p.accepted,true);assert.equal(p.sourceId,'commons-0016');
 assert.equal(p.itemType,'Blouse');assert.equal(p.measurements,'normalized-photo-silhouette-only');
 assert.equal(p.inferredBack,true);assert.equal(p.releaseAuthorized,false);
 assert.equal(measureUpperSilhouette62({...mask(),sourceId:'commons-0016',
  sourceSHA256:'a'.repeat(64),cutoutSHA256:'b'.repeat(64),
  cutoutReviewReceipt:cutoutReviewReceipt()}).accepted,false);
 assert.equal(measureUpperSilhouette62({...mask(),sourceId:'commons-0016',
  sourceSHA256:source.sourceSHA256,cutoutSHA256:cutoutSHA}).accepted,false);
 assert.equal(measureUpperSilhouette62({...mask(),sourceId:'commons-0016',
  sourceSHA256:source.sourceSHA256,cutoutSHA256:cutoutSHA,
  cutoutReviewReceipt:{...cutoutReviewReceipt(),status:'review'}}).accepted,false);
});

test('P62 keeps clipped, empty, unsupported, or asymmetric masks on the original-photo fallback',()=>{
 const base=mask();const clipped={...base,data:base.data.slice()};
 for(let y=0;y<clipped.height;y++)for(let x=0;x<clipped.width;x++)
  if(x<20)clipped.data[(y*clipped.width+x)*4+3]=255;
 const args={sourceId:'commons-0016',sourceSHA256:source.sourceSHA256,
  cutoutSHA256:'c'.repeat(64),cutoutReviewReceipt:{...cutoutReviewReceipt(),cutoutSHA256:'c'.repeat(64)}};
 assert.equal(measureUpperSilhouette62({...clipped,...args}).accepted,false);
 assert.equal(measureUpperSilhouette62({...base,...args,sourceId:'private-photo'}).accepted,false);
});

test('P62 refuses a source shell without its exact reviewed source SHA and 163-bone body binding',()=>{
 const p=profile(),shirt={stats:{sourceSHA256:'d'.repeat(64)},meshes:[]};
 assert.throws(()=>fitReviewedUpperPhoto62(shirt,{traverse(){}},p),/exact reviewed source-photo silhouette/);
 const noRig={stats:{sourceSHA256:p.sourceSHA256},meshes:[{name:'Work56-independent-shirt-shell',isSkinnedMesh:true,skeleton:{bones:[]}}]};
 assert.throws(()=>fitReviewedUpperPhoto62(noRig,{traverse(){}},p),/163-bone fitted source garment shell/);
});

test('P62 owner-bound native admission requires an actual matching source silhouette mesh receipt',()=>{
 const owner='owner-p62',id='saved-blouse';
 const base={selection:{ownerId:owner,slots:{top:id}},
  cutoutReviewReceipt:{...cutoutReviewReceipt(),cutoutSHA256:'c'.repeat(64)},
  sources:{ownerId:owner,sources:[{id,sha256:source.sourceSHA256}]},
  proof171:{admitted:true},render:{privateVisible:true,viewerReady:true,bones:163,
   viewerMode:'shirt',releaseAuthorized:false,productionDeployed:false,
   fitReceipts171:{shirt:{silhouette62:{sourcePhotoSilhouetteFit62:true,
    silhouetteSourceSHA256:source.sourceSHA256,cutoutSHA256:'c'.repeat(64),
    silhouetteFit62MovedVertices:500,silhouetteFit62MaxMeters:.012,
    normalizedSilhouetteOnly:true,inferredRear62:true}}}}};
 const ok=inspectPhotoSilhouetteFit62(base);
 assert.equal(ok.admitted,true);assert.equal(ok.itemId,id);assert.equal(ok.maxMovementMeters,.012);
 assert.equal(ok.humanVisualApproval,false);assert.equal(ok.releaseAuthorized,false);
 for(const mutate of [
  x=>x.sources.ownerId='foreign',x=>x.sources.sources[0].sha256='a'.repeat(64),
  x=>x.render.bones=162,x=>x.render.fitReceipts171.shirt.silhouette62.cutoutSHA256='not-hash',
  x=>x.render.fitReceipts171.shirt.silhouette62.inferredRear62=false,
  x=>x.cutoutReviewReceipt.status='review',
  x=>x.cutoutReviewReceipt=null,
  x=>x.cutoutReviewReceipt.ownerId='foreign',
  x=>x.cutoutReviewReceipt.originalSourceSHA256='a'.repeat(64),
  x=>x.cutoutReviewReceipt.cutoutSHA256='d'.repeat(64),
  x=>x.proof171.admitted=false
 ]){const value=structuredClone(base);mutate(value);assert.equal(inspectPhotoSilhouetteFit62(value).admitted,false);}
});
