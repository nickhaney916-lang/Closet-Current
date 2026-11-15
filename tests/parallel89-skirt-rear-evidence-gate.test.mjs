import test from 'node:test';
import assert from 'node:assert/strict';
import {summarizeOriginalSkirtUnphotographedRear89} from
 '../research/parallel89/skirt-rear-evidence-gate89.mjs';
const sha='c8d0812ab69d698f5bf8dc5a14ace6b8034e4c74152471acf4f079fdd6d0c344';
const round=n=>Math.round(n*1e5)/1e5;
function build(){
 const rows=[];
 for(const avatar of ['female','male'])
  for(const pose of ['source','blend-50','relaxed'])
   for(const viewAngle of [0,90,180]){
    const rear=viewAngle===0?483:viewAngle===90?15837:avatar==='female'?49987:51114,
     whole=viewAngle===0?30000:viewAngle===90?33000:avatar==='female'?50100:51250;
    rows.push({
     schema:'P89-actual-original-licensed-photo-visible-provisional-neutral-rear/v1',
     status:'ORIGINAL_PUBLIC_SKIRT_UNPHOTOGRAPHED_REAR_RENDERED_NOT_REAL_PHOTO',
     avatar,pose,viewAngle,sourcePhotoId:'commons-0043',
     actual163BoneSourceRig:true,
     sourceFrontPhotographedSurfaceTriangleCount:288,
     sourceUnphotographedRearTriangleCount:288,
     unphotographedRearMarkerPixels:rear,
     opaqueSourceMeshProjectedMarkerPixels:whole,
     inferredRearLowerBoundShareOfOpaqueProjectedOriginalSkirt:round(rear/whole),
     opaqueFrontMarkerOverestimatesPhotographicAlphaCoverage:true,
     projectedSourceDenominatorNotTruePhotographedVisiblePixels:true,
     originalPhotoFrontUVAndRGBUnchanged:true,
     originalSkirtSourcePhotoAndAnatomicalGeometryUnchanged:true,
     temporaryAttributionMaterialDisposedAndRestored:true,
     originalRearPhotoObserved:false,
     inferredBackDoesNotBecomePhotographed:true,
     originalMaskOwnerApproved:false,
     sourcePhoto2DFallbackRequired:true,
     consumer3DAdmitted:false,releaseAuthorized:false
    });
   }
 return {rows,sourceSHA256:sha,sourcePhotoRearObserved:false};
}
test('18 genuine public original model/avatar angle receipts prove inferred back is visible but can NEVER authorize a photographed rear',()=>{
 const x=build(),before=JSON.stringify(x);
 const r=summarizeOriginalSkirtUnphotographedRear89(x);
 assert.equal(r.status,'ORIGINAL_SKIRT_ONLY_FRONT_PHOTOGRAPHED_REAR_NOT_SOURCE_VERIFIED');
 assert.equal(r.originalPhotoFrontTriCount,288);
 assert.equal(r.inferredUnphotographedBackTriCount,288);
 assert.equal(r.actualNativeOriginalPhotoViewReports,18);
 assert.equal(r.groupedSourcePublicCounts.length,2);
 assert.ok(r.groupedSourcePublicCounts.every(v=>
  v.angles.length===3&&v.angles[2].guaranteedMinimumSourceInferredMaterialShareOfOpaqueProjectedSkirt>.7));
 assert.equal(r.originalRearPhotoVerified,false);
 assert.equal(r.consumer3DAdmitted,false);assert.equal(r.releaseAuthorized,false);
 assert.equal(r.sourcePhoto2DFallbackRequired,true);
 assert.equal(r.independentPhotorealismAccepted,false);
 assert.equal(JSON.stringify(x),before);
});
test('missing, repeated, forged or selfie/user rear evidence does NOT become original photo',()=>{
 const original=build();
 const bad=[
  {...original,sourceSHA256:'0'.repeat(64)},
  {...original,sourcePhotoRearObserved:true},
  {...original,rows:original.rows.slice(0,17)},
  {...original,rows:original.rows.map((r,i)=>i===17?original.rows[16]:r)},
  {...original,rows:original.rows.map((r,i)=>i===17?{...r,avatar:'private-owner'}:r)},
  {...original,rows:original.rows.map((r,i)=>i===0?{...r,originalRearPhotoObserved:true}:r)},
  {...original,rows:original.rows.map((r,i)=>i===0?{...r,sourceFrontPhotographedSurfaceTriangleCount:576}:r)},
  {...original,rows:original.rows.map((r,i)=>i===0?{...r,opaqueSourceMeshProjectedMarkerPixels:1}:r)},
  {...original,rows:original.rows.map((r,i)=>i===0?{...r,inferredRearLowerBoundShareOfOpaqueProjectedOriginalSkirt:1}:r)},
  {...original,rows:original.rows.map((r,i)=>i===5?{...r,unphotographedRearMarkerPixels:0,inferredRearLowerBoundShareOfOpaqueProjectedOriginalSkirt:0}:r)}
 ];
 for(const b of bad){
  const r=summarizeOriginalSkirtUnphotographedRear89(b);
  assert.equal(r.status,'INCOMPLETE_OR_UNTRUSTED_ORIGINAL_REAR_MATERIAL_EVIDENCE');
  assert.equal(r.releaseAuthorized,false);
  assert.equal(r.sourcePhoto2DFallbackRequired,true);
  assert.equal(r.originalRearPhotoVerified,false);
 }
});
test('rear-view pixel fractions cannot claim source photo real visual fit from perfect collision score',()=>{
 const x=build();
 const r=summarizeOriginalSkirtUnphotographedRear89(x);
 assert.ok(r.groupedSourcePublicCounts.some(g=>
  g.angles.find(v=>v.angle===180).visibleNeverPhotographedMarkerPixelCounts.every(n=>n>2000)));
 assert.equal(r.continuousClothOrDynamicGarmentSafetyCertified,false);
 assert.equal(r.visuallyCorrectFrontDoesNotProveRearSource,true);
 assert.equal(r.inferredRearShareIsConservativeAlphaOvercountLowerBound,true);
 assert.equal(r.familyAlpha,'HOLD');
});
