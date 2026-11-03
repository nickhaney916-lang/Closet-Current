/** Exact static triangle crossing measurement for the currently rendered originals.
 * No claim of closed-volume signed distance, swept physics or visual acceptance.
 */
import * as THREE from 'three';
import {posedGeometry,triangleContacts} from '../three-d-42/posed-contact.mjs';
function worldUnskinned(meshes){
 const vertices=[],indexes=[],v=new THREE.Vector3();
 for(const mesh of meshes){
  mesh.updateWorldMatrix(true,false);const off=vertices.length/3,geo=mesh.geometry,p=geo.attributes.position;
  for(let i=0;i<p.count;i++){v.fromBufferAttribute(p,i).applyMatrix4(mesh.matrixWorld);vertices.push(v.x,v.y,v.z);}
  const idx=geo.index;for(let i=0;i<(idx?.count??p.count);i++)indexes.push(off+(idx?idx.getX(i):i));
 }
 const geo=new THREE.BufferGeometry();
 geo.setAttribute('position',new THREE.Float32BufferAttribute(vertices,3));geo.setIndex(indexes);
 return geo;
}
function nearestHemWorldY(meshes,side,shoe){
 const candidates=[],point=new THREE.Vector3();
 for(const mesh of meshes){mesh.updateWorldMatrix(true,false);const p=mesh.geometry.attributes.position;
  for(let i=0;i<p.count;i+=Math.max(1,Math.floor(p.count/25000))){
   mesh.getVertexPosition(i,point);mesh.localToWorld(point);
   if((side==='left'?point.x<0:point.x>=0)&&point.y>=-.08&&point.y<.40&&
      Math.abs(point.x-shoe.position.x)<.16)candidates.push(point.y);
  }
 }
 candidates.sort((a,b)=>a-b);
 return candidates.length?candidates[Math.floor(candidates.length*.08)]:null;
}
export function auditActualFootwear02StaticContact({viewer}={}){
 const anchor=viewer?.getResearchFootwearAnchor?.(),root=anchor?.root;
 if(viewer?.getState()?.stats?.bones!==163||!root)throw Error('Actual anatomical source rig required');
 const pair=root.parent?.children?.filter(x=>x.name?.startsWith('FOOTWEAR02-'))||[];
 if(pair.length!==2)throw Error('Two actual independently mounted shoe groups required');
 const bodies=[],pants=[],shoemesh=[];
 root.traverse(m=>{if(m.isSkinnedMesh){if(m.userData.work60Pants)pants.push(m);else if(!m.userData.work56Garment)bodies.push(m);}});
 for(const g of pair)g.traverse(x=>{if(x.isMesh)shoemesh.push(x);});
 if(!bodies.length||pants.length!==1||shoemesh.length!==6)
  throw Error('Genuine original anatomical body, photographed denim and independent shoes required');
 let shoes=null,body=null,denim=null;
 try{
  shoes=worldUnskinned(shoemesh);body=posedGeometry(bodies);denim=posedGeometry(pants);
  const shoeBody=triangleContacts(shoes,body.g),shoeHem=triangleContacts(shoes,denim.g);
  const perSide=pair.map(g=>{const foot=g.userData.foot;
   const hemY=nearestHemWorldY(pants,foot.side,{position:{x:foot.x}});
   return {side:foot.side,soleGroundClearanceM:g.userData.soleBottom,
    shoeCollarY:g.userData.collarY,
    jeansHemSampleY:hemY,jeansHemAboveCollarM:hemY===null?null:hemY-g.userData.collarY,
    sampleCount:foot.sampledPoints,footLengthM:foot.footLength,footWidthM:foot.footWidth};
  });
  return Object.freeze({realTrianglesMeasured:true,shoeVertices:shoes.attributes.position.count,
   actualSkinnedBodyTriangleCrossings:shoeBody.count,actualPhotographedDenimTriangleCrossings:shoeHem.count,
   maximumLocalBodyPlaneDepthM:shoeBody.maximumLocalOrientedFaceDepth,
   maximumLocalDenimPlaneDepthM:shoeHem.maximumLocalOrientedFaceDepth,
   signedClosedVolumeCertified:false,continuousMotionCertified:false,
   observedVisualCollisionGrade:shoeHem.count||shoeBody.count?'REVIEW':'REVIEW_REQUIRES_HUMAN',
   noFakeSourcePixels:true,perSide,releaseAuthorized:false});
 }finally{shoes?.dispose();body?.g.dispose();denim?.g.dispose();}
}
