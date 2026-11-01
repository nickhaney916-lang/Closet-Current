/** SHIRT-FLOW-03 — gravity-responsive original photographed sleeve *geometry*.
 * Applies reversible source-neutral millimetre-scale eased creases to the
 * independently skinned original shirt, after the approved 3D56 source-fit.
 * Never modifies original JPEG, UVs, vertex color, skin indices or weights.
 * Sampled 163-bone anatomical poses, NOT unconstrained cloth simulation.
 */
import * as T from 'three';
import {smoothSurfaceNormals} from '../three-d-08/garment-fit-profile.mjs';
const smooth=T.MathUtils.smoothstep;
function inverseSkin(m,i){
 const g=m.geometry,skin=new T.Matrix4();skin.elements.fill(0);
 for(let k=0;k<4;k++){
  const id=g.attributes.skinIndex.getComponent(i,k),w=g.attributes.skinWeight.getComponent(i,k);
  const matrix=new T.Matrix4().multiplyMatrices(m.skeleton.bones[id].matrixWorld,m.skeleton.boneInverses[id]);
  for(let j=0;j<16;j++)skin.elements[j]+=matrix.elements[j]*w;
 }
 return skin.premultiply(m.bindMatrixInverse).multiply(m.bindMatrix).invert();
}
const band=(x,a,b,c,d)=>smooth(x,a,b)*(1-smooth(x,c,d));
export function shapeGravityRespondingSleeveFolds(root,shirt){
 if(!shirt?.stats?.sourceMeasuredNaturalSleeveHang||!Array.isArray(shirt.meshes))
  throw Error('Only verified original source-photographed, sewn 3D55 shirt allowed');
 root.updateMatrixWorld(true);
 const bones=[];root.traverse(o=>{if(o.isBone)bones.push(o);});
 if(bones.length!==163)throw Error('Original 163-bone anatomical body required');
 const locate=(name,side)=>{
  const bone=bones.find(b=>b.name===name+side);
  if(!bone)throw Error('Verified upper/forearm landmark unavailable: '+name+side);
  return bone.getWorldPosition(new T.Vector3());
 };
 const arms={};
 for(const side of ['L','R']){
  const shoulder=locate('upperarm01',side),elbow=locate('lowerarm01',side),wrist=locate('wrist',side);
  const upperAxis=elbow.clone().sub(shoulder),foreAxis=wrist.clone().sub(elbow);
  const upperLen=upperAxis.length(),foreLen=foreAxis.length();
  if(upperLen<.12||foreLen<.12)throw Error('Invalid true skinned arm lengths');
  upperAxis.normalize();foreAxis.normalize();
  const down=new T.Vector3(0,-1,0);
  const sag=down.clone().addScaledVector(foreAxis,-down.dot(foreAxis));
  if(sag.lengthSq()<1e-8)sag.set(0,0,1);
  sag.normalize();
  const under=new T.Vector3(0,-1,0).addScaledVector(upperAxis,upperAxis.y);
  if(under.lengthSq()<1e-8)under.set(0,0,1);
  under.normalize();
  const flex=1-Math.abs(upperAxis.dot(foreAxis));
  const inclination=1-Math.abs(foreAxis.dot(down));
  arms[side]={shoulder,elbow,wrist,upperAxis,upperLen,foreAxis,foreLen,sag,under,flex,inclination};
 }
 const shells=shirt.meshes.filter(m=>m.name==='Work56-independent-shirt-shell');
 if(!shells.length)throw Error('Independent source-fitted sleeve mesh absent');
 const metrics={L:{vertices:0,upper:0,forearm:0,max:0},R:{vertices:0,upper:0,forearm:0,max:0}};
 let maxMeters=0,changed=0;
 for(const mesh of shells){
  mesh.updateWorldMatrix(true,false);mesh.skeleton.update();
  const position=mesh.geometry.attributes.position,index=mesh.geometry.index;
  if(!index)throw Error('Unindexed verified sleeve shell blocked');
  // Transform before writing any vertex so source seams and the original
  // skinned pose are evaluated consistently rather than accumulating drift.
  const work=[];
  for(const i of new Set(index.array)){
   const local=new T.Vector3().fromBufferAttribute(position,i);
   const inWorld=mesh.applyBoneTransform(i,local.clone()).applyMatrix4(mesh.matrixWorld);
   const side=inWorld.distanceTo(arms.L.elbow)<inWorld.distanceTo(arms.R.elbow)?'L':'R';
   if(Math.abs(local.x)<.31)continue; // front photographic torso and collar protected
   const arm=arms[side],angle=arm.flex+.5*arm.inclination;
   const upper=foldAt(inWorld,arm.shoulder,arm.upperAxis,arm.upperLen,arm.under,angle,'upper');
   const fore=foldAt(inWorld,arm.elbow,arm.foreAxis,arm.foreLen,arm.sag,angle,'forearm');
   const use=upper.distance>=fore.distance?upper:fore;
   if(use.distance<.00012)continue;
   const next=inWorld.clone().add(use.delta)
    .applyMatrix4(mesh.matrixWorld.clone().invert()).applyMatrix4(inverseSkin(mesh,i));
   if(!Number.isFinite(next.x+next.y+next.z))throw Error('Nonfinite skinned cloth fold');
   work.push({i,next,side,zone:use.zone,distance:use.distance});
  }
  for(const item of work){
   position.setXYZ(item.i,item.next.x,item.next.y,item.next.z);
   metrics[item.side].vertices++;metrics[item.side][item.zone]++;
   metrics[item.side].max=Math.max(metrics[item.side].max,item.distance);
   maxMeters=Math.max(maxMeters,item.distance);changed++;
  }
  position.needsUpdate=true;mesh.geometry.computeVertexNormals();
  smoothSurfaceNormals(mesh.geometry,position.count);
  mesh.geometry.computeBoundingBox();mesh.geometry.computeBoundingSphere();
 }
 if(changed<40||maxMeters<.0015||maxMeters>.0091||
    Object.values(metrics).some(m=>m.vertices<12||m.forearm<8))
  throw Error('Source-true bilateral gravity fold witnesses missing '+JSON.stringify({changed,maxMeters,metrics}));
 return {sourcePhotographed:true,realSkinnedAnatomy:true,gravityResponsive:true,
  originalRGBUVAndSkinUnmodified:true,changedVertices:changed,maxMeters,sides:metrics,
  sourcePoseRecomputed:true,fullClothPhysicsCertified:false,
  humanPhotorealismApproved:false,physicalDeviceApproved:false,releaseAuthorized:false};
}
function foldAt(point,origin,axis,length,sag,phase,zone){
 const offset=point.clone().sub(origin),t=offset.dot(axis)/length;
 const radial=offset.clone().addScaledVector(axis,-t*length),radius=radial.length();
 if(!Number.isFinite(radius)||radius<.025||radius>.19)
  return {distance:0,delta:new T.Vector3(),zone};
 // Keep photographed shoulder/cap seams and physical cuffs anchored.
 const env=zone==='upper'?band(t,.28,.40,.67,.86):band(t,.11,.24,.64,.82);
 if(env<=.001)return {distance:0,delta:new T.Vector3(),zone};
 const rmask=smooth(radius,.025,.055)*(1-smooth(radius,.14,.19));
 if(rmask<.001)return {distance:0,delta:new T.Vector3(),zone};
 radial.normalize();
 const around=radial.dot(sag),foldCenter=zone==='upper'?.54:.41;
 const angled=t-foldCenter-.045*around+.027*phase;
 const fold=Math.exp(-Math.pow(angled/.09,2));
 const crease=Math.exp(-Math.pow((angled-.11)/.065,2));
 const response=.55+.45*Math.min(1,Math.max(0,phase));
 // A small real-gravity tug + directional wrinkle relaxation instead of
 // artificial concentric, changing-color or pasted-on texture bands.
 const puff=(.0011+.0065*fold-.0027*crease)*env*rmask*response;
 const gravity=(.0032*env*rmask*(.7+.3*response));
 const delta=radial.multiplyScalar(puff).addScaledVector(sag,gravity);
 delta.clampLength(0,.009);
 return {distance:delta.length(),delta,zone};
}
