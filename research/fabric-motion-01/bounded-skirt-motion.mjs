/**
 * FABRIC-MOTION-01 · research-only, source-neutral SECONDARY skirt movement.
 *
 * Not a cloth solver: no dynamic collision certification, wind physics, general
 * user photo-to-3D, or fabricated rear photograph. This operates on the actual
 * reviewed CC0 163-bone dress mesh and NEVER modifies its JPEG, UVs, rest
 * positions, skin weights, source-front vertices, neckline or bodice.
 *
 * Geometry changes are strictly bounded, temporary and reversible. The caller
 * owns the original dress's lifetime and MUST dispose this before the dress.
 */
import * as THREE from 'three';

export const MOTION01=Object.freeze({
 sourceId:'commons-0053',
 sourceSHA256:'e7a617cd23a159864f619e8397d5f37d48b684e47dddc4ad6b46b14481042019',
 maxDisplacementMeters:.018,
 springRadiansPerSecond:11,
 dampingRatio:.35,
 releaseAuthorized:false,
 dynamicCollisionCertified:false,
 physicalPhonesTested:false
});
const clamp=(x,a,b)=>Math.max(a,Math.min(b,x));
const smooth=(a,b,v)=>{const q=clamp((v-a)/(b-a),0,1);return q*q*(3-2*q);};
// Dress projects its original JPEG via protected dressRest shader coordinates, not an explicit UV attribute.
const protectedAttributes=['dressRest','skinIndex','skinWeight'];
const valid=x=>typeof x==='number'&&Number.isFinite(x);

/** Independent, fixed-step critically bounded damped spring, deterministic even on slow mobile frames. */
export function createDampedClothSpring({frequency=MOTION01.springRadiansPerSecond,damping=MOTION01.dampingRatio}={}){
 if(!valid(frequency)||frequency<=0||frequency>24||!valid(damping)||damping<.15||damping>1.5)
  throw Error('Unbounded skirt spring parameters');
 let x=0,v=0;
 return Object.freeze({
  kick(strength){if(!valid(strength)||Math.abs(strength)>1)throw Error('Bounded skirt impulse [-1,1] only');
   v=clamp(v+7*strength,-12,12);},
  step(dt){
   if(!valid(dt)||dt<0||dt>.25)throw Error('Finite bounded skirt time step required');
   let remain=dt;
   while(remain>1e-9){
    const h=Math.min(remain,1/120);
    v+=(-frequency*frequency*x-2*damping*frequency*v)*h;
    x=clamp(x+v*h,-1,1);
    remain-=h;
   }
   if(Math.abs(x)<.0001&&Math.abs(v)<.001){x=0;v=0;}
   return x;
  },
  sample(){return {displacement:x,velocity:v,settled:x===0&&v===0};},
  reset(){x=0;v=0;}
 });
}
function audit(dress,root){
 const mesh=dress?.mesh,geometry=mesh?.geometry;
 const position=geometry?.getAttribute('position'),rest=geometry?.getAttribute('dressRest');
 if(!root?.isObject3D||!mesh?.isSkinnedMesh||mesh.skeleton?.bones?.length!==163||
  dress.stats?.sourceId!==MOTION01.sourceId||
  dress.stats?.sourceSHA256!==MOTION01.sourceSHA256||
  dress.stats?.dress74ProvisionalDrape!==true||
  dress.stats?.dress74OriginalPhotoCoordinatesPreserved!==true||
  dress.stats?.dress74OriginalSkinWeightsPreserved!==true||
  dress.stats?.releaseAuthorized!==false||
  !position||position.count<2000||rest?.count!==position.count||
  protectedAttributes.some(name=>geometry.getAttribute(name)?.count!==position.count))
  throw Error('FABRIC-MOTION-01 requires genuine SHA-reviewed photographed source dress on 163 bones');
 const spine=root.getObjectByName('spine04');
 if(!spine?.isBone)throw Error('Original anatomical waist required');
 return {mesh,geometry,position,rest,spine};
}
/**
 * Select only unphotographed lower-skirt, rear/side geometry. Group coincident
 * seam vertices so duplicated original textile boundaries never separate.
 */
export function createSourceTrueSkirtMotion(dress,root){
 const {mesh,geometry:g,position:p,rest,spine}=audit(dress,root);
 const source=p.array.slice();
 const preserved=new Map(protectedAttributes.map(key=>[key,g.getAttribute(key).array.slice()]));
 root.updateMatrixWorld(true);mesh.updateWorldMatrix(true,false);
 const center=spine.getWorldPosition(new THREE.Vector3());
 const inverse=mesh.matrixWorld.clone().invert();
 let hem=Infinity;for(let i=0;i<rest.count;i++)hem=Math.min(hem,rest.getY(i));
 const transition=hem+.315;
 if(!valid(hem)||transition>1.30)throw Error('Original fitted lower skirt not measurable');
 const grouped=new Map(),pt=new THREE.Vector3();
 for(let i=0;i<p.count;i++){
  const sourceY=rest.getY(i);
  if(sourceY>=transition)continue;
  pt.fromBufferAttribute(p,i).applyMatrix4(mesh.matrixWorld);
  const key=pt.toArray().map(v=>v.toFixed(5)).join(':');
  let row=grouped.get(key);
  if(!row){row={ids:[],point:pt.clone(),sourceY,front:false};grouped.set(key,row);}
  row.ids.push(i);row.sourceY=Math.max(row.sourceY,sourceY);
  const dx=pt.x-center.x,dz=pt.z-center.z;
  const radius=Math.hypot(dx,dz);
  if(radius<.07)throw Error('Original skirt lacks clear waist-relative rear field');
  if(dz/radius>=.62)row.front=true;
 }
 const active=[];
 let photoProtectedVertices=0;
 for(const row of grouped.values()){
  const q=row.point,dx=q.x-center.x,dz=q.z-center.z,r=Math.hypot(dx,dz);
  const frontCos=dz/r;
  const mask=(1-smooth(.21,.62,frontCos))*smooth(.08,.97,(transition-row.sourceY)/(transition-hem));
  if(row.front||mask<.002){photoProtectedVertices+=row.ids.length;continue;}
  // A tangent to the genuine skirt circumference avoids driving fabric inward.
  active.push({...row,weight:mask,tangentX:dz/r,tangentZ:-dx/r,radialX:dx/r,radialZ:dz/r});
 }
 if(active.length<70||photoProtectedVertices<150)
  throw Error('Source-neutral lower skirt motion region missing; refuse arbitrary mesh');
 const spring=createDampedClothSpring();
 const moved=new THREE.Vector3(),original=new THREE.Vector3();
 let disposed=false,steps=0,maxShift=0,changedVertices=0,retainedGeometry=g;
 const assertPreserved=()=>{
  if(p.array.length!==source.length)throw Error('Motion geometry replaced unexpectedly');
  for(const [name,expected] of preserved){
   const actual=g.getAttribute(name)?.array;
   if(!actual||actual.length!==expected.length||actual.some((x,i)=>x!==expected[i]))
    throw Error('Protected original dress source/UV/skin attribute modified: '+name);
  }
 };
 const render=amplitude=>{
  if(disposed||mesh.geometry!==retainedGeometry)throw Error('Dress detached; motion revoked');
  // Use copied canonical geometry, NEVER previous animated frame (no drift).
  p.array.set(source);
  let changed=0,largest=0;
  for(const row of active){
   const sway=amplitude*row.weight;
   const tangential=.012*sway;
   const outward=.004*Math.abs(sway);
   // The displacement is tangential + outward only (not inward radial).
   const deltaX=row.tangentX*tangential+row.radialX*outward;
   const deltaZ=row.tangentZ*tangential+row.radialZ*outward;
   const deltaY=-.0018*Math.abs(sway);
   const norm=Math.hypot(deltaX,deltaY,deltaZ);
   if(norm>MOTION01.maxDisplacementMeters+1e-7||!valid(norm))
    throw Error('Cloth displacement exceeded reviewed bounded limit');
   if(norm<=1e-6)continue;
   original.copy(row.point);
   moved.set(original.x+deltaX,original.y+deltaY,original.z+deltaZ).applyMatrix4(inverse);
   for(const id of row.ids){p.setXYZ(id,moved.x,moved.y,moved.z);changed++;}
   largest=Math.max(largest,norm);
  }
  p.needsUpdate=true;g.computeBoundingBox();g.computeBoundingSphere();
  maxShift=Math.max(maxShift,largest);changedVertices=changed;steps++;
  return {changedVertices:changed,maxFrameShiftMeters:largest,amplitude,
   originalPhotographUnchanged:true,frontAndBodiceProtected:true,
   collisionCertified:false,releaseAuthorized:false};
 };
 return Object.freeze({
  kick(strength){if(disposed)throw Error('Detached motion');spring.kick(strength);},
  step(dt){if(disposed)throw Error('Detached motion');const a=spring.step(dt);return render(a);},
  reset(){if(disposed)return;spring.reset();render(0);assertPreserved();},
  state(){return {...spring.sample(),steps,changedVertices,maxShiftMeters:maxShift,
    protectedVertexCount:photoProtectedVertices,activeSeamGroups:active.length,
    originalSourceAndUVProtected:true,continuousCollisionCertified:false,
    realPhoneVerified:false,releaseAuthorized:false};},
  dispose(){if(disposed)return;spring.reset();render(0);assertPreserved();disposed=true;}
 });
}
