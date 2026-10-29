/**
 * 3D-17 — source-neutral, skeleton-bound *inner cuff facing* for the existing
 * real-photograph skinned AJ shirt. No fabricated sleeve imagery or new dye.
 * A face joins the actual source-pose inner cuff boundary to a narrow turned
 * inside rim. This is NOT a closed cap, body-collision certification or drape.
 */
import * as T from 'three';
import {wristAxes} from '../three-d-16/cuff-clearance.mjs';
const AXIAL=.005,INWARD=.002;
const vec=(attr,i)=>new T.Vector3().fromBufferAttribute(attr,i);
const bounded=(x,a,b)=>Number.isFinite(x)&&x>=a&&x<=b;
const key=p=>p.toArray().map(x=>x.toFixed(5)).join(',');
const edgeKey=(a,b)=>[key(a),key(b)].sort().join('|');
export function finishInnerCuffs(shirt,root,{axial=AXIAL,inward=INWARD}={}){
 if(!shirt?.meshes?.length||!root?.isObject3D||
  !bounded(axial,.001,.008)||!bounded(inward,.001,.004))
  throw Error('Source-verified anatomical cuff facing and bounded depth required');
 const axes=wristAxes(root),original=shirt.meshes.find(m=>m.name==='Work56-independent-shirt-shell');
 if(!original?.isSkinnedMesh||!original.skeleton||!original.material)
  throw Error('Only the existing separate source-rigged shirt shell may be finished');
 original.updateWorldMatrix(true,false);
 const g=original.geometry,p=g.attributes.position,idx=g.index,sk=g.attributes.skinIndex,
  weights=g.attributes.skinWeight,source=g.attributes.panelPosition;
 if(!p||!idx||!sk||!weights||!source||p.count>220000||idx.count%3!==0)
  throw Error('Missing source-bound cut garment topology');
 const edgeMap=new Map(),origWorld=original.matrixWorld,inverse=origWorld.clone().invert();
 const point=i=>vec(p,i).applyMatrix4(origWorld);
 for(let n=0;n<idx.count;n+=3)for(let j=0;j<3;j++){
  const ia=idx.getX(n+j),ib=idx.getX(n+(j+1)%3);
  const a=point(ia),b=point(ib),k=edgeKey(a,b);
  const prev=edgeMap.get(k);if(prev)prev.count++;else edgeMap.set(k,{ia,ib,a,b,count:1});
 }
 const position=[],boneIndex=[],boneWeight=[],panelPosition=[],panelNormal=[],triangles=[];
 const perArm={L:0,R:0},sourceSamples={L:0,R:0};
 for(const e of edgeMap.values())if(e.count===1){
  let target=null;
  for(const axis of axes){
   // The *inner* cuff boundary is close to the real wrist, not a
   // longitudinal armhole/shoulder/torso seam.
   const valid=q=>{
    if(Math.sign(q.x)!==Math.sign(axis.end.x)||Math.abs(q.x)<.27)return false;
    const t=q.clone().sub(axis.elbow).dot(axis.axis)/axis.axisLengthSq;
    const center=axis.elbow.clone().addScaledVector(axis.axis,
     T.MathUtils.clamp(t,0,1));
    const radius=q.distanceTo(center);
    return t>=.87&&t<=1.15&&radius>=.025&&radius<=.14;
   };
   if(valid(e.a)&&valid(e.b)){target=axis;break;}
  }
  if(!target)continue;
  if(e.a.distanceToSquared(e.b)>0.0036||e.a.distanceToSquared(e.b)<1e-12)
   continue;
  const armDir=target.axis.clone().normalize();
  const insert=(id,q,isInner)=>{
   let out=q.clone();
   if(isInner){
    const t=q.clone().sub(target.elbow).dot(target.axis)/target.axisLengthSq;
    const center=target.elbow.clone().addScaledVector(target.axis,
     T.MathUtils.clamp(t,0,1));
    const radial=q.clone().sub(center);
    if(radial.lengthSq()<1e-10)throw Error('Degenerate cuff-facing radial vector');
    out.addScaledVector(armDir,axial).addScaledVector(radial.normalize(),-inward);
   }
   position.push(...out.applyMatrix4(inverse).toArray());
   for(let k=0;k<4;k++){
    boneIndex.push(sk.array[id*4+k]);
    boneWeight.push(weights.array[id*4+k]);
   }
   // The original shirt shader returns uFabric only for panel.y=-99;
   // this strip must NEVER sample photograph pixels or repeat a logo.
   panelPosition.push(0,-99,0);panelNormal.push(0,0,0);
  };
  const start=position.length/3;
  insert(e.ia,e.a,false);insert(e.ib,e.b,false);
  insert(e.ia,e.a,true);insert(e.ib,e.b,true);
  triangles.push(start,start+1,start+2,start+1,start+3,start+2);
  perArm[target.side]++;sourceSamples[target.side]+=2;
 }
 if(perArm.L<3||perArm.R<3||position.length>220000)
  throw Error('Both actual verified human cuff boundaries must produce source-neutral facings');
 const facing=new T.BufferGeometry();
 facing.setAttribute('position',new T.Float32BufferAttribute(position,3));
 facing.setAttribute('skinIndex',new T.Uint16BufferAttribute(boneIndex,4));
 facing.setAttribute('skinWeight',new T.Float32BufferAttribute(boneWeight,4));
 facing.setAttribute('panelPosition',new T.Float32BufferAttribute(panelPosition,3));
 facing.setAttribute('panelNormal',new T.Float32BufferAttribute(panelNormal,3));
 facing.setIndex(triangles);facing.computeVertexNormals();facing.computeBoundingSphere();
 const mesh=new T.SkinnedMesh(facing,original.material);
 mesh.name='3D17-neutral-inner-cuff-facing';
 mesh.userData.work56Garment=true;mesh.userData.researchNeutralCuff=true;
 mesh.position.copy(original.position);mesh.quaternion.copy(original.quaternion);
 mesh.scale.copy(original.scale);mesh.frustumCulled=false;
 original.parent.add(mesh);mesh.bind(original.skeleton,original.bindMatrix);
 const oldDispose=shirt.dispose;
 return {...shirt,meshes:[...shirt.meshes,mesh],
  stats:{...shirt.stats,innerCuffFacing:true,innerCuffEdges:perArm,
   neutralCuffTriangles:triangles.length/3,
   innerCuffAxial:axial,innerCuffDepth:inward,
   photographicCuffPixels:false,sourceIdentityPreserved:true,
   minClearance:null,collisionValidated:false,releaseAuthorized:false},
  dispose(){mesh.removeFromParent();facing.dispose();oldDispose();}};
}
