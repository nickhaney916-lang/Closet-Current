/** 3D44 research/HOLD: original-image-preserving shoulder cap and upper
 * sleeve radial ease. This changes actual garment mesh positions only.
 * It is not a manufactured rear photo, new sewn topology, cloth dynamics,
 * signed penetration certification, or personal body measurement.
 */
import * as T from 'three';
import {smoothSurfaceNormals} from '../three-d-08/garment-fit-profile.mjs';
const smooth=T.MathUtils.smoothstep;
const key=q=>q.toArray().map(v=>v.toFixed(5)).join(':');
export function tailorOriginalShirtShoulderSleeves(shirt,root,{enabled=true}={}){
 if(!enabled)return shirt;
 if(!shirt?.stats?.independentRearShirtPattern||!shirt.stats?.independentSleeveLoft)
  throw Error('3D44 requires source-protected photographed independent shirt and existing source-measured sleeve loft');
 const arms=['L','R'].map(side=>{
  const find=part=>{let out;root.traverse(o=>{if(o.isBone&&o.name===part+side)out=o;});
   if(!out)throw Error('Original rig upper-arm anatomy missing: '+part+side);
   return out.getWorldPosition(new T.Vector3());
  };
  const shoulder=find('upperarm01'),elbow=find('lowerarm01');
  return {side,shoulder,elbow,axis:elbow.clone().sub(shoulder)};
 });
 const selected=shirt.meshes.filter(m=>m.name==='Work56-independent-shirt-shell');
 if(!selected.length)throw Error('3D44 requires existing original independently photographed shirt shell(s): '+shirt.meshes.map(m=>m.name).join(','));
 let moved=0,max=0,total=0,protectedPhotoTorso=0,protectedCuff=0;
 const perArm=Object.fromEntries(arms.map(a=>[a.side,{changed:0,maximum:0}]));
 for(const mesh of selected){
  mesh.updateWorldMatrix(true,false);
  const g=mesh.geometry,p=g.getAttribute('position'),inv=mesh.matrixWorld.clone().invert();
  const protectedFields=['panelPosition','panelNormal','skinIndex','skinWeight'];
  if(!p||protectedFields.some(name=>g.getAttribute(name)?.count!==p.count))
   throw Error('Original source photograph coordinate fields or original bone weights missing');
  const saved=Object.fromEntries(protectedFields.map(name=>[name,g.getAttribute(name).array.slice()]));
  const nodes=new Map(),mapping=[];
  for(let i=0;i<p.count;i++){
   const q=new T.Vector3().fromBufferAttribute(p,i).applyMatrix4(mesh.matrixWorld),id=key(q);
   if(!nodes.has(id))nodes.set(id,{point:q,ids:[],total:new T.Vector3(),votes:0});
   const entry=nodes.get(id);entry.ids.push(i);mapping.push(entry);
  }
  for(const arm of arms){
   const sign=Math.sign(arm.elbow.x)||Math.sign(arm.shoulder.x);
   for(const entry of nodes.values()){
    const q=entry.point;
    if(Math.sign(q.x)!==sign||Math.abs(q.x)<.245){protectedPhotoTorso++;continue;}
    const t=q.clone().sub(arm.shoulder).dot(arm.axis)/arm.axis.lengthSq();
    if(t<.035||t>.93){protectedCuff++;continue;}
    const c=arm.shoulder.clone().addScaledVector(arm.axis,t),radial=q.clone().sub(c),r=radial.length();
    if(r<.032||r>.19)continue;
    // An upper sleeve should taper from its shoulder cap into a relaxed elbow,
    // not reproduce the large anatomical upper-arm muscular ring. Both the
    // shaft position and original photographed seams are retained.
    const top=smooth(t,.07,.23)*(1-smooth(t,.61,.88));
    const shoulderCap=smooth(Math.abs(q.x),.245,.31);
    const outer=smooth(r,.041,.09);
    const blend=top*shoulderCap*(.50+.50*outer);
    const amount=Math.min(.022,.016*blend);
    if(amount<.00012)continue;
    const delta=radial.multiplyScalar(-amount/r);
    entry.total.add(delta);entry.votes++;
    perArm[arm.side].changed++;perArm[arm.side].maximum=Math.max(perArm[arm.side].maximum,amount);
   }
  }
  for(const n of nodes.values()){
   if(!n.votes)continue;
   const delta=n.total.multiplyScalar(1/n.votes),dist=delta.length();
   if(dist<.00015)continue;
   const q=n.point.clone().add(delta).applyMatrix4(inv);
   for(const i of n.ids)p.setXYZ(i,q.x,q.y,q.z);
   moved+=n.ids.length;total+=dist*n.ids.length;max=Math.max(max,dist);
  }
  p.needsUpdate=true;
  g.computeVertexNormals();smoothSurfaceNormals(g,p.count);
  g.computeBoundingBox();g.computeBoundingSphere();
  for(const name of protectedFields){
   const now=g.getAttribute(name).array,old=saved[name];
   if(now.length!==old.length||!now.every((v,i)=>v===old[i]))
    throw Error('3D44 changed original image coordinate, texture normal or source rig: '+name);
  }
 }
 if(moved<30||max<.003||max>.02201||arms.some(a=>perArm[a.side].changed<10))
  throw Error('3D44 failed meaningful, bilateral and bounded original source shoulder tailoring '+JSON.stringify({moved,max,perArm}));
 return {...shirt,stats:{...shirt.stats,
  sourceVerifiedUpperSleeveTailoring:true,
  upperSleeveTailoredVertices:moved,
  upperSleeveMaximumModelSpaceMove:max,
  upperSleeveMeanModelSpaceMove:total/moved,
  upperSleeveTorsoFrontProtected:protectedPhotoTorso,
  upperSleeveCuffProtected:protectedCuff,
  upperSleeveSourceArmProfiles:perArm,
  upperSleeveMethod:'source-rig shoulder-to-elbow normal-section soft taper, photo/UV and original skeleton immutable',
  originalShirtSourcePixelsAndCoordinatesUnchanged:true,
  originalShirtSkinWeightsUnchanged:true,
  signedCollisionCertified:false,continuousClothSimulation:false,
  sweptMotionCollisionCertified:false,visualApproval:false,
  releaseAuthorized:false}};
}
