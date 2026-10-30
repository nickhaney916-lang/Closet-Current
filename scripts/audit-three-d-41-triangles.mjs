/** Real posed triangle intersections. Surface crossing, not containment/swept proof. */
import * as T from 'three';
import {MeshBVH} from 'three-mesh-bvh';
import {mkdir,writeFile} from 'node:fs/promises';
import {person,candidate} from '../research/three-d-24/test-fixtures.mjs';
import {createOutfitController} from '../research/three-d-15/outfit-controller.mjs';
import {PANTS_RESEARCH_SOURCE as A,PANTS_RESEARCH_SOURCE_SECOND as B} from '../research/three-d-30/reviewed-photo-pants.mjs';
export const denim=src=>({id:src.id,type:'pants',sourceSHA256:src.originalSHA256,cutoutSHA256:src.cutoutSHA256,sourceAssetsVerified:true,originalVerified:true,cutoutVerified:true,visibleSourceRGBPreserved:true,frontOrientationReviewed:true,neutralColorRGB:src===A?[83,104,135]:[57,81,120],cropRect:src===A?[.085,.07,.87,.82]:[.055,.08,.88,.86],cutout:{width:src===A?435:1754,height:src===A?650:2838},ownerApproved:false,humanVisualApproval:false,releaseAuthorized:false,provisional:true});
function posed(meshes){const pos=[],idx=[];for(const m of meshes){const off=pos.length/3,p=m.geometry.attributes.position;m.updateWorldMatrix(true,false);m.skeleton.update();for(let i=0;i<p.count;i++){const v=new T.Vector3().fromBufferAttribute(p,i);m.applyBoneTransform(i,v);pos.push(...v.applyMatrix4(m.matrixWorld).toArray());}const ix=m.geometry.index;for(let i=0;i<(ix?.count??p.count);i++)idx.push(off+(ix?ix.getX(i):i));}const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(pos,3));g.setIndex(idx);return g;}
export function crossings(a,b){const ba=new MeshBVH(a),bb=new MeshBVH(b),left=new Set(),right=new Set(),line=new T.Line3();let pairs=0,maxSegment=0;ba.bvhcast(bb,new T.Matrix4(),{intersectsTriangles:(ta,tb,i,j)=>{if(ta.intersectsTriangle(tb,line)){const length=line.distance();if(length>1e-5){pairs++;left.add(i);right.add(j);maxSegment=Math.max(maxSegment,length);}}return false;}});return {testedTriangles:[a.index.count/3,b.index.count/3],crossingTrianglePairs:pairs,uniqueCrossingTriangles:[left.size,right.size],maximumCrossingSegmentMeters:maxSegment,method:'BVH broad phase plus triangle-triangle intersection in actual skinned world-space pose; segments >10 micrometers',verifiedSurfaceCrossings:true,penetrationDepthMeasured:false,containmentTested:false,sweptMotionTested:false,fullCollisionValidated:false};}
if(process.argv[1]?.endsWith('audit-three-d-41-triangles.mjs')){
 const records=[];
 for(const kind of ['female','male'])for(const src of [A,B])for(const version of ['before','after']){
  const root=await person(kind),app=createOutfitController(root,{sewnPattern:version==='after'});
  app.setOutfit('shirt-pants',candidate('shirt'),{reviewed:true,pantsCandidate:denim(src),pantsReviewed:true});
  for(const pose of ['source','relaxed']){app.setPose(pose);root.updateMatrixWorld(true);const body=[],shirt=[],pants=[];root.traverse(m=>{if(!m.isSkinnedMesh)return;(m.userData.work56Garment?(m.userData.work60Pants?pants:shirt):body).push(m);});const b=posed(body),s=posed(shirt),p=posed(pants);const r={kind,source:src.id,version,pose,shirtBody:crossings(s,b),jeansBody:crossings(p,b),shirtJeans:crossings(s,p)};records.push(r);console.log(JSON.stringify(r));[b,s,p].forEach(g=>g.dispose());}app.dispose();
 }
 await mkdir('benchmark/three-d-41',{recursive:true});await writeFile('benchmark/three-d-41/triangle-collisions.json',JSON.stringify({records,fullCollisionValidated:false,releaseAuthorized:false},null,2));
}
