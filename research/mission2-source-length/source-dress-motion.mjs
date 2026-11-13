/**
 * Closet Current Mission 2 P2-C36 — actual P61 source dress pose-phase skirt
 * relief on the original 163-bone THREE SkinnedMesh, research only.
 *
 * Unlike a shader-only fabric trick, this stages real garment vertex XYZ
 * changes. Source JPEG RGB/alpha, dressRest/UV, skin indices/weights, material,
 * armhole/bodice topology, original owner admission and source SHA are NEVER
 * modified. Original source photograph front remains protected; rear is
 * explicitly unphotographed/inferred. This is not a time-integrated
 * cloth simulation or swept collision proof and CANNOT approve release.
 */
import * as THREE from 'three';

const DRESS_SHA='e7a617cd23a159864f619e8397d5f37d48b684e47dddc4ad6b46b14481042019';
const MAX_OUTWARD=.012,MAX_DROP=.0025,MAX_DISPLACEMENT=.01235;
const originals=new WeakMap();
const fail=m=>{throw Error('M2 C36 source dress motion '+m);};
const clamp=(v,lo,hi)=>Math.max(lo,Math.min(hi,v));
const smooth=(a,b,x)=>{const t=clamp((x-a)/(b-a),0,1);return t*t*(3-2*t);};
const equal=(a,b)=>a?.length===b?.length&&a.every((v,i)=>v===b[i]);
const getSource=mesh=>{
 const g=mesh.geometry;
 // Exact original P61 fabric source may deliberately use dressRest/custom
 // photo coordinates WITHOUT conventional THREE 'uv'. Never synthesize one.
 const attrs=['position','normal','dressRest','skinIndex','skinWeight'];
 for(const key of Object.keys(g.attributes))
  if(!attrs.includes(key))attrs.push(key);
 const buffers=new Map();
 const sourceWeights=g.getAttribute('skinWeight'),sourceBoneIDs=g.getAttribute('skinIndex');
 if(!sourceWeights?.isBufferAttribute||!sourceBoneIDs?.isBufferAttribute||
    sourceWeights.itemSize!==4||sourceBoneIDs.itemSize!==4)
  fail('original source has no four bone skin channels');
 for(let i=0;i<g.getAttribute('position').count;i++){
  let weight=0;
  for(let j=0;j<4;j++){
   const value=sourceWeights.getComponent(i,j),bone=sourceBoneIDs.getComponent(i,j);
   if(!Number.isFinite(value)||value<0||value>1||
      !Number.isSafeInteger(bone)||bone<0||bone>=163)
    fail('original anatomical dress bone fields invalid');
   weight+=value;
  }
  if(Math.abs(weight-1)>.005)
   fail('original anatomical dress skin weights not normalized');
 }
 for(const a of attrs){
  const f=g.getAttribute(a);
  if(!f?.isBufferAttribute||f.count!==g.getAttribute('position').count||
     f.isInterleavedBufferAttribute)fail('original P61 skinned photo/rest/UV/normal fields required: '+a);
  buffers.set(a,{field:f,values:f.array.slice()});
 }
 return {geometry:g,attributes:buffers,material:mesh.material,
  sourceSHA:DRESS_SHA,last:buffers.get('position').values.slice(),lastNormals:buffers.get('normal').values.slice()};
};
const checkProvenance=(mesh,state)=>{
 const g=mesh.geometry;
 if(g!==state.geometry||mesh.material!==state.material||
    mesh.skeleton?.bones.length!==163)
  fail('original signed garment rig/source material replaced');
 // All initially present source attributes (including nonstandard dress
 // photo mapping) must remain byte-identical; no missing UV is fabricated.
 const names=Object.keys(g.attributes);
 if(names.length!==state.attributes.size||
    names.some(name=>!state.attributes.has(name)))
  fail('original source photo attribute schema changed or invented UV');
 for(const [name,expected] of state.attributes){
  if(name==='position'||name==='normal')continue;
  const current=g.getAttribute(name);
  if(current!==expected.field||!equal(current.array,expected.values))
   fail('original source photograph projection or anatomical skin changed: '+name);
 }
 if(!equal(g.getAttribute('position').array,state.last)||
    !equal(g.getAttribute('normal').array,state.lastNormals))
  fail('stale source dress geometry or unaudited external pose mutation');
};
/** Safe, deterministic, frame-phase-driven skirt displacement in [0,1]. */
export function sourceDressSwayProfile({theta,t,phase}={}){
 if(![theta,t,phase].every(Number.isFinite)||
    theta < -Math.PI-1e-7||theta>Math.PI+1e-7||
    t<0||t>1||phase<0||phase>1)
  fail('finite bounded signed source skirt coordinate and phase required');
 const front=Math.cos(theta);
 const sideRear=1-smooth(.30,.68,front);
 const skirtHem=smooth(.04,.94,t);
 if(sideRear<1e-10||skirtHem<1e-10)
  return Object.freeze({outward:0,drop:0,photographedFrontProtected:true});
 // Smooth periodic phase field; radial displacements are ONLY outward
 // to avoid pulling already-fitted skinned cloth through a static body.
 // The lower-hem drift remains physically bounded (12mm + 2.5mm).
 const wave=.5+.5*Math.sin(2*Math.PI*phase + 2.1*theta+.7*t);
 const ripple=.55+.45*Math.cos(5*theta+.6*t-2*Math.PI*phase)**2;
 const outward=MAX_OUTWARD*sideRear*skirtHem*wave*ripple;
 const drop=MAX_DROP*sideRear*skirtHem**2*(.35+.65*wave);
 return Object.freeze({outward,drop,photographedFrontProtected:false});
}
/**
 * Construct one exact pose sample without mutating the original garment until
 * every transformed vertex and source-provenance check passes. Reset from
 * immutable P61 fitted base on EVERY sample; time cannot accumulate warps.
 */
export function sampleSourceDressMotion36(dress,root,{phase=0}={}){
 const mesh=dress?.mesh,g=mesh?.geometry,p=g?.getAttribute('position');
 if(!mesh?.isSkinnedMesh||!root?.isObject3D||
    mesh.skeleton?.bones?.length!==163||!p?.isBufferAttribute||
    dress.stats?.sourceId!=='commons-0053'||
    dress.stats?.sourceSHA256!==DRESS_SHA||
    dress.stats?.photographedDressDrape61!==true||
    dress.stats?.originalRestPhotoCoordinatesUnchanged61!==true||
    dress.stats?.sourceTextureAndMaterialPreserved61!==true||
    dress.stats?.skinIndicesAndWeightsPreserved61!==true||
    dress.stats?.releaseAuthorized!==false||
    dress.stats?.collisionValidated!==false||
    !Number.isFinite(phase)||phase<0||phase>1)
  fail('current unapproved SHA-pinned P61 photographed 163-bone dress required');
 let state=originals.get(mesh);
 if(!state){
  state=getSource(mesh);originals.set(mesh,state);
 }
 checkProvenance(mesh,state);
 root.updateMatrixWorld(true);
 mesh.updateWorldMatrix(true,false);
 const rootBone=mesh.skeleton.bones.find(b=>b.name==='spine04');
 if(!rootBone||!rootBone.isBone||!rootBone.getWorldPosition(new THREE.Vector3()).toArray().every(Number.isFinite))
  fail('original source anatomical spine04 waist landmark required');
 const waist=rootBone.getWorldPosition(new THREE.Vector3());
 const original=state.attributes.get('position').values;
 const rest=state.attributes.get('dressRest').field;
 let hem=Infinity;
 for(let i=0;i<rest.count;i++)hem=Math.min(hem,rest.getY(i));
 if(!Number.isFinite(hem)||hem<-.5||hem>1.3||p.count<2000)
  fail('authentic full length source dress and bounded rest skirt required');
 const transition=hem+.33,inv=mesh.matrixWorld.clone().invert();
 const target=original.slice(),world=new THREE.Vector3(),moved=new THREE.Vector3();
 let moving=0,protectedFront=0,skirtVertices=0,maximum=0;
 // P61 source-fitting state already contains bodice/shoulder moves; only
 // front-protected, lower skirt positions can be altered here.
 for(let i=0;i<p.count;i++){
  const y=rest.getY(i);
  if(y>=transition)continue;
  const t=clamp((transition-y)/.33,0,1);
  world.fromArray(original,i*3).applyMatrix4(mesh.matrixWorld);
  const dx=world.x-waist.x,dz=world.z-waist.z;
  const radius=Math.hypot(dx,dz);
  if(!Number.isFinite(radius)||radius<.05)
   fail('original anatomical skirt radial position invalid');
  const theta=Math.atan2(dx,dz),delta=sourceDressSwayProfile({theta,t,phase});
  skirtVertices++;
  if(Math.cos(theta)>=.68){
   protectedFront++;
   if(delta.outward!==0||delta.drop!==0)
    fail('source photographed front RGB silhouette cannot be distorted');
  }
  if(delta.outward===0&&delta.drop===0)continue;
  moved.set(world.x+delta.outward*dx/radius,world.y-delta.drop,
   world.z+delta.outward*dz/radius).applyMatrix4(inv);
  const distance=world.distanceTo(moved.clone().applyMatrix4(mesh.matrixWorld));
  if(![moved.x,moved.y,moved.z].every(Number.isFinite)||
     distance>MAX_DISPLACEMENT+1e-7)
   fail('real original photo skirt motion beyond bounded 12mm outward envelope');
  target[i*3]=moved.x;target[i*3+1]=moved.y;target[i*3+2]=moved.z;
  moving++;maximum=Math.max(maximum,distance);
 }
 if(skirtVertices<100||protectedFront<100||moving<100||maximum<.0002)
  fail('genuine source dress lower skirt motion not evidenced');
 // Resolve normals from the staging buffer BEFORE committing new source.
 const scratch=new THREE.BufferGeometry();
 let newNormals;
 try{
  scratch.setAttribute('position',new THREE.BufferAttribute(target,3));
  if(g.index)scratch.setIndex(g.index);
  scratch.computeVertexNormals();
  newNormals=scratch.getAttribute('normal').array.slice();
  if(!newNormals.every(Number.isFinite))
   fail('photographed source cloth stage normals not finite');
 }finally{scratch.dispose();}
 // Live change intentionally occurs only after every source/skin/geometry
 // validation and the new frame has been staged. No original JPEG changed.
 p.array.set(target);p.needsUpdate=true;
 g.getAttribute('normal').array.set(newNormals);
 g.getAttribute('normal').needsUpdate=true;
 g.computeBoundingBox();g.computeBoundingSphere();
 state.last=target.slice();state.lastNormals=newNormals.slice();
 return Object.freeze({...dress,stats:Object.freeze({
  ...dress.stats,
  sourceDressMotion36:true,sourceDressMotionPhase36:phase,
  sourceDressMotionMovedVertices36:moving,
  sourceDressMotionFrontProtected36:protectedFront,
  sourceDressMotionMaxMeters36:maximum,
  sourceDressMotionOutwardOnly36:true,
  sourceDressMotionRestAndUVUnchanged36:true,
  sourceDressMotionSkinAndJPEGUnchanged36:true,
  sourceDressMotionNoAccumulation36:true,
  sourceDressMotionRealClothPhysics:false,
  sourceDressMotionSweptCollisionCertified:false,
  sourceDressMotionHumanVisualAcceptance:false,
  sourceDressMotionPhysicalPhoneVerified:false,
  releaseAuthorized:false,familyAlpha:'HOLD'
 })});
}
