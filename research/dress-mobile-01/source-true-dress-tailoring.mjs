/**
 * CC-PAR-03 — source-preserving PROVISIONAL skirt tailoring on the actual
 * anatomical photographed dress. Exact Commons 0053 ONLY.
 *
 * No new texture, invented fabric pattern, rear photo, skeleton, rig, shader,
 * collision solver or output for generic user wardrobe photos. Default OFF.
 * Enhances side/back lower skirt silhouette; leaves photographed center-front,
 * upper fitted bodice, neckline, armholes, and photo-space coordinates intact.
 *
 * Intentional limit: source-neutral geometric relief is not physically simulated
 * cloth. Human review and physical-phone acceptance remain HOLD.
 */
import * as T from 'three';

export const DRESS74_POLICY=Object.freeze({
 maxOutwardMeters:.021,
 maxHemDropMeters:.004,
 maxGarmentMovementMeters:.022,
 foldCount:9,
 frontProtectedCos:.62,
 sourceId:'commons-0053',
 releaseAuthorized:false,
 collisionValidated:false,
 humanVisualApproval:false
});
const clamp=(v,a=0,b=1)=>Math.max(a,Math.min(b,v));
const smooth=(a,b,x)=>{const t=clamp((x-a)/(b-a));return t*t*(3-2*t);};

/** Deterministic geometry-only source-neutral folds, no invented textile detail. */
export function dress74Fold({theta,sourceY,sourceHemY,transitionY}){
 if(![theta,sourceY,sourceHemY,transitionY].every(Number.isFinite)||
     transitionY-sourceHemY<.20||transitionY-sourceHemY>.7)throw Error('Finite licensed lower dress geometry required');
 if(sourceY>=transitionY||sourceY<sourceHemY-.02)return {radial:0,drop:0};
 const t=clamp((transitionY-sourceY)/(transitionY-sourceHemY));
 const rearMask=1-smooth(.23,DRESS74_POLICY.frontProtectedCos,Math.cos(theta));
 const drape=smooth(.07,.96,t);
 if(rearMask<=1e-8||drape<=1e-8)return {radial:0,drop:0};
 // Asymmetric, gently widening pleats: a constant-radius A-line is not cloth.
 // Radial movement is outward-only, avoiding intentional new body intersection.
 const angular=.5+.5*Math.cos(DRESS74_POLICY.foldCount*theta+.65*t+.19*Math.sin(3*theta));
 const wave=.10+.90*Math.pow(angular,1.7);
 const asymmetry=.80+.20*Math.sin(2*theta+1.1)**2;
 const radial=DRESS74_POLICY.maxOutwardMeters*rearMask*drape*wave*asymmetry;
 const drop=DRESS74_POLICY.maxHemDropMeters*rearMask*Math.pow(t,3)*
    (.3+.7*(.5+.5*Math.sin(7*theta+.3)));
 return {radial,drop};
}

export function tailorSourceDress74(dress,root,{enabled=true}={}){
 if(enabled===false)return dress;
 if(enabled!==true||!dress?.mesh?.isSkinnedMesh||
    dress.stats?.sourceId!==DRESS74_POLICY.sourceId||
    dress.stats?.anatomicalDress!==true||
    dress.stats?.actualOpenArmholes!==true||
    dress.stats?.skirtDrapeApplied!==true||
    dress.stats?.releaseAuthorized!==false||
    dress.stats?.collisionValidated!==false||
    !root?.isObject3D)throw Error('Only source-verified unapproved anatomical dress with base drape is eligible');
 const mesh=dress.mesh,g=mesh.geometry,p=g.getAttribute('position'),
  rest=g.getAttribute('dressRest'),indices=g.getAttribute('skinIndex'),
  weights=g.getAttribute('skinWeight'),normals=g.getAttribute('normal');
 if(!p||!rest||!indices||!weights||!normals||
    p.count!==rest.count||p.count!==indices.count||
    p.count!==weights.count||p.count!==normals.count||p.count<2000)
   throw Error('Original photographed dress fitted source and skin buffers required');
 const waistBone=root.getObjectByName('spine04');
 if(!waistBone?.isBone)throw Error('Anatomical waist bone unavailable');
 root.updateMatrixWorld(true);mesh.updateWorldMatrix(true,false);
 const center=waistBone.getWorldPosition(new T.Vector3());
 let hem=Infinity;for(let i=0;i<rest.count;i++)hem=Math.min(hem,rest.getY(i));
 const transition=hem+.315;
 if(!Number.isFinite(hem)||transition>1.30)throw Error('Protected photographic bodice extent cannot be isolated');
 const inverse=mesh.matrixWorld.clone().invert();
 const v=new T.Vector3(),edits=[];let max=0,frontProtected=0;
 // Collect and validate ALL changes before touching any geometry.
 for(let i=0;i<p.count;i++){
  const sourceY=rest.getY(i);
  if(sourceY>=transition-1e-7)continue;
  v.fromBufferAttribute(p,i).applyMatrix4(mesh.matrixWorld);
  const dx=v.x-center.x,dz=v.z-center.z,r=Math.hypot(dx,dz);
  if(!Number.isFinite(r)||r<.07)throw Error('Skirt source width unsuitable for natural cloth fold');
  const theta=Math.atan2(dx,dz),fold=dress74Fold({theta,sourceY,sourceHemY:hem,transitionY:transition});
  if(Math.cos(theta)>=DRESS74_POLICY.frontProtectedCos)frontProtected++;
  if(fold.radial<1e-7&&fold.drop<1e-7)continue;
  const moved=new T.Vector3(v.x+fold.radial*dx/r,v.y-fold.drop,v.z+fold.radial*dz/r);
  const d=moved.distanceTo(v);
  if(d>DRESS74_POLICY.maxGarmentMovementMeters||!Number.isFinite(d))
   throw Error('Unbounded or nonfinite source-neutral dress deformation');
  moved.applyMatrix4(inverse);
  if(![moved.x,moved.y,moved.z].every(Number.isFinite))throw Error('Bad fitted source-space position');
  edits.push([i,moved]);max=Math.max(max,d);
 }
 if(edits.length<100||edits.length>p.count*.70||frontProtected<100||max<.002)
  throw Error('Dress folding attempted outside protected lower-skirt scope');
 for(const [i,v] of edits)p.setXYZ(i,v.x,v.y,v.z);
 p.needsUpdate=true;
 // Keep the already reviewed normals byte-identical: global normal refresh
 // creates a known source chest-band shading regression (PR 3D-27).
 // The original dressRest, skin buffers, JPEG/PNG source, texture mapping,
 // neckline and open armholes are NEVER modified by this decorator.
 g.computeBoundingBox();g.computeBoundingSphere();
 return {...dress,stats:{...dress.stats,
  dress74ProvisionalDrape:true,dress74ChangedVertices:edits.length,
  dress74MaxMovementMeters:max,dress74TransitionSourceY:transition,
  dress74FrontProtectedVertices:frontProtected,
  dress74OriginalPhotoCoordinatesPreserved:true,
  dress74OriginalNormalsPreserved:true,
  dress74SourcePhotographUnchanged:true,
  dress74OriginalSkinWeightsPreserved:true,
  dress74NeckShoulderArmholeUntouched:true,
  dress74BackMaterial:'unphotographed-source-neutral',
  dress74SourceBinding:'pinned-commons-0053-original-byte-SHA-and-RGB',
  fabricPhysicsSimulated:false,continuousCollisionVerified:false,
  physicalPhonesAccepted:false,humanVisualApproval:false,releaseAuthorized:false}};
}
