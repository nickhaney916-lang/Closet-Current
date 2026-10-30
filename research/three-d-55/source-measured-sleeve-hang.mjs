/** 3D55 — original-photo sleeve natural hang, source-driven and opt-in.
 * Adds two tapered fabric-ease folds along each genuine anatomically rigged
 * photographed sleeve, not a synthetic photograph or a solid mannequin shell.
 * The 163-joint source elbow/wrist line controls each fold. Cloth moves
 * slightly outward from the forearm so motion is not a fake printed crease.
 *
 * Immutable source material: original photograph / UV panel provenance /
 * original source joints+skin weights / anatomical figures / licensed denim /
 * sewn original left/right shoulder cap pieces and source-neutral collar.
 * No customer photos, network inference, signed collision certification,
 * or production release. Pose-solver + genuine browser QA must independently
 * certify any opt-in research scenario.
 */
import * as T from 'three';
import {smoothSurfaceNormals} from '../three-d-08/garment-fit-profile.mjs';
const smooth=T.MathUtils.smoothstep;
const protect=['panelPosition','panelNormal','skinIndex','skinWeight'];
const key=q=>q.toArray().map(v=>v.toFixed(5)).join(':');
export function hangPhotographedSleeveCloth(shirt,root,{enabled=true}={}){
 if(!enabled)return shirt;
 if(!shirt?.stats?.naturalSourceShoulderSleeveTransition||
    !shirt?.stats?.sourceNeutralRearFabricRelief||
    !shirt?.stats?.independentArmholeCapPanels||
    !shirt?.stats?.sourceNeutralCollarRoll)
  throw Error('3D55 requires fully source-verified 3D53/54 garment and real independent sewn sleeve caps');
 root.updateMatrixWorld(true);
 const arms={};
 for(const side of ['L','R']){
  const find=name=>{
   let node;root.traverse(o=>{if(o.isBone&&o.name===name+side)node=o;});
   if(!node)throw Error('3D55 requires original 163-joint anatomical '+name+side);
   return node.getWorldPosition(new T.Vector3());
  };
  const elbow=find('lowerarm01'),wrist=find('wrist'),upper=find('upperarm01');
  const axis=wrist.clone().sub(elbow);
  if(axis.length()<.12)throw Error('Original real elbow-wrist source bone segment too short');
  arms[side]={elbow,wrist,upper,axis,len2:axis.lengthSq()};
 }
 const meshes=shirt.meshes.filter(m=>m.isSkinnedMesh&&m.name==='Work56-independent-shirt-shell');
 if(!meshes.length)throw Error('No original source true separate shirt shell to drape');
 const stats={L:{moved:0,maxMove:0,foldA:0,foldB:0},R:{moved:0,maxMove:0,foldA:0,foldB:0}};
 let moved=0,maxMove=0,protectedFront=0,cuffProtected=0;
 for(const mesh of meshes){
  mesh.updateWorldMatrix(true,false);
  const g=mesh.geometry,p=g.getAttribute('position'),index=g.index;
  if(!p||!index||index.count<3)throw Error('3D55 original photographed sleeve missing true rendered triangles');
  const before=new Map(protect.map(name=>{
   const attr=g.getAttribute(name);
   if(!attr||attr.count!==p.count)throw Error('3D55 original source photo/UV/skin missing '+name);
   return [name,attr.array.slice()];
  }));
  const used=new Set();
  for(let j=0;j<index.count;j++){
   const id=index.getX(j);
   if(id<0||id>=p.count)throw Error('3D55 invalid rendered sleeve triangle');
   used.add(id);
  }
  // Move all duplicate seam/rendered vertices at precisely the same source
  // coordinate as a unit. This avoids tearing original sleeve panels.
  const groups=new Map();
  for(const i of used){
   const q=new T.Vector3().fromBufferAttribute(p,i).applyMatrix4(mesh.matrixWorld);
   if(![q.x,q.y,q.z].every(Number.isFinite))throw Error('3D55 nonfinite source model');
   const stamp=key(q);
   if(!groups.has(stamp))groups.set(stamp,{q,ids:[]});
   groups.get(stamp).ids.push(i);
  }
  const inv=mesh.matrixWorld.clone().invert();
  for(const {q,ids} of groups.values()){
   const x=Math.abs(q.x);
   // No garment photograph front/centre print, collar, yoke, or torso.
   if(x<.31){protectedFront+=ids.length;continue;}
   const side=Math.sign(q.x)===Math.sign(arms.L.wrist.x)?'L':'R';
   const arm=arms[side];
   const t=q.clone().sub(arm.elbow).dot(arm.axis)/arm.len2;
   if(t<=.12||t>=.89){cuffProtected+=ids.length;continue;}
   const center=arm.elbow.clone().addScaledVector(arm.axis,t);
   const radial=q.clone().sub(center),radius=radial.length();
   if(radius<.028||radius>.19)continue;
   // Two non-repeating hanging fabric relaxation arcs at distinct real
   // distances along the source elbow-to-wrist axis. Both fade to zero
   // toward the original elbow seam and wrist cuff.
   const yEnvelope=smooth(t,.12,.27)*(1-smooth(t,.72,.89));
   const radialEnvelope=smooth(radius,.028,.065)*(1-smooth(radius,.14,.19));
   const envelope=yEnvelope*radialEnvelope;
   if(envelope<.065)continue;
   const frontBack=Math.abs(radial.z)/(radius||1);
   const angleWeight=.50+.50*smooth(frontBack,.12,.65);
   const foldA=Math.exp(-Math.pow((t-.34)/.11,2));
   const foldB=Math.exp(-Math.pow((t-.63)/.105,2));
   const expansion=(.0045*foldA+.0065*foldB)*envelope*angleWeight;
   if(expansion<.00012)continue;
   const outward=radial.normalize().multiplyScalar(expansion);
   // A very small gravity ease increases visible folded hanging shape
   // without moving original source cuff/shoulder anchors.
   const gravity=.0018*envelope*(.55+.45*foldB);
   const shift=outward.add(new T.Vector3(0,-gravity,0));
   const distance=shift.length();
   if(!Number.isFinite(distance)||distance>.01201)
    throw Error('Original source 3D55 cloth fall exceeded 12mm strict displacement envelope');
   const target=q.clone().add(shift).applyMatrix4(inv);
   for(const i of ids){
    p.setXYZ(i,target.x,target.y,target.z);
    moved++;stats[side].moved++;
    if(foldA>foldB)stats[side].foldA++;
    else stats[side].foldB++;
    stats[side].maxMove=Math.max(stats[side].maxMove,distance);
   }
   maxMove=Math.max(maxMove,distance);
  }
  p.needsUpdate=true;g.computeVertexNormals();smoothSurfaceNormals(g,p.count);
  g.computeBoundingBox();g.computeBoundingSphere();
  for(const [name,old] of before){
   const newer=g.getAttribute(name).array;
   if(old.length!==newer.length||!newer.every((v,i)=>v===old[i]))
    throw Error('3D55 altered original source photographed sleeve UV/photo or skeletal material: '+name);
  }
 }
 if(moved<50||maxMove<.001||maxMove>.01201||protectedFront<100||
    ['L','R'].some(side=>stats[side].moved<25||stats[side].foldA<8||stats[side].foldB<8))
  throw Error('3D55 genuine bilateral original-photo sleeve drape unavailable '+
   JSON.stringify({moved,maxMove,protectedFront,cuffProtected,stats}));
 return {...shirt,stats:{...shirt.stats,
  sourceMeasuredNaturalSleeveHang:true,
  sleeveHangChangedRenderedVertices:moved,
  sleeveHangMaximumMove:maxMove,
  sleeveHangBySide:stats,
  sleeveHangProtectedCenterPhotoVertices:protectedFront,
  sleeveHangProtectedCuffVertices:cuffProtected,
  sleeveHangMethod:'true original elbow-to-wrist bone axis plus two tapered radial garment ease folds on actual photographed skinned sleeve mesh',
  originalPhotographedSleeveUVAndSkinPreserved:true,
  originalIndependentShoulderCapSeamsPreserved:true,
  originalPhotographedBodyAndDenimPreserved:true,
  continuousSweptMotionCertified:false,
  signedVolumeContainmentCertified:false,
  physicalPhoneTested:false,
  humanVisualApproved:false,
  releaseAuthorized:false}};
}
