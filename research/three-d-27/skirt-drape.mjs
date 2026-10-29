/**
 * 3D-27 / Research HOLD: subtle side-and-rear hem ripple over the EXISTING
 * anatomically fitted and photographed dress mesh.
 *
 * No image edits, replacement textures, fabricated rear photo, new clothing
 * pipeline or closed armholes. This is only a source-neutral silhouette change
 * to side/back skirt positions of the original skinned geometry.
 */
import * as THREE from 'three';
export const SKIRT_DRAPE=Object.freeze({
 maxOutwardMeters:.018,
 folds:7,
 hemInfluenceStart:.16,
 hemInfluenceFull:.82,
 frontUntouchedCos:.68,
 releaseAuthorized:false,
 collisionValidated:false,
 humanVisualApproval:false
});
const clamp=(v,a=0,b=1)=>Math.min(b,Math.max(a,v));
const smooth=(a,b,x)=>{const t=clamp((x-a)/(b-a));return t*t*(3-2*t);};
/** A small, nonnegative outward displacement; never shrink skirt into legs. */
export function outwardDrapeAtRest({x,y,z,centerX=0,centerZ=0,waistY,hemY}={}){
 const all=[x,y,z,centerX,centerZ,waistY,hemY];
 if(all.some(v=>!Number.isFinite(v))||waistY-hemY<.30||waistY-hemY>1.5)
  throw Error('Anatomic skirt radius, waist and hem required');
 if(y>=waistY||y<hemY-.02)return 0;
 const theta=Math.atan2(x-centerX,z-centerZ),front=Math.cos(theta);
 const lateral=1-smooth(.30,SKIRT_DRAPE.frontUntouchedCos,front);
 if(lateral<=1e-9)return 0;
 const t=(waistY-y)/(waistY-hemY),height=smooth(
  SKIRT_DRAPE.hemInfluenceStart,SKIRT_DRAPE.hemInfluenceFull,t);
 const fold=(1+Math.cos(SKIRT_DRAPE.folds*theta+.35*t))/2;
 return SKIRT_DRAPE.maxOutwardMeters*lateral*height*(.22+.78*fold);
}
export function softenAnatomicalSkirt(dress,root,{enabled=true}={}){
 if(enabled===false)return dress;
 if(enabled!==true||!dress?.mesh?.isSkinnedMesh||
  dress.stats?.sourceId!=='commons-0053'||
  dress.stats.anatomicalDress!==true||dress.stats.actualOpenArmholes!==true||
  dress.stats.releaseAuthorized!==false||dress.stats.collisionValidated!==false||
  !root?.isObject3D)throw Error('Only exact unapproved source-bound anatomical dress permitted');
 const mesh=dress.mesh,geo=mesh.geometry,p=geo.getAttribute('position'),
  rest=geo.getAttribute('dressRest'),skin=geo.getAttribute('skinWeight');
 if(!p||!rest||!skin||p.count!==rest.count||p.count!==skin.count||
  p.count<2000)throw Error('Original skinned garment source attributes missing');
 root.updateMatrixWorld(true);mesh.updateWorldMatrix(true,false);
 const waist=root.getObjectByName('spine04');
 if(!waist?.isBone)throw Error('Original body waist skeleton unavailable');
 const center=waist.getWorldPosition(new THREE.Vector3());
 const world=new THREE.Vector3(),inv=mesh.matrixWorld.clone().invert();
 let hemY=Infinity;
 for(let i=0;i<p.count;i++){
  world.fromBufferAttribute(p,i).applyMatrix4(mesh.matrixWorld);
  hemY=Math.min(hemY,world.y);
 }
 if(!Number.isFinite(hemY)||center.y-hemY<.30||
  center.y-hemY>1.5)throw Error('Unsafe source dress skirt extent');
 let changed=0,max=0,frontPreserved=0;
 // Validate before mutating, since any failure must preserve atomic outfit rollback.
 const edits=[];
 for(let i=0;i<p.count;i++){
  world.fromBufferAttribute(p,i).applyMatrix4(mesh.matrixWorld);
  const angleCos=(world.z-center.z)/(Math.hypot(world.x-center.x,world.z-center.z)||1);
  const move=outwardDrapeAtRest({
   x:world.x,y:world.y,z:world.z,centerX:center.x,centerZ:center.z,
   waistY:center.y,hemY
  });
  if(angleCos>=SKIRT_DRAPE.frontUntouchedCos)frontPreserved++;
  if(move<=1e-6)continue;
  const r=Math.hypot(world.x-center.x,world.z-center.z);
  if(r<.03)throw Error('Skirt fold would displace through mannequin axis');
  const x=world.x+move*(world.x-center.x)/r;
  const z=world.z+move*(world.z-center.z)/r;
  const local=new THREE.Vector3(x,world.y,z).applyMatrix4(inv);
  if(![local.x,local.y,local.z].every(Number.isFinite))
   throw Error('Skirt ripple yielded nonfinite position');
  edits.push({i,local,move});
 }
 if(edits.length<150||frontPreserved<100||edits.length>=p.count*.75)
  throw Error('Skirt side-only bounded changes failed safety constraints');
 for(const edit of edits){
  p.setXYZ(edit.i,edit.local.x,edit.local.y,edit.local.z);
  changed++;max=Math.max(max,edit.move);
 }
 p.needsUpdate=true;geo.computeVertexNormals();
 geo.computeBoundingBox();geo.computeBoundingSphere();
 return {...dress,stats:{...dress.stats,
  skirtDrapeApplied:true,
  skirtDrapeMethod:'bounded-lateral-hem-original-skinned-mesh',
  skirtDrapeChangedVertices:changed,skirtDrapeMaxOutward:max,
  originalPhotoCoordinatesUnchanged:false,
  originalPhotoMappingPreserved:true,
  originalRGBUnchanged:true,
  frontCenterUnchanged:true,
  shoulderAndArmholesUnchanged:true,
  originalSourceVerified:true,
  collisionValidated:false,
  humanVisualApproval:false,
  releaseAuthorized:false}};
}
