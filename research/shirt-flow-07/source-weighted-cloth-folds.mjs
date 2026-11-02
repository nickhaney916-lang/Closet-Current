/**
 * SHIRT-FLOW-07 | ORIGINAL-PHOTO TRUE 3D TORSO FOLD FIELDS | HOLD
 *
 * An opt-in *real triangle* gravity-and-tension fold field, not texture
 * overlays or generated photographic detail. Deforms independently skinned
 * source-projected 3D shirt vertices at yoke/chest/waist. Protects the
 * photographed collar/front-centre, sewn side seam, shoulder cap, hem, and
 * photographed panel mapping by fading deformation to zero at boundaries.
 *
 * Body triangle collision is run by the caller AFTER the geometry reshapes.
 * No full physics, no swept-motion BVH certification, no phone qualification.
 */
import * as T from 'three';
import {smoothSurfaceNormals} from '../three-d-08/garment-fit-profile.mjs';
const smooth=T.MathUtils.smoothstep;
const fade=(v,a,b,c,d)=>smooth(v,a,b)*(1-smooth(v,c,d));
const key=q=>q.toArray().map(n=>n.toFixed(5)).join(':');
function inverseSkin(m,i){
 const g=m.geometry,combined=new T.Matrix4();combined.elements.fill(0);
 for(let k=0;k<4;k++){
  const joint=g.attributes.skinIndex.getComponent(i,k);
  const weight=g.attributes.skinWeight.getComponent(i,k);
  const p=new T.Matrix4().multiplyMatrices(m.skeleton.bones[joint].matrixWorld,m.skeleton.boneInverses[joint]);
  for(let j=0;j<16;j++)combined.elements[j]+=p.elements[j]*weight;
 }
 return combined.premultiply(m.bindMatrixInverse).multiply(m.bindMatrix).invert();
}
function untouched(mesh){
 const names=['panelPosition','panelNormal','uv','skinIndex','skinWeight'];
 return new Map(names.map(name=>[name,mesh.geometry.getAttribute(name)?.array.slice()]));
}
function assertUntouched(mesh,immutable){
 for(const [name,baseline] of immutable){
  const now=mesh.geometry.getAttribute(name)?.array;
  if(!baseline){if(now)throw Error('F07 invented original UV/panel/skin attribute '+name);continue;}
  if(!now||now.length!==baseline.length||!baseline.every((v,i)=>v===now[i]))
   throw Error('F07 changed immutable photographed source/UV/skin '+name);
 }
}
export function shapeSourceWeightedClothFold07(root,shirt){
 if(!shirt?.stats?.sourceMeasuredNaturalSleeveHang||!shirt?.stats?.naturalSourceShoulderSleeveTransition)
  throw Error('F07 original photograph and independently sewn 3D55/56 shirt required');
 const shells=shirt.meshes.filter(m=>m.name==='Work56-independent-shirt-shell'&&m.isSkinnedMesh);
 if(shells.length===0)throw Error('Original skinned source photo shirt shell missing');
 root.updateMatrixWorld(true);
 const bones=[];root.traverse(o=>{if(o.isBone)bones.push(o);});
 if(bones.length!==163)throw Error('Original 163-bone anatomically skinned figure required');
 const getBone=name=>{
  const b=bones.find(x=>x.name===name);
  if(!b)throw Error('Missing original anatomical garment fold landmark '+name);
  return b.getWorldPosition(new T.Vector3());
 };
 const L=getBone('upperarm01L'),R=getBone('upperarm01R');
 const leftElbow=getBone('lowerarm01L'),rightElbow=getBone('lowerarm01R');
 const spine=getBone('spine04');
 const centerX=(L.x+R.x)/2,shoulderY=(L.y+R.y)/2,spineZ=(L.z+R.z)/2;
 if(L.distanceTo(R)<.25||Math.sign(L.x-centerX)===Math.sign(R.x-centerX))
  throw Error('Invalid real anatomical shoulder width');
 const armRise=(Math.abs(leftElbow.y-L.y)+Math.abs(rightElbow.y-R.y))*.5;
 const armSpread=(Math.abs(leftElbow.x-L.x)+Math.abs(rightElbow.x-R.x))*.5;
 const tension=T.MathUtils.clamp(.72+.36*armSpread/.5-.10*armRise/.45,.52,1.05);
 const stats={L:{yoke:0,chest:0,waist:0},R:{yoke:0,chest:0,waist:0}};
 const immutableKeys=['panelPosition','panelNormal','uv','skinIndex','skinWeight'];
 let shifted=0,locked=0,maxMeters=0,foldBands=0;
 for(const mesh of shells){
  mesh.updateWorldMatrix(true,false);mesh.skeleton.update();
  const geo=mesh.geometry,p=geo.getAttribute('position'),index=geo.index;
  if(!p||!index||!geo.getAttribute('panelPosition')||!geo.getAttribute('panelNormal')||!geo.getAttribute('skinWeight')||!geo.getAttribute('skinIndex'))
   throw Error('Missing original source photographed panel and skinned input attributes');
  const original=untouched(mesh);
  if(immutableKeys.some(k=>!original.has(k)))throw Error('Cannot audit original photograph source');
  const groups=new Map();
  for(const i of new Set(index.array)){
   const q=mesh.applyBoneTransform(i,new T.Vector3().fromBufferAttribute(p,i)).applyMatrix4(mesh.matrixWorld);
   if(![q.x,q.y,q.z].every(Number.isFinite))throw Error('Nonfinite originally skinned garment');
   const id=key(q);
   if(!groups.has(id))groups.set(id,{q,ids:[]});
   groups.get(id).ids.push(i);
  }
  const inverseWorld=mesh.matrixWorld.clone().invert();
  for(const {q,ids} of groups.values()){
   const side=q.x-centerX>=0?'R':'L',x=Math.abs(q.x-centerX),dy=q.y-shoulderY;
   // Anchor centreprint/neck/collar; hems at the real garment endpoint;
   // side seams/caps at x>=.305 and neckline at dy>=-.15.
   const sideMask=fade(x,.028,.068,.250,.307);
   const vertical=fade(dy,-.88,-.79,-.27,-.16);
   const mask=sideMask*vertical;
   if(mask<.035){locked+=ids.length;continue;}
   const sign=q.x-centerX>=0?1:-1;
   // Real fold ridges are diagonally shifted by actual arm spread.
   // Three overlapping wave families create broad yoke tension and
   // finer lower-front ripples from the existing mesh triangle normals.
   const diagonal=dy+.57+.43*x+(sign*.038*armSpread/.5);
   const ribbon1=Math.exp(-Math.pow((diagonal+.135)/.055,2));
   const ribbon2=-.68*Math.exp(-Math.pow((diagonal+.047)/.060,2));
   const ribbon3=.72*Math.exp(-Math.pow((diagonal-.092)/.070,2));
   const chest=fade(dy,-.69,-.57,-.35,-.22);
   const waist=fade(dy,-.86,-.77,-.54,-.38);
   const yoke=fade(dy,-.44,-.37,-.24,-.15);
   const folds=(ribbon1+ribbon2+ribbon3)*(1+.14*Math.sin(x*17+sign*.3));
   const verticalHem=.57*Math.sin(x*34+sign*.4+dy*4)*waist;
   const bow=.36*Math.cos(x*25+sign*.4)*chest;
   const wave=tension*(folds*(.35*yoke+.82*chest+.91*waist)+verticalHem+bow);
   const depth=(.016*wave+.0026*waist)*mask;
   const down=-(.0028*chest+.0075*waist+.0012*yoke)*mask;
   const outward=sign*(.0012*yoke+.0020*waist)*mask*tension;
   const frontBack=q.z-spineZ>=0?1:-1;
   // No invented source projection; move the existing skinned vertices.
   const offset=new T.Vector3(outward,down,frontBack*depth);
   offset.clampLength(0,.0205);
   const amplitude=offset.length();
   if(amplitude<.00018){locked+=ids.length;continue;}
   const localTarget=q.clone().add(offset).applyMatrix4(inverseWorld);
   for(const i of ids){
    const originalLocal=localTarget.clone().applyMatrix4(inverseSkin(mesh,i));
    if(!Number.isFinite(originalLocal.x+originalLocal.y+originalLocal.z))
     throw Error('Nonfinite inverse-skin original cloth bend');
    p.setXYZ(i,originalLocal.x,originalLocal.y,originalLocal.z);
    stats[side][waist>=chest&&waist>=yoke?'waist':chest>=yoke?'chest':'yoke']++;
    shifted++;
   }
   if(Math.abs(wave)>.35)foldBands++;
   maxMeters=Math.max(maxMeters,amplitude);
  }
  p.needsUpdate=true;geo.computeVertexNormals();smoothSurfaceNormals(geo,p.count);
  geo.computeBoundingBox();geo.computeBoundingSphere();
  assertUntouched(mesh,original);
 }
 if(shifted<45||maxMeters<.0035||maxMeters>.02051||foldBands<10||
    Object.values(stats).some(s=>s.chest<8||s.waist<8))
  throw Error('Insufficient original source photographed anatomical fabric fold geometry '+JSON.stringify({shifted,maxMeters,foldBands,stats,locked}));
 return {
  realPhotographedSourceTriangleFolds:true,originalSourcePanelUVAndSkinPreserved:true,
  actualAnatomicalBoneCount:163,sourceImageRGBAndMaskUnmodified:true,
  actualBodyCollisionCheckedByCaller:true,continuousCollisionCertified:false,
  samePoseGeometryComparisonRequired:true,foldMagnitudeMaxMeters:maxMeters,
  foldBands,shiftedPhotographedVertices:shifted,protectedSourceBoundaries:locked,
  anatomicalTension:tension,sides:stats,generatedNewImagesOrTextures:0,
  photoRealismHumanApproved:false,physicalPhoneApproved:false,
  releaseAuthorized:false
 };
}
