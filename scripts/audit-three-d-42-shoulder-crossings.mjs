/** 3D42 exact triangle-triangle audit of photographed shirt vs original
 * anatomical body, and independent jeans. Crossing segments >10 microns.
 * This tests two static poses, not signed depth, containment or motion sweeps.
 */
import * as T from 'three';
import assert from 'node:assert/strict';
import {mkdir,writeFile} from 'node:fs/promises';
import {person,candidate} from '../research/three-d-24/test-fixtures.mjs';
import {createOutfitController} from '../research/three-d-15/outfit-controller.mjs';
import {crossings,denim} from './audit-three-d-41-triangles.mjs';
import {PANTS_RESEARCH_SOURCE as A,PANTS_RESEARCH_SOURCE_SECOND as B} from '../research/three-d-30/reviewed-photo-pants.mjs';
export function posed(meshes){
 const vertices=[],indices=[];
 for(const m of meshes){
  const offset=vertices.length/3,g=m.geometry,p=g.attributes.position;
  m.updateWorldMatrix(true,false);m.skeleton.update();
  for(let i=0;i<p.count;i++){
   const v=m.applyBoneTransform(i,new T.Vector3().fromBufferAttribute(p,i)).applyMatrix4(m.matrixWorld);
   vertices.push(...v.toArray());
  }
  const ix=g.index;for(let i=0;i<(ix?.count??p.count);i++)indices.push(offset+(ix?ix.getX(i):i));
 }
 const geo=new T.BufferGeometry();geo.setAttribute('position',new T.Float32BufferAttribute(vertices,3));geo.setIndex(indices);return geo;
}
export function outfitMeshes(root){
 const body=[],shirt=[],pants=[];
 root.traverse(m=>{if(!m.isSkinnedMesh)return;(m.userData.work56Garment?(m.userData.work60Pants?pants:shirt):body).push(m);});
 return {body,shirt,pants};
}
export function collisionFor(root){
 root.updateMatrixWorld(true);const parts=outfitMeshes(root);
 const b=posed(parts.body),s=posed(parts.shirt),p=posed(parts.pants);
 try{return {shirtBody:crossings(s,b),jeansBody:crossings(p,b),shirtJeans:crossings(s,p)};}
 finally{b.dispose();s.dispose();p.dispose();}
}
export async function auditShoulders({figures=['female','male'],sources=[A,B]}={}){
 const records=[];
 for(const kind of figures)for(const src of sources)for(const version of ['before','after']){
  const root=await person(kind),app=createOutfitController(root,{sewnPattern:true,poseAwareShoulderContact:version==='after'});
  try{
   const outfit=app.setOutfit('shirt-pants',candidate('shirt'),{reviewed:true,pantsCandidate:denim(src),pantsReviewed:true});
   for(const pose of ['source','relaxed']){
    app.setPose(pose);const res=collisionFor(root);
    records.push({kind,source:src.id,version,pose,...res,
     sourcePhotoUnchanged:outfit.shirt.originalShirtSourcePixelsAndUVUnchanged===true||version==='before',
     sourceCollisionReportedUncertified:outfit.shirt.shoulderCollisionCertified!==true,
     contactStats:version==='after'?{
      sourcePoseHits:outfit.shirt.shoulderClearanceSourcePoseHits,
      relaxedPoseHits:outfit.shirt.shoulderClearanceRelaxedPoseHits,
      correctionEvents:outfit.shirt.shoulderClearanceEditedVertexEvents,
      maximumRestMove:outfit.shirt.shoulderClearanceMaximumRestMove}:null
    });
   }
  }finally{app.dispose();}
 }
 let reduced=0,beforeTotal=0,afterTotal=0;
 for(const r of records.filter(v=>v.version==='after')){
  const old=records.find(v=>v.kind===r.kind&&v.source===r.source&&v.pose===r.pose&&v.version==='before');
  assert.ok(old);const prev=old.shirtBody.crossingTrianglePairs,next=r.shirtBody.crossingTrianglePairs;
  beforeTotal+=prev;afterTotal+=next;
  if(next<prev)reduced++;
  assert.ok(next<=prev,'3D42 must not worsen original shirt/body triangle intersections '+JSON.stringify({kind:r.kind,source:r.source,pose:r.pose,prev,next}));
  assert.equal(r.jeansBody.crossingTrianglePairs,0,'Original independent jeans/body triangle crossings must remain clear');
  assert.equal(r.shirtJeans.crossingTrianglePairs,0,'Original independent jeans/shirt triangles must remain clear');
  assert.equal(r.sourcePhotoUnchanged,true);
  assert.equal(r.sourceCollisionReportedUncertified,true);
 }
 assert.ok(reduced>=2&&afterTotal<beforeTotal,'Original photographed shoulders must show reproducible reduction in genuine posed triangle crossings '+JSON.stringify({beforeTotal,afterTotal,reduced}));
 const result={records,beforeTotal,afterTotal,reduced,fullCollisionValidated:false,
  penetrationDepthMeasured:false,contactMethod:'actual source/relaxed skinned body and photographed garment BVH triangle-triangle intersections',releaseAuthorized:false};
 return result;
}
if(process.argv[1]?.endsWith('audit-three-d-42-shoulder-crossings.mjs')){
 const result=await auditShoulders();
 await mkdir('benchmark/three-d-42',{recursive:true});
 await writeFile('benchmark/three-d-42/triangle-collisions.json',JSON.stringify(result,null,2));
 console.log('THREE_D42_REAL_POSED_TRIANGLE_AUDIT',JSON.stringify({beforeTotal:result.beforeTotal,afterTotal:result.afterTotal,reduced:result.reduced,samples:result.records.length,fullCollisionValidated:false}));
}
