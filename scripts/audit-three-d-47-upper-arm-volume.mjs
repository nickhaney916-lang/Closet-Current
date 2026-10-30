/** 3D47 — original-source tailored upper sleeves at 25/50/75% arm movement.
 * Actual posed mesh triangle crossing audit (not containment / swept proof).
 * No user photos, credentials or external services. Throws on any regression.
 */
import assert from 'node:assert/strict';
import {mkdir,writeFile} from 'node:fs/promises';
import {person,candidate} from '../research/three-d-24/test-fixtures.mjs';
import {createOutfitController} from '../research/three-d-15/outfit-controller.mjs';
import {createPoseContact,posedGeometry} from '../research/three-d-42/posed-contact.mjs';
import {crossings,denim} from './audit-three-d-42-triangles.mjs';
import {APPROVED_RESEARCH_POSES} from '../research/three-d-43/intermediate-pose.mjs';
import {PANTS_RESEARCH_SOURCE as A,PANTS_RESEARCH_SOURCE_SECOND as B} from '../research/three-d-30/reviewed-photo-pants.mjs';
const getMeshes=root=>{
 const body=[],shirt=[],pants=[];
 root.traverse(m=>{if(!m.isSkinnedMesh)return;
  (m.userData.work56Garment?(m.userData.work60Pants?pants:shirt):body).push(m);
 });return {body,shirt,pants};
};
export async function auditUpperArmFabricVolume({figures=['female','male'],sources=[A,B],rearShirtFabricRelief=false,naturalShoulderSleeveTransition=false,sourceMeasuredSleeveHang=false}={}){
 const records=[];
 for(const kind of figures)for(const src of sources){
  const root=await person(kind);
  const app=createOutfitController(root,{poseContactFactory:createPoseContact,jeansPanelFall:true,independentGarments:true,tailoredShoulderSleeves:true,independentShoulderCaps:true,realisticShoulderContour:true,upperArmFabricVolume:true,sourceNeutralCollarRoll:rearShirtFabricRelief||naturalShoulderSleeveTransition||sourceMeasuredSleeveHang,rearShirtFabricRelief:rearShirtFabricRelief||naturalShoulderSleeveTransition||sourceMeasuredSleeveHang,naturalShoulderSleeveTransition:naturalShoulderSleeveTransition||sourceMeasuredSleeveHang,sourceMeasuredSleeveHang});
  try{
   app.setOutfit('shirt-pants',candidate('shirt'),{reviewed:true,pantsCandidate:denim(src),pantsReviewed:true});
   const order=['source','blend-25','blend-50','blend-75','relaxed','blend-50','source'];
   const first=new Map();
   for(const pose of order){
    const state=app.setPose(pose);
    assert.equal(state.shirt.upperArmFabricVolumeTailored,true);
    if(rearShirtFabricRelief||naturalShoulderSleeveTransition){assert.equal(state.shirt.sourceNeutralRearFabricRelief,true);assert.equal(state.shirt.originalPhotographedFrontAndUVUnchanged,true);}
    if(naturalShoulderSleeveTransition||sourceMeasuredSleeveHang){assert.equal(state.shirt.naturalSourceShoulderSleeveTransition,true);assert.ok(state.shirt.shoulderRoundRealSeamGap<=5e-5);}
    if(sourceMeasuredSleeveHang){assert.equal(state.shirt.sourceMeasuredNaturalSleeveHang,true);assert.equal(state.shirt.originalPhotographedSleeveUVAndSkinPreserved,true);}
    assert.equal(state.shirt.originalPhotographicSourceAndPanelCoordinatesUnchanged,true);
    assert.ok(state.shirt.upperArmFabricDepthMoves>15);
    assert.ok(state.shirt.upperArmFabricSeamGap<=5e-5);
    assert.equal(state.shirt.poseTriangleContact.pose,pose);
    assert.equal(state.shirt.poseTriangleContact.after.count,0,'Native solver must actually clear original photographed separate shoulder-cap shirt/body crossings at '+pose);
    assert.equal(state.shirt.poseTriangleContact.fullCollisionValidated,false);
    assert.equal(state.pants.sourceSHA256,src.originalSHA256);
    assert.equal(state.pants.cutoutSHA256,src.cutoutSHA256);
    const meshes=getMeshes(root);
    const bb=posedGeometry(meshes.body).g,ss=posedGeometry(meshes.shirt).g,pp=posedGeometry(meshes.pants).g;
    try{
     const shirtBody=crossings(ss,bb),pantsBody=crossings(pp,bb),shirtJeans=crossings(ss,pp);
     const entry={kind,source:src.id,pose,pass:records.filter(r=>r.kind===kind&&r.source===src.id&&r.pose===pose).length+1,
      shirtBody,pantsBody,shirtJeans,sourceSHA256:src.originalSHA256,
      poseCorrection:state.shirt.poseTriangleContact.maximumWorldCorrection,
      localBodyFaceDepthOnly:true,fullCollisionValidated:false,sweptMotionValidated:false};
     assert.equal(shirtBody.crossingTrianglePairs,0,'True skinned original shirt/body triangles cross at '+JSON.stringify({kind,src:src.id,pose,pairs:shirtBody.crossingTrianglePairs}));
     assert.equal(pantsBody.crossingTrianglePairs,0,'Original photographic trousers/body triangles cross at '+pose);
     assert.equal(shirtJeans.crossingTrianglePairs,0,'Shirt/jeans photographed material surfaces cross at '+pose);
     if(first.has(pose)){
      const old=first.get(pose);
      assert.equal(entry.poseCorrection,old.poseCorrection,'Revisited pose clearance must be deterministic');
     } else first.set(pose,entry);
     records.push(entry);
    }finally{bb.dispose();ss.dispose();pp.dispose();}
   }
  }finally{app.dispose();}
 }
 const summary={records,figures,sources:sources.map(s=>s.id),poses:APPROVED_RESEARCH_POSES,tailoredShoulderSleeves:true,
   studied:records.length,uncertifiedSweptIntervals:4,
   verifiedSampledTriangleClearance:true,upperArmFabricVolumeTailored:true,sourceNeutralRearFabricRelief:rearShirtFabricRelief||naturalShoulderSleeveTransition||sourceMeasuredSleeveHang,naturalShoulderSleeveTransition:naturalShoulderSleeveTransition||sourceMeasuredSleeveHang,sourceMeasuredSleeveHang,signedVolumeContainmentCertified:false,
   continuousMotionCollisionCertified:false,releaseAuthorized:false};
 return summary;
}
if(process.argv[1]?.endsWith('audit-three-d-47-upper-arm-volume.mjs')){
 const hang55=process.argv.includes('--hang55');
 const round54=hang55||process.argv.includes('--round54');
 const rear53=round54||process.argv.includes('--rear53');
 const summary=await auditUpperArmFabricVolume({rearShirtFabricRelief:rear53,naturalShoulderSleeveTransition:round54,sourceMeasuredSleeveHang:hang55});
 const out=hang55?'benchmark/three-d-55':round54?'benchmark/three-d-54':rear53?'benchmark/three-d-53':'benchmark/three-d-47';
 await mkdir(out,{recursive:true});
 await writeFile(out+'/intermediate-triangle-audit.json',JSON.stringify(summary,null,2));
 console.log('THREE_D47_INDEPENDENT_CAP_FIVE_POSE_TRIANGLE_AUDIT',JSON.stringify({studied:summary.studied,figures:summary.figures,sources:summary.sources,poses:summary.poses,releaseAuthorized:false}));
}
