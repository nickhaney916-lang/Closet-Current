/** 3D53: source-neutral back-shirt cloth relief on the REAL original fitted
 * photographed shirt. Opt-in DRAFT/HOLD only. This is controlled geometry
 * construction, not a synthetic reverse-side photograph or cloth physics.
 * The original photographed front, cap cut/sewn seams, collar, source UV/rig,
 * 3D body and original denim never change. The rear waist and shoulder yoke
 * are anchored; only central interior back-facing, triangle-used vertices
 * receive a small outward (away from the body) drape relief.
 */
import * as THREE from 'three';
import {smoothSurfaceNormals} from '../three-d-08/garment-fit-profile.mjs';
const smooth=THREE.MathUtils.smoothstep;
const safe=['panelPosition','panelNormal','skinIndex','skinWeight'];
export function easeSourceNeutralRearFabric(shirt,root,{enabled=true}={}){
 if(!enabled)return shirt;
 if(!shirt?.stats?.independentRearShirtPattern||
    !shirt?.stats?.independentShoulderClothContour||
    !shirt?.stats?.upperArmFabricVolumeTailored||
    !shirt?.stats?.sourceNeutralCollarRoll)
  throw Error('3D53 requires original photographed independently fitted shirt, real shoulder caps and sewn collar');
 root.updateMatrixWorld(true);
 const center=shirt.stats.envelope?.center;
 if(!Number.isFinite(center))throw Error('3D53 missing original source-fitted shirt depth landmark');
 const shells=shirt.meshes.filter(m=>m.isSkinnedMesh&&m.name==='Work56-independent-shirt-shell');
 if(!shells.length)throw Error('3D53 actual source-neutral rear shirt shell is missing');
 let changed=0,max=0,total=0,rear=0,protectedFront=0,anchored=0;
 const perShell=[];
 for(const mesh of shells){
  mesh.updateWorldMatrix(true,false);
  const g=mesh.geometry,p=g.getAttribute('position'),back=g.getAttribute('panelNormal'),index=g.index;
  if(!p||!back||back.count!==p.count||!index||index.count<3)
   throw Error('3D53 requires indexed original source-neutral shirt back panel');
  const snapshot=new Map(safe.map(name=>{
   const a=g.getAttribute(name);
   if(!a||a.count!==p.count)throw Error('3D53 source photo or original 163-joint rig metadata missing '+name);
   return [name,a.array.slice()];
  }));
  // Work42 may retain unreferenced source vertices after cutting the
  // independent caps. These are NOT rendered cloth and cannot be counted.
  const used=new Set();
  for(let i=0;i<index.count;i++){
   const id=index.getX(i);
   if(id>=p.count)throw Error('3D53 source shirt has an invalid rendered triangle index');
   used.add(id);
  }
  const inv=mesh.matrixWorld.clone().invert();
  let localMoved=0;
  for(const i of used){
   const q=new THREE.Vector3().fromBufferAttribute(p,i).applyMatrix4(mesh.matrixWorld);
   const x=Math.abs(q.x), y=q.y;
   // The genuine front photograph and its original collar, chest print,
   // sleeves and cut cap seams are outside this strictly interior region.
   if(back.getZ(i)>-.8||q.z>=center-.040||x>=.155||y<=1.205||y>=1.485){
    if(q.z>=center-.040)protectedFront++;
    else anchored++;
    continue;
   }
   const sideFade=1-smooth(x,.080,.155);
   const yFade=smooth(y,1.205,1.278)*(1-smooth(y,1.405,1.485));
   const envelope=sideFade*yFade;
   if(envelope<.04){anchored++;continue;}
   // Two low-relief vertical fabric folds, joined by a relaxed center
   // channel; anchored at upper back and waistband. The rear remains
   // explicitly neutral because no reverse photographic source exists.
   const foldL=Math.exp(-Math.pow((q.x+.075)/.032,2));
   const foldR=Math.exp(-Math.pow((q.x-.075)/.032,2));
   const middle=Math.exp(-Math.pow(q.x/.060,2));
   const dz=-(.006+.009*Math.max(foldL,foldR)+.003*middle)*envelope;
   if(Math.abs(dz)<.0001)continue;
   if(!Number.isFinite(dz)||Math.abs(dz)>.01801)
    throw Error('3D53 bounded source-neutral rear cloth relief exceeded 18mm');
   const local=q.clone().add(new THREE.Vector3(0,0,dz)).applyMatrix4(inv);
   p.setXYZ(i,local.x,local.y,local.z);
   changed++;localMoved++;rear++;total+=Math.abs(dz);max=Math.max(max,Math.abs(dz));
  }
  p.needsUpdate=true;
  g.computeVertexNormals();smoothSurfaceNormals(g,p.count);
  g.computeBoundingBox();g.computeBoundingSphere();
  for(const [name,prior] of snapshot){
   const after=g.getAttribute(name).array;
   if(after.length!==prior.length||!after.every((v,i)=>v===prior[i]))
    throw Error('3D53 changed protected original photo, skin weights or source UV: '+name);
  }
  perShell.push(localMoved);
 }
 if(changed<24||max<.004||max>.01801||rear<24||protectedFront<30)
  throw Error('3D53 true rendered source-neutral rear fabric change not demonstrated '+
   JSON.stringify({changed,max,rear,protectedFront,perShell}));
 return {...shirt,stats:{...shirt.stats,
  sourceNeutralRearFabricRelief:true,
  rearReliefMovedRenderedVertices:changed,
  rearReliefMaximumMove:max,
  rearReliefMeanMove:total/changed,
  rearReliefProtectedFrontVertices:protectedFront,
  rearReliefAnchoredVertices:anchored,
  rearReliefPerShell:perShell,
  originalPhotographedFrontAndUVUnchanged:true,
  independentShoulderCapAndSewnSeamsUnchanged:true,
  sourceNeutralRearPhotoNotInvented:true,
  signedContainmentCertified:false,
  continuousSweptMotionCertified:false,
  physicalPhoneTested:false,
  humanVisualApproved:false,
  releaseAuthorized:false}};
}
