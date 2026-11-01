/**
 * FOLDS-03: true pose-conditioned soft hem creases on the actual approved
 * photographed, independently skinned dress. Additional SOURCE-NEUTRAL
 * lower/rear shape, never altering photographed frontal shader projection,
 * licensed JPEG, original dressRest / skinIndex / skinWeight or anatomy.
 *
 * This is visual kinematic draping, NOT a general cloth solver. It requires a
 * NEW canonical spring frame before EACH application, tracked through spring
 * step counters to avoid accumulation and drift. Restoring canonical spring
 * removes ALL pleats exactly. Real BVH body/dress contacts are checked by CI.
 */
import * as T from 'three';
export const PLEATS03=Object.freeze({
 sourceId:'commons-0053',
 sourceSHA256:'e7a617cd23a159864f619e8397d5f37d48b684e47dddc4ad6b46b14481042019',
 maxDisplacementMeters:.0108,photoFrontUntouched:true,defaultEnabled:false,
 releaseAuthorized:false,sweptCollisionCertified:false,
 physicalPhoneTested:false,humanPhotorealismApproved:false
});
const finite=v=>typeof v==='number'&&Number.isFinite(v);
const clamp=(x,a,b)=>Math.max(a,Math.min(b,x));
const smooth=(a,b,x)=>{const t=clamp((x-a)/(b-a),0,1);return t*t*(3-2*t);};
const FIELDS=['dressRest','skinIndex','skinWeight'];
export function fold03Signal(phase,theta,lower){
 if(!finite(phase)||phase<0||phase>1||!finite(theta)||!finite(lower)||lower<0||lower>1)
  throw Error('Finite source anatomical phase/angle/lower-skirt fractions required');
 const gait=Math.sin(2*Math.PI*phase);
 // Alternating shallow radiating creases, strongest on skirt lower half.
 // One side of pleat bellows moves outward; no unphysical inward squeeze.
 const bias=.32*gait;
 const wave=.5-.5*Math.cos(5*theta+4.5*lower+bias);
 return {radial:wave*Math.abs(gait),vertical:wave*Math.abs(gait),
   tangential:Math.sin(5*theta+4.5*lower+bias)*gait};
}
export function createSourceNeutralPosePleats03(dress,root,spring){
 const mesh=dress?.mesh,g=mesh?.geometry,p=g?.getAttribute('position'),
  rest=g?.getAttribute('dressRest'),skeleton=mesh?.skeleton;
 if(!root?.isObject3D||!mesh?.isSkinnedMesh||skeleton?.bones?.length!==163||
   !spring||typeof spring.state!=='function'||
   dress.stats?.sourceId!==PLEATS03.sourceId||
   dress.stats?.sourceSHA256!==PLEATS03.sourceSHA256||
   dress.stats?.dress74ProvisionalDrape!==true||
   dress.stats?.dress74OriginalPhotoCoordinatesPreserved!==true||
   dress.stats?.dress74OriginalSkinWeightsPreserved!==true||
   dress.stats?.releaseAuthorized!==false||!p||p.count<2000||
   rest?.count!==p.count||
   FIELDS.some(key=>g.getAttribute(key)?.count!==p.count))
  throw Error('FOLDS-03 requires exact original-SHA source-dress/skinned original 163 bones and approved spring');
 const preserved=new Map(FIELDS.map(key=>[key,g.getAttribute(key).array.slice()]));
 const source=p.array.slice(),centerBone=root.getObjectByName('spine04');
 if(!centerBone?.isBone)throw Error('Original source anatomical waist bone missing');
 root.updateMatrixWorld(true);mesh.updateWorldMatrix(true,false);
 const center=centerBone.getWorldPosition(new T.Vector3());
 const inv=mesh.matrixWorld.clone().invert();
 const groups=new Map(),point=new T.Vector3();
 let hem=Infinity;
 for(let i=0;i<rest.count;i++)hem=Math.min(hem,rest.getY(i));
 const transition=hem+.315;
 if(!finite(hem)||transition>1.30)throw Error('Invalid original skirt hem');
 for(let i=0;i<p.count;i++){
  const y=rest.getY(i);if(y>=transition)continue;
  point.fromBufferAttribute(p,i).applyMatrix4(mesh.matrixWorld);
  const key=point.toArray().map(v=>v.toFixed(5)).join(':');
  let row=groups.get(key);if(!row){row={ids:[],point:point.clone(),y,front:false};groups.set(key,row);}
  row.ids.push(i);row.y=Math.max(row.y,y);
  const dx=point.x-center.x,dz=point.z-center.z,r=Math.hypot(dx,dz);
  if(r<.07)throw Error('Original photographed skirt has no distinct waist radius');
  if(dz/r>=.62)row.front=true;
 }
 const active=[],frontProtected=new Set();
 for(const row of groups.values()){
  const dx=row.point.x-center.x,dz=row.point.z-center.z,r=Math.hypot(dx,dz);
  const c=dz/r,lower=clamp((transition-row.y)/(transition-hem),0,1);
  const mask=(1-smooth(.05,.62,c))*smooth(.15,.97,lower);
  if(row.front||mask<.003){row.ids.forEach(i=>frontProtected.add(i));continue;}
  active.push({...row,mask,theta:Math.atan2(dx,dz),lower,
   nx:dx/r,nz:dz/r,tx:dz/r,tz:-dx/r});
 }
 if(active.length<70||frontProtected.size<150)
  throw Error('Original lower skirt rear/side pleat groups or protected photo fronts unavailable');
 const canonicalFront=[...frontProtected].map(i=>[i,source[3*i],source[3*i+1],source[3*i+2]]);
 const world=new T.Vector3();
 let disposed=false,samples=0,lastStep=0,maxShift=0,activeVertices=0,lastPhase=null,lastShift=0;
 function auditProtected(){
  for(const [key,expected] of preserved){
   const actual=g.getAttribute(key)?.array;
   if(!actual||actual.length!==expected.length||actual.some((x,i)=>x!==expected[i]))
    throw Error('Source licensed garment/rest/skin bytes modified: '+key);
  }
  for(const [i,x,y,z] of canonicalFront)
   if(p.getX(i)!==x||p.getY(i)!==y||p.getZ(i)!==z)
    throw Error('Original photo front side vertex changed during source-neutral folding');
 }
 return Object.freeze({
  apply(phase){
   if(disposed||mesh.geometry!==g)throw Error('Source garment detached');
   const step=spring.state().steps;
   if(!Number.isSafeInteger(step)||step<=lastStep)
    throw Error('A NEW canonical spring geometry frame is required before each pose-fold application');
   if(!finite(phase)||phase<0||phase>1)throw Error('Finite source walking phase required');
   auditProtected(); // protected source arrays must be byte-identical before use
   let moved=0,max=0;
   for(const row of active){
    const sig=fold03Signal(phase,row.theta,row.lower);
    const radial=.010*sig.radial*row.mask,
     sideways=.0018*sig.tangential*row.mask,
     gravity=-.0018*sig.vertical*row.mask;
    const dx=row.nx*radial+row.tx*sideways,
     dz=row.nz*radial+row.tz*sideways;
    const magnitude=Math.hypot(dx,dz,gravity);
    if(!finite(magnitude)||magnitude>PLEATS03.maxDisplacementMeters)
     throw Error('Source-neutral true cloth fold moved outside audited length');
    if(magnitude<=1e-7)continue;
    for(const i of row.ids){
     world.fromBufferAttribute(p,i).applyMatrix4(mesh.matrixWorld);
     world.add(new T.Vector3(dx,gravity,dz)).applyMatrix4(inv);
     p.setXYZ(i,world.x,world.y,world.z);moved++;
    }
    max=Math.max(max,magnitude);
   }
   p.needsUpdate=true;g.computeBoundingSphere();g.computeBoundingBox();
   auditProtected();samples++;activeVertices=moved;
   maxShift=Math.max(maxShift,max);lastShift=max;lastStep=step;lastPhase=phase;
   return {phase,changedVertices:moved,worldMaxShiftMeters:max,
    originalPhotographedDressTrue:true,sourcePhotoFrontUntouched:true,
    bodyDrivenGaitPhase:true,actualPhysicalClothSolver:false,releaseAuthorized:false};
  },
  state(){return {samples,changedVertices:activeVertices,worldLastShiftMeters:lastShift,
   worldMaxShiftMeters:maxShift,activeSeamGroups:active.length,
   protectedFrontVertices:frontProtected.size,lastPhase,
   originalPhotographAndSkinBytesProtected:true,collisionCertified:false,
   physicalPhonesTested:false,releaseAuthorized:false};},
  reset(){if(disposed)return;
   // The caller must first restore canonical original spring geometry.
   if(spring.state().displacement!==0||!spring.state().settled)
    throw Error('Original spring must restore source geometry before resetting pose folds');
   lastStep=0;lastPhase=null;lastShift=0;activeVertices=0;auditProtected();
  },
  dispose(){if(disposed)return;disposed=true;}
 });
}
