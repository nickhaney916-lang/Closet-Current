/** 3D43 — original-source fitted clothing at 25/50/75% arm movement.
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
export async function auditIntermediatePose({figures=['female','male'],sources=[A,B]}={}){
 const records=[];
 for(const kind of figures)for(const src of sources){
  const root=await person(kind);
  const app=createOutfitController(root,{poseContactFactory:createPoseContact,jeansPanelFall:true,independentGarments:true});
  try{
   app.setOutfit('shirt-pants',candidate('shirt'),{reviewed:true,pantsCandidate:denim(src),pantsReviewed:true});
   const order=['source','blend-25','blend-50','blend-75','relaxed','blend-50','source'];
   const first=new Map();
   for(const pose of order){
    const state=app.setPose(pose);
    assert.equal(state.shirt.poseTriangleContact.pose,pose);
    assert.equal(state.shirt.poseTriangleContact.after.count,0,'Native solver must actually clear original photographed shirt/body crossings at '+pose);
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
 const summary={records,figures,sources:sources.map(s=>s.id),poses:APPROVED_RESEARCH_POSES,
   studied:records.length,uncertifiedSweptIntervals:4,
   verifiedSampledTriangleClearance:true,signedVolumeContainmentCertified:false,
   continuousMotionCollisionCertified:false,releaseAuthorized:false};
 return summary;
}
if(process.argv[1]?.endsWith('audit-three-d-43-pose-sweep.mjs')){
 const summary=await auditIntermediatePose();
 await mkdir('benchmark/three-d-43',{recursive:true});
 await writeFile('benchmark/three-d-43/intermediate-triangle-audit.json',JSON.stringify(summary,null,2));
 console.log('THREE_D43_INTERMEDIATE_REAL_POSED_TRIANGLE_AUDIT',JSON.stringify({studied:summary.studied,figures:summary.figures,sources:summary.sources,poses:summary.poses,releaseAuthorized:false}));
}
