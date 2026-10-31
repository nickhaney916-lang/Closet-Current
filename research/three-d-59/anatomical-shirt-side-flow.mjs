/** Closet Current 3D-59 — REAL original photographed shirt side-body fit.
 *
 * Gently removes unnatural box-shaped excess width below the upper arms,
 * using side radius measurements from the SAME source-pose anatomical
 * skinned torso rather than a generic cylinder or an imagined garment size.
 * Only actual indexed, rendered fabric triangles can move; duplicate source
 * seam vertices move identically. Physical source photo/UV/rig metadata is
 * byte-identical. Original centre-front photograph, neckline, detached
 * shoulder caps, cuffs, waist hem, source-neutral rear and denim are pinned.
 *
 * This is not cloth dynamics, inverse-rendered photographs, all-pose signed
 * containment, continuous swept collision testing or a public release.
 */
import * as THREE from 'three';
import {smoothSurfaceNormals} from '../three-d-08/garment-fit-profile.mjs';

const smooth=THREE.MathUtils.smoothstep;
const sourceAttrs=['panelPosition','panelNormal','skinIndex','skinWeight'];
const grid=0.025,start=1.08;
const row=y=>Math.floor((y-start)/grid);
const key=q=>q.toArray().map(x=>x.toFixed(5)).join(':');

export function fitPhotographedShirtSideFlow(shirt,root,{enabled=true}={}){
 if(!enabled)return shirt;
 if(!shirt?.stats?.sourceMeasuredNaturalSleeveHang||
    !shirt?.stats?.naturalSourceShoulderSleeveTransition||
    !shirt?.stats?.sourceNeutralRearFabricRelief||
    !shirt?.stats?.independentArmholeCapPanels||
    !shirt?.stats?.originalPhotographedTorsoDrape)
  throw Error('3D59 needs genuine independently sewn source shirt, source torso drape, shoulders and previous sleeve folds');
 root.updateMatrixWorld(true);
 const center=shirt.stats.envelope?.center;
 if(!Number.isFinite(center))throw Error('3D59 missing original shirt source-depth landmark');
 const shells=shirt.meshes.filter(m=>m.isSkinnedMesh&&m.name==='Work56-independent-shirt-shell');
 const caps=shirt.meshes.filter(m=>m.isSkinnedMesh&&m.userData.work45IndependentShoulderCap);
 if(!shells.length||!['L','R'].every(side=>caps.some(m=>m.userData.work45IndependentShoulderCap===side)))
  throw Error('3D59 real source-independent bilateral shoulder cap and torso shell missing');

 // Sample the real, unmodified anatomical torso at the source pose.
 // Exclude arms and off-axis mesh outliers by source depth and 90th percentile;
 // a single stray vertex must not fake a very wide torso.
 const measured={L:new Map(),R:new Map()},bodyPoints={L:0,R:0};
 root.traverse(m=>{
  if(!m.isSkinnedMesh||m.userData.work56Garment)return;
  m.updateWorldMatrix(true,false);
  const p=m.geometry?.getAttribute('position'),idx=m.geometry?.index;
  if(!p)return;
  const used=idx?new Set(idx.array):new Set(Array.from({length:p.count},(_,i)=>i));
  for(const i of used){
   const q=new THREE.Vector3().fromBufferAttribute(p,i).applyMatrix4(m.matrixWorld);
   if(q.y<1.08||q.y>1.49||Math.abs(q.z-center)>.20)continue;
   const x=Math.abs(q.x);
   if(x<.10||x>.32)continue;
   const side=q.x<0?'L':'R',r=row(q.y);
   if(!measured[side].has(r))measured[side].set(r,[]);
   measured[side].get(r).push({x,z:q.z});
   bodyPoints[side]++;
  }
 });
 if(Math.min(bodyPoints.L,bodyPoints.R)<80)
  throw Error('3D59 no actual measured male/female anatomical torso source surface on both sides '+JSON.stringify(bodyPoints));

 const realCaps=new Set(),capBytes=new Map();
 for(const m of caps){
  m.updateWorldMatrix(true,false);
  const g=m.geometry,p=g.getAttribute('position'),idx=g.index;
  if(!p||!idx)throw Error('3D59 authentic independent sewn cap geometry missing');
  capBytes.set(m,p.array.slice());
  for(const i of new Set(idx.array))
   realCaps.add(key(new THREE.Vector3().fromBufferAttribute(p,i).applyMatrix4(m.matrixWorld)));
 }
 function bodyLimit(side,q){
  const samples=[];
  for(let k=row(q.y)-1;k<=row(q.y)+1;k++){
   for(const p of measured[side].get(k)||[]){
    if(Math.abs(p.z-q.z)<=.075)samples.push(p.x);
   }
  }
  if(samples.length<9)return null;
  samples.sort((a,b)=>a-b);
  return samples[Math.floor(.90*(samples.length-1))];
 }
 const bySide={L:{moved:0,maxMove:0,measured:0},R:{moved:0,maxMove:0,measured:0}};
 let moved=0,maxMove=0,originalFrontProtected=0,
  originalCapSeamProtected=0,sourceMappedVertices=0,unsupportedBody=0,hemProtected=0;
 for(const mesh of shells){
  mesh.updateWorldMatrix(true,false);
  const g=mesh.geometry,p=g.getAttribute('position'),idx=g.index;
  if(!p||!idx||idx.count<3)throw Error('3D59 only actual indexed source-photographed skinned fabric permitted');
  const originals=new Map(sourceAttrs.map(name=>{
   const a=g.getAttribute(name);
   if(!a||a.count!==p.count)throw Error('3D59 missing original full-resolution photo/UV/163-joint skin source '+name);
   return [name,a.array.slice()];
  }));
  const groups=new Map(),inv=mesh.matrixWorld.clone().invert();
  for(const i of new Set(idx.array)){
   if(i<0||i>=p.count)throw Error('3D59 invalid source shirt rendered triangle');
   const q=new THREE.Vector3().fromBufferAttribute(p,i).applyMatrix4(mesh.matrixWorld),k=key(q);
   if(!groups.has(k))groups.set(k,{q,ids:[]});
   groups.get(k).ids.push(i);
  }
  for(const {q,ids} of groups.values()){
   const x=Math.abs(q.x),y=q.y,z=q.z,k=key(q);
   // Preserve central original front photo; permit only lateral photographed fabric to reshape its true side profile.
   if(x<=.215){originalFrontProtected+=ids.length;continue;}
   if(y<=1.14){hemProtected+=ids.length;continue;}
   if(y>=1.44||realCaps.has(k)){originalCapSeamProtected+=ids.length;continue;}
   if(x>.385||Math.abs(z-center)>.24)continue;
   const side=q.x<0?'L':'R',limit=bodyLimit(side,q);
   if(limit===null){unsupportedBody+=ids.length;continue;}
   bySide[side].measured+=ids.length;
   const excess=x-(limit+.012);
   if(excess<=.001)continue;
   // Preserve original front and rear artwork/photo anchors, and feather
   // the side fabric into unchanged shoulder, back and lower waist.
   const horiz=smooth(x,.215,.253)*(1-smooth(x,.345,.385));
   const vertical=smooth(y,1.14,1.215)*(1-smooth(y,1.365,1.44));
   // A genuine side view projects z/y (not x); keep the shaped source-fabric flank visible
   // in silhouette without altering front-center art, sewn caps, rear center or waist hem.
   const depth=1-smooth(Math.abs(z-center),.17,.24);
   const weight=horiz*vertical*depth;
   if(weight<.08)continue;
   const dx=-Math.sign(q.x)*Math.min(.012,excess)*weight;
   const backWeight=1-smooth(z-center,-.018,.05);
   // The former x-only tuck was invisible to an exactly lateral camera. A bounded,
   // locally source-measured side-panel taper in z makes the *real skinned cloth*
   // read as draping rather than a flat body shell from the anatomical side view.
   // No synthetic texture, generated art, central-front photo or photo UV is touched.
   const flankExposure=smooth(Math.abs(z-center),.065,.135);
   const dz=(-.0105*Math.sign(z-center)*flankExposure-
     .0025*backWeight*(1-flankExposure))*weight;
   const delta=new THREE.Vector3(dx,0,dz);
   // Bound the actual 3D vector, not its individual components, to protect true
   // source-panel displacement and the independent contact solver's 13mm gate.
   delta.multiplyScalar(Math.min(1,.0129/Math.max(delta.length(),1e-12)));
   const length=delta.length();
   if(length<.00025)continue;
   if(!Number.isFinite(length)||length>.01301)
    throw Error('3D59 anatomy-measured source cloth width exceeded 13mm fit envelope');
   const local=q.clone().add(delta).applyMatrix4(inv);
   for(const i of ids){
    p.setXYZ(i,local.x,local.y,local.z);
    moved++;bySide[side].moved++;
    bySide[side].maxMove=Math.max(bySide[side].maxMove,length);
   }
   maxMove=Math.max(maxMove,length);
  }
  sourceMappedVertices+=p.count;
  p.needsUpdate=true;g.computeVertexNormals();smoothSurfaceNormals(g,p.count);
  g.computeBoundingBox();g.computeBoundingSphere();
  for(const [name,before] of originals){
   const after=g.getAttribute(name).array;
   if(after.length!==before.length||!after.every((v,i)=>v===before[i]))
    throw Error('3D59 changed original photographic source, color mapping or 163-bone skin weights: '+name);
  }
 }
 for(const [mesh,before] of capBytes){
  const after=mesh.geometry.getAttribute('position').array;
  if(after.length!==before.length||!after.every((v,i)=>v===before[i]))
   throw Error('3D59 altered original independent sewn shoulder panel geometry');
 }
 if(moved<40||maxMove<.0015||maxMove>.01301||originalFrontProtected<100||
    ['L','R'].some(side=>bySide[side].moved<20))
  throw Error('3D59 actual anatomical shirt side-flow not demonstrably different on both shoulders and genuine photographed fabric '+
   JSON.stringify({moved,maxMove,bodyPoints,bySide,originalFrontProtected,originalCapSeamProtected,unsupportedBody,hemProtected}));
 return {...shirt,stats:{...shirt.stats,
  measuredNaturalShirtSideFlow:true,
  shirtSideFlowEditedRealVertices:moved,
  shirtSideFlowMaximumWorldMove:maxMove,
  shirtSideFlowBySide:bySide,
  shirtSideFlowMeasuredBodyPoints:bodyPoints,
  shirtSideFlowProtectedOriginalPhotoFront:originalFrontProtected,
  shirtSideFlowProtectedCapSeam:originalCapSeamProtected,
  shirtSideFlowProtectedHem:hemProtected,
  shirtSideFlowUnmeasuredBodyVertices:unsupportedBody,
  shirtSideFlowOriginalMappedVertices:sourceMappedVertices,
  shirtSideFlowMethod:'90th-percentile original anatomical source torso width by side, y row and z depth with bounded independent cloth clearance',
  originalPhotographedSourcePixelsUVAndSkinUnchanged:true,
  originalBodyOriginalDenimAndIndependentCapsUnchanged:true,
  directBodyMeasurementsOnly:true,
  fullSignedContainmentCertified:false,
  continuousSweptMotionCertified:false,
  trueClothDynamicsCertified:false,
  actualPhysicalPhonesTested:false,
  humanVisualApproval:false,
  releaseAuthorized:false}};
}
