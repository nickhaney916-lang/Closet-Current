/**
 * DRESS-FIT-05: static gravity/rest fitting of the ORIGINAL source-photographed
 * dress on an existing real 163-bone mannequin. Research-only.
 *
 * The spring supplies a small, nonzero rest target; it is NOT decorative
 * playback and is not a physically complete cloth solver. Only the actually
 * skinned lower-side and rear skirt is eased; original photographed front,
 * neckline, bodice, dressRest projection, skin attributes, and JPEG stay put.
 * Caller MUST run true posed triangle-body BVH before accepting the freeze.
 */
import * as THREE from 'three';
export const DRESS_FIT05=Object.freeze({
 sourceSHA256:'e7a617cd23a159864f619e8397d5f37d48b684e47dddc4ad6b46b14481042019',
 maxMeters:.0095,targetMeters:.0065,maxSteps:100,stableSteps:6,
 positionTolerance:.00002,velocityTolerance:.000012,
 fixedStepSeconds:1/60,releaseAuthorized:false,physicalPhonesTested:false
});
const valid=x=>typeof x==='number'&&Number.isFinite(x);
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
function smooth(a,b,v){const t=clamp((v-a)/(b-a),0,1);return t*t*(3-2*t);}
export function convergeDressRest05({targetMeters=DRESS_FIT05.targetMeters}={}){
 if(!valid(targetMeters)||targetMeters<.002||targetMeters>DRESS_FIT05.maxMeters)
  throw Error('Photographed dress rest target must be finite, bounded, nonzero');
 let position=0,velocity=0,stable=0,steps=0;
 for(let i=0;i<DRESS_FIT05.maxSteps;i++){
  velocity=.73*velocity+.15*(targetMeters-position);
  position=clamp(position+velocity,-DRESS_FIT05.maxMeters,DRESS_FIT05.maxMeters);
  steps++;
  if(Math.abs(velocity)<=DRESS_FIT05.velocityTolerance&&
     Math.abs(position-targetMeters)<=DRESS_FIT05.positionTolerance)stable++;
  else stable=0;
  if(stable>=DRESS_FIT05.stableSteps)break;
 }
 if(stable<DRESS_FIT05.stableSteps)
  throw Error('Photographed dress did not reach stable nonzero gravity rest');
 return Object.freeze({restMeters:position,steps,stableSteps:stable,
  gravityRelaxationTimeSeconds:steps*DRESS_FIT05.fixedStepSeconds,
  isNonzeroStaticRest:true,releaseAuthorized:false});
}
export function createPhotographedDressStaticFit05(dress,root){
 const mesh=dress?.mesh,g=mesh?.geometry,p=g?.getAttribute('position'),
  rest=g?.getAttribute('dressRest');
 const preserved=['dressRest','skinIndex','skinWeight'];
 if(!root?.isObject3D||!mesh?.isSkinnedMesh||
  mesh.skeleton?.bones?.length!==163||
  dress?.stats?.sourceSHA256!==DRESS_FIT05.sourceSHA256||
  dress?.stats?.sourceId!=='commons-0053'||
  dress?.stats?.dress74OriginalPhotoCoordinatesPreserved!==true||
  dress?.stats?.dress74OriginalSkinWeightsPreserved!==true||
  dress?.stats?.releaseAuthorized!==false||
  !g.index||!p||p.count<2000||rest?.count!==p.count||
  preserved.some(key=>g.getAttribute(key)?.count!==p.count))
  throw Error('Original SHA-verified photographed skinned 163-bone dress required');
 const orig=Float32Array.from(p.array),normal=g.getAttribute('normal');
 const baseNormals=normal?Float32Array.from(normal.array):null;
 const originalFields=new Map(preserved.map(key=>[key,Float32Array.from(g.getAttribute(key).array)]));
 const body=root.getObjectByName('spine04');
 if(!body?.isBone)throw Error('Original anatomical waist bone required');
 root.updateMatrixWorld(true);mesh.updateWorldMatrix(true,false);
 const center=body.getWorldPosition(new THREE.Vector3());
 const inverse=mesh.matrixWorld.clone().invert();
 let hem=Infinity;
 for(let i=0;i<rest.count;i++)hem=Math.min(hem,rest.getY(i));
 const transition=hem+.315;
 if(!valid(hem)||transition>1.30)throw Error('Measured original lower dress hem invalid');
 const groups=new Map(),q=new THREE.Vector3();
 for(let i=0;i<p.count;i++){
  if(rest.getY(i)>=transition)continue;
  q.fromBufferAttribute(p,i).applyMatrix4(mesh.matrixWorld);
  const key=q.toArray().map(x=>x.toFixed(5)).join(':');
  if(!groups.has(key))groups.set(key,{ids:[],q:q.clone(),sourceY:rest.getY(i),front:false});
  const row=groups.get(key);
  row.ids.push(i);row.sourceY=Math.max(row.sourceY,rest.getY(i));
  const radial=new THREE.Vector2(q.x-center.x,q.z-center.z);
  if(radial.length()<.07)throw Error('Photographed skirt side/rear radius absent');
  if(radial.y/radial.length()>=.62)row.front=true;
 }
 const editable=[],protectedIds=new Set();
 for(const row of groups.values()){
  const dx=row.q.x-center.x,dz=row.q.z-center.z,r=Math.hypot(dx,dz),
   cosine=dz/r,lower=clamp((transition-row.sourceY)/(transition-hem),0,1);
  const mask=(1-smooth(.18,.62,cosine))*smooth(.12,.93,lower);
  if(row.front||mask<.002){row.ids.forEach(i=>protectedIds.add(i));continue;}
  editable.push({...row,mask,dx:dx/r,dz:dz/r});
 }
 if(editable.length<70||protectedIds.size<150)
  throw Error('Protected original dress front or distinct skirt rear missing');
 let frozen=false,closed=false,proof=null;
 function originalAudit(){
  if(mesh.geometry!==g||closed)throw Error('Original dress fit no longer attached');
  for(const [key,old] of originalFields){
   const a=g.getAttribute(key)?.array;
   if(!a||a.length!==old.length||old.some((x,i)=>x!==a[i]))
    throw Error('Original dress source-photo projected coordinates or skin modified: '+key);
  }
  for(const i of protectedIds)
   if(p.getX(i)!==orig[3*i]||p.getY(i)!==orig[3*i+1]||
      p.getZ(i)!==orig[3*i+2])
    throw Error('Original photographed front/bodice skirt changed');
 }
 function restore(){
  if(closed)return;
  p.array.set(orig);p.needsUpdate=true;
  if(normal&&baseNormals){normal.array.set(baseNormals);normal.needsUpdate=true;}
  g.computeBoundingBox();g.computeBoundingSphere();
  frozen=false;proof=null;originalAudit();
 }
 function freeze(){
  if(closed)throw Error('Original photographed dress source detached');
  restore();
  const equil=convergeDressRest05();
  let moved=0,maxMeters=0,down=0,out=0;
  const position=new THREE.Vector3();
  for(const row of editable){
   const dy=-equil.restMeters*.45*row.mask;
   const radial=equil.restMeters*.8*row.mask;
   const dx=radial*row.dx,dz=radial*row.dz;
   const meters=Math.hypot(dx,dy,dz);
   if(!valid(meters)||meters>DRESS_FIT05.maxMeters)
    throw Error('Static source-photo skirt rest motion exceeded displacement limit');
   if(meters<.00001)continue;
   position.set(row.q.x+dx,row.q.y+dy,row.q.z+dz).applyMatrix4(inverse);
   for(const i of row.ids){p.setXYZ(i,position.x,position.y,position.z);moved++;}
   maxMeters=Math.max(meters,maxMeters);down+=Math.abs(dy);out+=radial;
  }
  p.needsUpdate=true;g.computeVertexNormals();g.computeBoundingBox();g.computeBoundingSphere();
  originalAudit();
  if(moved<70||maxMeters<.0025||maxMeters>DRESS_FIT05.maxMeters||out<=0||down<=0)
   throw Error('Photographed dress did not achieve meaningful side/rear static drape');
  frozen=true;
  proof=Object.freeze({actualOriginalSourceDressStaticFit:true,
   licensedOriginalPhotographSHA256:DRESS_FIT05.sourceSHA256,
   originalPhotoFrontUntouched:true,sourceRestAndSkinPreserved:true,
   original163BoneMannequin:true,changedVertices:moved,
   maxWorldDisplacementMeters:maxMeters,gravitySpring:equil,
   originalJPEGAndProjectionUnchanged:true,stillGarmentAfterFit:true,
   collisionVerified:false,physicalPhoneVerified:false,
   independentVisualAcceptance:false,releaseAuthorized:false});
  return proof;
 }
 return Object.freeze({freeze,restore,state:()=>({frozen,proof}),
  dispose(){if(closed)return;restore();closed=true;}});
}
