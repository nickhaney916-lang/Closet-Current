/** 3D56 DRAFT/HOLD: physical diagonal elbow cloth creases on ORIGINAL
 * independently skinned, genuinely photographed long sleeves.
 *
 * Source bone-referenced, not inferred reverse-side photographs or a printed
 * shader fake. Two broad asymmetric creases gather actual cloth around each
 * anatomical elbow and along the adjacent forearm. Mesh skinning carries the
 * creases through the original 163-joint pose transitions.
 *
 * Original actual shirt front/photo/UV/skin, physically detached shoulder
 * caps, collar, cuffs, waist, body and separately licensed denim are
 * protected. Geometry tests, genuine skinned BVH pose checks and Chromium
 * pictures are mandatory before ANY aesthetic approval or deployment.
 * This is NOT dynamic cloth simulation or signed collision certification.
 */
import * as THREE from 'three';
import {smoothSurfaceNormals} from '../three-d-08/garment-fit-profile.mjs';

const smooth=THREE.MathUtils.smoothstep;
const sourceAttrs=['panelPosition','panelNormal','skinIndex','skinWeight'];
const stamp=q=>q.toArray().map(x=>x.toFixed(5)).join(':');

export function formSourcePhotographedElbowCreases(shirt,root,{enabled=true}={}){
 if(!enabled)return shirt;
 if(!shirt?.stats?.sourceMeasuredNaturalSleeveHang||
    !shirt?.stats?.naturalSourceShoulderSleeveTransition||
    !shirt?.stats?.sourceNeutralRearFabricRelief||
    !shirt?.stats?.sourceNeutralCollarRoll||
    !shirt?.stats?.independentArmholeCapPanels)
  throw Error('3D56 requires original photo sewn L/R caps, 3D53/54/55 genuine shoulder and sleeve fabric');
 root.updateMatrixWorld(true);
 const arms={};
 for(const side of ['L','R']){
  const find=name=>{
   let b;root.traverse(o=>{if(o.isBone&&o.name===name+side)b=o;});
   if(!b)throw Error('3D56 original anatomical source landmark missing '+name+side);
   return b.getWorldPosition(new THREE.Vector3());
  };
  const elbow=find('lowerarm01'),wrist=find('wrist'),shoulder=find('upperarm01');
  const direction=wrist.clone().sub(elbow),lengthSq=direction.lengthSq();
  if(!Number.isFinite(lengthSq)||lengthSq<.01)
   throw Error('3D56 requires non-degenerate original anatomical forearm line');
  arms[side]={elbow,wrist,shoulder,direction,lengthSq};
 }
 const shells=shirt.meshes.filter(m=>m.isSkinnedMesh&&m.name==='Work56-independent-shirt-shell');
 const caps=shirt.meshes.filter(m=>Boolean(m.userData.work45IndependentShoulderCap));
 if(!shells.length||!caps.some(m=>m.userData.work45IndependentShoulderCap==='L')||
   !caps.some(m=>m.userData.work45IndependentShoulderCap==='R'))
  throw Error('3D56 actual photographed shirt shell and separately sewn bilateral sleeve caps missing');
 const perSide={L:{edited:0,firstCrease:0,secondCrease:0,maxMove:0},
                R:{edited:0,firstCrease:0,secondCrease:0,maxMove:0}};
 let moved=0,maxMove=0,frontProtected=0,cuffProtected=0;
 const immutableCaps=caps.map(m=>({mesh:m,bytes:m.geometry.attributes.position.array.slice()}));
 for(const mesh of shells){
  mesh.updateWorldMatrix(true,false);
  const g=mesh.geometry,p=g.getAttribute('position'),idx=g.index;
  if(!p||!idx||idx.count<3)throw Error('3D56 requires actual indexed original photographed rendered shirt');
  const original=new Map(sourceAttrs.map(name=>{
   const a=g.getAttribute(name);
   if(!a||a.count!==p.count)
    throw Error('3D56 source photo, panel origin or skin metadata absent: '+name);
   return [name,a.array.slice()];
  }));
  // Truly rendered original triangle-used points only, not unused shell
  // vertices retained after physical original L/R shoulder-cap cutting.
  const used=new Set();
  for(let k=0;k<idx.count;k++){
   const i=idx.getX(k);
   if(!Number.isInteger(i)||i<0||i>=p.count)
    throw Error('3D56 original photographed garment has invalid triangle index');
   used.add(i);
  }
  const grouped=new Map();
  for(const i of used){
   const q=new THREE.Vector3().fromBufferAttribute(p,i).applyMatrix4(mesh.matrixWorld);
   if(![q.x,q.y,q.z].every(Number.isFinite))throw Error('3D56 nonfinite original licensed source cloth');
   const key=stamp(q);
   if(!grouped.has(key))grouped.set(key,{q,ids:[]});
   grouped.get(key).ids.push(i);
  }
  const inv=mesh.matrixWorld.clone().invert();
  for(const {q,ids} of grouped.values()){
   const x=Math.abs(q.x);
   if(x<=.31){frontProtected+=ids.length;continue;}
   const side=Math.sign(q.x)===Math.sign(arms.L.wrist.x)?'L':'R';
   const {elbow,direction,lengthSq}=arms[side];
   const t=q.clone().sub(elbow).dot(direction)/lengthSq;
   // Keep actual photographed cuff, wrist seam, collar and upper-arm seam
   // exactly fixed; only true forearm fabric near elbow may relax.
   if(t<=.12||t>=.76){cuffProtected+=ids.length;continue;}
   const center=elbow.clone().addScaledVector(direction,t);
   const radial=q.clone().sub(center),radius=radial.length();
   if(radius<.030||radius>.178)continue;
   const span=smooth(t,.12,.22)*(1-smooth(t,.63,.76));
   const radialFade=smooth(radius,.030,.062)*(1-smooth(radius,.145,.178));
   const body=span*radialFade;
   if(body<.07)continue;
   // The diagonal stagger depends on the actual source cylindrical angle,
   // not on a fabricated texture. Fold crests are intentionally *uneven*,
   // avoiding two rigid, circular tubes/rings around the sleeve.
   const theta=Math.atan2(radial.z,radial.y);
   const phase=side==='L'?.35:-.27;
   const centerA=.285+.045*Math.sin(theta+phase);
   const centerB=.515+.038*Math.sin(1.2*theta-phase);
   const crestA=Math.exp(-Math.pow((t-centerA)/.085,2));
   const crestB=Math.exp(-Math.pow((t-centerB)/.09,2));
   const blend=.45+.55*Math.max(crestA,crestB);
   const radialEase=(.002+.0085*blend)*body;
   const gravity=.0022*body*(.55+.45*crestB);
   const delta=radial.normalize().multiplyScalar(radialEase);
   delta.y-=gravity;
   const dist=delta.length();
   if(dist<.00015)continue;
   if(!Number.isFinite(dist)||dist>.01301)
    throw Error('3D56 original source elbow textile change exceeded strict 13mm physical envelope');
   const local=q.clone().add(delta).applyMatrix4(inv);
   for(const i of ids){
    p.setXYZ(i,local.x,local.y,local.z);
    moved++;const stat=perSide[side];stat.edited++;
    if(crestA>=crestB)stat.firstCrease++;else stat.secondCrease++;
    stat.maxMove=Math.max(stat.maxMove,dist);
   }
   maxMove=Math.max(maxMove,dist);
  }
  p.needsUpdate=true;g.computeVertexNormals();smoothSurfaceNormals(g,p.count);
  g.computeBoundingBox();g.computeBoundingSphere();
  for(const [name,before] of original){
   const after=g.getAttribute(name).array;
   if(before.length!==after.length||!after.every((v,i)=>v===before[i]))
    throw Error('3D56 changed protected original photographic source/UV/163-bone data: '+name);
  }
 }
 for(const {mesh,bytes} of immutableCaps){
  const after=mesh.geometry.attributes.position.array;
  if(after.length!==bytes.length||!after.every((v,i)=>v===bytes[i]))
   throw Error('3D56 must not alter separate original sewn sleeve caps or shoulder joint seams');
 }
 if(moved<60||maxMove<.002||maxMove>.01301||frontProtected<100||
    ['L','R'].some(side=>perSide[side].edited<30||
     perSide[side].firstCrease<12||perSide[side].secondCrease<12))
  throw Error('3D56 insufficient genuine male/female source elbow creasing '+JSON.stringify({moved,maxMove,frontProtected,cuffProtected,perSide}));
 return {...shirt,stats:{...shirt.stats,
  originalSourceElbowClothCreases:true,
  elbowCreaseMovedRealVertices:moved,
  elbowCreaseMaximumWorldMove:maxMove,
  elbowCreaseBySide:perSide,
  elbowCreaseProtectedFrontSourceVertices:frontProtected,
  elbowCreaseProtectedCuffVertices:cuffProtected,
  elbowCreaseMethod:'source original 163-joint elbow-to-wrist diagonal physical relief on skinned, photographed true sleeve cloth',
  originalSourceElbowPhotoUVAndSkinUnchanged:true,
  originalIndependentCapsAndSeamsUnchanged:true,
  sourceOnlyOriginalActualPhotographedFabric:true,
  signedVolumeContainmentCertified:false,
  continuousSweptMotionCertified:false,
  physicalPhoneTested:false,
  humanVisualApproved:false,
  releaseAuthorized:false}};
}
