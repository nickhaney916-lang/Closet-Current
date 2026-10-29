/**
 * Closet Current 3D-18: source-neutral, skeleton-bound cuff-hem continuation.
 *
 * Uses the ACTUAL inside boundary of the 3D-17 source-shirt facing, not a
 * synthetic wrist cylinder or fabricated shirt photo. This is a narrow
 * geometry experiment, NOT guaranteed skin/cloth collision or visual PASS.
 */
import * as THREE from 'three';
import {wristAxes} from '../three-d-16/cuff-clearance.mjs';

const EXTEND=.009, RADIAL=.0008;
const v=(attribute,i)=>new THREE.Vector3().fromBufferAttribute(attribute,i);
const bounded=(n,min,max)=>Number.isFinite(n)&&n>=min&&n<=max;

export function bridgeSourceCuffHem(shirt,root,{extend=EXTEND,radial=RADIAL}={}){
 if(!shirt?.meshes?.length||!root?.isObject3D||
  !bounded(extend,.004,.012)||!bounded(radial,0,.002))
  throw Error('Verified source-bound cuff facing and bounded anatomical hem extension required');
 const facing=shirt.meshes.find(x=>x.name==='3D17-neutral-inner-cuff-facing');
 if(!facing?.isSkinnedMesh||!facing.skeleton||!facing.parent||
  !facing.geometry?.attributes?.panelPosition)
  throw Error('Original 3D-17 facing required; no free-standing cuff invented');
 const g=facing.geometry,p=g.attributes.position,skin=g.attributes.skinIndex,
  weights=g.attributes.skinWeight,source=g.attributes.panelPosition;
 if(!p||!skin||!weights||p.count%4!==0||p.count>70000||
  skin.count!==p.count||weights.count!==p.count||source.count!==p.count)
  throw Error('Invalid verified cuff-facing topology or skin');
 // Each source-bound facing boundary edge generated four vertices:
 // outer-A, outer-B, turned-inner-A, turned-inner-B.
 const axes=wristAxes(root);
 facing.updateWorldMatrix(true,false);
 const localToWorld=facing.matrixWorld,worldToLocal=localToWorld.clone().invert();
 const positions=[],boneIndices=[],boneWeights=[],panels=[],panelNormals=[],indices=[];
 const perArm={L:0,R:0},maxByArm={L:0,R:0};
 for(let i=0;i<p.count;i+=4){
  const ia=i+2,ib=i+3;
  const a=v(p,ia).applyMatrix4(localToWorld),
    b=v(p,ib).applyMatrix4(localToWorld);
  const center=a.clone().add(b).multiplyScalar(.5);
  const axis=axes.find(x=>Math.sign(center.x)===Math.sign(x.end.x));
  if(!axis||Math.abs(center.x)<.27)throw Error('Unreliable real anatomical cuff side');
  const along=axis.axis.clone().normalize();
  const extendPoint=point=>{
   const t=point.clone().sub(axis.elbow).dot(axis.axis)/axis.axisLengthSq;
   if(!bounded(t,.65,1.20))throw Error('Cuff edge is not near source anatomical wrist');
   // Use the full anatomical forearm-axis projection even at cuff
   // vertices slightly beyond the wrist bone, so "radial" is actually
   // perpendicular and cannot inadvertently add axial displacement.
   const projected=axis.elbow.clone().addScaledVector(axis.axis,t);
   const outward=point.clone().sub(projected);
   if(outward.lengthSq()<.0001||outward.lengthSq()>.09)
    throw Error('Source cuff radial geometry incompatible with wrist');
   return point.clone().addScaledVector(along,extend)
    .addScaledVector(outward.normalize(),radial);
  };
  const extendedA=extendPoint(a),extendedB=extendPoint(b);
  const sourceVertices=[
   [ia,a],[ib,b],[ia,extendedA],[ib,extendedB]
  ];
  const off=positions.length/3;
  for(const [id,world] of sourceVertices){
   positions.push(...world.clone().applyMatrix4(worldToLocal).toArray());
   for(let k=0;k<4;k++){
    boneIndices.push(skin.array[id*4+k]);
    boneWeights.push(weights.array[id*4+k]);
   }
   // Work56 shirt shader always returns source median black for this sentinel:
   // no unlicensed image data and no repeated white AJ print.
   panels.push(0,-99,0);panelNormals.push(0,0,0);
  }
  indices.push(off,off+1,off+2,off+1,off+3,off+2);
  perArm[axis.side]++;
  maxByArm[axis.side]=Math.max(maxByArm[axis.side],
   extendedA.distanceTo(a),extendedB.distanceTo(b));
 }
 if(perArm.L<3||perArm.R<3||positions.length<72||
  Math.max(...Object.values(maxByArm))>Math.hypot(extend,radial)+.0001)
  throw Error('Both original anatomical wrist cuff hems must be source bounded');
 const geometry=new THREE.BufferGeometry();
 geometry.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));
 geometry.setAttribute('skinIndex',new THREE.Uint16BufferAttribute(boneIndices,4));
 geometry.setAttribute('skinWeight',new THREE.Float32BufferAttribute(boneWeights,4));
 geometry.setAttribute('panelPosition',new THREE.Float32BufferAttribute(panels,3));
 geometry.setAttribute('panelNormal',new THREE.Float32BufferAttribute(panelNormals,3));
 geometry.setIndex(indices);geometry.computeVertexNormals();geometry.computeBoundingSphere();
 const mesh=new THREE.SkinnedMesh(geometry,facing.material);
 mesh.name='3D18-neutral-wrist-hem-bridge';
 mesh.userData.work56Garment=true;mesh.userData.researchNeutralCuff=true;
 mesh.position.copy(facing.position);mesh.quaternion.copy(facing.quaternion);
 mesh.scale.copy(facing.scale);mesh.frustumCulled=false;
 facing.parent.add(mesh);mesh.bind(facing.skeleton,facing.bindMatrix);
 const oldDispose=shirt.dispose;
 return {...shirt,meshes:[...shirt.meshes,mesh],
  stats:{...shirt.stats,anatomicalWristHemBridge:true,
   cuffBridgeEdges:perArm,cuffBridgeTriangles:indices.length/3,
   cuffBridgeExtension:extend,cuffBridgeRadial:radial,
   cuffBridgeMaxMovement:maxByArm,
   sameSourceMedianMaterial:true,photographicBridgePixels:false,
   originalPhotoPixelsUnchanged:true,originalSkeletonUnchanged:true,
   minClearance:null,collisionValidated:false,releaseAuthorized:false},
  dispose(){mesh.removeFromParent();geometry.dispose();oldDispose();}};
}
